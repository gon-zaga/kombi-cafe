
// Import the database connection (PostgreSQL)
import pool from "@/app/lib/db";

// Import NextResponse so we can send responses from our API
import { NextResponse } from "next/server";

// Defines the structure/type of an ingredient object
export type Ingredient = {
  id: number;
  name: string;
  unit: string;
  stockQty: number;
  restockThreshold: number;
};

// GET = used to retrieve all ingredients
export async function GET() {
  try {
    // Send a SQL query to get all ingredients from the database
    const result = await pool.query(`
      SELECT id, name, unit, stock_qty, restock_threshold
      FROM ingredients
      ORDER BY name
    `);

    // Convert the database rows into the format our application uses
    const ingredients: Ingredient[] = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      unit: row.unit,

      // Convert database values to JavaScript numbers
      stockQty: Number(row.stock_qty),
      restockThreshold: Number(row.restock_threshold),
    }));

    // Send the ingredients back as a JSON response
    return NextResponse.json(ingredients);

  } catch (error) {
    // Show the error in the server console if something goes wrong
    console.error("Failed to fetch ingredients:", error);

    // Send an error response to the client
    return NextResponse.json(
      { error: "Failed to fetch ingredients" },
      { status: 500 }
    );
  }
}

// POST = used to create/add a new ingredient
export async function POST(request: Request) {
  try {
    // Get the data sent by the client and convert it from JSON
    const body = await request.json();

    // Get the ingredient values from the request
    const { name, unit, stockQty, restockThreshold } = body;

    // Check if any required information is missing
    if (!name || !unit || stockQty === undefined || restockThreshold === undefined) {
      // 400 means the request from the client is invalid
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Insert the new ingredient into the database.
    // DO NOTHING + the unique index means a near-duplicate name (same name
    // ignoring case and padding) is refused instead of silently creating a
    // second row. rowCount 0 is how we detect that it was refused.
    const result = await pool.query(
      `INSERT INTO ingredients (name, unit, stock_qty, restock_threshold)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (LOWER(TRIM(name))) DO NOTHING
       RETURNING id, name, unit, stock_qty, restock_threshold`,

      // These values replace $1, $2, $3, and $4
      [name, unit, stockQty, restockThreshold]
    );

    // No row came back, so an ingredient with that name already exists.
    // 409 Conflict is the right code: the request was well-formed, the
    // resource it wanted to create already exists.
    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: `"${name}" is already in the ingredient list` },
        { status: 409 }
      );
    }

    // Get the newly inserted ingredient from the database result
    const row = result.rows[0];

    // Send the newly created ingredient back to the client
    // 201 means "Created successfully"
    return NextResponse.json(
      {
        id: row.id,
        name: row.name,
        unit: row.unit,
        stockQty: Number(row.stock_qty),
        restockThreshold: Number(row.restock_threshold),
      },
      { status: 201 }
    );

  } catch (error) {
    // Show the error in the server console if the insert fails
    console.error("Failed to create ingredient:", error);

    // Send an error response to the client
    return NextResponse.json(
      { error: "Failed to create ingredient" },
      { status: 500 }
    );
  }
}

