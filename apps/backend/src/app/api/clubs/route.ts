import { NextResponse } from "next/server";
import { db } from "@tactico/database";
export async function GET() {
  try {
    const clubs = await db.query("SELECT * FROM clubs LIMIT 50");
    return NextResponse.json(clubs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch clubs" }, { status: 500 });
  }
}
