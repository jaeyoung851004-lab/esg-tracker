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

  // 상세 페이지용
  name_ko?: string;
  name_en?: string;
  key_points?: string[];

  card_date_label?: string;
  card_date_value?: string;

  official_url?: string;
}
