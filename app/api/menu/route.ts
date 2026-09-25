import pool from "@/app/lib/db";
import { MenuRow, MenuItem } from "@/app/lib/types";

export async function GET() {
  const result = await pool.query(`
    -- your SQL query goes here
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
    WHERE mi.is_available = TRUE
    
  `);
  const rows: MenuRow[] = result.rows;

  const grouped: Record<number, MenuItem> = {};

  for (const row of rows) {
    if (!grouped[row.item_id]) {
      grouped[row.item_id] = {
        itemId: row.item_id,
        itemName: row.item_name,
        itemImg: row.item_img,
        category: row.category,
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

  const menuItems: MenuItem[] = Object.values(grouped);

  return Response.json(menuItems);
}