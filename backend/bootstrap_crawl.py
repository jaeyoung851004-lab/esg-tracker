"""
1회성 강제 크롤링 부트스트랩 스크립트.
기존 news.py RSS 수집 로직을 직접 호출하여
raw_articles 테이블에 데이터를 적재한다.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.data import load_regulations
from app.news import fetch_articles_by_query, _get_search_queries
from app.intelligence_db import upsert_raw_article, RawArticle, _engine
from sqlalchemy.orm import Session

def main():
    regulations = load_regulations()
    print(f"규제 수: {len(regulations)}")

    all_queries = []
    for reg in regulations:
        all_queries.extend(_get_search_queries(reg))

    # 중복 제거
    unique_queries = list(dict.fromkeys(q for q in all_queries if q.strip()))
    print(f"총 검색 쿼리 수: {len(unique_queries)}")
    print("RSS 수집 시작 (최대 2분 소요)...")

    articles_by_query = fetch_articles_by_query(unique_queries, lookback_days=30)

    total_fetched = 0
    for articles in articles_by_query.values():
        total_fetched += len(articles)
    print(f"RSS에서 수집된 원문 기사 수: {total_fetched}")

    inserted = 0
    seen_urls = set()
    for articles in articles_by_query.values():
        for article in articles:
            url = article.get("url", "")
            if not url or url in seen_urls:
                continue
            seen_urls.add(url)
            upsert_raw_article(article)
            inserted += 1

    # DB 확인
    with Session(_engine) as session:
        count = session.query(RawArticle).count()

    print(f"\n✅ 적재 완료: {inserted}건 upsert → raw_articles 총 {count}건")
    return count

if __name__ == "__main__":
    count = main()
    sys.exit(0 if count > 0 else 1)
