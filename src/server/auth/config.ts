import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import { env } from "@/server/auth/env";
import { getEnabledAuthProviders, hasOAuthProviders, isDevAuthEnabled } from "@/server/auth/providers";
import { prisma } from "@/server/db/client";

const useDevAuth = isDevAuthEnabled(env);
const useDatabaseSessions = hasOAuthProviders(env) && !useDevAuth;
const providers = getEnabledAuthProviders(env) as NextAuthOptions["providers"];

export const authOptions: NextAuthOptions = {
  ...(useDatabaseSessions
    ? {
        adapter: PrismaAdapter(prisma),
        session: {
          strategy: "database" as const,
        },
      }
    : {
        session: {
          strategy: "jwt" as const,
        },
      }),
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
    session({ session, user, token }) {
      if (session.user) {
        session.user.id = useDatabaseSessions
          ? user.id
          : String(token.id ?? user?.id ?? "dev-user");
        session.user.activeOrganizationId = null;
      }

      return session;
    },
  },
};
