import { NextResponse } from "next/server";
import pool from "@/app/lib/db";

function manilaToday(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function resolveRange(range: string): { from: string | null; to: string | null } | null {
  const today = manilaToday();
  const yearStart = `${today.slice(0, 4)}-01-01`;

  switch (range) {
    case "today":
      return { from: today, to: today };
    case "yesterday":
      return { from: addDays(today, -1), to: addDays(today, -1) };
    case "week":
      return { from: addDays(today, -6), to: today };
    case "month":
      return { from: addDays(today, -29), to: today };
    case "year":
      return { from: yearStart, to: today };
    case "all":
      return { from: null, to: null };
    default:
      return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const range = searchParams.get("range") ?? "today";

  let from: string | null = null;
  let to: string | null = null;

  if (fromParam !== null || toParam !== null) {
    if (!fromParam || !toParam) {
      return NextResponse.json(
        { error: "Both 'from' and 'to' are required" },
        { status: 400 }
      );
    }
    if (!isValidIsoDate(fromParam) || !isValidIsoDate(toParam)) {
      return NextResponse.json(
        { error: "Dates must be in YYYY-MM-DD format" },
        { status: 400 }
      );
    }
    if (fromParam > toParam) {
      return NextResponse.json(
        { error: "'from' must be on or before 'to'" },
        { status: 400 }
      );
    }
    from = fromParam;
    to = toParam;
  } else {
    const resolved = resolveRange(range);
    if (!resolved) {
      return NextResponse.json({ error: "Invalid range" }, { status: 400 });
    }
    from = resolved.from;
    to = resolved.to;
  }

  const dateFilter = from ? `AND o.order_date >= $1` : "";
  const dateFilterTo = to ? `AND o.order_date <= $2` : "";
  const params: (string | null)[] = [];
  if (from) params.push(from);
  if (to) params.push(to);

  try {
    const results = await Promise.all([
      // 1. Revenue by Category
      pool.query(
        `
        SELECT c.name AS category, 
               COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS revenue,
               COUNT(DISTINCT o.id) AS order_count
        FROM order_items oi
        JOIN menu_items mi ON mi.id = oi.menu_item_id
        JOIN categories c ON c.id = mi.category_id
        JOIN orders o ON o.id = oi.order_id
        WHERE ($1::date IS NULL OR o.order_date >= $1::date)
          AND ($2::date IS NULL OR o.order_date <= $2::date)
        GROUP BY c.name
        ORDER BY revenue DESC
        `,
        [from, to]
      ),

      // 2. Revenue by Hour (Peak Hours)
      pool.query(
        `
        SELECT EXTRACT(HOUR FROM o.created_at AT TIME ZONE 'Asia/Manila')::int AS hour,
               COUNT(*) AS orders,
               COALESCE(SUM(o.total), 0) AS revenue
        FROM orders o
        WHERE ($1::date IS NULL OR o.order_date >= $1::date)
          AND ($2::date IS NULL OR o.order_date <= $2::date)
        GROUP BY hour
        ORDER BY hour
        `,
        [from, to]
      ),

      // 3. Average Items per Order
      pool.query(
        `
        SELECT COALESCE(AVG(item_count), 0) AS avg_items_per_order
        FROM (
          SELECT COUNT(*) AS item_count
          FROM order_items oi
          JOIN orders o ON o.id = oi.order_id
          WHERE ($1::date IS NULL OR o.order_date >= $1::date)
            AND ($2::date IS NULL OR o.order_date <= $2::date)
          GROUP BY oi.order_id
        ) sub
        `,
        [from, to]
      ),

      // 4. Add-on Attachment Rate
      pool.query(
        `
        SELECT 
          COUNT(DISTINCT oi.id) AS total_order_items,
          COUNT(DISTINCT oia.order_item_id) AS items_with_addons,
          CASE WHEN COUNT(DISTINCT oi.id) = 0 THEN 0
               ELSE COUNT(DISTINCT oia.order_item_id)::numeric / COUNT(DISTINCT oi.id) * 100
          END AS attachment_rate_percent
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        LEFT JOIN order_item_addons oia ON oia.order_item_id = oi.id
        WHERE ($1::date IS NULL OR o.order_date >= $1::date)
          AND ($2::date IS NULL OR o.order_date <= $2::date)
        `,
        [from, to]
      ),

      // 5. Staff Performance (Orders Processed)
      pool.query(
        `
        SELECT s.user_id, s.username, s.first_name, s.last_name,
               COUNT(o.id) AS orders_completed,
               COALESCE(AVG(o.total), 0) AS avg_order_value,
               COALESCE(SUM(o.total), 0) AS total_revenue
        FROM orders o
        JOIN staff s ON s.user_id = o.processed_by
        WHERE o.status = 'completed'
          AND ($1::date IS NULL OR o.order_date >= $1::date)
          AND ($2::date IS NULL OR o.order_date <= $2::date)
        GROUP BY s.user_id, s.username, s.first_name, s.last_name
        ORDER BY orders_completed DESC
        `,
        [from, to]
      ),

      // 6. Summary totals
      pool.query(
        `
        SELECT COUNT(*) AS total_orders,
               COALESCE(SUM(total), 0) AS total_revenue,
               COALESCE(AVG(total), 0) AS avg_order_value,
               COUNT(*) FILTER (WHERE status = 'completed') AS completed_orders
        FROM orders
        WHERE ($1::date IS NULL OR order_date >= $1::date)
          AND ($2::date IS NULL OR order_date <= $2::date)
        `,
        [from, to]
      ),

      // 7. Daily breakdown for trend chart
      pool.query(
        `
        SELECT o.order_date,
               COUNT(*) AS orders,
               COALESCE(SUM(o.total), 0) AS revenue
        FROM orders o
        WHERE ($1::date IS NULL OR o.order_date >= $1::date)
          AND ($2::date IS NULL OR o.order_date <= $2::date)
        GROUP BY o.order_date
        ORDER BY o.order_date
        `,
        [from, to]
      ),
    ]);

    const [
      byCategory,
      byHour,
      avgItems,
      addonRate,
      staffPerf,
      summary,
      dailyTrend,
    ] = results;

    return NextResponse.json({
      range: { from, to },
      summary: summary.rows[0],
      revenueByCategory: byCategory.rows,
      revenueByHour: byHour.rows,
      avgItemsPerOrder: Number(avgItems.rows[0]?.avg_items_per_order ?? 0),
      addonAttachmentRate: Number(addonRate.rows[0]?.attachment_rate_percent ?? 0),
      staffPerformance: staffPerf.rows,
      dailyTrend: dailyTrend.rows,
    });
  } catch (error) {
    console.error("Analytics query failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}