import pool from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await pool.query(`SELECT id, label, oz, temperature FROM sizes ORDER BY id`);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch sizes:", error);
    return NextResponse.json({ error: "Failed to fetch sizes" }, { status: 500 });
  }
}


