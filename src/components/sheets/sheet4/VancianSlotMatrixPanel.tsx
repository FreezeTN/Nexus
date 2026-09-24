import React, { useState } from 'react';
import { CharacterData, Spell, VancianSlotAllocation } from '../../../types';
import {
  calculateVancianBreakdown,
  restAndRestoreVancianSlots,
  CLERIC_CURE_SPELLS,
  CLERIC_INFLICT_SPELLS,
  DRUID_SUMMON_SPELLS
} from '../../../utils/calculators/vancianSpellCalculators';
import {
  Sparkles,
  Sun,
  Shield,
  Zap,
  RotateCcw,
  CheckCircle2,
  X,
  Plus,
  Flame,
  Heart,
  Skull,
  Feather,
  Info,
  BookOpen
} from 'lucide-react';

interface VancianSlotMatrixPanelProps {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
  onRollDamage?: (label: string, expression: string) => void;
}

export const VancianSlotMatrixPanel: React.FC<VancianSlotMatrixPanelProps> = ({
  character,
  onUpdateCharacter,
  onRoll,
  onRollDamage
}) => {
  const breakdown = calculateVancianBreakdown(character);
  const [activeLevelTab, setActiveLevelTab] = useState<number | 'all'>('all');
  const [assigningSlot, setAssigningSlot] = useState<VancianSlotAllocation | null>(null);
  const [clericConversionType, setClericConversionType] = useState<'cure' | 'inflict'>('cure');

  if (!breakdown.isVancianPreparedCaster) {
    return null;
  }

  // Current slot allocations
  const currentSlots: VancianSlotAllocation[] = character.vancianSlots || [];

  const handleUpdateSlot = (slotId: string, updates: Partial<VancianSlotAllocation>) => {
    let exists = false;
    const updated = currentSlots.map((s) => {
      if (s.id === slotId) {
        exists = true;
        return { ...s, ...updates };
      }
      return s;
    });

    if (!exists) {
      // Find default slot representation in breakdown
      let found: VancianSlotAllocation | undefined;
      for (const lvl of breakdown.levels) {
        const s = lvl.slots.find((x) => x.id === slotId);
        if (s) {
          found = s;
          break;
        }
      }
      if (found) {
        updated.push({ ...found, ...updates });
      }
    }

    onUpdateCharacter({
      ...character,
      vancianSlots: updated
    });
  };

  const handleAssignSpell = (slot: VancianSlotAllocation, spell: Spell) => {
    handleUpdateSlot(slot.id, {
      spellId: spell.id,
      spellName: spell.name,
      isExpended: false
    });
    setAssigningSlot(null);
  };

  const handleClearSlot = (slotId: string) => {
    handleUpdateSlot(slotId, {
      spellId: undefined,
      spellName: undefined,
      isExpended: false
    });
  };

  const handleToggleExpended = (slotId: string, currentExpended: boolean) => {
    handleUpdateSlot(slotId, {
      isExpended: !currentExpended
    });
  };

  const handleRestAllSlots = () => {
    const allAllocations: VancianSlotAllocation[] = [];
    for (const lvl of breakdown.levels) {
      for (const slot of lvl.slots) {
        allAllocations.push({
          ...slot,
          isExpended: false
        });
      }
    }
    onUpdateCharacter({
      ...character,
      vancianSlots: allAllocations
    });
  };

  const handleClearAllPreparations = () => {
    if (!confirm('Are you sure you want to clear all prepared spells from your slots?')) return;
    const allAllocations: VancianSlotAllocation[] = [];
    for (const lvl of breakdown.levels) {
      for (const slot of lvl.slots) {
        allAllocations.push({
          ...slot,
          spellId: undefined,
          spellName: undefined,
          isExpended: false
        });
      }
    }
    onUpdateCharacter({
      ...character,
      vancianSlots: allAllocations
    });
  };

  // Spontaneous spell swap
  const handleSpontaneousSwap = (slot: VancianSlotAllocation) => {
    let spontaneousName = '';
    if (breakdown.spontaneousConversion === 'cure_or_inflict') {
      spontaneousName =
        clericConversionType === 'cure'
          ? CLERIC_CURE_SPELLS[slot.level] || 'Cure Wounds'
          : CLERIC_INFLICT_SPELLS[slot.level] || 'Inflict Wounds';
    } else if (breakdown.spontaneousConversion === 'summon_nature') {
      spontaneousName = DRUID_SUMMON_SPELLS[slot.level] || "Summon Nature's Ally";
    }

    if (!spontaneousName) return;

    // Expend slot and trigger roll/chat log
    handleUpdateSlot(slot.id, {
      spellName: `${spontaneousName} [Spontaneous]`,
      isExpended: true
    });

    if (onRoll) {
      onRoll(`Spontaneous Cast: ${spontaneousName}`, 20, 1, 0, 'normal');
    }
  };

  const visibleLevels =
    activeLevelTab === 'all'
      ? breakdown.levels
      : breakdown.levels.filter((lvl) => lvl.level === activeLevelTab);

  return (
    <div className="bg-stone-900 border border-amber-600/40 rounded-2xl p-4 sm:p-5 space-y-5 shadow-xl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-950/80 border border-amber-600/50 rounded-xl text-amber-400 shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-serif font-bold text-amber-200">
                3.5e Vancian Spell Slot Matrix
              </h3>
              <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                Prepared Caster
              </span>
            </div>
            <p className="text-xs text-stone-400">
              {character.characterClass} &bull; Key Ability: <strong className="text-stone-300">{breakdown.keyAbility}</strong> ({breakdown.keyAbilityScore}, mod {breakdown.keyAbilityMod >= 0 ? `+${breakdown.keyAbilityMod}` : breakdown.keyAbilityMod}) &bull; {breakdown.totalPrepared} / {breakdown.totalDailySlots} Slots Bound
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleRestAllSlots}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 rounded-xl text-xs font-semibold transition shadow-sm"
            title="Restore all expended spell slots (Long Rest)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore All</span>
          </button>
          <button
            type="button"
            onClick={handleClearAllPreparations}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800/80 hover:bg-stone-700 border border-stone-700 text-stone-300 rounded-xl text-xs font-semibold transition shadow-sm"
            title="Clear all spell assignments from slots"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Slots</span>
          </button>
        </div>
      </div>

      {/* Spontaneous Conversion Notice (Cleric / Druid) */}
      {breakdown.spontaneousConversion !== 'none' && (
        <div className="bg-stone-950/80 border border-amber-800/40 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            {breakdown.spontaneousConversion === 'cure_or_inflict' ? (
              <Heart className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Feather className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <div>
              <span className="font-bold text-amber-300">Spontaneous Spell Conversion:</span>{' '}
              <span className="text-stone-300">
                {breakdown.spontaneousConversion === 'cure_or_inflict'
                  ? 'Channel stored spell energy to spontaneously cast Cure or Inflict spells without prior preparation.'
                  : "Spontaneously convert any prepared spell to Summon Nature's Ally of the same level."}
              </span>
            </div>
          </div>

          {breakdown.spontaneousConversion === 'cure_or_inflict' && (
            <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-800 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setClericConversionType('cure')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                  clericConversionType === 'cure'
                    ? 'bg-rose-950 text-rose-300 border border-rose-600/50'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Cure Wounds
              </button>
              <button
                type="button"
                onClick={() => setClericConversionType('inflict')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                  clericConversionType === 'inflict'
                    ? 'bg-purple-950 text-purple-300 border border-purple-600/50'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Inflict Wounds
              </button>
            </div>
          )}
        </div>
      )}

      {/* Level Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        <button
          type="button"
          onClick={() => setActiveLevelTab('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeLevelTab === 'all'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
          }`}
        >
          All Levels ({breakdown.totalPrepared}/{breakdown.totalDailySlots})
        </button>
        {breakdown.levels.map((lvl) => (
          <button
            key={lvl.level}
            type="button"
            onClick={() => setActiveLevelTab(lvl.level)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeLevelTab === lvl.level
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <span>{lvl.level === 0 ? 'Orisons' : `Lvl ${lvl.level}`}</span>
            <span className="text-[10px] opacity-75 font-mono">
              ({lvl.preparedCount}/{lvl.totalSlots})
            </span>
          </button>
        ))}
      </div>

      {/* Spell Slots Matrix by Level */}
      <div className="space-y-4">
        {visibleLevels.map((lvl) => (
          <div
            key={lvl.level}
            className="bg-stone-950 border border-stone-800/90 rounded-xl p-3.5 space-y-3"
          >
            {/* Level Subheader */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-serif font-bold text-amber-200">
                  {lvl.levelLabel}
                </span>
                <span className="text-[11px] font-mono text-stone-400">
                  Base: {lvl.baseSlots} &bull; Bonus: +{lvl.bonusSlots}
                  {lvl.domainSlots > 0 && ` • Domain: +${lvl.domainSlots}`}
                  {lvl.specialistSlots > 0 && ` • Specialist: +${lvl.specialistSlots}`}
                </span>
              </div>
              <div className="text-xs font-mono font-bold text-stone-300">
                <span className={lvl.preparedCount === lvl.totalSlots ? 'text-emerald-400' : 'text-amber-400'}>
                  {lvl.preparedCount}
                </span>
                <span className="text-stone-500"> / </span>
                <span>{lvl.totalSlots} Prepared</span>
              </div>
            </div>

            {/* Slots Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {lvl.slots.map((slot) => {
                const isDomain = slot.slotType === 'domain';
                const isSpecialist = slot.slotType === 'specialist';
                const isExpended = slot.isExpended;
                const isBound = Boolean(slot.spellName);

                return (
                  <div
                    key={slot.id}
                    className={`relative rounded-xl border p-2.5 flex flex-col justify-between gap-2 transition ${
                      isDomain
                        ? 'bg-amber-950/30 border-amber-600/60 shadow-sm shadow-amber-950/50'
                        : isSpecialist
                        ? 'bg-purple-950/30 border-purple-600/60 shadow-sm shadow-purple-950/50'
                        : isExpended
                        ? 'bg-stone-900/40 border-stone-800/60 opacity-60'
                        : 'bg-stone-900 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    {/* Slot Header */}
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 font-bold">
                        {isDomain ? (
                          <span className="flex items-center gap-1 text-amber-300 font-mono">
                            <Sun className="w-3 h-3 text-amber-400" />
                            Domain Slot
                          </span>
                        ) : isSpecialist ? (
                          <span className="flex items-center gap-1 text-purple-300 font-mono">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            Specialist Slot
                          </span>
                        ) : (
                          <span className="text-stone-400 font-mono">
                            Slot #{slot.slotIndex + 1}
                          </span>
                        )}
                      </div>

                      {/* Expended Checkbox */}
                      {isBound && (
                        <button
                          type="button"
                          onClick={() => handleToggleExpended(slot.id, isExpended)}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                            isExpended
                              ? 'bg-rose-950 text-rose-300 border border-rose-800/80'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800/80 hover:bg-emerald-900'
                          }`}
                        >
                          {isExpended ? 'EXPENDED' : 'READY'}
                        </button>
                      )}
                    </div>

                    {/* Slot Body */}
                    {isBound ? (
                      <div className="space-y-1">
                        <div
                          className={`text-xs font-bold truncate ${
                            isExpended ? 'line-through text-stone-500' : 'text-stone-100'
                          }`}
                        >
                          {slot.spellName}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1">
                          <button
                            type="button"
                            onClick={() => handleClearSlot(slot.id)}
                            className="text-stone-500 hover:text-rose-400 transition"
                            title="Unbind spell from slot"
                          >
                            Unprepare
                          </button>

                          {/* Spontaneous Conversion option */}
                          {breakdown.spontaneousConversion !== 'none' && !isExpended && (
                            <button
                              type="button"
                              onClick={() => handleSpontaneousSwap(slot)}
                              className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 transition"
                              title="Spontaneously cast cure/inflict or summon using this slot"
                            >
                              Swap Spontaneous
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAssigningSlot(slot)}
                        className={`w-full py-2 px-2.5 rounded-lg border border-dashed flex items-center justify-center gap-1.5 text-xs font-semibold transition ${
                          isDomain
                            ? 'border-amber-600/50 text-amber-300 hover:bg-amber-950/50'
                            : isSpecialist
                            ? 'border-purple-600/50 text-purple-300 hover:bg-purple-950/50'
                            : 'border-stone-700 text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Assign {isDomain ? 'Domain' : isSpecialist ? 'Specialist' : ''} Spell</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Spell Picker Modal for Binding to Slot */}
      {assigningSlot && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-amber-600/50 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-stone-950 p-4 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-serif font-bold text-amber-200">
                  Bind Spell to {assigningSlot.level === 0 ? 'Orisons/Cantrips' : `Level ${assigningSlot.level}`}{' '}
                  {assigningSlot.slotType === 'domain' ? '(Domain)' : assigningSlot.slotType === 'specialist' ? '(Specialist)' : ''} Slot
                </h3>
              </div>
              <button
                onClick={() => setAssigningSlot(null)}
                className="p-1 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
              <p className="text-xs text-stone-400">
                Choose a spell from your known list to prepare into this slot:
              </p>

              {character.spells.filter((s) => s.level === assigningSlot.level).length === 0 ? (
                <div className="text-center py-6 text-stone-500 text-xs">
                  No known spells of level {assigningSlot.level} found in your spellbook. Add spells to your spellbook first!
                </div>
              ) : (
                <div className="space-y-1.5">
                  {character.spells
                    .filter((s) => s.level === assigningSlot.level)
                    .map((spell) => (
                      <button
                        key={spell.id}
                        type="button"
                        onClick={() => handleAssignSpell(assigningSlot, spell)}
                        className="w-full p-2.5 bg-stone-950 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/50 rounded-xl flex items-center justify-between text-left transition group"
                      >
                        <div>
                          <div className="text-xs font-bold text-stone-200 group-hover:text-amber-300">
                            {spell.name}
                          </div>
                          <div className="text-[11px] text-stone-500">
                            {spell.school || 'Universal'} &bull; {spell.castingTime || '1 action'} &bull; {spell.range || 'Close'}
                          </div>
                        </div>
                        <span className="text-xs font-bold text-amber-400 opacity-0 group-hover:opacity-100 transition">
                          Prepare &rarr;
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
