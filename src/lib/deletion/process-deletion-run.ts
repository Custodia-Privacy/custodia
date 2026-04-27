import type { PrismaClient } from "@prisma/client";
import { getConnectorV2 } from "@/lib/connectors-v2";
import { signReceipt } from "@/lib/deletion/receipt-chain";

/**
 * Executes all tasks for a deletion run (dry-run or live). Appends hash-chained receipts.
 */
export async function processDeletionRun(db: PrismaClient, runId: string): Promise<void> {
  const run = await db.deletionExecutionRun.findFirst({
    where: { id: runId },
    include: { tasks: true },
  });
  if (!run) return;

  await db.deletionExecutionRun.update({
    where: { id: runId },
    data: { status: "running", startedAt: new Date() },
  });

  const lastReceipt = await db.deletionReceipt.findFirst({
    where: { orgId: run.orgId },
    orderBy: { createdAt: "desc" },
  });
  let prevHash: string | null = lastReceipt?.payloadHash ?? null;

  try {
    const tasks = await db.deletionTask.findMany({ where: { runId } });

    for (const task of tasks) {
      const integration = task.integrationId
        ? await db.integration.findFirst({ where: { id: task.integrationId, orgId: run.orgId } })
        : null;
      const connectionId = integration?.nangoConnectionId ?? "";
      const connector = getConnectorV2(task.provider);
      const ref = { provider: task.provider, externalRecordId: task.externalRecordId };

      if (run.dryRun) {
        await db.deletionTask.update({
          where: { id: task.id },
          data: {
            status: "completed",
            result: { dryRun: true, message: "No delete performed" } as object,
          },
        });
        const payload = {
          type: "dry_run_task",
          taskId: task.id,
          provider: task.provider,
          externalId: task.externalRecordId,
        };
        const { payloadHash, signature } = signReceipt(prevHash, payload);
        await db.deletionReceipt.create({
          data: {
            orgId: run.orgId,
            runId: run.id,
            taskId: task.id,
            prevHash,
            payloadHash,
            signature,
            payload: payload as object,
          },
        });
        prevHash = payloadHash;
        continue;
      }

      if (!run.approved) {
        await db.deletionTask.update({
          where: { id: task.id },
          data: { status: "skipped", error: "Run not approved for live deletion" },
        });
        continue;
      }

      if (!connectionId) {
        await db.deletionTask.update({
          where: { id: task.id },
          data: { status: "failed", error: "Missing Nango connection id" },
        });
        continue;
      }

      const result = await connector.deleteRecord({ connectionId, orgId: run.orgId }, ref, "delete");

      await db.deletionTask.update({
        where: { id: task.id },
        data: {
          status: result.ok ? "completed" : "failed",
          result: result as unknown as object,
          error: result.ok ? null : result.message ?? "delete failed",
        },
      });

      const payload = {
        type: "delete_task",
        taskId: task.id,
        provider: task.provider,
        externalId: task.externalRecordId,
        ok: result.ok,
      };
      const { payloadHash, signature } = signReceipt(prevHash, payload);
      await db.deletionReceipt.create({
        data: {
          orgId: run.orgId,
          runId: run.id,
          taskId: task.id,
          prevHash,
          payloadHash,
          signature,
          payload: payload as object,
        },
      });
      prevHash = payloadHash;
    }

    const finalTasks = await db.deletionTask.findMany({ where: { runId } });
    const failed = finalTasks.some((t) => t.status === "failed");

    await db.deletionExecutionRun.update({
      where: { id: runId },
      data: {
        status: failed ? "failed" : "completed",
        completedAt: new Date(),
        summary: { tasks: finalTasks.length, failed } as object,
        ...(failed ? { errorMessage: "One or more deletion tasks failed" } : {}),
      },
    });

    if (run.dsarRequestId && !run.dryRun && run.approved && !failed) {
      await db.dsarRequest.update({
        where: { id: run.dsarRequestId },
        data: {
          status: "fulfilled",
          fulfilledAt: new Date(),
          activities: {
            create: {
              action: "deletion_executed",
              details: { runId, automated: true },
              actor: "system:deletion_executor",
            },
          },
        },
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await db.deletionExecutionRun.update({
      where: { id: runId },
      data: { status: "failed", completedAt: new Date(), errorMessage: msg },
    });
    throw e;
  }
}
