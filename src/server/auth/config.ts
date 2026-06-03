import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import { env } from "@/server/auth/env";
import { getEnabledAuthProviders, hasOAuthProviders } from "@/server/auth/providers";
import { prisma } from "@/server/db/client";

// Always use JWT strategy — sessions are stored in encrypted cookies, not DB.
// PrismaAdapter is only mounted to handle OAuth account linking when OAuth
// providers are configured; it does not affect the session strategy.
const providers = getEnabledAuthProviders(env) as NextAuthOptions["providers"];
const useAdapter = hasOAuthProviders(env);

export const authOptions: NextAuthOptions = {
  ...(useAdapter
    ? { adapter: PrismaAdapter(prisma) }
    : {}),
  session: {
    strategy: "jwt",
  },
  secret: env.AUTH_SECRET,
  providers,
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? "");
        session.user.activeOrganizationId = null;
      }
      return session;
    },
  },
};
