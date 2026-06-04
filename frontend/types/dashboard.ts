export interface RegulationSource {
  type?: string;
  org?: string;
  label: string;
  url: string;
}

export interface RegulationOfficialMetadata {
  source_name?: string;
  source_url?: string;
  celex_id?: string;
  official_document_url?: string;
  last_synced_at?: string | null;
  last_verified_at?: string | null;
}

export interface RegulationHistory {
  date: string;
  event: string;
  source_type?: string;
  source_org?: string;
}

export interface RegulationLegal {
  legal_state?: string;
  political_direction?: string;
  dates?: Record<
    string,
    {
      date: string;
      label: string;
    }
  >;
  thresholds?: Record<string, string | string[]>;
  sources?: RegulationSource[];
  official_metadata?: RegulationOfficialMetadata;
}

export interface RegulationAiLayer {
  confidence?: string;
  confidence_reason?: string;
  situation_summary?: string;
  situation_detail?: string;
  key_points?: string[];
  affected_industries?: string[];
  uncertain_items?: string[];
}

export interface RegulationDisplay {
  status_label?: string;
  status_tone?: string;
  card_date_label?: string;
  card_date_value?: string;
  card_summary?: string;
  priority?: string;
}

export interface RegulationActionCheckpoints {
  title?: string;
  items?: string[];
  [key: string]: string | string[] | undefined;
}

export interface RegulationCompanyImpactItem {
  name: string;
  reason: string;
}

export interface RegulationCompanyMapping {
  industries?: string[];
  company_size?: string[];
  risk_level?: string;
  relevance_note?: string;
  note?: string;
  direct?: RegulationCompanyImpactItem[];
  indirect?: RegulationCompanyImpactItem[];
}

export interface RegulationNewsConfig {
  search_queries?: string[];
  required_keywords?: string[];
  exclude_keywords?: string[];
}

export interface Regulation {
  id: string;
  code: string;
  title: string;
  category: string;
  country: string;
  industry: string;
  status: string;
  statusTone: string;
  deadline: string;
  dDay: number | null;
  readiness: number;
  risk: string;
  priority: string;
  summary: string;
  acronym?: string;
  name_ko?: string;
  name_en?: string;
  legal?: RegulationLegal;
  ai_layer?: RegulationAiLayer;
  news_config?: RegulationNewsConfig;
  history?: RegulationHistory[];
  display?: RegulationDisplay;
  action_checkpoints?: RegulationActionCheckpoints;
  korean_company_note?: string;
  company_mapping?: RegulationCompanyMapping;
  why_it_matters?: string;
  key_points?: string[];
  card_date_label?: string;
  card_date_value?: string;
  official_url?: string;
  official_metadata?: RegulationOfficialMetadata;
  officialMetadata?: RegulationOfficialMetadata;
  source_name?: string;
  sourceName?: string;
  source_url?: string;
  sourceUrl?: string;
  celex_id?: string;
  celexId?: string;
  official_document_url?: string;
  officialDocumentUrl?: string;
  last_synced_at?: string | null;
  lastSyncedAt?: string | null;
  last_verified_at?: string | null;
  lastVerifiedAt?: string | null;
}

export interface RegulationSummary extends Regulation {
  region: string;
  deadlineLabel: string;
  statusKey: string;
  sourceCount: number;
  historyCount: number;
  checkpointCount?: number;
  newsQueryCount: number;
}

export interface RegulationDetail extends Regulation {
  legal: RegulationLegal;
  ai_layer: RegulationAiLayer;
  news_config: RegulationNewsConfig;
  display: RegulationDisplay;
  action_checkpoints: RegulationActionCheckpoints;
  company_mapping: RegulationCompanyMapping;
}

export interface NewsItem {
  id: string;
  title: string;
  titleKo?: string;
  originalTitle?: string;
  url: string;
  source: string;
  sourceRegion?: string;
  publishedAt: string;
  age?: string;
  regulationId: string;
  relatedRegulationIds?: string[];
  relatedRegulationNames?: string[];
  sourceType?: string;
  actorType?: string;
  newsType?: string;
  relevanceScore?: number;
  importanceScore?: number;
  summary?: string;
}

export interface NewsRegulationMeta {
  id: string;
  code: string;
  name: string;
  count: number;
}

export interface RegionCount {
  region: string;
  count: number;
}

export interface NewsFeedResponse {
  items: NewsItem[];
  count: number;
  lookbackDays: number;
  generatedAt: string;
  regulationId: string | null;
  availableRegulations: NewsRegulationMeta[];
  regionCounts: RegionCount[];
}

export interface DashboardStats {
  totalRegulations: number;
  urgentTasks: number;
  averageReadiness: number;
  highPriority: number;
}
