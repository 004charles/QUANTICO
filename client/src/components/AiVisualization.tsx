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

const axisTick = { fill: "#6682a0", fontSize: 10 };

export function AiVisualization({ visualization }: { visualization: AiVisualizationSpec }) {
  const chartData = visualization.data.map((point) => ({ ...point, label: point.label.replace(" de ", " ") }));
  return <section className="quantico-card overflow-hidden p-5"><div className="flex flex-wrap items-baseline justify-between gap-2"><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#4778a5]">Gráfico da resposta</p><h2 className="mt-1 text-base font-extrabold tracking-[-0.04em] text-[#102a43]">{visualization.title}</h2></div><span className="rounded-full bg-[#e8f3ff] px-2.5 py-1 text-[10px] font-bold text-[#246ba9]">{visualization.seriesLabel}</span></div><p className="mt-2 text-xs leading-5 text-[#6a8198]">Valores calculados a partir das métricas importadas. Passe o cursor para ver cada período.</p>{visualization.type === "table" ? <div className="mt-4 overflow-hidden rounded-xl border border-[#dbe8f5]"><table className="w-full text-left"><thead className="bg-[#f4f9ff]"><tr><th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#62809d]">Período</th><th className="px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-[0.1em] text-[#62809d]">{visualization.seriesLabel}</th></tr></thead><tbody>{chartData.map((point) => <tr key={point.label} className="border-t border-[#e6eff8]"><td className="px-3 py-2.5 text-xs font-semibold text-[#24405b]">{point.label}</td><td className="px-3 py-2.5 text-right text-xs font-extrabold text-[#0f5fa8]">{formatKz(point.value)}</td></tr>)}</tbody></table></div> : <div className="mt-4 h-52 rounded-xl border border-[#e0ecf8] bg-[#fbfdff] p-2"><ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>{visualization.type === "bar" ? <BarChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}><CartesianGrid vertical={false} stroke="#e7eff8" strokeDasharray="3 3" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={axisTick} /><YAxis axisLine={false} tickLine={false} tick={axisTick} tickFormatter={(value) => formatKz(value)} width={56} /><Tooltip cursor={{ fill: "#edf6ff" }} contentStyle={{ borderRadius: "10px", border: "1px solid #cfe2f5", boxShadow: "0 8px 18px rgba(29, 89, 143, 0.12)", fontSize: "11px" }} formatter={(value: number) => [formatKz(value), visualization.seriesLabel]} /><Bar dataKey="value" fill="#1874bd" radius={[5, 5, 0, 0]} /></BarChart> : <AreaChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}><defs><linearGradient id="aiChartGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#1b78c1" stopOpacity={0.35} /><stop offset="100%" stopColor="#1b78c1" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#e7eff8" strokeDasharray="3 3" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={axisTick} /><YAxis axisLine={false} tickLine={false} tick={axisTick} tickFormatter={(value) => formatKz(value)} width={56} /><Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #cfe2f5", boxShadow: "0 8px 18px rgba(29, 89, 143, 0.12)", fontSize: "11px" }} formatter={(value: number) => [formatKz(value), visualization.seriesLabel]} /><Area type="monotone" dataKey="value" stroke="#0f69b3" strokeWidth={2.6} fill="url(#aiChartGradient)" /></AreaChart>}</ResponsiveContainer></div>}</section>;
}
