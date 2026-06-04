import { z } from "zod";

const authEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(16),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("onboarding@resend.dev"),
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),
});

export type AuthEnv = z.infer<typeof authEnvSchema>;

export function parseAuthEnv(input: NodeJS.ProcessEnv = process.env): AuthEnv {
  return authEnvSchema.parse({
    DATABASE_URL:
      input.DATABASE_URL ||
      "postgresql://postgres:postgres@localhost:5432/goiflow?schema=public",
    AUTH_SECRET: input.AUTH_SECRET || "goiflow-local-auth-secret",
    NEXT_PUBLIC_APP_URL: input.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    GOOGLE_CLIENT_ID: input.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: input.GOOGLE_CLIENT_SECRET,
    RESEND_API_KEY: input.RESEND_API_KEY,
    EMAIL_FROM: input.EMAIL_FROM || "onboarding@resend.dev",
    FACEBOOK_APP_ID: input.FACEBOOK_APP_ID,
    FACEBOOK_APP_SECRET: input.FACEBOOK_APP_SECRET,
  });
}

export const env = parseAuthEnv();
