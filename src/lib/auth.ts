import type { NextAuthConfig } from "next-auth";

/**
 * NextAuth.js v5 configuration.
 * Providers and adapter will be configured once dependencies are installed.
 */
export const authConfig: NextAuthConfig = {
  providers: [
    // TODO: Add Google, GitHub, and Credentials providers
  ],
  pages: {
    signIn: "/login",
    newUser: "/dashboard",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isDashboard = nextUrl.pathname.startsWith("/dashboard") ||
                          nextUrl.pathname.startsWith("/sites") ||
                          nextUrl.pathname.startsWith("/settings");
      if (isDashboard) {
        return isLoggedIn;
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
};
