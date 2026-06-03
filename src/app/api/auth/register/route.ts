import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { registerUser } from "@/server/services/auth-service";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const user = await registerUser(parsed.data);

    return NextResponse.json(
      { id: user.id, name: user.name, email: user.email },
      { status: 201 },
    );
  } catch (error) {
    console.error("[register] Error:", error);
    const message = error instanceof Error ? error.message : "Registration failed";
    const status = message.includes("already exists") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
