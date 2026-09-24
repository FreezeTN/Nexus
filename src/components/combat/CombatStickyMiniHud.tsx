import React, { useState, useEffect } from 'react';
import { CharacterData, RuleEdition } from '../../types';
import {
  Heart,
  Shield,
  Footprints,
  Zap,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  X
} from 'lucide-react';

interface CombatStickyMiniHudProps {
  character: CharacterData;
  edition?: RuleEdition;
  onUpdateCharacter?: (updated: CharacterData) => void;
  onScrollToTop?: () => void;
  effectiveAc?: number;
  touchAc?: number;
  flatFootedAc?: number;
}

export const CombatStickyMiniHud: React.FC<CombatStickyMiniHudProps> = ({
  character,
  edition,
  onUpdateCharacter,
  onScrollToTop,
  effectiveAc = 10,
  touchAc,
  flatFootedAc
}) => {
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => {
    try {
      return localStorage.getItem('nexus_mini_hud_minimized') === 'true';
    } catch {
      return false;
    }
  });

  const is35e = character.edition === '3.5e' || edition === '3.5e';
  const effectiveMaxHp = character.hpMax || 1;
  const currentHp = character.hpCurrent ?? effectiveMaxHp;
  const tempHp = character.hpTemp || 0;
  const hpPercent = Math.max(0, Math.min(100, Math.round((currentHp / effectiveMaxHp) * 100)));
  const baseSpeed = character.speed || 30;
  const remainingSpeed = character.actionEconomy?.remainingSpeed ?? baseSpeed;
  const conditions = character.conditions || [];

  // Scroll position listener with hysteresis
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      // Show HUD when user has scrolled past ~320px (past top defenses/turn bar)
      if (scrollY > 340) {
        setIsScrolledDown(true);
      } else if (scrollY < 260) {
        setIsScrolledDown(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(prev => {
      const next = !prev;
      try {
        localStorage.setItem('nexus_mini_hud_minimized', String(next));
      } catch {}
      return next;
    });
  };

  const handleAdjustHp = (delta: number) => {
    if (!onUpdateCharacter) return;
    const nextHp = Math.max(-10, Math.min(effectiveMaxHp + tempHp, currentHp + delta));
    onUpdateCharacter({
      ...character,
      hpCurrent: nextHp
    });
  };

  const handleRemoveCondition = (condName: string) => {
    if (!onUpdateCharacter) return;
    onUpdateCharacter({
      ...character,
      conditions: conditions.filter(c => c !== condName)
    });
  };

  const scrollToTop = () => {
    if (onScrollToTop) {
      onScrollToTop();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // If not scrolled down, don't take up any space
  if (!isScrolledDown) {
    return null;
  }

  // MINIMIZED PILL: Compact floating pill on bottom-right or top-right
  if (isMinimized) {
    return (
      <aside aria-label="Combat Mini HUD" className="fixed bottom-4 right-4 z-40 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div
          onClick={toggleMinimize}
          className="bg-stone-950/95 backdrop-blur-md border border-amber-500/60 hover:border-amber-400 text-stone-200 px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-2.5 cursor-pointer text-xs font-mono transition transform hover:scale-105"
          title="Click to expand Combat Mini-HUD"
        >
          <div className="flex items-center gap-1.5 font-bold">
            <Heart className={`w-3.5 h-3.5 ${currentHp <= 0 ? 'text-red-500 animate-pulse' : 'text-rose-400'}`} />
            <span className={currentHp <= 0 ? 'text-red-400' : 'text-stone-100'}>
              {currentHp}/{effectiveMaxHp}
            </span>
          </div>

          <div className="flex items-center gap-1 font-bold text-amber-300 border-l border-stone-800 pl-2">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>{effectiveAc}</span>
          </div>

          <span className="text-[10px] text-stone-400 bg-stone-900 border border-stone-800 px-1.5 py-0.5 rounded-full">
            HUD
          </span>
          <ChevronUp className="w-3.5 h-3.5 text-stone-400" />
        </div>
      </aside>
    );
  }

  // FULL FLOATING BAR: Sleek, high-information tactical strip docked at top of viewport
  return (
    <aside aria-label="Combat Mini HUD" className="sticky top-2 z-40 mb-3 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="max-w-7xl mx-auto px-2">
        <div className="bg-stone-950/95 backdrop-blur-md border border-amber-600/50 hover:border-amber-500/70 rounded-2xl px-3 py-2 shadow-2xl text-xs flex items-center justify-between gap-3 flex-wrap transition">
          {/* Section 1: Character identity & HP Bar */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-stone-100 truncate max-w-[120px] sm:max-w-[180px] text-xs">
                {character.name}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-stone-900 text-stone-400 border border-stone-800">
                {is35e ? '3.5e' : '5e'}
              </span>
            </div>

            {/* Quick HP Status with mini progress bar */}
            <div className="flex items-center gap-2 bg-stone-900/90 border border-stone-800 px-2 py-1 rounded-xl">
              <Heart className={`w-3.5 h-3.5 shrink-0 ${currentHp <= 0 ? 'text-red-500 animate-pulse' : 'text-rose-500'}`} />
              <div className="flex flex-col min-w-[70px]">
                <div className="flex items-center justify-between text-[11px] font-mono font-bold leading-none mb-1">
                  <span className={currentHp <= 0 ? 'text-red-400' : 'text-stone-200'}>
                    {currentHp}
                  </span>
                  <span className="text-[9px] text-stone-500 font-normal">/ {effectiveMaxHp}</span>
                  {tempHp > 0 && <span className="text-[9px] text-sky-400 font-normal">+{tempHp}</span>}
                </div>
                <div className="w-full bg-stone-950 h-1.5 rounded-full overflow-hidden border border-stone-800">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      hpPercent > 50
                        ? 'bg-emerald-500'
                        : hpPercent > 25
                          ? 'bg-amber-500'
                          : 'bg-rose-600 animate-pulse'
                    }`}
                    style={{ width: `${hpPercent}%` }}
                  />
                </div>
              </div>

              {/* Quick +/- 5 HP buttons */}
              {onUpdateCharacter && (
                <div className="flex items-center gap-0.5 ml-1">
                  <button
                    type="button"
                    onClick={() => handleAdjustHp(-5)}
                    className="px-1.5 py-0.5 bg-stone-800 hover:bg-rose-950 hover:text-rose-300 border border-stone-700 rounded text-[9px] font-mono transition cursor-pointer"
                    title="Take 5 damage"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustHp(5)}
                    className="px-1.5 py-0.5 bg-stone-800 hover:bg-emerald-950 hover:text-emerald-300 border border-stone-700 rounded text-[9px] font-mono transition cursor-pointer"
                    title="Heal 5 HP"
                  >
                    +5
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Defenses (AC, Touch, Flat-Footed) & Speed */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 bg-stone-900/90 border border-amber-600/40 px-2 py-1 rounded-xl" title="Armor Class">
              <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-bold text-amber-200">AC {effectiveAc}</span>
              {is35e && touchAc !== undefined && (
                <span className="text-[9.5px] text-stone-400 border-l border-stone-800 pl-1.5" title="Touch AC">
                  T:{touchAc}
                </span>
              )}
              {is35e && flatFootedAc !== undefined && (
                <span className="text-[9.5px] text-stone-400 border-l border-stone-800 pl-1.5" title="Flat-Footed AC">
                  FF:{flatFootedAc}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 bg-stone-900/90 border border-stone-800 px-2 py-1 rounded-xl text-emerald-400" title="Remaining Speed">
              <Footprints className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-bold">{remainingSpeed}</span>
              <span className="text-[9px] text-stone-500">/{baseSpeed}ft</span>
            </div>
          </div>

          {/* Section 3: Action Economy Quick Status Chips */}
          <div className="hidden md:flex items-center gap-1 text-[10px] font-mono">
            {is35e ? (
              <>
                <span
                  className={`px-1.5 py-0.5 rounded border ${
                    character.actionEconomy?.standardActionUsed
                      ? 'bg-stone-900 text-stone-500 border-stone-800 line-through opacity-60'
                      : 'bg-amber-950/60 text-amber-300 border-amber-700/60 font-bold'
                  }`}
                  title="Standard Action"
                >
                  Std
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded border ${
                    character.actionEconomy?.moveActionUsed
                      ? 'bg-stone-900 text-stone-500 border-stone-800 line-through opacity-60'
                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60 font-bold'
                  }`}
                  title="Move Action"
                >
                  Move
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded border ${
                    character.actionEconomy?.swiftActionUsed || character.actionEconomy?.immediateActionUsed
                      ? 'bg-stone-900 text-stone-500 border-stone-800 line-through opacity-60'
                      : 'bg-purple-950/60 text-purple-300 border-purple-700/60 font-bold'
                  }`}
                  title="Swift / Immediate Action"
                >
                  Swift
                </span>
              </>
            ) : (
              <>
                <span
                  className={`px-1.5 py-0.5 rounded border ${
                    character.actionEconomy?.actionUsed5e
                      ? 'bg-stone-900 text-stone-500 border-stone-800 line-through opacity-60'
                      : 'bg-amber-950/60 text-amber-300 border-amber-700/60 font-bold'
                  }`}
                  title="Action"
                >
                  Action
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded border ${
                    character.actionEconomy?.bonusActionUsed5e
                      ? 'bg-stone-900 text-stone-500 border-stone-800 line-through opacity-60'
                      : 'bg-purple-950/60 text-purple-300 border-purple-700/60 font-bold'
                  }`}
                  title="Bonus Action"
                >
                  Bonus
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded border ${
                    character.actionEconomy?.reactionUsed5e
                      ? 'bg-stone-900 text-stone-500 border-stone-800 line-through opacity-60'
                      : 'bg-cyan-950/60 text-cyan-300 border-cyan-700/60 font-bold'
                  }`}
                  title="Reaction"
                >
                  React
                </span>
              </>
            )}
          </div>

          {/* Section 4: Active Conditions preview with 1-click dismiss */}
          {conditions.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] py-0.5 text-[9.5px] font-mono">
              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
              {conditions.slice(0, 2).map(cond => (
                <span
                  key={cond}
                  className="bg-amber-950/80 border border-amber-600/70 text-amber-200 px-1.5 py-0.2 rounded-md flex items-center gap-1 shrink-0"
                >
                  <span className="truncate max-w-[60px]">{cond}</span>
                  {onUpdateCharacter && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCondition(cond)}
                      className="hover:text-amber-100 hover:font-bold cursor-pointer"
                      title={`Remove ${cond}`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </span>
              ))}
              {conditions.length > 2 && (
                <span className="text-stone-400 font-bold">+{conditions.length - 2}</span>
              )}
            </div>
          )}

          {/* Section 5: Controls (Scroll To Top & Minimize) */}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            <button
              type="button"
              onClick={scrollToTop}
              className="px-2 py-1 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white rounded-lg border border-stone-800 flex items-center gap-1 text-[11px] transition cursor-pointer"
              title="Scroll back to Defenses & Stats"
            >
              <ArrowUp className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Defenses</span>
            </button>

            <button
              type="button"
              onClick={toggleMinimize}
              className="p-1 hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded-lg border border-stone-800 transition cursor-pointer"
              title="Minimize HUD to corner pill"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
