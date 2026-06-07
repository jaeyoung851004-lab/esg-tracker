import type {
  DashboardStats,
  NewsFeedResponse,
  NewsItem,
  Regulation,
  RegulationGovernanceType,
  RegulationOfficialMetadata,
  RegulationDetail,
  RegulationSummary,
  RegulationTracking,
  DelegatedActTrackerItem,
} from "@/types/dashboard";
import regulationsData from "../../data/regulations.json";
import { emptyNewsFeed, fetchBackendNews } from "@/lib/news/googleNews";

type OldRegulation = {
  id: string;
  acronym?: string;
  name_ko?: string;
  name_en?: string;
  summary_short?: string;
  governance_type?: RegulationGovernanceType;
  category?: string;
  legal?: {
    legal_state?: string;
    political_direction?: string;
    dates?: Record<
      string,
      | {
          date: string;
          label: string;
        }
      | undefined
    >;
    thresholds?: Record<string, string | string[]>;
    sources?: {
      type?: string;
      org?: string;
      label: string;
      url: string;
    }[];
    official_metadata?: RegulationOfficialMetadata;
  };
  ai_layer?: {
    confidence?: string;
    confidence_reason?: string;
    situation_summary?: string;
    situation_detail?: string;
    key_points?: string[];
    affected_industries?: string[];
    uncertain_items?: string[];
  };
  news_config?: {
    search_queries?: string[];
    required_keywords?: string[];
    exclude_keywords?: string[];
  };
  history?: {
    date: string;
    event: string;
    source_type?: string;
    source_org?: string;
  }[];
  display?: {
    status_label?: string;
    status_tone?: string;
    card_date_label?: string;
    card_date_value?: string;
    card_summary?: string;
    priority?: string;
  };
  action_checkpoints?: Record<string, string | string[] | undefined>;
  tracking?: RegulationTracking;
  delegated_acts_tracker?: DelegatedActTrackerItem[];
  korean_company_note?: string;
  company_mapping?: {
    industries?: string[];
    company_size?: string[];
    risk_level?: string;
    relevance_note?: string;
    note?: string;
    direct?: {
      name: string;
      reason: string;
    }[];
    indirect?: {
      name: string;
      reason: string;
    }[];
  };
  why_it_matters?: string;
};

type RegulationsJson = {
  regulations: OldRegulation[];
};

const rawRegulations =
  (regulationsData as unknown as RegulationsJson).regulations ?? [];

function normalizeStatusTone(
  statusLabel?: string,
  explicitTone?: string
): { tone: string; key: string } {
  const source = `${explicitTone || ""} ${statusLabel || ""}`.toLowerCase();

  if (
    source.includes("delay") ||
    source.includes("지연") ||
    source.includes("축소")
  ) {
    return { tone: "danger", key: "delayed" };
  }

  if (
    source.includes("유예") ||
    source.includes("불확실") ||
    source.includes("uncertain")
  ) {
    return { tone: "warning", key: "paused" };
  }

  if (
    source.includes("입법") ||
    source.includes("trilogue") ||
    source.includes("proposal")
  ) {
    return { tone: "info", key: "legislative" };
  }

  if (
    source.includes("시행") ||
    source.includes("적용") ||
    source.includes("phase")
  ) {
    return { tone: "success", key: "phased" };
  }

  return { tone: "warning", key: "watch" };
}

function extractDateCandidate(value?: string): string | null {
  if (!value) return null;

  const match = value.match(/\d{4}[-./]\d{1,2}[-./]\d{1,2}/);
  if (match) {
    return match[0].replaceAll(".", "-").replaceAll("/", "-");
  }

  return null;
}

function calculateDDay(dateText?: string): number | null {
  const candidate = extractDateCandidate(dateText);
  if (!candidate) return null;

  const date = new Date(candidate);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return Math.ceil(
    (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function getCountry(reg: OldRegulation): string {
  const text = `${reg.name_en ?? ""} ${reg.name_ko ?? ""} ${reg.acronym ?? ""}`.toLowerCase();

  if (
    text.includes("california") ||
    text.includes("sb253") ||
    text.includes("sb261")
  ) {
    return "미국";
  }

  if (
    text.includes("eu") ||
    text.includes("european") ||
    [
      "espr",
      "ppwr",
      "csddd",
      "csrd",
      "cbam",
      "eudr",
      "gcd",
      "ai act",
      "battery reg",
      "dpp",
      "elv",
    ].includes((reg.acronym ?? "").toLowerCase())
  ) {
    return "EU";
  }

  return "글로벌";
}

function getIndustry(reg: OldRegulation): string {
  return (
    reg.company_mapping?.industries?.join(", ") ||
    reg.ai_layer?.affected_industries?.join(", ") ||
    "산업 전반"
  );
}

function getRisk(reg: OldRegulation): string {
  return reg.company_mapping?.risk_level || "점검 필요";
}

function getReadiness(reg: OldRegulation): number {
  const { tone } = normalizeStatusTone(
    reg.display?.status_label,
    reg.display?.status_tone
  );

  if (tone === "success") return 72;
  if (tone === "info") return 58;
  if (tone === "warning") return 44;
  if (tone === "danger") return 32;

  return 50;
}

function getPriority(reg: OldRegulation): string {
  return reg.display?.priority || reg.company_mapping?.risk_level || "모니터링";
}

function cleanLegal(reg: OldRegulation): Regulation["legal"] {
  if (!reg.legal) return undefined;

  const cleanDates: Record<string, { date: string; label: string }> = {};

  Object.entries(reg.legal.dates ?? {}).forEach(([key, value]) => {
    if (value?.date && value?.label) {
      cleanDates[key] = value;
    }
  });

  return {
    ...reg.legal,
    dates: cleanDates,
  };
}

function buildOfficialMetadata(reg: OldRegulation): RegulationOfficialMetadata {
  const metadata = reg.legal?.official_metadata ?? {};
  const primarySource =
    reg.legal?.sources?.find((source) => source.type === "primary") ??
    reg.legal?.sources?.[0];
  const sourceUrl = metadata.source_url || primarySource?.url || "";
  const celexMatch = sourceUrl.match(/CELEX:([^&]+)/i);

  return {
    source_name: metadata.source_name || primarySource?.org || "",
    source_url: sourceUrl,
    celex_id: metadata.celex_id || celexMatch?.[1] || "",
    official_document_url: metadata.official_document_url || sourceUrl,
    last_synced_at: metadata.last_synced_at ?? null,
    last_verified_at: metadata.last_verified_at ?? null,
  };
}

function convertRegulation(reg: OldRegulation): RegulationDetail {
  const statusMeta = normalizeStatusTone(
    reg.display?.status_label,
    reg.display?.status_tone
  );
  const primarySource = reg.legal?.sources?.[0];
  const officialMetadata = buildOfficialMetadata(reg);
  const deadline =
    reg.display?.card_date_value ||
    reg.legal?.dates?.application_date?.date ||
    reg.legal?.dates?.entry_into_force?.date ||
    reg.legal?.dates?.adopted?.date ||
    "미정";

  return {
    id: reg.id,
    code: reg.acronym ?? reg.id.toUpperCase(),
    title: reg.name_ko ?? reg.name_en ?? reg.acronym ?? reg.id,
    category: reg.category ?? "규제",
    country: getCountry(reg),
    industry: getIndustry(reg),
    status:
      reg.display?.status_label ?? reg.legal?.legal_state ?? "상태 확인 필요",
    statusTone: statusMeta.tone,
    deadline,
    dDay: calculateDDay(deadline),
    readiness: getReadiness(reg),
    risk: getRisk(reg),
    priority: getPriority(reg),
    summary:
      reg.summary_short ||
      reg.display?.card_summary ||
      reg.ai_layer?.situation_summary ||
      reg.why_it_matters ||
      reg.korean_company_note ||
      "상세 정보 점검이 필요합니다.",
    summary_short: reg.summary_short,
    governance_type: reg.governance_type,
    acronym: reg.acronym,
    name_ko: reg.name_ko,
    name_en: reg.name_en,
    legal: {
      ...(cleanLegal(reg) ?? {}),
      official_metadata: officialMetadata,
    },
    ai_layer: reg.ai_layer ?? {},
    news_config: reg.news_config ?? {},
    history: reg.history,
    display: reg.display ?? {},
    action_checkpoints: reg.action_checkpoints ?? {},
    tracking: reg.tracking,
    delegated_acts_tracker: reg.delegated_acts_tracker,
    korean_company_note: reg.korean_company_note,
    company_mapping: reg.company_mapping ?? {},
    why_it_matters: reg.why_it_matters,
    key_points: reg.ai_layer?.key_points,
    card_date_label: reg.display?.card_date_label,
    card_date_value: reg.display?.card_date_value,
    official_url: officialMetadata.official_document_url || primarySource?.url,
    official_metadata: officialMetadata,
    officialMetadata,
    source_name: officialMetadata.source_name,
    sourceName: officialMetadata.source_name,
    source_url: officialMetadata.source_url,
    sourceUrl: officialMetadata.source_url,
    celex_id: officialMetadata.celex_id,
    celexId: officialMetadata.celex_id,
    official_document_url: officialMetadata.official_document_url,
    officialDocumentUrl: officialMetadata.official_document_url,
    last_synced_at: officialMetadata.last_synced_at,
    lastSyncedAt: officialMetadata.last_synced_at,
    last_verified_at: officialMetadata.last_verified_at,
    lastVerifiedAt: officialMetadata.last_verified_at,
  };
}

const fallbackRegulationDetails: RegulationDetail[] =
  rawRegulations.map(convertRegulation);

export function summarizeRegulation(
  regulation: RegulationDetail
): RegulationSummary {
  const statusMeta = normalizeStatusTone(
    regulation.status,
    regulation.display?.status_tone
  );

  return {
    ...regulation,
    region: regulation.country,
    deadlineLabel: regulation.card_date_label || "다음 주요 시점",
    statusKey: statusMeta.key,
    sourceCount: regulation.legal?.sources?.length ?? 0,
    historyCount: regulation.history?.length ?? 0,
    checkpointCount: Object.values(regulation.action_checkpoints ?? {}).reduce(
      (count, value) => count + (Array.isArray(value) ? value.length : value ? 1 : 0),
      0
    ),
    newsQueryCount: regulation.news_config?.search_queries?.length ?? 0,
  };
}

const fallbackRegulations: RegulationSummary[] =
  fallbackRegulationDetails.map(summarizeRegulation);

export function getRegulationsSnapshot(): RegulationSummary[] {
  return fallbackRegulations;
}

export async function getRegulations(): Promise<RegulationSummary[]> {
  return fallbackRegulations;
}

export async function getRegulationDetails(): Promise<RegulationDetail[]> {
  return fallbackRegulationDetails;
}

export async function getRegulationDetail(
  id: string
): Promise<RegulationDetail | null> {
  return fallbackRegulationDetails.find((item) => item.id === id) ?? null;
}

export async function getNewsFeed({
  regulationId,
  limit = 20,
}: {
  regulationId?: string;
  limit?: number;
} = {}): Promise<NewsFeedResponse> {
  try {
    return await fetchBackendNews({ regulationId, limit });
  } catch (error) {
    console.error("getNewsFeed failed:", error);
    return emptyNewsFeed(regulationId);
  }
}

export async function getNews(
  regulationId?: string,
  limit = 20
): Promise<NewsItem[]> {
  const feed = await getNewsFeed({ regulationId, limit });
  return feed.items;
}

export async function getStats(): Promise<DashboardStats> {
  const total = fallbackRegulations.length || 1;

  return {
    totalRegulations: fallbackRegulations.length,
    urgentTasks: fallbackRegulations.filter(
      (item) =>
        typeof item.dDay === "number" && item.dDay >= 0 && item.dDay <= 120
    ).length,
    averageReadiness: Math.round(
      fallbackRegulations.reduce((sum, item) => sum + item.readiness, 0) / total
    ),
    highPriority: fallbackRegulations.filter((item) =>
      ["높음", "High"].includes(item.priority)
    ).length,
  };
}
