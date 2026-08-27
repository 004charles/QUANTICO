import { DemoBadge } from "@/components/DemoBadge";
import { MetricCard } from "@/components/MetricCard";
import { MetricConnectionNotice } from "@/components/MetricConnectionNotice";
import { PageHeader } from "@/components/PageHeader";
import { SectionTitle } from "@/components/SectionTitle";
import { funnelData } from "@/lib/dashboard-data";
import { Activity, BadgeDollarSign, ClipboardCheck, Goal, UsersRound } from "lucide-react";
import { trpc } from "@/lib/trpc";

const channels = [
  { name: "Vendas diretas", revenue: "22,8M Kz", conversion: "23,6%", growth: "+21,4%", width: 86 },
  { name: "Parcerias", revenue: "12,1M Kz", conversion: "18,2%", growth: "+11,8%", width: 58 },
  { name: "Digital", revenue: "8,7M Kz", conversion: "15,4%", growth: "+26,2%", width: 41 },
  { name: "Revenda", revenue: "4,6M Kz", conversion: "11,8%", growth: "+4,6%", width: 28 },
];

const performers = [
  { name: "Ana dos Santos", segment: "Enterprise", revenue: "6,8M Kz", goal: 121, tone: "#dbeafe" },
  { name: "Mário Lopes", segment: "Mid-market", revenue: "5,4M Kz", goal: 109, tone: "#f8e2e7" },
  { name: "Joana Manuel", segment: "Enterprise", revenue: "4,9M Kz", goal: 105, tone: "#dfeee9" },
  { name: "Paulo Vicente", segment: "SMB", revenue: "3,7M Kz", goal: 96, tone: "#e6ebeb" },
];

export default function SalesIntelligence() {
  const salesQuery = trpc.analytics.metric.useQuery({ metric: "sales" });
  const liveSales = salesQuery.data?.state === "ready" ? salesQuery.data.points.at(0) : undefined;
  const salesVolume = liveSales ? liveSales.value.toLocaleString("pt-AO") : "812";
  const salesDetail = liveSales ? "última métrica conectada" : "vs. mês anterior";
  return (
    <div className="space-y-7 pb-6">
      <PageHeader eyebrow="Inteligência comercial" title="Vendas com contexto, não apenas volume." description="Leia o avanço do funil, a eficiência dos canais e a qualidade do desempenho comercial em uma visão única." />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Pipeline aberto" value="81,6M Kz" change="15,8%" detail="vs. mês anterior" icon={BadgeDollarSign} accent="blue" />
        <MetricCard label="Taxa de conversão" value="16,8%" change="1,9 p.p." detail="vs. mês anterior" icon={Goal} accent="mint" />
        <MetricCard label="Vendas fechadas" value={salesVolume} change="9,3%" detail={salesDetail} icon={ClipboardCheck} accent="blush" />
        <MetricCard label="Ciclo médio" value="18 dias" change="2,4 dias" detail="mais eficiente" icon={Activity} accent="ink" />
      </section>
      <MetricConnectionNotice state={salesQuery.data?.state} isLoading={salesQuery.isLoading} isError={salesQuery.isError} />
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <article className="quantico-card p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-medium text-[#6d7b7c]">Funil comercial</p><h2 className="mt-2 text-xl font-extrabold tracking-[-0.05em] text-[#172122]">17% dos leads chegam à venda</h2></div><DemoBadge /></div>
          <div className="mt-8 space-y-3">
            {funnelData.map((stage, index) => <div key={stage.stage} className="grid grid-cols-[112px_minmax(0,1fr)_52px] items-center gap-3"><div className="flex items-center gap-2"><span className="font-mono text-[10px] text-[#839092]">0{index + 1}</span><span className="text-xs font-semibold text-[#344142]">{stage.stage}</span></div><div className="h-8 overflow-hidden rounded-lg bg-[#eff2f2]"><div className="flex h-full items-center rounded-lg px-3" style={{ width: `${stage.value}%`, background: index === 4 ? "#8fbfae" : `rgba(113, 163, 211, ${0.8 - index * 0.1})` }}><span className="hidden text-[10px] font-bold text-white sm:inline">{stage.value}%</span></div></div><span className="text-right text-xs font-bold tracking-[-0.03em] text-[#253132]">{stage.label}</span></div>)}
          </div>
          <div className="mt-7 grid gap-3 border-t border-[#e6ecec] pt-5 sm:grid-cols-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#899697]">Gargalo</p><p className="mt-1 text-sm font-bold text-[#202c2d]">Proposta → venda</p></div><div><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#899697]">Perda estimada</p><p className="mt-1 text-sm font-bold text-[#b16071]">9,8M Kz</p></div><div><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#899697]">Sinal recomendado</p><p className="mt-1 text-sm font-bold text-[#387163]">Rever propostas &lt; 7 dias</p></div></div>
        </article>
        <article className="quantico-card p-5 sm:p-6"><SectionTitle eyebrow="Eficiência" title="Canais de aquisição" /><div className="mt-6 space-y-5">{channels.map((channel) => <div key={channel.name}><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-bold tracking-[-0.03em] text-[#283536]">{channel.name}</p><p className="mt-0.5 text-xs text-[#819092]">Conversão {channel.conversion}</p></div><div className="text-right"><p className="text-sm font-bold tracking-[-0.03em] text-[#273334]">{channel.revenue}</p><p className="mt-0.5 text-xs font-semibold text-[#4b836f]">{channel.growth}</p></div></div><div className="mt-2.5 h-1.5 rounded-full bg-[#edf1f1]"><div className="h-full rounded-full bg-[#78a7d4]" style={{ width: `${channel.width}%` }} /></div></div>)}</div></article>
      </section>
      <section className="quantico-card overflow-hidden"><div className="flex flex-col gap-3 border-b border-[#e4eaea] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><SectionTitle eyebrow="Equipa" title="Desempenho comercial" /><span className="inline-flex items-center gap-1.5 text-xs text-[#778587]"><UsersRound className="size-3.5" />4 vendedores em acompanhamento</span></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead className="bg-[#fafcfc]"><tr className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#849193]"><th className="px-6 py-3.5">Vendedor</th><th className="px-4 py-3.5">Segmento</th><th className="px-4 py-3.5">Receita fechada</th><th className="px-6 py-3.5 text-right">Atingimento</th></tr></thead><tbody>{performers.map((person) => <tr key={person.name} className="border-t border-[#edf1f1]"><td className="px-6 py-4"><div className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-full text-[10px] font-bold text-[#485657]" style={{ backgroundColor: person.tone }}>{person.name.split(" ").map((word) => word[0]).join("").slice(0, 2)}</span><span className="text-sm font-bold tracking-[-0.03em] text-[#263233]">{person.name}</span></div></td><td className="px-4 py-4 text-sm text-[#6e7c7e]">{person.segment}</td><td className="px-4 py-4 text-sm font-semibold text-[#334041]">{person.revenue}</td><td className="px-6 py-4 text-right"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${person.goal >= 100 ? "bg-[#eaf5ef] text-[#4d826f]" : "bg-[#faf0f2] text-[#ae6574]"}`}>{person.goal}%</span></td></tr>)}</tbody></table></div></section>
    </div>
  );
}
