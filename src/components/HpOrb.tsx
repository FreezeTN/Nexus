import React from 'react';

interface HpOrbProps {
  hpCurrent: number;
  hpMax: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const getHpColorClass = (pct: number): string => {
  if (pct >= 75) return 'text-emerald-400';
  if (pct >= 50) return 'text-amber-400';
  if (pct >= 25) return 'text-orange-400';
  return 'text-rose-500 animate-pulse';
};

export const HpOrb: React.FC<HpOrbProps> = ({
  hpCurrent,
  hpMax,
  size = 'md',
  showLabel = true
}) => {
  const safeMax = Math.max(1, hpMax);
  const pct = Math.max(0, Math.min(100, Math.round((hpCurrent / safeMax) * 100)));

  let sizeClasses = 'w-10 h-10';
  let fontClass = 'text-[10px]';
  if (size === 'sm') {
    sizeClasses = 'w-7 h-7';
    fontClass = 'text-[9px]';
  } else if (size === 'lg') {
    sizeClasses = 'w-14 h-14';
    fontClass = 'text-xs';
  }

  let liquidBg = 'from-emerald-600 via-emerald-500 to-emerald-400';
  let orbBorder = 'border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
  let textColor = 'text-emerald-300';

  if (pct < 25) {
    liquidBg = 'from-rose-700 via-rose-600 to-rose-500';
    orbBorder = 'border-rose-500/80 shadow-[0_0_14px_rgba(244,63,94,0.5)] animate-pulse';
    textColor = 'text-rose-200';
  } else if (pct < 50) {
    liquidBg = 'from-orange-600 via-orange-500 to-orange-400';
    orbBorder = 'border-orange-500/60 shadow-[0_0_10px_rgba(249,115,22,0.3)]';
    textColor = 'text-orange-300';
  } else if (pct < 75) {
    liquidBg = 'from-amber-600 via-amber-500 to-amber-400';
    orbBorder = 'border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.3)]';
    textColor = 'text-amber-300';
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={`relative ${sizeClasses} rounded-full border-2 ${orbBorder} bg-stone-950 overflow-hidden flex items-center justify-center shrink-0 group transition-all cursor-help`}
        title={`Hit Points: ${hpCurrent} / ${hpMax} (${pct}%)`}
      >
        {/* Glass reflection shine */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-full pointer-events-none z-20" />

        {/* Animated Liquid Fill Level */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${liquidBg} transition-all duration-700 ease-out z-10`}
          style={{ height: `${pct}%` }}
        >
          {/* Surface Wave Effect */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/40 animate-pulse" />
        </div>

        {/* Center Percentage Display inside Orb */}
        <span className={`relative z-30 font-mono font-extrabold ${fontClass} ${textColor} drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]`}>
          {pct}%
        </span>
      </div>

      {showLabel && (
        <div className="flex flex-col text-left">
          <span className="text-[10px] uppercase font-mono font-bold text-stone-400 leading-tight">
            Vitality
          </span>
          <span className={`font-mono font-extrabold text-xs sm:text-sm ${getHpColorClass(pct)}`}>
            {hpCurrent} <span className="text-stone-500 font-normal">/</span> {hpMax}
          </span>
        </div>
      )}
    </div>
  );
};
