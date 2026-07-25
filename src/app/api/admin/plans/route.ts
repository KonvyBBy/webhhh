import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { getDb, reloadDb } from "@/lib/json-db";

export async function GET() {
  const auth = authService.requireAdmin(await authService.getAuthUser());
  if (!auth.allowed) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  return NextResponse.json({ plans: getDb().plans.all() });
}

export async function POST(request: NextRequest) {
  const auth = authService.requireAdmin(await authService.getAuthUser());
  if (!auth.allowed) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const { action, id, ...data } = await request.json();
  const db = reloadDb();

  if (action === "create") {
    const plan = db.plans.create({ name: data.name, price: Number(data.price), discount_percent: Number(data.discount_percent), duration_days: Number(data.duration_days), description: data.description || "" });
    return NextResponse.json({ plan });
  }

  if (action === "update") {
    db.plans.update(Number(id), { name: data.name, price: Number(data.price), discount_percent: Number(data.discount_percent), duration_days: Number(data.duration_days), description: data.description });
    return NextResponse.json({ success: true });
  }

  if (action === "delete") {
    db.plans.delete(Number(id));
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
