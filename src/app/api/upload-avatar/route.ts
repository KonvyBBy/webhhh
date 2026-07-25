import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { getDb } from "@/lib/json-db";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const authUser = await authService.getAuthUser();
    if (!authUser) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const ext = file.name.split(".").pop() || "png";
    const filename = `avatar-${authUser.userId}-${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(uploadDir, filename), buffer);

    const avatarUrl = `/uploads/${filename}`;
    getDb().users.update(authUser.userId, { avatar_url: avatarUrl } as any);

    return NextResponse.json({ avatar_url: avatarUrl });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
