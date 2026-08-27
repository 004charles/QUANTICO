import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

type MetricCardProps = {
  label: string;
  value: string;
  change: string;
  detail: string;
  positive?: boolean;
  icon: LucideIcon;
  accent?: "blue" | "blush" | "mint" | "ink";
};

const accents = {
  blue: "bg-[#e5f1ff] text-[#0f67b5]",
  blush: "bg-[#edf6ff] text-[#297bbf]",
  mint: "bg-[#e9f4ff] text-[#256eae]",
  ink: "bg-[#e7f0fa] text-[#235b8f]",
};

export function MetricCard({ label, value, change, detail, positive = true, icon: Icon, accent = "blue" }: MetricCardProps) {
  return (
    <article className="quantico-card group relative overflow-hidden p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#58718a]">{label}</p>
          <p className="mt-3 text-[27px] font-extrabold tracking-[-0.065em] text-[#102a43] sm:text-[30px]">{value}</p>
        </div>
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${accents[accent]}`}>
          <Icon className="size-[18px]" strokeWidth={1.8} />
        </div>
      </div>
      <div className="mt-5 flex items-center gap-2 text-xs">
        <span className={`inline-flex items-center gap-0.5 font-bold ${positive ? "text-[#1371b9]" : "text-[#2d6fa7]"}`}>
          {positive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
          {change}
        </span>
        <span className="text-[#71859a]">{detail}</span>
      </div>
    </article>
  );
}
