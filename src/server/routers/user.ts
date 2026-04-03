import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, protectedProcedure } from "../trpc";
import { Resend } from "resend";
import { slugify } from "@/lib/utils";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export const userRouter = createRouter({
  /** Get the current authenticated user with their org */
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        notificationSettings: true,
        createdAt: true,
        memberships: {
          include: {
            org: {
              select: {
                id: true,
                name: true,
                slug: true,
                plan: true,
              },
            },
          },
        },
      },
    });

    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

    return {
      ...user,
      org: user.memberships[0]?.org ?? null,
      role: user.memberships[0]?.role ?? null,
    };
  }),

  /** Update user profile */
  update: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.userId },
        data: input,
        select: { id: true, email: true, name: true, image: true },
      });
    }),

  /** Update email notification toggles (stored on the user row as JSON) */
  updateNotificationSettings: protectedProcedure
    .input(
      z.object({
        weeklyScanReports: z.boolean().optional(),
        newTrackerAlerts: z.boolean().optional(),
        dsarDeadlines: z.boolean().optional(),
        policyUpdates: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({
        where: { id: ctx.userId },
        select: { notificationSettings: true },
      });
      const prev =
        existing?.notificationSettings &&
        typeof existing.notificationSettings === "object" &&
        !Array.isArray(existing.notificationSettings)
          ? (existing.notificationSettings as Record<string, boolean>)
          : {};
      const next = { ...prev, ...input };
      return ctx.db.user.update({
        where: { id: ctx.userId },
        data: { notificationSettings: next },
        select: { id: true, notificationSettings: true },
      });
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
      const membership = await ctx.db.orgMember.findFirst({
        where: { userId: ctx.userId },
        include: { org: true },
      });
      if (!membership) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No organization found" });
      }
      if (membership.role === "member") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners and admins can invite team members",
        });
      }

      const org = membership.org;

      // Check team member limits
      const { PLANS } = await import("@/lib/stripe");
      const planLimits = PLANS[org.plan as keyof typeof PLANS];
      const memberCount = await ctx.db.orgMember.count({ where: { orgId: org.id } });
      if (memberCount >= planLimits.teamMembers) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Your plan allows up to ${planLimits.teamMembers} team members. Upgrade to add more.`,
        });
      }

      // Check if user already exists
      let invitedUser = await ctx.db.user.findUnique({ where: { email: input.email } });

      if (invitedUser) {
        // Check if already a member
        const existingMembership = await ctx.db.orgMember.findUnique({
          where: { orgId_userId: { orgId: org.id, userId: invitedUser.id } },
        });
        if (existingMembership) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This user is already a member of your organization",
          });
        }

        // Add to org directly
        await ctx.db.orgMember.create({
          data: { orgId: org.id, userId: invitedUser.id, role: input.role },
        });
      } else {
        // Create a placeholder user and add to org
        invitedUser = await ctx.db.user.create({
          data: { email: input.email },
        });
        await ctx.db.orgMember.create({
          data: { orgId: org.id, userId: invitedUser.id, role: input.role },
        });
      }

      // Send invite email
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      try {
        await getResend().emails.send({
          from: "Custodia <noreply@custodia-privacy.com>",
          to: input.email,
          subject: `You've been invited to ${org.name} on Custodia`,
          html: `
            <h2>You've been invited!</h2>
            <p>${ctx.session.user.name ?? ctx.session.user.email} has invited you to join <strong>${org.name}</strong> on Custodia.</p>
            <p>Custodia helps you manage website privacy compliance, cookie consent, and privacy policies.</p>
            <p><a href="${appUrl}/signup?email=${encodeURIComponent(input.email)}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:6px;">Accept Invitation</a></p>
          `,
        });
      } catch (err) {
        console.error("Failed to send invite email:", err);
        // Don't throw — user was added to org, email is secondary
      }
    }),

  /** List all team members in the org */
  listTeamMembers: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(200).default(50),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const membership = await ctx.db.orgMember.findFirst({
        where: { userId: ctx.userId },
      });
      if (!membership) return [];

      return ctx.db.orgMember.findMany({
        where: { orgId: membership.orgId },
        include: {
          user: {
            select: { id: true, email: true, name: true, image: true },
          },
        },
        orderBy: { createdAt: "asc" },
        take: input?.limit ?? 50,
      });
    }),

  /** Create a new organization (for first-time users) */
  createOrg: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check user doesn't already have an org
      const existing = await ctx.db.orgMember.findFirst({
        where: { userId: ctx.userId },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already belong to an organization",
        });
      }

      const slug = slugify(input.name);

      // Ensure unique slug
      const slugExists = await ctx.db.organization.findUnique({ where: { slug } });
      const finalSlug = slugExists ? `${slug}-${Date.now().toString(36)}` : slug;

      const org = await ctx.db.organization.create({
        data: {
          name: input.name,
          slug: finalSlug,
          members: {
            create: { userId: ctx.userId, role: "owner" },
          },
        },
      });

      return org;
    }),

  /** Remove a member from the org (not yourself). Owner: anyone except last owner. Admin: members only. */
  removeTeamMember: protectedProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const caller = await ctx.db.orgMember.findFirst({
        where: { userId: ctx.userId },
      });
      if (!caller) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No organization found" });
      }

      const target = await ctx.db.orgMember.findUnique({
        where: { orgId_userId: { orgId: caller.orgId, userId: input.userId } },
      });
      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
      }
      if (target.userId === ctx.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot remove yourself from the organization here.",
        });
      }

      if (caller.role === "member") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners and admins can remove members",
        });
      }
      if (caller.role === "admin" && (target.role === "owner" || target.role === "admin")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admins cannot remove owners or other admins",
        });
      }

      if (target.role === "owner") {
        const ownerCount = await ctx.db.orgMember.count({
          where: { orgId: caller.orgId, role: "owner" },
        });
        if (ownerCount <= 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot remove the last owner",
          });
        }
      }

      await ctx.db.orgMember.delete({ where: { id: target.id } });
      return { ok: true as const };
    }),

  /** Change role for a non-owner member (owner only). */
  updateTeamMemberRole: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        role: z.enum(["admin", "member"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const caller = await ctx.db.orgMember.findFirst({
        where: { userId: ctx.userId },
      });
      if (!caller || caller.role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the organization owner can change roles",
        });
      }

      const target = await ctx.db.orgMember.findUnique({
        where: { orgId_userId: { orgId: caller.orgId, userId: input.userId } },
      });
      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
      }
      if (target.role === "owner") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Use a future transfer-ownership flow to change owners",
        });
      }

      return ctx.db.orgMember.update({
        where: { id: target.id },
        data: { role: input.role },
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
      });
    }),
});
