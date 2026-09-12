import React, { useState } from 'react';
import { CharacterData } from '../../../types';
import { Combatant } from '../../combat/encounter/encounterTypes';
import {
  calculateSuffocationState,
  evaluateExposureHazard
} from '../../../utils/environmentRules';
import {
  getEffectiveSaves,
  getAbilityModifier,
  getEffectiveAbilities,
  formatModifier
} from '../../../utils/dndCalculations';
import {
  playDiceSound,
  playHitSound,
  playMissSound,
  playDeathSound,
  playDamageAppliedSound,
  playIceColdSound
} from '../../../utils/diceAudio';
import {
  Waves,
  ThermometerSnowflake,
  Flame,
  Dices,
  Shield,
  HeartCrack,
  Skull,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Plus,
  Minus,
  Info,
  Users
} from 'lucide-react';

interface HazardsExposureRuleTabProps {
  character: CharacterData;
  combatants?: Combatant[];
  allCharacters?: CharacterData[];
  activeCombatantId?: string;
  onApplyDamageToCombatant?: (combatantId: string, damage: number) => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
}

export const HazardsExposureRuleTab: React.FC<HazardsExposureRuleTabProps> = ({
  character,
  combatants = [],
  allCharacters = [],
  activeCombatantId,
  onApplyDamageToCombatant,
  onRoll
}) => {
  const [subTab, setSubTab] = useState<'suffocation' | 'exposure'>('suffocation');

  // Target combatant / character
  const [selectedTargetId, setSelectedTargetId] = useState<string>(activeCombatantId || 'active-char');
  const targetCombatant = combatants.find(c => c.id === selectedTargetId);
  const targetChar = (selectedTargetId === 'active-char' || targetCombatant?.isPlayerChar)
    ? character
    : allCharacters.find(ch => ch.id === selectedTargetId) || character;

  const edition = targetChar.edition === '3.5e' ? '3.5e' : '5e';
  const abilities = getEffectiveAbilities(targetChar);
  const conScore = abilities.CON?.score || 10;
  const conMod = getAbilityModifier(conScore);
  const saves = getEffectiveSaves(targetChar);
  const fortSaveMod = saves?.FORT?.total ?? conMod;

  // Suffocation state
  const [roundsElapsed, setRoundsElapsed] = useState<number>(0);
  const [isTakingHeavyAction, setIsTakingHeavyAction] = useState<boolean>(true); // Combat is heavy action
  const [failedChecksCount, setFailedChecksCount] = useState<number>(0);
  const [lastCheckRoll, setLastCheckRoll] = useState<{
    d20: number;
    total: number;
    dc: number;
    passed: boolean;
  } | null>(null);

  const suffocationState = calculateSuffocationState({
    edition,
    conScore,
    conMod,
    isTakingHeavyAction,
    roundsElapsed,
    failedCheckCount: failedChecksCount
  });

  // Exposure state
  const [exposureHazard, setExposureHazard] = useState<
    'extreme_cold' | 'severe_cold' | 'extreme_heat' | 'severe_heat' | 'thirst' | 'starvation'
  >('extreme_cold');
  const [checksElapsed, setChecksElapsed] = useState<number>(0);
  const [hasProtection, setHasProtection] = useState<boolean>(false);
  const [wearingHeavyArmor, setWearingHeavyArmor] = useState<boolean>(false);
  const [lastExposureRoll, setLastExposureRoll] = useState<{
    d20: number;
    total: number;
    dc: number;
    passed: boolean;
    damageRoll?: number;
  } | null>(null);

  const exposureResult = evaluateExposureHazard({
    edition,
    hazardType: exposureHazard,
    checksElapsed,
    hasProtection,
    wearingHeavyArmor
  });

  // Handlers for Suffocation
  const handleRollSuffocationCheck = () => {
    playDiceSound();
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + conMod;
    const dc = suffocationState.saveDC;
    const passed = d20 === 20 || (d20 !== 1 && total >= dc);

    if (passed) {
      playHitSound(false);
    } else {
      playDeathSound();
      setFailedChecksCount(prev => prev + 1);
    }

    setLastCheckRoll({ d20, total, dc, passed });

    if (onRoll) {
      onRoll(`Constitution Check (Holding Breath vs DC ${dc})`, 20, 1, conMod, 'normal');
    }
  };

  const handleApplySuffocationConsequence = () => {
    if (!targetCombatant || !onApplyDamageToCombatant) return;

    if (suffocationState.status === 'unconscious') {
      // Drop to 0 HP
      const diff = targetCombatant.hpCurrent - 0;
      if (diff > 0) {
        onApplyDamageToCombatant(targetCombatant.id, diff);
      }
    } else if (suffocationState.status === 'dying') {
      // Drop to -1 HP
      const diff = targetCombatant.hpCurrent - (-1);
      if (diff > 0) {
        onApplyDamageToCombatant(targetCombatant.id, diff);
      }
    } else if (suffocationState.status === 'dead') {
      // Drop to -10 HP
      const diff = targetCombatant.hpCurrent - (-10);
      if (diff > 0) {
        onApplyDamageToCombatant(targetCombatant.id, diff);
      }
    }
  };

  // Handlers for Exposure
  const handleRollExposureCheck = () => {
    playDiceSound();
    const d20 = Math.floor(Math.random() * 20) + 1;
    const bonus = fortSaveMod + exposureResult.modifierAdjustment;
    const total = d20 + bonus;
    const dc = exposureResult.dc;
    const passed = d20 === 20 || (d20 !== 1 && total >= dc);

    let dmg = 0;
    if (!passed) {
      playIceColdSound();
      if (exposureHazard === 'extreme_cold' || exposureHazard === 'severe_cold' || exposureHazard === 'thirst' || exposureHazard === 'starvation') {
        dmg = Math.floor(Math.random() * 6) + 1;
      } else if (exposureHazard === 'extreme_heat' || exposureHazard === 'severe_heat') {
        dmg = Math.floor(Math.random() * 4) + 1;
      }
    } else {
      playHitSound(false);
    }

    setLastExposureRoll({
      d20,
      total,
      dc,
      passed,
      damageRoll: dmg > 0 ? dmg : undefined
    });

    setChecksElapsed(prev => prev + 1);

    if (onRoll) {
      onRoll(`${exposureResult.hazardName} Save vs DC ${dc}`, 20, 1, bonus, exposureResult.hasDisadvantage ? 'disadvantage' : 'normal');
    }
  };

  const handleApplyExposureDamage = () => {
    if (!targetCombatant || !onApplyDamageToCombatant || !lastExposureRoll?.damageRoll) return;
    playDamageAppliedSound('Bludgeoning');
    onApplyDamageToCombatant(targetCombatant.id, lastExposureRoll.damageRoll);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header & Target Selector */}
      <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-cyan-400" />
            <h3 className="font-serif font-bold text-cyan-200 text-sm sm:text-base">
              Suffocation, Drowning & Extreme Hazards (3.5e DMG / 5e PHB)
            </h3>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Breath hold limits, oxygen depletion, severe cold, extreme heat, thirst, and starvation rules.
          </p>
        </div>

        {/* Combatant Target Selector */}
        {combatants.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <Users className="w-4 h-4 text-stone-400" />
            <select
              value={selectedTargetId}
              onChange={(e) => {
                setSelectedTargetId(e.target.value);
                setRoundsElapsed(0);
                setFailedChecksCount(0);
                setLastCheckRoll(null);
                setChecksElapsed(0);
              }}
              className="bg-stone-900 border border-stone-700 text-cyan-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="active-char">Active Character ({character.name})</option>
              {combatants.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.isPlayerChar ? '(PC)' : '(Enemy/NPC)'}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Sub-tabs: Suffocation vs. Exposure */}
      <div className="flex gap-2 border-b border-stone-800 pb-2">
        <button
          type="button"
          onClick={() => setSubTab('suffocation')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            subTab === 'suffocation'
              ? 'bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 shadow'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
          }`}
        >
          <Waves className="w-3.5 h-3.5" />
          <span>Drowning & Suffocation</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('exposure')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            subTab === 'exposure'
              ? 'bg-amber-950/80 border border-amber-500/60 text-amber-300 shadow'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
          }`}
        >
          <ThermometerSnowflake className="w-3.5 h-3.5" />
          <span>Extreme Climate & Hazards</span>
        </button>
      </div>

      {/* SUBTAB 1: SUFFOCATION & DROWNING */}
      {subTab === 'suffocation' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Target Stats Box */}
            <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
              <span className="text-xs font-bold text-stone-300 uppercase tracking-wider block border-b border-stone-800 pb-1">
                Breathing Subject
              </span>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-stone-400">Target:</span>
                  <span className="text-stone-200 font-bold">{targetChar.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Constitution:</span>
                  <span className="text-amber-300 font-bold">{conScore} ({formatModifier(conMod)})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Ruleset:</span>
                  <span className="text-cyan-300 font-bold">{edition.toUpperCase()} PHB/DMG</span>
                </div>
                <div className="flex justify-between border-t border-stone-800 pt-1">
                  <span className="text-stone-400">Max Hold Time:</span>
                  <span className="text-emerald-400 font-bold">{suffocationState.maxRoundsHoldingBreath} rounds (~{suffocationState.maxMinutesHoldingBreath}m)</span>
                </div>
              </div>

              {edition === '3.5e' && (
                <label className="flex items-center gap-2 text-xs text-stone-300 pt-2 cursor-pointer border-t border-stone-800">
                  <input
                    type="checkbox"
                    checked={isTakingHeavyAction}
                    onChange={(e) => setIsTakingHeavyAction(e.target.checked)}
                    className="rounded border-stone-700 bg-stone-900 text-cyan-500"
                  />
                  <span>Taking Standard/Move Actions (Halves duration to {suffocationState.maxRoundsHoldingBreath} rds)</span>
                </label>
              )}
            </div>

            {/* Rounds Counter Box */}
            <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-stone-300 uppercase tracking-wider block border-b border-stone-800 pb-1">
                  Rounds Without Air
                </span>
                <div className="flex items-center justify-center gap-4 my-3">
                  <button
                    type="button"
                    onClick={() => setRoundsElapsed(prev => Math.max(0, prev - 1))}
                    className="w-8 h-8 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 flex items-center justify-center font-bold"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="text-center">
                    <div className="text-3xl font-mono font-bold text-cyan-400">{roundsElapsed}</div>
                    <div className="text-[10px] text-stone-400 uppercase font-mono">rounds ({roundsElapsed * 6}s)</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRoundsElapsed(prev => prev + 1)}
                    className="w-8 h-8 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 flex items-center justify-center font-bold"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRoundsElapsed(prev => prev + 5)}
                  className="flex-1 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-[11px] font-mono rounded text-stone-300"
                >
                  +5 Rds
                </button>
                <button
                  type="button"
                  onClick={() => setRoundsElapsed(prev => prev + 10)}
                  className="flex-1 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-[11px] font-mono rounded text-stone-300"
                >
                  +10 Rds
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRoundsElapsed(0);
                    setFailedChecksCount(0);
                    setLastCheckRoll(null);
                  }}
                  className="px-2 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-[11px] font-mono rounded text-stone-400"
                  title="Reset counter"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Current State & Action Box */}
            <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-stone-300 uppercase tracking-wider block border-b border-stone-800 pb-1">
                  Physiological State
                </span>
                <div className="mt-2">
                  <div className={`p-2.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-2 ${
                    suffocationState.status === 'holding'
                      ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-300'
                      : suffocationState.status === 'checking'
                      ? 'bg-amber-950/60 border-amber-600/60 text-amber-300'
                      : suffocationState.status === 'unconscious'
                      ? 'bg-orange-950/60 border-orange-600/60 text-orange-300'
                      : 'bg-rose-950/60 border-rose-600/60 text-rose-300'
                  }`}>
                    {suffocationState.status === 'holding' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {suffocationState.status === 'checking' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                    {suffocationState.status === 'unconscious' && <HeartCrack className="w-4 h-4 text-orange-400" />}
                    {(suffocationState.status === 'dying' || suffocationState.status === 'dead') && <Skull className="w-4 h-4 text-rose-400" />}
                    <span className="uppercase">{suffocationState.status}</span>
                  </div>
                </div>
                <p className="text-[11px] text-stone-400 mt-2 leading-relaxed">
                  {suffocationState.description}
                </p>
              </div>

              {/* Action Button */}
              {suffocationState.requiresSaveThisRound && (
                <button
                  type="button"
                  onClick={handleRollSuffocationCheck}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>Roll CON Check vs DC {suffocationState.saveDC}</span>
                </button>
              )}

              {targetCombatant && (suffocationState.status === 'unconscious' || suffocationState.status === 'dying' || suffocationState.status === 'dead') && (
                <button
                  type="button"
                  onClick={handleApplySuffocationConsequence}
                  className="w-full py-2 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow"
                >
                  <Skull className="w-3.5 h-3.5" />
                  <span>Apply {suffocationState.status.toUpperCase()} to {targetCombatant.name}</span>
                </button>
              )}
            </div>
          </div>

          {/* Roll Result Feedback */}
          {lastCheckRoll && (
            <div className={`p-3 rounded-xl border text-xs font-mono ${
              lastCheckRoll.passed
                ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-200'
                : 'bg-rose-950/60 border-rose-600/60 text-rose-200'
            }`}>
              <div className="flex items-center justify-between font-bold">
                <span>Suffocation CON Check vs DC {lastCheckRoll.dc}:</span>
                <span className="uppercase">{lastCheckRoll.passed ? 'PASSED' : 'FAILED'}</span>
              </div>
              <div className="text-[11px] mt-1 text-stone-300">
                Rolled d20 ({lastCheckRoll.d20}) + CON mod ({formatModifier(conMod)}) = <strong>{lastCheckRoll.total}</strong> vs DC {lastCheckRoll.dc}
              </div>
              <p className="text-[11px] text-stone-200 mt-1">
                {lastCheckRoll.passed
                  ? 'Withstood asphyxiation for another round!'
                  : 'Gasping for air! Creature begins actively suffocating.'}
              </p>
            </div>
          )}

          {/* Rule Citation Footer */}
          <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-stone-400 text-xs flex items-start gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-stone-300">Official Rule Citation:</strong>
              <p>{suffocationState.citation}</p>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: EXTREME CLIMATE & EXPOSURE */}
      {subTab === 'exposure' && (
        <div className="space-y-4">
          {/* Hazard Selection Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {[
              { id: 'extreme_cold' as const, label: 'Extreme Cold', icon: '❄️', sub: '< 40°F / 0°F' },
              { id: 'severe_cold' as const, label: 'Severe Cold', icon: '🧊', sub: '< 0°F' },
              { id: 'extreme_heat' as const, label: 'Extreme Heat', icon: '☀️', sub: '> 90°F / 100°F' },
              { id: 'severe_heat' as const, label: 'Severe Heat', icon: '🌋', sub: '> 110°F' },
              { id: 'thirst' as const, label: 'Thirst', icon: '💧', sub: 'No water' },
              { id: 'starvation' as const, label: 'Starvation', icon: '🍞', sub: 'No food' },
            ].map(hazard => (
              <button
                key={hazard.id}
                type="button"
                onClick={() => {
                  setExposureHazard(hazard.id);
                  setChecksElapsed(0);
                  setLastExposureRoll(null);
                }}
                className={`p-2 rounded-xl border text-left transition flex flex-col justify-between ${
                  exposureHazard === hazard.id
                    ? 'bg-amber-950/70 border-amber-500/80 text-amber-200 ring-1 ring-amber-500/30'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <div className="text-base">{hazard.icon}</div>
                <div className="font-bold text-xs mt-1 text-stone-200">{hazard.label}</div>
                <div className="text-[10px] text-stone-500 font-mono">{hazard.sub}</div>
              </button>
            ))}
          </div>

          {/* Hazard Evaluator Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Hazard Config & Equipment Toggles */}
            <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <h4 className="font-serif font-bold text-amber-300 text-sm flex items-center gap-2">
                  <span>{exposureResult.hazardName}</span>
                </h4>
                <span className="text-[10px] font-mono bg-stone-800 px-2 py-0.5 rounded text-stone-300">
                  {edition.toUpperCase()} Rules
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between font-mono">
                  <span className="text-stone-400">Save Frequency:</span>
                  <span className="text-amber-300 font-bold">{exposureResult.intervalDesc}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-stone-400">Current DC:</span>
                  <span className="text-amber-400 font-bold">DC {exposureResult.dc} ({exposureResult.saveType})</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-stone-400">Penalty on Failure:</span>
                  <span className="text-rose-400 font-bold">{exposureResult.damageOrPenalty}</span>
                </div>
              </div>

              {/* Equipment & Condition Modifiers */}
              <div className="pt-2 border-t border-stone-800 space-y-2 text-xs">
                {(exposureHazard.includes('cold') || exposureHazard.includes('heat')) && (
                  <label className="flex items-center gap-2 text-stone-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasProtection}
                      onChange={(e) => setHasProtection(e.target.checked)}
                      className="rounded border-stone-700 bg-stone-900 text-amber-500"
                    />
                    <span>
                      {exposureHazard.includes('cold')
                        ? 'Cold Weather Outfit (+5 Fortitude / Immune in 5e)'
                        : 'Desert Robes / Constant Shade'}
                    </span>
                  </label>
                )}

                <label className="flex items-center gap-2 text-stone-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wearingHeavyArmor}
                    onChange={(e) => setWearingHeavyArmor(e.target.checked)}
                    className="rounded border-stone-700 bg-stone-900 text-amber-500"
                  />
                  <span>Wearing Medium/Heavy Armor or Heavy Clothing</span>
                </label>
              </div>

              {/* Checks elapsed tracker */}
              <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-xs font-mono">
                <span className="text-stone-400">Checks Made So Far:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setChecksElapsed(prev => Math.max(0, prev - 1))}
                    className="w-6 h-6 rounded bg-stone-900 border border-stone-700 text-stone-300 flex items-center justify-center font-bold"
                  >
                    -
                  </button>
                  <span className="text-amber-300 font-bold">{checksElapsed}</span>
                  <button
                    type="button"
                    onClick={() => setChecksElapsed(prev => prev + 1)}
                    className="w-6 h-6 rounded bg-stone-900 border border-stone-700 text-stone-300 flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Roll Save & Outcome */}
            <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <span className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                    Exposure Resolution
                  </span>
                  <span className="text-[11px] font-mono text-stone-400">
                    Subject Save: +{fortSaveMod + exposureResult.modifierAdjustment}
                  </span>
                </div>

                <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                  {exposureResult.summary}
                </p>

                {/* Outcome Box */}
                {lastExposureRoll && (
                  <div className={`mt-3 p-3 rounded-xl border text-xs font-mono ${
                    lastExposureRoll.passed
                      ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-200'
                      : 'bg-rose-950/60 border-rose-600/60 text-rose-200'
                  }`}>
                    <div className="flex items-center justify-between font-bold">
                      <span>Save vs DC {lastExposureRoll.dc}:</span>
                      <span className="uppercase">{lastExposureRoll.passed ? 'PASSED' : 'FAILED'}</span>
                    </div>
                    <div className="text-[11px] mt-1 text-stone-300">
                      Rolled d20 ({lastExposureRoll.d20}) + Save ({fortSaveMod + exposureResult.modifierAdjustment}) = <strong>{lastExposureRoll.total}</strong>
                    </div>
                    {lastExposureRoll.damageRoll && (
                      <div className="text-rose-300 font-bold mt-1">
                        Sustained {lastExposureRoll.damageRoll} nonlethal damage from exposure!
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleRollExposureCheck}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-stone-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>Roll {exposureResult.saveType} Save vs DC {exposureResult.dc}</span>
                </button>

                {targetCombatant && lastExposureRoll?.damageRoll && (
                  <button
                    type="button"
                    onClick={handleApplyExposureDamage}
                    className="w-full py-2 bg-rose-900/80 hover:bg-rose-800 border border-rose-600/60 text-rose-200 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <HeartCrack className="w-3.5 h-3.5" />
                    <span>Apply -{lastExposureRoll.damageRoll} HP to {targetCombatant.name}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Rule Citation */}
          <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-stone-400 text-xs flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-stone-300">Official Rule Citation:</strong>
              <p>{exposureResult.citation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
