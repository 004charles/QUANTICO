type QuanticoBrandProps = {
  compact?: boolean;
  className?: string;
};

const quanticoLockup = "/manus-storage/quantico-lockup-branco_1b49d362.png";

export function QuanticoBrand({ compact = false, className = "" }: QuanticoBrandProps) {
  if (compact) {
    return (
      <div className={`flex size-9 items-center justify-center rounded-xl bg-[#dbeafe] text-sm font-black tracking-[-0.08em] text-[#172122] ${className}`} aria-label="Quantico Intelligence">
        Q
      </div>
    );
  }

  return (
    <div className={`flex h-10 min-w-0 items-center ${className}`}>
      <img
        src={quanticoLockup}
        alt="Quantico Intelligence"
        className="h-9 w-auto max-w-[156px] object-contain object-left"
        onError={(event) => {
          event.currentTarget.style.display = "none";
          event.currentTarget.nextElementSibling?.classList.remove("hidden");
        }}
      />
      <span className="hidden text-xs font-extrabold tracking-[-0.04em] text-white">QUANTICO</span>
    </div>
  );
}
