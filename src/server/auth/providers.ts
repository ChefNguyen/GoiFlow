import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { env, type AuthEnv } from "@/server/auth/env";
import { verifyOtp } from "@/server/services/auth-service";

const CREDENTIALS_PROVIDER_ID = "credentials";

function getCredentialsProvider() {
  return CredentialsProvider({
    id: CREDENTIALS_PROVIDER_ID,
    name: "Sign in",
    credentials: {
      email: { label: "Email", type: "email" },
      otp: { label: "OTP", type: "text" },
    },
    async authorize(credentials) {
      return verifyOtp(credentials?.email, credentials?.otp);
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

  const googleProvider =
    input.GOOGLE_CLIENT_ID && input.GOOGLE_CLIENT_SECRET
      ? GoogleProvider({
          clientId: input.GOOGLE_CLIENT_ID,
          clientSecret: input.GOOGLE_CLIENT_SECRET,
          allowDangerousEmailAccountLinking: true,
        })
      : null;

  if (googleProvider) {
    providers.push(googleProvider);
  }

  const facebookProvider =
    input.FACEBOOK_APP_ID && input.FACEBOOK_APP_SECRET
      ? FacebookProvider({
          clientId: input.FACEBOOK_APP_ID,
          clientSecret: input.FACEBOOK_APP_SECRET,
          allowDangerousEmailAccountLinking: true,
        })
      : null;

  if (facebookProvider) {
    providers.push(facebookProvider);
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

