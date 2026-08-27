import { Sparkles } from "lucide-react";
import { useLocation } from "wouter";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  askCta?: boolean;
};

export function PageHeader({ eyebrow, title, description, askCta = true }: PageHeaderProps) {
  const [, setLocation] = useLocation();
  return (
    <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div className="max-w-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5c7187]">{eyebrow}</p>
        <h1 className="mt-2 text-[28px] font-bold leading-[1.14] tracking-[-0.045em] text-[#242424] sm:text-[34px]">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-[#5f6872]">{description}</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {askCta ? <button onClick={() => setLocation("/ask-quantico")} className="quantico-dark-button inline-flex items-center gap-2 rounded-md px-3.5 py-2.5 text-xs font-semibold"><Sparkles className="size-3.5" />Pergunte ao seu negócio</button> : null}
      </div>
    </header>
  );
}
