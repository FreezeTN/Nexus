import React, { useState } from 'react';
import { Attack, CharacterData } from '../../types';
import {
  getCharacterBab,
  get35eIterativeAttacks,
  calculate35eAttackBonus,
  calculate35eDamageFormula,
  formatModifier,
  rollCompoundDamage,
  get35eEffectiveThreatRange,
  get35eCriticalMultiplier,
  evaluate35eMissChance,
  DND35E_MISS_CHANCE_PRESETS,
  MissChanceType,
  get35eMonkFlurryAttacks
} from '../../utils/dndCalculations';
import { CriticalConfirmationModal } from './CriticalConfirmationModal';
import {
  Swords,
  X,
  Dices,
  Flame,
  Sparkles,
  Crosshair,
  ShieldAlert,
  Zap,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';

interface FullAttackModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  attack: Attack;
  onRoll: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
  onRollDamage: (label: string, expression: string) => void;
}

interface AttackRollStep {
  id: string;
  name: string;
  source: 'iterative' | 'haste' | 'rapid_shot' | 'flurry';
  bonus: number;
  rolled?: {
    d20: number;
    total: number;
    isNat20: boolean;
    isNat1: boolean;
    confirmD20?: number;
    confirmTotal?: number;
    missChance?: { d100: number; isOvercome: boolean; log: string };
  };
  damageRolled?: {
    total: number;
    breakdown: string;
  };
}

export const FullAttackModal: React.FC<FullAttackModalProps> = ({
  isOpen,
  onClose,
  character,
  attack,
  onRoll,
  onRollDamage
}) => {
  const is35e = character.edition === '3.5e';
  // Modifiers
  const [powerAttackPenalty, setPowerAttackPenalty] = useState<number>(0);
  const isDefaultTwoHanded = Boolean(
    attack.isTwoHanded ||
    attack.name.toLowerCase().includes('great') ||
    attack.name.toLowerCase().includes('two-hand') ||
    attack.notes?.toLowerCase().includes('two-hand')
  );
  const [isTwoHandedGrip, setIsTwoHandedGrip] = useState<boolean>(isDefaultTwoHanded);

  const effectiveAttackForGrip = {
    ...attack,
    isTwoHanded: isTwoHandedGrip,
    isOffhand: isTwoHandedGrip ? false : attack.isOffhand
  };
  const dmgCalc = is35e ? calculate35eDamageFormula(character, effectiveAttackForGrip) : null;
  const baseDamageExpr = dmgCalc ? dmgCalc.damageFormula : (attack.damage || '1d8');

  const atkCalc = is35e ? calculate35eAttackBonus(character, attack) : null;
  const bab = atkCalc ? atkCalc.bab : getCharacterBab(character);
  const baseAttackBonus = atkCalc ? atkCalc.totalAttackBonus : attack.attackBonus;
  const baseIteratives = atkCalc ? atkCalc.iterativeAttacks : get35eIterativeAttacks(attack.attackBonus, bab);
  const [hasteActive, setHasteActive] = useState<boolean>(false);
  const [rapidShotActive, setRapidShotActive] = useState<boolean>(false);
  const [flurryActive, setFlurryActive] = useState<boolean>(false);
  const [situationalMod, setSituationalMod] = useState<number>(0);
  const [missChanceType, setMissChanceType] = useState<MissChanceType>('none');
  const hasBlindFight = Boolean(character.feats?.some((f) => f.name.toLowerCase().includes('blind-fight')));
  const activeMissChance = DND35E_MISS_CHANCE_PRESETS.find((p) => p.id === missChanceType);

  // Roll results state
  const [attackSteps, setAttackSteps] = useState<AttackRollStep[]>([]);
  const [isRollingSequence, setIsRollingSequence] = useState<boolean>(false);
  const [critConfirmStep, setCritConfirmStep] = useState<{ threatRoll: number; attackBonus: number } | null>(null);

  const threatRange = get35eEffectiveThreatRange(attack);

  if (!isOpen) return null;

  // Power Attack Damage Bonus: 1:1 for 1H, 2:1 for 2H in 3.5e
  const powerAttackDmgBonus = isTwoHandedGrip ? powerAttackPenalty * 2 : powerAttackPenalty;

  // Determine Monk level for Flurry of Blows progression
  const isMonk = character.characterClass.toLowerCase().includes('monk') ||
    Boolean(character.optionalRules?.secondaryClass?.toLowerCase().includes('monk'));
  const monkLevel = character.characterClass.toLowerCase().includes('monk')
    ? (character.level || 1)
    : (character.optionalRules?.secondaryLevel || 1);

  // Rapid Shot penalty (-2 to all attacks)
  let multiPenalty = 0;
  if (rapidShotActive) multiPenalty -= 2;

  // Net attack modifier on top of base (excluding flurry penalty which is baked into flurry steps)
  const baseAtkAdjustment = -powerAttackPenalty + multiPenalty + situationalMod;
  const globalAtkAdjustment = baseAtkAdjustment;

  // Build current sequence
  const currentSequence: AttackRollStep[] = [];

  if (flurryActive) {
    const flurrySteps = get35eMonkFlurryAttacks(monkLevel, baseAttackBonus);
    flurrySteps.forEach((fs) => {
      currentSequence.push({
        id: `atk-flurry-${fs.attackIndex}`,
        name: fs.label,
        source: fs.isExtraAttack ? 'flurry' : 'iterative',
        bonus: fs.bonus + baseAtkAdjustment
      });
    });
  } else {
    // 1st attack
    currentSequence.push({
      id: 'atk-1',
      name: '1st Attack (Primary)',
      source: 'iterative',
      bonus: baseAttackBonus + baseAtkAdjustment
    });

    // Iterative attacks from BAB
    baseIteratives.slice(1).forEach((it) => {
      currentSequence.push({
        id: `atk-iterative-${it.attackNumber}`,
        name: `${it.label} (${it.penalty} BAB)`,
        source: 'iterative',
        bonus: it.bonus + baseAtkAdjustment
      });
    });
  }

  // Haste extra attack (at highest bonus)
  if (hasteActive) {
    currentSequence.push({
      id: 'atk-haste',
      name: 'Haste Extra Attack',
      source: 'haste',
      bonus: baseAttackBonus + baseAtkAdjustment + (flurryActive ? (monkLevel >= 9 ? 0 : monkLevel >= 5 ? -1 : -2) : 0)
    });
  }

  // Rapid Shot extra attack (at highest bonus)
  if (rapidShotActive) {
    currentSequence.push({
      id: 'atk-rapid',
      name: 'Rapid Shot Attack',
      source: 'rapid_shot',
      bonus: baseAttackBonus + baseAtkAdjustment + (flurryActive ? (monkLevel >= 9 ? 0 : monkLevel >= 5 ? -1 : -2) : 0)
    });
  }

  // Helper to roll single attack in sequence
  const handleRollSingleInSequence = (stepIndex: number) => {
    const step = currentSequence[stepIndex];
    if (!step) return;

    const d20 = Math.floor(Math.random() * 20) + 1;
    const isNat20 = d20 === 20;
    const isNat1 = d20 === 1;
    const total = d20 + step.bonus;

    let missChanceRes = undefined;
    if (activeMissChance && activeMissChance.percentage > 0) {
      const res = evaluate35eMissChance(activeMissChance.percentage, hasBlindFight);
      missChanceRes = { d100: res.d100Roll, isOvercome: res.isOvercome, log: res.log };
    }

    // Send to global dice engine
    onRoll(`${attack.name} - ${step.name}`, 20, 1, step.bonus, 'normal');

    // Roll damage if hit or nat20
    let dmgResult: { total: number; breakdown: string } | undefined;
    if (!isNat1 && (!missChanceRes || missChanceRes.isOvercome)) {
      const baseExpr = baseDamageExpr;
      const fullDamageExpr = powerAttackDmgBonus > 0 ? `${baseExpr} + ${powerAttackDmgBonus}` : baseExpr;
      const rolled = rollCompoundDamage(fullDamageExpr, isNat20);
      dmgResult = { total: rolled.totalDamage, breakdown: rolled.breakdown };
      onRollDamage(`${attack.name} (${step.name}) Damage`, fullDamageExpr);
    }

    setAttackSteps((prev) => {
      const copy = [...(prev.length === currentSequence.length ? prev : currentSequence)];
      copy[stepIndex] = {
        ...copy[stepIndex],
        rolled: { d20, total, isNat20, isNat1, missChance: missChanceRes },
        damageRolled: dmgResult
      };
      return copy;
    });
  };

  // Roll All Attacks in Full Attack Action
  const handleRollAllInSequence = () => {
    setIsRollingSequence(true);
    const newSteps: AttackRollStep[] = currentSequence.map((step, idx) => {
      const d20 = Math.floor(Math.random() * 20) + 1;
      const isNat20 = d20 === 20;
      const isNat1 = d20 === 1;
      const total = d20 + step.bonus;

      let missChanceRes = undefined;
      if (activeMissChance && activeMissChance.percentage > 0) {
        const res = evaluate35eMissChance(activeMissChance.percentage, hasBlindFight);
        missChanceRes = { d100: res.d100Roll, isOvercome: res.isOvercome, log: res.log };
      }

      // Also roll confirmation roll if Nat 20
      let confirmD20: number | undefined;
      let confirmTotal: number | undefined;
      if (isNat20) {
        confirmD20 = Math.floor(Math.random() * 20) + 1;
        confirmTotal = confirmD20 + step.bonus;
      }

      // Roll Damage
      let dmgResult: { total: number; breakdown: string } | undefined;
      if (!isNat1 && (!missChanceRes || missChanceRes.isOvercome)) {
        const baseExpr = baseDamageExpr;
        const fullDamageExpr = powerAttackDmgBonus > 0 ? `${baseExpr} + ${powerAttackDmgBonus}` : baseExpr;
        const rolled = rollCompoundDamage(fullDamageExpr, isNat20);
        dmgResult = { total: rolled.totalDamage, breakdown: rolled.breakdown };
      }

      // Dispatch to session dice engine
      onRoll(`[Full Attack #${idx + 1}] ${attack.name} - ${step.name}`, 20, 1, step.bonus, 'normal');
      if (dmgResult) {
        const baseExpr = baseDamageExpr;
        const fullDamageExpr = powerAttackDmgBonus > 0 ? `${baseExpr} + ${powerAttackDmgBonus}` : baseExpr;
        onRollDamage(`[Full Attack #${idx + 1}] ${attack.name} Damage`, fullDamageExpr);
      }

      return {
        ...step,
        rolled: { d20, total, isNat20, isNat1, confirmD20, confirmTotal, missChance: missChanceRes },
        damageRolled: dmgResult
      };
    });

    setAttackSteps(newSteps);
    setIsRollingSequence(false);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-stone-900 border border-amber-600/50 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-stone-950 p-4 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-950/80 border border-amber-600/50 rounded-lg text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-serif font-bold text-amber-200">
                  Full Attack Sequence
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/60 font-bold">
                  3.5e Full-Round Action
                </span>
              </div>
              <p className="text-xs text-stone-400 font-mono">
                {attack.name} &bull; Base Atk {formatModifier(baseAttackBonus)} &bull; Base Dmg {baseDamageExpr} {attack.damageType} &bull; BAB +{bab}
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

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Tactical Modifiers Bar */}
          <div className="bg-stone-950 border border-stone-800 rounded-xl p-3.5 space-y-3">
            <div className="text-xs font-bold text-stone-300 flex items-center justify-between">
              <span className="uppercase tracking-wider">3.5e Combat & Tactical Feat Modifiers</span>
              <span className="text-[11px] font-mono text-stone-400">
                Net Atk Mod: <strong className={globalAtkAdjustment >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatModifier(globalAtkAdjustment)}</strong>
              </span>
            </div>

            {/* Power Attack Control */}
            <div className="bg-stone-900/90 border border-stone-800 p-2.5 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-300">⚔️ Power Attack</span>
                  <span className="text-[10px] text-stone-400">
                    (-{powerAttackPenalty} Atk / +{powerAttackDmgBonus} Dmg)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-[11px] text-stone-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isTwoHandedGrip}
                      onChange={(e) => setIsTwoHandedGrip(e.target.checked)}
                      className="rounded border-stone-700 text-amber-600 focus:ring-amber-500"
                    />
                    <span>Two-Handed (x2 Dmg)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={Math.min(bab, 20)}
                  value={powerAttackPenalty}
                  onChange={(e) => setPowerAttackPenalty(parseInt(e.target.value, 10) || 0)}
                  className="flex-1 accent-amber-500 cursor-pointer"
                />
                <div className="flex items-center gap-1 min-w-[65px] justify-end font-mono text-xs">
                  <span className="text-rose-400 font-bold">-{powerAttackPenalty}</span>
                  <span className="text-stone-500">/</span>
                  <span className="text-emerald-400 font-bold">+{powerAttackDmgBonus}</span>
                </div>
              </div>
            </div>

            {/* Toggles: Haste, Rapid Shot, Flurry */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Haste */}
              <label className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition ${
                hasteActive ? 'bg-amber-950/70 border-amber-600 text-amber-200 font-bold' : 'bg-stone-900 border-stone-800 text-stone-300'
              }`}>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Haste (+1 Atk)</span>
                </div>
                <input
                  type="checkbox"
                  checked={hasteActive}
                  onChange={(e) => setHasteActive(e.target.checked)}
                  className="rounded border-stone-700 text-amber-600 focus:ring-amber-500"
                />
              </label>

              {/* Rapid Shot */}
              <label className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition ${
                rapidShotActive ? 'bg-amber-950/70 border-amber-600 text-amber-200 font-bold' : 'bg-stone-900 border-stone-800 text-stone-300'
              }`}>
                <div className="flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-sky-400" />
                  <span>Rapid Shot (+1, -2)</span>
                </div>
                <input
                  type="checkbox"
                  checked={rapidShotActive}
                  onChange={(e) => setRapidShotActive(e.target.checked)}
                  className="rounded border-stone-700 text-amber-600 focus:ring-amber-500"
                />
              </label>

              {/* Flurry of Blows */}
              <label className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition ${
                flurryActive ? 'bg-amber-950/70 border-amber-600 text-amber-200 font-bold' : 'bg-stone-900 border-stone-800 text-stone-300'
              }`}>
                <div className="flex items-center gap-1.5">
                  <Swords className="w-3.5 h-3.5 text-orange-400" />
                  <span>Flurry (+1, -2)</span>
                </div>
                <input
                  type="checkbox"
                  checked={flurryActive}
                  onChange={(e) => setFlurryActive(e.target.checked)}
                  className="rounded border-stone-700 text-amber-600 focus:ring-amber-500"
                />
              </label>
            </div>

            {/* Situational Quick Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
              <span className="text-stone-400">Tactics:</span>
              {[
                { label: 'Flanking (+2)', mod: 2 },
                { label: 'High Ground (+1)', mod: 1 },
                { label: 'Bless (+1)', mod: 1 },
                { label: 'Charge (+2)', mod: 2 },
                { label: 'Prone Target (+4)', mod: 4 },
              ].map((chip) => {
                const active = situationalMod === chip.mod;
                return (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => setSituationalMod(active ? 0 : chip.mod)}
                    className={`px-2 py-0.5 rounded-full border transition font-mono ${
                      active
                        ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold'
                        : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
              {situationalMod !== 0 && (
                <button
                  type="button"
                  onClick={() => setSituationalMod(0)}
                  className="text-stone-500 hover:text-stone-300 underline font-mono text-[10px]"
                >
                  Clear
                </button>
              )}
            </div>

            {/* 3.5e Target Miss Chance & Concealment */}
            {character.edition === '3.5e' && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-900 text-xs">
                <div className="flex items-center gap-2">
                  <EyeOff className="w-3.5 h-3.5 text-stone-400" />
                  <span className="font-bold text-stone-300">Target Concealment / Miss Chance:</span>
                  <select
                    value={missChanceType}
                    onChange={(e) => setMissChanceType(e.target.value as MissChanceType)}
                    className="bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded px-2.5 py-1 font-mono focus:border-amber-500 outline-none"
                  >
                    {DND35E_MISS_CHANCE_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </div>

                {hasBlindFight && (
                  <span className="text-[10px] text-amber-300 bg-amber-950/70 border border-amber-700/50 px-2 py-0.5 rounded font-mono font-bold">
                    Blind-Fight Feat: Auto-Reroll Miss Chance
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Sequence & Roll Results Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-300">
              <span>Attack Sequence ({currentSequence.length} Attacks)</span>
              <button
                type="button"
                onClick={handleRollAllInSequence}
                disabled={isRollingSequence}
                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-xl text-xs transition shadow flex items-center gap-1.5 active:scale-[0.98]"
              >
                <Dices className="w-4 h-4" />
                <span>⚡ Roll All in Full Attack</span>
              </button>
            </div>

            <div className="space-y-2">
              {currentSequence.map((step, idx) => {
                const rolledStep = attackSteps[idx];
                const hasRolled = Boolean(rolledStep?.rolled);

                return (
                  <div
                    key={step.id}
                    className={`p-3 rounded-xl border transition ${
                      hasRolled
                        ? rolledStep?.rolled?.isNat20
                          ? 'bg-emerald-950/40 border-emerald-600/70 shadow'
                          : rolledStep?.rolled?.isNat1
                          ? 'bg-rose-950/40 border-rose-600/70 shadow'
                          : 'bg-stone-950 border-stone-800'
                        : 'bg-stone-950/80 border-stone-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-stone-900 border border-amber-600/40 text-amber-300 flex items-center justify-center text-xs font-mono font-bold">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                            <span>{step.name}</span>
                            {step.source === 'haste' && (
                              <span className="text-[9px] bg-amber-950 text-amber-400 border border-amber-700/50 px-1 rounded">
                                HASTE
                              </span>
                            )}
                            {step.source === 'rapid_shot' && (
                              <span className="text-[9px] bg-sky-950 text-sky-400 border border-sky-700/50 px-1 rounded">
                                RAPID SHOT
                              </span>
                            )}
                            {step.source === 'flurry' && (
                              <span className="text-[9px] bg-orange-950 text-orange-400 border border-orange-700/50 px-1 rounded">
                                FLURRY
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-amber-300">
                            Attack Bonus: <strong>{formatModifier(step.bonus)}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Roll or Roll Button */}
                      <div className="flex items-center gap-2">
                        {hasRolled ? (
                          <div className="flex items-center gap-3 font-mono text-xs">
                            {/* D20 Result */}
                            <div className="text-right">
                              <div className="text-stone-400 text-[10px]">d20 ({rolledStep?.rolled?.d20}) {formatModifier(step.bonus)}</div>
                              <div className={`text-base font-extrabold ${
                                rolledStep?.rolled?.isNat20
                                  ? 'text-emerald-300 font-serif'
                                  : rolledStep?.rolled?.isNat1
                                  ? 'text-rose-400'
                                  : 'text-amber-200'
                              }`}>
                                = {rolledStep?.rolled?.total}
                                {rolledStep?.rolled?.isNat20 && (
                                  <span className="ml-1 text-[10px] text-emerald-400 font-sans uppercase">
                                    [NAT 20]
                                  </span>
                                )}
                                {rolledStep?.rolled?.d20 !== undefined && rolledStep.rolled.d20 >= threatRange.minThreat && !rolledStep.rolled.isNat1 && (
                                  <span className="ml-1 text-[10px] text-amber-400 font-sans uppercase font-bold">
                                    [THREAT]
                                  </span>
                                )}
                                {rolledStep?.rolled?.isNat1 && (
                                  <span className="ml-1 text-[10px] text-rose-400 font-sans uppercase">
                                    [NAT 1]
                                  </span>
                                )}
                              </div>
                              {rolledStep?.rolled?.missChance && (
                                <div className={`text-[10px] font-mono font-bold mt-0.5 ${
                                  rolledStep.rolled.missChance.isOvercome ? 'text-emerald-400' : 'text-rose-400'
                                }`}>
                                  d100={rolledStep.rolled.missChance.d100} ({rolledStep.rolled.missChance.isOvercome ? 'Overcome' : 'Miss Chance'})
                                </div>
                              )}
                            </div>

                            {/* Threat Confirmation Button */}
                            {rolledStep?.rolled?.d20 !== undefined && rolledStep.rolled.d20 >= threatRange.minThreat && !rolledStep.rolled.isNat1 && (
                              <button
                                type="button"
                                onClick={() => setCritConfirmStep({
                                  threatRoll: rolledStep.rolled!.d20,
                                  attackBonus: step.bonus
                                })}
                                className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg text-[10px] transition shadow flex items-center gap-1 animate-pulse"
                                title="Roll Threat Confirmation & calculate multiplied critical damage"
                              >
                                <Swords className="w-3 h-3" />
                                <span>Confirm Crit</span>
                              </button>
                            )}

                            {/* Damage Result */}
                            {rolledStep?.damageRolled && (
                              <div className="pl-3 border-l border-stone-800 text-right">
                                <div className="text-stone-400 text-[10px]">Dmg ({rolledStep.damageRolled.breakdown})</div>
                                <div className="text-base font-extrabold text-rose-300">
                                  {rolledStep.damageRolled.total} <span className="text-[10px] text-stone-400 font-normal">{attack.damageType}</span>
                                </div>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRollSingleInSequence(idx)}
                              className="p-1.5 text-stone-500 hover:text-amber-300 rounded hover:bg-stone-800 transition"
                              title="Re-roll this attack individually"
                            >
                              <Dices className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRollSingleInSequence(idx)}
                            className="px-2.5 py-1 bg-stone-900 hover:bg-amber-600 text-stone-300 hover:text-stone-950 border border-stone-800 hover:border-amber-500 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1"
                          >
                            <Crosshair className="w-3.5 h-3.5" />
                            <span>Roll ({formatModifier(step.bonus)})</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-950 p-3.5 sm:p-4 border-t border-stone-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-stone-400 font-mono">
            {attack.notes ? `Crit/Special: ${attack.notes}` : `Threat Range: ${threatRange.display}`}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-stone-300 hover:text-white bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* 3.5e Critical Confirmation Modal for Full Attack */}
      {critConfirmStep && (
        <CriticalConfirmationModal
          isOpen={Boolean(critConfirmStep)}
          onClose={() => setCritConfirmStep(null)}
          attack={attack}
          character={character}
          initialThreatRoll={critConfirmStep.threatRoll}
          initialAttackBonus={critConfirmStep.attackBonus}
          onRoll={onRoll}
          onRollDamage={onRollDamage}
        />
      )}
    </div>
  );
};
