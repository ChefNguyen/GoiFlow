import { describe, expect, it } from "vitest";
import type { AuthEnv } from "@/server/auth/env";
import { getEnabledAuthProviderDescriptors } from "@/server/auth/providers";

const baseEnv: AuthEnv = {
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/goiflow?schema=public",
  AUTH_SECRET: "goiflow-local-auth-secret",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  GITHUB_ID: undefined,
  GITHUB_SECRET: undefined,
  GOOGLE_CLIENT_ID: undefined,
  GOOGLE_CLIENT_SECRET: undefined,
};

describe("getEnabledAuthProviderDescriptors", () => {
  it("returns an empty list when no provider credentials are configured", () => {
    expect(getEnabledAuthProviderDescriptors(baseEnv)).toEqual([]);
  });

  it("returns enabled providers when credentials exist", () => {
    const providers = getEnabledAuthProviderDescriptors({
      ...baseEnv,
      GITHUB_ID: "github-id",
      GITHUB_SECRET: "github-secret",
      GOOGLE_CLIENT_ID: "google-id",
      GOOGLE_CLIENT_SECRET: "google-secret",
    });

    expect(providers).toEqual([
      { id: "github", label: "GitHub" },
      { id: "google", label: "Google" },
    ]);
  });
});
