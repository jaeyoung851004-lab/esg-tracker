/**
 * googleNews.ts
 * targetRegions 기반으로 Google News RSS 다중 호출
 * Next.js API Route / Server Component 양쪽에서 사용 가능
 */
import type { GoogleLocale } from "./impactMapper";

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  sourceKo: string;
  country: string;
  locale: string;
  url: string;
  date: string;
  age: string;
  summary: string;
  newsType: "규제 변화" | "기업 대응" | "산업 반응" | "시장 동향";
  sourceType: "공식" | "로펌" | "NGO" | "언론" | "산업";
}

// ── 출처 한국어 매핑 ────────────────────────────────
const PUBLISHER_KO: Record<string, string> = {
  "reuters": "로이터",
  "financial times": "파이낸셜타임스(FT)",
  "bloomberg": "블룸버그",
  "wall street journal": "월스트리트저널",
  "euractiv": "유로액티브",
  "carbon brief": "카본브리프",
  "esg today": "ESG투데이",
  "esg news": "ESG뉴스",
  "responsible investor": "리스폰서블 인베스터",
  "businessgreen": "비즈니스그린",
  "packaging europe": "패키징 유럽",
  "packaging dive": "패키징 다이브",
  "trellis": "트렐리스",
  "european commission": "유럽위원회",
  "council of the eu": "EU 이사회",
  "eur-lex": "EU 관보(EUR-Lex)",
  "european parliament": "유럽의회",
  "efrag": "EFRAG",
  "deloitte": "딜로이트",
  "kpmg": "KPMG",
  "pwc": "PwC",
  "ey": "EY",
  "latham": "레이섬앤왓킨스",
  "white & case": "화이트앤케이스",
  "jd supra": "JD수프라",
  "lexology": "렉솔로지",
  "wwf": "WWF",
  "greenpeace": "그린피스",
  "cdp": "CDP",
  "handelsblatt": "한델스블라트",
  "les echos": "레제코",
  "nikkei": "닛케이",
  "korea herald": "코리아헤럴드",
  "korea times": "코리아타임스",
};

const SOURCE_TYPE_RULES: Record<string, string[]> = {
  "공식": ["european commission","council of the eu","eur-lex","european parliament","efrag","official journal"],
  "로펌": ["latham","white & case","dla piper","clifford chance","baker mckenzie","jd supra","lexology","linklaters"],
  "NGO":  ["wwf","greenpeace","zero waste","cdp","somo"],
  "언론": ["reuters","bloomberg","financial times","euractiv","carbon brief","businessgreen","esg today","esg news","trellis","handelsblatt","les echos","nikkei"],
};

const NEWS_TYPE_KEYWORDS: Record<string, string[]> = {
  "규제 변화": ["regulation","directive","legislation","adopted","published","amendment","omnibus","postponed","delayed","withdrawn","proposal","entry into force","delegated act"],
  "기업 대응": ["company","corporate","manufacturer","invest","comply","compliance","implement","strategy","report","disclose","supply chain","prepare"],
  "산업 반응": ["industry","sector","association","lobby","push back","concern","burden","cost","opposition","trade","federation","oppose","warns"],
  "시장 동향": ["market","technology","solution","platform","startup","innovation","data","digital","traceability","dpp","esg rating","investment"],
};

const CUTOFF_DAYS = 60;

// ── 헬퍼 ─────────────────────────────────────────────
function getPublisherKo(raw: string): string {
  const rl = raw.toLowerCase();
  for (const [k, v] of Object.entries(PUBLISHER_KO)) {
    if (rl.includes(k)) return v;
  }
  return raw.slice(0, 30);
}

function getSourceType(pub: string): NewsItem["sourceType"] {
  const pl = pub.toLowerCase();
  for (const [type, kws] of Object.entries(SOURCE_TYPE_RULES)) {
    if (kws.some((k) => pl.includes(k))) return type as NewsItem["sourceType"];
  }
  return "산업";
}

function classifyNewsType(title: string, summary: string): NewsItem["newsType"] {
  const text = `${title} ${summary}`.toLowerCase();
  let best: NewsItem["newsType"] = "산업 반응";
  let bestScore = 0;
  for (const [type, kws] of Object.entries(NEWS_TYPE_KEYWORDS)) {
    const score = kws.filter((k) => text.includes(k)).length;
    if (score > bestScore) { bestScore = score; best = type as NewsItem["newsType"]; }
  }
  return best;
}

function parseDate(raw: string): Date {
  try { return new Date(raw); } catch { return new Date(0); }
}

function formatAge(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (diff === 0) return "오늘";
  if (diff === 1) return "1일 전";
  if (diff < 7) return `${diff}일 전`;
  if (diff < 14) return "1주 전";
  if (diff < 21) return "2주 전";
  if (diff < 30) return "3주 전";
  return `${Math.floor(diff / 30)}개월 전`;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50);
}

// ── 실제 수집 ─────────────────────────────────────────
export async function fetchGoogleNews(params: {
  queries: string[];
  targetRegions: GoogleLocale[];
  requiredKeywords: string[];
  excludeKeywords: string[];
  limit?: number;
}): Promise<NewsItem[]> {
  const { queries, targetRegions, requiredKeywords, excludeKeywords, limit = 15 } = params;
  const cutoff = new Date(Date.now() - CUTOFF_DAYS * 86400000);
  const raw: Array<{ title: string; source: string; url: string; date: string; summary: string; locale: string }> = [];

  // 지역 × 쿼리 조합 (최대 쿼리 3개 × 지역 전체)
  const querySlice = queries.slice(0, 3);

  await Promise.allSettled(
    targetRegions.flatMap((locale) =>
      querySlice.map(async (q) => {
        const url =
          `https://news.google.com/rss/search` +
          `?q=${encodeURIComponent(q)}` +
          `&hl=${locale.hl}&gl=${locale.gl}&ceid=${locale.ceid}`;
        try {
          const res = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0" },
            next: { revalidate: 1800 }, // 30분 캐시
          });
          if (!res.ok) return;
          const text = await res.text();

          // 간단한 XML 파싱 (feedparser 없이)
          const items = text.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
          for (const item of items.slice(0, 30)) {
            const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ??
                          item.match(/<title>(.*?)<\/title>/)?.[1] ?? "";
            const link  = item.match(/<link>(.*?)<\/link>/)?.[1] ??
                          item.match(/href="(https?[^"]+)"/)?.[1] ?? "";
            const pub   = item.match(/<source[^>]*>(.*?)<\/source>/)?.[1] ?? "Google News";
            const date  = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? "";
            const desc  = (item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ??
                          item.match(/<description>(.*?)<\/description>/)?.[1] ?? "").slice(0, 300);

            const dt = parseDate(date);
            if (dt < cutoff) continue;

            raw.push({ title: title.split(" - ")[0], source: pub, url: link, date, summary: desc, locale: locale.gl });
          }
        } catch { /* 실패한 지역은 무시 */ }
      })
    )
  );

  // 관련성 필터
  const isRelevant = (item: typeof raw[0]) => {
    const text = `${item.title} ${item.summary}`.toLowerCase();
    if (excludeKeywords.some((k) => text.includes(k.toLowerCase()))) return false;
    if (requiredKeywords.length === 0) return true;
    return requiredKeywords.some((k) => text.includes(k.toLowerCase()));
  };

  let filtered = raw.filter(isRelevant);
  if (filtered.length === 0) filtered = raw; // 필터 완화

  // 중복 제거
  const seen = new Set<string>();
  const uniq = filtered.filter((a) => {
    const key = a.title.toLowerCase().slice(0, 80);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // 최신순 정렬
  uniq.sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());

  // NewsItem 변환
  return uniq.slice(0, limit).map((a) => ({
    id: slugify(a.title),
    title: a.title,
    source: a.source,
    sourceKo: getPublisherKo(a.source),
    country: a.locale,
    locale: a.locale,
    url: a.url,
    date: a.date.slice(0, 10),
    age: formatAge(parseDate(a.date)),
    summary: a.summary,
    newsType: classifyNewsType(a.title, a.summary),
    sourceType: getSourceType(a.source),
  }));
}
