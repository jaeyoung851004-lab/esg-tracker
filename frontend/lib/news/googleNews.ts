export type RegulationId =
  | "csrd"
  | "cbam"
  | "csddd"
  | "espr"
  | "eudr"
  | "ai-act"
  | "issb"
  | "sec-climate"
  | "battery";

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
};

export const REGULATIONS: Record<RegulationId, { name: string; queries: string[] }> = {
  csrd: {
    name: "CSRD",
    queries: [
      `"CSRD"`,
      `"Corporate Sustainability Reporting Directive"`,
      `"CSRD" company response`,
      `"CSRD" audit assurance`,
      `"CSRD" delay`,
    ],
  },
  cbam: {
    name: "CBAM",
    queries: [
      `"CBAM"`,
      `"Carbon Border Adjustment Mechanism"`,
      `"CBAM" exporters`,
      `"CBAM" reporting obligation`,
    ],
  },
  csddd: {
    name: "CSDDD",
    queries: [
      `"CSDDD"`,
      `"Corporate Sustainability Due Diligence Directive"`,
      `"EU due diligence directive"`,
      `"CSDDD" supply chain`,
    ],
  },
  espr: {
    name: "ESPR",
    queries: [
      `"ESPR"`,
      `"Ecodesign for Sustainable Products Regulation"`,
      `"digital product passport"`,
    ],
  },
  eudr: {
    name: "EUDR",
    queries: [
      `"EUDR"`,
      `"EU Deforestation Regulation"`,
      `"EUDR" delay`,
      `"EUDR" compliance`,
    ],
  },
  "ai-act": {
    name: "EU AI Act",
    queries: [
      `"EU AI Act"`,
      `"Artificial Intelligence Act" Europe`,
      `"AI Act" compliance`,
    ],
  },
  issb: {
    name: "ISSB",
    queries: [
      `"ISSB" sustainability disclosure`,
      `"IFRS S1"`,
      `"IFRS S2"`,
    ],
  },
  "sec-climate": {
    name: "SEC Climate Rule",
    queries: [
      `"SEC climate disclosure rule"`,
      `"SEC climate rule"`,
      `"SEC" climate disclosure`,
    ],
  },
  battery: {
    name: "EU Battery Regulation",
    queries: [
      `"EU Battery Regulation"`,
      `"battery passport" EU`,
      `"Battery Regulation" due diligence`,
    ],
  },
};

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
];

type RawRssItem = {
  title: string;
  link: string;
  pubDate: string;
  source: string;
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

async function fetchGoogleNewsRss(query: string): Promise<RawRssItem[]> {
  const encodedQuery = encodeURIComponent(`${query} when:30d`);
  const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;

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
  }));
}

function isNoiseNews(title: string): boolean {
  const lower = title.toLowerCase();
  return NOISE_KEYWORDS.some((keyword) => lower.includes(keyword));
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
  ) return "정부/규제기관";

  if (
    lower.includes("company") ||
    lower.includes("corporate") ||
    lower.includes("manufacturer") ||
    lower.includes("supplier")
  ) return "기업";

  if (
    lower.includes("investor") ||
    lower.includes("bank") ||
    lower.includes("asset manager") ||
    lower.includes("finance")
  ) return "금융/투자자";

  if (
    lower.includes("law firm") ||
    lower.includes("legal") ||
    lower.includes("lawyer")
  ) return "로펌";

  if (
    lower.includes("consulting") ||
    lower.includes("deloitte") ||
    lower.includes("pwc") ||
    lower.includes("ey") ||
    lower.includes("kpmg")
  ) return "컨설팅/회계법인";

  if (
    lower.includes("ngo") ||
    lower.includes("civil society") ||
    lower.includes("campaign")
  ) return "NGO/시민사회";

  if (
    lower.includes("association") ||
    lower.includes("industry group") ||
    lower.includes("trade body")
  ) return "산업협회";

  return "언론/시장";
}

function classifyReactionType(text: string): string {
  const lower = text.toLowerCase();

  if (lower.includes("delay") || lower.includes("postpone") || lower.includes("extension")) return "시행 지연 요구";
  if (lower.includes("cost") || lower.includes("burden") || lower.includes("expensive")) return "비용 부담";
  if (lower.includes("supply chain") || lower.includes("supplier") || lower.includes("exporter")) return "공급망 영향";
  if (lower.includes("legal") || lower.includes("guidance") || lower.includes("interpretation")) return "법률 해석";
  if (lower.includes("investor") || lower.includes("risk") || lower.includes("finance")) return "투자 리스크";
  if (lower.includes("comply") || lower.includes("compliance") || lower.includes("prepare") || lower.includes("response")) return "기업 대응";
  if (lower.includes("rule") || lower.includes("regulation") || lower.includes("directive") || lower.includes("law")) return "규제 변화";

  return "시장 동향";
}

function detectCountryKo(text: string): string {
  const lower = text.toLowerCase();

  if (lower.includes("korea") || lower.includes("south korea")) return "한국";
  if (lower.includes("japan")) return "일본";
  if (lower.includes("china")) return "중국";
  if (lower.includes("united states") || lower.includes(" u.s.") || lower.includes(" us ")) return "미국";
  if (lower.includes("united kingdom") || lower.includes(" uk ")) return "영국";
  if (lower.includes("germany")) return "독일";
  if (lower.includes("france")) return "프랑스";
  if (lower.includes("netherlands")) return "네덜란드";
  if (lower.includes("italy")) return "이탈리아";
  if (lower.includes("spain")) return "스페인";
  if (lower.includes("europe") || lower.includes("eu ")) return "EU/유럽";

  return "글로벌";
}

function sourceCountryKo(source: string): string {
  const lower = source.toLowerCase();

  if (lower.includes("reuters")) return "글로벌";
  if (lower.includes("bloomberg")) return "미국";
  if (lower.includes("financial times")) return "영국";
  if (lower.includes("euractiv")) return "EU/유럽";
  if (lower.includes("politico")) return "미국/EU";
  if (lower.includes("korea")) return "한국";
  if (lower.includes("japan")) return "일본";

  return "미확인";
}

function cleanTitle(title: string): string {
  return title.replace(/ - [^-]+$/, "").trim();
}

function calculateRelevanceScore(title: string, regulationId: RegulationId): number {
  const lower = title.toLowerCase();
  const regulation = REGULATIONS[regulationId];

  let score = 0;

  if (lower.includes(regulation.name.toLowerCase())) score += 50;

  for (const query of regulation.queries) {
    const cleaned = query.replaceAll('"', "").toLowerCase();
    const parts = cleaned.split(" ");

    for (const part of parts) {
      if (part.length > 3 && lower.includes(part)) score += 5;
    }
  }

  if (isNoiseNews(title)) score -= 100;

  return score;
}

export async function fetchGoogleNewsForRegulation(
  regulationId: RegulationId,
  limit = 5
): Promise<NewsItem[]> {
  const regulation = REGULATIONS[regulationId];
  const results: NewsItem[] = [];

  for (const query of regulation.queries.slice(0, 3)) {
    try {
      const items = await fetchGoogleNewsRss(query);

      for (const item of items) {
        const originalTitle = cleanTitle(item.title);
        if (!originalTitle || isNoiseNews(originalTitle)) continue;

        const source = item.source || "Unknown";
        const combinedText = `${originalTitle} ${source}`;

        results.push({
          titleKo: originalTitle,
          originalTitle,
          source,
          sourceCountryKo: sourceCountryKo(source),
          publishedAt: item.pubDate || "",
          url: item.link || "",
          regulationId,
          regulationName: regulation.name,
          stakeholderType: classifyStakeholder(combinedText),
          reactionType: classifyReactionType(combinedText),
          countryKo: detectCountryKo(combinedText),
          relevanceScore: calculateRelevanceScore(originalTitle, regulationId),
        });
      }
    } catch (error) {
      console.error(`Google News fetch failed for ${regulationId}`, error);
    }
  }

  const deduped = Array.from(
    new Map(results.map((item) => [item.url || item.originalTitle, item])).values()
  );

return deduped
  .sort((a, b) => {
    const dateA = new Date(a.publishedAt || 0).getTime();
    const dateB = new Date(b.publishedAt || 0).getTime();

    return dateB - dateA;
  })
  .slice(0, limit);

export async function fetchAllRegulationNews(limit = 5) {
  const regulationIds = Object.keys(REGULATIONS) as RegulationId[];

  return Promise.all(
    regulationIds.map(async (regulationId) => {
      const news = await fetchGoogleNewsForRegulation(regulationId, limit);

      return {
        regulationId,
        regulationName: REGULATIONS[regulationId].name,
        count: news.length,
        news,
      };
    })
  );
}
