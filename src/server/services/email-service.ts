import { env } from "@/server/auth/env";

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const apiKey = env.RESEND_API_KEY;
  const from = env.EMAIL_FROM;

  if (!apiKey) {
    console.warn("==================================================");
    console.warn(`[EMAIL MOCK] Gửi mã OTP đến email ${to}`);
    console.warn(`[EMAIL MOCK] Mã OTP: ${code}`);
    console.warn("==================================================");
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `GoiFlow OTP: ${code}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px; max-width: 500px;">
            <h2 style="color: #3b82f6; margin-bottom: 20px;">Xác thực đăng nhập GoiFlow</h2>
            <p>Xin chào,</p>
            <p>Mã OTP để xác thực đăng nhập của bạn là:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; color: #1f2937; margin: 20px 0;">
              ${code}
            </div>
            <p>Mã này có hiệu lực trong vòng <strong>10 phút</strong>. Nếu không phải bạn thực hiện đăng nhập, vui lòng bỏ qua email này.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #6b7280;">Đây là email tự động từ hệ thống GoiFlow, vui lòng không trả lời.</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send email via Resend: ${response.statusText} - ${errorText}`);
    }
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    throw error;
  }
}
