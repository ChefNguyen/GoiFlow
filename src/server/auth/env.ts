import { z } from "zod";

const authEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(16),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  ENABLE_DEV_AUTH: z.enum(["true", "false"]).optional(),
  GITHUB_ID: z.string().optional(),
  GITHUB_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

export type AuthEnv = z.infer<typeof authEnvSchema>;

export function parseAuthEnv(input: NodeJS.ProcessEnv = process.env): AuthEnv {
  return authEnvSchema.parse({
    DATABASE_URL:
      input.DATABASE_URL ||
      "postgresql://postgres:postgres@localhost:5432/goiflow?schema=public",
    AUTH_SECRET: input.AUTH_SECRET || "goiflow-local-auth-secret",
    NEXT_PUBLIC_APP_URL: input.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    ENABLE_DEV_AUTH: input.ENABLE_DEV_AUTH,
    GITHUB_ID: input.GITHUB_ID,
    GITHUB_SECRET: input.GITHUB_SECRET,
    GOOGLE_CLIENT_ID: input.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: input.GOOGLE_CLIENT_SECRET,
  });
}

export const env = parseAuthEnv();
