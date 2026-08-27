import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { visibleAnalyticsAreas } from "@/lib/area-visibility";
import { BarChart3, Database, LineChart, ShieldCheck, UsersRound } from "lucide-react";
import { useLocation } from "wouter";

const areas = [
  { id: "executive", title: "Direcção", description: "Receita, evolução e indicadores essenciais para a decisão executiva.", icon: LineChart, path: "/", metric: "revenue" as const, label: "Receita mais recente", format: (value: number) => `${value.toLocaleString("pt-AO")} Kz` },
  { id: "sales", title: "Vendas", description: "Vendas concluídas, catálogo e sinais de desempenho comercial.", icon: BarChart3, path: "/sales", metric: "sales" as const, label: "Vendas mais recentes", format: (value: number) => value.toLocaleString("pt-AO") },
  { id: "customers", title: "Clientes", description: "Clientes activos, retenção e risco para proteger receita recorrente.", icon: UsersRound, path: "/customers", metric: "customers" as const, label: "Clientes activos", format: (value: number) => value.toLocaleString("pt-AO") },
  { id: "operations", title: "Operações", description: "Qualidade, fontes de dados e estrutura que sustenta a análise.", icon: Database, path: "/operations", metric: "revenue" as const, label: "Base analítica", format: () => "Dados e qualidade" },
];

function AreaCard({ area }: { area: (typeof areas)[number] }) {
  const [, setLocation] = useLocation();
  const metricQuery = trpc.analytics.metric.useQuery({ metric: area.metric });
  const latest = metricQuery.data?.state === "ready" ? metricQuery.data.points.at(0) : undefined;
  const Icon = area.icon;
  return <article className="quantico-card flex flex-col p-5 sm:p-6"><span className="flex size-10 items-center justify-center rounded-md bg-[#eaf3fc] text-[#0f6cbd]"><Icon className="size-5" /></span><h2 className="mt-5 text-xl font-semibold tracking-[-0.04em] text-[#263746]">{area.title}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-[#627485]">{area.description}</p><div className="mt-6 border-t border-[#e7edf2] pt-4"><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#60748a]">{area.label}</p><p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[#263746]">{metricQuery.isLoading ? "A carregar…" : latest ? area.format(latest.value) : "Aguardando dados"}</p></div><Button variant="outline" className="mt-6 h-9 border-[#a9c9e6] text-[#0f6cbd] hover:bg-[#eaf3fc]" onClick={() => setLocation(area.path)}>Abrir área</Button></article>;
}

export default function AnalyticsAreas() {
  const preferences = trpc.organization.preferences.useQuery();
  const allowed = new Set(visibleAnalyticsAreas(preferences.data?.visibleAreas));
  const available = areas.filter((area) => allowed.has(area.id));
  return <div className="space-y-7 pb-6"><PageHeader eyebrow="Áreas de análise" title="Organize a leitura do negócio por responsabilidade." description="Cada área reúne os indicadores necessários para decidir, com base apenas nos dados autorizados da organização." askCta={false} /><section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{available.map((area) => <AreaCard key={area.id} area={area} />)}</section><section className="quantico-card flex flex-col gap-4 border-l-4 border-l-[#0f6cbd] p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 text-sm font-semibold text-[#263746]"><ShieldCheck className="size-4 text-[#0f6cbd]" />Visibilidade pessoal, dados sempre protegidos</div><p className="mt-2 text-sm leading-6 text-[#627485]">As preferências organizam a sua navegação. As permissões de dados continuam a ser verificadas no servidor conforme o seu papel na organização.</p></div></section></div>;
}
