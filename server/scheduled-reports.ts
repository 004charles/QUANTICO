import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { generateReportArtifact, getReportByScheduleTaskUid } from "./reports";
import { getCurrentOrganization } from "./db";

/** Cron-only handler. It resolves the report exclusively from the platform task uid. */
export async function generateScheduledReport(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const report = await getReportByScheduleTaskUid(user.taskUid);
    if (!report) return res.json({ ok: true, skipped: "orphan" });
    const organization = await getCurrentOrganization({ ...user, id: report.organizationId });
    const artifact = await generateReportArtifact(report, organization.name);
    return res.json({ ok: true, reportId: report.id, artifact, generatedAt: new Date().toISOString() });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: detail, context: { url: req.originalUrl }, timestamp: new Date().toISOString() });
  }
}
