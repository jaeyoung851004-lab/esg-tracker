import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://esg-tracker.onrender.com";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/regulations`, {
      cache: "no-store",
    });
    const data = await res.json();

    // 백엔드가 배열을 직접 반환하므로 { regulations: [...] } 로 감싸기
    const arr = Array.isArray(data) ? data : (data.regulations || []);

    return NextResponse.json({
      regulations: arr.map((r: Record<string, string>) => ({
        id: r.id,
        acronym: r.code,       // 백엔드는 'code' 필드로 옴
        name_ko: r.title,      // 백엔드는 'title' 필드로 옴
      })),
    });
  } catch {
    return NextResponse.json({ regulations: [] }, { status: 500 });
  }
}
