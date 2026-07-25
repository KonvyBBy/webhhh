import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { getDb, reloadDb } from "@/lib/json-db";

export async function POST(request: NextRequest) {
  try {
    const authUser = await authService.getAuthUser();
    const auth = authService.requireAdmin(authUser);
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    const { userId, amount, action } = await request.json();
    if (!userId || amount === undefined) {
      return NextResponse.json({ error: "userId and amount required" }, { status: 400 });
    }

    const db = reloadDb();
    const user = db.users.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let newBalance = user.balance;
    const note = request.nextUrl.searchParams.get("note") || "";

    if (action === "set") {
      newBalance = Number(amount);
      db.users.update(userId, { balance: newBalance });
      db.balance_logs.create(userId, newBalance - user.balance, "admin", note || `Set balance to ${amount}`);
    } else if (action === "remove") {
      newBalance = Math.max(0, user.balance - Math.abs(Number(amount)));
      db.users.update(userId, { balance: newBalance });
      db.balance_logs.create(userId, -(user.balance - newBalance), "admin", note || `Removed ${amount}`);
    } else {
      newBalance = user.balance + Number(amount);
      db.users.update(userId, { balance: newBalance });
      db.balance_logs.create(userId, Number(amount), "admin", note || `Added ${amount}`);
    }

    return NextResponse.json({
      user: { id: user.id, username: user.username, balance: newBalance },
      previousBalance: user.balance,
      newBalance,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
