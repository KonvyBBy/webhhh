import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { getDb } from "@/lib/json-db";

export async function GET(request: NextRequest) {
  const auth = authService.requireAdmin(await authService.getAuthUser());
  if (!auth.allowed) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const userId = Number(request.nextUrl.searchParams.get("userId"));
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const db = getDb();
  const user = db.users.findById(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const orders = db.orders.findByUser(userId);
  const logs = db.balance_logs.findByUser(userId);
  const userPlans = db.user_plans.all().filter((up) => up.user_id === userId);

  return NextResponse.json({ user, orders, logs, userPlans });
}
