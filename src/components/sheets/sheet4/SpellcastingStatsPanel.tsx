import React from 'react';
import { AbilityName, CharacterData } from '../../../types';
import { CollapsibleBox } from '../../common/CollapsibleBox';
import {
  getSpellSaveDC,
  getSpellAttackBonus,
  getAbilityModifier,
  formatModifier,
  getEffectiveAbilities,
  getPreparedSpellsDetails
} from '../../../utils/dndCalculations';
import { Wand2, RefreshCw, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { useLanguage } from '../../../i18n/LanguageContext';

interface SpellcastingStatsPanelProps {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
}

export const SpellcastingStatsPanel: React.FC<SpellcastingStatsPanelProps> = ({
  character,
  onUpdateCharacter
}) => {
  const { t } = useLanguage();
  const spellDC = getSpellSaveDC(character);
  const spellAtk = getSpellAttackBonus(character);
  const effectiveAbilities = getEffectiveAbilities(character);
  const abilityMod = getAbilityModifier(effectiveAbilities[character.spellcastingAbility]?.score || 10);
  const prepDetails = getPreparedSpellsDetails(character);

  const handleAbilityChange = (ability: AbilityName) => {
    onUpdateCharacter({
      ...character,
      spellcastingAbility: ability
    });
  };

  const handleSlotChange = (level: number, current: number, max?: number) => {
    const existingSlots = character.spellSlots || [];
    const existingSlot = existingSlots.find(s => s.level === level);

    let targetMax = max !== undefined ? Math.max(0, max) : (existingSlot?.max ?? 0);
    let targetCurrent = Math.max(0, current);

    // If remaining slots is increased beyond max, auto-expand max to fit
    if (targetCurrent > targetMax) {
      targetMax = targetCurrent;
    }

    let updatedSlots;
    if (existingSlot) {
      updatedSlots = existingSlots.map(s => {
        if (s.level === level) {
          return {
            ...s,
            current: targetCurrent,
            max: targetMax
          };
        }
        return s;
      });
    } else {
      updatedSlots = [
        ...existingSlots,
        { level, current: targetCurrent, max: targetMax }
      ].sort((a, b) => a.level - b.level);
    }

    onUpdateCharacter({ ...character, spellSlots: updatedSlots });
  };

  const handleRestoreAllSlots = () => {
    const existing = character.spellSlots || [];
    const restored = existing.map(s => ({ ...s, current: s.max }));
    onUpdateCharacter({ ...character, spellSlots: restored });
  };

  return (
    <CollapsibleBox
      title={t('spells.spellSlots', 'Spellcasting Stats & Slot Tracker')}
      icon={<Wand2 className="w-5 h-5 text-amber-500" />}
      storageKey="sheet4_stats"
      headerExtra={
        <div className="flex items-center gap-2">
          {prepDetails.isPreparedCaster && (
            <div className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
              prepDetails.isOverLimit
                ? 'bg-rose-950 text-rose-300 border-rose-600/60'
                : prepDetails.currentPrepared === prepDetails.maxPrepared
                ? 'bg-amber-950 text-amber-300 border-amber-600/50'
                : 'bg-emerald-950 text-emerald-300 border-emerald-600/50'
            }`}>
              <BookOpen className="w-3.5 h-3.5" />
              <span>{prepDetails.currentPrepared} / {prepDetails.maxPrepared} Prepared</span>
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRestoreAllSlots();
            }}
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-950/90 hover:bg-amber-900 border border-amber-600/50 text-amber-200 rounded-lg text-xs font-bold transition shadow"
            title="Restore all spell slots to maximum (Long Rest)"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" /> {t('common.reset', 'Restore All Slots')}
          </button>
        </div>
      }
    >
      <div className="space-y-4 pt-2 text-xs">
        {/* Prepared Spells Limit Banner for Prepared Classes */}
        {prepDetails.isPreparedCaster && (
          <div className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${
            prepDetails.isOverLimit
              ? 'bg-rose-950/40 border-rose-700/60 text-rose-200'
              : 'bg-stone-900/80 border-stone-800 text-stone-300'
          }`}>
            <div className="flex items-center gap-2">
              <BookOpen className={`w-4 h-4 shrink-0 ${prepDetails.isOverLimit ? 'text-rose-400' : 'text-amber-400'}`} />
              <div>
                <span className="font-bold text-xs text-stone-100 block">
                  {prepDetails.className} Prepared Spells Limit: {prepDetails.currentPrepared} of {prepDetails.maxPrepared} prepared
                </span>
                <span className="text-[11px] text-stone-400 font-mono">
                  Formula: {prepDetails.formula} (Cantrips do not count against limit)
                </span>
              </div>
            </div>
            {prepDetails.isOverLimit && (
              <span className="text-[11px] font-bold font-mono px-2 py-0.5 bg-rose-900/80 text-rose-200 border border-rose-600 rounded">
                Over Preparation Limit!
              </span>
            )}
          </div>
        )}

        {/* Ability, Save DC & Attack Bonus Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Spellcasting Ability Choice */}
          <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex flex-col justify-between">
            <span className="text-stone-400 font-serif font-bold text-xs uppercase block font-sans">
              {t('spells.ability', 'Spellcasting Ability')}
            </span>
            <div className="my-2 flex items-center justify-between">
              <select
                value={character.spellcastingAbility}
                onChange={(e) => handleAbilityChange(e.target.value as AbilityName)}
                className="bg-stone-900 border border-amber-600/50 rounded-lg px-2 py-1 text-amber-200 font-bold font-mono focus:outline-none"
              >
                <option value="INT">Intelligence (INT)</option>
                <option value="WIS">Wisdom (WIS)</option>
                <option value="CHA">Charisma (CHA)</option>
                <option value="STR">Strength (STR)</option>
                <option value="DEX">Dexterity (DEX)</option>
                <option value="CON">Constitution (CON)</option>
              </select>
              <span className="font-mono text-sm font-bold text-amber-300">
                {formatModifier(abilityMod)}
              </span>
            </div>
          </div>

          {/* Spell Save DC */}
          <div className="bg-stone-950 p-3 rounded-xl border border-amber-600/30 flex flex-col items-center justify-center">
            <span className="text-stone-400 text-[10px] font-sans uppercase font-bold">{t('spells.saveDc', 'Spell Save DC')}</span>
            <span className="text-2xl font-serif font-extrabold text-amber-300 my-0.5">{spellDC}</span>
            <span className="text-[9px] text-stone-500 font-mono">8 + Prof + Ability Mod + Items</span>
          </div>

          {/* Spell Attack Modifier */}
          <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex flex-col items-center justify-center">
            <span className="text-stone-400 text-[10px] font-sans uppercase font-bold">{t('spells.attackBonus', 'Spell Attack Bonus')}</span>
            <span className="text-2xl font-serif font-extrabold text-emerald-300 my-0.5">{formatModifier(spellAtk)}</span>
            <span className="text-[9px] text-stone-500 font-mono">Prof + Ability Mod + Items</span>
          </div>
        </div>


        {/* Spell Slot Trackers (Levels 1 to 9) */}
        <div>
          <span className="font-serif font-bold text-amber-300 text-xs block mb-2 font-sans">
            {t('spells.spellSlots', 'Spell Slot Tracker')}
          </span>

          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2 font-mono">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => {
              const slot = character.spellSlots.find(s => s.level === lvl) || { level: lvl, current: 0, max: 0 };
              return (
                <div key={lvl} className="bg-stone-950 p-2 rounded-xl border border-stone-800 text-center space-y-1">
                  <span className="text-[10px] text-amber-400 font-bold block uppercase">{t('level.level', 'Lvl')} {lvl}</span>

                  {/* Current Slots */}
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-stone-500 font-sans block">{t('spells.slotsRemaining', 'Remaining')}</span>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleSlotChange(lvl, slot.current - 1)}
                        className="w-5 h-5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 font-bold rounded text-xs flex items-center justify-center cursor-pointer active:scale-95 transition"
                        title="Decrease remaining slots"
                      >
                        -
                      </button>
                      <span className="font-bold text-amber-200 text-xs w-5 text-center">{slot.current}</span>
                      <button
                        onClick={() => handleSlotChange(lvl, slot.current + 1)}
                        className="w-5 h-5 bg-amber-900/80 hover:bg-amber-800 border border-amber-600/50 text-amber-100 font-bold rounded text-xs flex items-center justify-center cursor-pointer active:scale-95 transition"
                        title="Increase remaining slots"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Max Slots Controls */}
                  <div className="pt-1 border-t border-stone-800/80 space-y-0.5">
                    <span className="text-[9px] text-stone-500 font-sans block">{t('spells.slotsTotal', 'Max Slots')}</span>
                    <div className="flex items-center justify-center gap-0.5">
                      <button
                        onClick={() => handleSlotChange(lvl, Math.min(slot.current, Math.max(0, slot.max - 1)), Math.max(0, slot.max - 1))}
                        className="w-4 h-4 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-400 hover:text-stone-200 font-bold rounded text-[10px] flex items-center justify-center cursor-pointer transition"
                        title="Decrease max slots"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={slot.max}
                        onChange={(e) => handleSlotChange(lvl, slot.current, parseInt(e.target.value) || 0)}
                        className="w-5 bg-transparent text-center font-bold text-stone-300 border-b border-stone-700 p-0 text-[11px] focus:outline-none"
                        title="Max slots"
                      />
                      <button
                        onClick={() => handleSlotChange(lvl, slot.current, slot.max + 1)}
                        className="w-4 h-4 bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-200 font-bold rounded text-[10px] flex items-center justify-center cursor-pointer transition"
                        title="Increase max slots"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </CollapsibleBox>
  );
};
