import React from 'react';
import { CharacterData } from '../../../types';
import { getAbilityModifier } from '../../../utils/dndCalculations';
import { Brain, Sparkles, Dices } from 'lucide-react';
import { useLanguage } from '../../../i18n/LanguageContext';

const SHORT_TERM_MADNESS_TABLE = [
  "The character retreats into his or her mind and becomes paralyzed until cured or 1d10 minutes pass.",
  "The character becomes incapacitated and spends the duration screaming, weeping, or laughing maniacally.",
  "The character becomes frightened and must use his or her action to flee from the source of fear.",
  "The character begins babbling incoherently and cannot speak or cast spells with verbal components.",
  "The character falls unconscious and cannot be awakened for 1d10 minutes.",
  "The character experiences vivid hallucinations and has disadvantage on all ability checks and attack rolls.",
  "The character becomes overpowered by extreme paranoia. All creatures are treated as hostile.",
  "The character faints on the spot and drops all held weapons and items."
];

const LONG_TERM_MADNESS_TABLE = [
  "The character feels compelled to repeat a specific action, such as washing hands or checking locks, every 10 minutes.",
  "The character experiences severe amnesia and knows his or her name, but remembers nothing else.",
  "The character suffers from vivid phobia and becomes frightened when in the presence of the trauma trigger.",
  "The character loses the ability to speak or comprehend any written or spoken language for 1d10 x 10 hours.",
  "The character suffers from tremors and uncontrollable twitching (-2 to Dexterity checks and attack rolls).",
  "The character refuses to eat or drink, believing all food and water is poisoned by malevolent forces.",
  "The character experiences terrifying auditory hallucinations whispering dark secrets constantly."
];

const INDEFINITE_MADNESS_TABLE = [
  "Flaw: 'There is only one person I can truly trust, and only I can keep them safe from the darkness.'",
  "Flaw: 'I see omens of doom and eldritch symbols in every shadow and corner.'",
  "Flaw: 'I must collect and hoard every ancient artifact or secret tome I encounter.'",
  "Flaw: 'I am convinced that I am an immortal cosmic vessel immune to mortal wounds.'",
  "Flaw: 'I cannot sleep without keeping a lit candle or torch directly next to my head.'",
  "Flaw: 'I believe everyone around me has been replaced by uncanny cosmic double impersonators.'"
];

interface SanityMadnessPanelProps {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRoll: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
}

export const SanityMadnessPanel: React.FC<SanityMadnessPanelProps> = ({
  character,
  onUpdateCharacter,
  onRoll
}) => {
  const { t } = useLanguage();
  return (
    <div className="bg-stone-900 border border-emerald-600/50 rounded-2xl p-4 md:p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-950 rounded-xl border border-emerald-500/50">
            <Brain className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-serif font-bold text-emerald-200 flex items-center gap-2">
              Sanity & Madness System
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600/40 text-emerald-300 uppercase">
                DMG p.264 / Call of Cthulhu
              </span>
            </h3>
            <p className="text-xs text-stone-400">
              Track mental composure, Sanity saving throws, and Short-Term, Long-Term, or Indefinite Madness states.
            </p>
          </div>
        </div>

        {/* Current Madness State Badge & Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400 font-medium">State:</span>
          <select
            value={character.sanity?.madnessState || 'Sane'}
            onChange={(e) => {
              const state = e.target.value as any;
              onUpdateCharacter({
                ...character,
                sanity: {
                  ...(character.sanity || { current: 15, max: 20 }),
                  madnessState: state
                }
              });
            }}
            className={`px-3 py-1 rounded-xl text-xs font-bold font-serif border transition ${
              (character.sanity?.madnessState || 'Sane') === 'Sane'
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                : (character.sanity?.madnessState) === 'Short-Term Madness'
                ? 'bg-amber-950/80 border-amber-500 text-amber-200'
                : (character.sanity?.madnessState) === 'Long-Term Madness'
                ? 'bg-orange-950/80 border-orange-500 text-orange-200'
                : 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-md animate-pulse'
            }`}
          >
            <option value="Sane">🟢 Sane & Composed</option>
            <option value="Short-Term Madness">🟡 Short-Term Madness (1d10 mins)</option>
            <option value="Long-Term Madness">🟠 Long-Term Madness (1d10x10 hrs)</option>
            <option value="Indefinite Madness">🔴 Indefinite Madness (Permanent/Cured)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Sanity Pool Counter & Meter */}
        <div className="lg:col-span-5 bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-serif font-bold text-emerald-300">
            <span>Sanity Points (Current / Max)</span>
            <span className="font-mono text-emerald-100 text-sm">
              {character.sanity?.current ?? 15} / {character.sanity?.max ?? 20}
            </span>
          </div>

          {/* Sanity Bar */}
          {(() => {
            const current = character.sanity?.current ?? 15;
            const max = Math.max(1, character.sanity?.max ?? 20);
            const pct = Math.min(100, Math.max(0, Math.round((current / max) * 100)));
            const barColor = pct > 60 ? 'bg-emerald-500' : pct > 30 ? 'bg-amber-500' : 'bg-rose-600';

            return (
              <div className="w-full bg-stone-900 rounded-full h-3 border border-stone-800 overflow-hidden relative">
                <div
                  className={`h-full ${barColor} transition-all duration-300`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            );
          })()}

          {/* Quick Adjust Buttons */}
          <div className="flex items-center justify-between gap-1 pt-1">
            <div className="flex items-center gap-1">
              {[-5, -1, 1, 5].map((delta) => (
                <button
                  key={delta}
                  onClick={() => {
                    const cur = character.sanity?.current ?? 15;
                    const mx = character.sanity?.max ?? 20;
                    const next = Math.max(0, Math.min(mx, cur + delta));
                    onUpdateCharacter({
                      ...character,
                      sanity: {
                        ...(character.sanity || { current: 15, max: 20 }),
                        current: next
                      }
                    });
                  }}
                  className={`px-2 py-1 rounded text-xs font-mono font-bold border transition ${
                    delta < 0
                      ? 'bg-rose-950/60 hover:bg-rose-900 border-rose-700/50 text-rose-200'
                      : 'bg-emerald-950/60 hover:bg-emerald-900 border-emerald-700/50 text-emerald-200'
                  }`}
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                const mx = character.sanity?.max ?? 20;
                onUpdateCharacter({
                  ...character,
                  sanity: {
                    ...(character.sanity || { current: 15, max: 20 }),
                    current: mx
                  }
                });
              }}
              className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-xs font-semibold border border-stone-700 transition"
            >
              {t('common.reset', 'Reset')}
            </button>
          </div>

          {/* Editable Max & Score */}
          <div className="pt-2 border-t border-stone-900 flex items-center justify-between text-xs text-stone-400">
            <div className="flex items-center gap-1.5">
              <span>Max Sanity:</span>
              <input
                type="number"
                min="1"
                max="100"
                value={character.sanity?.max ?? 20}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value) || 20);
                  onUpdateCharacter({
                    ...character,
                    sanity: {
                      ...(character.sanity || { current: 15, max: 20 }),
                      max: val
                    }
                  });
                }}
                className="w-14 bg-stone-900 border border-stone-700 rounded text-center text-emerald-300 font-mono font-bold p-0.5"
              />
            </div>

            <button
              onClick={() => {
                const wisMod = getAbilityModifier(character.abilities.WIS?.score || 10);
                const chaMod = getAbilityModifier(character.abilities.CHA?.score || 10);
                const sanMod = character.sanity?.score
                  ? Math.floor((character.sanity.score - 10) / 2)
                  : Math.max(wisMod, chaMod);

                onRoll('Sanity Saving Throw', 20, 1, sanMod, 'normal');
              }}
              className="px-3 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-emerald-100 font-bold rounded-lg transition flex items-center gap-1.5 shadow"
            >
              <Dices className="w-3.5 h-3.5 text-emerald-300" /> {t('savingThrows.title', 'Roll Save')}
            </button>
          </div>
        </div>

        {/* Random Madness Table Generators */}
        <div className="lg:col-span-7 bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-serif font-bold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Roll Random Madness Table (DMG p.259)
            </span>
            <span className="text-[10px] text-stone-500 font-mono">1d100 Random Rollers</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => {
                const idx = Math.floor(Math.random() * SHORT_TERM_MADNESS_TABLE.length);
                const effect = SHORT_TERM_MADNESS_TABLE[idx];
                const rollVal = Math.floor(Math.random() * 100) + 1;
                onRoll('Short-Term Madness Roll (1d100)', 100, 1, 0, 'normal');
                onUpdateCharacter({
                  ...character,
                  sanity: {
                    ...(character.sanity || { current: 15, max: 20 }),
                    madnessState: 'Short-Term Madness',
                    madnessEffect: `[d100 Roll #${rollVal}]: ${effect}`
                  }
                });
              }}
              className="px-2.5 py-1.5 bg-stone-900 hover:bg-amber-950 text-amber-300 border border-amber-800/50 rounded-lg text-xs font-semibold transition text-left"
            >
              🎲 Roll Short-Term
            </button>

            <button
              onClick={() => {
                const idx = Math.floor(Math.random() * LONG_TERM_MADNESS_TABLE.length);
                const effect = LONG_TERM_MADNESS_TABLE[idx];
                const rollVal = Math.floor(Math.random() * 100) + 1;
                onRoll('Long-Term Madness Roll (1d100)', 100, 1, 0, 'normal');
                onUpdateCharacter({
                  ...character,
                  sanity: {
                    ...(character.sanity || { current: 15, max: 20 }),
                    madnessState: 'Long-Term Madness',
                    madnessEffect: `[d100 Roll #${rollVal}]: ${effect}`
                  }
                });
              }}
              className="px-2.5 py-1.5 bg-stone-900 hover:bg-orange-950 text-orange-300 border border-orange-800/50 rounded-lg text-xs font-semibold transition text-left"
            >
              🎲 Roll Long-Term
            </button>

            <button
              onClick={() => {
                const idx = Math.floor(Math.random() * INDEFINITE_MADNESS_TABLE.length);
                const effect = INDEFINITE_MADNESS_TABLE[idx];
                const rollVal = Math.floor(Math.random() * 100) + 1;
                onRoll('Indefinite Madness Roll (1d100)', 100, 1, 0, 'normal');
                onUpdateCharacter({
                  ...character,
                  sanity: {
                    ...(character.sanity || { current: 15, max: 20 }),
                    madnessState: 'Indefinite Madness',
                    madnessEffect: `[d100 Roll #${rollVal}]: ${effect}`
                  }
                });
              }}
              className="px-2.5 py-1.5 bg-stone-900 hover:bg-rose-950 text-rose-300 border border-rose-800/50 rounded-lg text-xs font-semibold transition text-left"
            >
              🎲 Roll Indefinite
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">
              Active Madness Symptoms & Trauma Effects
            </label>
            <textarea
              rows={2}
              value={character.sanity?.madnessEffect || ''}
              onChange={(e) => {
                onUpdateCharacter({
                  ...character,
                  sanity: {
                    ...(character.sanity || { current: 15, max: 20 }),
                    madnessEffect: e.target.value
                  }
                });
              }}
              placeholder="e.g. Incapacitated, screaming uncontrollably for 1d10 minutes..."
              className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:border-emerald-500 font-sans"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
