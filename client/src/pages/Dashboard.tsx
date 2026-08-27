import { DemoBadge } from "@/components/DemoBadge";
import { MetricCard } from "@/components/MetricCard";
import { MetricConnectionNotice } from "@/components/MetricConnectionNotice";
import { SectionTitle } from "@/components/SectionTitle";
import { revenueTrend, topRegions } from "@/lib/dashboard-data";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ArrowUpRight, Bot, ChevronDown, CircleDollarSign, ContactRound, Crosshair, Download, Goal, Layers3, Sparkles, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const chartTooltipStyle = {
  borderRadius: "14px",
  border: "1px solid #e1e8e8",
  boxShadow: "0 12px 24px rgba(24, 35, 35, 0.08)",
  fontSize: "12px",
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const revenueQuery = trpc.analytics.metric.useQuery({ metric: "revenue" });
  const summaryQuery = trpc.ai.executiveSummary.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const liveRevenue = revenueQuery.data?.state === "ready" ? revenueQuery.data.points.at(0)?.value : undefined;
  const revenueValue = liveRevenue !== undefined ? `${(liveRevenue / 1_000_000).toLocaleString("pt-AO", { maximumFractionDigits: 1 })}M Kz` : "48,2M Kz";
  const hasLiveData = revenueQuery.data?.state === "ready";
  const executiveSummary = summaryQuery.data?.state === "ready" ? summaryQuery.data.summary : "Identificámos três movimentos com impacto direto na receita e na retenção de clientes.";

  return (
    <div className="space-y-7 pb-6">
      <section className="relative overflow-hidden rounded-[24px] bg-[#171f20] px-5 py-6 text-white sm:px-7 sm:py-7">
        <div className="absolute -right-10 -top-16 size-48 rounded-full bg-[#b6d6fa] opacity-25 blur-[1px]" />
        <div className="absolute bottom-[-70px] right-[22%] size-36 rotate-45 rounded-[28px] bg-[#f5cbd5] opacity-20" />
        <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#dce9ea]">
                <span className="size-1.5 rounded-full bg-[#9cd2bc]" />
                Inteligência atualizada
              </span>
              <span className="text-xs text-[#aebcbc]">27 de agosto de 2026</span>
            </div>
            <h1 className="max-w-xl text-[28px] font-extrabold leading-[1.04] tracking-[-0.065em] sm:text-[38px]">
              O seu negócio está a crescer com qualidade.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[#c2ced0]">
              A receita acelerou neste mês e os sinais comerciais apontam para oportunidades claras de expansão e retenção.
            </p>
          </div>
          <button onClick={() => setLocation("/ask-quantico")} className="quantico-cta group relative inline-flex items-center justify-center gap-2 rounded-xl bg-[#dbeafe] px-4 py-3 text-sm font-bold text-[#182325]">
            <Sparkles className="size-4 text-[#3977b9]" />
            Pergunte ao seu negócio
            <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </button>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#899697]">Visão executiva</p>
          <h2 className="mt-1 text-[25px] font-extrabold tracking-[-0.055em] text-[#172122]">Operação em perspectiva</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasLiveData ? <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dce4e5] bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.09em] text-[#4d806d]"><span className="size-1.5 rounded-full bg-[#78b497]" />Dados conectados</span> : <DemoBadge />}
          <button className="quantico-control inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold">
            Agosto 2026 <ChevronDown className="size-3.5" />
          </button>
          <button className="quantico-control flex size-9 items-center justify-center rounded-lg" aria-label="Exportar visão executiva">
            <Download className="size-4" />
          </button>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Receita total" value={revenueValue} change="18,6%" detail={hasLiveData ? "última métrica conectada" : "vs. mês anterior"} icon={CircleDollarSign} accent="blue" />
        <MetricCard label="Vendas fechadas" value="812" change="12,4%" detail="vs. mês anterior" icon={Crosshair} accent="blush" />
        <MetricCard label="Clientes ativos" value="3.246" change="8,1%" detail="vs. mês anterior" icon={ContactRound} accent="mint" />
        <MetricCard label="Meta mensal" value="113,4%" change="4,2 p.p." detail="acima do plano" icon={Goal} accent="ink" />
      </section>
      <MetricConnectionNotice state={revenueQuery.data?.state} isLoading={revenueQuery.isLoading} isError={revenueQuery.isError} />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(310px,0.8fr)]">
        <article className="quantico-card p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-medium text-[#6e7b7c]">Receita e ritmo da meta</p>
              <div className="mt-2 flex items-end gap-3">
                <h3 className="text-[27px] font-extrabold tracking-[-0.06em] text-[#172122]">48,2M Kz</h3>
                <span className="mb-1 inline-flex items-center gap-0.5 text-xs font-bold text-[#47806f]"><TrendingUp className="size-3.5" />18,6%</span>
              </div>
            </div>
            <div className="rounded-xl bg-[#eff5ff] px-3 py-2 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#6482a3]">Previsão de setembro</p>
              <p className="mt-0.5 text-sm font-extrabold tracking-[-0.04em] text-[#2f5f90]">53,0M Kz</p>
            </div>
          </div>
          <div className="mt-6 h-[245px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
              <AreaChart data={revenueTrend} margin={{ top: 6, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#7fa9d6" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="#7fa9d6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e8eeee" strokeDasharray="4 4" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#819092", fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#819092", fontSize: 11 }} tickFormatter={(value) => `${value}M`} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => [`${value.toFixed(1)}M Kz`, "Receita"]} />
                <Area type="monotone" dataKey="meta" stroke="#c6d0d1" strokeWidth={1.6} strokeDasharray="5 5" fill="transparent" />
                <Area type="monotone" dataKey="receita" stroke="#4e88c2" strokeWidth={2.6} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="quantico-card relative overflow-hidden p-5 sm:p-6">
          <div className="absolute -right-8 -top-10 size-28 rounded-full bg-[#f8e2e7] opacity-80" />
          <div className="relative">
            <div className="flex items-center justify-between gap-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#f7e6ea] text-[#a86172]"><Bot className="size-[19px]" /></div>
              <span className="rounded-full bg-[#eff7f2] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#538470]">Quantico AI</span>
            </div>
            <h3 className="mt-6 max-w-[16rem] text-xl font-bold leading-tight tracking-[-0.05em] text-[#172122]">O que está acontecendo no meu negócio?</h3>
            <p className="mt-3 text-sm leading-6 text-[#697778]">{summaryQuery.isLoading ? "A consolidar os sinais autorizados do seu negócio…" : executiveSummary}</p>
            <button onClick={() => setLocation("/ask-quantico")} className="quantico-link mt-6 inline-flex items-center gap-1 text-xs font-bold">Ver análise completa <ArrowUpRight className="size-3.5" /></button>
          </div>
        </article>
      </section>

      <section className="grid gap-5 2xl:grid-cols-[minmax(0,1.25fr)_minmax(380px,0.75fr)]">
        <article className="quantico-card p-5 sm:p-6">
          <SectionTitle eyebrow="Distribuição" title="Receita por região" action="Ver geografia" />
          <div className="mt-7 space-y-5">
            {topRegions.map((region) => (
              <div key={region.name} className="grid grid-cols-[minmax(100px,1fr)_auto] gap-x-4 gap-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#334041]"><span className="size-2 rounded-full" style={{ backgroundColor: region.tone }} />{region.name}</div>
                <span className="text-sm font-bold tracking-[-0.03em] text-[#1c2829]">{region.value}</span>
                <div className="col-span-2 h-2 overflow-hidden rounded-full bg-[#eff2f2]"><div className="h-full rounded-full" style={{ width: `${region.share}%`, backgroundColor: region.tone }} /></div>
              </div>
            ))}
          </div>
        </article>

        <article className="quantico-card p-5 sm:p-6">
          <SectionTitle eyebrow="Próxima melhor ação" title="Oportunidade prioritária" />
          <div className="mt-6 rounded-2xl bg-[#f8e2e7] p-5">
            <div className="flex items-start justify-between gap-4"><div className="flex size-10 items-center justify-center rounded-xl bg-white/70 text-[#a86172]"><Layers3 className="size-[18px]" /></div><span className="text-xs font-bold text-[#8f4e5e]">12,4M Kz</span></div>
            <h3 className="mt-5 text-lg font-bold tracking-[-0.045em] text-[#3b252b]">Recuperar clientes inativos</h3>
            <p className="mt-2 text-sm leading-6 text-[#6f4b54]">234 clientes não compram há mais de 60 dias. Crie uma campanha de reativação com oferta personalizada.</p>
            <button onClick={() => setLocation("/growth")} className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-[#613946]">Explorar oportunidade <ArrowUpRight className="size-3.5" /></button>
          </div>
        </article>
      </section>

      <section className="quantico-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f8e2e7] text-[#a55f70]"><AlertTriangle className="size-[19px]" /></div><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold tracking-[-0.04em] text-[#263334]">Anomalia a investigar</p><DemoBadge /></div><p className="mt-1 text-sm leading-6 text-[#697779]">As vendas do canal de revenda recuaram 37% nas últimas 48 horas face ao padrão histórico recente.</p></div></div><button onClick={() => setLocation("/ask-quantico")} className="quantico-link shrink-0 text-xs font-bold">Investigar causa com Quantico AI</button>
      </section>
    </div>
  );
}
