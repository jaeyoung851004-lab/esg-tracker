import {
  REGULATION_BY_ID,
  NEWS_ENABLED_REGULATIONS,
  COMMON_NEWS_REGIONS,
  RegulationId,
  ImpactRegion,
} from "@/data/regulations.master";

export type { RegulationId };

export type NewsItem = {
  titleKo: string;
  originalTitle: string;
  source: string;
  sourceCountryKo: string;
  publishedAt: string;
  url: string;
  regulationId: RegulationId;
  regulationName: string;
  stakeholderType: string;
  reactionType: string;
  countryKo: string;
  relevanceScore: number;
  languageKo?: string;
  translationStatus?: "번역 대기" | "번역 완료";
};

export const REGULATIONS = Object.fromEntries(
  NEWS_ENABLED_REGULATIONS.map((regulation) => [
    regulation.id,
    {
      name: regulation.code,
      queries: regulation.newsQueries,
    },
  ])
) as Record<RegulationId, { name: string; queries: string[] }>;

const NOISE_KEYWORDS = [
  "annual report",
  "sustainability report now available",
  "award",
  "premio",
  "webinar",
  "internship",
  "job",
  "career",
  "stock",
  "share price",
  "earnings",
  "tradingview",
  "sponsored",
  "market analysis",
  "forecast",
  "size trends",
  "insights",
  "investor alert",
  "shareholder alert",
  "class action",
  "merger",
];

type RawRssItem = {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  region: ImpactRegion;
};

function decodeXml(text: string) {
  return text
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", `"`)
    .replaceAll("&#39;", "'")
    .replaceAll("<![CDATA[", "")
    .replaceAll("]]>", "");
}

function getTagValue(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return decodeXml(match?.[1]?.trim() || "");
}

function getSourceValue(xml: string) {
  const match = xml.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
  return decodeXml(match?.[1]?.trim() || "");
}

function cleanTitle(title: string): string {
  return title.replace(/ - [^-]+$/, "").trim();
}

function getRegionsForRegulation(regulationId: RegulationId): ImpactRegion[] {
  const regulation = REGULATION_BY_ID[regulationId];

  const merged = [
    ...COMMON_NEWS_REGIONS,
    ...(regulation?.impactRegions || []),
  ];

  return Array.from(new Map(merged.map((region) => [region.ceid, region])).values());
}

async function fetchGoogleNewsRss(
  query: string,
  region: ImpactRegion
): Promise<RawRssItem[]> {
  const encodedQuery = encodeURIComponent(`${query} when:30d`);
  const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=${region.hl}&gl=${region.gl}&ceid=${region.ceid}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Google News RSS failed: ${response.status}`);
  }

  const xml = await response.text();
  const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];

  return itemBlocks.map((itemXml) => ({
    title: getTagValue(itemXml, "title"),
    link: getTagValue(itemXml, "link"),
    pubDate: getTagValue(itemXml, "pubDate"),
    source: getSourceValue(itemXml),
    region,
  }));
}

function isNoiseNews(text: string): boolean {
  const lower = text.toLowerCase();
  return NOISE_KEYWORDS.some((keyword) => lower.includes(keyword));
}

function isFalsePositive(regulationId: RegulationId, text: string): boolean {
  const regulation = REGULATION_BY_ID[regulationId];
  const lower = text.toLowerCase();

  return regulation.falsePositiveKeywords.some((keyword) =>
    lower.includes(keyword.toLowerCase())
  );
}

function classifyStakeholder(text: string): string {
  const lower = text.toLowerCase();

  if (
    lower.includes("commission") ||
    lower.includes("parliament") ||
    lower.includes("council") ||
    lower.includes("government") ||
    lower.includes("ministry") ||
    lower.includes("sec")
  ) {
    return "정부/규제기관";
  }

  if (
    lower.includes("company") ||
    lower.includes("corporate") ||
    lower.includes("manufacturer") ||
    lower.includes("supplier")
  ) {
    return "기업";
  }

  if (
    lower.includes("investor") ||
    lower.includes("bank") ||
    lower.includes("asset manager") ||
    lower.includes("finance")
  ) {
    return "금융/투자자";
  }

  if (
    lower.includes("law firm") ||
    lower.includes("legal") ||
    lower.includes("lawyer") ||
    lower.includes("llp")
  ) {
    return "로펌";
  }

  if (
    lower.includes("consulting") ||
    lower.includes("deloitte") ||
    lower.includes("pwc") ||
    lower.includes("ey") ||
    lower.includes("kpmg") ||
    lower.includes("anthesis")
  ) {
    return "컨설팅/회계법인";
  }

  if (
    lower.includes("ngo") ||
    lower.includes("civil society") ||
    lower.includes("campaign")
  ) {
    return "NGO/시민사회";
  }

  if (
    lower.includes("association") ||
    lower.includes("industry group") ||
    lower.includes("trade body")
  ) {
    return "산업협회";
  }

  return "언론/시장";
}

function classifyReactionType(text: string): string {
  const lower = text.toLowerCase();

  if (
    lower.includes("delay") ||
    lower.includes("postpone") ||
    lower.includes("extension")
  ) return "시행 지연 요구";

  if (
    lower.includes("cost") ||
    lower.includes("burden") ||
    lower.includes("expensive")
  ) return "비용 부담";

  if (
    lower.includes("supply chain") ||
    lower.includes("supplier") ||
    lower.includes("exporter")
  ) return "공급망 영향";

  if (
    lower.includes("legal") ||
    lower.includes("guidance") ||
    lower.includes("interpretation")
  ) return "법률 해석";

  if (
    lower.includes("investor") ||
    lower.includes("risk") ||
    lower.includes("finance")
  ) return "투자 리스크";

  if (
    lower.includes("comply") ||
    lower.includes("compliance") ||
    lower.includes("prepare") ||
    lower.includes("response")
  ) return "기업 대응";

  if (
    lower.includes("rule") ||
    lower.includes("regulation") ||
    lower.includes("directive") ||
    lower.includes("law")
  ) return "규제 변화";

  return "시장 동향";
}

function detectCountryKo(text: string, fallbackCountryKo: string): string {
  const lower = text.toLowerCase();

  if (lower.includes("korea") || lower.includes("south korea") || lower.includes("한국")) return "한국";
  if (lower.includes("japan") || lower.includes("日本")) return "일본";
  if (lower.includes("china") || lower.includes("中国")) return "중국";
  if (lower.includes("united states") || lower.includes(" u.s.") || lower.includes(" us ")) return "미국";
  if (lower.includes("united kingdom") || lower.includes(" uk ")) return "영국";
  if (lower.includes("germany") || lower.includes("deutschland")) return "독일";
  if (lower.includes("france")) return "프랑스";
  if (lower.includes("netherlands") || lower.includes("nederland")) return "네덜란드";
  if (lower.includes("italy") || lower.includes("italia")) return "이탈리아";
  if (lower.includes("spain") || lower.includes("españa")) return "스페인";
  if (lower.includes("poland") || lower.includes("polska")) return "폴란드";
  if (lower.includes("turkey") || lower.includes("türkiye")) return "튀르키예";
  if (lower.includes("india")) return "인도";
  if (lower.includes("brazil") || lower.includes("brasil")) return "브라질";
  if (lower.includes("indonesia")) return "인도네시아";
  if (lower.includes("malaysia")) return "말레이시아";
  if (lower.includes("vietnam")) return "베트남";
  if (lower.includes("europe") || lower.includes(" eu ")) return "EU/유럽";

  return fallbackCountryKo || "글로벌";
}

function sourceCountryKo(source: string, region: ImpactRegion): string {
  const lower = source.toLowerCase();

  if (lower.includes("reuters")) return "글로벌";
  if (lower.includes("associated press") || lower.includes("ap news")) return "미국";
  if (lower.includes("bloomberg")) return "미국";
  if (lower.includes("financial times")) return "영국";
  if (lower.includes("the guardian")) return "영국";
  if (lower.includes("euractiv")) return "EU/유럽";
  if (lower.includes("politico")) return "미국/EU";
  if (lower.includes("le monde")) return "프랑스";
  if (lower.includes("handelsblatt")) return "독일";
  if (lower.includes("el país")) return "스페인";
  if (lower.includes("rzeczpospolita")) return "폴란드";
  if (lower.includes("korea") || lower.includes("한국")) return "한국";
  if (lower.includes("japan") || lower.includes("日本")) return "일본";
  if (lower.includes("vietnam")) return "베트남";

  return region.countryKo;
}

function calculateRelevanceScore(
  title: string,
  source: string,
  regulationId: RegulationId
): number {
  const regulation = REGULATION_BY_ID[regulationId];
  const text = `${title} ${source}`.toLowerCase();

  let score = 0;

  if (text.includes(regulation.code.toLowerCase())) score += 40;
  if (text.includes(regulation.nameEn.toLowerCase())) score += 60;
  if (text.includes(regulation.nameKo.toLowerCase())) score += 60;

  for (const alias of regulation.aliases) {
    if (text.includes(alias.toLowerCase())) score += 25;
  }

  for (const query of regulation.newsQueries) {
    const cleaned = query.replaceAll('"', "").toLowerCase();
    const parts = cleaned.split(/\s+/);

    for (const part of parts) {
      if (part.length > 3 && text.includes(part)) score += 4;
    }
  }

  if (isNoiseNews(text)) score -= 100;
  if (isFalsePositive(regulationId, text)) score -= 200;

  return score;
}

function getPublishedTime(item: NewsItem): number {
  const time = Date.parse(item.publishedAt || "");
  return Number.isFinite(time) ? time : 0;
}

function sortNewsByDateDesc(news: NewsItem[]) {
  return [...news].sort((a, b) => {
    const dateDiff = getPublishedTime(b) - getPublishedTime(a);
    if (dateDiff !== 0) return dateDiff;

    return (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0);
  });
}

export async function fetchGoogleNewsForRegulation(
  regulationId: RegulationId,
  limit = 10
): Promise<NewsItem[]> {
  const regulation = REGULATION_BY_ID[regulationId];

  if (!regulation) return [];

  const results: NewsItem[] = [];
  const regions = getRegionsForRegulation(regulationId);

  for (const region of regions) {
    for (const query of regulation.newsQueries.slice(0, 5)) {
      try {
        const items = await fetchGoogleNewsRss(query, region);

        for (const item of items) {
          const originalTitle = cleanTitle(item.title);
          const source = item.source || "Unknown";
          const combinedText = `${originalTitle} ${source}`;

          if (!originalTitle) continue;
          if (isNoiseNews(combinedText)) continue;
          if (isFalsePositive(regulationId, combinedText)) continue;

          const relevanceScore = calculateRelevanceScore(
            originalTitle,
            source,
            regulationId
          );

          if (relevanceScore < 15) continue;

          results.push({
            titleKo: originalTitle,
            originalTitle,
            source,
            sourceCountryKo: sourceCountryKo(source, item.region),
            publishedAt: item.pubDate || "",
            url: item.link || "",
            regulationId,
            regulationName: regulation.code,
            stakeholderType: classifyStakeholder(combinedText),
            reactionType: classifyReactionType(combinedText),
            countryKo: detectCountryKo(combinedText, item.region.countryKo),
            relevanceScore,
            languageKo: item.region.languageKo,
            translationStatus: "번역 대기",
          });
        }
      } catch (error) {
        console.error(`Google News fetch failed for ${regulationId}`, error);
      }
    }
  }

  const deduped = Array.from(
    new Map(
      results.map((item) => [
        `${item.originalTitle.toLowerCase()}-${item.source.toLowerCase()}`,
        item,
      ])
    ).values()
  );

  return sortNewsByDateDesc(deduped).slice(0, limit);
}

export async function fetchAllRegulationNews(limit = 10) {
  const sections = await Promise.all(
    NEWS_ENABLED_REGULATIONS.map(async (regulation) => {
      const news = await fetchGoogleNewsForRegulation(regulation.id, limit);

      return {
        regulationId: regulation.id,
        regulationName: regulation.code,
        count: news.length,
        news,
      };
    })
  );

  return sections;
}
