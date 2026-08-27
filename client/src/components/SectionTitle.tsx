import { ArrowUpRight } from "lucide-react";

type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  action?: string;
  onAction?: () => void;
};

export function SectionTitle({ eyebrow, title, action, onAction }: SectionTitleProps) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#819092]">{eyebrow}</p> : null}
        <h2 className="text-lg font-bold tracking-[-0.04em] text-[#152021]">{title}</h2>
      </div>
      {action ? (
        <button onClick={onAction} className="quantico-link inline-flex shrink-0 items-center gap-1 text-xs font-semibold">
          {action}
          <ArrowUpRight className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
