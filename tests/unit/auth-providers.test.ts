import { describe, expect, it } from "vitest";
import type { AuthEnv } from "@/server/auth/env";
import {
  getEnabledAuthProviderDescriptors,
} from "@/server/auth/providers";

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
  it("always includes the credentials provider", () => {
    const providers = getEnabledAuthProviderDescriptors(baseEnv);
    expect(providers).toHaveLength(1);
    expect(providers[0]).toMatchObject({ id: "credentials", type: "credentials" });
  });

  it("includes OAuth providers when credentials exist", () => {
    const providers = getEnabledAuthProviderDescriptors({
      ...baseEnv,
      GITHUB_ID: "github-id",
      GITHUB_SECRET: "github-secret",
      GOOGLE_CLIENT_ID: "google-id",
      GOOGLE_CLIENT_SECRET: "google-secret",
    });

    expect(providers).toHaveLength(3);
    expect(providers[0]).toMatchObject({ id: "credentials", type: "credentials" });
    expect(providers[1]).toMatchObject({ id: "github", type: "oauth" });
    expect(providers[2]).toMatchObject({ id: "google", type: "oauth" });
  });

  it("does not include GitHub provider when only partial credentials exist", () => {
    const providers = getEnabledAuthProviderDescriptors({
      ...baseEnv,
      GITHUB_ID: "github-id",
      // GITHUB_SECRET missing intentionally
    });
    const ids = providers.map((p) => p.id);
    expect(ids).not.toContain("github");
  });
});
