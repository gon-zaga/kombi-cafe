import pool from "@/app/lib/db";
import { MenuRow, MenuItem } from "@/app/lib/types";

// Returns menu items grouped with their sizes; ?all=true includes unavailable items (owner view)
export async function GET(request: Request) {
  const all = new URL(request.url).searchParams.get("all") === "true";

  // $1 is true for the owner view, so the availability check is skipped
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
      mis.price AS price
    FROM menu_items AS mi
    JOIN categories AS c ON mi.category_id = c.id
    JOIN menu_item_sizes AS mis ON mi.id = mis.menu_item_id
    JOIN sizes AS s ON mis.size_id = s.id
    WHERE ($1::boolean OR mi.is_available = TRUE)
    ORDER BY mi.id, s.id
    `,
    [all]
  );
  const rows: MenuRow[] = result.rows;

  const grouped: Record<number, MenuItem> = {};

  for (const row of rows) {
    if (!grouped[row.item_id]) {
      grouped[row.item_id] = {
        itemId: row.item_id,
        itemName: row.item_name,
        itemImg: row.item_img,
        category: row.category,
        isAvailable: row.is_available,
        ingredients: [],
        sizes: [],
      };
    }

    grouped[row.item_id].sizes.push({
      sizeId: row.size_id,
      size: row.size,
      oz: row.oz === null ? null : Number(row.oz),
      temperature: row.temperature,
      price: Number(row.price),
    });
  }

  return Response.json(Object.values(grouped));
}



// POST = used to create/add a new menu item
export async function POST(request: Request) {

  // Get a database client from the connection pool
  const client = await pool.connect();

  try {

    // Get the data sent by the frontend and convert it from JSON
    const body = await request.json();

    // Get the values from the request
    const { name, categoryId, imageUrl, isAvailable, sizes } = body;


    // Check if the required information was provided
    if (
      !name ||
      !categoryId ||
      !Array.isArray(sizes) ||
      sizes.length === 0
    ) {
      // 400 = Bad Request
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }


    // Start a database transaction
    // Everything after this should succeed, or everything will be undone
    await client.query("BEGIN");


    // Insert the main menu item into the menu_items table
    const itemResult = await client.query(
      `INSERT INTO menu_items (name, category_id, image_url, is_available)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,

      // These values replace $1, $2, $3, and $4
      [
        name,
        categoryId,

        // Use the provided image, or use a default image
        imageUrl || "/drinks/no-drink-image.svg",

        // Use the provided availability, or default to true
        isAvailable ?? true
      ]
    );


    // Get the ID of the newly created menu item
    const menuItemId = itemResult.rows[0].id;


    // Loop through every size that was provided
    // Example: Small, Medium, Large
    for (const s of sizes) {

      // Add each size and its price to menu_item_sizes
      await client.query(
        `INSERT INTO menu_item_sizes (menu_item_id, size_id, price)
         VALUES ($1, $2, $3)`,

        // Connect the size to the menu item and save its price
        [menuItemId, s.sizeId, s.price]
      );
    }


    // Save all the changes permanently
    await client.query("COMMIT");


    // Send the new menu item's ID back to the frontend
    // 201 = Created successfully
    return Response.json(
      { id: menuItemId },
      { status: 201 }
    );


  } catch (error) {

    // If something went wrong, undo all database changes
    await client.query("ROLLBACK");

    // Show the error in the server console
    console.error("Failed to create menu item:", error);

    // Send an error response to the frontend
    return Response.json(
      { error: "Failed to create menu item" },
      { status: 500 }
    );


  } finally {

    // Return the database client back to the connection pool
    client.release();
  }
}

