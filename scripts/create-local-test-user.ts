/**
 * Creates a verified email/password user for local testing (no verification email).
 * Optionally seeds demo Inventory rows (assets + completed scan + PII findings) so UI is populated.
 *
 * Usage (from repo root `swarm-company/custodia`):
 *   npx tsx scripts/create-local-test-user.ts
 *   SEED_DEMO_INVENTORY=0 npx tsx scripts/create-local-test-user.ts   # user only
 *
 * Do NOT use these credentials in production.
 */
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

/** Must match signup rules: min 12 chars, not in common-password list. */
export const LOCAL_TEST_EMAIL = "local-test@custodia.dev";
export const LOCAL_TEST_PASSWORD = "LocalTest-Custodia-2026!";

async function seedDemoInventory(orgId: string) {
  const marker = await prisma.dataAsset.findFirst({
    where: { orgId, externalRef: "demo:inventory-root" },
  });
  if (marker) return;

  const root = await prisma.dataAsset.create({
    data: {
      orgId,
      parentId: null,
      kind: "source",
      provider: "hubspot",
      name: "HubSpot (demo)",
      externalRef: "demo:inventory-root",
      config: { demo: true },
      status: "active",
    },
  });

  const crm = await prisma.dataAsset.create({
    data: {
      orgId,
      parentId: root.id,
      kind: "data_system",
      provider: "hubspot",
      name: "CRM",
      externalRef: "demo:hubspot:crm",
      config: {},
      status: "active",
    },
  });

  const contactTable = await prisma.dataAsset.create({
    data: {
      orgId,
      parentId: crm.id,
      kind: "table",
      provider: "hubspot",
      name: "Contact",
      externalRef: "Contact",
      config: {},
      status: "active",
    },
  });

  for (const name of ["email", "firstname", "lastname", "phone"]) {
    await prisma.dataAssetField.create({
      data: {
        tableAssetId: contactTable.id,
        name,
        externalRef: name,
      },
    });
  }

  const scan = await prisma.inventoryScanRun.create({
    data: {
      orgId,
      status: "completed",
      trigger: "demo_seed",
      startedAt: new Date(Date.now() - 60_000),
      completedAt: new Date(),
      summary: { demo: true, tables: 1, findings: 3 } as object,
    },
  });

  await prisma.piiFinding.createMany({
    data: [
      {
        orgId,
        scanRunId: scan.id,
        assetId: contactTable.id,
        label: "private_email",
        avgScore: 0.94,
        hitCount: 12,
        evidence: { demo: true } as object,
      },
      {
        orgId,
        scanRunId: scan.id,
        assetId: contactTable.id,
        label: "private_person",
        avgScore: 0.88,
        hitCount: 7,
        evidence: { demo: true } as object,
      },
      {
        orgId,
        scanRunId: scan.id,
        assetId: contactTable.id,
        label: "private_phone",
        avgScore: 0.81,
        hitCount: 4,
        evidence: { demo: true } as object,
      },
    ],
  });

  await prisma.integration.upsert({
    where: {
      orgId_provider: { orgId, provider: "hubspot" },
    },
    create: {
      orgId,
      provider: "hubspot",
      status: "disconnected",
      config: { note: "Connect OAuth in settings to run a live PII scan." } as object,
    },
    update: {},
  });
}

async function main() {
  const passwordHash = await hash(LOCAL_TEST_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email: LOCAL_TEST_EMAIL },
    create: {
      email: LOCAL_TEST_EMAIL,
      name: "Local Test User",
      passwordHash,
      emailVerifiedAt: new Date(),
    },
    update: {
      passwordHash,
      emailVerifiedAt: new Date(),
    },
  });

  let membership = await prisma.orgMember.findFirst({
    where: { userId: user.id },
    include: { org: true },
  });

  if (!membership) {
    const org = await prisma.organization.create({
      data: {
        name: "Local Test Organization",
        slug: `local-dev-${user.id.replace(/-/g, "").slice(0, 10)}`,
        plan: "growth",
        members: { create: { userId: user.id, role: "owner" } },
      },
    });
    membership = await prisma.orgMember.findFirstOrThrow({
      where: { userId: user.id },
      include: { org: true },
    });
    console.log(`[create-local-test-user] Created org: ${org.slug}`);
  }

  const orgId = membership.org.id;

  const wantInventory = process.env.SEED_DEMO_INVENTORY !== "0";
  if (wantInventory) {
    await seedDemoInventory(orgId);
    console.log("[create-local-test-user] Seeded demo Inventory assets + scan + findings.");
  }

  console.log("\n--- Local test login (dev only) ---");
  console.log(`  URL:      ${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login`);
  console.log(`  Email:    ${LOCAL_TEST_EMAIL}`);
  console.log(`  Password: ${LOCAL_TEST_PASSWORD}`);
  console.log("---\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
