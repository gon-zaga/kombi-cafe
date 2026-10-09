import { NextResponse } from "next/server";
import pool from "@/app/lib/db";

// Initialize settings table if it doesn't exist
async function initializeSettingsTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS store_settings (
        id SERIAL PRIMARY KEY,
        opening_time TIME NOT NULL DEFAULT '08:00:00',
        closing_time TIME NOT NULL DEFAULT '20:00:00',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Insert default row if no settings exist
    const result = await client.query(
      "INSERT INTO store_settings (opening_time, closing_time) SELECT '08:00:00', '20:00:00' WHERE NOT EXISTS (SELECT 1 FROM store_settings) RETURNING *;"
    );
    
     if (result.rowCount === 0) {
      // Settings already exist, get them
      await client.query("SELECT opening_time, closing_time FROM store_settings LIMIT 1");
    }
  } finally {
    client.release();
  }
}

// GET /api/settings - Retrieve current settings
export async function GET() {
  try {
    await initializeSettingsTable();
    
    const result = await pool.query(
      "SELECT opening_time, closing_time FROM store_settings ORDER BY id DESC LIMIT 1"
    );
    
    if (result.rows.length === 0) {
      // Return defaults if no settings found
      return NextResponse.json({
        opening_time: "08:00:00",
        closing_time: "20:00:00"
      });
    }
    
    const { opening_time, closing_time } = result.rows[0];
    return NextResponse.json({
      opening_time: opening_time.toString(),
      closing_time: closing_time.toString()
    });
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update settings
export async function PUT(request: Request) {
  try {
    await initializeSettingsTable();
    
    const body = await request.json();
    const { opening_time, closing_time } = body;
    
    if (!opening_time || !closing_time) {
      return NextResponse.json(
        { error: "Opening time and closing time are required" },
        { status: 400 }
      );
    }
    
    // Validate time format (HH:MM)
    const timeRegex = /^([01][0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(opening_time) || !timeRegex.test(closing_time)) {
      return NextResponse.json(
        { error: "Times must be in HH:MM format (24-hour)" },
        { status: 400 }
      );
    }
    
    const result = await pool.query(
      "UPDATE store_settings SET opening_time = $1, closing_time = $2, updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT id FROM store_settings ORDER BY id DESC LIMIT 1) RETURNING *",
      [opening_time + ":00", closing_time + ":00"] // Add seconds for TIME type
    );
    
    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Failed to update settings" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      opening_time: opening_time,
      closing_time: closing_time
    });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}