import { z } from "zod";
import { approvedMetrics, validateReadOnlySql } from "./analytics-sql";
import { readApprovedMetric } from "./analytics-read-model";
import { getBusinessAiProvider } from "./ai/provider";
import { assessAiInputSafety } from "./ai/input-guard";
import { buildAnalyticalEnhancements } from "./ai/analytical-context";
import { importDataset, listImportedDatasets } from "./data-imports";
import { createReport, listReports } from "./reports";
import { detectLatestMetricAnomaly } from "./anomaly-detection";
import { getCurrentOrganization, writeAnalyticalQueryAudit } from "./db";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  organization: router({
    current: publicProcedure.query(async ({ ctx }) => getCurrentOrganization(ctx.user)),
  }),
  analytics: router({
    metric: protectedProcedure
      .input(z.object({ metric: z.enum(approvedMetrics) }))
      .query(async ({ ctx, input }) => {
        const organization = await getCurrentOrganization(ctx.user);
        if (!organization.id) return { organization, points: [], source: "demo" as const, state: "empty" as const, message: "Conecte uma fonte de dados para consultar métricas da organização." };
        const result = await readApprovedMetric(input.metric, organization.id);
        return { organization, ...result, source: "connected" as const };
      }),
    latestRevenueAnomaly: protectedProcedure.query(async ({ ctx }) => {
      const organization = await getCurrentOrganization(ctx.user);
      if (!organization.id) return { state: "demo" as const, anomaly: null };
      const revenue = await readApprovedMetric("revenue", organization.id);
      if (revenue.state !== "ready") return { state: revenue.state, anomaly: null };
      return { state: "ready" as const, anomaly: detectLatestMetricAnomaly(revenue.points) };
    }),
    /** Validates a candidate query and writes an organization-scoped audit record. It never executes raw SQL. */
    validateReadQuery: protectedProcedure
      .input(z.object({ requestText: z.string().min(1).max(1_000), statement: z.string().min(1).max(10_000) }))
      .mutation(async ({ ctx, input }) => {
        const organization = await getCurrentOrganization(ctx.user);
        const validation = validateReadOnlySql(input.statement);
        if (organization.id) {
          await writeAnalyticalQueryAudit({
            organizationId: organization.id,
            userId: ctx.user.id,
            requestText: input.requestText,
            statement: input.statement,
            status: validation.allowed ? "accepted" : "rejected",
            rejectionReason: validation.allowed ? undefined : validation.reason,
          });
        }
        return validation;
      }),
  }),
  ai: router({
    executiveSummary: protectedProcedure.query(async ({ ctx }) => {
      const organization = await getCurrentOrganization(ctx.user);
      if (!organization.id) return { state: "demo" as const, summary: "Conecte uma fonte de dados para gerar o resumo executivo da sua organização." };
      const revenue = await readApprovedMetric("revenue", organization.id);
      const sales = await readApprovedMetric("sales", organization.id);
      if (revenue.state !== "ready" && sales.state !== "ready") return { state: "waiting_for_data" as const, summary: revenue.message || sales.message || "Não existem métricas suficientes para gerar o resumo executivo." };
      try {
        const answer = await getBusinessAiProvider().analyze({
          question: "Produza um resumo executivo conciso, destacando tendência, principal risco e a próxima melhor ação.",
          organizationName: organization.name,
          industry: organization.industry,
          metricContext: JSON.stringify({ revenue: revenue.points, sales: sales.points }),
        });
        return { state: "ready" as const, summary: answer.answer, insights: answer.insights, recommendation: answer.recommendations[0] };
      } catch {
        return { state: "failed" as const, summary: "Não foi possível gerar o resumo executivo agora. As métricas conectadas permanecem disponíveis para análise." };
      }
    }),
    ask: protectedProcedure
      .input(z.object({ question: z.string().trim().min(3).max(1_000) }))
      .mutation(async ({ ctx, input }) => {
        const safety = assessAiInputSafety(input.question);
        if (!safety.safe) {
          return {
            mode: "blocked" as const,
            answer: "Não posso processar esse pedido porque ele ultrapassa os limites de segurança da sua organização.",
            insights: [safety.reason],
            recommendations: ["Reformule a pergunta para uma análise de métricas autorizadas da organização atual."],
            suggestedChart: "none" as const,
            confidenceNote: "Nenhuma fonte de dados, credencial ou provedor de IA foi consultado.",
          };
        }
        const organization = await getCurrentOrganization(ctx.user);
        if (!organization.id) {
          return {
            mode: "demo" as const,
            answer: "A sua organização ainda está em modo de demonstração. Conecte uma fonte de dados para receber análises baseadas no seu negócio.",
            insights: ["Nenhuma fonte analítica conectada."],
            recommendations: ["Importe um ficheiro CSV, XLSX ou JSON na Central de dados."],
            suggestedChart: "none" as const,
            confidenceNote: "Sem dados conectados, não é possível produzir uma conclusão quantitativa.",
          };
        }
        const revenue = await readApprovedMetric("revenue", organization.id);
        const sales = await readApprovedMetric("sales", organization.id);
        const hasConnectedData = revenue.state === "ready" || sales.state === "ready";
        if (!hasConnectedData) {
          return {
            mode: "waiting_for_data" as const,
            answer: "Ainda não existem métricas analíticas suficientes para responder com segurança a essa pergunta.",
            insights: [revenue.message || sales.message || "Não foram encontradas métricas no período."],
            recommendations: ["Conecte uma fonte de dados ou importe um ficheiro na Central de dados.", "Depois, peça uma comparação ou investigação diretamente nesta conversa."],
            suggestedChart: "none" as const,
            confidenceNote: "O Quantico AI só gera conclusões quantitativas quando há métricas autorizadas disponíveis.",
          };
        }
        const enhancements = buildAnalyticalEnhancements(revenue.points);
        const metricContext = JSON.stringify({ revenue: revenue.points, sales: sales.points, comparison: enhancements.comparison });
        const response = await getBusinessAiProvider().analyze({
          question: input.question,
          organizationName: organization.name,
          industry: organization.industry,
          metricContext,
        });
        return { mode: "connected" as const, ...response, ...enhancements };
      }),
  }),
  data: router({
    listImports: protectedProcedure.query(async ({ ctx }) => {
      const organization = await getCurrentOrganization(ctx.user);
      if (!organization.id) return [];
      return listImportedDatasets(organization.id);
    }),
    importFile: protectedProcedure
      .input(z.object({ fileName: z.string().min(1).max(255), contentType: z.string().min(1).max(120), contentBase64: z.string().min(4).max(12_000_000) }))
      .mutation(async ({ ctx, input }) => {
        const organization = await getCurrentOrganization(ctx.user);
        if (!organization.id) throw new Error("Inicie sessão para importar dados na sua organização.");
        return importDataset({ organizationId: organization.id, ...input });
      }),
  }),
  reports: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const organization = await getCurrentOrganization(ctx.user);
      if (!organization.id) return [];
      return listReports(organization.id);
    }),
    create: protectedProcedure
      .input(z.object({ name: z.string().trim().min(3).max(160), category: z.enum(["executive", "financial", "commercial"]), cadence: z.enum(["daily", "weekly", "monthly", "manual"]) }))
      .mutation(async ({ ctx, input }) => {
        const organization = await getCurrentOrganization(ctx.user);
        if (!organization.id) throw new Error("Inicie sessão para criar relatórios na sua organização.");
        return createReport({ organizationId: organization.id, ...input });
      }),
  }),
});

export type AppRouter = typeof appRouter;
