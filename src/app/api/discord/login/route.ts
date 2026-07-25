import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { getDb } from "@/lib/json-db";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    if (!code) {
      return NextResponse.json({ error: "Code required" }, { status: 400 });
    }

    const db = getDb();
    const info = db.login_codes.findAndUse(code.toUpperCase());
    if (!info) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    // Find or create user by discord ID
    let user = db.users.findByDiscordId(info.discord_id);
    if (!user) {
      const username = info.username || `discord_${info.discord_id.slice(0, 8)}`;
      const hashed = await import("bcryptjs").then((b) => b.hashSync(Math.random().toString(), 10));
      user = db.users.create(username, hashed, "", info.display_name || username);

      db.users.update(user.id, {
        discord_id: info.discord_id,
        avatar_url: info.avatar_url || "",
        role: info.discord_id === "1421909779583996025" ? "admin" : "user",
      } as any);
      user = db.users.findById(user.id)!;
    } else {
      // Update display info
      db.users.update(user.id, {
        display_name: info.display_name || user.display_name,
        avatar_url: info.avatar_url || user.avatar_url,
      } as any);
    }

    // Create session
    const token = authService.createToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    const response = NextResponse.json({
      user: { id: user.id, username: user.username, display_name: user.display_name, avatar_url: user.avatar_url, balance: user.balance, role: user.role },
    });
    response.cookies.set("token", token, {
      httpOnly: true, secure: false, sameSite: "lax", maxAge: 7 * 24 * 60 * 60, path: "/",
    });
    return response;
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
