import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

import { prisma } from "@/lib/db/prisma";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

const emailServer = process.env.EMAIL_SERVER;
const emailFrom = process.env.EMAIL_FROM;

const nextAuthSecret = process.env.NEXTAUTH_SECRET;

const providers: NextAuthOptions["providers"] = [];

// Email is required for the app to function, but we only instantiate the provider
// when configured. This keeps builds from failing when env vars are missing.
if (emailServer && emailFrom) {
  providers.push(
    EmailProvider({
      server: emailServer,
      from: emailFrom,
    })
  );
}

// Google is optional; only enable if configured.
if (googleClientId && googleClientSecret) {
  providers.unshift(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  pages: {
    signIn: "/signin",
  },

  providers,

  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: nextAuthSecret,
  useSecureCookies: process.env.NODE_ENV === "production",

  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.username = (user as unknown as { username?: string | null }).username ?? null;
      }
      return session;
    },
  },
};
