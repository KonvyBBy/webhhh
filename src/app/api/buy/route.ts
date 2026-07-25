import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { orderService } from "@/services/order.service";
import { rateLimitIP } from "@/lib/cache";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rl = rateLimitIP(ip, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
    }

    const authUser = await authService.getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const { itemId } = await request.json();
    if (!itemId) {
      return NextResponse.json({ error: "Item ID required" }, { status: 400 });
    }

    const result = await orderService.purchase(authUser.userId, itemId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      balance: result.balance,
      credentials: result.credentials,
      orderId: result.orderId,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
