import { describe, expect, it, vi, beforeEach } from "vitest";
import { createAndSendOtp, verifyOtp } from "@/server/services/auth-service";

// Mock Prisma Client
vi.mock("@/server/db/client", () => ({
  prisma: {
    otpCode: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock Email Service
vi.mock("@/server/services/email-service", () => ({
  sendOtpEmail: vi.fn(async () => {}),
}));

import { prisma } from "@/server/db/client";
import { sendOtpEmail } from "@/server/services/email-service";

const mockOtpCreate = vi.mocked(prisma.otpCode.create);
const mockOtpFindFirst = vi.mocked(prisma.otpCode.findFirst);
const mockOtpUpdate = vi.mocked(prisma.otpCode.update);
const mockUserFindUnique = vi.mocked(prisma.user.findUnique);
const mockSendOtpEmail = vi.mocked(sendOtpEmail);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createAndSendOtp", () => {
  it("generates a 6-digit code, saves to db, and sends email", async () => {
    mockOtpCreate.mockResolvedValue({
      id: "otp-1",
      email: "test@example.com",
      code: "123456",
      expiresAt: new Date(),
      usedAt: null,
      createdAt: new Date(),
    });

    await createAndSendOtp("test@example.com");

    expect(mockOtpCreate).toHaveBeenCalledOnce();
    const createArgs = mockOtpCreate.mock.calls[0]?.[0] as {
      data: { email: string; code: string; expiresAt: Date };
    };
    expect(createArgs.data.email).toBe("test@example.com");
    expect(createArgs.data.code).toMatch(/^\d{6}$/); // 6-digit number
    expect(createArgs.data.expiresAt.getTime()).toBeGreaterThan(Date.now());

    expect(mockSendOtpEmail).toHaveBeenCalledOnce();
    expect(mockSendOtpEmail).toHaveBeenCalledWith("test@example.com", createArgs.data.code);
  });
});

describe("verifyOtp", () => {
  const email = "test@example.com";
  const code = "123456";

  it("returns user and marks otp as used if valid", async () => {
    const mockOtpRecord = {
      id: "otp-1",
      email,
      code,
      expiresAt: new Date(Date.now() + 5000),
      usedAt: null,
      createdAt: new Date(),
    };
    mockOtpFindFirst.mockResolvedValue(mockOtpRecord);
    mockOtpUpdate.mockResolvedValue(mockOtpRecord);
    mockUserFindUnique.mockResolvedValue({
      id: "user-123",
      name: "Bob",
      email,
      emailVerified: null,
      image: null,
      passwordHash: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await verifyOtp(email, code);

    expect(result).toMatchObject({ id: "user-123", name: "Bob", email });
    expect(mockOtpUpdate).toHaveBeenCalledOnce();
    expect(mockOtpUpdate.mock.calls[0]?.[0]).toMatchObject({
      where: { id: "otp-1" },
      data: { usedAt: expect.any(Date) },
    });
  });

  it("returns null if no OTP record matches", async () => {
    mockOtpFindFirst.mockResolvedValue(null);

    const result = await verifyOtp(email, code);

    expect(result).toBeNull();
    expect(mockOtpUpdate).not.toHaveBeenCalled();
  });

  it("returns null if input types are invalid", async () => {
    expect(await verifyOtp(null, code)).toBeNull();
    expect(await verifyOtp(email, undefined)).toBeNull();
  });
});
