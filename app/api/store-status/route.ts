// Public endpoint: is the store open right now (Manila time)?
import { NextResponse } from "next/server";
import { getStoreStatus } from "@/app/lib/storeHours";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getStoreStatus();
  return NextResponse.json(status, { headers: { "Cache-Control": "no-store" } });
}