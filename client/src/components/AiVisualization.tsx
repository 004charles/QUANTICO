import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type AiVisualizationSpec = {
  type: "bar" | "line" | "table";
  title: string;
  seriesLabel: string;
  data: Array<{ label: string; value: number }>;
};

export function AiVisualization({ visualization }: { visualization: AiVisualizationSpec }) {
  return <section className="quantico-card overflow-hidden p-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#758486]">Evidência analítica</p><h2 className="mt-1 text-sm font-bold tracking-[-0.03em] text-[#233031]">{visualization.title}</h2><div className="mt-4 h-44"><ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={150}><AreaChart data={visualization.data} margin={{ top: 6, right: 2, left: -16, bottom: 0 }}><defs><linearGradient id="aiChartGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#7fa9d6" stopOpacity={0.32} /><stop offset="100%" stopColor="#7fa9d6" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#e8eeee" strokeDasharray="4 4" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#819092", fontSize: 10 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#819092", fontSize: 10 }} tickFormatter={(value) => `${Math.round(value / 1_000_000)}M`} /><Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e1e8e8", boxShadow: "0 8px 18px rgba(24,35,35,0.08)", fontSize: "11px" }} formatter={(value: number) => [`${value.toLocaleString("pt-AO")} Kz`, visualization.seriesLabel]} /><Area type="monotone" dataKey="value" stroke="#4e88c2" strokeWidth={2.3} fill="url(#aiChartGradient)" /></AreaChart></ResponsiveContainer></div></section>;
}
