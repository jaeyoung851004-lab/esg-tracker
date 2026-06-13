"""
One-time retagging utility for intelligence.db.

Manual use only:
    cd backend
    .\\.venv\\Scripts\\python.exe retagging_script.py --dry-run
    .\\.venv\\Scripts\\python.exe retagging_script.py --apply

The script re-evaluates every tagged_articles row with the current
tagging_filter rules. Rows without a valid regulation or stakeholder signal are
updated to "unclassified" so matrix statistics can exclude them.
"""
from __future__ import annotations

import argparse

from app.intelligence_db import RawArticle, TaggedArticle, _engine
from app.tagging_filter import (
    check_regulation_context,
    infer_regulation_tag,
    infer_stakeholder_tag,
)
from sqlalchemy.orm import Session


def retag_all(apply: bool = False) -> dict[str, int]:
    stats = {
        "checked": 0,
        "changed": 0,
        "unclassified": 0,
        "csrd_without_context": 0,
    }

    with Session(_engine) as session:
        rows = (
            session.query(TaggedArticle, RawArticle)
            .join(RawArticle, RawArticle.id == TaggedArticle.article_id)
            .order_by(TaggedArticle.id.asc())
            .all()
        )

        for tagged, raw in rows:
            stats["checked"] += 1
            title = raw.title or ""
            excerpt = raw.excerpt or ""
            combined = f"{title} {excerpt}"

            new_regulation = infer_regulation_tag(combined, "")
            new_stakeholder = infer_stakeholder_tag(combined, "")

            if (
                tagged.regulation_tag == "CSRD"
                and not check_regulation_context(combined, "CSRD")
            ):
                stats["csrd_without_context"] += 1
                new_regulation = "unclassified"

            if new_regulation == "unclassified" or new_stakeholder == "unclassified":
                stats["unclassified"] += 1

            if (
                tagged.regulation_tag != new_regulation
                or tagged.stakeholder_tag != new_stakeholder
            ):
                stats["changed"] += 1
                if apply:
                    tagged.regulation_tag = new_regulation
                    tagged.stakeholder_tag = new_stakeholder

        if apply:
            session.commit()
        else:
            session.rollback()

    return stats


def main() -> int:
    parser = argparse.ArgumentParser(description="Retag intelligence tagged_articles once.")
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--dry-run", action="store_true", help="Print impact without updating DB.")
    mode.add_argument("--apply", action="store_true", help="Update tagged_articles in DB.")
    args = parser.parse_args()

    stats = retag_all(apply=args.apply)
    mode_label = "APPLY" if args.apply else "DRY-RUN"
    print(f"[retagging_script] mode={mode_label}")
    for key, value in stats.items():
        print(f"[retagging_script] {key}={value}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
