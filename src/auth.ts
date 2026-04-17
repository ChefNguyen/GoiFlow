import NextAuth from "next-auth";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/server/auth/config";

const authHandler = NextAuth(authOptions);

export { authHandler as GET, authHandler as POST };

export function auth() {
  return getServerSession(authOptions);
}
