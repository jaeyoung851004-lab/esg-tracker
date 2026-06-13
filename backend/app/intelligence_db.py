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
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    create_engine,
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
    title = Column(String(512))
    excerpt = Column(Text)
    lang = Column(String(16))
    source_name = Column(String(256))
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

    article = relationship("RawArticle", back_populates="tagged")


_Base.metadata.create_all(_engine)


def _compute_url_hash(url: str) -> str:
    return hashlib.sha256(url.encode("utf-8")).hexdigest()[:64]


def upsert_raw_article(article: dict) -> None:
    """
    raw_articles에 중복 없이 적재한다.
    SQLite INSERT OR IGNORE 를 사용하여 멀티스레드 race condition을 안전하게 처리한다.
    실패해도 기존 크롤링 흐름을 방해하지 않는다.
    """
    from sqlalchemy.dialects.sqlite import insert as sqlite_insert

    url: str = article.get("url", "")
    if not url:
        return
    url_hash = _compute_url_hash(url)
    try:
        with _engine.begin() as conn:
            stmt = (
                sqlite_insert(RawArticle.__table__)
                .values(
                    url_hash=url_hash,
                    title=article.get("title", ""),
                    excerpt=article.get("summary", ""),
                    lang="en",
                    source_name=article.get("source", ""),
                    created_at=datetime.now(UTC),
                )
                .on_conflict_do_nothing(index_elements=["url_hash"])
            )
            conn.execute(stmt)
    except Exception:
        logger.exception("intelligence_db: raw_article upsert failed for url_hash=%s", url_hash)
