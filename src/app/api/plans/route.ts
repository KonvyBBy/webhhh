import { NextResponse } from "next/server";
import { getDb } from "@/lib/json-db";

export async function GET() {
  const plans = getDb().plans.all();
  return NextResponse.json({ plans });
}
