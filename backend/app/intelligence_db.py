"""
Intelligence database — new tables for raw_articles and tagged_articles.
Existing tables and code are untouched; this module is additive only.
"""
from __future__ import annotations

import hashlib
import logging
from datetime import UTC, datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    create_engine,
    text,
)
from sqlalchemy.orm import DeclarativeBase, Session, relationship

logger = logging.getLogger(__name__)

DATABASE_URL = "sqlite:///./intelligence.db"
_engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


class _Base(DeclarativeBase):
    pass


class RawArticle(_Base):
    __tablename__ = "raw_articles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    url_hash = Column(String(64), nullable=False, unique=True)
    original_url = Column(String(2048), nullable=True)
    title = Column(String(512))
    excerpt = Column(Text)
    lang = Column(String(16))
    source_name = Column(String(256))
    article_type = Column(String(16), nullable=False, server_default="NEWS")
    retained_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

    tagged = relationship("TaggedArticle", back_populates="article")

    __table_args__ = (Index("ix_raw_articles_url_hash", "url_hash"),)


class TaggedArticle(_Base):
    __tablename__ = "tagged_articles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    article_id = Column(Integer, ForeignKey("raw_articles.id"), nullable=False)
    regulation_tag = Column(String(128))   # 세로축 규제 tag
    stakeholder_tag = Column(String(128))  # 가로축 이해관계자 tag
    ai_summary = Column(Text)
    news_timeline = Column(Text)           # JSON 직렬화 문자열로 저장
    is_processed = Column(Boolean, default=False)
    tagging_confidence = Column(Float, nullable=False, server_default="0.6")

    article = relationship("RawArticle", back_populates="tagged")


_Base.metadata.create_all(_engine)


def _run_migrations() -> None:
    """기존 SQLite DB에 신규 컬럼 추가 (SQLAlchemy create_all은 기존 테이블 미변경)."""
    migrations = [
        "ALTER TABLE raw_articles ADD COLUMN article_type VARCHAR(16) NOT NULL DEFAULT 'NEWS'",
        "ALTER TABLE raw_articles ADD COLUMN retained_until DATETIME",
        "ALTER TABLE tagged_articles ADD COLUMN tagging_confidence REAL NOT NULL DEFAULT 0.6",
        "ALTER TABLE raw_articles ADD COLUMN original_url VARCHAR(2048)",
    ]
    with _engine.begin() as conn:
        for stmt in migrations:
            try:
                conn.execute(text(stmt))
            except Exception:
                pass  # 컬럼 이미 존재


_run_migrations()


def _compute_url_hash(url: str) -> str:
    return hashlib.sha256(url.encode("utf-8")).hexdigest()[:64]


_RETENTION_DAYS: dict[str, int] = {
    "NEWS":   30,
    "REPORT": 60,
    "MARKET": 60,
    "EXPERT": 60,
}


def upsert_raw_article(article: dict) -> None:
    """
    raw_articles에 중복 없이 적재한다.
    article_type(NEWS/REPORT/MARKET/EXPERT)에 따라 retained_until 자동 계산.
    SQLite INSERT OR IGNORE 를 사용하여 멀티스레드 race condition을 안전하게 처리한다.
    """
    from datetime import timedelta
    from sqlalchemy.dialects.sqlite import insert as sqlite_insert

    url: str = article.get("url", "")
    if not url:
        return
    url_hash = _compute_url_hash(url)
    article_type = article.get("article_type", "NEWS").upper()
    retention_days = _RETENTION_DAYS.get(article_type, 30)
    retained_until = datetime.now(UTC) + timedelta(days=retention_days)

    try:
        with _engine.begin() as conn:
            stmt = (
                sqlite_insert(RawArticle.__table__)
                .values(
                    url_hash=url_hash,
                    original_url=url,
                    title=article.get("title", ""),
                    excerpt=article.get("summary", ""),
                    lang="en",
                    source_name=article.get("source", ""),
                    article_type=article_type,
                    retained_until=retained_until,
                    created_at=datetime.now(UTC),
                )
                .on_conflict_do_nothing(index_elements=["url_hash"])
            )
            conn.execute(stmt)
    except Exception:
        logger.exception("intelligence_db: raw_article upsert failed for url_hash=%s", url_hash)


def purge_expired_articles() -> int:
    """
    retained_until 기한이 지난 raw_articles와 연관 tagged_articles를 삭제한다.
    NEWS: 30일, REPORT/MARKET/EXPERT: 60일 보존.
    """
    now = datetime.now(UTC)
    with Session(_engine) as session:
        expired_ids = [
            r[0]
            for r in session.query(RawArticle.id)
            .filter(RawArticle.retained_until.isnot(None), RawArticle.retained_until < now)
            .all()
        ]
        if not expired_ids:
            return 0
        session.query(TaggedArticle).filter(
            TaggedArticle.article_id.in_(expired_ids)
        ).delete(synchronize_session=False)
        session.query(RawArticle).filter(
            RawArticle.id.in_(expired_ids)
        ).delete(synchronize_session=False)
        session.commit()
    logger.info("intelligence_db: purge_expired_articles — %d건 삭제", len(expired_ids))
    return len(expired_ids)
