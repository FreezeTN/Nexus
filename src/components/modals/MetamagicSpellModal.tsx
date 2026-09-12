import React, { useState } from 'react';
import { CharacterData, Spell } from '../../types';
import {
  calculate35eMetamagicSpell,
  DND35E_METAMAGIC_FEATS,
  rollCompoundDamage
} from '../../utils/dndCalculations';
import {
  Sparkles,
  X,
  Zap,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Compass,
  VolumeX,
  ShieldAlert,
  BookOpen,
  Dices
} from 'lucide-react';

interface MetamagicSpellModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  spell?: Spell | null;
  initialSpell?: Spell | null;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRollDamage?: (label: string, expression: string) => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
}

export const MetamagicSpellModal: React.FC<MetamagicSpellModalProps> = ({
  isOpen,
  onClose,
  character,
  spell,
  initialSpell,
  onUpdateCharacter,
  onRollDamage,
  onRoll
}) => {
  if (!isOpen) return null;

  const effectiveSpell = spell || initialSpell || null;
  const spellsList = character.spells || [];
  const [selectedSpellId, setSelectedSpellId] = useState<string>(
    effectiveSpell ? effectiveSpell.id : (spellsList[0]?.id || '')
  );

  const selectedSpell = spellsList.find((s) => s.id === selectedSpellId) || effectiveSpell || spellsList[0];

  const [activeFeats, setActiveFeats] = useState<Record<string, boolean>>({
    empower: false,
    maximize: false,
    quicken: false,
    extend: false,
    enlarge: false,
    widen: false,
    silent: false,
    still: false
  });

  const [castMessage, setCastMessage] = useState<string | null>(null);

  if (!selectedSpell) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 text-center text-stone-300 space-y-3">
          <p>No spells found in spellbook to apply metamagic.</p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 text-stone-200 rounded-lg text-xs"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const metaResult = calculate35eMetamagicSpell(selectedSpell, activeFeats);

  // Check available slots for adjusted level
  const slotLevel = metaResult.adjustedLevel;
  const slotData = character.spellSlots?.find((s) => s.level === slotLevel);
  const slotsRemaining = slotData ? slotData.current : 0;
  const maxSlots = slotData ? slotData.max : 0;

  const handleToggleFeat = (featId: string) => {
    setActiveFeats((prev) => ({
      ...prev,
      [featId]: !prev[featId]
    }));
  };

  const handleCastMetamagicSpell = () => {
    // 1. Consume spell slot if available
    if (slotData && slotData.current > 0) {
      const updatedSlots = (character.spellSlots || []).map((s) =>
        s.level === slotLevel ? { ...s, current: Math.max(0, s.current - 1) } : s
      );
      onUpdateCharacter({ ...character, spellSlots: updatedSlots });
    }

    // 2. Compute damage if spell has damage
    if (selectedSpell.damage) {
      let finalDamageStr = selectedSpell.damage;
      let rollDamageExpr = selectedSpell.damage;

      if (activeFeats.maximize && activeFeats.empower) {
        // In 3.5e: Maximized + Empowered = Max damage + (normal variable roll / 2)
        const rolled = rollCompoundDamage(selectedSpell.damage, false);
        const maxMatch = selectedSpell.damage.match(/(\d+)d(\d+)/i);
        let maxVal = rolled.totalDamage;
        if (maxMatch) {
          const count = parseInt(maxMatch[1], 10);
          const sides = parseInt(maxMatch[2], 10);
          maxVal = count * sides;
        }
        const halfRoll = Math.floor(rolled.totalDamage * 0.5);
        const total = maxVal + halfRoll;
        finalDamageStr = `${total} (${maxVal} Maximized + ${halfRoll} Empowered +50%)`;
      } else if (activeFeats.maximize) {
        const maxMatch = selectedSpell.damage.match(/(\d+)d(\d+)/i);
        if (maxMatch) {
          const count = parseInt(maxMatch[1], 10);
          const sides = parseInt(maxMatch[2], 10);
          finalDamageStr = `${count * sides} (Maximized ${selectedSpell.damage})`;
        }
      } else if (activeFeats.empower) {
        const rolled = rollCompoundDamage(selectedSpell.damage, false);
        const empoweredTotal = Math.floor(rolled.totalDamage * 1.5);
        finalDamageStr = `${empoweredTotal} (Roll ${rolled.totalDamage} + 50% Empowered)`;
      }

      if (onRollDamage) {
        const metaTag = metaResult.appliedFeats.length > 0
          ? `[${metaResult.appliedFeats.join(', ')}] `
          : '';
        onRollDamage(
          `${metaTag}${selectedSpell.name} (Level ${slotLevel} Slot)`,
          metaResult.damageFormula || selectedSpell.damage
        );
      }
    }

    setCastMessage(`Casting ${metaResult.appliedFeats.join(' + ') || 'Standard'} ${selectedSpell.name} from Level ${slotLevel} Slot!`);
    setTimeout(() => {
      setCastMessage(null);
      onClose();
    }, 1800);
  };

  const handlePrepareMetamagicSpell = () => {
    const newSpell: Spell = {
      ...selectedSpell,
      id: `meta-${Date.now()}`,
      name: `${metaResult.appliedFeats.join(' ')} ${selectedSpell.name}`.trim(),
      level: metaResult.adjustedLevel,
      originalLevel: selectedSpell.level,
      prepared: true,
      castingTime: metaResult.castingTime,
      range: metaResult.range,
      duration: metaResult.duration,
      components: metaResult.components,
      metamagicAdjustments: { ...activeFeats }
    };

    onUpdateCharacter({
      ...character,
      spells: [...character.spells, newSpell]
    });

    setCastMessage(`Added ${newSpell.name} to Level ${newSpell.level} prepared spells!`);
    setTimeout(() => {
      setCastMessage(null);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-stone-900 border border-purple-600/50 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-stone-950 p-4 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-950/80 border border-purple-600/50 rounded-lg text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-serif font-bold text-purple-200">
                  3.5e Metamagic Spell Engine
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700/60 font-bold">
                  Slot Level Adjuster
                </span>
              </div>
              <p className="text-xs text-stone-400 font-mono">
                Spell: <strong className="text-purple-300">{selectedSpell.name}</strong> (Base Level {selectedSpell.level}) &rarr; Requires <strong className="text-amber-300">Level {metaResult.adjustedLevel} Slot</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Spell Selector Dropdown */}
          <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex items-center justify-between">
            <label className="text-xs font-mono text-stone-400">Choose Base Spell:</label>
            <select
              value={selectedSpellId}
              onChange={(e) => setSelectedSpellId(e.target.value)}
              className="bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-200 font-mono focus:outline-none focus:border-purple-500"
            >
              {spellsList.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  Lvl {sp.level} &bull; {sp.name} {sp.damage ? `(${sp.damage})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Metamagic Feats Selector Grid */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300 block">
              Apply 3.5e Metamagic Feats:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DND35E_METAMAGIC_FEATS.map((feat) => {
                const isActive = Boolean(activeFeats[feat.id]);
                return (
                  <button
                    key={feat.id}
                    type="button"
                    onClick={() => handleToggleFeat(feat.id)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-start justify-between ${
                      isActive
                        ? 'bg-purple-950/80 border-purple-500 text-purple-200 shadow-md shadow-purple-950/40'
                        : 'bg-stone-950/80 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs font-sans text-stone-200">
                          {feat.name}
                        </span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                          isActive
                            ? 'bg-purple-900 text-purple-200 border border-purple-600'
                            : 'bg-stone-900 text-stone-400 border border-stone-800'
                        }`}>
                          +{feat.slotAdjustment} Levels
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-1 leading-tight">
                        {feat.description}
                      </p>
                    </div>
                    <div className="shrink-0 ml-2 mt-0.5">
                      {isActive ? (
                        <CheckCircle2 className="w-4 h-4 text-purple-400" />
                      ) : (
                        <div className="w-4 h-4 rounded border border-stone-700" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spell Adjusted Breakdown Card */}
          <div className="bg-stone-950 p-4 rounded-xl border border-purple-600/40 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <span className="text-xs font-bold text-stone-300 font-sans uppercase tracking-wider">
                Adjusted Spell Matrix
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-400 font-mono">
                  Slot Required: <strong className="text-amber-300 text-sm">Level {metaResult.adjustedLevel}</strong>
                </span>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold border ${
                  slotsRemaining > 0
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    : 'bg-rose-950 text-rose-300 border-rose-700'
                }`}>
                  {slotsRemaining} / {maxSlots} Slots
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="bg-stone-900 p-2 rounded-lg border border-stone-800">
                <span className="text-stone-500 text-[10px] block">Casting Time</span>
                <span className={activeFeats.quicken ? 'text-amber-300 font-bold' : 'text-stone-300'}>
                  {metaResult.castingTime}
                </span>
              </div>
              <div className="bg-stone-900 p-2 rounded-lg border border-stone-800">
                <span className="text-stone-500 text-[10px] block">Range</span>
                <span className={activeFeats.enlarge ? 'text-amber-300 font-bold' : 'text-stone-300'}>
                  {metaResult.range}
                </span>
              </div>
              <div className="bg-stone-900 p-2 rounded-lg border border-stone-800">
                <span className="text-stone-500 text-[10px] block">Duration</span>
                <span className={activeFeats.extend ? 'text-amber-300 font-bold' : 'text-stone-300'}>
                  {metaResult.duration}
                </span>
              </div>
              <div className="bg-stone-900 p-2 rounded-lg border border-stone-800">
                <span className="text-stone-500 text-[10px] block">Components</span>
                <span className={activeFeats.silent || activeFeats.still ? 'text-emerald-400 font-bold' : 'text-stone-300'}>
                  {metaResult.components}
                </span>
              </div>
            </div>

            {/* Special Metamagic Flags */}
            {metaResult.ignoresAsf && (
              <div className="bg-emerald-950/60 border border-emerald-600/50 p-2 rounded-lg text-emerald-300 text-xs font-mono flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Still Spell Active: Somatic component removed &bull; <strong>0% Arcane Spell Failure</strong> in any armor!</span>
              </div>
            )}

            {metaResult.damageFormula && (
              <div className="bg-purple-950/50 border border-purple-600/40 p-2.5 rounded-lg flex items-center justify-between text-xs font-mono">
                <span className="text-stone-400">Damage Effect:</span>
                <span className="text-amber-300 font-bold text-sm">
                  {metaResult.damageFormula}
                </span>
              </div>
            )}
          </div>

          {castMessage && (
            <div className="p-3 bg-purple-950 border border-purple-500 text-purple-200 text-xs rounded-xl text-center font-mono font-bold animate-in fade-in">
              {castMessage}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-stone-950 p-3 border-t border-stone-800 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold rounded-lg transition"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrepareMetamagicSpell}
              className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-purple-300 border border-purple-600/50 text-xs font-bold rounded-lg transition flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-400" />
              <span>Prepare into Spellbook (Lvl {metaResult.adjustedLevel})</span>
            </button>
            <button
              onClick={handleCastMetamagicSpell}
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-stone-950 text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-lg shadow-purple-950/50"
            >
              <Zap className="w-3.5 h-3.5 text-stone-950" />
              <span>Cast Metamagic Spell</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
