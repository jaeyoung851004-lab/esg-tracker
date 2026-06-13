"""
Section 2.2 — 인텔리전스 가공 파이프라인

변경 이력:
- OpenAI 의존 제거: OPENAI_API_KEY 없이도 키워드 기반 태깅 완전 가동
- DeepL 번역 추가: 영문 제목 → 한국어 실시간 번역 후 태깅 정밀도 향상
- reprocess_all(): 기존 잘못 태깅된 ESG/기타 행 전량 재가공
- 완전 백그라운드 스레드 실행 — FastAPI 워커 자원 0% 간섭
"""
from __future__ import annotations

import json
import logging
import os
import time
from datetime import UTC, datetime

from sqlalchemy import delete
from sqlalchemy.orm import Session

from .intelligence_db import RawArticle, TaggedArticle, _engine
from .tagging_filter import (
    filter_raw_articles,
    infer_regulation_tag,
    infer_stakeholder_tag,
    passes_keyword_filter,
    passes_noise_filter,
)

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)

# ── 환경 변수 ───────────────────────────────────────────────────────────────
DEEPL_API_KEY = os.getenv("DEEPL_API_KEY", "ee7052c5-3292-48b3-81ab-c63494de6c55:fx")
DEEPL_API_URL = "https://api-free.deepl.com/v2/translate"
PIPELINE_BATCH = int(os.getenv("PIPELINE_BATCH", "50"))

# DeepL 호출 실패 시 비활성화 플래그 (프로세스 수명 동안 유지)
_DEEPL_DISABLED = False
_TRANSLATION_CACHE: dict[str, str] = {}


# ── DeepL 번역 ───────────────────────────────────────────────────────────────
def translate_to_ko(text: str) -> str:
    """
    영문 텍스트를 한국어로 번역한다.
    - 이미 한국어거나 빈 문자열이면 원문 반환
    - DeepL 실패 시 원문 반환 (파이프라인을 중단하지 않음)
    """
    global _DEEPL_DISABLED

    if not text or not text.strip():
        return text

    # 한글이 이미 포함되어 있으면 번역 불필요
    import re
    if re.search(r"[가-힣]", text):
        return text

    if _DEEPL_DISABLED:
        return text

    if text in _TRANSLATION_CACHE:
        return _TRANSLATION_CACHE[text]

    try:
        import requests as _req
        resp = _req.post(
            DEEPL_API_URL,
            headers={"Authorization": f"DeepL-Auth-Key {DEEPL_API_KEY}"},
            data={"text": text[:500], "target_lang": "KO"},
            timeout=10,
        )
        if resp.status_code in (403, 456):
            logger.warning("[DeepL] 인증 실패(%d) — 번역 비활성화", resp.status_code)
            _DEEPL_DISABLED = True
            return text
        resp.raise_for_status()
        translated = resp.json().get("translations", [{}])[0].get("text", "").strip()
        if translated:
            _TRANSLATION_CACHE[text] = translated
            return translated
    except Exception as exc:
        logger.debug("[DeepL] 번역 실패: %s", exc)
    return text


# ── ai_summary 생성 (OpenAI 없이) ───────────────────────────────────────────
_REGULATION_DESC: dict[str, str] = {
    "PPWR":        "포장재 규정(PPWR) — 재활용·순환경제",
    "CSDDD":       "공급망 실사(CSDDD) — 인권·공급망 리스크",
    "CSRD":        "지속가능성 보고(CSRD) — ESG 공시·투명성",
    "CBAM":        "탄소국경조정(CBAM) — 탄소 가격·배출권",
    "Battery Reg": "EU 배터리 규정 — 디지털 여권·공급망",
}
_STAKEHOLDER_ACTION: dict[str, str] = {
    "경쟁사":   "기업 선제 대응 움직임 포착",
    "평가기관": "평가·인증 기준 변화 감지",
    "정부당국": "규제 입법·정책 변화 포착",
    "기관투자자": "투자자 압박·자금흐름 변화 감지",
    "시민단체": "시민사회 캠페인·압력 포착",
}

def build_ai_summary(title_ko: str, regulation_tag: str, stakeholder_tag: str, source_name: str) -> str:
    reg_desc = _REGULATION_DESC.get(regulation_tag, regulation_tag)
    action = _STAKEHOLDER_ACTION.get(stakeholder_tag, "시그널 포착")
    return (
        f"[시그널 동향] {reg_desc} 관련 {action}\n"
        f"• 원문: {title_ko[:120]}\n"
        f"• 출처: {source_name or '미확인'}"
    )


# ── 단건 처리 ────────────────────────────────────────────────────────────────
def _process_one(row: RawArticle, session: Session) -> bool:
    """
    RawArticle 1건을 태깅하여 TaggedArticle로 저장한다.
    이미 처리된 행(is_processed=True인 TaggedArticle 존재)은 건너뛴다.
    """
    title_en = row.title or ""
    excerpt_en = row.excerpt or ""

    # 노이즈(주식·투자) 기사 배제
    if not passes_noise_filter(title_en, excerpt_en):
        return False

    # 키워드 필터 통과 여부 확인
    if not passes_keyword_filter(title_en, excerpt_en):
        return False

    # DeepL 번역
    title_ko = translate_to_ko(title_en)
    excerpt_ko = translate_to_ko(excerpt_en[:300]) if excerpt_en else ""

    # 규제·이해관계자 태그 추론 (영문 + 한글 합산)
    combined = f"{title_en} {excerpt_en} {title_ko} {excerpt_ko}"
    regulation_tag = infer_regulation_tag(combined, "")
    stakeholder_tag = infer_stakeholder_tag(combined, "")

    ai_summary = build_ai_summary(title_ko, regulation_tag, stakeholder_tag, row.source_name or "")

    tagged = TaggedArticle(
        article_id=row.id,
        regulation_tag=regulation_tag,
        stakeholder_tag=stakeholder_tag,
        ai_summary=ai_summary,
        news_timeline=json.dumps({"phase": "시행 중"}, ensure_ascii=False),
        is_processed=True,
    )
    session.add(tagged)
    return True


# ── 배치 처리 ────────────────────────────────────────────────────────────────
def process_batch(batch_size: int = PIPELINE_BATCH) -> int:
    """
    아직 tagged_articles가 없는 raw_articles를 batch_size 단위로 처리한다.
    반환값: 이번 배치에서 처리한 건수
    """
    processed = 0
    with Session(_engine) as session:
        already_tagged_ids = session.query(TaggedArticle.article_id).distinct().subquery()
        candidates = (
            session.query(RawArticle)
            .filter(RawArticle.id.not_in(already_tagged_ids))
            .order_by(RawArticle.created_at.desc())
            .limit(batch_size * 3)
            .all()
        )

        for row in candidates:
            try:
                ok = _process_one(row, session)
                if ok:
                    processed += 1
                    if processed >= batch_size:
                        break
            except Exception:
                logger.exception("[pipeline] 단건 처리 실패 id=%d", row.id)
            time.sleep(0.05)  # DeepL rate-limit 여유

        session.commit()

    logger.info("[pipeline] process_batch 완료 — %d건", processed)
    return processed


# ── 전량 재가공 (Re-process All) ─────────────────────────────────────────────
def reprocess_all(chunk_size: int = 100) -> int:
    """
    기존 tagged_articles를 전량 삭제하고 raw_articles 1,389건을
    개선된 키워드 파이프라인으로 처음부터 재가공한다.

    FastAPI 워커 쓰레드와 완전 분리된 백그라운드 쓰레드에서만 호출해야 한다.
    """
    logger.info("[reprocess_all] 시작 — 기존 tagged_articles 전량 삭제 후 재태깅")

    # 1. 기존 tagged_articles 전량 삭제
    with Session(_engine) as session:
        deleted = session.execute(delete(TaggedArticle)).rowcount
        session.commit()
    logger.info("[reprocess_all] tagged_articles %d건 삭제 완료", deleted)

    # 2. raw_articles 전량 조회
    with Session(_engine) as session:
        all_rows = session.query(RawArticle).order_by(RawArticle.created_at.desc()).all()
    total = len(all_rows)
    logger.info("[reprocess_all] raw_articles %d건 재처리 시작", total)

    saved = 0
    for i in range(0, total, chunk_size):
        chunk = all_rows[i : i + chunk_size]
        with Session(_engine) as session:
            for row in chunk:
                try:
                    ok = _process_one(row, session)
                    if ok:
                        saved += 1
                except Exception:
                    logger.exception("[reprocess_all] id=%d 처리 실패", row.id)
                time.sleep(0.05)
            session.commit()
        logger.info(
            "[reprocess_all] 진행 %d/%d (저장 %d건)",
            min(i + chunk_size, total), total, saved,
        )

    logger.info("[reprocess_all] 완료 — 총 %d건 태깅 저장", saved)
    return saved


# ── 엔트리포인트 ─────────────────────────────────────────────────────────────
def run_pipeline(batch_size: int = PIPELINE_BATCH) -> None:
    logger.info("=== intelligence_pipeline 시작 (batch=%d) ===", batch_size)
    total = 0
    while True:
        count = process_batch(batch_size)
        total += count
        if count == 0:
            break
    logger.info("=== pipeline 종료 — 총 %d건 처리 ===", total)


if __name__ == "__main__":
    reprocess_all()
