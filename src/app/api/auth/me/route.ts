import { NextResponse } from "next/server";
import { authService } from "@/services/auth.service";

export async function GET() {
  try {
    const user = await authService.getCurrentUser();
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}
