import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { getDb, reloadDb } from "@/lib/json-db";

export async function POST(request: NextRequest) {
  try {
    const authUser = await authService.getAuthUser();
    if (!authUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const { planId } = await request.json();
    if (!planId) return NextResponse.json({ error: "Plan ID required" }, { status: 400 });

    const db = reloadDb();
    const plan = db.plans.all().find((p) => p.id === planId);
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    const user = db.users.findById(authUser.userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.balance < plan.price) {
      return NextResponse.json({ error: `Insufficient balance. Need $${plan.price}, have $${user.balance}` }, { status: 400 });
    }

    // Check if user already has this plan active
    const existing = db.user_plans.activeForUser(authUser.userId);
    if (existing) {
      const existingPlan = db.plans.all().find((p) => p.id === existing.plan_id);
      return NextResponse.json({ error: `You already have an active plan: ${existingPlan?.name || "Unknown"}` }, { status: 400 });
    }

    // Deduct balance and assign plan
    const expiresAt = new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000).toISOString();
    db.users.update(authUser.userId, { balance: (user.balance || 0) - plan.price });
    db.user_plans.create(authUser.userId, planId, expiresAt);
    db.balance_logs.create(authUser.userId, -plan.price, "plan", `Purchased plan: ${plan.name}`);

    return NextResponse.json({
      success: true,
      plan: plan.name,
      discount: `${plan.discount_percent}%`,
      expires: expiresAt.slice(0, 10),
      balance: (user.balance || 0) - plan.price,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
