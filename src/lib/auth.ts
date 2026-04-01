/**
 * NextAuth.js v5 configuration.
 * Credentials (email/password) + Google OAuth + GitHub OAuth.
 */
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./db";
import { compare, hash } from "bcryptjs";
import { checkRateLimit } from "./rate-limit";
import { createLogger } from "./logger";

const secLog = createLogger("auth:security");

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db) as any,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Credentials({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        const rl = await checkRateLimit(`login:${email}`, 5, 15 * 60 * 1000);
        if (!rl.ok) {
          secLog.warn("Login rate limited", { email: "[redacted]", remaining: rl.remaining });
          return null;
        }

        const user = await db.user.findUnique({ where: { email } });
        if (!user?.passwordHash) {
          secLog.warn("Login failed: user not found or no password");
          return null;
        }

        const valid = await compare(password, user.passwordHash);
        if (!valid) {
          secLog.warn("Login failed: invalid password");
          return null;
        }

        if (!user.emailVerifiedAt) {
          secLog.warn("Login failed: email not verified");
          return null;
        }

        secLog.info("Login successful");
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    newUser: "/dashboard",
  },
  callbacks: {
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const protectedPrefixes = [
        "/dashboard",
        "/sites",
        "/settings",
        "/dsars",
        "/assessments",
        "/data-map",
        "/vendors",
        "/preferences",
        "/agents",
        "/assistant",
      ];
      const isProtected = protectedPrefixes.some((p) => nextUrl.pathname.startsWith(p));
      if (isProtected) return isLoggedIn;
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
      }
      const membership = await db.orgMember.findFirst({
        where: { userId: token.id as string },
        include: { org: true },
        orderBy: { createdAt: "asc" },
      });
      if (membership) {
        token.orgId = membership.orgId;
        token.orgRole = membership.role;
        token.orgSlug = membership.org.slug;
      }
      return token;
    },
    session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
        (session as any).orgId = token.orgId as string | undefined;
        (session as any).orgRole = token.orgRole as string | undefined;
        (session as any).orgSlug = token.orgSlug as string | undefined;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
    updateAge: 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
});

/** Hash a password for storage */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}
