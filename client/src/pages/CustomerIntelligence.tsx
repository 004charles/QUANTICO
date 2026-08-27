import { MetricCard } from "@/components/MetricCard";
import { MetricConnectionNotice } from "@/components/MetricConnectionNotice";
import { PageHeader } from "@/components/PageHeader";
import { SectionTitle } from "@/components/SectionTitle";
import { Activity, BadgeDollarSign, ContactRound, HeartHandshake, ShieldAlert } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

const segments = [
  { title: "Clientes VIP", count: "148", description: "Compram com frequência e geram mais receita.", potential: "18,7M Kz", tone: "bg-[#e5f1ff] text-[#0f67b5]" },
  { title: "Podem virar VIP", count: "312", description: "Estão a aumentar as compras e podem crescer mais.", potential: "10,2M Kz", tone: "bg-[#e9f4ff] text-[#256eae]" },
  { title: "Precisam de atenção", count: "87", description: "Reduziram as compras ou o valor gasto.", potential: "4,2M Kz", tone: "bg-[#edf6ff] text-[#297bbf]" },
  { title: "Sem compras recentes", count: "234", description: "Não compram há mais de 60 dias.", potential: "12,4M Kz", tone: "bg-[#f1f7fd] text-[#356890]" },
];

const riskAccounts = [
  { name: "Grupo Sol Nascente", risk: 87, signal: "Comprou 43% menos", value: "1,18M Kz", last: "há 62 dias" },
  { name: "Norte & Filhos", risk: 79, signal: "Gasta 31% menos por compra", value: "880 mil Kz", last: "há 48 dias" },
  { name: "Costa Capital", risk: 72, signal: "Ainda não repetiu a compra", value: "640 mil Kz", last: "há 39 dias" },
  { name: "Mercado Horizonte", risk: 68, signal: "Comprou 24% menos", value: "510 mil Kz", last: "há 36 dias" },
];

export default function CustomerIntelligence() {
  const [, setLocation] = useLocation();
  const customersQuery = trpc.analytics.metric.useQuery({ metric: "customers" });
  const retentionQuery = trpc.analytics.metric.useQuery({ metric: "retention" });
  const liveCustomers = customersQuery.data?.state === "ready" ? customersQuery.data.points.at(0) : undefined;
  const liveRetention = retentionQuery.data?.state === "ready" ? retentionQuery.data.points.at(0)?.value : undefined;
  const activeCustomers = liveCustomers ? liveCustomers.value.toLocaleString("pt-AO") : "3.246";
  const retentionValue = liveRetention !== undefined ? `${liveRetention.toLocaleString("pt-AO")}%` : "84,6%";

  return <div className="space-y-7 pb-6">
    <PageHeader eyebrow="Clientes" title="Saiba quem compra, quem pode comprar mais e quem precisa de atenção." description="Organize os clientes pelo comportamento de compra para decidir quem contactar primeiro e qual ação comercial tomar." />
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Clientes que compraram" value={activeCustomers} change="8,1%" detail={liveCustomers ? "valor vindo da sua importação" : "comparado ao mês anterior"} icon={ContactRound} accent="blue" />
      <MetricCard label="Clientes que voltaram a comprar" value={retentionValue} change="2,2 p.p." detail={liveRetention !== undefined ? "calculado com a fonte importada" : "comparado ao mês anterior"} icon={HeartHandshake} accent="mint" />
      <MetricCard label="Valor médio por cliente" value="324 mil Kz" change="7,6%" detail="nos últimos 12 meses" icon={BadgeDollarSign} accent="blush" />
      <MetricCard label="Clientes com risco de saída" value="87" change="14,1%" detail="precisam de contacto esta semana" positive={false} icon={ShieldAlert} accent="ink" />
    </section>
    <MetricConnectionNotice state={customersQuery.data?.state} isLoading={customersQuery.isLoading} isError={customersQuery.isError} />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{segments.map((segment) => <article key={segment.title} className="quantico-card p-5"><div className="flex items-start justify-between gap-3"><span className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${segment.tone}`}>{segment.title}</span><span className="text-xl font-extrabold tracking-[-0.06em] text-[#102a43]">{segment.count}</span></div><p className="mt-5 text-xs leading-5 text-[#5f7890]">{segment.description}</p><div className="mt-5 flex items-center justify-between border-t border-[#dfeaf5] pt-3"><span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#6682a0]">Valor que pode recuperar</span><span className="text-xs font-bold text-[#176eae]">{segment.potential}</span></div></article>)}</section>
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(330px,0.85fr)]"><article className="quantico-card overflow-hidden"><div className="flex flex-col gap-3 border-b border-[#dfeaf5] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><SectionTitle eyebrow="Clientes em risco" title="Quem deve ser contactado primeiro" /><button onClick={() => setLocation("/ask-quantico")} className="quantico-link inline-flex items-center gap-1 text-xs font-bold">Entender com a IA <Activity className="size-3.5" /></button></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead className="bg-[#f7fbff]"><tr className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#6682a0]"><th className="px-6 py-3.5">Cliente</th><th className="px-4 py-3.5">O que mudou</th><th className="px-4 py-3.5">Última compra</th><th className="px-6 py-3.5 text-right">Risco</th></tr></thead><tbody>{riskAccounts.map((account) => <tr key={account.name} className="border-t border-[#e6eff8]"><td className="px-6 py-4"><p className="text-sm font-bold tracking-[-0.03em] text-[#183b5d]">{account.name}</p><p className="mt-0.5 text-xs text-[#7189a0]">Valor que pode recuperar: {account.value}</p></td><td className="px-4 py-4 text-sm text-[#297bbf]">{account.signal}</td><td className="px-4 py-4 text-sm text-[#5f7890]">{account.last}</td><td className="px-6 py-4 text-right"><span className="rounded-full bg-[#e7f2ff] px-2.5 py-1 text-xs font-bold text-[#176eae]">{account.risk}%</span></td></tr>)}</tbody></table></div></article><article className="quantico-card relative overflow-hidden p-5 sm:p-6"><div className="absolute -right-10 -top-8 size-28 rounded-full bg-[#dceeff]" /><div className="relative"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#54799e]">Ação recomendada</p><h2 className="mt-3 text-xl font-extrabold leading-tight tracking-[-0.05em] text-[#102a43]">Contacte primeiro os 23 clientes com maior valor em risco.</h2><p className="mt-4 text-sm leading-6 text-[#5f7890]">Estes clientes compravam com frequência, mas reduziram as compras. Uma abordagem personalizada pode recuperar até 4,2M Kz.</p><div className="mt-8 space-y-3"><div className="rounded-xl bg-[#eaf4ff] p-3.5"><p className="text-xs font-bold text-[#145f9e]">1. Escolha por risco e valor</p><p className="mt-1 text-xs leading-5 text-[#527493]">Comece por clientes com risco acima de 75% e potencial superior a 500 mil Kz.</p></div><div className="rounded-xl bg-[#f1f7fd] p-3.5"><p className="text-xs font-bold text-[#145f9e]">2. Faça uma oferta relevante</p><p className="mt-1 text-xs leading-5 text-[#527493]">Use o histórico, a categoria preferida e a última compra para orientar o contacto.</p></div></div></div></article></section>
  </div>;
}
