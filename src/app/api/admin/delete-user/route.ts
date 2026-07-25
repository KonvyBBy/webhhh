import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { getDb, reloadDb } from "@/lib/json-db";

export async function POST(request: NextRequest) {
  try {
    const auth = authService.requireAdmin(await authService.getAuthUser());
    if (!auth.allowed) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const db = reloadDb();
    const user = db.users.findById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.role === "admin") return NextResponse.json({ error: "Cannot delete admin" }, { status: 400 });

    // Delete user and their data
    db.users.update(userId, { balance: 0, role: "deleted" } as any);

    return NextResponse.json({ success: true, message: `User ${user.username} deleted` });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
