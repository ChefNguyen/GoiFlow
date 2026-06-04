import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateUser, createAndSendOtp } from "@/server/services/auth-service";

const requestOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = requestOtpSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { email, password } = parsed.data;

    // 1. Xác thực thông tin đăng nhập (email & mật khẩu) trước
    const user = await authenticateUser(email, password);
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // 2. Nếu thông tin đúng, tạo và gửi mã OTP
    await createAndSendOtp(email);

    return NextResponse.json({ success: true, email }, { status: 200 });
  } catch (error) {
    console.error("[request-otp] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to request OTP";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
