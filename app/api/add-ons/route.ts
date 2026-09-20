// app/api/add-ons/route.ts
import { NextResponse } from "next/server";
import pool from "@/app/lib/db";

export type AddOn = {
  addOnsId: number;
  name: string;
  price: number;
  imgUrl: string;
};

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT id AS "addOnsId", name, price, image_url
      FROM add_ons 
      WHERE is_available = true
      ORDER BY name
    `);

    const addOns: AddOn[] = result.rows.map((row) => ({
      addOnsId: row.addOnsId,
      name: row.name,
      price: Number(row.price),
      imgUrl: row.image_url
    }));

    return NextResponse.json(addOns);
  } catch (error) {
    console.error("Failed to fetch add-ons:", error);
    return NextResponse.json(
      { error: "Failed to fetch add-ons" },
      { status: 500 }
    );
  }
}