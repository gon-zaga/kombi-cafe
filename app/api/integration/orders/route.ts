// Keyed read-only orders feed for Kombi Books: checks x-api-key, reuses GET /api/orders,
// forces completed-only, and strips GCash photos (large base64, not needed for bookkeeping).
import { NextResponse } from "next/server";
import { GET as getOrders } from "@/app/api/orders/route";

export async function GET(request: Request) {
  const key = request.headers.get("x-api-key");
  if (
    !process.env.INTEGRATION_API_KEY ||
    key !== process.env.INTEGRATION_API_KEY
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Force completed only so pending/unpaid orders are never booked as income.
  const url = new URL(request.url);
  url.searchParams.set("status", "completed");
  const res = await getOrders(new Request(url, request));
  if (!res.ok) return res;

  const orders = await res.json();
  const slim = orders.map((order: Record<string, unknown>) => {
    const copy = { ...order };
    delete copy.gcashPhoto;
    return copy;
  });
  return NextResponse.json(slim);
}