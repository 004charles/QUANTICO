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
  borderRadius: "6px",
  border: "1px solid #cad9e8",
  boxShadow: "0 4px 14px rgba(15, 71, 122, 0.12)",
  fontSize: "12px",
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const revenueQuery = trpc.analytics.metric.useQuery({ metric: "revenue" });
  const salesQuery = trpc.analytics.metric.useQuery({ metric: "sales" });
  const customersQuery = trpc.analytics.metric.useQuery({ metric: "customers" });
  const summaryQuery = trpc.ai.executiveSummary.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const liveRevenue = revenueQuery.data?.state === "ready" ? revenueQuery.data.points.at(0)?.value : undefined;
  const revenueValue = liveRevenue !== undefined ? `${(liveRevenue / 1_000_000).toLocaleString("pt-AO", { maximumFractionDigits: 1 })}M Kz` : "48,2M Kz";
  const hasLiveData = revenueQuery.data?.state === "ready";
  const liveSales = salesQuery.data?.state === "ready" ? salesQuery.data.points.at(0)?.value : undefined;
  const liveCustomers = customersQuery.data?.state === "ready" ? customersQuery.data.points.at(0)?.value : undefined;
  const salesValue = liveSales !== undefined ? liveSales.toLocaleString("pt-AO") : "812";
  const customersValue = liveCustomers !== undefined ? liveCustomers.toLocaleString("pt-AO") : "3.246";
  const revenueChartData = hasLiveData ? [...(revenueQuery.data?.points ?? [])].reverse().map((point) => ({ month: new Intl.DateTimeFormat("pt-AO", { month: "short" }).format(point.date), receita: point.value / 1_000_000, meta: undefined })) : revenueTrend;
  const executiveSummary = summaryQuery.data?.state === "ready" ? summaryQuery.data.summary : "Identificámos três movimentos com impacto direto na receita e na retenção de clientes.";

  return (
    <div className="space-y-7 pb-6">
      <section className="relative overflow-hidden rounded-[10px] border border-[#dce5ee] border-l-4 border-l-[#0b62b4] bg-white px-5 py-6 sm:px-7 sm:py-7">
        <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#edf5fd] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#0b62b4]">
                <span className="size-1.5 rounded-full bg-[#0b62b4]" />
                Inteligência atualizada
              </span>
              <span className="text-xs text-[#687582]">27 de agosto de 2026</span>
            </div>
            <h1 className="max-w-xl text-[28px] font-bold leading-[1.12] tracking-[-0.05em] text-[#242424] sm:text-[36px]">
              Veja o que está a acontecer no seu negócio.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#5e6873]">
              Acompanhe a receita, as vendas e os clientes. Cada informação abaixo explica o desempenho e a próxima decisão recomendada.
            </p>
          </div>
          <button onClick={() => setLocation("/ask-quantico")} className="quantico-dark-button group relative inline-flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-semibold">
            <Sparkles className="size-4" />
            Pergunte ao seu negócio
            <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </button>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5d7c9d]">Resumo do negócio</p>
          <h2 className="mt-1 text-[25px] font-extrabold tracking-[-0.055em] text-[#102a43]">Os números mais importantes agora</h2>
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
        <MetricCard label="Receita no último mês" value={revenueValue} change="18,6%" detail={hasLiveData ? "valor vindo da sua importação" : "comparado ao mês anterior"} icon={CircleDollarSign} accent="blue" />
        <MetricCard label="Vendas concluídas" value={salesValue} change={liveSales !== undefined ? "dado atual" : "12,4%"} detail={liveSales !== undefined ? "vendas do último mês importado" : "comparado ao mês anterior"} icon={Crosshair} accent="blush" />
        <MetricCard label="Clientes que compraram" value={customersValue} change={liveCustomers !== undefined ? "dado atual" : "8,1%"} detail={liveCustomers !== undefined ? "clientes do último mês importado" : "comparado ao mês anterior"} icon={ContactRound} accent="mint" />
        <MetricCard label="Meta atingida" value="113,4%" change="4,2 p.p." detail="acima do objetivo do mês" icon={Goal} accent="ink" />
      </section>
      <MetricConnectionNotice state={revenueQuery.data?.state} isLoading={revenueQuery.isLoading} isError={revenueQuery.isError} />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(310px,0.8fr)]">
        <article className="quantico-card border-t-2 border-t-[#0f6cbd] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-[#54718e]">Evolução da receita por mês</p>
              <div className="mt-2 flex items-end gap-3">
                <h3 className="text-[27px] font-extrabold tracking-[-0.06em] text-[#102a43]">{revenueValue}</h3>
                <span className="mb-1 inline-flex items-center gap-0.5 text-xs font-bold text-[#1670b8]"><TrendingUp className="size-3.5" />18,6%</span>
              </div>
            </div>
            <div className="rounded-md bg-[#edf5fd] px-3 py-2 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#3b78b1]">Próximo mês estimado</p>
              <p className="mt-0.5 text-sm font-extrabold tracking-[-0.04em] text-[#125f9f]">53,0M Kz</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-[#5d7083]"><span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#0f69b3]" />Receita registada</span><span className="inline-flex items-center gap-1.5"><span className="w-3 border-t border-dashed border-[#9eabb7]" />Meta mensal</span><span>Valores em milhões de Kz</span></div>
          <div className="mt-4 h-[245px]" aria-label="Gráfico de evolução da receita mensal">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
              <AreaChart data={revenueChartData} margin={{ top: 6, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#1874bd" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#1874bd" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e4eff9" strokeDasharray="4 4" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#6682a0", fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6682a0", fontSize: 11 }} tickFormatter={(value) => `${value}M`} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => [`${value.toLocaleString("pt-AO", { maximumFractionDigits: 2 })}M Kz`, "Receita"]} />
                <Area type="monotone" dataKey="meta" stroke="#c6d0d1" strokeWidth={1.6} strokeDasharray="5 5" fill="transparent" />
                <Area type="monotone" dataKey="receita" stroke="#0f69b3" strokeWidth={2.6} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="quantico-card relative overflow-hidden p-5 sm:p-6">
          <div className="absolute -right-8 -top-10 size-28 rounded-full bg-[#dceeff] opacity-80" />
          <div className="relative">
            <div className="flex items-center justify-between gap-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#e5f1ff] text-[#0f67b5]"><Bot className="size-[19px]" /></div>
              <span className="rounded-full bg-[#eaf4ff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#246ba9]">Quantico AI</span>
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
          <div className="mt-6 rounded-2xl bg-[#eaf4ff] p-5">
            <div className="flex items-start justify-between gap-4"><div className="flex size-10 items-center justify-center rounded-xl bg-white/70 text-[#0f67b5]"><Layers3 className="size-[18px]" /></div><span className="text-xs font-bold text-[#176eae]">12,4M Kz</span></div>
            <h3 className="mt-5 text-lg font-bold tracking-[-0.045em] text-[#123e66]">Recuperar clientes sem compras recentes</h3>
            <p className="mt-2 text-sm leading-6 text-[#416b90]">234 clientes não compram há mais de 60 dias. Crie uma campanha de reativação com uma oferta personalizada.</p>
            <button onClick={() => setLocation("/growth")} className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-[#0f5fa8]">Ver oportunidade <ArrowUpRight className="size-3.5" /></button>
          </div>
        </article>
      </section>

      <section className="quantico-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e5f1ff] text-[#0f67b5]"><AlertTriangle className="size-[19px]" /></div><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold tracking-[-0.04em] text-[#123e66]">Mudança importante a analisar</p><DemoBadge /></div><p className="mt-1 text-sm leading-6 text-[#59738d]">As vendas do canal de revenda caíram 37% nas últimas 48 horas, quando comparadas ao seu padrão recente.</p></div></div><button onClick={() => setLocation("/ask-quantico")} className="quantico-link shrink-0 text-xs font-bold">Entender a causa com a IA</button>
      </section>
    </div>
  );
}
