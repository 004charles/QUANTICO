import type { ReportCadence } from "./reports";

export function cronForCadence(cadence: ReportCadence) {
  const crons: Record<Exclude<ReportCadence, "manual">, string> = {
    daily: "0 0 7 * * *",
    weekly: "0 0 7 * * 1",
    monthly: "0 0 7 1 * *",
  };
  if (cadence === "manual") throw new Error("Relatórios manuais não podem receber cadência automática.");
  return crons[cadence];
}

export function buildReportPreview(input: { name: string; category: string; cadence: string; organizationName: string; generatedAt: Date }) {
  return `# ${input.name}\n\n**Organização:** ${input.organizationName}\n\n**Categoria:** ${input.category}\n\n**Cadência configurada:** ${input.cadence}\n\n**Gerado em:** ${input.generatedAt.toLocaleString("pt-AO")}\n\n> Esta é uma estrutura de relatório. Os indicadores serão preenchidos pelas métricas autorizadas da organização quando uma fonte de dados estiver conectada.\n`;
}
