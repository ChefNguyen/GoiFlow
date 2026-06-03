import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { env, type AuthEnv } from "@/server/auth/env";
import { authenticateUser } from "@/server/services/auth-service";

const CREDENTIALS_PROVIDER_ID = "credentials";

function getCredentialsProvider() {
  return CredentialsProvider({
    id: CREDENTIALS_PROVIDER_ID,
    name: "Sign in",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      return authenticateUser(credentials?.email, credentials?.password);
    },
  });
}

function getProviderLabel(providerId: string, fallback: string) {
  return providerId === CREDENTIALS_PROVIDER_ID ? "Sign in" : fallback;
}

function getProviderType(providerId: string) {
  return providerId === CREDENTIALS_PROVIDER_ID ? "credentials" : "oauth";
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

export interface EnabledAuthProvider {
  id: string;
  label: string;
  type: "credentials" | "oauth";
}

export function getEnabledAuthProviders(input: AuthEnv = env) {
  const oauthProviders = getOAuthProviders(input);
  // Credentials provider is always enabled (real DB auth)
  return [getCredentialsProvider(), ...oauthProviders];
}

export function getEnabledAuthProviderDescriptors(
  input: AuthEnv = env,
): EnabledAuthProvider[] {
  return getEnabledAuthProviders(input).map((provider) => ({
    id: provider.id,
    label: getProviderLabel(provider.id, provider.name),
    type: getProviderType(provider.id) as "credentials" | "oauth",
  }));
}

export function hasOAuthProviders(input: AuthEnv = env) {
  return getOAuthProviders(input).length > 0;
}
