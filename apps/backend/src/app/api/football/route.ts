import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get("endpoint");

  if (!endpoint) {
    return NextResponse.json(
      { error: "Missing endpoint parameter" },
      { status: 400 }
    );
  }

  const apiKey = process.env.BZZOIRO_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Bzzoiro API key not configured" },
      { status: 500 }
    );
  }

  try {
    const url = `https://sports.bzzoiro.com/api/v2/${endpoint}`;
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Bzzoiro API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching from Bzzoiro API:", error);
    return NextResponse.json(
      { error: "Failed to fetch data from Bzzoiro API" },
      { status: 500 }
    );
  }
}