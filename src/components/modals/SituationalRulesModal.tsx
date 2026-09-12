import React, { useState } from 'react';
import { CharacterData } from '../../types';
import { Combatant } from '../combat/encounter/encounterTypes';
import {
  evaluateMassiveDamage,
  calculateFallingDamage,
  evaluateUnderwaterCombatModifiers,
  evaluate35eMissChance,
  DND35E_MISS_CHANCE_PRESETS,
  MissChanceResult,
  getEffectiveSaves,
  getAbilityModifier,
  getEffectiveAbilities,
  getSkillBonus
} from '../../utils/dndCalculations';
import {
  playDiceSound,
  playHitSound,
  playMissSound,
  playDeathSound,
  playDamageAppliedSound,
  playIceColdSound
} from '../../utils/diceAudio';
import {
  Skull,
  Eye,
  EyeOff,
  ArrowDown,
  Waves,
  Dices,
  Shield,
  Flame,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  Sparkles,
  RefreshCw,
  HeartCrack,
  Check,
  ShieldAlert,
  Info,
  Swords,
  ThermometerSnowflake
} from 'lucide-react';
import { ManeuversRuleTab } from './situational/ManeuversRuleTab';
import { HazardsExposureRuleTab } from './situational/HazardsExposureRuleTab';
import { MountedCombatRuleTab } from './situational/MountedCombatRuleTab';

export type SituationalRuleTab = 'massiveDamage' | 'concealment' | 'falling' | 'underwater' | 'combatManeuvers' | 'mountedCombat' | 'hazards';

interface SituationalRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  allCharacters?: CharacterData[];
  combatants?: Combatant[];
  activeCombatantId?: string;
  initialTab?: SituationalRuleTab;
  onUpdateCharacter?: (updated: CharacterData) => void;
  onApplyDamageToCombatant?: (combatantId: string, damage: number) => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
}

export const SituationalRulesModal: React.FC<SituationalRulesModalProps> = ({
  isOpen,
  onClose,
  character,
  allCharacters = [],
  combatants = [],
  activeCombatantId,
  initialTab = 'massiveDamage',
  onUpdateCharacter,
  onApplyDamageToCombatant,
  onRoll
}) => {
  const is35e = character.edition === '3.5e';
  const defaultTab = (!is35e && (initialTab === 'massiveDamage' || initialTab === 'concealment')) ? 'falling' : initialTab;
  const [activeTab, setActiveTab] = useState<SituationalRuleTab>(defaultTab);

  // Sync initialTab if changed when opened, respecting edition
  React.useEffect(() => {
    if (initialTab) {
      if (!is35e && (initialTab === 'massiveDamage' || initialTab === 'concealment')) {
        setActiveTab('falling');
      } else {
        setActiveTab(initialTab);
      }
    }
  }, [initialTab, isOpen, is35e]);

  // -------------------------------------------------------------------------
  // 1. MASSIVE DAMAGE STATE & LOGIC (3.5e PHB p. 145)
  // -------------------------------------------------------------------------
  const [massiveDamageAmount, setMassiveDamageAmount] = useState<number>(55);
  const [massiveDc, setMassiveDc] = useState<number>(15);
  const [massiveTargetId, setMassiveTargetId] = useState<string>(
    activeCombatantId || (combatants[0]?.id) || 'active-char'
  );
  const [massiveLastResult, setMassiveLastResult] = useState<{
    rolledD20: number;
    fortMod: number;
    totalSave: number;
    passed: boolean;
    targetName: string;
    damage: number;
  } | null>(null);

  // Resolve target character / combatant for massive damage save bonus
  const targetCombatant = combatants.find(c => c.id === massiveTargetId);
  const targetChar = (massiveTargetId === 'active-char' || targetCombatant?.isPlayerChar)
    ? character
    : allCharacters.find(ch => ch.id === massiveTargetId || ch.name.toLowerCase() === targetCombatant?.name.toLowerCase());

  const targetFortMod = React.useMemo(() => {
    if (targetChar) {
      const saves = getEffectiveSaves(targetChar);
      return saves?.FORT?.total ?? getAbilityModifier(targetChar.abilities?.CON?.score || 10);
    }
    if (targetCombatant) {
      return Math.max(0, Math.floor((targetCombatant.armorClass - 10) / 2));
    }
    const saves = getEffectiveSaves(character);
    return saves?.FORT?.total ?? 0;
  }, [targetChar, targetCombatant, character]);

  const targetDisplayName = targetCombatant?.name || targetChar?.name || character.name;

  const handleRollMassiveDamageSave = () => {
    playDiceSound();
    const d20 = Math.floor(Math.random() * 20) + 1;
    const res = evaluateMassiveDamage(massiveDamageAmount, targetFortMod, d20, 50, massiveDc);

    if (onRoll) {
      onRoll(`Fortitude Save (Massive Damage vs DC ${massiveDc})`, 20, 1, targetFortMod, 'normal');
    }

    if (res.passed) {
      playHitSound(false);
    } else {
      playDeathSound();
    }

    setMassiveLastResult({
      rolledD20: d20,
      fortMod: targetFortMod,
      totalSave: res.totalSave,
      passed: res.passed,
      targetName: targetDisplayName,
      damage: massiveDamageAmount
    });
  };

  const handleApplyMassiveDamageInstantDeath = () => {
    if (targetCombatant && onApplyDamageToCombatant) {
      // Drop combatant to -10 HP
      const diff = targetCombatant.hpCurrent - (-10);
      if (diff > 0) {
        onApplyDamageToCombatant(targetCombatant.id, diff);
      }
    }
    if ((massiveTargetId === 'active-char' || targetCombatant?.isPlayerChar) && onUpdateCharacter) {
      onUpdateCharacter({
        ...character,
        hpCurrent: -10,
        deathSavesFailures: 3,
        conditions: Array.from(new Set([...(character.conditions || []), 'Dead']))
      });
    }
    playDeathSound();
    onClose();
  };

  // -------------------------------------------------------------------------
  // 2. CONCEALMENT & MISS CHANCE STATE & LOGIC (3.5e PHB p. 152)
  // -------------------------------------------------------------------------
  const [selectedConcealmentPreset, setSelectedConcealmentPreset] = useState<string>('concealment_20');
  const [customMissChancePercent, setCustomMissChancePercent] = useState<number>(20);
  const charHasBlindFight = (character.feats || []).some(f =>
    f.name.toLowerCase().includes('blind-fight') || f.name.toLowerCase().includes('blindfight')
  );
  const [hasBlindFight, setHasBlindFight] = useState<boolean>(charHasBlindFight);
  const [missChanceResult, setMissChanceResult] = useState<MissChanceResult | null>(null);

  const activeMissChancePercent = selectedConcealmentPreset === 'custom'
    ? customMissChancePercent
    : DND35E_MISS_CHANCE_PRESETS.find(p => p.id === selectedConcealmentPreset)?.percentage || 20;

  const handleRollMissChance = () => {
    playDiceSound();
    const res = evaluate35eMissChance(activeMissChancePercent, hasBlindFight);
    setMissChanceResult(res);

    if (res.isOvercome) {
      playHitSound(false);
    } else {
      playMissSound();
    }

    if (onRoll) {
      onRoll(`Concealment Miss Chance (d100 vs ${activeMissChancePercent}%)`, 100, 1, 0, 'normal');
    }
  };

  // -------------------------------------------------------------------------
  // 3. FALLING DAMAGE STATE & LOGIC (1d6/10ft up to 20d6, DC 15 Tumble/Jump)
  // -------------------------------------------------------------------------
  const [fallingDistance, setFallingDistance] = useState<number>(30);
  const [fallingEdition, setFallingEdition] = useState<'3.5e' | '5e'>('3.5e');
  const [fallingSurface, setFallingSurface] = useState<'hard' | 'water' | 'yielding'>('hard');
  const [tumbleJumpPassed, setTumbleJumpPassed] = useState<boolean>(false);
  const [fallingResult, setFallingResult] = useState<ReturnType<typeof calculateFallingDamage> | null>(null);

  // Get Tumble and Jump skill modifiers from character
  const effAbilities = getEffectiveAbilities(character);
  const tumbleSkill = (character.skills || []).find(s => s.name.toLowerCase().includes('tumble') || s.name.toLowerCase().includes('acrobatics'));
  const jumpSkill = (character.skills || []).find(s => s.name.toLowerCase().includes('jump') || s.name.toLowerCase().includes('athletics'));
  const tumbleMod = tumbleSkill ? getSkillBonus(tumbleSkill, effAbilities, character.level || 1, character) : 0;
  const jumpMod = jumpSkill ? getSkillBonus(jumpSkill, effAbilities, character.level || 1, character) : 0;

  const handleRollTumbleCheck = () => {
    playDiceSound();
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + tumbleMod;
    const passed = (d20 === 20) || (d20 !== 1 && total >= 15);
    setTumbleJumpPassed(passed);

    if (onRoll) {
      onRoll(`Tumble Check (Falling Damage vs DC 15)`, 20, 1, tumbleMod, 'normal');
    }

    if (passed) {
      playHitSound(false);
    } else {
      playMissSound();
    }
  };

  const handleRollJumpCheck = () => {
    playDiceSound();
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + jumpMod;
    const passed = (d20 === 20) || (d20 !== 1 && total >= 15);
    setTumbleJumpPassed(passed);

    if (onRoll) {
      onRoll(`Jump Check (Falling Damage vs DC 15)`, 20, 1, jumpMod, 'normal');
    }

    if (passed) {
      playHitSound(false);
    } else {
      playMissSound();
    }
  };

  const handleCalculateFallingDamage = () => {
    playDiceSound();
    const res = calculateFallingDamage({
      distanceFeet: fallingDistance,
      is35e: fallingEdition === '3.5e',
      tumbleOrJumpPassed: tumbleJumpPassed,
      surface: fallingSurface
    });

    setFallingResult(res);

    if (res.totalDamage > 0) {
      playDamageAppliedSound('Bludgeoning');
    } else {
      playHitSound(false);
    }

    if (onRoll && res.diceCount > 0) {
      onRoll(`Falling Damage (${res.diceCount}d6 for ${fallingDistance} ft)`, 6, res.diceCount, 0, 'normal');
    }
  };

  const handleApplyFallingDamage = () => {
    if (!fallingResult || fallingResult.totalDamage === 0) return;

    if (targetCombatant && onApplyDamageToCombatant) {
      onApplyDamageToCombatant(targetCombatant.id, fallingResult.totalDamage);
    } else if (onUpdateCharacter) {
      const nextHp = Math.max(-10, (character.hpCurrent || 0) - fallingResult.totalDamage);
      const updatedConds = [...(character.conditions || [])];
      if (fallingResult.landsProne && !updatedConds.includes('Prone')) {
        updatedConds.push('Prone');
      }
      onUpdateCharacter({
        ...character,
        hpCurrent: nextHp,
        conditions: updatedConds
      });
    }

    playDamageAppliedSound('Bludgeoning');
  };

  // -------------------------------------------------------------------------
  // 4. UNDERWATER COMBAT STATE & LOGIC (5e PHB p. 198 / 3.5e DMG p. 92)
  // -------------------------------------------------------------------------
  const [underwaterEdition, setUnderwaterEdition] = useState<'3.5e' | '5e'>('3.5e');
  const [underwaterWeaponType, setUnderwaterWeaponType] = useState<'slashing' | 'bludgeoning' | 'piercing' | 'ranged'>('slashing');
  const [underwaterWeaponName, setUnderwaterWeaponName] = useState<string>('Greatsword');
  const [underwaterHasSwimSpeed, setUnderwaterHasSwimSpeed] = useState<boolean>(
    Boolean((character.inventory || []).some(i => i.equipped && (i.swimSpeed || 0) > 0) || ((character as any).speeds?.swim || 0) > 0)
  );
  const [underwaterFreedomOfMovement, setUnderwaterFreedomOfMovement] = useState<boolean>(
    (character.conditions || []).some(c => c.toLowerCase().includes('freedom of movement')) ||
    (character.inventory || []).some(i => i.equipped && (i.name.toLowerCase().includes('freedom of movement') || (i.notes || '').toLowerCase().includes('freedom of movement')))
  );

  const underwaterEval = evaluateUnderwaterCombatModifiers({
    damageType: underwaterWeaponType === 'ranged' ? 'Piercing' : underwaterWeaponType,
    rangeStr: underwaterWeaponType === 'ranged' ? '150 ft' : 'Melee',
    weaponName: underwaterWeaponName,
    hasSwimSpeed: underwaterHasSwimSpeed,
    hasFreedomOfMovement: underwaterFreedomOfMovement,
    edition: underwaterEdition
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-stone-950 px-6 py-4 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-stone-100 flex items-center gap-2">
                <span>Situational & Environmental Book Rules</span>
                <span className="text-[10px] bg-stone-800 text-stone-300 font-mono px-2 py-0.5 rounded-full border border-stone-700">
                  D&D 3.5e & 5e
                </span>
              </h2>
              <p className="text-xs text-stone-400 font-sans">
                Automated tabletop formulas & DM adjudication rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-800 bg-stone-950/60 px-4 pt-2 gap-1 overflow-x-auto shrink-0">
          {is35e && (
            <button
              onClick={() => setActiveTab('massiveDamage')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-xl flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                activeTab === 'massiveDamage'
                  ? 'border-red-500 text-red-400 bg-stone-900'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Skull className="w-4 h-4" />
              <span>1. Massive Damage (3.5e)</span>
            </button>
          )}

          {is35e && (
            <button
              onClick={() => setActiveTab('concealment')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-xl flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                activeTab === 'concealment'
                  ? 'border-indigo-500 text-indigo-400 bg-stone-900'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <EyeOff className="w-4 h-4" />
              <span>2. Concealment & Miss Chance (3.5e)</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('falling')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'falling'
                ? 'border-amber-500 text-amber-400 bg-stone-900'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <ArrowDown className="w-4 h-4" />
            <span>{is35e ? '3. Falling Damage' : '1. Falling Damage'}</span>
          </button>

          <button
            onClick={() => setActiveTab('underwater')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'underwater'
                ? 'border-cyan-500 text-cyan-400 bg-stone-900'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Waves className="w-4 h-4" />
            <span>{is35e ? '4. Underwater Combat' : '2. Underwater Combat'}</span>
          </button>

          <button
            onClick={() => setActiveTab('combatManeuvers')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'combatManeuvers'
                ? 'border-amber-500 text-amber-300 bg-stone-900'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>{is35e ? '5. Combat Maneuvers (3.5e)' : '3. Combat Maneuvers'}</span>
          </button>

          <button
            onClick={() => setActiveTab('mountedCombat')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'mountedCombat'
                ? 'border-amber-500 text-amber-300 bg-stone-900'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>{is35e ? '6. Mounted Combat' : '4. Mounted Combat'}</span>
          </button>

          <button
            onClick={() => setActiveTab('hazards')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'hazards'
                ? 'border-orange-500 text-orange-300 bg-stone-900'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <ThermometerSnowflake className="w-4 h-4" />
            <span>{is35e ? '7. Suffocation & Hazards' : '5. Suffocation & Hazards'}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-stone-200">
          {/* ========================================================================= */}
          {/* TAB 1: MASSIVE DAMAGE (3.5e PHB p. 145) */}
          {/* ========================================================================= */}
          {is35e && activeTab === 'massiveDamage' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Citation Banner */}
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-xs space-y-1">
                <div className="flex items-center gap-2 text-red-300 font-bold font-serif text-sm">
                  <Skull className="w-4 h-4 text-red-400" />
                  <span>D&D 3.5e Player's Handbook (p. 145) — Massive Damage Rule</span>
                </div>
                <p className="text-stone-300 leading-relaxed">
                  "If a creature ever sustains a single attack that deals <strong>50 points of damage or more</strong> and it doesn't kill the creature outright, it must make a <strong>DC 15 Fortitude save</strong>. If this save fails, the creature dies immediately (drops to -10 HP and becomes Dead)."
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Target & Damage Configuration */}
                <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-3">
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Target & Trauma</h4>
                  <div>
                    <label className="block text-stone-400 text-xs font-bold mb-1">Target Combatant / Character</label>
                    <select
                      value={massiveTargetId}
                      onChange={(e) => setMassiveTargetId(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-100 font-bold"
                    >
                      <option value="active-char">{character.name} (Active Character)</option>
                      {combatants.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.type.toUpperCase()}, HP {c.hpCurrent}/{c.hpMax})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-400 text-xs font-bold mb-1">Single-Hit Damage Sustained</label>
                    <input
                      type="number"
                      min="1"
                      value={massiveDamageAmount}
                      onChange={(e) => setMassiveDamageAmount(parseInt(e.target.value) || 0)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs font-mono font-bold text-red-300"
                    />
                    <span className="text-[10px] text-stone-500 mt-1 block">
                      Standard threshold: 50+ damage prompts the save.
                    </span>
                  </div>

                  <div>
                    <label className="block text-stone-400 text-xs font-bold mb-1">Fortitude Save DC</label>
                    <input
                      type="number"
                      min="1"
                      value={massiveDc}
                      onChange={(e) => setMassiveDc(parseInt(e.target.value) || 15)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs font-mono font-bold text-stone-200"
                    />
                  </div>
                </div>

                {/* Fortitude Modifier & Roll Action */}
                <div className="md:col-span-2 p-5 rounded-xl bg-stone-950 border border-stone-800 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Fortitude Defense</span>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-stone-900 border border-stone-700 text-amber-300">
                        Target Fortitude Bonus: {targetFortMod >= 0 ? `+${targetFortMod}` : targetFortMod}
                      </span>
                    </div>

                    <div className="mt-3 p-3 rounded-lg bg-stone-900/80 border border-stone-800 text-xs space-y-1">
                      <p className="text-stone-300">
                        Target: <strong className="text-stone-100">{targetDisplayName}</strong>
                      </p>
                      <p className="text-stone-400 text-[11px]">
                        Save Required: <strong>1d20 {targetFortMod >= 0 ? `+ ${targetFortMod}` : `${targetFortMod}`} vs DC {massiveDc}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleRollMassiveDamageSave}
                      className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Dices className="w-5 h-5" />
                      <span>Roll DC {massiveDc} Fortitude Save ({targetFortMod >= 0 ? `+${targetFortMod}` : targetFortMod})</span>
                    </button>

                    {massiveLastResult && (
                      <div className={`p-4 rounded-xl border text-xs space-y-2 animate-fadeIn ${
                        massiveLastResult.passed
                          ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
                          : 'bg-red-950/80 border-red-500 text-red-100'
                      }`}>
                        <div className="flex items-center justify-between font-bold text-sm">
                          <span className="flex items-center gap-1.5">
                            {massiveLastResult.passed ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <HeartCrack className="w-5 h-5 text-red-400" />}
                            <span>{massiveLastResult.passed ? 'SURVIVED MASSIVE DAMAGE!' : 'FAILED SAVE — INSTANT DEATH!'}</span>
                          </span>
                          <span className="font-mono text-xs">
                            d20 ({massiveLastResult.rolledD20}) + {massiveLastResult.fortMod} = {massiveLastResult.totalSave} vs DC {massiveDc}
                          </span>
                        </div>
                        <p className="text-[11px] opacity-90">
                          {massiveLastResult.passed
                            ? `${massiveLastResult.targetName} withstood the shock from ${massiveLastResult.damage} damage.`
                            : `${massiveLastResult.targetName} succumbed to trauma and died on the spot (drops to -10 HP / Dead).`}
                        </p>

                        {!massiveLastResult.passed && (
                          <div className="pt-2 flex items-center gap-2">
                            <button
                              onClick={handleApplyMassiveDamageInstantDeath}
                              className="px-3 py-1.5 rounded-lg bg-red-800 hover:bg-red-700 text-white font-bold text-xs shadow transition flex items-center gap-1 cursor-pointer"
                            >
                              <Skull className="w-3.5 h-3.5" />
                              <span>Apply Instant Death to {massiveLastResult.targetName}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: CONCEALMENT & MISS CHANCE (3.5e PHB p. 152) */}
          {/* ========================================================================= */}
          {is35e && activeTab === 'concealment' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Citation Banner */}
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-xs space-y-1">
                <div className="flex items-center gap-2 text-indigo-300 font-bold font-serif text-sm">
                  <EyeOff className="w-4 h-4 text-indigo-400" />
                  <span>D&D 3.5e Player's Handbook (p. 152) — Concealment & Miss Chance Dice</span>
                </div>
                <p className="text-stone-300 leading-relaxed">
                  "Concealment gives the defender a miss chance on successful attack rolls. After hitting AC, the attacker rolls a <strong>d100 percentile dice</strong>. If the result is <strong>equal to or lower than the miss chance</strong>, the attack misses regardless of the attack roll. The <strong>Blind-Fight feat</strong> permits a single reroll on concealment miss chances."
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Presets & Configurations */}
                <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-3">
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Concealment Presets</h4>
                  <div className="space-y-1.5">
                    {DND35E_MISS_CHANCE_PRESETS.map((preset) => (
                      <label
                        key={preset.id}
                        className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition ${
                          selectedConcealmentPreset === preset.id
                            ? 'bg-indigo-950/70 border-indigo-500 text-indigo-100'
                            : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:bg-stone-800'
                        }`}
                      >
                        <input
                          type="radio"
                          name="concealment-preset"
                          checked={selectedConcealmentPreset === preset.id}
                          onChange={() => setSelectedConcealmentPreset(preset.id)}
                          className="mt-0.5 text-indigo-500 focus:ring-indigo-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold">{preset.label}</span>
                            <span className="font-mono text-[10px] text-amber-300">{preset.percentage}% Miss</span>
                          </div>
                          <p className="text-[11px] text-stone-400 mt-0.5">{preset.description}</p>
                        </div>
                      </label>
                    ))}

                    <label
                      className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition ${
                        selectedConcealmentPreset === 'custom'
                          ? 'bg-indigo-950/70 border-indigo-500 text-indigo-100'
                          : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:bg-stone-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="concealment-preset"
                        checked={selectedConcealmentPreset === 'custom'}
                        onChange={() => setSelectedConcealmentPreset('custom')}
                        className="mt-0.5 text-indigo-500 focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <span className="font-bold">Custom Miss Chance %</span>
                        {selectedConcealmentPreset === 'custom' && (
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              max="99"
                              value={customMissChancePercent}
                              onChange={(e) => setCustomMissChancePercent(parseInt(e.target.value) || 20)}
                              className="w-24 bg-stone-900 border border-stone-700 rounded p-1 text-xs font-mono font-bold"
                            />
                            <span className="text-xs text-stone-400">% Miss Chance</span>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>

                  {/* Blind-Fight Toggle */}
                  <div className="pt-2 border-t border-stone-800">
                    <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-stone-900/80 border border-stone-700 cursor-pointer hover:border-amber-500/60 transition">
                      <input
                        type="checkbox"
                        checked={hasBlindFight}
                        onChange={(e) => setHasBlindFight(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-amber-300 flex items-center gap-1">
                          <span>Blind-Fight Feat Active</span>
                          {charHasBlindFight && <span className="text-[10px] text-emerald-400 font-normal">(on sheet)</span>}
                        </span>
                        <span className="block text-[10px] text-stone-400">
                          Grants a second d100 roll if the first percentile roll misses due to concealment.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Roll Miss Chance Action & Output */}
                <div className="p-5 rounded-xl bg-stone-950 border border-stone-800 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Percentile Test</h4>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 border border-indigo-700 text-indigo-300">
                        Active Miss Chance: {activeMissChancePercent}%
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-2">
                      Rolls a 1d100 percentile die. Roll 01-{activeMissChancePercent} = Missed due to concealment. Roll {activeMissChancePercent + 1}-100 = Hit confirmed!
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleRollMissChance}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Dices className="w-5 h-5" />
                      <span>Roll d100 Miss Chance ({activeMissChancePercent}%)</span>
                    </button>

                    {missChanceResult && (
                      <div className={`p-4 rounded-xl border text-xs space-y-2 animate-fadeIn ${
                        missChanceResult.isOvercome
                          ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-100'
                          : 'bg-rose-950/70 border-rose-500/70 text-rose-100'
                      }`}>
                        <div className="flex items-center justify-between font-bold text-sm">
                          <span className="flex items-center gap-1.5">
                            {missChanceResult.isOvercome ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-rose-400" />}
                            <span>{missChanceResult.isOvercome ? 'HIT CONFIRMED!' : 'MISSED DUE TO CONCEALMENT!'}</span>
                          </span>
                          <span className="font-mono text-xs">
                            d100 = {missChanceResult.secondRoll !== undefined ? `${missChanceResult.secondRoll}% (Reroll)` : `${missChanceResult.d100Roll}%`}
                          </span>
                        </div>

                        <p className="text-[11px] opacity-90 font-mono">
                          {missChanceResult.log}
                        </p>

                        {missChanceResult.usedBlindFight && (
                          <div className="text-[10px] text-amber-300 font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span>Blind-Fight feat triggered (First roll: {missChanceResult.d100Roll}%, Second roll: {missChanceResult.secondRoll}%)</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: FALLING DAMAGE CALCULATOR */}
          {/* ========================================================================= */}
          {activeTab === 'falling' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Citation Banner */}
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs space-y-1">
                <div className="flex items-center gap-2 text-amber-300 font-bold font-serif text-sm">
                  <ArrowDown className="w-4 h-4 text-amber-400" />
                  <span>Falling Damage Rules (3.5e PHB p. 145 & 5e PHB p. 183)</span>
                </div>
                <p className="text-stone-300 leading-relaxed">
                  "A creature takes <strong>1d6 bludgeoning damage per 10 feet fallen</strong> up to a maximum of <strong>20d6</strong> (200 ft terminal velocity). In <strong>3.5e</strong>, a successful <strong>DC 15 Tumble or Jump check</strong> treats the fall as if it were 10 feet shorter, negating the first 1d6 damage. If the fall is 10 feet, the creature takes 0 damage and lands on its feet."
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fall Configuration */}
                <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-3">
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Fall Parameters</h4>
                  
                  <div>
                    <label className="block text-stone-400 text-xs font-bold mb-1">Rule Edition</label>
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setFallingEdition('3.5e')}
                        className={`py-1.5 rounded-lg border transition ${
                          fallingEdition === '3.5e' ? 'bg-amber-600 text-stone-950 border-amber-400' : 'bg-stone-900 text-stone-400 border-stone-800'
                        }`}
                      >
                        3.5e (Tumble Negates 10 ft)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFallingEdition('5e')}
                        className={`py-1.5 rounded-lg border transition ${
                          fallingEdition === '5e' ? 'bg-amber-600 text-stone-950 border-amber-400' : 'bg-stone-900 text-stone-400 border-stone-800'
                        }`}
                      >
                        5e (Standard 1d6/10ft)
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-stone-400 text-xs font-bold">Distance Fallen (Feet)</label>
                      <span className="font-mono text-xs font-bold text-amber-400">{fallingDistance} ft</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="250"
                      step="10"
                      value={fallingDistance}
                      onChange={(e) => setFallingDistance(parseInt(e.target.value) || 10)}
                      className="w-full accent-amber-500"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[10, 20, 30, 40, 50, 80, 100, 150, 200].map((ft) => (
                        <button
                          key={ft}
                          type="button"
                          onClick={() => setFallingDistance(ft)}
                          className={`px-2 py-1 rounded text-[11px] font-mono font-bold border transition ${
                            fallingDistance === ft
                              ? 'bg-amber-600 text-stone-950 border-amber-400'
                              : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                          }`}
                        >
                          {ft} ft {ft === 200 ? '(Max)' : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-stone-400 text-xs font-bold mb-1">Landing Surface</label>
                    <select
                      value={fallingSurface}
                      onChange={(e) => setFallingSurface(e.target.value as any)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs font-bold text-stone-100"
                    >
                      <option value="hard">Solid Ground / Stone / Wood (All Lethal)</option>
                      <option value="water">Deep Water (First 20 ft Free, Next 20 ft Nonlethal)</option>
                      <option value="yielding">Yielding: Haystack / Deep Snow / Mud (First 10 ft Nonlethal)</option>
                    </select>
                  </div>

                  {fallingEdition === '3.5e' && (
                    <div className="pt-2 border-t border-stone-800 space-y-2">
                      <label className="flex items-center gap-2 text-xs font-bold text-stone-300">
                        <input
                          type="checkbox"
                          checked={tumbleJumpPassed}
                          onChange={(e) => setTumbleJumpPassed(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                        />
                        <span>DC 15 Tumble / Jump Check Succeeded (Negates First 10 ft)</span>
                      </label>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleRollTumbleCheck}
                          className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-xs text-stone-200 font-bold border border-stone-700 flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Dices className="w-3.5 h-3.5 text-amber-400" />
                          <span>Roll Tumble ({tumbleMod >= 0 ? `+${tumbleMod}` : tumbleMod})</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleRollJumpCheck}
                          className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-xs text-stone-200 font-bold border border-stone-700 flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Dices className="w-3.5 h-3.5 text-amber-400" />
                          <span>Roll Jump ({jumpMod >= 0 ? `+${jumpMod}` : jumpMod})</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Calculate & Apply Damage */}
                <div className="p-5 rounded-xl bg-stone-950 border border-stone-800 flex flex-col justify-between space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Damage Pool Preview</h4>
                    <div className="mt-3 p-3.5 rounded-xl bg-stone-900/80 border border-stone-800 text-xs space-y-1.5 font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400">Distance:</span>
                        <strong className="text-stone-100">{fallingDistance} ft</strong>
                      </div>
                      {fallingEdition === '3.5e' && tumbleJumpPassed && (
                        <div className="flex items-center justify-between text-emerald-400">
                          <span>DC 15 Tumble/Jump:</span>
                          <strong>-10 ft (-1d6)</strong>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-amber-300">
                        <span>Dice to Roll:</span>
                        <strong className="text-sm">
                          {Math.min(20, Math.max(0, Math.floor((fallingDistance - (tumbleJumpPassed && fallingEdition === '3.5e' ? 10 : 0)) / 10)))}d6
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleCalculateFallingDamage}
                      className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-stone-950 font-extrabold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Flame className="w-5 h-5" />
                      <span>Roll Falling Damage</span>
                    </button>

                    {fallingResult && (
                      <div className="p-4 rounded-xl border border-amber-500/40 bg-stone-900 space-y-3 animate-fadeIn">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-stone-200">Total Falling Damage:</span>
                          <span className="text-lg font-mono font-black text-amber-400">
                            {fallingResult.totalDamage} HP
                          </span>
                        </div>

                        <div className="text-xs text-stone-300 font-mono">
                          Dice Pool: [{fallingResult.rolls.join(', ')}]
                        </div>

                        <div className="text-[11px] text-stone-400 space-y-0.5">
                          <p>{fallingResult.summary}</p>
                          <p className="text-[10px] text-stone-500 italic">{fallingResult.ruleCitation}</p>
                        </div>

                        {fallingResult.totalDamage > 0 && (
                          <button
                            onClick={handleApplyFallingDamage}
                            className="w-full py-2 bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs rounded-lg transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Apply {fallingResult.totalDamage} Bludgeoning Damage to {targetDisplayName}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: UNDERWATER COMBAT MODIFIERS (5e PHB p. 198 / 3.5e DMG p. 92) */}
          {/* ========================================================================= */}
          {activeTab === 'underwater' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Citation Banner */}
              <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-xs space-y-1">
                <div className="flex items-center gap-2 text-cyan-300 font-bold font-serif text-sm">
                  <Waves className="w-4 h-4 text-cyan-400" />
                  <span>Underwater Combat Modifiers (5e PHB p. 198 / 3.5e DMG p. 92)</span>
                </div>
                <p className="text-stone-300 leading-relaxed">
                  "Underwater, movement and attacks face immense fluid resistance. In <strong>5e</strong>, melee attacks with slashing or bludgeoning weapons have <strong>disadvantage</strong> unless the attacker has a swim speed; piercing weapons attack normally. In <strong>3.5e</strong> (DMG Table 3-22), slashing and bludgeoning weapons suffer a <strong>-2 attack penalty AND deal half damage</strong>. In both editions, submerged targets have <strong>Fire Resistance (damage halved)</strong>."
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Configuration */}
                <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-3">
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Combatant & Weapon Setup</h4>

                  <div>
                    <label className="block text-stone-400 text-xs font-bold mb-1">Edition Rules</label>
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setUnderwaterEdition('3.5e')}
                        className={`py-1.5 rounded-lg border transition ${
                          underwaterEdition === '3.5e' ? 'bg-cyan-600 text-stone-950 border-cyan-400' : 'bg-stone-900 text-stone-400 border-stone-800'
                        }`}
                      >
                        3.5e (-2 Atk & Half Dmg)
                      </button>
                      <button
                        type="button"
                        onClick={() => setUnderwaterEdition('5e')}
                        className={`py-1.5 rounded-lg border transition ${
                          underwaterEdition === '5e' ? 'bg-cyan-600 text-stone-950 border-cyan-400' : 'bg-stone-900 text-stone-400 border-stone-800'
                        }`}
                      >
                        5e (Disadvantage)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-stone-400 text-xs font-bold mb-1">Weapon Category / Damage Type</label>
                    <div className="grid grid-cols-2 gap-1.5 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          setUnderwaterWeaponType('piercing');
                          setUnderwaterWeaponName('Trident / Spear / Dagger');
                        }}
                        className={`py-1.5 px-2 rounded-lg border text-left transition ${
                          underwaterWeaponType === 'piercing' ? 'bg-cyan-900/80 text-cyan-200 border-cyan-400' : 'bg-stone-900 text-stone-400 border-stone-800'
                        }`}
                      >
                        🔱 Piercing (Spear, Trident, Dagger)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUnderwaterWeaponType('slashing');
                          setUnderwaterWeaponName('Greatsword / Longsword');
                        }}
                        className={`py-1.5 px-2 rounded-lg border text-left transition ${
                          underwaterWeaponType === 'slashing' ? 'bg-cyan-900/80 text-cyan-200 border-cyan-400' : 'bg-stone-900 text-stone-400 border-stone-800'
                        }`}
                      >
                        ⚔️ Slashing (Greatsword, Axe)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUnderwaterWeaponType('bludgeoning');
                          setUnderwaterWeaponName('Warhammer / Mace');
                        }}
                        className={`py-1.5 px-2 rounded-lg border text-left transition ${
                          underwaterWeaponType === 'bludgeoning' ? 'bg-cyan-900/80 text-cyan-200 border-cyan-400' : 'bg-stone-900 text-stone-400 border-stone-800'
                        }`}
                      >
                        🔨 Bludgeoning (Hammer, Mace)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUnderwaterWeaponType('ranged');
                          setUnderwaterWeaponName('Longbow / Crossbow');
                        }}
                        className={`py-1.5 px-2 rounded-lg border text-left transition ${
                          underwaterWeaponType === 'ranged' ? 'bg-cyan-900/80 text-cyan-200 border-cyan-400' : 'bg-stone-900 text-stone-400 border-stone-800'
                        }`}
                      >
                        🏹 Ranged (Bow, Crossbow)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-stone-800">
                    <label className="flex items-center gap-2 text-xs font-bold text-stone-300">
                      <input
                        type="checkbox"
                        checked={underwaterHasSwimSpeed}
                        onChange={(e) => setUnderwaterHasSwimSpeed(e.target.checked)}
                        className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500"
                      />
                      <span>Attacker Has Natural or Magical Swim Speed</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-bold text-stone-300">
                      <input
                        type="checkbox"
                        checked={underwaterFreedomOfMovement}
                        onChange={(e) => setUnderwaterFreedomOfMovement(e.target.checked)}
                        className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500"
                      />
                      <span>Freedom of Movement Spell / Trait Active (Ignores all water penalties)</span>
                    </label>
                  </div>
                </div>

                {/* Mechanical Evaluation Card */}
                <div className="p-5 rounded-xl bg-stone-950 border border-stone-800 space-y-4">
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Active Mechanical Impact</h4>

                  <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-200 text-sm">{underwaterWeaponName}</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-900 text-cyan-200">
                        {underwaterWeaponType.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs text-stone-200 leading-relaxed">
                      {underwaterEval.summary}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-cyan-800/40">
                      <div className="p-2 rounded bg-stone-900">
                        <span className="text-stone-400 text-[10px] block">Attack Roll Modifier</span>
                        <strong className={underwaterEval.hasDisadvantage || underwaterEval.attackModifier < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                          {underwaterEval.hasDisadvantage ? 'DISADVANTAGE' : underwaterEval.attackModifier < 0 ? `${underwaterEval.attackModifier} Penalty` : 'NORMAL ROLL'}
                        </strong>
                      </div>

                      <div className="p-2 rounded bg-stone-900">
                        <span className="text-stone-400 text-[10px] block">Damage Multiplier</span>
                        <strong className={underwaterEval.damageMultiplier < 1 ? 'text-rose-400' : 'text-emerald-400'}>
                          {underwaterEval.damageMultiplier < 1 ? '50% (HALF DAMAGE)' : '100% (FULL DAMAGE)'}
                        </strong>
                      </div>
                    </div>

                    <div className="text-[10px] text-stone-400">
                      Citation: <span className="text-stone-300 italic">{underwaterEval.citation}</span>
                    </div>
                  </div>

                  {/* Summary Comparison Grid */}
                  <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 text-[11px] space-y-2">
                    <span className="text-stone-400 font-bold block">Quick Aquatic Weapon Reference:</span>
                    <ul className="space-y-1 text-stone-300 list-disc list-inside">
                      <li><strong className="text-cyan-300">Spear, Trident, Dagger, Shortsword, Rapier:</strong> Full attack & full damage.</li>
                      <li><strong className="text-rose-300">Greatsword, Greataxe, Warhammer, Maul:</strong> Disadvantage (5e) or -2 Atk & Half Damage (3.5e).</li>
                      <li><strong className="text-amber-300">Crossbow, Net, Dart:</strong> Normal within range; auto-miss beyond range.</li>
                      <li><strong className="text-rose-400">Fire Spells & Weapons:</strong> Submerged creatures take 50% damage (Fire Resistance).</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: COMBAT MANEUVERS (3.5e PHB p. 154-159) */}
          {/* ========================================================================= */}
          {activeTab === 'combatManeuvers' && (
            <div className="animate-fadeIn">
              <ManeuversRuleTab
                character={character}
                combatants={combatants}
                allCharacters={allCharacters}
                activeCombatantId={activeCombatantId}
                onUpdateCharacter={onUpdateCharacter}
                onRoll={onRoll}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: MOUNTED COMBAT (5e PHB p. 198 / 3.5e PHB p. 80, 98) */}
          {/* ========================================================================= */}
          {activeTab === 'mountedCombat' && (
            <div className="animate-fadeIn">
              <MountedCombatRuleTab
                character={character}
                combatants={combatants}
                allCharacters={allCharacters}
                activeCombatantId={activeCombatantId}
                onUpdateCharacter={onUpdateCharacter}
                onRoll={onRoll}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: SUFFOCATION, DROWNING & EXTREME HAZARDS (3.5e DMG / 5e PHB) */}
          {/* ========================================================================= */}
          {activeTab === 'hazards' && (
            <div className="animate-fadeIn">
              <HazardsExposureRuleTab
                character={character}
                combatants={combatants}
                allCharacters={allCharacters}
                activeCombatantId={activeCombatantId}
                onApplyDamageToCombatant={onApplyDamageToCombatant}
                onRoll={onRoll}
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-950 px-6 py-3 border-t border-stone-800 flex items-center justify-between shrink-0 text-xs">
          <span className="text-stone-500 font-mono">
            Active Character: <strong className="text-stone-300">{character.name}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
