import React from 'react';
import { Palette, Check, Lock, Sparkles } from 'lucide-react';
import { SHEET_THEMES, SheetTheme, useSheetTheme } from '../../../context/ThemeContext';
import { useSubscription } from '../../../context/SubscriptionContext';

interface ThemesTabProps {
  onOpenUpgradeModal?: (reason?: string, requiredTier?: 'hero' | 'guild') => void;
}

export const ThemesTab: React.FC<ThemesTabProps> = ({ onOpenUpgradeModal }) => {
  const { currentTheme, setTheme, accentColor, setAccentColor } = useSheetTheme();
  const { isHero, isGuild, isDeveloper, openUpgradeModal } = useSubscription();

  const handleSelectTheme = (theme: SheetTheme) => {
    if (!isDeveloper) {
      if (theme.requiredTier === 'guild' && !isGuild) {
        const msg = `The "${theme.name}" character sheet visual theme requires the Guild Master Supporter tier.`;
        if (onOpenUpgradeModal) onOpenUpgradeModal(msg, 'guild');
        else openUpgradeModal(msg, 'guild');
        return;
      }
      if (theme.requiredTier === 'hero' && !isHero) {
        const msg = `The "${theme.name}" character sheet visual theme requires the Hero Supporter tier.`;
        if (onOpenUpgradeModal) onOpenUpgradeModal(msg, 'hero');
        else openUpgradeModal(msg, 'hero');
        return;
      }
    }

    setTheme(theme.id);
  };

  const presetAccents = [
    { label: 'Amber Gold', hex: '#f59e0b' },
    { label: 'Crimson Rose', hex: '#f43f5e' },
    { label: 'Emerald Forest', hex: '#10b981' },
    { label: 'Arcane Purple', hex: '#a855f7' },
    { label: 'Astral Cyan', hex: '#06b6d4' },
    { label: 'Molten Flame', hex: '#f97316' },
  ];

  return (
    <div className="space-y-6 text-stone-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-3">
        <div>
          <h3 className="text-lg font-bold font-serif text-amber-200 flex items-center gap-2">
            <Palette className="w-5 h-5 text-amber-400" />
            Character Sheet Themes & Color Palettes
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Personalize your character sheets, headers, stat boxes, and visual atmosphere.
          </p>
        </div>
        <div className="text-xs font-mono text-stone-400 bg-stone-800/80 px-3 py-1 rounded-lg border border-stone-700">
          Active: <strong className="text-amber-300">{currentTheme.name}</strong>
        </div>
      </div>

      {/* Theme Cards Grid */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
          Visual Atmosphere Themes
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SHEET_THEMES.map((theme) => {
            const isSelected = currentTheme.id === theme.id;
            const isLocked = !isDeveloper && (
              (theme.requiredTier === 'guild' && !isGuild) ||
              (theme.requiredTier === 'hero' && !isHero)
            );

            return (
              <div
                key={theme.id}
                onClick={() => handleSelectTheme(theme)}
                className={`relative rounded-xl p-4 border-2 transition cursor-pointer flex flex-col justify-between overflow-hidden ${
                  isSelected
                    ? 'border-amber-400 bg-stone-900/95 ring-2 ring-amber-500/30 shadow-xl'
                    : 'border-stone-800 bg-stone-900/60 hover:border-stone-600 hover:bg-stone-900/80'
                }`}
              >
                {/* Header row */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-serif text-base text-stone-100">
                        {theme.name}
                      </span>
                      {theme.requiredTier && theme.requiredTier !== 'free' && (
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase ${
                          theme.requiredTier === 'guild' 
                            ? 'bg-purple-950/80 text-cyan-300 border-purple-500/50' 
                            : 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                        }`}>
                          {theme.requiredTier}
                        </span>
                      )}
                    </div>
                    {isLocked ? (
                      <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-950/60 border border-amber-600/40 px-2 py-0.5 rounded-md">
                        <Lock className="w-3.5 h-3.5" /> Unlock
                      </span>
                    ) : isSelected ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/80 border border-emerald-600/50 px-2 py-0.5 rounded-md font-bold">
                        <Check className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed mb-3">
                    {theme.description}
                  </p>
                </div>

                {/* Color Swatch Preview Strip */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-800/80 mt-auto">
                  <div className="flex items-center gap-1.5">
                    {theme.previewColors.map((col, idx) => (
                      <span
                        key={idx}
                        className="w-5 h-5 rounded-full border border-stone-700 shadow-sm"
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-mono text-stone-500 capitalize">
                    {theme.category}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Accent Color Palette */}
      <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-4 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Quick Accent Highlight Tint
        </h4>
        <div className="flex flex-wrap gap-2">
          {presetAccents.map((accent) => (
            <button
              key={accent.hex}
              type="button"
              onClick={() => setAccentColor(accent.hex)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                accentColor === accent.hex
                  ? 'border-amber-400 bg-stone-800 text-white ring-2 ring-amber-400/30'
                  : 'border-stone-700 bg-stone-950/60 text-stone-300 hover:border-stone-500'
              }`}
            >
              <span className="w-3.5 h-3.5 rounded-full border border-stone-600" style={{ backgroundColor: accent.hex }} />
              <span>{accent.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
