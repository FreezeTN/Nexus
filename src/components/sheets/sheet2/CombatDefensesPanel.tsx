import React, { useState } from 'react';
import { CharacterData } from '../../../types';
import {
  formatModifier,
  getAbilityModifier,
  getEffectiveAbilities,
  get35eTouchAC,
  get35eFlatFootedAC,
  get35eGrapple,
  get35eArmorClass,
  getEffectiveSpeed,
  getArmorClassBreakdown,
  getEffectiveMaxHp,
  calculateCharacterTotalDR,
  getCharacterResistances,
  getCharacterImmunities,
  calculateInitiativeBonus,
  getCharacterBab,
  format35eBabProgression,
  calculate35eTotalArmorCheckPenalty,
  calculate35eDamageReduction,
  calculate35eAoOPool,
  calculate35eAbilityDamageDrainSummary,
  get35eSkillBonus,
  getProficiencyBonus,
  get35eSpaceAndReach,
  get35eSizeModifier,
  get35eGrappleModifier,
  get35eHideModifier
} from '../../../utils/dndCalculations';
import { canCharacterShapeshift, canCharacterSummonCompanion } from '../../../utils/classProgressionUtils';

import { HpOrb, getHpColorClass } from '../../HpOrb';
import { ConditionsPanel } from '../../combat/ConditionsPanel';
import { Edit35eAcModal } from '../../modals/Edit35eAcModal';
import { Edit35eBabModal } from '../../modals/Edit35eBabModal';
import { Edit35eDrResistanceModal } from '../../modals/Edit35eDrResistanceModal';
import { CombatManeuvers35eModal } from '../../modals/CombatManeuvers35eModal';
import { AoOTrackerModal } from '../../modals/AoOTrackerModal';
import { AbilityDamageDrainModal } from '../../modals/AbilityDamageDrainModal';
import { NegativeLevelsModal } from '../../modals/NegativeLevelsModal';
import { ConcentrationCheckModal } from '../../modals/ConcentrationCheckModal';
import { TumbleAcrobaticsModal } from '../../modals/TumbleAcrobaticsModal';
import { MountedCombatModal } from '../../modals/MountedCombatModal';
import { WildShape35eModal } from '../../modals/WildShape35eModal';
import { CreatureSizeScaleModal } from '../../modals/CreatureSizeScaleModal';
import { EnvironmentalHazardsModal } from '../../modals/EnvironmentalHazardsModal';
import { EditMovementSpeedModal } from '../../modals/EditMovementSpeedModal';
import { getEnvironmentalTraitStatus } from '../../../utils/environmentRules';
import { useLayoutCustomization } from '../../../utils/layoutCustomization';
import { useLanguage } from '../../../i18n/LanguageContext';
import {
  Shield,
  ShieldAlert,
  Heart,
  Zap,
  Footprints,
  Plus,
  Minus,
  Dices,
  Skull,
  Flame,
  Moon,
  Pencil,
  Crosshair,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronUp,
  ChevronDown,
  Layers,
  Swords,
  PawPrint,
  Compass,
  RefreshCw,
  AlertTriangle,
  Eye,
  Activity,
  Maximize2
} from 'lucide-react';

interface CombatDefensesPanelProps {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRoll: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
  setShowMaxHpInspector: (val: boolean) => void;
  setShowTransformationModal: (val: boolean) => void;
  setShowCompanionModal?: (val: boolean) => void;
  setShowModifierInspector?: (target?: any) => void;
}

export const CombatDefensesPanel: React.FC<CombatDefensesPanelProps> = ({
  character,
  onUpdateCharacter,
  onRoll,
  setShowMaxHpInspector,
  setShowTransformationModal,
  setShowCompanionModal,
  setShowModifierInspector
}) => {
  const { t } = useLanguage();
  const [show35eAcModal, setShow35eAcModal] = useState(false);
  const [show35eBabModal, setShow35eBabModal] = useState(false);
  const [show35eDrModal, setShow35eDrModal] = useState(false);
  const [show35eManeuversModal, setShow35eManeuversModal] = useState(false);
  const [show35eAoOModal, setShow35eAoOModal] = useState(false);
  const [show35eAbilityDamageModal, setShow35eAbilityDamageModal] = useState(false);
  const [show35eNegativeLevelsModal, setShow35eNegativeLevelsModal] = useState(false);
  const [show35eConcentrationModal, setShow35eConcentrationModal] = useState(false);
  const [show35eTumbleModal, setShow35eTumbleModal] = useState(false);
  const [show35eMountedModal, setShow35eMountedModal] = useState(false);
  const [show35eWildShapeModal, setShow35eWildShapeModal] = useState(false);
  const [show35eEnvironmentalModal, setShow35eEnvironmentalModal] = useState(false);
  const [show35eSizeScaleModal, setShow35eSizeScaleModal] = useState(false);
  const [showSpeedModal, setShowSpeedModal] = useState(false);
  const [isTacticalPanelExpanded, setIsTacticalPanelExpanded] = useState(true);
  const effectiveMaxHp = getEffectiveMaxHp(character);
  const speedInfo = getEffectiveSpeed(character);
  const ac35 = get35eArmorClass(character);
  const acp35 = calculate35eTotalArmorCheckPenalty(character);
  const aooInfo = calculate35eAoOPool(character);
  const abilityDamageSummary = calculate35eAbilityDamageDrainSummary(character);
  const canShapeshift = canCharacterShapeshift(character);
  const canSummon = Boolean(setShowCompanionModal && canCharacterSummonCompanion(character));

  const handleToggleDeathSuccess = (index: number) => {
    const current = character.deathSavesSuccesses;
    const next = current === index + 1 ? index : index + 1;
    let updatedHpCurrent = character.hpCurrent;
    let updatedSuccesses = next;
    let updatedFailures = character.deathSavesFailures;
    let conds = character.conditions || [];

    if (next >= 3) {
      updatedHpCurrent = Math.max(1, updatedHpCurrent || 1);
      updatedSuccesses = 0;
      updatedFailures = 0;
      conds = conds.filter(c => c !== 'Unconscious' && c !== 'Dead');
    }

    onUpdateCharacter({
      ...character,
      hpCurrent: updatedHpCurrent,
      deathSavesSuccesses: updatedSuccesses,
      deathSavesFailures: updatedFailures,
      conditions: conds
    });
  };

  const handleToggleDeathFailure = (index: number) => {
    const current = character.deathSavesFailures;
    const next = current === index + 1 ? index : index + 1;
    const isNowDead = next >= 3;
    const conds = character.conditions || [];

    onUpdateCharacter({
      ...character,
      hpCurrent: isNowDead ? 0 : character.hpCurrent,
      deathSavesFailures: next,
      conditions: conds
    });
  };

  const handleRollDeathSave = () => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    let label = `Death Save Roll (${d20})`;
    let updatedSuccesses = character.deathSavesSuccesses;
    let updatedFailures = character.deathSavesFailures;
    let updatedHpCurrent = character.hpCurrent;
    let conds = character.conditions || [];

    if (d20 === 20) {
      label += ' - NAT 20! Regain 1 HP & Stabilized!';
      updatedHpCurrent = Math.max(1, updatedHpCurrent || 1);
      updatedSuccesses = 0;
      updatedFailures = 0;
      conds = conds.filter(c => c !== 'Unconscious' && c !== 'Dead');
    } else if (d20 === 1) {
      label += ' - NAT 1! 2 Failures!';
      updatedFailures = Math.min(3, updatedFailures + 2);
    } else if (d20 >= 10) {
      label += ' - Success!';
      updatedSuccesses = Math.min(3, updatedSuccesses + 1);
      if (updatedSuccesses >= 3) {
        label += ' 🌟 3 Successes! Regained 1 HP & Stabilized!';
        updatedHpCurrent = Math.max(1, updatedHpCurrent || 1);
        updatedSuccesses = 0;
        updatedFailures = 0;
        conds = conds.filter(c => c !== 'Unconscious' && c !== 'Dead');
      }
    } else {
      label += ' - Failure!';
      updatedFailures = Math.min(3, updatedFailures + 1);
    }

    const isNowDead = updatedFailures >= 3;

    if (isNowDead) {
      updatedHpCurrent = 0;
      label += ' 💀 3 Failures - CHARACTER DIED!';
      if (!conds.includes('Dead')) {
        conds = [...conds, 'Dead'];
      }
    }

    onUpdateCharacter({
      ...character,
      hpCurrent: updatedHpCurrent,
      deathSavesSuccesses: updatedSuccesses,
      deathSavesFailures: updatedFailures,
      conditions: conds
    });

    onRoll(label, 20, 1, 0, 'normal');
  };

  const handleRoll35eStabilization = () => {
    const d100 = Math.floor(Math.random() * 100) + 1;
    const isSuccess = d100 <= 10;
    const conds = character.conditions || [];
    if (isSuccess) {
      const updatedConds = Array.from(new Set([...conds, 'Unconscious'])).filter((c) => c !== 'Dead');
      onUpdateCharacter({
        ...character,
        isStabilized35e: true,
        conditions: updatedConds
      });
      onRoll(`3.5e Stabilization Roll (d100=${d100} ≤ 10%): Stabilized!`, 100, 1, 0, 'normal');
    } else {
      const newHp = (character.hpCurrent ?? 0) - 1;
      const isDead = newHp <= -10;
      let updatedConds = [...conds];
      if (isDead) {
        updatedConds = Array.from(new Set([...updatedConds, 'Dead']));
      }
      onUpdateCharacter({
        ...character,
        hpCurrent: newHp,
        isStabilized35e: false,
        conditions: updatedConds
      });
      onRoll(
        `3.5e Stabilization Roll (d100=${d100} > 10%): Failed! Lost 1 HP (Now ${newHp} HP)${isDead ? ' 💀 DEAD (HP ≤ -10)' : ''}`,
        100,
        1,
        0,
        'normal'
      );
    }
  };

  const handleRoll35eHealCheck = () => {
    const abilities = getEffectiveAbilities(character);
    const wisMod = getAbilityModifier(abilities.WIS?.score || 10);
    const healSkill = character.skills?.find((s) => s.name.toLowerCase() === 'heal');
    const healMod = healSkill ? get35eSkillBonus(healSkill, abilities, character.skills) : wisMod;
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + healMod;
    const success = total >= 15;
    const conds = character.conditions || [];

    if (success) {
      const updatedConds = Array.from(new Set([...conds, 'Unconscious'])).filter((c) => c !== 'Dead');
      onUpdateCharacter({
        ...character,
        isStabilized35e: true,
        conditions: updatedConds
      });
      onRoll(`First Aid Heal Check (DC 15: d20[${d20}] + ${healMod} = ${total}): Success! Stabilized.`, 20, 1, healMod, 'normal');
    } else {
      onRoll(`First Aid Heal Check (DC 15: d20[${d20}] + ${healMod} = ${total}): Failed.`, 20, 1, healMod, 'normal');
    }
  };

  const handleToggle35eStabilized = () => {
    onUpdateCharacter({
      ...character,
      isStabilized35e: !character.isStabilized35e
    });
  };

  const handleHpDelta = (delta: number) => {
    const current = character.hpCurrent ?? effectiveMaxHp;
    const minAllowed = character.edition === '3.5e' ? -10 : 0;
    const newHp = Math.max(minAllowed, Math.min(effectiveMaxHp, current + delta));
    let conds = character.conditions || [];
    if (newHp <= 0 && !conds.includes('Unconscious')) {
      conds = [...conds, 'Unconscious'];
    } else if (newHp > 0 && conds.includes('Unconscious')) {
      conds = conds.filter((c) => c !== 'Unconscious');
    }
    onUpdateCharacter({
      ...character,
      hpCurrent: newHp,
      conditions: conds,
    });
  };

  const { isVisible } = useLayoutCustomization();

  const showHpOrb = isVisible('s2_vitalityHpOrb');
  const showDefStats = isVisible('s2_defenseStats');
  const showDeathSaves = isVisible('s2_deathSavesForm');
  const showConditions = isVisible('s2_conditionsPanel');

  const resistances = getCharacterResistances(character);
  const immunities = getCharacterImmunities(character);
  const drInfo = calculateCharacterTotalDR(character);

  const visibleTopCount = (showHpOrb ? 1 : 0) + (showDefStats ? 1 : 0) + (showDeathSaves ? 1 : 0);
  const topColClass = visibleTopCount === 1 ? 'md:col-span-12' : visibleTopCount === 2 ? 'md:col-span-6' : 'md:col-span-4';

  return (
    <div className="space-y-6">
      {/* Primary Defense & HP Summary Cards */}
      {visibleTopCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Left 4 cols: HP Orb, Health Controls & Integrated Action Economy */}
          {showHpOrb && (
            <div className={`${topColClass} bg-stone-900 border border-stone-800 rounded-2xl p-3.5 flex flex-col gap-2.5 shadow-xl`}>
              <div className="w-full flex items-center justify-between border-b border-stone-800 pb-2">
                <span className="font-serif font-bold text-amber-200 text-sm flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-500" /> Vitality & HP
                </span>

                <button
                  onClick={() => setShowMaxHpInspector(true)}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-mono font-bold bg-stone-950 px-2 py-0.5 rounded border border-amber-600/40 hover:border-amber-500 transition cursor-pointer"
                  title="Inspect Max HP Formula and Level-by-Level Breakdown"
                >
                  Max HP Inspector 🔍
                </button>
              </div>

              {/* Enhanced Health Orb + Health Progress Bar & Quick Adjusters (Centered vertically to eliminate dead space) */}
              <div className="flex-1 flex flex-col justify-center gap-3 my-auto">
                {(() => {
                const safeMax = Math.max(1, effectiveMaxHp);
                const currentHp = character.hpCurrent ?? effectiveMaxHp;
                const hpPct = Math.max(0, Math.min(100, Math.round((currentHp / safeMax) * 100)));

                const hitDieMatch = (character.hitDiceTotal || '').match(/(\d+)d(\d+)/i);
                const maxHitDice = hitDieMatch ? parseInt(hitDieMatch[1]) : (character.level || 1);
                const dieSides = hitDieMatch ? parseInt(hitDieMatch[2]) : 8;
                const conScore = character.abilities?.CON?.score ?? 10;
                const conMod = Math.floor((conScore - 10) / 2);

                let barGradient = 'from-emerald-600 via-emerald-500 to-emerald-400';
                if (hpPct < 25) {
                  barGradient = 'from-rose-700 via-rose-600 to-rose-500';
                } else if (hpPct < 50) {
                  barGradient = 'from-orange-600 via-orange-500 to-orange-400';
                } else if (hpPct < 75) {
                  barGradient = 'from-amber-600 via-amber-500 to-amber-400';
                }

                return (
                  <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800/80 space-y-2">
                    <div className="flex items-center gap-3">
                      <HpOrb
                        hpCurrent={currentHp}
                        hpMax={effectiveMaxHp}
                        size="md"
                        showLabel={false}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between font-mono">
                          <span className="text-[10px] uppercase font-bold text-stone-400">
                            Hit Points
                          </span>
                          <span className={`font-mono font-extrabold text-sm ${getHpColorClass(hpPct)}`}>
                            {currentHp} <span className="text-stone-500 font-normal">/</span> {effectiveMaxHp}
                          </span>
                        </div>

                        {/* Liquid-style Animated Progress Bar */}
                        <div className="w-full bg-stone-900 border border-stone-800 rounded-full h-2 overflow-hidden my-1">
                          <div
                            className={`h-full bg-gradient-to-r ${barGradient} transition-all duration-500`}
                            style={{ width: `${hpPct}%` }}
                          />
                        </div>

                        {/* Quick Adjust Steppers */}
                        <div className="flex items-center justify-between gap-1 pt-0.5">
                          <span className="text-[9px] font-mono text-stone-500 uppercase">Quick HP:</span>
                          <div className="flex items-center gap-1 font-mono text-[10px]">
                            <button
                              type="button"
                              onClick={() => handleHpDelta(-5)}
                              className="px-1.5 py-0.5 rounded bg-stone-900 hover:bg-rose-950 text-rose-300 hover:text-rose-200 border border-stone-800 hover:border-rose-700/60 font-bold transition cursor-pointer"
                              title="Take 5 Damage"
                            >
                              -5
                            </button>
                            <button
                              type="button"
                              onClick={() => handleHpDelta(-1)}
                              className="px-1.5 py-0.5 rounded bg-stone-900 hover:bg-rose-950 text-rose-300 hover:text-rose-200 border border-stone-800 hover:border-rose-700/60 font-bold transition cursor-pointer"
                              title="Take 1 Damage"
                            >
                              -1
                            </button>
                            <button
                              type="button"
                              onClick={() => handleHpDelta(1)}
                              className="px-1.5 py-0.5 rounded bg-stone-900 hover:bg-emerald-950 text-emerald-300 hover:text-emerald-200 border border-stone-800 hover:border-emerald-700/60 font-bold transition cursor-pointer"
                              title="Heal 1 HP"
                            >
                              +1
                            </button>
                            <button
                              type="button"
                              onClick={() => handleHpDelta(5)}
                              className="px-1.5 py-0.5 rounded bg-stone-900 hover:bg-emerald-950 text-emerald-300 hover:text-emerald-200 border border-stone-800 hover:border-emerald-700/60 font-bold transition cursor-pointer"
                              title="Heal 5 HP"
                            >
                              +5
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sub-row: Temp HP, Nonlethal (3.5e), Hit Dice Tracker, and Rest */}
                    <div className="grid grid-cols-3 gap-2 pt-1 text-xs font-mono">
                      <div className="bg-stone-900/90 p-1.5 rounded-lg border border-stone-800 text-center">
                        <div className="text-[9px] text-stone-400 font-sans uppercase font-bold">Temp HP</div>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <input
                            type="number"
                            min="0"
                            value={character.hpTemp || 0}
                            onChange={(e) => onUpdateCharacter({ ...character, hpTemp: parseInt(e.target.value) || 0 })}
                            className="w-12 bg-stone-950 border border-stone-700 rounded text-center text-sky-300 font-bold p-0.5 text-xs"
                          />
                        </div>
                      </div>

                      {character.edition === '3.5e' && (
                        <div className="bg-stone-900/90 p-1.5 rounded-lg border border-stone-800 text-center">
                          <div className="text-[9px] text-amber-400/90 font-sans uppercase font-bold">Nonlethal</div>
                          <div className="flex items-center justify-center gap-1 mt-0.5">
                            <input
                              type="number"
                              min="0"
                              value={character.nonlethalDamage || 0}
                              onChange={(e) => onUpdateCharacter({ ...character, nonlethalDamage: Math.max(0, parseInt(e.target.value) || 0) })}
                              className="w-12 bg-stone-950 border border-stone-700 rounded text-center text-amber-300 font-bold p-0.5 text-xs"
                              title="3.5e Nonlethal Damage. If Nonlethal >= Current HP, character becomes Staggered or Unconscious."
                            />
                          </div>
                        </div>
                      )}

                      {/* Hit Dice Tracker Card */}
                      {character.edition === '3.5e' ? (
                        <div className="bg-stone-900/90 p-1.5 rounded-lg border border-stone-800 text-center flex flex-col justify-between">
                          <div className="text-[9px] text-stone-400 font-sans uppercase font-bold">Hit Dice (HD)</div>
                          <div className="font-mono text-xs font-bold text-amber-300">
                            {character.hitDiceTotal || `${character.level || 1} HD`}
                          </div>
                          <div className="text-[8.5px] text-stone-500 font-mono">
                            {conMod >= 0 ? `+${conMod * (character.level || 1)} CON` : `${conMod * (character.level || 1)} CON`}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-stone-900/90 p-1 rounded-lg border border-stone-800 text-center flex flex-col justify-between">
                          <div className="flex items-center justify-between text-[9px] text-stone-400 font-sans uppercase font-bold px-1">
                            <span>Hit Dice</span>
                            <span className="text-amber-400">d{dieSides}</span>
                          </div>
                          <div className="flex items-center justify-center gap-1 my-0.5">
                            <button
                              type="button"
                              onClick={() => onUpdateCharacter({
                                ...character,
                                hitDiceCurrent: Math.max(0, character.hitDiceCurrent - 1)
                              })}
                              disabled={character.hitDiceCurrent <= 0}
                              className="w-4 h-4 bg-stone-800 hover:bg-stone-700 disabled:opacity-30 rounded text-[10px] text-stone-200 flex items-center justify-center font-mono cursor-pointer"
                              title="Spend 1 Hit Die"
                            >
                              -
                            </button>
                            <span className="font-mono text-xs font-extrabold text-amber-300 px-0.5">
                              {character.hitDiceCurrent} <span className="text-stone-500 font-normal">/ {maxHitDice}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateCharacter({
                                ...character,
                                hitDiceCurrent: Math.min(maxHitDice, character.hitDiceCurrent + 1)
                              })}
                              disabled={character.hitDiceCurrent >= maxHitDice}
                              className="w-4 h-4 bg-stone-800 hover:bg-stone-700 disabled:opacity-30 rounded text-[10px] text-stone-200 flex items-center justify-center font-mono cursor-pointer"
                              title="Regain 1 Hit Die"
                            >
                              +
                            </button>
                          </div>
                          {onRoll && (
                            <button
                              type="button"
                              onClick={() => {
                                if (character.hitDiceCurrent <= 0) return;
                                const roll = Math.floor(Math.random() * dieSides) + 1;
                                const healAmount = Math.max(1, roll + conMod);
                                const newHp = Math.min(effectiveMaxHp, (character.hpCurrent ?? 0) + healAmount);
                                onRoll(`Hit Die Healing (1d${dieSides} + ${conMod} CON)`, dieSides, 1, conMod, 'normal');
                                onUpdateCharacter({
                                  ...character,
                                  hitDiceCurrent: character.hitDiceCurrent - 1,
                                  hpCurrent: newHp
                                });
                              }}
                              disabled={character.hitDiceCurrent <= 0 || (character.hpCurrent ?? 0) >= effectiveMaxHp}
                              className="text-[8.5px] bg-amber-950/80 hover:bg-amber-900 disabled:opacity-30 text-amber-200 border border-amber-700/40 rounded px-1 py-0.5 transition cursor-pointer font-bold"
                              title="Roll 1 Hit Die (1dDie + CON) & Heal HP"
                            >
                              Roll 1 HD
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* INTEGRATED ACTION ECONOMY FOR 5E & 3.5E */}
              {character.edition === '3.5e' ? (
                /* 3.5e Action Economy Tracker */
                <div className="bg-stone-950 px-2.5 py-2 rounded-xl border border-stone-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 text-sky-400" />
                      <span>Action Economy (Round Tracker)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateCharacter({
                          ...character,
                          actionEconomy: {
                            standardActionUsed: false,
                            moveActionUsed: false,
                            swiftActionUsed: false,
                            immediateActionUsed: false,
                            fiveFootStepTaken: false,
                          },
                        })
                      }
                      className="text-[9px] font-mono font-bold text-sky-400 hover:text-sky-300 underline cursor-pointer"
                    >
                      Reset Turn Actions
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateCharacter({
                          ...character,
                          actionEconomy: {
                            ...character.actionEconomy,
                            standardActionUsed: !character.actionEconomy?.standardActionUsed,
                          },
                        })
                      }
                      className={`p-1 rounded-lg border text-center transition cursor-pointer ${
                        character.actionEconomy?.standardActionUsed
                          ? 'bg-stone-900 text-stone-500 border-stone-800 line-through'
                          : 'bg-amber-950/60 text-amber-200 border-amber-700/60 font-bold'
                      }`}
                      title="Click to toggle Standard Action used"
                    >
                      Standard
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onUpdateCharacter({
                          ...character,
                          actionEconomy: {
                            ...character.actionEconomy,
                            moveActionUsed: !character.actionEconomy?.moveActionUsed,
                          },
                        })
                      }
                      className={`p-1 rounded-lg border text-center transition cursor-pointer ${
                        character.actionEconomy?.moveActionUsed
                          ? 'bg-stone-900 text-stone-500 border-stone-800 line-through'
                          : 'bg-indigo-950/60 text-indigo-200 border-indigo-700/60 font-bold'
                      }`}
                      title="Click to toggle Move Action used"
                    >
                      Move
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onUpdateCharacter({
                          ...character,
                          actionEconomy: {
                            ...character.actionEconomy,
                            swiftActionUsed: !character.actionEconomy?.swiftActionUsed,
                          },
                        })
                      }
                      className={`p-1 rounded-lg border text-center transition cursor-pointer ${
                        character.actionEconomy?.swiftActionUsed
                          ? 'bg-stone-900 text-stone-500 border-stone-800 line-through'
                          : 'bg-sky-950/60 text-sky-200 border-sky-700/60 font-bold'
                      }`}
                      title="Click to toggle Swift / Immediate Action used"
                    >
                      Swift/Imm.
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onUpdateCharacter({
                          ...character,
                          actionEconomy: {
                            ...character.actionEconomy,
                            fiveFootStepTaken: !character.actionEconomy?.fiveFootStepTaken,
                          },
                        })
                      }
                      className={`p-1 rounded-lg border text-center transition cursor-pointer ${
                        character.actionEconomy?.fiveFootStepTaken
                          ? 'bg-stone-900 text-stone-500 border-stone-800 line-through'
                          : 'bg-emerald-950/60 text-emerald-200 border-emerald-700/60 font-bold'
                      }`}
                      title="Click to toggle 5-ft Step taken (prevents AoO)"
                    >
                      5-ft Step
                    </button>
                  </div>

                  {/* 3.5e Mounted Combat & Nonlethal Status Footer */}
                  {(() => {
                    const currentHp = character.hpCurrent ?? effectiveMaxHp;
                    const nonlethal = character.nonlethalDamage || 0;
                    const isStaggered = nonlethal > 0 && nonlethal === currentHp && currentHp > 0;
                    const isUnconsciousNL = nonlethal > 0 && nonlethal > currentHp && currentHp > 0;

                    return (
                      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-stone-800/60 text-[10px] font-mono">
                        {isUnconsciousNL ? (
                          <span className="text-rose-400 font-bold flex items-center gap-1 animate-pulse">
                            ⚠️ Unconscious (Nonlethal &gt; Current HP)
                          </span>
                        ) : isStaggered ? (
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            ⚠️ Staggered (Nonlethal = HP: 1 Action/turn)
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShow35eMountedModal(true)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                              character.isMounted
                                ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-600'
                                : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700'
                            }`}
                            title="Open 3.5e Mounted Combat (PHB p. 157): Ride check, mount cover, spur mount"
                          >
                            <Shield className="w-3 h-3 text-amber-400" />
                            <span>{character.isMounted ? `Mounted: ${character.mountInfo?.name || 'Steed'}` : 'Mount & Ride (3.5e)'}</span>
                          </button>
                        )}

                        {character.isMounted && (
                          <span className="text-[10px] text-emerald-400 font-mono">
                            Steed: {character.mountInfo?.speed || '60 ft.'}
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  {/* 3.5e Creature Size, Combat Space & Natural Reach Strip (Integrated into Column 1 Movement & Space) */}
                  {(() => {
                    const sizeScaleInfo = get35eSpaceAndReach(character.sizeCategory, character.reachType || character.isQuadruped);
                    const sizeAtkAcMod = get35eSizeModifier(character.sizeCategory);
                    const sizeGrappleMod = get35eGrappleModifier(character.sizeCategory);
                    const sizeHideMod = get35eHideModifier(character.sizeCategory);
                    return (
                      <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800/90 space-y-1.5 shadow-sm">
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 font-serif font-bold text-amber-300 text-xs">
                            <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                            <span>{character.sizeCategory || 'Medium'}</span>
                            <span className="text-[10px] font-sans font-normal text-stone-400">
                              ({sizeScaleInfo.reachType} Reach)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShow35eSizeScaleModal(true)}
                            className="text-[9.5px] font-bold font-sans bg-amber-950/90 hover:bg-amber-900 text-amber-300 border border-amber-600/50 px-2 py-0.5 rounded transition shadow-sm cursor-pointer flex items-center gap-1 shrink-0"
                            title="Open Table: Creature Size and Scale (Official D&D 3.5e dimensions, reach and modifiers)"
                          >
                            <Maximize2 className="w-2.5 h-2.5 text-amber-400" />
                            <span>Size Table</span>
                          </button>
                        </div>

                        <div className="flex items-center justify-center gap-2 sm:gap-3 text-[10.5px] font-mono bg-stone-900/60 px-2 py-1.5 rounded-lg border border-stone-800/80 text-center">
                          <span className="text-stone-300">Space: <strong className="text-sky-300">{sizeScaleInfo.spaceDisplay}</strong></span>
                          <span className="text-stone-700">•</span>
                          <span className="text-stone-300">
                            Reach: <strong className={sizeScaleInfo.isZeroReach ? 'text-amber-400' : 'text-purple-300'}>{sizeScaleInfo.reachDisplay}</strong>
                          </span>
                          <span className="text-stone-700">•</span>
                          <span className="text-[9.5px] text-stone-400" title={`Atk/AC ${formatModifier(sizeAtkAcMod)} | Grapple ${formatModifier(sizeGrappleMod)} | Hide ${formatModifier(sizeHideMod)}`}>
                            Atk/AC <strong className={sizeAtkAcMod > 0 ? 'text-emerald-400' : sizeAtkAcMod < 0 ? 'text-red-400' : 'text-stone-300'}>{formatModifier(sizeAtkAcMod)}</strong> | Grap <strong className="text-amber-300">{formatModifier(sizeGrappleMod)}</strong>
                          </span>
                        </div>

                        {sizeScaleInfo.isZeroReach && (
                          <div className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 text-center">
                            ⚠️ 0 ft Reach (Must enter opponent's square to attack)
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* 5e Action Economy Tracker - Integrated into Vitality & HP */
                <div className="bg-stone-950 px-2.5 py-2 rounded-xl border border-stone-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 text-sky-400" />
                      <span>Action Economy (5e Round)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateCharacter({
                          ...character,
                          actionEconomy: {
                            ...character.actionEconomy,
                            actionUsed5e: false,
                            bonusActionUsed5e: false,
                            reactionUsed5e: false,
                          },
                        })
                      }
                      className="text-[9px] font-mono font-bold text-sky-400 hover:text-sky-300 underline cursor-pointer"
                    >
                      Reset Turn Actions
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateCharacter({
                          ...character,
                          actionEconomy: {
                            ...character.actionEconomy,
                            actionUsed5e: !character.actionEconomy?.actionUsed5e,
                          },
                        })
                      }
                      className={`p-1.5 rounded-lg border text-center transition cursor-pointer ${
                        character.actionEconomy?.actionUsed5e
                          ? 'bg-stone-900 text-stone-500 border-stone-800 line-through'
                          : 'bg-amber-950/60 text-amber-200 border-amber-700/60 font-bold'
                      }`}
                      title="Click to toggle Action used"
                    >
                      Action
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onUpdateCharacter({
                          ...character,
                          actionEconomy: {
                            ...character.actionEconomy,
                            bonusActionUsed5e: !character.actionEconomy?.bonusActionUsed5e,
                          },
                        })
                      }
                      className={`p-1.5 rounded-lg border text-center transition cursor-pointer ${
                        character.actionEconomy?.bonusActionUsed5e
                          ? 'bg-stone-900 text-stone-500 border-stone-800 line-through'
                          : 'bg-indigo-950/60 text-indigo-200 border-indigo-700/60 font-bold'
                      }`}
                      title="Click to toggle Bonus Action used"
                    >
                      Bonus Action
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onUpdateCharacter({
                          ...character,
                          actionEconomy: {
                            ...character.actionEconomy,
                            reactionUsed5e: !character.actionEconomy?.reactionUsed5e,
                          },
                        })
                      }
                      className={`p-1.5 rounded-lg border text-center transition cursor-pointer ${
                        character.actionEconomy?.reactionUsed5e
                          ? 'bg-stone-900 text-stone-500 border-stone-800 line-through'
                          : 'bg-rose-950/60 text-rose-200 border-rose-700/60 font-bold'
                      }`}
                      title="Click to toggle Reaction used (Opportunity Attack, Shield, Counterspell)"
                    >
                      Reaction
                    </button>
                  </div>

                  {/* 5e Mounted Combat Controls */}
                  <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-stone-800/60">
                    <button
                      type="button"
                      onClick={() => setShow35eMountedModal(true)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                        character.isMounted
                          ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-600'
                          : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700'
                      }`}
                      title="Open 5e Mounted Combat (PHB p. 198): Movement cost, Controlled vs Independent mount, DC 10 Dex saves"
                    >
                      <Shield className="w-3 h-3 text-amber-400" />
                      <span>{character.isMounted ? `Mounted: ${character.mountInfo?.name || 'Steed'}` : 'Mounted Combat (5e)'}</span>
                    </button>
                    {character.isMounted && (
                      <span className="text-[10px] text-emerald-400 font-mono">
                        Steed: {character.mountInfo?.speed || '60 ft.'}
                      </span>
                    )}
                  </div>
                </div>
              )}
              </div>
            </div>
          )}

      {/* Middle 4 cols: Armor Class, Initiative, Speed & Damage Mitigation */}
          {showDefStats && (
            <div className={`${topColClass} bg-stone-900 border border-stone-800 rounded-2xl p-3.5 flex flex-col shadow-xl`}>
              <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-2">
                <span className="font-serif font-bold text-amber-200 text-sm flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-500" /> {t('defenses.armorClass', 'Defense Stats')}
                </span>
                <div className="flex items-center gap-1.5">
                  {setShowModifierInspector && (
                    <button
                      onClick={() => setShowModifierInspector('ac')}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-mono font-bold bg-stone-950 px-2 py-0.5 rounded border border-amber-600/40 hover:border-amber-500 transition flex items-center gap-1 cursor-pointer"
                      title="Inspect Universal Stacking Modifier Engine"
                    >
                      <Layers className="w-3 h-3 text-amber-400" />
                      <span>Modifier Engine</span>
                    </button>
                  )}
                  <span className="text-[10px] text-stone-400 font-mono bg-stone-950 px-2 py-0.5 rounded border border-stone-800">
                    {character.edition === '3.5e' ? '3.5e Rules' : '5e Rules'}
                  </span>
                </div>
              </div>

              {/* Primary Defense Metrics Grid: AC, Initiative, Speed */}
              {character.edition === '3.5e' ? (
                <div className="flex-1 flex flex-col justify-center gap-2.5 my-auto">
                  {/* Top quick stats: Initiative, BAB, Grapple/SR, Speed, AoO */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-center font-mono">
                    {/* Initiative */}
                    {(() => {
                      const initBonus = calculateInitiativeBonus(character);
                      return (
                        <div className="bg-stone-950 p-2 rounded-xl border border-stone-800/90 flex flex-col justify-between items-center h-[76px] transition hover:border-stone-700">
                          <div className="h-4 w-full flex items-center justify-center">
                            <span className="text-[9px] text-stone-400 font-sans uppercase font-bold tracking-wider truncate">{t('stats.initiative', 'Initiative')}</span>
                          </div>
                          <div className="h-7 w-full flex items-center justify-center">
                            <button
                              onClick={() => onRoll('Initiative Roll', 20, 1, initBonus, 'normal')}
                              className="text-lg font-serif font-extrabold text-emerald-300 hover:text-emerald-200 transition leading-none cursor-pointer"
                              title={`Roll Initiative (${formatModifier(initBonus)})`}
                            >
                              {formatModifier(initBonus)}
                            </button>
                          </div>
                          <div className="h-3.5 w-full flex items-center justify-center">
                            <span className="text-[8px] text-stone-500 font-mono truncate">Init Mod</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Base Attack Bonus (BAB) */}
                    {(() => {
                      const bab = getCharacterBab(character);
                      const progression = format35eBabProgression(bab);
                      return (
                        <div className="bg-stone-950 p-2 rounded-xl border border-stone-800/90 flex flex-col justify-between items-center h-[76px] relative group hover:border-stone-700 transition">
                          <div className="h-4 w-full flex items-center justify-center relative px-1">
                            <span className="text-[9px] text-stone-400 font-sans uppercase font-bold tracking-wider truncate">Base Atk</span>
                            <button
                              type="button"
                              onClick={() => setShow35eBabModal(true)}
                              className="absolute right-0 top-0 text-stone-500 hover:text-amber-400 transition p-0.5 cursor-pointer"
                              title="Edit Base Attack Bonus (BAB) & Iterative Attacks"
                            >
                              <Pencil className="w-2.5 h-2.5" />
                            </button>
                          </div>
                          <div className="h-7 w-full flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => setShow35eBabModal(true)}
                              className="text-lg font-serif font-extrabold text-amber-300 hover:text-amber-200 transition leading-none cursor-pointer"
                              title="Base Attack Bonus. Click to customize."
                            >
                              {formatModifier(bab)}
                            </button>
                          </div>
                          <div className="h-3.5 w-full flex items-center justify-center">
                            <span className="text-[8px] text-amber-400/80 font-mono truncate max-w-full px-0.5" title={`Attack Progression: ${progression}`}>
                              {bab >= 6 ? progression : 'Single Atk'}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Grapple */}
                    {(() => {
                      const grappleMod = get35eGrapple(character);
                      return (
                        <div className="bg-stone-950 p-2 rounded-xl border border-stone-800/90 flex flex-col justify-between items-center h-[76px] transition hover:border-stone-700">
                          <div className="h-4 w-full flex items-center justify-center">
                            <span className="text-[9px] text-stone-400 font-sans uppercase font-bold tracking-wider truncate">Grapple</span>
                          </div>
                          <div className="h-7 w-full flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => onRoll('Grapple Check', 20, 1, grappleMod, 'normal')}
                              className="text-lg font-serif font-extrabold text-amber-300 hover:text-amber-200 transition leading-none cursor-pointer flex items-center gap-1"
                              title={`Click to roll Grapple Check: d20 + ${grappleMod}`}
                            >
                              <span>{formatModifier(grappleMod)}</span>
                            </button>
                          </div>
                          <div className="h-3.5 w-full flex items-center justify-center">
                            <span className="text-[8px] text-stone-500 font-mono truncate px-0.5" title="BAB + STR mod + Size mod">BAB+STR+Size</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Speed */}
                    <div className="bg-stone-950 p-2 rounded-xl border border-stone-800/90 flex flex-col justify-between items-center h-[76px] relative group hover:border-sky-500/50 transition">
                      <div className="h-4 w-full flex items-center justify-center relative px-1">
                        <span className="text-[9px] text-stone-400 font-sans uppercase font-bold tracking-wider truncate">{t('stats.speed', 'Speed')}</span>
                        <button
                          type="button"
                          id="btn-open-speed-modal-35e"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowSpeedModal(true);
                          }}
                          className="absolute right-0 top-0 text-stone-500 hover:text-sky-400 transition p-0.5 cursor-pointer"
                          title="Edit Movement Speeds & Tactical Mobility"
                        >
                          <Pencil className="w-2.5 h-2.5" />
                        </button>
                      </div>
                      <div className="h-7 w-full flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => setShowSpeedModal(true)}
                          className="text-lg font-serif font-extrabold text-sky-300 hover:text-sky-200 leading-none flex items-center gap-1 cursor-pointer transition"
                          title="Click to edit movement speeds"
                        >
                          <Footprints className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span>{speedInfo.effectiveSpeed}</span>
                          <span className="text-[10px] font-normal font-mono text-stone-400">ft</span>
                        </button>
                      </div>
                      <div className="h-3.5 w-full flex items-center justify-center">
                        <span className="text-[8px] text-stone-500 font-mono truncate px-0.5" title={speedInfo.reasons?.join('; ') || speedInfo.status}>
                          {speedInfo.reasons?.join('; ') || speedInfo.status || 'Normal'}
                        </span>
                      </div>
                    </div>

                    {/* 3.5e Attacks of Opportunity (AoO) Pool */}
                    <div className="bg-stone-950 p-2 rounded-xl border border-stone-800/90 flex flex-col justify-between items-center h-[76px] relative group hover:border-stone-700 transition">
                      <div className="h-4 w-full flex items-center justify-center relative px-1">
                        <span className="text-[9px] text-stone-400 font-sans uppercase font-bold tracking-wider truncate">AoO Pool</span>
                        <button
                          type="button"
                          onClick={() => setShow35eAoOModal(true)}
                          className="absolute right-0 top-0 text-stone-500 hover:text-red-400 transition p-0.5 cursor-pointer"
                          title="Open 3.5e Attack of Opportunity Tracker"
                        >
                          <Pencil className="w-2.5 h-2.5" />
                        </button>
                      </div>
                      <div className="h-7 w-full flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => setShow35eAoOModal(true)}
                          className="text-lg font-serif font-extrabold text-red-400 hover:text-red-300 transition leading-none cursor-pointer flex items-baseline gap-0.5"
                          title="Remaining AoOs this combat round. Click to manage."
                        >
                          <span>{aooInfo.currentAoO}</span>
                          <span className="text-[10px] font-mono text-stone-500">/{aooInfo.maxAoO}</span>
                        </button>
                      </div>
                      <div className="h-3.5 w-full flex items-center justify-center">
                        <span className="text-[8px] text-red-400/80 font-mono truncate px-0.5">
                          {aooInfo.threatReachFt}ft {aooInfo.hasCombatReflexes ? 'Reflex' : 'Threat'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3.5e Official AC Equation & Tri-Stat Breakdown */}
                  <div className="bg-stone-950 p-2.5 rounded-xl border border-amber-600/40 text-stone-200 shadow-md space-y-2">
                    {/* Header Bar */}
                    <div className="flex items-center justify-between border-b border-stone-800/80 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="bg-stone-900 border border-stone-700/80 px-2 py-0.5 rounded text-[10px] font-black tracking-wider text-amber-300 font-sans uppercase flex items-center gap-1">
                          <Shield className="w-3 h-3 text-amber-400" />
                          <span>AC</span>
                          <span className="text-stone-400 font-normal text-[8.5px]">ARMOR CLASS</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setShow35eAcModal(true)}
                        className="text-[9.5px] text-amber-400 hover:text-amber-300 font-mono bg-stone-900 px-2 py-0.5 rounded border border-amber-700/50 flex items-center gap-1 transition shadow-sm hover:bg-stone-800 cursor-pointer"
                        title="Customize 3.5e AC Modifiers (Natural Armor, Deflection, Size, Dodge, Misc)"
                      >
                        <Pencil className="w-2.5 h-2.5" />
                        <span>Edit Modifiers</span>
                      </button>
                    </div>

                    {/* Tri-Stat AC Overview: Total AC, Touch AC, Flat-Footed AC */}
                    {(() => {
                      const isTotalCover = character.activeCover === 'total';
                      return (
                        <>
                          <div className="grid grid-cols-3 gap-1.5 font-mono text-center">
                            {/* Total AC */}
                            <div className={`border rounded-lg p-1.5 flex flex-col items-center justify-center shadow-inner transition ${
                              isTotalCover
                                ? 'bg-cyan-950/40 border-cyan-500/70 shadow-cyan-950/40'
                                : 'bg-stone-900/90 border-amber-500/70'
                            }`}>
                              <span className={`text-[8px] font-sans uppercase font-bold tracking-wider flex items-center gap-0.5 ${
                                isTotalCover ? 'text-cyan-300' : 'text-amber-400'
                              }`}>
                                {isTotalCover && <ShieldAlert className="w-2.5 h-2.5 text-cyan-400" />}
                                Total AC
                              </span>
                              {isTotalCover ? (
                                <span className="text-sm font-serif font-black text-cyan-300 leading-none my-1 tracking-wider uppercase">
                                  BLOCKED
                                </span>
                              ) : (
                                <span className="text-2xl font-serif font-black text-amber-300 leading-none my-0.5">{ac35.totalAc}</span>
                              )}
                              <span className={`text-[7.5px] font-mono ${isTotalCover ? 'text-cyan-400/90 font-semibold' : 'text-stone-400'}`}>
                                {isTotalCover ? `Untargetable (${ac35.totalAc})` : 'Full Defense'}
                              </span>
                            </div>

                            {/* Touch AC */}
                            <div className={`border rounded-lg p-1.5 flex flex-col items-center justify-center transition ${
                              isTotalCover
                                ? 'bg-cyan-950/20 border-cyan-800/50'
                                : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                            }`}>
                              <span className={`text-[8px] font-sans uppercase font-bold tracking-wider ${
                                isTotalCover ? 'text-cyan-400/80' : 'text-stone-400'
                              }`}>Touch AC</span>
                              {isTotalCover ? (
                                <span className="text-sm font-serif font-extrabold text-cyan-300/80 leading-none my-1 tracking-wider uppercase">
                                  BLOCKED
                                </span>
                              ) : (
                                <span className="text-xl font-serif font-extrabold text-amber-200/90 leading-none my-0.5">{ac35.touchAc}</span>
                              )}
                              <span className="text-[7.5px] text-stone-500 font-mono truncate max-w-full" title={isTotalCover ? 'No Line of Effect' : 'Ignores Armor, Shield & Natural Armor'}>
                                {isTotalCover ? 'No Line of Effect' : 'No Armor/Nat'}
                              </span>
                            </div>

                            {/* Flat-Footed AC */}
                            <div className={`border rounded-lg p-1.5 flex flex-col items-center justify-center transition ${
                              isTotalCover
                                ? 'bg-cyan-950/20 border-cyan-800/50'
                                : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                            }`}>
                              <span className={`text-[8px] font-sans uppercase font-bold tracking-wider ${
                                isTotalCover ? 'text-cyan-400/80' : 'text-stone-400'
                              }`}>Flat-Footed</span>
                              {isTotalCover ? (
                                <span className="text-sm font-serif font-extrabold text-cyan-300/80 leading-none my-1 tracking-wider uppercase">
                                  BLOCKED
                                </span>
                              ) : (
                                <span className="text-xl font-serif font-extrabold text-amber-200/90 leading-none my-0.5">{ac35.flatFootedAc}</span>
                              )}
                              <span className="text-[7.5px] text-stone-500 font-mono truncate max-w-full" title={isTotalCover ? 'Cannot Be Targeted' : 'Ignores DEX bonus & Dodge'}>
                                {isTotalCover ? 'Cannot Target' : 'No Dex/Dodge'}
                              </span>
                            </div>
                          </div>

                          {/* Total Cover Banner Alert */}
                          {isTotalCover && (
                            <div className="bg-cyan-950/40 border border-cyan-700/60 rounded-lg p-2 flex items-center justify-between text-xs font-mono text-cyan-200 shadow-sm">
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />
                                <div className="text-left min-w-0">
                                  <div className="font-bold font-sans text-cyan-300 text-[10px] uppercase tracking-wider">
                                    Total Cover Active (PHB p. 150)
                                  </div>
                                  <div className="text-[8.5px] text-cyan-300/80 font-sans leading-snug">
                                    Obstruction blocks line of effect. Direct melee, ranged, and targeted attacks cannot target this creature. Base AC ({ac35.totalAc}) applies if cover is bypassed.
                                  </div>
                                </div>
                              </div>
                              <span className="text-[9px] font-bold bg-cyan-900/80 border border-cyan-500/60 px-1.5 py-0.5 rounded text-cyan-200 shrink-0 uppercase tracking-wider">
                                Untargetable
                              </span>
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {/* Modifier Equation Breakdown - Mathematical 8-Column Grid (No Overflow/Scrollbar) */}
                    <div className="bg-stone-900/50 border border-stone-800/80 rounded-lg p-1.5">
                      <div className="flex items-center justify-between text-[8px] text-stone-400 font-mono mb-1 px-0.5">
                        <span className="font-semibold uppercase tracking-wider text-stone-400">Modifier Breakdown</span>
                        <span className="text-stone-500">10 Base + Modifiers = {ac35.totalAc}</span>
                      </div>
                      <div className="grid grid-cols-8 gap-1 text-center font-mono">
                        {/* BASE 10 */}
                        <div className="flex flex-col items-center bg-stone-950/80 border border-stone-800/90 rounded py-1 px-0.5">
                          <span className="text-xs font-extrabold text-stone-200 leading-none">10</span>
                          <span className="text-[7px] text-stone-500 font-sans uppercase font-bold mt-0.5">BASE</span>
                        </div>

                        {/* ARMOR */}
                        <div
                          className={`flex flex-col items-center rounded py-1 px-0.5 border ${
                            ac35.armorBonus > 0 ? 'bg-sky-950/40 border-sky-800/60 text-sky-300' : 'bg-stone-950/80 border-stone-800/90 text-stone-400'
                          }`}
                          title={ac35.sources.armor.join(', ') || 'Armor Bonus'}
                        >
                          <span className="text-xs font-bold leading-none">{ac35.armorBonus}</span>
                          <span className="text-[7px] text-stone-400 font-sans uppercase font-bold mt-0.5">ARMOR</span>
                        </div>

                        {/* SHIELD */}
                        <div
                          className={`flex flex-col items-center rounded py-1 px-0.5 border ${
                            ac35.shieldBonus > 0 ? 'bg-indigo-950/40 border-indigo-800/60 text-indigo-300' : 'bg-stone-950/80 border-stone-800/90 text-stone-400'
                          }`}
                          title={ac35.sources.shield.join(', ') || 'Shield Bonus'}
                        >
                          <span className="text-xs font-bold leading-none">{ac35.shieldBonus}</span>
                          <span className="text-[7px] text-stone-400 font-sans uppercase font-bold mt-0.5">SHIELD</span>
                        </div>

                        {/* DEX */}
                        <div
                          className={`flex flex-col items-center rounded py-1 px-0.5 border ${
                            ac35.dexBonus !== 0 ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' : 'bg-stone-950/80 border-stone-800/90 text-stone-400'
                          }`}
                          title={ac35.sources.dex.join(', ') || 'Dexterity Modifier'}
                        >
                          <span className="text-xs font-bold leading-none">{ac35.dexBonus >= 0 ? `+${ac35.dexBonus}` : ac35.dexBonus}</span>
                          <span className="text-[7px] text-stone-400 font-sans uppercase font-bold mt-0.5">DEX</span>
                        </div>

                        {/* SIZE */}
                        <div
                          className={`flex flex-col items-center rounded py-1 px-0.5 border ${
                            ac35.sizeModifier !== 0 ? 'bg-yellow-950/40 border-yellow-800/60 text-yellow-300' : 'bg-stone-950/80 border-stone-800/90 text-stone-400'
                          }`}
                          title={ac35.sources.size.join(', ') || 'Size Modifier'}
                        >
                          <span className="text-xs font-bold leading-none">{ac35.sizeModifier >= 0 ? `+${ac35.sizeModifier}` : ac35.sizeModifier}</span>
                          <span className="text-[7px] text-stone-400 font-sans uppercase font-bold mt-0.5">SIZE</span>
                        </div>

                        {/* NATURAL */}
                        <div
                          className={`flex flex-col items-center rounded py-1 px-0.5 border ${
                            ac35.naturalArmorBonus > 0 ? 'bg-amber-950/40 border-amber-800/60 text-amber-300' : 'bg-stone-950/80 border-stone-800/90 text-stone-400'
                          }`}
                          title={ac35.sources.natural.join(', ') || 'Natural Armor'}
                        >
                          <span className="text-xs font-bold leading-none">{ac35.naturalArmorBonus}</span>
                          <span className="text-[7px] text-stone-400 font-sans uppercase font-bold mt-0.5">NAT</span>
                        </div>

                        {/* DEFLECTION */}
                        <div
                          className={`flex flex-col items-center rounded py-1 px-0.5 border ${
                            ac35.deflectionBonus > 0 ? 'bg-cyan-950/40 border-cyan-800/60 text-cyan-300' : 'bg-stone-950/80 border-stone-800/90 text-stone-400'
                          }`}
                          title={ac35.sources.deflection.join(', ') || 'Deflection Modifier'}
                        >
                          <span className="text-xs font-bold leading-none">{ac35.deflectionBonus}</span>
                          <span className="text-[7px] text-stone-400 font-sans uppercase font-bold mt-0.5">DEFL</span>
                        </div>

                        {/* MISC */}
                        <div
                          className={`flex flex-col items-center rounded py-1 px-0.5 border ${
                            ac35.miscBonus > 0 ? 'bg-purple-950/40 border-purple-800/60 text-purple-300' : 'bg-stone-950/80 border-stone-800/90 text-stone-400'
                          }`}
                          title={ac35.sources.misc.join(', ') || 'Misc Modifier (Dodge, Insight, etc.)'}
                        >
                          <span className="text-xs font-bold leading-none">{ac35.miscBonus}</span>
                          <span className="text-[7px] text-stone-400 font-sans uppercase font-bold mt-0.5">MISC</span>
                        </div>
                      </div>
                    </div>

                    {/* 3.5e Armor Check Penalty (ACP) Breakdown */}
                    <div className="bg-stone-900/70 p-2 rounded-lg border border-stone-800 flex items-center justify-between px-2.5 text-xs font-mono">
                      <div className="text-left min-w-0 pr-2">
                        <div className="text-[8.5px] text-stone-400 font-sans uppercase font-bold">Armor Check Penalty (ACP)</div>
                        <div className="text-[7.5px] text-stone-500 truncate" title={acp35.breakdown.join('; ')}>
                          {acp35.breakdown.length > 0 ? acp35.breakdown.join(' • ') : 'No check penalty active'}
                        </div>
                      </div>
                      <div className={`font-mono font-bold text-xs px-2 py-0.5 rounded border shrink-0 ${
                        acp35.totalAcp < 0 ? 'bg-amber-950/50 border-amber-800/60 text-amber-400' : 'bg-stone-950 border-stone-800 text-stone-400'
                      }`}>
                        {acp35.totalAcp} ACP
                      </div>
                    </div>
                  </div>

                  {/* 3.5e Tactical Cover & Line of Sight Selector */}
                  <div className="bg-stone-950 px-3 py-2 rounded-xl border border-stone-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1">
                        <Shield className="w-3 h-3 text-amber-400" />
                        <span>Tactical Cover (PHB p. 150)</span>
                      </span>
                      <div>
                        {character.activeCover === 'standard' && (
                          <span className="text-[9px] font-mono text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-700/60">+4 AC • +2 Ref</span>
                        )}
                        {character.activeCover === 'improved' && (
                          <span className="text-[9px] font-mono text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-700/60">+8 AC • +4 Ref • Evasion</span>
                        )}
                        {character.activeCover === 'total' && (
                          <span className="text-[9px] font-mono font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/80 flex items-center gap-1 shadow-sm">
                            <ShieldAlert className="w-3 h-3 text-cyan-400" /> Untargetable (Attacks Blocked)
                          </span>
                        )}
                        {(!character.activeCover || character.activeCover === 'none') && (
                          <span className="text-[9px] font-mono text-stone-500 bg-stone-900 px-1.5 py-0.5 rounded border border-stone-800">None</span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: 'none', label: 'No Cover', sub: 'Normal', activeClass: 'bg-stone-800 text-stone-200 border-stone-600' },
                        { id: 'standard', label: 'Standard', sub: '+4 AC • +2 Ref', activeClass: 'bg-amber-950 text-amber-200 border-amber-500 shadow-sm' },
                        { id: 'improved', label: 'Improved', sub: '+8 AC • +4 Ref', activeClass: 'bg-amber-950 text-amber-200 border-amber-500 shadow-sm' },
                        { id: 'total', label: 'Total Cover', sub: 'Untargetable', activeClass: 'bg-cyan-950 text-cyan-200 border-cyan-400 shadow-sm shadow-cyan-950' },
                      ].map((cov) => {
                        const isActive = (character.activeCover || 'none') === cov.id;
                        return (
                          <button
                            key={cov.id}
                            type="button"
                            onClick={() => onUpdateCharacter({ ...character, activeCover: cov.id as any })}
                            className={`h-9 px-1 rounded-lg text-center cursor-pointer flex flex-col items-center justify-center transition border ${
                              isActive
                                ? cov.activeClass
                                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border-stone-800'
                            }`}
                          >
                            <span className="text-[10px] font-bold font-sans leading-tight">{cov.label}</span>
                            <span className={`text-[7.5px] font-mono leading-tight mt-0.5 ${isActive ? 'opacity-90 font-semibold' : 'text-stone-500'}`}>
                              {cov.sub}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  {/* AC */}
                  <div className={`bg-stone-950 p-2.5 rounded-xl border flex flex-col items-center justify-center relative group ${
                    character.activeCover === 'total' ? 'border-cyan-500/70 bg-cyan-950/20 shadow-sm' : 'border-amber-500/30'
                  }`}>
                    <span className="text-[10px] text-stone-400 font-sans uppercase font-bold">
                      {character.activeCover === 'total' ? 'Cover AC (PHB p. 196)' : t('defenses.armorClass', 'Armor Class')}
                    </span>
                    {character.activeCover === 'total' ? (
                      <div className="flex flex-col items-center my-0.5">
                        <span className="text-base font-serif font-black text-cyan-300 leading-none my-0.5 flex items-center gap-1 uppercase">
                          <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" /> BLOCKED
                        </span>
                        <span className="text-[8px] text-cyan-400/90 font-mono">Untargetable ({character.armorClass})</span>
                      </div>
                    ) : (
                      <span className="text-2xl font-serif font-extrabold text-amber-300 my-0.5">{character.armorClass}</span>
                    )}
                    <span className="text-[9px] text-stone-500 truncate max-w-full">
                      {character.activeCover === 'total'
                        ? 'Immune to direct attacks & targeted spells'
                        : getArmorClassBreakdown(character).explanation || `Base ${getArmorClassBreakdown(character).baseAc}`}
                    </span>
                  </div>

                  {/* Initiative */}
                  {(() => {
                    const initBonus = calculateInitiativeBonus(character);
                    return (
                      <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 flex flex-col items-center justify-center">
                        <span className="text-[10px] text-stone-400 font-sans uppercase font-bold">{t('stats.initiative', 'Initiative')}</span>
                        <button
                          onClick={() => onRoll('Initiative Roll', 20, 1, initBonus, 'normal')}
                          className="text-2xl font-serif font-extrabold text-emerald-300 hover:text-emerald-200 transition my-0.5"
                          title={`Roll Initiative (${formatModifier(initBonus)})`}
                        >
                          {formatModifier(initBonus)}
                        </button>
                        <span className="text-[9px] text-stone-500">Total Init Mod</span>
                      </div>
                    );
                  })()}

                  {/* Speed */}
                  <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 flex flex-col items-center justify-center relative group hover:border-sky-500/50 transition">
                    <div className="w-full flex items-center justify-center relative">
                      <span className="text-[10px] text-stone-400 font-sans uppercase font-bold">{t('stats.speed', 'Speed')}</span>
                      <button
                        type="button"
                        id="btn-open-speed-modal-5e"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowSpeedModal(true);
                        }}
                        className="absolute right-0 top-0 text-stone-500 hover:text-sky-400 transition p-0.5 cursor-pointer"
                        title="Edit Movement Speeds & Tactical Mobility"
                      >
                        <Pencil className="w-2.5 h-2.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSpeedModal(true)}
                      className="text-xl font-serif font-extrabold text-sky-300 hover:text-sky-200 my-0.5 flex items-center gap-1 cursor-pointer transition"
                      title="Click to edit movement speeds"
                    >
                      <Footprints className="w-4 h-4 text-sky-400 shrink-0" />
                      {speedInfo.effectiveSpeed} <span className="text-xs font-normal">ft</span>
                    </button>
                    <span className="text-[9px] text-stone-500 truncate max-w-full" title={speedInfo.reasons?.join('; ') || speedInfo.status}>
                      {speedInfo.reasons?.join('; ') || speedInfo.status || 'Base speed'}
                    </span>
                  </div>

                  {/* 5e Tactical Cover & Line of Sight Selector (PHB p. 196) */}
                  <div className="bg-stone-950 px-3 py-2 rounded-xl border border-stone-800 space-y-1.5 col-span-3">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1">
                        <Shield className="w-3 h-3 text-amber-400" />
                        <span>Tactical Cover (5e PHB p. 196)</span>
                      </span>
                      <div>
                        {character.activeCover === 'standard' && (
                          <span className="text-[9px] font-mono text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-700/60">+2 AC & Dex Saves</span>
                        )}
                        {character.activeCover === 'improved' && (
                          <span className="text-[9px] font-mono text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-700/60">+5 AC & Dex Saves</span>
                        )}
                        {character.activeCover === 'total' && (
                          <span className="text-[9px] font-mono font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/80 flex items-center gap-1 shadow-sm">
                            <ShieldAlert className="w-3 h-3 text-cyan-400" /> Untargetable (Attacks Blocked)
                          </span>
                        )}
                        {(!character.activeCover || character.activeCover === 'none') && (
                          <span className="text-[9px] font-mono text-stone-500 bg-stone-900 px-1.5 py-0.5 rounded border border-stone-800">None</span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: 'none', label: 'No Cover', sub: 'Normal', activeClass: 'bg-stone-800 text-stone-200 border-stone-600' },
                        { id: 'standard', label: 'Half Cover', sub: '+2 AC & Dex', activeClass: 'bg-amber-950 text-amber-200 border-amber-500 shadow-sm' },
                        { id: 'improved', label: '3/4 Cover', sub: '+5 AC & Dex', activeClass: 'bg-amber-950 text-amber-200 border-amber-500 shadow-sm' },
                        { id: 'total', label: 'Total Cover', sub: 'Untargetable', activeClass: 'bg-cyan-950 text-cyan-200 border-cyan-400 shadow-sm shadow-cyan-950' },
                      ].map((cov) => {
                        const isActive = (character.activeCover || 'none') === cov.id;
                        return (
                          <button
                            key={cov.id}
                            type="button"
                            onClick={() => onUpdateCharacter({ ...character, activeCover: cov.id as any })}
                            className={`h-9 px-1 rounded-lg text-center cursor-pointer flex flex-col items-center justify-center transition border ${
                              isActive
                                ? cov.activeClass
                                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border-stone-800'
                            }`}
                          >
                            <span className="text-[10px] font-bold font-sans leading-tight">{cov.label}</span>
                            <span className={`text-[7.5px] font-mono leading-tight mt-0.5 ${isActive ? 'opacity-90 font-semibold' : 'text-stone-500'}`}>
                              {cov.sub}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {character.activeCover === 'total' && (
                      <div className="bg-cyan-950/30 border border-cyan-700/50 rounded-lg p-1.5 flex items-center gap-2 text-xs font-mono text-cyan-200">
                        <ShieldAlert className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="text-[8.5px] text-cyan-300/90 font-sans">
                          <strong>Total Cover Active:</strong> Obstruction completely conceals character. Direct melee, ranged, and targeted attacks cannot target this creature (PHB p. 196).
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 5e Passive Senses & Defenses */}
                  {(() => {
                    const effWis = getEffectiveAbilities(character).WIS?.score ?? 10;
                    const effectiveWisMod = getAbilityModifier(effWis);
                    const profBonus = getProficiencyBonus(character.level || 1);

                    const perceptionSkill = character.skills?.find((s) => s.name.toLowerCase() === 'perception');
                    const perceptionBonus = effectiveWisMod + (perceptionSkill?.expertise ? profBonus * 2 : perceptionSkill?.proficient ? profBonus : 0);
                    const passivePerception = 10 + perceptionBonus;

                    const insightSkill = character.skills?.find((s) => s.name.toLowerCase() === 'insight');
                    const insightBonus = effectiveWisMod + (insightSkill?.expertise ? profBonus * 2 : insightSkill?.proficient ? profBonus : 0);
                    const passiveInsight = 10 + insightBonus;

                    // Resolve Darkvision and special senses accurately:
                    const raceLower = (character.race || '').toLowerCase();
                    const sensesLower = (character.senses || '').toLowerCase();

                    let darkvisionFt = 'None';

                    // 1. Check explicit character.senses field
                    if (sensesLower.includes('darkvision')) {
                      const match = sensesLower.match(/darkvision\s*(\d+)\s*ft/);
                      darkvisionFt = match ? `${match[1]} ft.` : '60 ft.';
                    } else if (character.hybridHeritage?.enabled) {
                      // Hybrid / Half-Breed system
                      if (character.hybridHeritage.hasDarkvision === false) {
                        darkvisionFt = sensesLower.includes('low-light') ? 'Low-Light' : 'None';
                      } else if (character.hybridHeritage.hasDarkvision) {
                        darkvisionFt = '60 ft.';
                      }
                    } else {
                      // Standard race fallback
                      if (raceLower.includes('drow') || raceLower.includes('svirfneblin') || raceLower.includes('deep gnome')) {
                        darkvisionFt = '120 ft.';
                      } else if (['elf', 'dwarf', 'gnome', 'tiefling', 'orc', 'half-orc', 'half-elf', 'aasimar', 'tabaxi'].some((r) => raceLower.includes(r))) {
                        darkvisionFt = '60 ft.';
                      }
                    }

                    if (darkvisionFt === 'None' && sensesLower.includes('low-light')) {
                      darkvisionFt = 'Low-Light';
                    }

                    return (
                      <div className="col-span-3 grid grid-cols-3 gap-2 text-center font-mono">
                        <div className="bg-stone-950 p-2 rounded-xl border border-stone-800 flex flex-col items-center justify-center">
                          <div className="text-[9px] text-stone-400 font-sans uppercase font-bold flex items-center justify-center gap-1">
                            <Eye className="w-2.5 h-2.5 text-amber-400" /> Passive Percep.
                          </div>
                          <div className="text-sm font-bold text-amber-300 mt-0.5">{passivePerception}</div>
                        </div>

                        <div className="bg-stone-950 p-2 rounded-xl border border-stone-800 flex flex-col items-center justify-center">
                          <div className="text-[9px] text-stone-400 font-sans uppercase font-bold flex items-center justify-center gap-1">
                            <Compass className="w-2.5 h-2.5 text-sky-400" /> Passive Insight
                          </div>
                          <div className="text-sm font-bold text-sky-300 mt-0.5">{passiveInsight}</div>
                        </div>

                        <div className="bg-stone-950 p-2 rounded-xl border border-stone-800 flex flex-col items-center justify-center">
                          <div className="text-[9px] text-stone-400 font-sans uppercase font-bold flex items-center justify-center gap-1">
                            <Moon className="w-2.5 h-2.5 text-indigo-400" /> Senses / Darkvision
                          </div>
                          <div className="text-xs font-bold text-indigo-300 mt-0.5">{darkvisionFt}</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Damage Mitigation: Resistances, Immunities & Damage Reduction (DR) / Spell Resistance (SR) */}
              <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
                {/* Resistances (50% damage) */}
                <div className="bg-stone-950 p-2 rounded-xl border border-amber-900/30 hover:border-amber-700/50 transition flex flex-col justify-between items-center min-h-[66px]">
                  <div className="h-4 w-full flex items-center justify-center">
                    <span className="text-[9px] font-sans uppercase font-bold text-amber-400/90 tracking-wider">
                      Resist (½)
                    </span>
                  </div>
                  <div className="flex-1 w-full flex flex-wrap items-center justify-center gap-1 max-h-[54px] overflow-y-auto no-scrollbar py-0.5">
                    {resistances.length > 0 ? (
                      resistances.map((r, idx) => (
                        <span
                          key={`${r.type}-${idx}`}
                          className="bg-amber-950/80 text-amber-200 border border-amber-700/50 px-1.5 py-0.5 rounded text-[10px] font-mono leading-none truncate max-w-full"
                          title={r.source ? `${r.type} (Source: ${r.source})` : r.type}
                        >
                          {r.type}
                        </span>
                      ))
                    ) : (
                      <span className="text-stone-600 font-mono text-[10px]">None</span>
                    )}
                  </div>
                </div>

                {/* Immunities (0 damage) */}
                <div className="bg-stone-950 p-2 rounded-xl border border-emerald-900/30 hover:border-emerald-700/50 transition flex flex-col justify-between items-center min-h-[66px]">
                  <div className="h-4 w-full flex items-center justify-center">
                    <span className="text-[9px] font-sans uppercase font-bold text-emerald-400/90 tracking-wider">
                      Immune (0)
                    </span>
                  </div>
                  <div className="flex-1 w-full flex flex-wrap items-center justify-center gap-1 max-h-[54px] overflow-y-auto no-scrollbar py-0.5">
                    {immunities.length > 0 ? (
                      immunities.map((i, idx) => (
                        <span
                          key={`${i.type}-${idx}`}
                          className="bg-emerald-950/80 text-emerald-200 border border-emerald-700/50 px-1.5 py-0.5 rounded text-[10px] font-mono leading-none truncate max-w-full"
                          title={i.source ? `${i.type} (Source: ${i.source})` : i.type}
                        >
                          {i.type}
                        </span>
                      ))
                    ) : (
                      <span className="text-stone-600 font-mono text-[10px]">None</span>
                    )}
                  </div>
                </div>

                {/* Damage Reduction (DR) & Spell Resistance (SR) */}
                {character.edition === '3.5e' ? (
                  <button
                    type="button"
                    onClick={() => setShow35eDrModal(true)}
                    className="bg-stone-950 p-2 rounded-xl border border-sky-900/30 hover:border-sky-500/60 transition flex flex-col justify-between items-center min-h-[66px] group cursor-pointer text-center"
                    title={`Click to configure 3.5e DR, Energy Resistances, Spell Resistance, and test Damage Mitigation${character.spellResist ? ` | Spell Resistance: SR ${character.spellResist}` : ''}`}
                  >
                    <div className="h-4 w-full flex items-center justify-center relative px-1">
                      <span className="text-[9px] font-sans uppercase font-bold text-sky-400/90 tracking-wider">
                        DR & SR
                      </span>
                      <Pencil className="w-2.5 h-2.5 text-stone-500 group-hover:text-sky-300 transition absolute right-0 top-0 p-0.5" />
                    </div>
                    <div className="flex-1 w-full flex flex-col items-center justify-center py-0.5">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <span className="text-xs font-serif font-extrabold text-sky-300">
                          DR {character.damageReductionValue || 0}/{character.damageReductionBypass || '-'}
                        </span>
                        {character.spellResist ? (
                          <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-700/60 px-1.5 py-0.5 rounded shadow-xs">
                            SR {character.spellResist}
                          </span>
                        ) : null}
                      </div>
                      {character.energyResistances && Object.entries(character.energyResistances).some(([_, v]) => (v || 0) > 0) && (
                        <div className="flex items-center justify-center gap-1 flex-wrap mt-0.5 max-w-full overflow-hidden">
                          {Object.entries(character.energyResistances)
                            .filter(([_, v]) => (v || 0) > 0)
                            .map(([type, val]) => (
                              <span key={type} className="text-[8px] font-mono uppercase px-1 py-0.2 rounded bg-amber-950/40 border border-amber-800/40 text-amber-200">
                                {type.slice(0, 4)} {val}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                  </button>
                ) : (
                  <div className="bg-stone-950 p-2 rounded-xl border border-sky-900/30 flex flex-col justify-between items-center min-h-[66px]">
                    <div className="h-4 w-full flex items-center justify-center">
                      <span className="text-[9px] font-sans uppercase font-bold text-sky-400/90 tracking-wider">
                        {character.spellResist ? 'DR & SR' : 'Damage Red.'}
                      </span>
                    </div>
                    <div className="flex-1 w-full flex items-center justify-center gap-1.5 flex-wrap py-0.5">
                      <span className="text-sm font-serif font-extrabold text-sky-300">
                        {drInfo.totalDR !== 0 ? Math.abs(drInfo.totalDR) : '0'} <span className="text-[9px] text-stone-500 font-sans">DR</span>
                      </span>
                      {character.spellResist ? (
                        <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-700/60 px-1.5 py-0.5 rounded">
                          SR {character.spellResist}
                        </span>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Right 4 cols: Death Saving Throws / Transformation State */}
          {showDeathSaves && (
            <div className={`${topColClass} bg-stone-900 border border-stone-800 rounded-2xl p-3.5 flex flex-col shadow-xl`}>
              <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-2">
                <span className="font-serif font-bold text-amber-200 text-sm flex items-center gap-1.5">
                  <Skull className="w-4 h-4 text-rose-400" />
                  {character.edition === '3.5e' ? 'Combat Status & Tactical Suite' : 'Death Saves & Form'}
                </span>
                {character.activeTransformation && (
                  <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-500/50 px-2 py-0.5 rounded-full font-mono font-bold">
                    Transformed
                  </span>
                )}
              </div>

              {/* 3.5e Dying, Stabilization & Tactical Engines Suite VS 5e Death Saves Panel */}
              {character.edition === '3.5e' ? (
                <div className="flex-1 flex flex-col justify-center gap-3 my-auto">
                  {/* Status & Stabilization Panel */}
                  <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 space-y-2">
                    {/* Status Banner */}
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-stone-400">Vitality Status:</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          (character.hpCurrent ?? 0) <= -10
                            ? 'bg-red-950 text-red-300 border border-red-700'
                            : (character.hpCurrent ?? 0) < 0
                              ? character.isStabilized35e
                                ? 'bg-amber-950 text-amber-300 border border-amber-600'
                                : 'bg-red-950/80 text-rose-300 border border-rose-600 animate-pulse'
                              : (character.hpCurrent ?? 0) === 0
                                ? 'bg-yellow-950 text-yellow-300 border border-yellow-600'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                        }`}
                      >
                        {(character.hpCurrent ?? 0) <= -10
                          ? 'Dead (≤ -10 HP)'
                          : (character.hpCurrent ?? 0) < 0
                            ? character.isStabilized35e
                              ? 'Stable (Unconscious)'
                              : 'Dying (Unconscious)'
                            : (character.hpCurrent ?? 0) === 0
                              ? 'Disabled (0 HP)'
                              : 'Conscious & Active'}
                      </span>
                    </div>

                    {/* Dying & Stabilization Controls (Only visible when HP <= 0) */}
                    {(character.hpCurrent ?? 0) <= 0 ? (
                      <div className="space-y-1.5 pt-1.5 border-t border-stone-800/60">
                        <div className="text-[10px] text-stone-400 leading-tight">
                          {(character.hpCurrent ?? 0) <= -10 && 'Character has reached -10 HP and is deceased under D&D 3.5e RAW.'}
                          {(character.hpCurrent ?? 0) < 0 && (character.hpCurrent ?? 0) > -10 && (
                            character.isStabilized35e
                              ? 'Character is stable at negative HP. Rolls 10% each hour to regain consciousness.'
                              : 'Character is dying. At end of each round, roll 10% (d100 ≤ 10) to stabilize, or lose 1 HP.'
                          )}
                          {(character.hpCurrent ?? 0) === 0 && 'Disabled: Can take only 1 move or standard action per turn. Strenuous activity deals 1 damage.'}
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={handleRoll35eStabilization}
                            disabled={(character.hpCurrent ?? 0) >= 0 || (character.hpCurrent ?? 0) <= -10}
                            className="py-1.5 px-2 bg-stone-800 hover:bg-rose-950 disabled:opacity-40 disabled:hover:bg-stone-800 border border-stone-700 hover:border-rose-600 text-stone-200 hover:text-rose-200 text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1 shadow cursor-pointer"
                            title="Roll d100: 1-10% stabilizes; 11-100% loses 1 HP"
                          >
                            <Dices className="w-3 h-3 text-rose-400" /> Roll 10% Save
                          </button>

                          <button
                            type="button"
                            onClick={handleRoll35eHealCheck}
                            disabled={(character.hpCurrent ?? 0) >= 0 || (character.hpCurrent ?? 0) <= -10}
                            className="py-1.5 px-2 bg-stone-800 hover:bg-emerald-950 disabled:opacity-40 disabled:hover:bg-stone-800 border border-stone-700 hover:border-emerald-600 text-stone-200 hover:text-emerald-200 text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1 shadow cursor-pointer"
                            title="First Aid: Heal check DC 15 to stabilize a dying character"
                          >
                            <Heart className="w-3 h-3 text-emerald-400" /> First Aid (DC 15)
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleToggle35eStabilized}
                          className={`w-full py-1 rounded-lg border text-[10px] font-mono font-bold transition cursor-pointer ${
                            character.isStabilized35e
                              ? 'bg-amber-950/80 text-amber-200 border-amber-600'
                              : 'bg-stone-900 hover:bg-stone-800 text-stone-400 border-stone-700'
                          }`}
                        >
                          {character.isStabilized35e ? '✓ Status: Stabilized (Click to toggle)' : 'Mark as Stabilized'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1 border-t border-stone-800/60">
                        <span>Normal round action economy active</span>
                        <span className="text-emerald-400 font-mono font-bold">Standard Turn RAW</span>
                      </div>
                    )}
                  </div>

                  {/* 3.5e Senses & Vision Display (Integrated into Column 3 Status & Awareness) */}
                  <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800/90 flex items-center justify-between text-xs font-mono px-3 shadow-sm">
                    <div className="flex items-center gap-1.5 text-stone-400 font-sans text-[10px] uppercase font-bold">
                      <Moon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Senses & Vision</span>
                    </div>
                    <span className="text-xs font-bold text-indigo-300">
                      {character.senses || 'Normal Vision'}
                    </span>
                  </div>

                  {/* 3.5e Tactical Engines & Advanced Mechanics Suite Grid */}
                  <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 space-y-2">
                    <div 
                      onClick={() => setIsTacticalPanelExpanded(!isTacticalPanelExpanded)}
                      className="text-[10px] font-bold text-stone-300 uppercase tracking-wider px-0.5 flex items-center justify-between cursor-pointer select-none hover:text-amber-200 transition"
                      title={isTacticalPanelExpanded ? 'Click to collapse Tactical Engines' : 'Click to expand Tactical Engines'}
                    >
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        <span>Tactical Engines & Mechanics</span>
                        <span className="text-[9px] bg-stone-900 border border-stone-800 text-stone-400 px-1.5 py-0.2 rounded font-mono">
                          {8 + (canShapeshift ? 1 : 0)} tools
                        </span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-amber-500 font-mono font-bold">3.5e RAW</span>
                        <button
                          type="button"
                          className="text-stone-400 hover:text-stone-200"
                        >
                          {isTacticalPanelExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {isTacticalPanelExpanded && (
                      <div className="grid grid-cols-2 gap-1.5 font-mono animate-in fade-in duration-150">
                      {/* Combat Maneuvers */}
                      <button
                        type="button"
                        onClick={() => setShow35eManeuversModal(true)}
                        className="p-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-600/50 rounded-lg text-left transition flex flex-col gap-0.5 shadow-sm cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1 group-hover:text-amber-200">
                            <Swords className="w-3 h-3 text-amber-400" /> Maneuvers
                          </span>
                          <span className="text-[8px] text-stone-500">6 rules</span>
                        </div>
                        <span className="text-[8px] text-stone-400 truncate">Trip • Disarm • Grapple</span>
                      </button>

                      {/* AoO & Threat Reach */}
                      <button
                        type="button"
                        onClick={() => setShow35eAoOModal(true)}
                        className="p-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-red-600/50 rounded-lg text-left transition flex flex-col gap-0.5 shadow-sm cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-red-300 flex items-center gap-1 group-hover:text-red-200">
                            <Zap className="w-3 h-3 text-red-400" /> AoO Pool
                          </span>
                          <span className="text-[9px] text-red-400 font-bold">{aooInfo.currentAoO}/{aooInfo.maxAoO}</span>
                        </div>
                        <span className="text-[8px] text-stone-400 truncate">{aooInfo.threatReachFt}ft {aooInfo.hasCombatReflexes ? 'Reflexes' : 'Threat'}</span>
                      </button>

                      {/* Negative Levels / Energy Drain */}
                      <button
                        type="button"
                        onClick={() => setShow35eNegativeLevelsModal(true)}
                        className={`p-1.5 rounded-lg text-left transition flex flex-col gap-0.5 shadow-sm cursor-pointer group border ${
                          (character.negativeLevels || 0) > 0
                            ? 'bg-red-950 hover:bg-red-900 text-red-200 border-red-500 animate-pulse'
                            : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 hover:border-red-800/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold flex items-center gap-1">
                            <Skull className="w-3 h-3 text-red-400" /> Energy Drain
                          </span>
                          {(character.negativeLevels || 0) > 0 && (
                            <span className="text-[9px] text-red-300 font-bold">-{character.negativeLevels}</span>
                          )}
                        </div>
                        <span className="text-[8px] text-stone-400 truncate">
                          {(character.negativeLevels || 0) > 0 ? `Active: -${character.negativeLevels} penalty` : 'Negative Levels'}
                        </span>
                      </button>

                      {/* Concentration Check */}
                      <button
                        type="button"
                        onClick={() => setShow35eConcentrationModal(true)}
                        className="p-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-sky-600/50 rounded-lg text-left transition flex flex-col gap-0.5 shadow-sm cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-sky-300 flex items-center gap-1 group-hover:text-sky-200">
                            <Zap className="w-3 h-3 text-sky-400" /> Concentration
                          </span>
                          <span className="text-[8px] text-stone-500">DC calc</span>
                        </div>
                        <span className="text-[8px] text-stone-400 truncate">Defensive casting</span>
                      </button>

                      {/* Tumble & Acrobatics */}
                      <button
                        type="button"
                        onClick={() => setShow35eTumbleModal(true)}
                        className="p-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-600/50 rounded-lg text-left transition flex flex-col gap-0.5 shadow-sm cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1 group-hover:text-amber-200">
                            <Footprints className="w-3 h-3 text-amber-400" /> Tumble
                          </span>
                          <span className="text-[8px] text-stone-500">DC 15/25</span>
                        </div>
                        <span className="text-[8px] text-stone-400 truncate">Avoid AoO movement</span>
                      </button>

                      {/* Mounted Combat */}
                      <button
                        type="button"
                        onClick={() => setShow35eMountedModal(true)}
                        className={`p-1.5 rounded-lg text-left transition flex flex-col gap-0.5 shadow-sm cursor-pointer group border ${
                          character.isMounted
                            ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-600'
                            : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 hover:border-emerald-700/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold flex items-center gap-1">
                            <Shield className="w-3 h-3 text-amber-400" /> Mount / Ride
                          </span>
                          {character.isMounted && <span className="text-[8px] text-emerald-400 font-bold">Active</span>}
                        </div>
                        <span className="text-[8px] text-stone-400 truncate">
                          {character.isMounted ? `Steed: ${character.mountInfo?.speed || '60ft'}` : 'Ride checks & cover'}
                        </span>
                      </button>

                      {/* Wild Shape / Alternate Form (Only for characters with Wild Shape / Shapeshift ability) */}
                      {canShapeshift && (
                        <button
                          type="button"
                          onClick={() => setShow35eWildShapeModal(true)}
                          className={`p-1.5 rounded-lg text-left transition flex flex-col gap-0.5 shadow-sm cursor-pointer group border ${
                            character.wildShapeActive
                              ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-500'
                              : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 hover:border-emerald-700/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold flex items-center gap-1">
                              <PawPrint className="w-3 h-3 text-emerald-400" /> Wild Shape
                            </span>
                            {character.wildShapeActive && <span className="text-[8px] text-emerald-300 font-bold">Active</span>}
                          </div>
                          <span className="text-[8px] text-stone-400 truncate">
                            {character.wildShapeActive ? character.wildShapeForm?.name || 'Wild Form' : 'Alternate forms'}
                          </span>
                        </button>
                      )}

                      {/* Environmental Hazards */}
                      <button
                        type="button"
                        onClick={() => setShow35eEnvironmentalModal(true)}
                        className="p-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-600/50 rounded-lg text-left transition flex flex-col gap-0.5 shadow-sm cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-stone-300 flex items-center gap-1 group-hover:text-stone-200">
                            <Compass className="w-3 h-3 text-amber-400" /> Environment
                          </span>
                          <span className="text-[8px] text-stone-500">Hazards</span>
                        </div>
                        <span className="text-[8px] text-stone-400 truncate">Cold • Heat • Air</span>
                      </button>

                      {/* Ability Damage / Poisons */}
                      <button
                        type="button"
                        onClick={() => setShow35eAbilityDamageModal(true)}
                        className={`p-1.5 rounded-lg text-left transition flex flex-col gap-0.5 shadow-sm cursor-pointer group col-span-2 border ${
                          abilityDamageSummary.totalDamage + abilityDamageSummary.totalDrain > 0 ||
                          (character.activePoisonsDiseases && character.activePoisonsDiseases.length > 0)
                            ? 'bg-red-950/90 hover:bg-red-900 text-red-300 border-red-600/70 animate-pulse'
                            : 'bg-stone-900 hover:bg-stone-800 text-stone-400 border border-stone-800 hover:border-emerald-700/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold flex items-center gap-1 text-emerald-300">
                            <Skull className="w-3 h-3 text-emerald-400" /> Ability Damage & Drain
                          </span>
                          {abilityDamageSummary.totalDamage + abilityDamageSummary.totalDrain > 0 && (
                            <span className="text-[9px] text-red-300 font-bold">
                              –{abilityDamageSummary.totalDamage + abilityDamageSummary.totalDrain} Total
                            </span>
                          )}
                        </div>
                        <span className="text-[8px] text-stone-400 truncate">
                          {abilityDamageSummary.totalDamage + abilityDamageSummary.totalDrain > 0
                            ? `Active: ${abilityDamageSummary.totalDamage} dmg, ${abilityDamageSummary.totalDrain} drain`
                            : 'Poisons, diseases, ability penalties'}
                        </span>
                      </button>
                    </div>
                    )}
                  </div>
                </div>
              ) : (
                /* 5e Death Saves & Exhaustion Control Panel */
                <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 space-y-2">
                  {/* Combat Vitality Status Banner */}
                  {(() => {
                    const hp = character.hpCurrent ?? effectiveMaxHp;
                    const isDead = character.deathSavesFailures >= 3;
                    const isStable = hp === 0 && (character.deathSavesSuccesses >= 3 || character.isStabilized35e);
                    const isDying = hp <= 0 && !isDead && !isStable;

                    if (isDead) {
                      return (
                        <div className="bg-rose-950/80 border border-rose-600/70 p-1 rounded-lg text-center font-mono text-[10px] text-rose-200 font-bold flex items-center justify-center gap-1">
                          <Skull className="w-3 h-3 text-rose-400" />
                          <span>Status: Dead (3 Death Save Failures)</span>
                        </div>
                      );
                    }
                    if (isDying) {
                      return (
                        <div className="bg-rose-950/40 border border-rose-600/50 p-1 rounded-lg text-center font-mono text-[10px] text-rose-300 font-bold animate-pulse flex items-center justify-center gap-1">
                          <Activity className="w-3 h-3 text-rose-400" />
                          <span>Status: Dying (Unconscious) • Roll Saves</span>
                        </div>
                      );
                    }
                    if (isStable) {
                      return (
                        <div className="bg-amber-950/50 border border-amber-600/60 p-1 rounded-lg text-center font-mono text-[10px] text-amber-300 font-bold flex items-center justify-center gap-1">
                          <Shield className="w-3 h-3 text-amber-400" />
                          <span>Status: Stable (Unconscious at 0 HP)</span>
                        </div>
                      );
                    }
                    return (
                      <div className="bg-emerald-950/40 border border-emerald-700/50 p-1 rounded-lg text-center font-mono text-[10px] text-emerald-300 font-bold flex items-center justify-center gap-1">
                        <Heart className="w-3 h-3 text-emerald-400" />
                        <span>Status: Conscious & Active</span>
                      </div>
                    );
                  })()}

                  {/* Death Saving Throws Successes & Failures */}
                  <div className="space-y-2 px-1 pt-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Successes:
                      </span>
                      <div className="flex items-center gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <button
                            key={'succ-' + i}
                            onClick={() => handleToggleDeathSuccess(i)}
                            className="p-0.5 text-stone-600 hover:text-emerald-400 transition cursor-pointer"
                            title={`Toggle Success ${i + 1}`}
                          >
                            {character.deathSavesSuccesses > i ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-950" />
                            ) : (
                              <XCircle className="w-4 h-4 text-stone-700" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-rose-400 font-bold text-[11px] flex items-center gap-1">
                        <Skull className="w-3.5 h-3.5" /> Failures:
                      </span>
                      <div className="flex items-center gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <button
                            key={'fail-' + i}
                            onClick={() => handleToggleDeathFailure(i)}
                            className="p-0.5 text-stone-600 hover:text-rose-400 transition cursor-pointer"
                            title={`Toggle Failure ${i + 1}`}
                          >
                            {character.deathSavesFailures > i ? (
                              <XCircle className="w-4 h-4 text-rose-500 fill-rose-950" />
                            ) : (
                              <XCircle className="w-4 h-4 text-stone-700" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRollDeathSave}
                      className="w-full py-1.5 bg-stone-900 hover:bg-rose-950 border border-stone-800 hover:border-rose-600 text-stone-200 hover:text-rose-200 text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Dices className="w-3.5 h-3.5 text-rose-400" /> Roll Death Saving Throw
                    </button>
                  </div>

                  {/* 5e Exhaustion Tracker (PHB p. 291) */}
                  {(() => {
                    const exhaustLvl = character.exhaustionLevel || 0;
                    const exhaustionEffects = [
                      'Normal (No exhaustion)',
                      'Disadvantage on ability checks',
                      'Speed halved',
                      'Disadvantage on attacks & saves',
                      'Hit point maximum halved',
                      'Speed reduced to 0',
                      'Death',
                    ];

                    const handleExhaustionChange = (delta: number) => {
                      const next = Math.max(0, Math.min(6, exhaustLvl + delta));
                      onUpdateCharacter({
                        ...character,
                        exhaustionLevel: next,
                      });
                    };

                    return (
                      <div className="space-y-1.5 px-1 pt-2 border-t border-stone-800/60">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-[11px] text-stone-300 font-bold flex items-center gap-1">
                            <Activity className="w-3 h-3 text-amber-400" /> Exhaustion:
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleExhaustionChange(-1)}
                              disabled={exhaustLvl <= 0}
                              className="px-1.5 py-0.5 rounded bg-stone-900 disabled:opacity-30 border border-stone-700 text-stone-300 hover:text-white text-[10px] font-bold cursor-pointer"
                              title="Decrease Exhaustion by 1 (e.g. Long Rest with food/drink)"
                            >
                              -
                            </button>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                              exhaustLvl === 0
                                ? 'bg-stone-900 text-stone-400 border-stone-800'
                                : exhaustLvl >= 5
                                ? 'bg-rose-950 text-rose-300 border-rose-600'
                                : 'bg-amber-950 text-amber-300 border-amber-600'
                            }`}>
                              Level {exhaustLvl}/6
                            </span>
                            <button
                              type="button"
                              onClick={() => handleExhaustionChange(1)}
                              disabled={exhaustLvl >= 6}
                              className="px-1.5 py-0.5 rounded bg-stone-900 disabled:opacity-30 border border-stone-700 text-stone-300 hover:text-white text-[10px] font-bold cursor-pointer"
                              title="Increase Exhaustion by 1"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="text-[9.5px] font-mono text-stone-400 truncate" title={exhaustionEffects[exhaustLvl]}>
                          Effect: <span className="text-amber-300">{exhaustionEffects[exhaustLvl]}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Active Transformation / Wild Shape & Summon Companion Quick Bar (Conditional on Character Capabilities) */}
              {(() => {
                if (!canShapeshift && !canSummon) return null;

                return (
                  <div className={`grid ${canShapeshift && canSummon ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                    {canShapeshift && (
                      <button
                        onClick={() => setShowTransformationModal(true)}
                        className="w-full bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-600/40 p-2 rounded-xl text-emerald-200 text-xs font-bold transition flex items-center justify-between"
                      >
                        <span className="flex items-center gap-1.5">
                          <span>🐾</span>
                          <span>
                            {character.activeTransformation ? `Form: ${character.activeTransformation.form.name}` : 'Shapeshift'}
                          </span>
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono">→</span>
                      </button>
                    )}
                    {canSummon && setShowCompanionModal && (
                      <button
                        onClick={() => setShowCompanionModal(true)}
                        className="w-full bg-teal-950/60 hover:bg-teal-900/80 border border-teal-600/40 p-2 rounded-xl text-teal-200 text-xs font-bold transition flex items-center justify-between"
                      >
                        <span className="flex items-center gap-1.5 min-w-0">
                          <span>🦅</span>
                          <span className="truncate">Summon Engine</span>
                        </span>
                        <span className="text-[10px] text-teal-400 font-mono">→</span>
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Conditions & Status Effects Widget */}
      {showConditions && (
        <ConditionsPanel
          character={character}
          onUpdateCharacter={onUpdateCharacter}
        />
      )}

      {/* 3.5e Armor Class Modifiers Modal */}
      {character.edition === '3.5e' && (
        <Edit35eAcModal
          isOpen={show35eAcModal}
          onClose={() => setShow35eAcModal(false)}
          character={character}
          onUpdateCharacter={onUpdateCharacter}
        />
      )}

      {/* 3.5e Base Attack Bonus (BAB) & Iterative Attacks Modal */}
      {character.edition === '3.5e' && (
        <Edit35eBabModal
          isOpen={show35eBabModal}
          onClose={() => setShow35eBabModal(false)}
          character={character}
          onUpdateCharacter={onUpdateCharacter}
        />
      )}

      {/* 3.5e Damage Reduction & Energy Resistances Modal */}
      {character.edition === '3.5e' && (
        <Edit35eDrResistanceModal
          isOpen={show35eDrModal}
          onClose={() => setShow35eDrModal(false)}
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          onRoll={onRoll}
        />
      )}

      {/* 3.5e Tactical Combat Maneuvers Suite Modal */}
      {character.edition === '3.5e' && (
        <CombatManeuvers35eModal
          isOpen={show35eManeuversModal}
          onClose={() => setShow35eManeuversModal(false)}
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          onRoll={onRoll}
        />
      )}

      {/* 3.5e Attacks of Opportunity (AoO) & Combat Reflexes Tracker Modal */}
      {character.edition === '3.5e' && (
        <AoOTrackerModal
          isOpen={show35eAoOModal}
          onClose={() => setShow35eAoOModal(false)}
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          onRollAttack={(label, bonus) => onRoll(label, 20, 1, bonus, 'normal')}
        />
      )}

      {/* 3.5e Creature Size and Scale Table Modal */}
      {character.edition === '3.5e' && (
        <CreatureSizeScaleModal
          isOpen={show35eSizeScaleModal}
          onClose={() => setShow35eSizeScaleModal(false)}
          character={character}
          onUpdateCharacter={onUpdateCharacter}
        />
      )}

      {/* 3.5e Ability Damage, Drain & Poison Tracker Modal */}
      {character.edition === '3.5e' && (
        <AbilityDamageDrainModal
          isOpen={show35eAbilityDamageModal}
          onClose={() => setShow35eAbilityDamageModal(false)}
          character={character}
          onUpdateCharacter={onUpdateCharacter}
        />
      )}

      {/* 3.5e Negative Levels & Energy Drain Modal */}
      {character.edition === '3.5e' && (
        <NegativeLevelsModal
          isOpen={show35eNegativeLevelsModal}
          onClose={() => setShow35eNegativeLevelsModal(false)}
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          onRoll={onRoll}
        />
      )}

      {/* 3.5e Concentration & Defensive Casting Modal */}
      {character.edition === '3.5e' && (
        <ConcentrationCheckModal
          isOpen={show35eConcentrationModal}
          onClose={() => setShow35eConcentrationModal(false)}
          character={character}
          onRoll={onRoll}
        />
      )}

      {/* 3.5e Tumble & Acrobatics Modal */}
      {character.edition === '3.5e' && (
        <TumbleAcrobaticsModal
          isOpen={show35eTumbleModal}
          onClose={() => setShow35eTumbleModal(false)}
          character={character}
          onRoll={onRoll}
        />
      )}

      {/* Mounted Combat & Ride Modal (5e & 3.5e) */}
      <MountedCombatModal
        isOpen={show35eMountedModal}
        onClose={() => setShow35eMountedModal(false)}
        character={character}
        onUpdateCharacter={onUpdateCharacter}
        onRoll={onRoll}
      />

      {/* 3.5e Wild Shape & Polymorph Modal */}
      {character.edition === '3.5e' && (
        <WildShape35eModal
          isOpen={show35eWildShapeModal}
          onClose={() => setShow35eWildShapeModal(false)}
          character={character}
          onUpdateCharacter={onUpdateCharacter}
        />
      )}

      {/* 3.5e Environmental Hazards & Endurance Modal */}
      {character.edition === '3.5e' && (
        <EnvironmentalHazardsModal
          isOpen={show35eEnvironmentalModal}
          onClose={() => setShow35eEnvironmentalModal(false)}
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          onRoll={onRoll}
        />
      )}

      {/* Movement Speeds & Tactical Mobility Modal */}
      <EditMovementSpeedModal
        character={character}
        isOpen={showSpeedModal}
        onClose={() => setShowSpeedModal(false)}
        onSave={(updated) => onUpdateCharacter(updated)}
      />
    </div>
  );
};
