/**
 * Idempotent demo data for the signed-in user's organization.
 *
 * Usage:
 *   SEED_USER_EMAIL=you@example.com npx prisma db seed
 *   # or
 *   npm run db:seed
 *
 * Requires an existing user (sign up once in the app first).
 */
import { PrismaClient } from "@prisma/client";
import { DEFAULT_BANNER_CONFIG } from "../src/lib/banner-defaults";

const prisma = new PrismaClient();

const MARKER_DOMAIN = "demo-seed.custodia.local";

async function main() {
  const email = process.env.SEED_USER_EMAIL?.trim().toLowerCase();
  if (!email) {
    console.log(
      "[seed] Skipping: set SEED_USER_EMAIL to the email you used at signup.\n" +
        "  Example: SEED_USER_EMAIL=admin@example.com npm run db:seed\n" +
        "  See docs/DATA-POPULATION.md",
    );
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(
      `[seed] No user with email "${email}". Create an account at /signup first, then re-run.`,
    );
    process.exit(1);
  }

  const membership = await prisma.orgMember.findFirst({
    where: { userId: user.id },
    include: { org: true },
  });

  let orgId: string;
  if (!membership) {
    const org = await prisma.organization.create({
      data: {
        name: `${user.name ?? "Demo"}'s Organization`,
        slug: `org-${user.id.replace(/-/g, "").slice(0, 12)}`,
        plan: "starter",
        members: { create: { userId: user.id, role: "owner" } },
      },
    });
    orgId = org.id;
    console.log(`[seed] Created organization for ${email}`);
  } else {
    orgId = membership.org.id;
  }

  const existingSite = await prisma.site.findFirst({
    where: { orgId, domain: MARKER_DOMAIN, deletedAt: null },
  });
  if (existingSite) {
    console.log(`[seed] Already seeded (site ${MARKER_DOMAIN}). Nothing to do.`);
    return;
  }

  const site = await prisma.site.create({
    data: {
      orgId,
      domain: MARKER_DOMAIN,
      name: "Demo seed site",
      complianceScore: 78,
      lastScannedAt: new Date(),
    },
  });

  const scan = await prisma.scan.create({
    data: {
      siteId: site.id,
      status: "completed",
      scanType: "full",
      pagesCrawled: 5,
      startedAt: new Date(Date.now() - 3_600_000),
      completedAt: new Date(),
      summary: { trackersFound: 7, issuesFound: 2 },
      complianceScores: {
        overall: 78,
        regulations: {
          gdpr: 76,
          ccpa: 82,
          cpra: 82,
          vcdpa: null,
          ctdpa: null,
          cpa: null,
          ucpa: null,
        },
      },
    },
  });

  await prisma.finding.createMany({
    data: [
      {
        scanId: scan.id,
        siteId: site.id,
        category: "tracker",
        severity: "warning",
        title: "Google Analytics (GA4)",
        description: "Third-party analytics script loaded before consent.",
        recommendation: "Load only after opt-in where required.",
        regulations: ["gdpr", "ccpa"],
        details: { vendor: "Google" },
      },
      {
        scanId: scan.id,
        siteId: site.id,
        category: "cookie",
        severity: "info",
        title: "Session cookie",
        description: "First-party session cookie detected.",
        regulations: ["gdpr"],
        details: {},
      },
    ],
  });

  await prisma.banner.create({
    data: {
      siteId: site.id,
      enabled: true,
      config: DEFAULT_BANNER_CONFIG as object,
    },
  });

  await prisma.policy.create({
    data: {
      siteId: site.id,
      contentMarkdown: "# Privacy Policy\n\nSeeded draft from `prisma/seed.ts`.",
      version: 1,
      basedOnScanId: scan.id,
      generatedAt: new Date(),
    },
  });

  const dsar = await prisma.dsarRequest.create({
    data: {
      orgId,
      siteId: site.id,
      requestType: "access",
      status: "processing",
      jurisdiction: "gdpr",
      requesterName: "Alex Demo",
      requesterEmail: "alex.demo@example.com",
      dueDate: new Date(Date.now() + 20 * 86_400_000),
      receivedAt: new Date(),
    },
  });

  await prisma.dsarActivity.create({
    data: {
      requestId: dsar.id,
      action: "request_received",
      details: { source: "seed" },
      actor: "system",
    },
  });

  await prisma.assessment.create({
    data: {
      orgId,
      title: "Marketing personalization rollout",
      description: "Seeded PIA record",
      projectType: "marketing_campaign",
      status: "in_progress",
      riskLevel: "medium",
    },
  });

  const storeDb = await prisma.dataStore.create({
    data: {
      orgId,
      name: "Primary PostgreSQL",
      type: "database",
      provider: "AWS RDS",
      location: "us-east-1",
      sensitivity: "pii",
      piiFields: ["email", "name", "phone"] as unknown as object,
    },
  });

  const storeStripe = await prisma.dataStore.create({
    data: {
      orgId,
      name: "Stripe",
      type: "payment_processor",
      provider: "Stripe",
      sensitivity: "sensitive_pii",
      piiFields: ["cardholder", "email"] as unknown as object,
      lastSyncedAt: new Date(),
    },
  });

  await prisma.dataFlow.create({
    data: {
      orgId,
      sourceId: storeDb.id,
      targetId: storeStripe.id,
      purpose: "Payment processing",
      legalBasis: "contract",
      crossBorder: false,
      discoveredBy: "seed",
      verified: true,
    },
  });

  await prisma.vendor.create({
    data: {
      orgId,
      name: "Stripe",
      category: "Payments",
      website: "https://stripe.com",
      dataShared: ["email", "billing_address"],
      riskLevel: "medium",
      complianceStatus: "compliant",
      lastReviewedAt: new Date(),
    },
  });

  await prisma.preferenceCenter.create({
    data: {
      orgId,
      siteId: site.id,
      name: "Main preference center",
      config: {
        categories: [
          { key: "marketing", name: "Marketing", required: false },
          { key: "product", name: "Product updates", required: false },
        ],
      },
      publishedConfig: {
        categories: [
          { key: "marketing", name: "Marketing", required: false },
          { key: "product", name: "Product updates", required: false },
        ],
      },
      publishedAt: new Date(),
    },
  });

  await prisma.agentRun.create({
    data: {
      orgId,
      agentType: "compliance_monitor",
      trigger: "seed",
      status: "completed",
      input: { source: "seed" },
      output: { message: "Baseline compliance snapshot recorded (seed)." },
      tokensUsed: 1200,
      costCents: 1,
      startedAt: new Date(Date.now() - 120_000),
      completedAt: new Date(),
    },
  });

  await prisma.alert.create({
    data: {
      orgId,
      siteId: site.id,
      type: "new_tracker",
      title: "New tracker detected (seed)",
      message: "Demo alert row for dashboard activity feed.",
      severity: "warning",
    },
  });

  console.log(
    `[seed] Done. Site ${MARKER_DOMAIN}, scan, findings, DSAR, PIA, data map, vendor, preferences, agent run, alert.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
