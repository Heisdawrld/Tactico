import { NextResponse } from "next/server";
import { db } from "@tactico/database";
export async function GET() {
  try {
    const players = await db.query(`
      SELECT p.*, pe.first_name, pe.last_name, pe.date_of_birth, pe.nation_code
      FROM players p JOIN people pe ON p.person_id = pe.id LIMIT 50
    `);
    return NextResponse.json(players);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 });
  }
}
