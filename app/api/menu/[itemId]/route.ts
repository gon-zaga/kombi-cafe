// Fetches a single menu item by itemId, joined with category/size/price data.
import pool from "@/app/lib/db";
import type { MenuRow, MenuItem } from "@/app/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  const id = Number(itemId);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid itemId" }, { status: 400 });
  }

  try {
    const result = await pool.query(
      `
      SELECT
        mi.id AS item_id,
        mi.name AS item_name,
        mi.image_url AS item_img,
        c.name AS category,
        s.id AS size_id,
        s.label AS size,
        s.oz AS oz,
        s.temperature AS temperature,
        mis.price AS price
      FROM menu_items AS mi
      JOIN categories AS c ON mi.category_id = c.id
      JOIN menu_item_sizes AS mis ON mi.id = mis.menu_item_id
      JOIN sizes AS s ON mis.size_id = s.id
      WHERE mi.id = $1 AND mi.is_available = TRUE
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const rows: MenuRow[] = result.rows;
    const first = rows[0];

    const item: MenuItem = {
      itemId: first.item_id,
      itemName: first.item_name,
      itemImg: first.item_img,
      category: first.category,
      ingredients: [],
      sizes: rows.map((row) => ({
        sizeId: row.size_id,
        size: row.size,
        oz: row.oz === null ? null : Number(row.oz),
        temperature: row.temperature,
        price: Number(row.price),
      })),
    };

    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to fetch item:", error);
    return NextResponse.json(
      { error: "Failed to fetch item" },
      { status: 500 }
    );
  }
}