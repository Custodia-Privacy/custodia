/**
 * NextAuth.js v5 route handler.
 * Handles all auth routes: /api/auth/signin, /api/auth/callback, etc.
 */
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
