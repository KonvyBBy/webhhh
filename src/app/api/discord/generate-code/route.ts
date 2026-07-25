import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/json-db";

const BOT_SECRET = process.env.DISCORD_BOT_SECRET || "change-me-bot-secret";

export async function POST(request: NextRequest) {
  try {
    const { discord_id, username, display_name, avatar_url, secret } = await request.json();
    if (secret !== BOT_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!discord_id) {
      return NextResponse.json({ error: "discord_id required" }, { status: 400 });
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    getDb().login_codes.create(code, discord_id, username || "", display_name || "", avatar_url || "");

    return NextResponse.json({ code });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
