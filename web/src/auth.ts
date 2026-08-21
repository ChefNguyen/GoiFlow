import NextAuth, { type NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET || "goiflow-local-auth-secret",
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        try {
          const backendUrl = process.env.BACKEND_API_URL || "http://localhost:8080/api/v1";
          const res = await fetch(`${backendUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password || "",
            }),
          });
          if (!res.ok) return null;
          const user = await res.json();
          return { id: user.id, name: user.name, email: user.email, image: user.image };
        } catch {
          return null;
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET
      ? [
          FacebookProvider({
            clientId: process.env.FACEBOOK_APP_ID,
            clientSecret: process.env.FACEBOOK_APP_SECRET,
          }),
        ]
      : []),
  ],
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
        (session.user as any).id = String(token.id ?? "");
      }
      return session;
    },
  },
};

const authHandler = NextAuth(authOptions);

export { authHandler as GET, authHandler as POST };

export function auth() {
  return getServerSession(authOptions);
}
