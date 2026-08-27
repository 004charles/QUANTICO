import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type AiVisualizationSpec = {
  type: "bar" | "line" | "table";
  title: string;
  seriesLabel: string;
  data: Array<{ label: string; value: number }>;
};

function formatKz(value: number) {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toLocaleString("pt-AO", { maximumFractionDigits: 1 })}M Kz`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toLocaleString("pt-AO", { maximumFractionDigits: 0 })} mil Kz`;
  return `${value.toLocaleString("pt-AO")} Kz`;
}

const axisTick = { fill: "#526b84", fontSize: 10 };

export function AiVisualization({ visualization }: { visualization: AiVisualizationSpec }) {
  const chartData = visualization.data.map((point) => ({ ...point, label: point.label.replace(" de ", " ") }));
  return <section className="quantico-card overflow-hidden"><div className="border-b border-[#dce6ef] bg-[#fbfcfe] p-5"><div className="flex flex-wrap items-baseline justify-between gap-2"><div><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#52708b]">Gráfico da resposta</p><h2 className="mt-1 text-base font-semibold tracking-[-0.03em] text-[#263746]">{visualization.title}</h2></div><span className="rounded-sm bg-[#eaf3fc] px-2.5 py-1 text-[10px] font-semibold text-[#0f6cbd]">{visualization.seriesLabel}</span></div><p className="mt-2 text-xs leading-5 text-[#5f7284]">Valores calculados a partir dos dados importados. Selecione um ponto para ver o período e o valor exacto.</p></div><div className="p-5">{visualization.type === "table" ? <div className="overflow-hidden rounded-md border border-[#dbe8f5]"><table className="w-full text-left"><thead className="bg-[#f4f8fc]"><tr><th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#526b84]">Período</th><th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-[#526b84]">{visualization.seriesLabel}</th></tr></thead><tbody>{chartData.map((point) => <tr key={point.label} className="border-t border-[#e6eff8]"><td className="px-3 py-2.5 text-xs font-semibold text-[#304a63]">{point.label}</td><td className="px-3 py-2.5 text-right text-xs font-bold text-[#0f6cbd]">{formatKz(point.value)}</td></tr>)}</tbody></table></div> : <div className="h-52 rounded-md border border-[#dbe8f5] bg-white p-2"><ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>{visualization.type === "bar" ? <BarChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}><CartesianGrid vertical={false} stroke="#e7eff8" strokeDasharray="3 3" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={axisTick} /><YAxis axisLine={false} tickLine={false} tick={axisTick} tickFormatter={(value) => formatKz(value)} width={56} /><Tooltip cursor={{ fill: "#edf6ff" }} contentStyle={{ borderRadius: "6px", border: "1px solid #cfe2f5", boxShadow: "0 4px 12px rgba(29, 89, 143, 0.12)", fontSize: "11px" }} formatter={(value: number) => [formatKz(value), visualization.seriesLabel]} /><Bar dataKey="value" fill="#0f6cbd" radius={[3, 3, 0, 0]} /></BarChart> : <AreaChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}><defs><linearGradient id="aiChartGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#0f6cbd" stopOpacity={0.25} /><stop offset="100%" stopColor="#0f6cbd" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#e7eff8" strokeDasharray="3 3" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={axisTick} /><YAxis axisLine={false} tickLine={false} tick={axisTick} tickFormatter={(value) => formatKz(value)} width={56} /><Tooltip contentStyle={{ borderRadius: "6px", border: "1px solid #cfe2f5", boxShadow: "0 4px 12px rgba(29, 89, 143, 0.12)", fontSize: "11px" }} formatter={(value: number) => [formatKz(value), visualization.seriesLabel]} /><Area type="monotone" dataKey="value" stroke="#0f6cbd" strokeWidth={2.4} fill="url(#aiChartGradient)" /></AreaChart>}</ResponsiveContainer></div>}</div></section>;
}
