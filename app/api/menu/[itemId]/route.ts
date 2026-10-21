// Fetches a single menu item by itemId, joined with category/size/price data.
// Supports both menu_items and add_ons tables.
import pool from "@/app/lib/db";
import { validateImageValue } from "@/app/lib/imageValue";
import type { MenuRow, MenuItem } from "@/app/lib/types";
import { NextRequest, NextResponse } from "next/server";

async function fetchMenuItem(id: number): Promise<MenuItem | null> {
  const result = await pool.query(
    `
    SELECT
      mi.id AS item_id,
      mi.name AS item_name,
      mi.image_url AS item_img,
      mi.is_available AS is_available,
      c.name AS category,
      s.id AS size_id,
      s.label AS size,
      s.oz AS oz,
      s.temperature AS temperature,
       mis.price AS price,

       -- Same low-stock rule as /api/menu: one recipe ingredient at or below
      -- its restock threshold is enough
      EXISTS (
        SELECT 1
        FROM recipes r
        JOIN ingredients ing ON ing.id = r.ingredient_id
        WHERE r.menu_item_id = mi.id
          AND ing.stock_qty <= ing.restock_threshold
      ) AS is_low_stock,
       -- Get ingredient names for this menu item
       COALESCE(
         json_agg(ing.name) FILTER (WHERE ing.id IS NOT NULL),
         '[]'::json
       ) AS ingredients
    FROM menu_items AS mi
    JOIN categories AS c ON mi.category_id = c.id
    JOIN menu_item_sizes AS mis ON mi.id = mis.menu_item_id
    JOIN sizes AS s ON mis.size_id = s.id
    LEFT JOIN recipes r ON r.menu_item_id = mi.id
    LEFT JOIN ingredients ing ON ing.id = r.ingredient_id
    WHERE mi.id = $1 AND mi.deleted_at IS NULL
    GROUP BY mi.id, mi.name, mi.image_url, mi.is_available, c.name, s.id, s.label, s.oz, s.temperature, mis.price
    ORDER BY s.id;
    `,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const rows: MenuRow[] = result.rows;
  const first = rows[0];

  return {
    itemId: first.item_id,
    itemName: first.item_name,
    itemImg: first.item_img,
    category: first.category,
    isAvailable: first.is_available,
    isLowStock: first.is_low_stock,
    ingredients: first.ingredients ?? [],
    sizes: rows.map((row) => ({
      sizeId: row.size_id,
      size: row.size,
      oz: row.oz === null ? null : Number(row.oz),
      temperature: row.temperature,
      price: Number(row.price),
    })),
    type: 'menu_item',
    uniqueKey: first.item_id,
  };
}

async function fetchAddOn(id: number): Promise<MenuItem | null> {
  const result = await pool.query(
    `
    SELECT
      id AS item_id,
      name AS item_name,
      image_url AS item_img,
      is_available AS is_available,
      'Add-ons' AS category,
      price,
      stock_qty,
      restock_threshold,
      (stock_qty <= restock_threshold) AS is_low_stock
    FROM add_ons
    WHERE id = $1 AND deleted_at IS NULL
    `,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    itemId: row.item_id,
    itemName: row.item_name,
    itemImg: row.item_img,
    category: row.category,
    isAvailable: row.is_available,
    isLowStock: row.is_low_stock,
    ingredients: [],
    sizes: [{
      sizeId: 0,
      size: 'Regular',
      oz: null,
      temperature: null,
      price: Number(row.price),
    }],
    type: 'addon',
    uniqueKey: -row.item_id,
    stockQty: Number(row.stock_qty),
    restockThreshold: Number(row.restock_threshold),
  };
}

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
    // Try menu item first
    let item = await fetchMenuItem(id);
    
    // If not found, try add-on
    if (!item) {
      item = await fetchAddOn(id);
    }

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

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

  // Explicit type from query param to avoid ID collision between menu_items and add_ons
  const isAddon = request.nextUrl.searchParams.get("type") === "addon";

  const client = await pool.connect();
  try {
    const body = await request.json();
    const { name, categoryId, imageUrl, isAvailable, sizes, recipes, stockQty, restockThreshold } = body;

    // Same check as POST /api/menu: only an uploaded file, an http(s) link, or
    // a /public path is storable
    const imageError = validateImageValue(imageUrl);
    if (imageError) {
      return NextResponse.json({ error: imageError }, { status: 400 });
    }

    await client.query("BEGIN");

    if (isAddon) {
      // Update add-on
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name);
      }
      if (sizes?.[0]?.price !== undefined) {
        updates.push(`price = $${paramIndex++}`);
        values.push(Number(sizes[0].price));
      }
      if (imageUrl !== undefined) {
        updates.push(`image_url = $${paramIndex++}`);
        values.push(imageUrl);
      }
      if (isAvailable !== undefined) {
        updates.push(`is_available = $${paramIndex++}`);
        values.push(isAvailable);
      }
      if (stockQty !== undefined) {
        updates.push(`stock_qty = $${paramIndex++}`);
        values.push(Number(stockQty));
      }
      if (restockThreshold !== undefined) {
        updates.push(`restock_threshold = $${paramIndex++}`);
        values.push(Number(restockThreshold));
      }

      if (updates.length > 0) {
        values.push(id);
        await client.query(
          `UPDATE add_ons SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
          values
        );
      }
    } else {
      // Update menu item (existing logic)
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

      if (Array.isArray(recipes)) {
        await client.query(`DELETE FROM recipes WHERE menu_item_id = $1`, [id]);
        for (const r of recipes) {
          const { ingredientId, quantityNeeded, sizeId } = r;
          if (!ingredientId || quantityNeeded === undefined || Number(quantityNeeded) <= 0) {
            throw new Error('Invalid recipe: ingredientId and quantityNeeded > 0 are required');
          }
          const sizeIdValue = sizeId === null || sizeId === '' ? null : Number(sizeId);
          await client.query(
            `
            INSERT INTO recipes (menu_item_id, size_id, ingredient_id, quantity_needed)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (menu_item_id, COALESCE(size_id, 0), ingredient_id)
            DO UPDATE SET quantity_needed = EXCLUDED.quantity_needed
            `,
            [
              id,
              sizeIdValue,
              Number(ingredientId),
              Number(quantityNeeded)
            ]
          );
        }
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

// Soft delete: hides the item everywhere but keeps the row so past orders and reports stay correct
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  const id = Number(itemId);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid itemId" }, { status: 400 });
  }

  const table = request.nextUrl.searchParams.get("type") === "addon" ? "add_ons" : "menu_items";

  try {
    const result = await pool.query(
      `UPDATE ${table} SET deleted_at = NOW(), is_available = FALSE
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete menu item:", error);
    return NextResponse.json({ error: "Failed to delete menu item" }, { status: 500 });
  }
}