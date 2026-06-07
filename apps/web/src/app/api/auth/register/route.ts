import { NextRequest, NextResponse } from "next/server";
import { auth } from "@tactico/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Register user
    const user = await auth.register({
      name,
      email,
      password,
    });

    if (!user) {
      return NextResponse.json(
        { error: "Failed to register user" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "User registered successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "Registration failed" },
      { status: 400 }
    );
  }
}
