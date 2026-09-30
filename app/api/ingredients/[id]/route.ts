
// Import the database connection
import pool from "@/app/lib/db";

// Import tools for handling requests and responses
import { NextRequest, NextResponse } from "next/server";


// PATCH = used to update an existing ingredient
export async function PATCH(
  request: NextRequest,

  // Get the "id" from the URL
  // Example: /api/ingredients/5 → id = "5"
  { params }: { params: Promise<{ id: string }> }
) {

  // Get the id from the URL parameters
  const { id } = await params;

  // Convert the id from a string into a number
  const ingredientId = Number(id);

  // Check if the id is actually a valid number
  if (isNaN(ingredientId)) {
    return NextResponse.json(
      { error: "Invalid id" },
      { status: 400 }
    );
  }

  

  try {
    // Get the data sent by the client
    const body = await request.json();

    // Get the values we want to update
    const { name, unit, stockQty, restockThreshold, stockDelta } = body;

    // Update the ingredient in the database.
    // $6::numeric is required; without the cast Postgres infers integer
    // and rejects a decimal restock like 2.5.
    const result = await pool.query(
      `UPDATE ingredients
       SET name = COALESCE($1, name),
           unit = COALESCE($2, unit),
           stock_qty = COALESCE($3, stock_qty) + COALESCE($6::numeric, 0),
           restock_threshold = COALESCE($4, restock_threshold),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, name, unit, stock_qty, restock_threshold`,
      [name ?? null, unit ?? null, stockQty ?? null, restockThreshold ?? null, ingredientId, stockDelta ?? null]
    );


    // If no rows were updated, the ingredient doesn't exist
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Ingredient not found" },
        { status: 404 }
      );
    }


    // Get the updated ingredient from the database result
    const row = result.rows[0];

    // Send the updated ingredient back to the client
    return NextResponse.json({
      id: row.id,
      name: row.name,
      unit: row.unit,
      stockQty: Number(row.stock_qty),
      restockThreshold: Number(row.restock_threshold),
    });


  } catch (error) {

    // 23505 = unique violation, e.g. renaming an ingredient to a name
    // that already exists (ignoring case and padding)
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json(
        { error: "An ingredient with that name already exists" },
        { status: 409 }
      );
    }

    // Show the error in the server console
    console.error("Failed to update ingredient:", error);

    // Send an error response to the client
    return NextResponse.json(
      { error: "Failed to update ingredient" },
      { status: 500 }
    );
  }
}


// DELETE = used to remove an ingredient
export async function DELETE(
  request: NextRequest,

  // Get the ingredient ID from the URL
  { params }: { params: Promise<{ id: string }> }
) {

  // Get the id from the URL
  const { id } = await params;

  // Convert the id from a string into a number
  const ingredientId = Number(id);

  // Check if the ID is valid
  if (isNaN(ingredientId)) {
    return NextResponse.json(
      { error: "Invalid id" },
      { status: 400 }
    );
  }

  


  try {

    // Delete the ingredient whose ID matches the provided ID
    await pool.query(
      `DELETE FROM ingredients WHERE id = $1`,
      [ingredientId]
    );

    // Tell the client that the deletion was successful
    return NextResponse.json({ success: true });


  } catch (error) {

    // 23503 = foreign key violation, meaning a recipe still references
    // this ingredient, so deleting it would break that recipe
    if ((error as { code?: string }).code === '23503') {
      return NextResponse.json(
        { error: "This ingredient is used by a recipe and can't be deleted" },
        { status: 409 }
      );
    }

    // Show the error in the server console
    console.error("Failed to delete ingredient:", error);

    // Send an error response to the client
    return NextResponse.json(
      { error: "Failed to delete ingredient" },
      { status: 500 }
    );
  }
}
