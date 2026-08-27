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
  blue: "bg-[#eaf3fc] text-[#0b62b4]",
  blush: "bg-[#f0f6fc] text-[#286ba8]",
  mint: "bg-[#eef5fb] text-[#25639b]",
  ink: "bg-[#f1f5f9] text-[#315f8a]",
};

export function MetricCard({ label, value, change, detail, positive = true, icon: Icon, accent = "blue" }: MetricCardProps) {
  return (
    <article className="quantico-card group relative overflow-hidden p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#5d6875]">{label}</p>
          <p className="mt-3 text-[26px] font-bold tracking-[-0.05em] text-[#242424] sm:text-[29px]">{value}</p>
        </div>
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${accents[accent]}`}>
          <Icon className="size-[18px]" strokeWidth={1.8} />
        </div>
      </div>
      <div className="mt-5 flex items-center gap-2 text-xs">
        <span className={`inline-flex items-center gap-0.5 font-semibold ${positive ? "text-[#0b62b4]" : "text-[#4b6d8e]"}`}>
          {positive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
          {change}
        </span>
        <span className="text-[#697785]">{detail}</span>
      </div>
    </article>
  );
}
