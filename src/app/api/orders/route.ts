import { NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { orderService } from "@/services/order.service";

export async function GET() {
  try {
    const authUser = await authService.getAuthUser();
    if (!authUser) {
      return NextResponse.json({ orders: [] });
    }

    let orders: Record<string, unknown>[];
    if (authUser.role === "admin") {
      orders = await orderService.getAllOrders();
    } else {
      orders = await orderService.getOrders(authUser.userId);
    }

    return NextResponse.json({ orders });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
