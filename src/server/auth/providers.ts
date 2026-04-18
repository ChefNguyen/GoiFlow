import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { env, type AuthEnv } from "@/server/auth/env";

const DEV_AUTH_ID = "dev-login";
const DEV_AUTH_LABEL = "Dev sign in";

function isDevAuthEnabled(input: AuthEnv) {
  return input.ENABLE_DEV_AUTH === "true";
}

function getDevCredentialsProvider() {
  return CredentialsProvider({
    id: DEV_AUTH_ID,
    name: DEV_AUTH_LABEL,
    credentials: {
      dev: { label: "Dev", type: "text" },
    },
    async authorize() {
      return {
        id: "dev-user",
        name: "Dev User",
        email: "dev@localhost",
      };
    },
  });
}

function getProviderLabel(providerId: string, fallback: string) {
  return providerId === DEV_AUTH_ID ? DEV_AUTH_LABEL : fallback;
}

function getProviderId(providerId: string) {
  return providerId === "credentials" ? DEV_AUTH_ID : providerId;
}

type ProviderDescriptor = {
  id: string;
  name: string;
};

function getOAuthProviders(input: AuthEnv): ProviderDescriptor[] {
  const providers: ProviderDescriptor[] = [];

  const githubProvider =
    input.GITHUB_ID && input.GITHUB_SECRET
      ? GitHubProvider({
          clientId: input.GITHUB_ID,
          clientSecret: input.GITHUB_SECRET,
        })
      : null;

  if (githubProvider) {
    providers.push(githubProvider);
  }

  const googleProvider =
    input.GOOGLE_CLIENT_ID && input.GOOGLE_CLIENT_SECRET
      ? GoogleProvider({
          clientId: input.GOOGLE_CLIENT_ID,
          clientSecret: input.GOOGLE_CLIENT_SECRET,
        })
      : null;

  if (googleProvider) {
    providers.push(googleProvider);
  }

  return providers;
}

export { DEV_AUTH_ID, isDevAuthEnabled };

export interface EnabledAuthProvider {
  id: string;
  label: string;
}

export function getEnabledAuthProviders(input: AuthEnv = env) {
  const providers = [...getOAuthProviders(input)];

  if (isDevAuthEnabled(input)) {
    providers.unshift(getDevCredentialsProvider());
  }

  return providers;
}

export function getEnabledAuthProviderDescriptors(
  input: AuthEnv = env,
): EnabledAuthProvider[] {
  return getEnabledAuthProviders(input).map((provider) => ({
    id: getProviderId(provider.id),
    label: getProviderLabel(provider.id, provider.name),
  }));
}

export function hasOAuthProviders(input: AuthEnv = env) {
  return getOAuthProviders(input).length > 0;
}
