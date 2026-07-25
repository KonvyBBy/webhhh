import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { getDb, reloadDb } from "@/lib/json-db";
import { clearCache } from "@/lib/cache";

export async function GET() {
  const authUser = await authService.getAuthUser();
  const auth = authService.requireAdmin(authUser);
  if (!auth.allowed) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  return NextResponse.json({ settings: getDb().settings.get() });
}

export async function POST(request: NextRequest) {
  const authUser = await authService.getAuthUser();
  const auth = authService.requireAdmin(authUser);
  if (!auth.allowed) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const { markup } = await request.json();
  if (markup !== undefined && (typeof markup !== "number" || markup < 0.1)) {
    return NextResponse.json({ error: "Markup must be at least 0.1" }, { status: 400 });
  }

  const db = reloadDb();
  db.settings.update({ markup });
  clearCache("products:");
  clearCache("product:");
  return NextResponse.json({ settings: db.settings.get() });
}
