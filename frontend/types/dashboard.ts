export interface RegulationSource {
  type?: string;
  org?: string;
  label: string;
  url: string;
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
  thresholds?: {
    scope?: string;
    exemptions?: string[];
  };
  sources?: RegulationSource[];
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
  priority?: string;
}

export interface RegulationActionCheckpoints {
  title?: string;
  items?: string[];
}

export interface RegulationCompanyMapping {
  industries?: string[];
  company_size?: string[];
  risk_level?: string;
  relevance_note?: string;
}

export interface RegulationNewsConfig {
  search_queries?: string[];
  required_keywords?: string[];
  exclude_keywords?: string[];
}

export interface Regulation {
  id: string;

  // 현재 Next.js UI용 필드
  code: string;
  title: string;
  category: string;
  country: string;
  industry: string;
  status: string;
  statusTone: string;
  deadline: string;
  dDay: number;
  readiness: number;
  risk: string;
  priority: string;
  summary: string;

  // 구 Streamlit 데이터 호환 필드
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

  // 상세 페이지 호환 필드
  key_points?: string[];
  card_date_label?: string;
  card_date_value?: string;
  official_url?: string;
}

export interface NewsItem {
  id: string;
  source: string;
  title: string;
  age: string;
  url: string;
}

export interface DashboardStats {
  totalRegulations: number;
  urgentTasks: number;
  averageReadiness: number;
  highPriority: number;
}
