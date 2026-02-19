import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

// Separate auth config that is edge-compatible (no Prisma/Node specifics)
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    // We provide an empty list here or just dummy providers
    // The actual authorization logic for Credentials will be added in auth.ts (Node.js)
    CredentialsProvider({}),
  ],
  callbacks: {
    // Basic JWT/Session callbacks that don't need the DB

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.image = (token.image as string) ?? null;
        session.user.name = (token.name as string) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
