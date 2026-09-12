import React, { useState } from 'react';
import { CharacterData } from '../../types';
import { calculate35eNegativeLevelPenalties, roll35eFortitudeRecoveryCheck } from '../../utils/dndCalculations';
import { Skull, AlertTriangle, ShieldCheck, Heart, Sparkles, X, Plus, Trash2, Dices, Info } from 'lucide-react';

interface NegativeLevelsModalProps {
  isOpen: boolean;
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onClose: () => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
}

export const NegativeLevelsModal: React.FC<NegativeLevelsModalProps> = ({
  isOpen,
  character,
  onUpdateCharacter,
  onClose,
  onRoll
}) => {
  const [sourceInput, setSourceInput] = useState('Wight');
  const [dcInput, setDcInput] = useState<number>(14);
  const [lastCheckResult, setLastCheckResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentNegativeLevels = character.negativeLevels || 0;
  const penalties = calculate35eNegativeLevelPenalties(character);
  const history = character.negativeLevelsHistory || [];

  const handleAddNegativeLevel = () => {
    const newEntry = {
      id: 'nl-' + Date.now(),
      source: sourceInput.trim() || 'Energy Drain',
      dc: dcInput || 14,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextCount = currentNegativeLevels + 1;
    const isNowDead = nextCount >= (character.level || 1);

    const conds = character.conditions || [];
    const nextConds = isNowDead && !conds.includes('Dead') ? [...conds, 'Dead'] : conds;

    onUpdateCharacter({
      ...character,
      negativeLevels: nextCount,
      negativeLevelsHistory: [newEntry, ...history],
      conditions: nextConds
    });
  };

  const handleRemoveOne = () => {
    if (currentNegativeLevels <= 0) return;
    const nextCount = Math.max(0, currentNegativeLevels - 1);
    const nextHistory = history.slice(1);
    onUpdateCharacter({
      ...character,
      negativeLevels: nextCount,
      negativeLevelsHistory: nextHistory
    });
  };

  const handleCastRestoration = () => {
    if (currentNegativeLevels <= 0) return;
    const nextCount = Math.max(0, currentNegativeLevels - 1);
    const nextHistory = history.slice(1);
    onUpdateCharacter({
      ...character,
      negativeLevels: nextCount,
      negativeLevelsHistory: nextHistory
    });
    setLastCheckResult('✨ Restoration cast: 1 Negative Level removed (100gp diamond dust consumed).');
  };

  const handleCastGreaterRestoration = () => {
    onUpdateCharacter({
      ...character,
      negativeLevels: 0,
      negativeLevelsHistory: []
    });
    setLastCheckResult('🌟 Greater Restoration cast: All Negative Levels dispelled (500gp diamond dust consumed).');
  };

  const handleRoll24hRecovery = (entry: { id: string; source: string; dc: number }) => {
    const result = roll35eFortitudeRecoveryCheck(character, entry.dc);
    setLastCheckResult(result.message);

    if (onRoll) {
      onRoll(`24h Fortitude Recovery vs ${entry.source} (DC ${entry.dc})`, 20, 1, result.fortBonus, 'normal');
    }

    if (result.passed) {
      // Recovery success: remove this negative level!
      const nextCount = Math.max(0, currentNegativeLevels - 1);
      const nextHistory = history.filter(h => h.id !== entry.id);
      onUpdateCharacter({
        ...character,
        negativeLevels: nextCount,
        negativeLevelsHistory: nextHistory
      });
    } else {
      // Failure: permanent level loss!
      // In 3.5e RAW, failing permanently drains 1 character level, and removes the temporary negative level
      const nextCount = Math.max(0, currentNegativeLevels - 1);
      const nextHistory = history.filter(h => h.id !== entry.id);
      const nextLevel = Math.max(1, (character.level || 1) - 1);
      onUpdateCharacter({
        ...character,
        level: nextLevel,
        negativeLevels: nextCount,
        negativeLevelsHistory: nextHistory
      });
      alert(`Fortitude check failed vs DC ${entry.dc}! The energy drain has become permanent: Character Level reduced to ${nextLevel}.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-stone-900 border border-red-700/60 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950 via-stone-900 to-stone-900 p-4 border-b border-red-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-950 border border-red-600 flex items-center justify-center text-red-400">
              <Skull className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-black text-red-200">Negative Levels & Energy Drain</h2>
              <p className="text-xs text-stone-400">Official D&D 3.5e Rules As Written (DMG p. 293)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          {/* Lethal Warning if Negative Levels >= Character Level */}
          {penalties.isDead && (
            <div className="p-3 bg-red-950/90 border border-red-500 rounded-xl flex items-center gap-3 text-red-200 animate-pulse">
              <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
              <div>
                <div className="font-bold text-red-300">FATAL ENERGY DRAIN</div>
                <div className="text-xs text-red-200/90">
                  Negative levels ({currentNegativeLevels}) equal or exceed Character Level ({character.level || 1}).
                  RAW: The character is instantly slain and typically rises as an undead wight or spectre!
                </div>
              </div>
            </div>
          )}

          {/* Current Negative Levels Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 text-center flex flex-col items-center justify-center">
              <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Active Negative Levels</span>
              <span className="text-4xl font-serif font-black text-red-400 my-1">{currentNegativeLevels}</span>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={handleRemoveOne}
                  disabled={currentNegativeLevels <= 0}
                  className="px-2.5 py-0.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-30 rounded text-xs text-stone-300 transition"
                >
                  -1
                </button>
                <button
                  type="button"
                  onClick={handleAddNegativeLevel}
                  className="px-2.5 py-0.5 bg-red-900/80 hover:bg-red-800 rounded text-xs text-red-200 font-bold transition"
                >
                  +1 Level
                </button>
              </div>
            </div>

            <div className="sm:col-span-2 bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-2">
              <div className="text-xs font-bold text-stone-300 flex items-center gap-1.5 border-b border-stone-800 pb-1">
                <Info className="w-3.5 h-3.5 text-red-400" />
                <span>Cumulative 3.5e Penalties Applied</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-stone-900/80 p-2 rounded border border-stone-800">
                  <span className="text-stone-400">Attack Rolls & CMB:</span>
                  <span className="font-mono font-bold text-red-400 ml-1.5">{penalties.attackPenalty}</span>
                </div>
                <div className="bg-stone-900/80 p-2 rounded border border-stone-800">
                  <span className="text-stone-400">All Saving Throws:</span>
                  <span className="font-mono font-bold text-red-400 ml-1.5">{penalties.savingThrowPenalty}</span>
                </div>
                <div className="bg-stone-900/80 p-2 rounded border border-stone-800">
                  <span className="text-stone-400">Skill & Ability Checks:</span>
                  <span className="font-mono font-bold text-red-400 ml-1.5">{penalties.skillCheckPenalty}</span>
                </div>
                <div className="bg-stone-900/80 p-2 rounded border border-stone-800">
                  <span className="text-stone-400">Effective Caster Level:</span>
                  <span className="font-mono font-bold text-red-400 ml-1.5">{penalties.effectiveLevelPenalty}</span>
                </div>
                <div className="col-span-2 bg-red-950/40 p-2 rounded border border-red-900/50 flex items-center justify-between">
                  <span className="text-stone-300 font-medium">Max HP Loss (-5/level):</span>
                  <span className="font-mono font-black text-red-400 text-sm">-{penalties.maxHpLoss} HP</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Log / Result Feedback */}
          {lastCheckResult && (
            <div className="p-3 bg-amber-950/40 border border-amber-600/50 rounded-xl text-xs text-amber-200">
              {lastCheckResult}
            </div>
          )}

          {/* Add Energy Drain Source */}
          <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-3">
            <div className="font-bold text-stone-200 text-xs flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-red-400" />
              <span>Inflict Energy Drain / Negative Level</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-stone-400 block mb-0.5">Creature / Spell Source</label>
                <select
                  value={sourceInput}
                  onChange={(e) => {
                    setSourceInput(e.target.value);
                    if (e.target.value === 'Wight') setDcInput(14);
                    else if (e.target.value === 'Spectre') setDcInput(15);
                    else if (e.target.value === 'Vampire') setDcInput(16);
                    else if (e.target.value === 'Wraith') setDcInput(14);
                    else if (e.target.value === 'Enervation') setDcInput(18);
                    else if (e.target.value === 'Energy Drain') setDcInput(20);
                  }}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-200"
                >
                  <option value="Wight">Wight (DC 14)</option>
                  <option value="Spectre">Spectre (DC 15)</option>
                  <option value="Vampire">Vampire (DC 16)</option>
                  <option value="Wraith">Dread Wraith (DC 18)</option>
                  <option value="Enervation">Enervation (Spell DC 18)</option>
                  <option value="Energy Drain">Energy Drain (Spell DC 20)</option>
                  <option value="Custom">Custom Source</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-stone-400 block mb-0.5">24h Fortitude DC</label>
                <input
                  type="number"
                  min="5"
                  max="40"
                  value={dcInput}
                  onChange={(e) => setDcInput(parseInt(e.target.value, 10) || 10)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-200"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddNegativeLevel}
                  className="w-full py-2 bg-red-950 hover:bg-red-900 border border-red-700 rounded-lg text-xs font-bold text-red-200 transition shadow flex items-center justify-center gap-1.5"
                >
                  <Skull className="w-3.5 h-3.5 text-red-400" />
                  <span>Inflict Negative Level</span>
                </button>
              </div>
            </div>
          </div>

          {/* 24-Hour Fortitude Recovery Log */}
          <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-2">
            <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
              <span className="font-bold text-xs text-stone-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>24-Hour Fortitude Recovery Checks</span>
              </span>
              <span className="text-[10px] text-stone-500">RAW: 24h after bestowal, roll Fort save vs DC</span>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-4 text-xs text-stone-500 italic">
                No active negative levels logged.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-2.5 bg-stone-900/90 border border-stone-800 rounded-lg flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-stone-200 flex items-center gap-1.5">
                        <Skull className="w-3 h-3 text-red-400" />
                        <span>{entry.source}</span>
                        <span className="text-stone-400 text-[10px]">({entry.timestamp})</span>
                      </div>
                      <div className="text-[11px] text-stone-400">
                        Fortitude DC: <span className="font-mono font-bold text-amber-300">{entry.dc}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRoll24hRecovery(entry)}
                        className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/60 rounded text-emerald-300 font-bold transition flex items-center gap-1"
                        title="Roll 1d20 + Fortitude Save vs DC to expel this negative level"
                      >
                        <Dices className="w-3 h-3" />
                        <span>Roll 24h Check</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Restoration Spells & Cures */}
          <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-2">
            <div className="font-bold text-xs text-stone-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Magical Restoration (D&D 3.5e)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={handleCastRestoration}
                disabled={currentNegativeLevels <= 0}
                className="p-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 border border-stone-700 rounded-lg text-left transition flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-sky-300">Restoration</div>
                  <div className="text-[10px] text-stone-400">Removes 1 Negative Level (100gp dust)</div>
                </div>
                <span className="text-xs font-mono font-bold text-stone-300 bg-stone-800 px-2 py-0.5 rounded">Cure 1</span>
              </button>

              <button
                type="button"
                onClick={handleCastGreaterRestoration}
                disabled={currentNegativeLevels <= 0}
                className="p-2.5 bg-amber-950/50 hover:bg-amber-900/60 disabled:opacity-40 border border-amber-600/50 rounded-lg text-left transition flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-amber-300">Greater Restoration</div>
                  <div className="text-[10px] text-stone-400">Removes ALL Negative Levels (500gp dust)</div>
                </div>
                <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded">Cure All</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-950 border-t border-stone-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-bold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
