import { NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { getDb } from "@/lib/json-db";

export async function GET() {
  try {
    const authUser = await authService.getAuthUser();
    const auth = authService.requireAdmin(authUser);
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    const users = getDb().users.all().reverse().map(({ password, ...u }) => u);
    return NextResponse.json({ users });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
