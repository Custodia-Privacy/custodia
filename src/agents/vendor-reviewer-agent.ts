/**
 * Vendor Reviewer Agent — evaluates third-party vendors for privacy risk,
 * checks DPA status, and generates compliance assessments.
 */
import type { PrismaClient } from "@prisma/client";
import { BaseAgent } from "./base";

interface VendorReviewerInput {
  vendorId?: string;
}

export class VendorReviewerAgent extends BaseAgent {
  constructor(orgId: string, runId: string, db: PrismaClient) {
    super(orgId, runId, db);
  }

  async execute(input: Record<string, unknown>): Promise<void> {
    const { vendorId } = input as VendorReviewerInput;

    await this.updateStatus("running");
    await this.log("info", `Vendor reviewer started${vendorId ? ` for vendor ${vendorId}` : " for all vendors"}`);

    const vendors = await this.getVendors(vendorId);
    if (vendors.length === 0) {
      await this.log("warn", "No vendors found");
      await this.complete({ message: "No vendors to review", vendorsReviewed: 0 });
      return;
    }

    await this.log("info", `Reviewing ${vendors.length} vendor(s)`);

    let vendorsReviewed = 0;
    let alertsCreated = 0;
    const results: Array<{ vendorId: string; name: string; riskLevel: string; issues: string[] }> = [];

    for (const vendor of vendors) {
      const result = await this.reviewVendor(vendor);
      if (result) {
        vendorsReviewed++;
        results.push(result);

        if (result.riskLevel === "critical" || result.riskLevel === "high") {
          await this.createVendorAlert(vendor, result);
          alertsCreated++;
        }
      }
    }

    await this.log("info", `Reviewed ${vendorsReviewed} vendor(s), created ${alertsCreated} alert(s)`);

    await this.complete({
      vendorsReviewed,
      alertsCreated,
      results,
    });
  }

  private async getVendors(vendorId?: string) {
    const where: Record<string, unknown> = { orgId: this.orgId };
    if (vendorId) where.id = vendorId;

    return this.db.vendor.findMany({
      where,
      select: {
        id: true,
        name: true,
        category: true,
        website: true,
        dpaUrl: true,
        privacyPolicyUrl: true,
        subProcessors: true,
        dataShared: true,
        purposes: true,
        legalBasis: true,
        riskLevel: true,
        lastReviewedAt: true,
      },
    });
  }

  private async reviewVendor(vendor: {
    id: string;
    name: string;
    category: string;
    website: string | null;
    dpaUrl: string | null;
    privacyPolicyUrl: string | null;
    subProcessors: unknown;
    dataShared: unknown;
    purposes: unknown;
    legalBasis: string | null;
  }): Promise<{ vendorId: string; name: string; riskLevel: string; issues: string[] } | null> {
    try {
      const text = await this.callClaude({
        system: `You are a privacy vendor risk assessor. Evaluate a third-party vendor's privacy risk.
Respond with JSON only:
{
  "riskLevel": "low" | "medium" | "high" | "critical",
  "complianceStatus": "compliant" | "partial" | "non_compliant" | "unknown",
  "issues": ["list of specific privacy/compliance issues found"],
  "recommendations": ["list of recommended actions"],
  "reasoning": "brief explanation of the risk assessment"
}

Consider:
- Missing DPA is a high risk for any vendor processing personal data
- Missing privacy policy URL is a red flag
- Sub-processors increase risk scope
- Categories like "analytics", "advertising", "crm" handle sensitive data
- Lack of legal basis documentation is a compliance gap`,
        prompt: `Review this vendor:
Name: ${vendor.name}
Category: ${vendor.category}
Website: ${vendor.website ?? "not provided"}
DPA URL: ${vendor.dpaUrl ?? "not provided"}
Privacy Policy URL: ${vendor.privacyPolicyUrl ?? "not provided"}
Sub-processors: ${vendor.subProcessors ? JSON.stringify(vendor.subProcessors) : "not documented"}
Data shared: ${vendor.dataShared ? JSON.stringify(vendor.dataShared) : "not documented"}
Purposes: ${vendor.purposes ? JSON.stringify(vendor.purposes) : "not documented"}
Legal basis: ${vendor.legalBasis ?? "not documented"}`,
        maxTokens: 1500,
      });

      const parsed = this.parseJSON<{
        riskLevel: string;
        complianceStatus: string;
        issues: string[];
        recommendations: string[];
      }>(text);

      const validRiskLevels = ["low", "medium", "high", "critical"];
      const riskLevel = validRiskLevels.includes(parsed.riskLevel) ? parsed.riskLevel : "medium";

      await this.db.vendor.update({
        where: { id: vendor.id },
        data: {
          riskLevel: riskLevel as "low" | "medium" | "high" | "critical",
          complianceStatus: parsed.complianceStatus,
          lastReviewedAt: new Date(),
        },
      });

      return {
        vendorId: vendor.id,
        name: vendor.name,
        riskLevel,
        issues: parsed.issues ?? [],
      };
    } catch (err) {
      await this.log("warn", `Failed to review vendor ${vendor.name}: ${err instanceof Error ? err.message : "unknown"}`);
      return null;
    }
  }

  private async createVendorAlert(
    vendor: { id: string; name: string },
    result: { riskLevel: string; issues: string[] },
  ): Promise<void> {
    await this.db.alert.create({
      data: {
        orgId: this.orgId,
        type: "vendor_risk",
        title: `${result.riskLevel === "critical" ? "CRITICAL" : "HIGH"} risk vendor: ${vendor.name}`,
        message: `Issues found: ${result.issues.slice(0, 3).join("; ")}${result.issues.length > 3 ? ` (+${result.issues.length - 3} more)` : ""}`,
        severity: result.riskLevel === "critical" ? "critical" : "warning",
      },
    });
  }
}
