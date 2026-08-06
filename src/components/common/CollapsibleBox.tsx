import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleBoxProps {
  title: React.ReactNode;
  icon?: React.ReactNode;
  headerExtra?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  storageKey?: string;
}

export const CollapsibleBox: React.FC<CollapsibleBoxProps> = ({
  title,
  icon,
  headerExtra,
  badge,
  children,
  defaultOpen = true,
  className = "bg-stone-900 border border-stone-800 rounded-2xl p-4 md:p-6 shadow-xl space-y-4",
  headerClassName = "",
  bodyClassName = "",
  storageKey
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(`collapsible_${storageKey}`);
        if (saved !== null) return saved === 'true';
      } catch (e) {
        // Fallback if localStorage unavailable
      }
    }
    return defaultOpen;
  });

  const toggleOpen = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (storageKey) {
      try {
        localStorage.setItem(`collapsible_${storageKey}`, String(next));
      } catch (e) {
        // Ignore localStorage error
      }
    }
  };

  return (
    <div className={className}>
      <div className={`flex items-center justify-between border-b border-stone-800/80 pb-3 select-none ${headerClassName}`}>
        <button
          type="button"
          onClick={toggleOpen}
          className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none transition-colors"
        >
          <div className="p-1 rounded-lg bg-stone-950 border border-stone-800 group-hover:border-amber-500/50 group-hover:bg-stone-800 transition-colors">
            {isOpen ? (
              <ChevronDown className="w-4 h-4 text-amber-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-amber-400" />
            )}
          </div>
          {icon && <span className="text-amber-500">{icon}</span>}
          <div className="font-serif font-bold text-amber-200 text-base md:text-lg group-hover:text-amber-300 transition-colors flex items-center gap-2">
            {title}
            {badge}
          </div>
        </button>

        {headerExtra && (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {headerExtra}
          </div>
        )}
      </div>

      {isOpen && (
        <div className={`transition-all duration-200 ${bodyClassName}`}>
          {children}
        </div>
      )}
    </div>
  );
};
