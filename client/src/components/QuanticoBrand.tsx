type QuanticoBrandProps = {
  compact?: boolean;
  className?: string;
};

export function QuanticoBrand({ compact = false, className = "" }: QuanticoBrandProps) {
  if (compact) {
    return (
      <div className={`flex size-9 items-center justify-center rounded-lg bg-[#e7f1ff] text-sm font-black tracking-[-0.08em] text-[#0b4d91] ${className}`} aria-label="Quantico Intelligence">
        Q
      </div>
    );
  }

  return (
    <div className={`flex h-10 min-w-0 items-center ${className}`} aria-label="Quantico Intelligence">
      <div className="leading-none">
        <p className="text-sm font-black tracking-[0.13em] text-white">QUANTICO</p>
        <p className="mt-1 text-[7px] font-bold tracking-[0.2em] text-[#b9d6f5]">INTELLIGENCE</p>
      </div>
    </div>
  );
}
