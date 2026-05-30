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
  dDay: number;

  readiness: number;
  risk: string;
  priority: string;

  summary: string;

  name_ko?: string;
  name_en?: string;
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
