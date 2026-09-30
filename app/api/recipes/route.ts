// Lists and creates recipes (which ingredients a menu item consumes, and how much).
// A recipe with size_id NULL applies to every size; a non-null size_id applies
// to that size only and overrides the general row.
import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";

export type Recipe = {
  id: number;
  menuItemId: number;
  sizeId: number | null;
  ingredientId: number;
  ingredientName: string;
  unit: string;
  quantityNeeded: number;
};

// GET = list recipes, optionally filtered by ?menuItemId=
export async function GET(request: NextRequest) {
  const menuItemId = new URL(request.url).searchParams.get("menuItemId");

  try {
    const result = await pool.query(
      `
      SELECT
        r.id,
        r.menu_item_id,
        r.size_id,
        r.ingredient_id,
        r.quantity_needed,
        i.name AS ingredient_name,
        i.unit
      FROM recipes r
      JOIN ingredients i ON i.id = r.ingredient_id
      WHERE ($1::int IS NULL OR r.menu_item_id = $1::int)
      ORDER BY i.name, r.size_id NULLS FIRST;
      `,
      [menuItemId ? Number(menuItemId) : null]
    );

    const recipes: Recipe[] = result.rows.map((row) => ({
      id: row.id,
      menuItemId: row.menu_item_id,
      sizeId: row.size_id,
      ingredientId: row.ingredient_id,
      ingredientName: row.ingredient_name,
      unit: row.unit,
      quantityNeeded: Number(row.quantity_needed),
    }));

    return NextResponse.json(recipes);
  } catch (error) {
    console.error("Failed to fetch recipes:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipes" },
      { status: 500 }
    );
  }
}

// POST = add one recipe row
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { menuItemId, sizeId, ingredientId, quantityNeeded } = body;

    if (
      !menuItemId ||
      !ingredientId ||
      quantityNeeded === undefined ||
      Number(quantityNeeded) <= 0
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      INSERT INTO recipes (menu_item_id, size_id, ingredient_id, quantity_needed)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (menu_item_id, COALESCE(size_id, 0), ingredient_id)
      DO UPDATE SET quantity_needed = EXCLUDED.quantity_needed
      RETURNING id, menu_item_id, size_id, ingredient_id, quantity_needed;
      `,
      [
        Number(menuItemId),
        sizeId ? Number(sizeId) : null,
        Number(ingredientId),
        Number(quantityNeeded),
      ]
    );

    const row = result.rows[0];

    return NextResponse.json(
      {
        id: row.id,
        menuItemId: row.menu_item_id,
        sizeId: row.size_id,
        ingredientId: row.ingredient_id,
        quantityNeeded: Number(row.quantity_needed),
      },
      { status: 201 }
    );
  } catch (error) {
    // 23503 = the item, size or ingredient doesn't exist
    // 23514 = quantity_needed failed its CHECK (quantity_needed > 0)
    const code = (error as { code?: string }).code;
    if (code === "23503" || code === "23514") {
      return NextResponse.json(
        { error: "That item, size, or ingredient doesn't exist, or the quantity is invalid" },
        { status: 400 }
      );
    }

    console.error("Failed to create recipe:", error);
    return NextResponse.json(
      { error: "Failed to create recipe" },
      { status: 500 }
    );
  }
}
