import React, { useState } from 'react';
import { CharacterData, Attack, GearItem } from '../../types';
import {
  Zap,
  Shield,
  Sword,
  Sparkles,
  RotateCcw,
  Check,
  AlertTriangle,
  Info,
  Flame,
  Dices,
  BookOpen,
  Layers,
  Heart,
  ChevronRight
} from 'lucide-react';
import { getAbilityModifier } from '../../utils/calculators/abilityCalculators';

interface PathfinderTacticalPanelProps {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRoll: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
}

export const PathfinderTacticalPanel: React.FC<PathfinderTacticalPanelProps> = ({
  character,
  onUpdateCharacter,
  onRoll
}) => {
  // 3-Action Economy State for current turn
  const [spentActions, setSpentActions] = useState<number>(0);
  const [spentReaction, setSpentReaction] = useState<boolean>(false);
  const [activeWeaponAgile, setActiveWeaponAgile] = useState<boolean>(false);
  const [selectedActionCount, setSelectedActionCount] = useState<number>(1);
  const [focusPointsCurrent, setFocusPointsCurrent] = useState<number>(character.focusPointsCurrent ?? 1);
  const [focusPointsMax, setFocusPointsMax] = useState<number>(character.focusPointsMax ?? 3);

  const level = character.level || 1;
  const strMod = getAbilityModifier(character.abilities?.STR?.score || 10);
  const dexMod = getAbilityModifier(character.abilities?.DEX?.score || 10);
  const wisMod = getAbilityModifier(character.abilities?.WIS?.score || 10);

  // Standard PF2e Proficiency: Trained = level + 2
  const trainedBonus = level + 2;
  const expertBonus = level + 4;
  const masterBonus = level + 6;
  const legendaryBonus = level + 8;

  // Base Attack Bonus for primary weapon
  const primaryAttackBonus = trainedBonus + Math.max(strMod, dexMod);

  const handleSpendActions = (count: number) => {
    setSpentActions(Math.min(3, spentActions + count));
  };

  const handleResetTurnActions = () => {
    setSpentActions(0);
    setSpentReaction(false);
  };

  const handleRollMapAttack = (attackNum: 1 | 2 | 3) => {
    let penalty = 0;
    if (attackNum === 2) penalty = activeWeaponAgile ? -4 : -5;
    if (attackNum === 3) penalty = activeWeaponAgile ? -8 : -10;

    const totalMod = primaryAttackBonus + penalty;
    const label = `PF2e Strike #${attackNum} (${penalty === 0 ? 'No MAP' : `MAP ${penalty}`}${activeWeaponAgile ? ', Agile' : ''})`;
    onRoll(label, 20, 1, totalMod, 'normal');
    handleSpendActions(1);
  };

  const handleRefocus = () => {
    const updated = Math.min(focusPointsMax, focusPointsCurrent + 1);
    setFocusPointsCurrent(updated);
    onUpdateCharacter({
      ...character,
      focusPointsCurrent: updated,
      focusPointsMax
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="pathfinder-tactical-suite">
      
      {/* 3-Action Economy Turn Engine */}
      <div className="bg-stone-900 border border-emerald-500/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-300 font-bold text-lg shadow">
              ◆
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-serif font-bold text-stone-100">
                  Pathfinder 2e Action Economy
                </h3>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  3-Action Turn
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Track your 3 actions per turn, free actions, and reaction per round.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetTurnActions}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-mono font-bold transition border border-stone-700 cursor-pointer shadow"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Reset Turn (3 Actions)</span>
          </button>
        </div>

        {/* Action Pips Visual Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[1, 2, 3].map((actionNum) => {
            const isUsed = spentActions >= actionNum;
            return (
              <button
                key={actionNum}
                type="button"
                onClick={() => setSpentActions(isUsed ? actionNum - 1 : actionNum)}
                className={`p-4 rounded-2xl border transition text-left cursor-pointer flex items-center justify-between ${
                  isUsed
                    ? 'bg-stone-950 border-stone-800 text-stone-600 opacity-60'
                    : 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 shadow-md'
                }`}
              >
                <div>
                  <div className="text-xs font-mono font-bold uppercase">
                    Action {actionNum}
                  </div>
                  <div className="text-sm font-serif font-bold mt-0.5">
                    {isUsed ? 'Spent ◆' : 'Available ◆'}
                  </div>
                </div>
                <div className={`text-2xl font-black ${isUsed ? 'text-stone-700' : 'text-emerald-400 animate-pulse'}`}>
                  ◆
                </div>
              </button>
            );
          })}

          {/* Reaction Tracker */}
          <button
            type="button"
            onClick={() => setSpentReaction(!spentReaction)}
            className={`p-4 rounded-2xl border transition text-left cursor-pointer flex items-center justify-between ${
              spentReaction
                ? 'bg-stone-950 border-stone-800 text-stone-600 opacity-60'
                : 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200 shadow-md'
            }`}
          >
            <div>
              <div className="text-xs font-mono font-bold uppercase">
                Reaction (⤾)
              </div>
              <div className="text-sm font-serif font-bold mt-0.5">
                {spentReaction ? 'Used ⤾' : 'Ready ⤾'}
              </div>
            </div>
            <div className={`text-2xl font-black ${spentReaction ? 'text-stone-700' : 'text-cyan-400'}`}>
              ⤾
            </div>
          </button>
        </div>

        {/* Quick Common Actions Bank */}
        <div className="pt-2 border-t border-stone-800">
          <div className="text-xs font-mono text-stone-400 font-bold mb-2">Common 1-3 Action Maneuvers</div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Stride (Move Speed)', cost: 1, icon: '🏃' },
              { label: 'Step (5ft without AoO)', cost: 1, icon: '👣' },
              { label: 'Raise a Shield (+2 AC)', cost: 1, icon: '🛡️' },
              { label: 'Recall Knowledge', cost: 1, icon: '🧠' },
              { label: 'Cast a Spell (Standard)', cost: 2, icon: '🪄' },
              { label: 'Cast a Spell (Major)', cost: 3, icon: '⚡' },
              { label: 'Feint / Trip / Disarm', cost: 1, icon: '⚔️' }
            ].map(act => (
              <button
                key={act.label}
                type="button"
                onClick={() => handleSpendActions(act.cost)}
                disabled={spentActions + act.cost > 3}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-950 hover:bg-stone-800 disabled:opacity-40 border border-stone-800 rounded-xl text-xs text-stone-300 font-sans transition cursor-pointer"
              >
                <span>{act.icon}</span>
                <span>{act.label}</span>
                <span className="text-[10px] font-mono font-bold text-emerald-400">
                  {act.cost === 1 ? '◆' : act.cost === 2 ? '◆◆' : '◆◆◆'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Multiple Attack Penalty (MAP) Engine */}
      <div className="bg-stone-900 border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300 shadow">
              <Sword className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-serif font-bold text-stone-100">
                  Multiple Attack Penalty (MAP) Roller
                </h3>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40">
                  Auto-Calculated
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Strikes made consecutively suffer progressive attack penalties.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 bg-stone-950 border border-stone-800 px-3 py-1.5 rounded-xl cursor-pointer text-xs font-mono text-amber-300">
            <input
              type="checkbox"
              checked={activeWeaponAgile}
              onChange={(e) => setActiveWeaponAgile(e.target.checked)}
              className="rounded accent-amber-500 w-4 h-4"
            />
            <span>Agile Weapon (-4 / -8 instead of -5 / -10)</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 1st Strike */}
          <button
            type="button"
            onClick={() => handleRollMapAttack(1)}
            className="p-4 bg-stone-950 hover:bg-amber-950/40 border border-stone-800 hover:border-amber-500 rounded-2xl transition text-left cursor-pointer group space-y-1 shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-stone-400">1st Strike ◆</span>
              <span className="text-xs font-mono font-bold text-emerald-400">No Penalty (+0)</span>
            </div>
            <div className="text-xl font-mono font-black text-amber-300 group-hover:scale-105 transition-transform">
              +{primaryAttackBonus} to hit
            </div>
            <p className="text-[11px] text-stone-400">Rolls 1d20 + {primaryAttackBonus}</p>
          </button>

          {/* 2nd Strike */}
          <button
            type="button"
            onClick={() => handleRollMapAttack(2)}
            className="p-4 bg-stone-950 hover:bg-amber-950/40 border border-stone-800 hover:border-amber-500 rounded-2xl transition text-left cursor-pointer group space-y-1 shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-stone-400">2nd Strike ◆</span>
              <span className="text-xs font-mono font-bold text-rose-400">
                {activeWeaponAgile ? '-4 Penalty' : '-5 Penalty'}
              </span>
            </div>
            <div className="text-xl font-mono font-black text-amber-300 group-hover:scale-105 transition-transform">
              +{primaryAttackBonus + (activeWeaponAgile ? -4 : -5)} to hit
            </div>
            <p className="text-[11px] text-stone-400">
              Rolls 1d20 + {primaryAttackBonus + (activeWeaponAgile ? -4 : -5)}
            </p>
          </button>

          {/* 3rd+ Strike */}
          <button
            type="button"
            onClick={() => handleRollMapAttack(3)}
            className="p-4 bg-stone-950 hover:bg-amber-950/40 border border-stone-800 hover:border-amber-500 rounded-2xl transition text-left cursor-pointer group space-y-1 shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-stone-400">3rd+ Strike ◆</span>
              <span className="text-xs font-mono font-bold text-rose-500">
                {activeWeaponAgile ? '-8 Penalty' : '-10 Penalty'}
              </span>
            </div>
            <div className="text-xl font-mono font-black text-amber-300 group-hover:scale-105 transition-transform">
              +{primaryAttackBonus + (activeWeaponAgile ? -8 : -10)} to hit
            </div>
            <p className="text-[11px] text-stone-400">
              Rolls 1d20 + {primaryAttackBonus + (activeWeaponAgile ? -8 : -10)}
            </p>
          </button>
        </div>
      </div>

      {/* Focus Spells & Focus Points Pool */}
      <div className="bg-stone-900 border border-purple-500/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-300 shadow">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-serif font-bold text-stone-100">
                  Focus Points & Focus Spells
                </h3>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40">
                  PF2e Arcane
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Cast special class focus powers and refocus during 10-minute exploration activities.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefocus}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-mono font-bold transition cursor-pointer shadow"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Refocus (10 min)</span>
          </button>
        </div>

        {/* Focus Point Orbs */}
        <div className="flex items-center gap-4 bg-stone-950 p-4 rounded-2xl border border-stone-800">
          <span className="text-xs font-mono text-stone-400 font-bold">Focus Pool:</span>
          <div className="flex items-center gap-2">
            {Array.from({ length: focusPointsMax }).map((_, idx) => {
              const isFilled = idx < focusPointsCurrent;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const newPts = isFilled ? idx : idx + 1;
                    setFocusPointsCurrent(newPts);
                    onUpdateCharacter({ ...character, focusPointsCurrent: newPts });
                  }}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition cursor-pointer ${
                    isFilled
                      ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-900/50'
                      : 'bg-stone-900 border-stone-700 text-stone-600'
                  }`}
                >
                  ⚡
                </button>
              );
            })}
          </div>
          <span className="text-xs font-mono text-stone-300 ml-auto">
            {focusPointsCurrent} / {focusPointsMax} Points
          </span>
        </div>
      </div>

      {/* 4 Degrees of Success Visual Reference */}
      <div className="bg-stone-950 border border-stone-800 rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-mono font-bold uppercase text-stone-300">
            Pathfinder 2e: Four Degrees of Success Guide
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
          <div className="bg-emerald-950/40 border border-emerald-500/40 p-3 rounded-xl space-y-1">
            <span className="font-mono font-black text-emerald-400 block">Critical Success</span>
            <p className="text-[11px] text-stone-300">DC + 10 or Natural 20 (improves by 1 degree).</p>
          </div>
          <div className="bg-blue-950/40 border border-blue-500/40 p-3 rounded-xl space-y-1">
            <span className="font-mono font-black text-blue-400 block">Success</span>
            <p className="text-[11px] text-stone-300">Meets or beats the Target DC.</p>
          </div>
          <div className="bg-amber-950/40 border border-amber-500/40 p-3 rounded-xl space-y-1">
            <span className="font-mono font-black text-amber-400 block">Failure</span>
            <p className="text-[11px] text-stone-300">Below the Target DC without exceeding -9.</p>
          </div>
          <div className="bg-rose-950/40 border border-rose-500/40 p-3 rounded-xl space-y-1">
            <span className="font-mono font-black text-rose-400 block">Critical Failure</span>
            <p className="text-[11px] text-stone-300">DC - 10 or Natural 1 (worsens by 1 degree).</p>
          </div>
        </div>
      </div>

    </div>
  );
};
