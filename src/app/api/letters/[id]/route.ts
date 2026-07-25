import { NextResponse } from "next/server";

const API_BASE = "https://prod-api.lzt.market";
const API_TOKEN = process.env.LZT_API_TOKEN || "";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await fetch(`${API_BASE}/${id}/letters`, {
      headers: { Authorization: `Bearer ${API_TOKEN}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ error: `API error: ${res.status}`, letters: [] });
    }
    const data = await res.json();
    // Find the first non-system_info key
    const key = Object.keys(data).find((k) => k !== "system_info");
    const letters = key ? (data[key] as Record<string, unknown>[]) || [] : [];
    return NextResponse.json({ letters });
  } catch (err) {
    return NextResponse.json({ error: String(err), letters: [] });
  }
}
