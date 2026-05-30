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
