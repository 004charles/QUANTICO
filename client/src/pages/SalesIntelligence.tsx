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
  { name: "Ana dos Santos", segment: "Grandes empresas", revenue: "6,8M Kz", goal: 121, tone: "#dceeff" },
  { name: "Mário Lopes", segment: "Médias empresas", revenue: "5,4M Kz", goal: 109, tone: "#e7f3ff" },
  { name: "Joana Manuel", segment: "Grandes empresas", revenue: "4,9M Kz", goal: 105, tone: "#edf6ff" },
  { name: "Paulo Vicente", segment: "Pequenas empresas", revenue: "3,7M Kz", goal: 96, tone: "#e6f0fa" },
];

export default function SalesIntelligence() {
  const salesQuery = trpc.analytics.metric.useQuery({ metric: "sales" });
  const liveSales = salesQuery.data?.state === "ready" ? salesQuery.data.points.at(0) : undefined;
  const salesVolume = liveSales ? liveSales.value.toLocaleString("pt-AO") : "812";
  const salesDetail = liveSales ? "última métrica conectada" : "vs. mês anterior";
  return (
    <div className="space-y-7 pb-6">
      <PageHeader eyebrow="Vendas" title="Acompanhe onde as vendas avançam e onde estão a parar." description="Veja quantas oportunidades existem em cada etapa, quais canais vendem mais e quem está mais perto da meta." />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Valor de negócios em aberto" value="81,6M Kz" change="15,8%" detail="comparado ao mês anterior" icon={BadgeDollarSign} accent="blue" />
        <MetricCard label="Oportunidades que viraram venda" value="16,8%" change="1,9 p.p." detail="comparado ao mês anterior" icon={Goal} accent="mint" />
        <MetricCard label="Vendas concluídas" value={salesVolume} change="9,3%" detail={salesDetail} icon={ClipboardCheck} accent="blush" />
        <MetricCard label="Tempo médio para vender" value="18 dias" change="2,4 dias" detail="mais rápido que antes" icon={Activity} accent="ink" />
      </section>
      <MetricConnectionNotice state={salesQuery.data?.state} isLoading={salesQuery.isLoading} isError={salesQuery.isError} />
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <article className="quantico-card p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold text-[#54718e]">Caminho até à venda</p><h2 className="mt-2 text-xl font-extrabold tracking-[-0.05em] text-[#102a43]">De cada 100 contactos interessados, 17 tornam-se clientes.</h2><p className="mt-2 text-xs leading-5 text-[#688099]">As barras mostram a percentagem que avança em cada etapa. Quanto menor a barra, maior a necessidade de atenção.</p></div><DemoBadge /></div>
          <div className="mt-8 space-y-3">
            {funnelData.map((stage, index) => <div key={stage.stage} className="grid grid-cols-[112px_minmax(0,1fr)_52px] items-center gap-3"><div className="flex items-center gap-2"><span className="font-mono text-[10px] text-[#5f83a7]">0{index + 1}</span><span className="text-xs font-semibold text-[#24405b]">{stage.stage}</span></div><div className="h-8 overflow-hidden rounded-lg bg-[#edf5fc]"><div className="flex h-full items-center rounded-lg px-3" style={{ width: `${stage.value}%`, background: `rgba(15, 105, 179, ${0.88 - index * 0.1})` }}><span className="hidden text-[10px] font-bold text-white sm:inline">{stage.value}%</span></div></div><span className="text-right text-xs font-bold tracking-[-0.03em] text-[#183b5d]">{stage.label}</span></div>)}
          </div>
          <div className="mt-7 grid gap-3 border-t border-[#dfeaf5] pt-5 sm:grid-cols-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#6682a0]">Onde as vendas param</p><p className="mt-1 text-sm font-bold text-[#102a43]">Proposta → venda</p></div><div><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#6682a0]">Valor em risco</p><p className="mt-1 text-sm font-bold text-[#176eae]">9,8M Kz</p></div><div><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#6682a0]">Próxima ação</p><p className="mt-1 text-sm font-bold text-[#176eae]">Rever propostas com mais de 7 dias</p></div></div>
        </article>
        <article className="quantico-card p-5 sm:p-6"><SectionTitle eyebrow="Eficiência" title="Canais de aquisição" /><div className="mt-6 space-y-5">{channels.map((channel) => <div key={channel.name}><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-bold tracking-[-0.03em] text-[#283536]">{channel.name}</p><p className="mt-0.5 text-xs text-[#819092]">Conversão {channel.conversion}</p></div><div className="text-right"><p className="text-sm font-bold tracking-[-0.03em] text-[#273334]">{channel.revenue}</p><p className="mt-0.5 text-xs font-semibold text-[#4b836f]">{channel.growth}</p></div></div><div className="mt-2.5 h-1.5 rounded-full bg-[#edf1f1]"><div className="h-full rounded-full bg-[#78a7d4]" style={{ width: `${channel.width}%` }} /></div></div>)}</div></article>
      </section>
      <section className="quantico-card overflow-hidden"><div className="flex flex-col gap-3 border-b border-[#e4eaea] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><SectionTitle eyebrow="Equipa" title="Desempenho comercial" /><span className="inline-flex items-center gap-1.5 text-xs text-[#778587]"><UsersRound className="size-3.5" />4 vendedores em acompanhamento</span></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead className="bg-[#fafcfc]"><tr className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#849193]"><th className="px-6 py-3.5">Vendedor</th><th className="px-4 py-3.5">Segmento</th><th className="px-4 py-3.5">Receita fechada</th><th className="px-6 py-3.5 text-right">Atingimento</th></tr></thead><tbody>{performers.map((person) => <tr key={person.name} className="border-t border-[#edf1f1]"><td className="px-6 py-4"><div className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-full text-[10px] font-bold text-[#485657]" style={{ backgroundColor: person.tone }}>{person.name.split(" ").map((word) => word[0]).join("").slice(0, 2)}</span><span className="text-sm font-bold tracking-[-0.03em] text-[#263233]">{person.name}</span></div></td><td className="px-4 py-4 text-sm text-[#6e7c7e]">{person.segment}</td><td className="px-4 py-4 text-sm font-semibold text-[#334041]">{person.revenue}</td><td className="px-6 py-4 text-right"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${person.goal >= 100 ? "bg-[#eaf5ef] text-[#4d826f]" : "bg-[#faf0f2] text-[#ae6574]"}`}>{person.goal}%</span></td></tr>)}</tbody></table></div></section>
    </div>
  );
}
