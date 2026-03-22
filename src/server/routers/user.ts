import { z } from "zod";
import { createRouter, protectedProcedure } from "../trpc";

export const userRouter = createRouter({
  /** Get the current authenticated user with their org */
  me: protectedProcedure.query(async ({ ctx }) => {
    // TODO: Return user with org membership
    return null;
  }),

  /** Update user profile */
  update: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Update user
      return null;
    }),

  /** Invite a team member to the organization */
  inviteTeamMember: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: z.enum(["admin", "member"]).default("member"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Send invite email via Resend
    }),

  /** List all team members in the org */
  listTeamMembers: protectedProcedure.query(async ({ ctx }) => {
    // TODO: Return org members with user details
    return [];
  }),
});
