"""
Section 2.2 — 2차 LLM 인텔리전스 가공 파이프라인 배치 스크립트

실행 방법:
    python -m backend.app.intelligence_pipeline
    # 또는 직접
    python backend/app/intelligence_pipeline.py

환경 변수:
    OPENAI_API_KEY   : OpenAI 키 (필수)
    OPENAI_MODEL     : 사용할 모델 (기본값: gpt-4o-mini)
    PIPELINE_BATCH   : 회당 처리 건수 (기본값: 20)
"""
from __future__ import annotations

import json
import logging
import os
import sys
import textwrap
import time
from datetime import UTC, datetime

# 패키지 외부 직접 실행 지원
if __name__ == "__main__" and __package__ is None:
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
    __package__ = "backend.app"

from sqlalchemy.orm import Session

from .intelligence_db import RawArticle, TaggedArticle, _engine
from .tagging_filter import filter_raw_articles, infer_regulation_tag, infer_stakeholder_tag

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)

OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
PIPELINE_BATCH = int(os.getenv("PIPELINE_BATCH", "20"))

# ── Section 2.2 AI 인텔리전스 가공 프롬프트 템플릿 ─────────────────────────

_SYSTEM_PROMPT = textwrap.dedent("""\
    당신은 글로벌 ESG 규제 전문가이자 대기업 임원 보고서 작성 어시스턴트입니다.
    뉴스 기사를 분석하여 ESG 인텔리전스 매트릭스에 필요한 정형 데이터를 JSON으로 추출합니다.
    반드시 아래 JSON 스키마만 출력하고 다른 텍스트는 포함하지 마세요.
""")

_USER_PROMPT_TEMPLATE = textwrap.dedent("""\
    ## 분석 대상 뉴스
    제목: {title}
    본문(발췌): {excerpt}

    ## 추출 지시
    아래 JSON 형식으로만 응답하세요. 모든 필드는 필수입니다.

    {{
      "regulation_tag": "<PPWR | CSDDD | CSRD | CBAM | Battery Reg | ESG 중 가장 관련성 높은 것 1개>",
      "stakeholder_tag": "<경쟁사 | 평가기관 | 정부당국 | 기관투자자 | 시민단체 | 기타 중 1개>",
      "ai_summary": "<대기업 전략팀 실무자가 바로 보고에 활용할 수 있는 3줄 요약. 각 줄은 '•'로 시작. 한국어로 작성>",
      "news_timeline": {{
        "event_date": "<기사에서 추론 가능한 사건 날짜 또는 null>",
        "deadline": "<규제 시행·제출 마감일 또는 null>",
        "phase": "<입법 준비 | 입법 완료 | 시행 중 | 시행 연기 | 개정 중 | 해당 없음 중 1개>",
        "key_actors": ["<핵심 기관·기업·단체 이름 최대 3개>"]
      }}
    }}
""")


def _call_openai(title: str, excerpt: str) -> dict | None:
    """OpenAI Chat Completions API를 호출해 구조화된 결과를 반환한다."""
    try:
        import openai  # lazy import — 패키지가 없어도 임포트 시 에러 없음
    except ImportError:
        logger.error("openai 패키지가 설치되어 있지 않습니다. pip install openai 후 재실행하세요.")
        return None

    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        logger.error("OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.")
        return None

    client = openai.OpenAI(api_key=api_key)
    prompt = _USER_PROMPT_TEMPLATE.format(
        title=title[:400],
        excerpt=(excerpt or "")[:800],
    )

    try:
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
            max_tokens=600,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content or "{}"
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        logger.warning("LLM 응답 JSON 파싱 실패: %s", exc)
        return None
    except Exception as exc:
        logger.error("OpenAI API 호출 실패: %s", exc)
        return None


def _safe_str(value: object) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    return json.dumps(value, ensure_ascii=False)


def process_batch(batch_size: int = PIPELINE_BATCH) -> int:
    """
    1차 키워드 필터링 → 2차 LLM 가공 → tagged_articles 저장.
    처리 완료된 raw_articles.is_processed 는 TaggedArticle 존재로 추론한다.
    (raw_articles 테이블 스키마에 is_processed 컬럼 없음 → tagged_articles.is_processed 사용)
    반환값: 이번 배치에서 처리한 건수
    """
    processed = 0

    with Session(_engine) as session:
        # 아직 tagged_articles 가 없는 raw_articles 만 가져온다
        already_tagged_ids = session.query(TaggedArticle.article_id).distinct().subquery()
        candidates = (
            session.query(RawArticle)
            .filter(RawArticle.id.not_in(already_tagged_ids))
            .order_by(RawArticle.created_at.desc())
            .limit(batch_size * 5)   # 키워드 필터 여유분 확보
            .all()
        )

    if not candidates:
        logger.info("처리 대상 raw_articles 없음 — 종료")
        return 0

    # 1차 키워드 필터링
    filtered = filter_raw_articles(candidates)
    logger.info("후보 %d건 → 키워드 필터 통과 %d건", len(candidates), len(filtered))

    for row in filtered[:batch_size]:
        title = row.title or ""
        excerpt = row.excerpt or ""

        logger.info("처리 중 [id=%d] %s", row.id, title[:60])

        # 2차 LLM 가공
        result = _call_openai(title, excerpt)

        # LLM 실패 시 키워드 추론으로 폴백
        if result is None:
            result = {
                "regulation_tag": infer_regulation_tag(title, excerpt),
                "stakeholder_tag": infer_stakeholder_tag(title, excerpt),
                "ai_summary": "",
                "news_timeline": {},
            }
            logger.warning("LLM 폴백(키워드 추론) 적용 [id=%d]", row.id)

        timeline_raw = result.get("news_timeline", {})
        timeline_str = (
            timeline_raw
            if isinstance(timeline_raw, str)
            else json.dumps(timeline_raw, ensure_ascii=False)
        )

        tagged = TaggedArticle(
            article_id=row.id,
            regulation_tag=_safe_str(result.get("regulation_tag")),
            stakeholder_tag=_safe_str(result.get("stakeholder_tag")),
            ai_summary=_safe_str(result.get("ai_summary")),
            news_timeline=timeline_str,
            is_processed=True,
        )

        with Session(_engine) as session:
            session.add(tagged)
            session.commit()

        processed += 1
        time.sleep(0.3)  # OpenAI rate-limit 여유

    logger.info("배치 완료 — %d건 처리됨 (%s)", processed, datetime.now(UTC).isoformat())
    return processed


def run_pipeline(batch_size: int = PIPELINE_BATCH) -> None:
    """엔트리포인트 — 미처리 건이 없어질 때까지 배치를 반복한다."""
    logger.info("=== intelligence_pipeline 시작 (model=%s, batch=%d) ===", OPENAI_MODEL, batch_size)
    total = 0
    while True:
        count = process_batch(batch_size)
        total += count
        if count == 0:
            break
    logger.info("=== pipeline 종료 — 총 %d건 처리 ===", total)


if __name__ == "__main__":
    run_pipeline()
