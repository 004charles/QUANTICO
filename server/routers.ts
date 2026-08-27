import { z } from "zod";
import { approvedMetrics, validateReadOnlySql } from "./analytics-sql";
import { readApprovedMetric } from "./analytics-read-model";
import { getBusinessAiProvider } from "./ai/provider";
import { assessAiInputSafety } from "./ai/input-guard";
import { buildAnalyticalEnhancements } from "./ai/analytical-context";
import { importDataset, listImportedDatasets } from "./data-imports";
import { createReport, listReports } from "./reports";
import { generateReportArtifact, getReportForOrganization, listReportArtifacts, persistReportSchedule, setReportScheduleActive } from "./reports";
import { detectLatestMetricAnomaly } from "./anomaly-detection";
import { cronForCadence } from "./report-scheduler";
import { createHeartbeatJob, updateHeartbeatJob } from "./_core/heartbeat";
import { parse as parseCookie } from "cookie";
import { getCurrentOrganization, writeAnalyticalQueryAudit } from "./db";
import { getOrganizationSetup, saveOrganizationSetup, setupDataReadiness, setupGoals, setupSizes } from "./onboarding";
import { connectorTypes, createDataSource, listDataSources, testDataSource } from "./data-connectors";
import { businessFields, listDatasetMappings, saveDatasetMapping } from "./data-mappings";
import { getTopProducts } from "./product-metrics";
import { canManageData, canManageReports, canManageWorkspace, getWorkspacePreferences, listOrganizationMembers, saveWorkspacePreferences, workspaceAreas } from "./workspace-access";
import { actionStatuses, actionTypes, addActionFollowUp, createGrowthAction, listActionFollowUps, listGrowthActions, setGrowthActionStatus, updateGrowthActionResult } from "./growth-actions";
import { alertTypes, createAlertRule, evaluateAlertRules, listAlertEvents, listAlertRules, setAlertRuleActive } from "./alert-rules";
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
    setup: protectedProcedure.query(async ({ ctx }) => {
      const organization = await getCurrentOrganization(ctx.user);
      if (!organization.id) return { organization, profile: null };
      return { organization, profile: await getOrganizationSetup(organization.id) };
    }),
    saveSetup: protectedProcedure
      .input(z.object({ organizationName: z.string().trim().min(2).max(160), industry: z.string().trim().min(2).max(64), companySize: z.enum(setupSizes), primaryGoal: z.enum(setupGoals), dataReadiness: z.enum(setupDataReadiness) }))
      .mutation(async ({ ctx, input }) => {
        const organization = await getCurrentOrganization(ctx.user);
        if (!organization.id) throw new Error("Inicie sessão para configurar a sua organização.");
        if (!canManageWorkspace(organization.membershipRole)) throw new Error("Não tem permissão para alterar as configurações desta organização.");
        const profile = await saveOrganizationSetup({ organizationId: organization.id, ...input });
        return { profile, organization: { ...organization, name: input.organizationName, industry: input.industry } };
      }),
    preferences: protectedProcedure.query(async ({ ctx }) => {
      const organization = await getCurrentOrganization(ctx.user);
      return organization.id ? getWorkspacePreferences(organization.id, ctx.user.id) : { defaultArea: "executive" as const, visibleAreas: workspaceAreas };
    }),
    savePreferences: protectedProcedure.input(z.object({ defaultArea: z.enum(workspaceAreas), visibleAreas: z.array(z.enum(workspaceAreas)).min(1) })).mutation(async ({ ctx, input }) => {
      const organization = await getCurrentOrganization(ctx.user);
      if (!organization.id) throw new Error("Inicie sessão para definir as suas preferências.");
      return saveWorkspacePreferences({ organizationId: organization.id, userId: ctx.user.id, ...input });
    }),
    members: protectedProcedure.query(async ({ ctx }) => {
      const organization = await getCurrentOrganization(ctx.user);
      if (!organization.id) return [];
      if (!canManageWorkspace(organization.membershipRole)) throw new Error("Não tem permissão para ver os membros desta organização.");
      return listOrganizationMembers(organization.id);
    }),
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
    topProducts: protectedProcedure.query(async ({ ctx }) => {
      const organization = await getCurrentOrganization(ctx.user);
      return organization.id ? getTopProducts(organization.id) : [];
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
          currency: organization.currency,
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
        try {
          const response = await getBusinessAiProvider().analyze({
            question: input.question,
            organizationName: organization.name,
            industry: organization.industry,
            currency: organization.currency,
            metricContext,
          });
          return { mode: "connected" as const, ...response, ...enhancements };
        } catch {
          const latest = revenue.points.at(0);
          return {
            mode: "connected" as const,
            answer: latest ? `A análise assistida não está disponível neste momento, mas a última receita autorizada é ${latest.value.toLocaleString("pt-AO")} Kz. Consulte a comparação e o gráfico para confirmar a tendência antes de decidir.` : "A análise assistida não está disponível neste momento. Consulte os indicadores autorizados da sua organização.",
            insights: ["A comparação abaixo é calculada directamente a partir dos indicadores autorizados."],
            recommendations: ["Reveja o período mais recente e priorize uma acção comercial proporcional à variação observada."],
            suggestedChart: "line" as const,
            confidenceNote: "Resposta de contingência baseada somente nas métricas agregadas autorizadas; nenhum dado adicional foi consultado.",
            ...enhancements,
          };
        }
      }),
  }),
  data: router({
    listSources: protectedProcedure.query(async ({ ctx }) => {
      const organization = await getCurrentOrganization(ctx.user);
      return organization.id ? listDataSources(organization.id) : [];
    }),
    createSource: protectedProcedure
      .input(z.object({ name: z.string().trim().min(2).max(160), type: z.enum(connectorTypes), config: z.record(z.string(), z.string().max(1_000)), secret: z.string().max(64_000).optional() }))
      .mutation(async ({ ctx, input }) => {
        const organization = await getCurrentOrganization(ctx.user);
        if (!organization.id) throw new Error("Inicie sessão para criar um conector.");
        if (!canManageData(organization.membershipRole)) throw new Error("Não tem permissão para criar conectores nesta organização.");
        return createDataSource({ organizationId: organization.id, ...input });
      }),
    testSource: protectedProcedure
      .input(z.object({ sourceId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const organization = await getCurrentOrganization(ctx.user);
        if (!organization.id) throw new Error("Inicie sessão para testar um conector.");
        if (!canManageData(organization.membershipRole)) throw new Error("Não tem permissão para testar conectores nesta organização.");
        return testDataSource({ organizationId: organization.id, sourceId: input.sourceId });
      }),
    listImports: protectedProcedure.query(async ({ ctx }) => {
      const organization = await getCurrentOrganization(ctx.user);
      if (!organization.id) return [];
      return listImportedDatasets(organization.id);
    }),
    listMappings: protectedProcedure.query(async ({ ctx }) => {
      const organization = await getCurrentOrganization(ctx.user);
      return organization.id ? listDatasetMappings(organization.id) : [];
    }),
    saveMapping: protectedProcedure
      .input(z.object({ datasetId: z.number().int().positive(), mapping: z.object({ date: z.string().max(255).optional(), revenue: z.string().max(255).optional(), sales: z.string().max(255).optional(), customer: z.string().max(255).optional(), product: z.string().max(255).optional(), order: z.string().max(255).optional() }).refine((mapping) => businessFields.some((field) => Boolean(mapping[field])), { message: "Selecione ao menos um campo de negócio." }) }))
      .mutation(async ({ ctx, input }) => {
        const organization = await getCurrentOrganization(ctx.user);
        if (!organization.id) throw new Error("Inicie sessão para guardar o mapeamento.");
        if (!canManageData(organization.membershipRole)) throw new Error("Não tem permissão para alterar mapeamentos nesta organização.");
        return saveDatasetMapping({ organizationId: organization.id, ...input });
      }),
    importFile: protectedProcedure
      .input(z.object({ fileName: z.string().min(1).max(255), contentType: z.string().min(1).max(120), contentBase64: z.string().min(4).max(12_000_000) }))
      .mutation(async ({ ctx, input }) => {
        const organization = await getCurrentOrganization(ctx.user);
        if (!organization.id) throw new Error("Inicie sessão para importar dados na sua organização.");
        if (!canManageData(organization.membershipRole)) throw new Error("Não tem permissão para importar dados nesta organização.");
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
        if (!canManageReports(organization.membershipRole)) throw new Error("Não tem permissão para criar relatórios nesta organização.");
        return createReport({ organizationId: organization.id, ...input });
      }),
    schedule: protectedProcedure
      .input(z.object({ reportId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const organization = await getCurrentOrganization(ctx.user);
        if (!organization.id) throw new Error("Inicie sessão para agendar relatórios.");
        if (!canManageReports(organization.membershipRole)) throw new Error("Não tem permissão para agendar relatórios nesta organização.");
        const report = await getReportForOrganization(input.reportId, organization.id);
        if (!report) throw new Error("Relatório não encontrado neste workspace.");
        const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
        if (report.scheduleCronTaskUid) {
          if (!report.isActive) { await updateHeartbeatJob(report.scheduleCronTaskUid, { enable: true }, sessionToken); await setReportScheduleActive(report.id, organization.id, true); }
          return { taskUid: report.scheduleCronTaskUid, alreadyScheduled: true };
        }
        const job = await createHeartbeatJob({
          name: `quantico-report-${organization.id}-${report.id}`,
          cron: cronForCadence(report.cadence),
          path: "/api/scheduled/generate-report",
          payload: { reportId: report.id },
          description: `Quantico Intelligence: ${report.name}`,
        }, sessionToken);
        await persistReportSchedule(report.id, organization.id, job.taskUid);
        return { taskUid: job.taskUid, nextExecutionAt: job.nextExecutionAt, alreadyScheduled: false };
      }),
    setScheduleActive: protectedProcedure.input(z.object({ reportId: z.number().int().positive(), isActive: z.boolean() })).mutation(async ({ ctx, input }) => {
      const organization = await getCurrentOrganization(ctx.user);
      if (!organization.id) throw new Error("Inicie sessão para alterar o agendamento.");
      if (!canManageReports(organization.membershipRole)) throw new Error("Não tem permissão para alterar agendamentos nesta organização.");
      const report = await getReportForOrganization(input.reportId, organization.id);
      if (!report?.scheduleCronTaskUid) throw new Error("Este relatório ainda não tem uma cadência activa.");
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      const job = await updateHeartbeatJob(report.scheduleCronTaskUid, { enable: input.isActive }, sessionToken);
      await setReportScheduleActive(report.id, organization.id, input.isActive);
      return { taskUid: report.scheduleCronTaskUid, isActive: input.isActive, nextExecutionAt: job.nextExecutionAt };
    }),
    generate: protectedProcedure
      .input(z.object({ reportId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const organization = await getCurrentOrganization(ctx.user);
        if (!organization.id) throw new Error("Inicie sessão para gerar relatórios.");
        const report = await getReportForOrganization(input.reportId, organization.id);
        if (!report) throw new Error("Relatório não encontrado neste workspace.");
        return generateReportArtifact(report, organization.name);
      }),
    artifacts: protectedProcedure
      .input(z.object({ reportId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const organization = await getCurrentOrganization(ctx.user);
        if (!organization.id) return [];
        const report = await getReportForOrganization(input.reportId, organization.id);
        if (!report) return [];
        return listReportArtifacts(report.id, organization.id);
      }),
  }),
  actions: router({
    list: protectedProcedure.query(async ({ ctx }) => { const organization = await getCurrentOrganization(ctx.user); return organization.id ? listGrowthActions(organization.id) : []; }),
    create: protectedProcedure.input(z.object({ title: z.string().trim().min(3).max(180), actionType: z.enum(actionTypes), segment: z.string().trim().min(2).max(160), estimatedRevenue: z.number().finite().min(0).max(100_000_000), notes: z.string().trim().max(2_000).optional(), assigneeName: z.string().trim().max(160).optional(), sourceSignal: z.string().trim().max(200).optional() })).mutation(async ({ ctx, input }) => { const organization = await getCurrentOrganization(ctx.user); if (!organization.id) throw new Error("Inicie sessão para criar uma acção."); if (!canManageData(organization.membershipRole)) throw new Error("Não tem permissão para criar acções nesta organização."); return createGrowthAction({ organizationId: organization.id, createdByUserId: ctx.user.id, ...input }); }),
    setStatus: protectedProcedure.input(z.object({ actionId: z.number().int().positive(), status: z.enum(actionStatuses) })).mutation(async ({ ctx, input }) => { const organization = await getCurrentOrganization(ctx.user); if (!organization.id) throw new Error("Inicie sessão para actualizar uma acção."); if (!canManageData(organization.membershipRole)) throw new Error("Não tem permissão para actualizar acções nesta organização."); return setGrowthActionStatus({ organizationId: organization.id, ...input }); }),
    updateResult: protectedProcedure.input(z.object({ actionId: z.number().int().positive(), progress: z.number().min(0).max(100), actualRevenue: z.number().min(0).max(100_000_000), status: z.enum(actionStatuses), resultNotes: z.string().trim().max(2_000).optional(), assigneeName: z.string().trim().max(160).optional() })).mutation(async ({ ctx, input }) => { const organization = await getCurrentOrganization(ctx.user); if (!organization.id || !canManageData(organization.membershipRole)) throw new Error("Não tem permissão para actualizar resultados nesta organização."); return updateGrowthActionResult({ organizationId: organization.id, ...input }); }),
    addFollowUp: protectedProcedure.input(z.object({ actionId: z.number().int().positive(), note: z.string().trim().min(3).max(2_000), progress: z.number().min(0).max(100) })).mutation(async ({ ctx, input }) => { const organization = await getCurrentOrganization(ctx.user); if (!organization.id || !canManageData(organization.membershipRole)) throw new Error("Não tem permissão para registar follow-ups nesta organização."); return addActionFollowUp({ organizationId: organization.id, createdByUserId: ctx.user.id, ...input }); }),
    followUps: protectedProcedure.input(z.object({ actionId: z.number().int().positive() })).query(async ({ ctx, input }) => { const organization = await getCurrentOrganization(ctx.user); return organization.id ? listActionFollowUps(organization.id, input.actionId) : []; }),
  }),
  alerts: router({
    list: protectedProcedure.query(async ({ ctx }) => { const organization = await getCurrentOrganization(ctx.user); return organization.id ? listAlertRules(organization.id) : []; }),
    create: protectedProcedure.input(z.object({ name: z.string().trim().min(3).max(160), alertType: z.enum(alertTypes), threshold: z.number().finite().min(0).max(100_000_000) })).mutation(async ({ ctx, input }) => { const organization = await getCurrentOrganization(ctx.user); if (!organization.id) throw new Error("Inicie sessão para criar um alerta."); if (!canManageWorkspace(organization.membershipRole)) throw new Error("Não tem permissão para criar alertas nesta organização."); return createAlertRule({ organizationId: organization.id, createdByUserId: ctx.user.id, ...input }); }),
    setActive: protectedProcedure.input(z.object({ ruleId: z.number().int().positive(), isActive: z.boolean() })).mutation(async ({ ctx, input }) => { const organization = await getCurrentOrganization(ctx.user); if (!organization.id) throw new Error("Inicie sessão para actualizar um alerta."); if (!canManageWorkspace(organization.membershipRole)) throw new Error("Não tem permissão para actualizar alertas nesta organização."); return setAlertRuleActive({ organizationId: organization.id, ...input }); }),
    events: protectedProcedure.query(async ({ ctx }) => { const organization = await getCurrentOrganization(ctx.user); return organization.id ? listAlertEvents(organization.id) : []; }),
    evaluate: protectedProcedure.mutation(async ({ ctx }) => { const organization = await getCurrentOrganization(ctx.user); if (!organization.id || !canManageWorkspace(organization.membershipRole)) throw new Error("Não tem permissão para avaliar alertas nesta organização."); return evaluateAlertRules(organization.id); }),
  }),
});

export type AppRouter = typeof appRouter;
