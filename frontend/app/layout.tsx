import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Impact ON — ESG 규제 트래커",
  description: "기업 맞춤형 ESG 규제 대응 현황 관리",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
