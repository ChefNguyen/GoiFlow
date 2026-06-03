import { describe, expect, it, vi, beforeEach } from "vitest";
import { registerUser, authenticateUser } from "@/server/services/auth-service";

// Mock Prisma client
vi.mock("@/server/db/client", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  hash: vi.fn(async (pwd: string) => `hashed:${pwd}`),
  compare: vi.fn(async (pwd: string, hash: string) => hash === `hashed:${pwd}`),
}));

import { prisma } from "@/server/db/client";

const mockFindUnique = vi.mocked(prisma.user.findUnique);
const mockCreate = vi.mocked(prisma.user.create);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("registerUser", () => {
  it("creates a user and returns id, name, email", async () => {
    mockFindUnique.mockResolvedValue(null); // email not taken
    mockCreate.mockResolvedValue({
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
    } as never);

    const result = await registerUser({
      name: "Test User",
      email: "test@example.com",
      password: "securepassword",
    });

    expect(result).toMatchObject({
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
    });
    expect(mockCreate).toHaveBeenCalledOnce();
    // Verify passwordHash is passed (not raw password)
    const createArgs = mockCreate.mock.calls[0]?.[0] as { data: { passwordHash: string } };
    expect(createArgs.data.passwordHash).toBe("hashed:securepassword");
  });

  it("throws when email already exists", async () => {
    mockFindUnique.mockResolvedValue({ id: "existing" } as never);

    await expect(
      registerUser({ name: "User", email: "taken@example.com", password: "password123" }),
    ).rejects.toThrow("already exists");
  });

  it("throws when password is too short", async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(
      registerUser({ name: "User", email: "user@example.com", password: "short" }),
    ).rejects.toThrow("8 characters");
  });

  it("normalizes email to lowercase before saving", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: "u1", name: "User", email: "user@example.com" } as never);

    await registerUser({ name: "User", email: "USER@EXAMPLE.COM", password: "securepassword" });

    const createArgs = mockCreate.mock.calls[0]?.[0] as { data: { email: string } };
    expect(createArgs.data.email).toBe("user@example.com");
  });
});

describe("authenticateUser", () => {
  const mockUser = {
    id: "user-1",
    name: "Alice",
    email: "alice@example.com",
    passwordHash: "hashed:correct-password",
  };

  it("returns user when credentials are correct", async () => {
    mockFindUnique.mockResolvedValue(mockUser as never);

    const result = await authenticateUser("alice@example.com", "correct-password");

    expect(result).toMatchObject({ id: "user-1", name: "Alice", email: "alice@example.com" });
  });

  it("returns null when password is wrong", async () => {
    mockFindUnique.mockResolvedValue(mockUser as never);

    const result = await authenticateUser("alice@example.com", "wrong-password");

    expect(result).toBeNull();
  });

  it("returns null when user not found", async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await authenticateUser("unknown@example.com", "any-password");

    expect(result).toBeNull();
  });

  it("returns null when user has no passwordHash (OAuth user)", async () => {
    mockFindUnique.mockResolvedValue({ ...mockUser, passwordHash: null } as never);

    const result = await authenticateUser("alice@example.com", "any-password");

    expect(result).toBeNull();
  });

  it("returns null for non-string inputs", async () => {
    expect(await authenticateUser(null, "password")).toBeNull();
    expect(await authenticateUser("email@example.com", undefined)).toBeNull();
    expect(await authenticateUser(42, "password")).toBeNull();
  });
});
