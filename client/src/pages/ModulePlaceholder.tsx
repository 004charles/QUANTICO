import { DemoBadge } from "@/components/DemoBadge";
import { ArrowUpRight, Construction, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

type ModulePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export default function ModulePlaceholder({ eyebrow, title, description }: ModulePlaceholderProps) {
  const [, setLocation] = useLocation();

  return (
    <section className="quantico-card relative min-h-[520px] overflow-hidden p-6 sm:p-10">
      <div className="absolute -right-12 -top-10 size-52 rounded-full bg-[#dbeafe]" />
      <div className="absolute bottom-[-76px] left-[30%] size-44 rotate-12 rounded-[34px] bg-[#f8e2e7]" />
      <div className="relative max-w-2xl">
        <DemoBadge />
        <p className="mt-10 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7d8a8c]">{eyebrow}</p>
        <h1 className="mt-3 text-[34px] font-extrabold leading-[1.03] tracking-[-0.065em] text-[#172122] sm:text-[46px]">{title}</h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-[#667576]">{description}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <button onClick={() => setLocation("/ask-quantico")} className="quantico-dark-button inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold"><Sparkles className="size-4" />Pergunte ao seu negócio<ArrowUpRight className="size-4" /></button>
          <div className="inline-flex items-center gap-2 rounded-xl bg-[#eff2f2] px-4 py-3 text-sm font-medium text-[#718082]"><Construction className="size-4" />Módulo a ser detalhado na próxima etapa</div>
        </div>
      </div>
    </section>
  );
}
