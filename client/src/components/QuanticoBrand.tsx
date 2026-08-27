type QuanticoBrandProps = {
  compact?: boolean;
  className?: string;
};

export function QuanticoBrand({ compact = false, className = "" }: QuanticoBrandProps) {
  if (compact) {
    return (
      <div className={`quantico-mark flex size-9 items-center justify-center rounded-md ${className}`} aria-label="Quantico Intelligence">
        <span className="quantico-mark-core">Q</span>
      </div>
    );
  }

  return (
    <div className={`flex h-10 min-w-0 items-center gap-2.5 ${className}`} aria-label="Quantico Intelligence">
      <div className="quantico-mark flex size-8 shrink-0 items-center justify-center rounded-md">
        <span className="quantico-mark-core">Q</span>
      </div>
      <div className="leading-none">
        <p className="text-[13px] font-bold tracking-[0.08em] text-white">QUANTICO</p>
        <p className="mt-1 text-[7px] font-medium tracking-[0.16em] text-white/75">INTELLIGENCE</p>
      </div>
    </div>
  );
}
