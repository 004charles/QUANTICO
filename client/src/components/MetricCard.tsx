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
  blue: "bg-[#dbeafe] text-[#3977b9]",
  blush: "bg-[#f8e2e7] text-[#a86172]",
  mint: "bg-[#dfeee9] text-[#4f8975]",
  ink: "bg-[#e7ebeb] text-[#374243]",
};

export function MetricCard({ label, value, change, detail, positive = true, icon: Icon, accent = "blue" }: MetricCardProps) {
  return (
    <article className="quantico-card group relative overflow-hidden p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#6f7c7d]">{label}</p>
          <p className="mt-3 text-[27px] font-extrabold tracking-[-0.065em] text-[#101718] sm:text-[30px]">{value}</p>
        </div>
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${accents[accent]}`}>
          <Icon className="size-[18px]" strokeWidth={1.8} />
        </div>
      </div>
      <div className="mt-5 flex items-center gap-2 text-xs">
        <span className={`inline-flex items-center gap-0.5 font-bold ${positive ? "text-[#47806f]" : "text-[#b95f71]"}`}>
          {positive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
          {change}
        </span>
        <span className="text-[#8a9697]">{detail}</span>
      </div>
    </article>
  );
}
