// Store hours settings: GET current hours, PUT new hours (owner)
import { NextResponse } from "next/server";
import pool from "@/app/lib/db";

async function ensureSettingsRow() {
  // Create table if it doesn't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS store_settings (
      id SERIAL PRIMARY KEY,
      opening_time TIME NOT NULL DEFAULT '08:00:00',
      closing_time TIME NOT NULL DEFAULT '20:00:00',
      system_down BOOLEAN NOT NULL DEFAULT FALSE,
      system_down_message TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Try to add system_down column if it doesn't exist (for backward compatibility)
  try {
    await pool.query(`
      ALTER TABLE store_settings
      ADD COLUMN system_down BOOLEAN NOT NULL DEFAULT FALSE
    `);
  } catch (err) {
    if (err.code !== '42701') {
      throw err;
    }
    // Column already exists, ignore
  }

  // Try to add system_down_message column if it doesn't exist
  try {
    await pool.query(`
      ALTER TABLE store_settings
      ADD COLUMN system_down_message TEXT
    `);
  } catch (err) {
    if (err.code !== '42701') {
      throw err;
    }
    // Column already exists, ignore
  }

  // Insert default row if no settings exist
  await pool.query(`
    INSERT INTO store_settings (opening_time, closing_time, system_down)
    SELECT '08:00:00', '20:00:00', FALSE
    WHERE NOT EXISTS (SELECT 1 FROM store_settings);
  `);
}

export async function GET() {
  try {
    await ensureSettingsRow();
    const result = await pool.query(
      "SELECT opening_time, closing_time, system_down, system_down_message FROM store_settings ORDER BY id DESC LIMIT 1"
    );
    const { opening_time, closing_time, system_down, system_down_message } = result.rows[0];
    return NextResponse.json({
      opening_time: String(opening_time),
      closing_time: String(closing_time),
      system_down: Boolean(system_down),
      system_down_message: system_down_message ?? null,
    });
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await ensureSettingsRow();
    const { opening_time, closing_time, system_down, system_down_message } = await request.json();

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
       SET opening_time = $1, closing_time = $2, system_down = $3, system_down_message = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = (SELECT id FROM store_settings ORDER BY id DESC LIMIT 1)`,
      [`${opening_time}:00`, `${closing_time}:00`, !!system_down, system_down_message ?? null]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }

    return NextResponse.json({ opening_time, closing_time, system_down: !!system_down, system_down_message: system_down_message ?? null });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}