import React, { useState } from 'react';
import { AbilityName, CharacterData } from '../../../types';
import { CollapsibleBox } from '../../common/CollapsibleBox';
import {
  getSpellSaveDC,
  getSpellAttackBonus,
  getAbilityModifier,
  formatModifier,
  getEffectiveAbilities,
  getPreparedSpellsDetails,
  calculateProgressionSpellSlots,
  generateProgressionSpellSlots,
  getCharacterCasterLevel,
  getSpellPenetrationBonus,
  calculate35eTotalArcaneSpellFailure
} from '../../../utils/dndCalculations';
import { Wand2, RefreshCw, BookOpen, Sparkles, Calculator, Flame, ShieldAlert, Dices } from 'lucide-react';
import { useLanguage } from '../../../i18n/LanguageContext';
import { SpellResistanceAndAsf35eModal } from '../../modals/SpellResistanceAndAsf35eModal';

interface SpellcastingStatsPanelProps {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
}

export const SpellcastingStatsPanel: React.FC<SpellcastingStatsPanelProps> = ({
  character,
  onUpdateCharacter,
  onRoll
}) => {
  const { t } = useLanguage();
  const [showProgressionInfo, setShowProgressionInfo] = useState(false);
  const [showAsfModal, setShowAsfModal] = useState(false);

  const is35e = character.edition === '3.5e';
  const casterLevel = getCharacterCasterLevel(character);
  const spellPenBonus = getSpellPenetrationBonus(character);
  const asfData = calculate35eTotalArcaneSpellFailure(character);

  const spellDC = is35e
    ? 10 + getAbilityModifier(getEffectiveAbilities(character)[character.spellcastingAbility]?.score || 10)
    : getSpellSaveDC(character);
  const spellAtk = getSpellAttackBonus(character);
  const effectiveAbilities = getEffectiveAbilities(character);
  const abilityMod = getAbilityModifier(effectiveAbilities[character.spellcastingAbility]?.score || 10);
  const prepDetails = getPreparedSpellsDetails(character);
  const progression = calculateProgressionSpellSlots(character);

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

  const handleAutoCalculateSlots = () => {
    const calculatedSlots = generateProgressionSpellSlots(character);
    onUpdateCharacter({
      ...character,
      spellSlots: calculatedSlots
    });
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
              handleAutoCalculateSlots();
            }}
            className="flex items-center gap-1 px-2.5 py-1 bg-stone-900 hover:bg-stone-800 border border-amber-600/40 text-amber-300 rounded-lg text-xs font-bold transition shadow"
            title="Auto-calculate standard D&D 5e / 3.5e spell slots based on class and multiclass progression"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-400" /> Auto-Progression
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRestoreAllSlots();
            }}
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-950/90 hover:bg-amber-900 border border-amber-600/50 text-amber-200 rounded-lg text-xs font-bold transition shadow"
            title="Restore all spell slots to maximum (Long Rest)"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" /> {t('common.reset', 'Restore All')}
          </button>
        </div>
      }
    >
      <div className="space-y-4 pt-2 text-xs">
        {/* Multiclass & Pact Magic Progression Summary Bar */}
        {(progression.isMulticlass || progression.pactMagic) && (
          <div className="bg-stone-950/80 border border-purple-900/60 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-xs text-purple-200">
                  {progression.isMulticlass ? `Multiclass Caster Level: ${progression.casterLevel}` : 'Pact Magic Active'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowProgressionInfo(!showProgressionInfo)}
                className="text-[11px] text-purple-400 hover:text-purple-300 underline font-mono"
              >
                {showProgressionInfo ? 'Hide Breakdown' : 'View Progression Formula'}
              </button>
            </div>
            {showProgressionInfo && (
              <div className="pt-1.5 border-t border-purple-900/40 text-[11px] font-mono text-stone-400 space-y-0.5">
                {progression.breakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="text-purple-400">•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
            <span className="text-[9px] text-stone-500 font-mono">
              {is35e ? '10 + Spell Lvl + Ability Mod' : '8 + Prof + Ability Mod + Items'}
            </span>
          </div>

          {/* Spell Attack Modifier */}
          <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex flex-col items-center justify-center">
            <span className="text-stone-400 text-[10px] font-sans uppercase font-bold">{t('spells.attackBonus', 'Spell Attack Bonus')}</span>
            <span className="text-2xl font-serif font-extrabold text-emerald-300 my-0.5">{formatModifier(spellAtk)}</span>
            <span className="text-[9px] text-stone-500 font-mono">
              {is35e ? 'Base Atk + Ability Mod' : 'Prof + Ability Mod + Items'}
            </span>
          </div>
        </div>

        {/* 3.5e Caster Suite: Caster Level, Spell Resistance Checks & Arcane Spell Failure */}
        {is35e && (
          <div className="bg-stone-950 p-3 rounded-xl border border-cyan-700/40 space-y-2.5">
            <div className="flex items-center justify-between border-b border-stone-800/80 pb-1.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="font-serif font-bold text-xs text-cyan-200">
                  3.5e Caster Level & Arcane Spell Failure (ASF)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAsfModal(true)}
                className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-200 rounded-lg text-[11px] font-bold font-mono transition flex items-center gap-1 shadow"
              >
                <span>⚡</span>
                <span>SR & ASF Simulator</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center font-mono py-1.5 bg-stone-900/80 rounded-lg border border-stone-800">
              <div>
                <span className="text-[9px] text-stone-400 uppercase block">Caster Level</span>
                <span className="text-sm font-bold text-cyan-300">CL {casterLevel}</span>
              </div>
              <div>
                <span className="text-[9px] text-stone-400 uppercase block">Spell Penetration</span>
                <span className="text-sm font-bold text-amber-300">
                  {spellPenBonus > 0 ? `+${spellPenBonus}` : '+0'}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-stone-400 uppercase block">Arcane Spell Failure</span>
                <span className={`text-sm font-bold ${asfData.totalAsf > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {asfData.totalAsf}% ASF
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {onRoll && (
                <>
                  <button
                    type="button"
                    onClick={() => onRoll(`Caster Level Check vs SR (1d20+${casterLevel + spellPenBonus})`, 20, 1, casterLevel + spellPenBonus, 'normal')}
                    className="flex-1 py-1.5 bg-stone-900 hover:bg-cyan-950 border border-cyan-800/60 text-cyan-200 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Dices className="w-3.5 h-3.5 text-cyan-400" /> Roll CL Check (1d20+{casterLevel + spellPenBonus})
                  </button>
                  {asfData.totalAsf > 0 && (
                    <button
                      type="button"
                      onClick={() => onRoll(`Arcane Spell Failure Check (d100 vs ${asfData.totalAsf}%)`, 100, 1, 0, 'normal')}
                      className="px-3 py-1.5 bg-stone-900 hover:bg-amber-950 border border-amber-800/60 text-amber-300 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Check ASF (d100)
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Spell Slot Trackers (Levels 1 to 9) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-serif font-bold text-amber-300 text-xs font-sans">
              {t('spells.spellSlots', 'Spell Slot Tracker')}
            </span>
            {progression.pactMagic && (
              <span className="text-[11px] font-mono text-purple-300 flex items-center gap-1 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/60">
                <Flame className="w-3 h-3 text-purple-400" />
                Pact Slots: Level {progression.pactMagic.slotLevel} ({progression.pactMagic.slotsCount} Total)
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2 font-mono">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => {
              const slot = character.spellSlots.find(s => s.level === lvl) || { level: lvl, current: 0, max: 0 };
              const isPactSlot = progression.pactMagic && progression.pactMagic.slotLevel === lvl;

              return (
                <div key={lvl} className={`bg-stone-950 p-2 rounded-xl border text-center space-y-1 ${
                  isPactSlot ? 'border-purple-600/60 shadow-sm shadow-purple-950' : 'border-stone-800'
                }`}>
                  <div className="flex items-center justify-center gap-1">
                    <span className={`text-[10px] font-bold block uppercase ${isPactSlot ? 'text-purple-300' : 'text-amber-400'}`}>
                      {t('level.level', 'Lvl')} {lvl}
                    </span>
                    {isPactSlot && <Flame className="w-2.5 h-2.5 text-purple-400" />}
                  </div>

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
                      <span className={`font-bold text-xs w-5 text-center ${isPactSlot ? 'text-purple-200' : 'text-amber-200'}`}>{slot.current}</span>
                      <button
                        onClick={() => handleSlotChange(lvl, slot.current + 1)}
                        className={`w-5 h-5 font-bold rounded text-xs flex items-center justify-center cursor-pointer active:scale-95 transition ${
                          isPactSlot
                            ? 'bg-purple-900/80 hover:bg-purple-800 border border-purple-600/50 text-purple-100'
                            : 'bg-amber-900/80 hover:bg-amber-800 border border-amber-600/50 text-amber-100'
                        }`}
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
        {/* 3.5e Spell Resistance & Arcane Spell Failure Modal */}
        {showAsfModal && (
          <SpellResistanceAndAsf35eModal
            isOpen={true}
            onClose={() => setShowAsfModal(false)}
            character={character}
            onUpdateCharacter={onUpdateCharacter}
            onRoll={onRoll}
          />
        )}
      </div>
    </CollapsibleBox>
  );
};

