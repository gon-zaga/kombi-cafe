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
      isAvailable: first.is_available
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  const id = Number(itemId);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid itemId" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    const body = await request.json();
    const { name, categoryId, imageUrl, isAvailable, sizes } = body;

    await client.query("BEGIN");

    await client.query(
      `UPDATE menu_items
       SET name = COALESCE($1, name),
           category_id = COALESCE($2, category_id),
           image_url = COALESCE($3, image_url),
           is_available = COALESCE($4, is_available)
       WHERE id = $5`,
      [name ?? null, categoryId ?? null, imageUrl ?? null, isAvailable ?? null, id]
    );

    if (Array.isArray(sizes)) {
      await client.query(`DELETE FROM menu_item_sizes WHERE menu_item_id = $1`, [id]);
      for (const s of sizes) {
        await client.query(
          `INSERT INTO menu_item_sizes (menu_item_id, size_id, price)
           VALUES ($1, $2, $3)`,
          [id, s.sizeId, s.price]
        );
      }
    }

    await client.query("COMMIT");
    return NextResponse.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to update menu item:", error);
    return NextResponse.json({ error: "Failed to update menu item" }, { status: 500 });
  } finally {
    client.release();
  }

  
}


// app/api/menu/[itemId]/route.ts

// DELETE removes one menu item from the database.
// If past orders still reference the item,
// PostgreSQL will return a foreign key error.

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  // Get the itemId from the URL.
  //
  // Example:
  // /api/menu/5
  //
  // itemId = "5"
  const { itemId } = await params;

  // Convert the itemId from a string to a number.
  //
  // "5" → 5
  const id = Number(itemId);

  // Check if the ID is a valid number.
  if (isNaN(id)) {
    return NextResponse.json(
      { error: "Invalid itemId" },
      { status: 400 }
    );
  }

  try {
    // Delete the menu item with the matching ID.
    //
    // $1 is replaced by the value inside [id].
    const result = await pool.query(
      `DELETE FROM menu_items WHERE id = $1`,
      [id]
    );

    // rowCount tells us how many rows were deleted.
    //
    // If it is 0, no menu item with that ID exists.
    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    // The item was successfully deleted.
    return NextResponse.json({
      success: true
    });

  } catch (error) {

    // PostgreSQL error code 23503 means
    // a foreign key constraint was violated.
    //
    // This can happen when an old order still
    // references this menu item.
    if ((error as { code?: string }).code === '23503') {

      // Return HTTP 409 Conflict.
      return NextResponse.json(
        {
          error: "This item has past orders. Mark it unavailable instead."
        },
        {
          status: 409
        }
      );
    }

    // Print unexpected errors in the server console.
    console.error(
      "Failed to delete menu item:",
      error
    );

    // Return a general server error.
    return NextResponse.json(
      { error: "Failed to delete menu item" },
      { status: 500 }
    );
  }
}

