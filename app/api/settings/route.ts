// Store hours settings: GET current hours, PUT new hours (owner)
import { NextResponse } from "next/server";
import pool from "@/app/lib/db";

async function ensureSettingsRow() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS store_settings (
      id SERIAL PRIMARY KEY,
      opening_time TIME NOT NULL DEFAULT '08:00:00',
      closing_time TIME NOT NULL DEFAULT '20:00:00',
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await pool.query(`
    INSERT INTO store_settings (opening_time, closing_time)
    SELECT '08:00:00', '20:00:00'
    WHERE NOT EXISTS (SELECT 1 FROM store_settings);
  `);
}

export async function GET() {
  try {
    await ensureSettingsRow();
    const result = await pool.query(
      "SELECT opening_time, closing_time FROM store_settings ORDER BY id DESC LIMIT 1"
    );
    const { opening_time, closing_time } = result.rows[0];
    return NextResponse.json({
      opening_time: String(opening_time),
      closing_time: String(closing_time),
    });
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await ensureSettingsRow();
    const { opening_time, closing_time } = await request.json();

    if (!opening_time || !closing_time) {
      return NextResponse.json(
        { error: "Opening time and closing time are required" },
        { status: 400 }
      );
    }

    const timeRegex = /^([01][0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(opening_time) || !timeRegex.test(closing_time)) {
      return NextResponse.json(
        { error: "Times must be in HH:MM format (24-hour)" },
        { status: 400 }
      );
    }

    if (opening_time === closing_time) {
      return NextResponse.json(
        { error: "Opening and closing time can't be the same" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE store_settings
       SET opening_time = $1, closing_time = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = (SELECT id FROM store_settings ORDER BY id DESC LIMIT 1)`,
      [`${opening_time}:00`, `${closing_time}:00`]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }

    return NextResponse.json({ opening_time, closing_time });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}