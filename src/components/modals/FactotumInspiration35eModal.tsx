import React, { useState } from 'react';
import { CharacterData } from '../../types';
import {
  getFactotumMaxInspiration,
  getFactotumDilettanteProgression
} from '../../utils/calculators/supplemental35eCalculators';
import { Lightbulb, Zap, Shield, Sparkles, X, RotateCcw, Plus, Minus, Sword, Brain, Heart, AlertCircle } from 'lucide-react';
import { getCombinedLevel, getAbilityModifier } from '../../utils/dndCalculations';

interface FactotumInspiration35eModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number) => void;
}

export const FactotumInspiration35eModal: React.FC<FactotumInspiration35eModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdateCharacter,
  onRoll
}) => {
  const level = getCombinedLevel(character);
  const intMod = getAbilityModifier(character.abilities.INT.score);
  const wisMod = getAbilityModifier(character.abilities.WIS.score);

  const existingState = character.factotumInspiration35e || {
    currentPoints: getFactotumMaxInspiration(level, 0),
    fontOfInspirationFeats: 0,
    usedCunningKnowledgeSkills: [],
    opportunisticPietyUsed: 0
  };

  const fontFeats = existingState.fontOfInspirationFeats || 0;
  const maxPoints = existingState.maxPointsOverride ?? getFactotumMaxInspiration(level, fontFeats);
  const [currentPoints, setCurrentPoints] = useState<number>(existingState.currentPoints ?? maxPoints);
  const [activeTab, setActiveTab] = useState<'abilities' | 'dilettante'>('abilities');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const dilettante = getFactotumDilettanteProgression(level);

  const handleSpendPoints = (amount: number, abilityName: string) => {
    setStatusNotice(null);
    if (currentPoints < amount) {
      setStatusNotice(`⚠️ Not enough Inspiration Points! "${abilityName}" requires ${amount} point(s), but you only have ${currentPoints}.`);
      return;
    }
    const updated = currentPoints - amount;
    setCurrentPoints(updated);
    setStatusNotice(`⚡ Activated ${abilityName} (-${amount} IP, ${updated} remaining)`);
    onUpdateCharacter({
      ...character,
      factotumInspiration35e: {
        ...existingState,
        currentPoints: updated
      }
    });
  };

  const handleResetEncounter = () => {
    setCurrentPoints(maxPoints);
    onUpdateCharacter({
      ...character,
      factotumInspiration35e: {
        ...existingState,
        currentPoints: maxPoints
      }
    });
  };

  const handleAdjustFontFeats = (delta: number) => {
    const nextFeats = Math.max(0, fontFeats + delta);
    const nextMax = getFactotumMaxInspiration(level, nextFeats);
    onUpdateCharacter({
      ...character,
      factotumInspiration35e: {
        ...existingState,
        fontOfInspirationFeats: nextFeats,
        currentPoints: Math.min(currentPoints, nextMax)
      }
    });
  };

  const intBonusText = intMod >= 0 ? `+${intMod}` : `${intMod}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-amber-500/40 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-neutral-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-950/60 border border-amber-600/40 rounded-lg text-amber-400">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Factotum: Inspiration Engine
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-300 border border-amber-700/50 font-mono">
                  Dungeonscape 3.5e
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Per-encounter inspiration points for tactical insight, dilettante spells, and cunning surges
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {statusNotice && (
            <div className="p-3 bg-amber-950/80 border border-amber-500/60 rounded-xl text-amber-200 text-xs flex items-center justify-between animate-fadeIn">
              <span>{statusNotice}</span>
              <button
                type="button"
                onClick={() => setStatusNotice(null)}
                className="text-amber-400 hover:text-white text-xs ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Inspiration Points Tracker Box */}
          <div className="p-4 bg-gradient-to-r from-amber-950/40 via-neutral-900 to-amber-950/20 border border-amber-800/50 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="w-4 h-4" /> Encounter Inspiration Pool
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-black text-white font-mono">{currentPoints}</span>
                <span className="text-neutral-400 text-sm font-semibold">/ {maxPoints} Points Max</span>
              </div>
              <div className="text-xs text-neutral-400 mt-1">
                Intellect modifier: <span className="text-amber-300 font-bold font-mono">{intBonusText}</span> • Refreshes at the start of every combat encounter
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetEncounter}
                className="px-3 py-2 bg-amber-700 hover:bg-amber-600 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow transition"
                title="Reset points to maximum for a new encounter"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Encounter
              </button>
              <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setCurrentPoints(Math.max(0, currentPoints - 1))}
                  className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPoints(Math.min(maxPoints, currentPoints + 1))}
                  className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Feat scaling: Font of Inspiration */}
          <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-white">Font of Inspiration Feats Taken:</span>
              <span className="text-neutral-400 ml-2">Grants cumulative bonus pool (+1, +2, +3...)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-amber-300 text-sm">{fontFeats}</span>
              <button
                type="button"
                onClick={() => handleAdjustFontFeats(-1)}
                className="p-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded"
              >
                <Minus className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleAdjustFontFeats(1)}
                className="p-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Tactical Spends Catalog */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
              Spend Inspiration Points
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Cunning Insight */}
              <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">Cunning Insight</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-mono">1 Point</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Free action before making an attack roll, damage roll, or saving throw: add your Intelligence modifier (<strong className="text-amber-300">{intBonusText}</strong>) as a competence bonus!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSpendPoints(1, 'Cunning Insight')}
                  className="mt-2.5 py-1.5 bg-neutral-800 hover:bg-amber-900/60 hover:text-amber-200 text-neutral-300 text-xs font-semibold rounded border border-neutral-700 transition"
                >
                  Spend 1 Pt ({intBonusText})
                </button>
              </div>

              {/* Cunning Knowledge */}
              <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">Cunning Knowledge</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-mono">1 Point</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Before making a skill check in any skill with at least 1 rank: add your Factotum level (<strong className="text-amber-300">+{level}</strong>) to the check (usable 1/day per skill).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSpendPoints(1, 'Cunning Knowledge')}
                  className="mt-2.5 py-1.5 bg-neutral-800 hover:bg-amber-900/60 hover:text-amber-200 text-neutral-300 text-xs font-semibold rounded border border-neutral-700 transition"
                >
                  Spend 1 Pt (+{level} Skill)
                </button>
              </div>

              {/* Cunning Strike */}
              <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">Cunning Strike</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-mono">1+ Points</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Free action when flanking or denying Dex: spend 1 point to deal +1d6 sneak attack damage. You may spend multiple points on a single strike!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSpendPoints(1, 'Cunning Strike')}
                  className="mt-2.5 py-1.5 bg-neutral-800 hover:bg-amber-900/60 hover:text-amber-200 text-neutral-300 text-xs font-semibold rounded border border-neutral-700 transition"
                >
                  Spend 1 Pt (+1d6 Damage)
                </button>
              </div>

              {/* Cunning Surge */}
              <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">Cunning Surge</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-mono">3 Points</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Free action (lvl 8+): push past your normal physical limits to gain an extra standard action on your turn!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSpendPoints(3, 'Cunning Surge')}
                  className="mt-2.5 py-1.5 bg-amber-950 hover:bg-amber-900 text-amber-200 border border-amber-700/60 text-xs font-bold rounded transition"
                >
                  Spend 3 Pts (Extra Standard Action)
                </button>
              </div>
            </div>
          </div>

          {/* Passives & Arcane Dilettante Status */}
          <div className="p-3 bg-neutral-950/40 border border-neutral-800 rounded-xl space-y-2 text-xs">
            <div className="font-bold text-neutral-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> Factotum Passives & Arcane Dilettante
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-400">
              <div className="p-2 bg-neutral-900 rounded border border-neutral-800">
                <span className="text-white font-semibold">Brains over Brawn (Lvl 3):</span> Add INT modifier ({intBonusText}) to all Strength checks, Dexterity checks, and all Strength- & Dexterity-based skills, including <strong className="text-amber-300">Initiative</strong>!
              </div>
              <div className="p-2 bg-neutral-900 rounded border border-neutral-800">
                <span className="text-white font-semibold">Cunning Defense (Lvl 2):</span> While wearing light armor and carrying a light load, add INT modifier ({intBonusText}) as a dodge bonus to AC.
              </div>
            </div>
            <div className="p-2 bg-neutral-900 rounded border border-neutral-800 text-neutral-300">
              <span className="text-white font-semibold">Arcane Dilettante:</span> {dilettante.slots} spells/day prepared from Sorcerer/Wizard spell list (Max Spell Level: {dilettante.maxSpellLevel}). Cast as spell-like abilities (1 inspiration point per spell cast).
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-950/90 flex items-center justify-between">
          <span className="text-xs text-neutral-400">
            Pool: <strong className="text-amber-300 font-mono">{currentPoints} / {maxPoints}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
