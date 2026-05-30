import json
from functools import lru_cache
from pathlib import Path
from typing import Any

ROOT_DIR = Path(__file__).resolve().parents[2]
DATA_FILE = ROOT_DIR / "data" / "regulations.json"

@lru_cache(maxsize=1)
def load_regulations() -> list[dict[str, Any]]:
    with DATA_FILE.open(encoding="utf-8") as file:
        return json.load(file)

NEWS_ITEMS: list[dict[str, str]] = [
    {"id": "reuters-csrd-csddd", "source": "Reuters", "title": "EU Omnibus proposal to simplify CSRD and CSDDD published", "age": "2일 전", "url": "https://www.reuters.com/"},
    {"id": "bloomberg-ifrs-s2", "source": "Bloomberg", "title": "ISSB unveils new sustainability disclosure standard (IFRS S2)", "age": "3일 전", "url": "https://www.bloomberg.com/"},
    {"id": "ft-sec-climate", "source": "Financial Times", "title": "SEC delays climate disclosure rule implementation", "age": "5일 전", "url": "https://www.ft.com/"},
    {"id": "euractiv-espr", "source": "Euractiv", "title": "ESPR delegated acts for textiles expected in 2026", "age": "1주 전", "url": "https://www.euractiv.com/"},
    {"id": "guardian-cbam", "source": "The Guardian", "title": "EU adopts Carbon Border Adjustment Mechanism (CBAM) phase-in rules", "age": "1주 전", "url": "https://www.theguardian.com/"},
]
