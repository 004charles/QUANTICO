import { MetricCard } from "@/components/MetricCard";
import { MetricConnectionNotice } from "@/components/MetricConnectionNotice";
import { PageHeader } from "@/components/PageHeader";
import { SectionTitle } from "@/components/SectionTitle";
import { Activity, BadgeDollarSign, ContactRound, HeartHandshake, ShieldAlert } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

const segments = [
  { title: "VIP", count: "148", description: "Contas de alto valor e recorrência", revenue: "18,7M Kz", tone: "bg-[#dbeafe] text-[#326b9f]", dot: "#79a7d6" },
  { title: "Potential VIP", count: "312", description: "Crescimento consistente de consumo", revenue: "10,2M Kz", tone: "bg-[#dfeee9] text-[#4d826e]", dot: "#91c2b1" },
  { title: "Em risco", count: "87", description: "Redução de frequência ou valor", revenue: "4,2M Kz", tone: "bg-[#f8e2e7] text-[#a25c6d]", dot: "#d793a1" },
  { title: "Inativos", count: "234", description: "Sem compra há mais de 60 dias", revenue: "12,4M Kz", tone: "bg-[#e9eded] text-[#667779]", dot: "#a5b1b2" },
];

const riskAccounts = [
  { name: "Grupo Sol Nascente", risk: 87, signal: "Frequência ↓ 43%", value: "1,18M Kz", last: "62 dias" },
  { name: "Norte & Filhos", risk: 79, signal: "Ticket médio ↓ 31%", value: "880 mil Kz", last: "48 dias" },
  { name: "Costa Capital", risk: 72, signal: "Pedido recorrente ausente", value: "640 mil Kz", last: "39 dias" },
  { name: "Mercado Horizonte", risk: 68, signal: "Volume ↓ 24%", value: "510 mil Kz", last: "36 dias" },
];

export default function CustomerIntelligence() {
  const [, setLocation] = useLocation();
  const customersQuery = trpc.analytics.metric.useQuery({ metric: "customers" });
  const retentionQuery = trpc.analytics.metric.useQuery({ metric: "retention" });
  const liveCustomers = customersQuery.data?.state === "ready" ? customersQuery.data.points.at(0) : undefined;
  const liveRetention = retentionQuery.data?.state === "ready" ? retentionQuery.data.points.at(0)?.value : undefined;
  const activeCustomers = liveCustomers ? liveCustomers.value.toLocaleString("pt-AO") : "3.246";
  const retentionValue = liveRetention !== undefined ? `${liveRetention.toLocaleString("pt-AO")}%` : "84,6%";
  return (
    <div className="space-y-7 pb-6"><PageHeader eyebrow="Inteligência de clientes" title="Conheça quem sustenta o seu crescimento." description="Priorize a retenção, identifique potencial de expansão e transforme padrões de compra em relações mais valiosas." />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Clientes ativos" value={activeCustomers} change="8,1%" detail={liveCustomers ? "última métrica conectada" : "vs. mês anterior"} icon={ContactRound} accent="blue" /><MetricCard label="Retenção" value={retentionValue} change="2,2 p.p." detail={liveRetention !== undefined ? "calculada da fonte conectada" : "vs. mês anterior"} icon={HeartHandshake} accent="mint" /><MetricCard label="LTV médio" value="324 mil Kz" change="7,6%" detail="nos últimos 12 meses" icon={BadgeDollarSign} accent="blush" /><MetricCard label="Clientes em risco" value="87" change="14,1%" detail="a rever esta semana" positive={false} icon={ShieldAlert} accent="ink" /></section>
      <MetricConnectionNotice state={customersQuery.data?.state} isLoading={customersQuery.isLoading} isError={customersQuery.isError} />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{segments.map((segment) => <article key={segment.title} className="quantico-card p-5"><div className="flex items-start justify-between gap-3"><span className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${segment.tone}`}>{segment.title}</span><span className="text-xl font-extrabold tracking-[-0.06em] text-[#1c2829]">{segment.count}</span></div><p className="mt-5 text-xs leading-5 text-[#6f7d7e]">{segment.description}</p><div className="mt-5 flex items-center justify-between border-t border-[#e7ecec] pt-3"><span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a9799]">Potencial</span><span className="text-xs font-bold text-[#334142]">{segment.revenue}</span></div></article>)}</section>
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(330px,0.85fr)]"><article className="quantico-card overflow-hidden"><div className="flex flex-col gap-3 border-b border-[#e4eaea] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><SectionTitle eyebrow="Risco de churn" title="Contas que requerem atenção" /><button onClick={() => setLocation("/ask-quantico")} className="quantico-link inline-flex items-center gap-1 text-xs font-bold">Investigar no Quantico AI <Activity className="size-3.5" /></button></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead className="bg-[#fafcfc]"><tr className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#849193]"><th className="px-6 py-3.5">Conta</th><th className="px-4 py-3.5">Sinal</th><th className="px-4 py-3.5">Última compra</th><th className="px-6 py-3.5 text-right">Risco</th></tr></thead><tbody>{riskAccounts.map((account) => <tr key={account.name} className="border-t border-[#edf1f1]"><td className="px-6 py-4"><p className="text-sm font-bold tracking-[-0.03em] text-[#263233]">{account.name}</p><p className="mt-0.5 text-xs text-[#819092]">Valor recuperável: {account.value}</p></td><td className="px-4 py-4 text-sm text-[#a45f6e]">{account.signal}</td><td className="px-4 py-4 text-sm text-[#677678]">{account.last}</td><td className="px-6 py-4 text-right"><span className="rounded-full bg-[#fae9ed] px-2.5 py-1 text-xs font-bold text-[#af6272]">{account.risk}%</span></td></tr>)}</tbody></table></div></article><article className="quantico-card relative overflow-hidden p-5 sm:p-6"><div className="absolute -right-10 -top-8 size-28 rounded-full bg-[#dbeafe]" /><div className="relative"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7a898b]">Recomendação de retenção</p><h2 className="mt-3 text-xl font-extrabold leading-tight tracking-[-0.05em] text-[#192526]">Recupere 23 contas de alto valor antes do fim do ciclo.</h2><p className="mt-4 text-sm leading-6 text-[#687779]">Estas contas reduziram frequência sem perda de potencial. Uma abordagem personalizada pode recuperar até 4,2M Kz.</p><div className="mt-8 space-y-3"><div className="rounded-xl bg-[#eff5ff] p-3.5"><p className="text-xs font-bold text-[#315f8e]">1. Priorize pelo risco e valor</p><p className="mt-1 text-xs leading-5 text-[#5c7897]">Comece por contas com risco acima de 75% e potencial superior a 500 mil Kz.</p></div><div className="rounded-xl bg-[#f8e2e7] p-3.5"><p className="text-xs font-bold text-[#8d4e5e]">2. Crie uma oferta contextual</p><p className="mt-1 text-xs leading-5 text-[#906b73]">Combine histórico, categoria preferida e último pedido para orientar o contacto.</p></div></div></div></article></section>
    </div>
  );
}
