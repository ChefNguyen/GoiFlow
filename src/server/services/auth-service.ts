import { hash, compare } from "bcryptjs";
import { prisma } from "@/server/db/client";

const SALT_ROUNDS = 12;

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type AuthUser = {
  id: string;
  name: string | null;
  email: string | null;
};

export async function registerUser(input: RegisterInput): Promise<AuthUser> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const password = input.password;

  if (!email) throw new Error("Email is required");
  if (!name) throw new Error("Name is required");
  if (password.length < 8) throw new Error("Password must be at least 8 characters");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("An account with this email already exists");

  const passwordHash = await hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      emailVerified: null,
    },
    select: { id: true, name: true, email: true },
  });

  return user;
}

export async function authenticateUser(
  email: unknown,
  password: unknown,
): Promise<AuthUser | null> {
  if (typeof email !== "string" || typeof password !== "string") return null;

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) return null;

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, name: true, email: true, passwordHash: true },
  });

  if (!user || !user.passwordHash) return null;

  const isValid = await compare(password, user.passwordHash);
  if (!isValid) return null;

  return { id: user.id, name: user.name, email: user.email };
}

export async function createAndSendOtp(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) throw new Error("Email is required");

  // Tạo mã OTP 6 chữ số ngẫu nhiên
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 phút hiệu lực

  // Lưu vào database
  await prisma.otpCode.create({
    data: {
      email: normalizedEmail,
      code,
      expiresAt,
    },
  });

  // Gọi email service gửi OTP thật
  const { sendOtpEmail } = await import("@/server/services/email-service");
  await sendOtpEmail(normalizedEmail, code);
}

export async function verifyOtp(
  email: unknown,
  code: unknown,
): Promise<AuthUser | null> {
  if (typeof email !== "string" || typeof code !== "string") return null;

  const normalizedEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();

  if (!normalizedEmail || !cleanCode) return null;

  // Tìm mã OTP chưa sử dụng và chưa hết hạn gần nhất
  const otpRecord = await prisma.otpCode.findFirst({
    where: {
      email: normalizedEmail,
      code: cleanCode,
      expiresAt: { gt: new Date() },
      usedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!otpRecord) return null;

  // Đánh dấu đã sử dụng
  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data: { usedAt: new Date() },
  });

  // Lấy thông tin user
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, name: true, email: true },
  });

  if (!user) return null;

  return { id: user.id, name: user.name, email: user.email };
}

