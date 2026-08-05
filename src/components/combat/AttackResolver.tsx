import React, { useState } from 'react';
import { CharacterData, Attack, Spell } from '../../types';
import { Combatant } from './EncounterTracker';
import { getSpellAttackBonus, getSpellSaveDC, formatModifier, rollCompoundDamage, RolledDamagePart, applyResistanceAndDRToDamage, calculateCharacterTotalDR, getCharacterResistances, getConditionEffects } from '../../utils/dndCalculations';
import { playDiceSound } from '../../utils/diceAudio';
import { Crosshair, Swords, Shield, Dices, Flame, Sparkles, CheckCircle2, XCircle, Wand2 } from 'lucide-react';

interface AttackResolverProps {
  character: CharacterData;
  combatants: Combatant[];
  activeCombatantId?: string;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
  onApplyDamageToCombatant?: (combatantId: string, damage: number) => void;
  onLogAction?: (category: 'attack' | 'damage' | 'heal' | 'ability', message: string, actor?: string) => void;
}

export const AttackResolver: React.FC<AttackResolverProps> = ({
  character,
  combatants,
  activeCombatantId,
  onRoll,
  onApplyDamageToCombatant,
  onLogAction
}) => {
  const attacksList = character.attacks || [];
  const spellsList = character.spells || [];
  const spellAtkBonus = getSpellAttackBonus(character);
  const spellSaveDC = getSpellSaveDC(character);

  // Default selection to first weapon or first spell or custom
  const defaultSelection = attacksList[0]?.id || (spellsList[0] ? `spell-${spellsList[0].id}` : 'custom');

  // Attack Resolver Form State
  const [selectedAttackId, setSelectedAttackId] = useState<string>(defaultSelection);
  const [customAttackName, setCustomAttackName] = useState('Melee Weapon Attack');
  const [customAttackBonus, setCustomAttackBonus] = useState<number>(5);
  const [customDamageExpr, setCustomDamageExpr] = useState('1d8 slashing + 1d6 fire + 3');

  // Action Category: Attack Roll (Can Crit) vs Saving Throw / Direct Damage (Cannot Crit)
  const [actionType, setActionType] = useState<'attack_roll' | 'saving_throw'>('attack_roll');

  // Target State
  const initialTarget = combatants.find(c => c.id !== activeCombatantId && c.type === 'enemy') ||
                        combatants.find(c => c.id !== activeCombatantId) ||
                        combatants[0];

  const [selectedTargetId, setSelectedTargetId] = useState<string>(initialTarget?.id || '');
  const [manualTargetAc, setManualTargetAc] = useState<number>(14);

  // Auto-reset attack selection when active attacker changes
  React.useEffect(() => {
    const atks = character.attacks || [];
    const spls = character.spells || [];
    const def = atks[0]?.id || (spls[0] ? `spell-${spls[0].id}` : 'custom');
    setSelectedAttackId(def);
    setLastResult(null);
    setRolledDamage(null);
  }, [character.id, character.name]);

  // Auto-select valid target when active combatant changes
  React.useEffect(() => {
    if (!selectedTargetId || selectedTargetId === activeCombatantId || !combatants.some(c => c.id === selectedTargetId)) {
      const best = combatants.find(c => c.id !== activeCombatantId && c.type === 'enemy') ||
                   combatants.find(c => c.id !== activeCombatantId) ||
                   combatants[0];
      if (best) {
        setSelectedTargetId(best.id);
      }
    }
  }, [activeCombatantId, combatants, selectedTargetId]);

  // Attack Modifiers State
  const [rollMode, setRollMode] = useState<'normal' | 'advantage' | 'disadvantage'>('normal');
  const [coverBonus, setCoverBonus] = useState<number>(0); // 0 = None, 2 = Half Cover (+2 AC), 5 = Three-Quarters Cover (+5 AC)
  const [extraBonus, setExtraBonus] = useState<number>(0); // e.g., Bless +1d4 or +1 magic

  // Resolution Result State
  const [lastResult, setLastResult] = useState<{
    attackName: string;
    d20Roll1: number;
    d20Roll2?: number;
    finalD20: number;
    totalAttack: number;
    targetName: string;
    targetAc: number;
    effectiveTargetAc: number;
    isCrit: boolean;
    isNat1: boolean;
    isHit: boolean;
    canCrit: boolean;
    damageExpr: string;
    targetCombatantId?: string;
  } | null>(null);

  const [rolledDamage, setRolledDamage] = useState<{
    total: number;
    breakdown: string;
    isCrit: boolean;
    canCrit: boolean;
    parts: RolledDamagePart[];
    applied: boolean;
  } | null>(null);

  // Resolve Selected Weapon or Spell
  const selectedAttack: Attack | undefined = attacksList.find(a => a.id === selectedAttackId);
  const selectedSpell: Spell | undefined = selectedAttackId.startsWith('spell-')
    ? spellsList.find(s => `spell-${s.id}` === selectedAttackId)
    : undefined;

  // Auto-detect action type (attack roll vs save) on spell selection change
  React.useEffect(() => {
    if (selectedSpell) {
      if (selectedSpell.saveType || (selectedSpell.description && /saving throw|dc\s*\d+/i.test(selectedSpell.description))) {
        setActionType('saving_throw');
      } else {
        setActionType('attack_roll');
      }
    } else {
      setActionType('attack_roll');
    }
  }, [selectedAttackId]);

  // Extract spell damage dice and damage types from description if possible
  const extractSpellDamage = (spell: Spell): string => {
    const match = spell.description?.match(/(\d+d\d+(?:\s+[a-zA-Z]+)?(?:\s*\+\s*\d+(?:d\d+)?(?:\s+[a-zA-Z]+)?)*)/i);
    return match ? match[1] : '1d8 radiant';
  };

  const activeAttackName = selectedSpell
    ? selectedSpell.name
    : selectedAttack
    ? selectedAttack.name
    : customAttackName;

  const activeAttackBonus = selectedSpell
    ? spellAtkBonus
    : selectedAttack
    ? selectedAttack.attackBonus
    : customAttackBonus;

  const activeDamageExpr = selectedSpell
    ? extractSpellDamage(selectedSpell)
    : selectedAttack
    ? (selectedAttack.damageType && !selectedAttack.damage.toLowerCase().includes(selectedAttack.damageType.split('/')[0].trim().toLowerCase())
        ? `${selectedAttack.damage} ${selectedAttack.damageType}`
        : selectedAttack.damage)
    : customDamageExpr;

  const activeAttackRange = selectedSpell
    ? selectedSpell.range || '60 ft'
    : selectedAttack
    ? selectedAttack.range || '5 ft'
    : '5 ft';

  // Selected Target Object
  const targetCombatant = combatants.find(c => c.id === selectedTargetId);
  const baseTargetAc = targetCombatant ? targetCombatant.armorClass : manualTargetAc;
  const effectiveTargetAc = baseTargetAc + coverBonus;
  const targetNameStr = targetCombatant ? targetCombatant.name : `Target (AC ${manualTargetAc})`;

  // Mechanical Condition Evaluation
  const attackerConditions = character.conditions || [];
  const targetConditions = targetCombatant?.conditions || [];
  const attackerExhaustion = character.exhaustionLevel || 0;

  const isRanged = activeAttackRange.toLowerCase().includes('range') || (selectedAttack?.range ? (parseInt(selectedAttack.range) > 5) : false);
  const attackerEffects = getConditionEffects(attackerConditions, attackerExhaustion, isRanged);
  const targetEffects = getConditionEffects(targetConditions, 0, false);

  const advantageSources: string[] = [];
  const disadvantageSources: string[] = [];

  // Attacker condition influences
  if (attackerEffects.advantageAttackRolls) {
    if (attackerConditions.includes('Invisible')) advantageSources.push('Attacker is Invisible (+Advantage)');
    if (attackerConditions.includes('Haste')) advantageSources.push('Attacker is Hasted (+Advantage)');
    if (attackerConditions.includes('Reckless Attack')) advantageSources.push('Attacker is Reckless (+Advantage)');
  }
  if (attackerEffects.disadvantageAttackRolls) {
    if (attackerConditions.includes('Poisoned')) disadvantageSources.push('Attacker is Poisoned (-Disadvantage)');
    if (attackerConditions.includes('Prone')) disadvantageSources.push('Attacker is Prone (-Disadvantage)');
    if (attackerConditions.includes('Blinded')) disadvantageSources.push('Attacker is Blinded (-Disadvantage)');
    if (attackerConditions.includes('Restrained')) disadvantageSources.push('Attacker is Restrained (-Disadvantage)');
    if (attackerConditions.includes('Frightened')) disadvantageSources.push('Attacker is Frightened (-Disadvantage)');
    if (attackerExhaustion >= 3) disadvantageSources.push('Attacker has Exhaustion Lvl 3+ (-Disadvantage)');
  }

  // Target condition influences
  if (targetEffects.grantAdvantageToAttacker) {
    if (targetConditions.includes('Restrained')) advantageSources.push('Target is Restrained (+Advantage)');
    if (targetConditions.includes('Blinded')) advantageSources.push('Target is Blinded (+Advantage)');
    if (targetConditions.includes('Stunned')) advantageSources.push('Target is Stunned (+Advantage)');
    if (targetConditions.includes('Paralyzed')) advantageSources.push('Target is Paralyzed (+Advantage / Auto-Crit on hit within 5ft)');
    if (targetConditions.includes('Unconscious')) advantageSources.push('Target is Unconscious (+Advantage / Auto-Crit on hit within 5ft)');
    if (targetConditions.includes('Petrified')) advantageSources.push('Target is Petrified (+Advantage)');
    if (targetConditions.includes('Faerie Fire')) advantageSources.push('Target is outlined in Faerie Fire (+Advantage)');
  }
  if (targetEffects.grantDisadvantageToAttacker) {
    if (targetConditions.includes('Invisible')) disadvantageSources.push('Target is Invisible (-Disadvantage)');
  }

  // Prone target rule: Melee/5ft = Advantage, Ranged = Disadvantage
  if (targetConditions.includes('Prone')) {
    const isMeleeOr5ft = activeAttackRange.toLowerCase().includes('melee') || activeAttackRange.toLowerCase().includes('5 ft') || activeAttackRange.toLowerCase().includes('5ft');
    if (isMeleeOr5ft) {
      advantageSources.push('Target is Prone & Attack is Melee/5ft (+Advantage)');
    } else {
      disadvantageSources.push('Target is Prone & Attack is Ranged (-Disadvantage)');
    }
  }

  const recommendedRollMode: 'normal' | 'advantage' | 'disadvantage' =
    advantageSources.length > 0 && disadvantageSources.length === 0
      ? 'advantage'
      : disadvantageSources.length > 0 && advantageSources.length === 0
      ? 'disadvantage'
      : 'normal';

  // Auto-sync roll mode if condition recommendations exist
  React.useEffect(() => {
    if ((advantageSources.length > 0 || disadvantageSources.length > 0) && rollMode !== recommendedRollMode) {
      setRollMode(recommendedRollMode);
    }
  }, [selectedTargetId, attackerConditions.join(','), targetConditions.join(','), recommendedRollMode, rollMode]);

  // Auto-sync extra attack bonus from active conditions (e.g. Bless +2, Archery +2, Bane -2)
  React.useEffect(() => {
    setExtraBonus(attackerEffects.extraAttackBonus);
  }, [selectedAttackId, selectedTargetId, attackerConditions.join(','), attackerEffects.extraAttackBonus]);

  // Auto-sync target cover bonus if target has cover conditions
  React.useEffect(() => {
    if (targetConditions.some(c => c.toLowerCase().includes('3/4 cover') || c.toLowerCase().includes('three-quarters'))) {
      setCoverBonus(5);
    } else if (targetConditions.some(c => c.toLowerCase().includes('half cover') || c.toLowerCase().includes('cover: half'))) {
      setCoverBonus(2);
    }
  }, [selectedTargetId, targetConditions.join(',')]);

  // Execute Attack Roll vs Target AC
  const handleRollAttack = () => {
    playDiceSound();
    const canCrit = actionType === 'attack_roll';

    const roll1 = Math.floor(Math.random() * 20) + 1;
    let roll2: number | undefined = undefined;
    let finalD20 = roll1;

    if (rollMode === 'advantage') {
      roll2 = Math.floor(Math.random() * 20) + 1;
      finalD20 = Math.max(roll1, roll2);
    } else if (rollMode === 'disadvantage') {
      roll2 = Math.floor(Math.random() * 20) + 1;
      finalD20 = Math.min(roll1, roll2);
    }

    const totalBonus = activeAttackBonus + extraBonus;
    const totalAttack = finalD20 + totalBonus;

    // Auto-crit if attacker gets nat 20 or target is Paralyzed / Unconscious in melee (within 5ft)
    const isMeleeOr5ft = activeAttackRange.toLowerCase().includes('melee') || activeAttackRange.toLowerCase().includes('5 ft') || activeAttackRange.toLowerCase().includes('5ft');
    const isParalyzedOrUnconscious = targetEffects.meleeAutoCrit;
    const isCrit = canCrit && (finalD20 === 20 || (isParalyzedOrUnconscious && isMeleeOr5ft && finalD20 + totalBonus >= effectiveTargetAc));
    const isNat1 = finalD20 === 1;

    // Nat 20 auto-hits; Nat 1 auto-misses; otherwise compare total vs effective target AC
    const isHit = actionType === 'saving_throw' ? true : (isCrit || (!isNat1 && totalAttack >= effectiveTargetAc));

    if (onRoll) {
      const modeStr = rollMode !== 'normal' ? ` (${rollMode.toUpperCase()})` : '';
      onRoll(`Attack Roll: ${activeAttackName}${modeStr} vs ${targetNameStr}`, 20, 1, totalBonus, rollMode);
    }

    if (onLogAction) {
      const outcomeStr = actionType === 'saving_throw'
        ? `Spell / Action executed vs ${targetNameStr}`
        : isCrit
        ? `CRITICAL HIT! (Rolled ${finalD20} + ${totalBonus} = ${totalAttack} vs AC ${effectiveTargetAc})`
        : isNat1
        ? `NATURAL 1 MISS! (Rolled 1 + ${totalBonus} = ${totalAttack} vs AC ${effectiveTargetAc})`
        : isHit
        ? `HIT! (Rolled ${finalD20} + ${totalBonus} = ${totalAttack} vs AC ${effectiveTargetAc})`
        : `MISS! (Rolled ${finalD20} + ${totalBonus} = ${totalAttack} vs AC ${effectiveTargetAc})`;

      onLogAction('attack', `${activeAttackName} vs ${targetNameStr}: ${outcomeStr}`, character.name);
    }

    setLastResult({
      attackName: activeAttackName,
      d20Roll1: roll1,
      d20Roll2: roll2,
      finalD20,
      totalAttack,
      targetName: targetNameStr,
      targetAc: baseTargetAc,
      effectiveTargetAc,
      isCrit,
      isNat1,
      isHit,
      canCrit,
      damageExpr: activeDamageExpr,
      targetCombatantId: targetCombatant?.id
    });

    setRolledDamage(null);
  };

  // Roll Compound Damage (doubles ALL damage dice on Crits, handles multi-source damage, applies Petrified resistance & DR)
  const handleRollDamage = () => {
    if (!lastResult) return;
    playDiceSound();

    const expr = lastResult.damageExpr || '1d8 + 3';
    const result = rollCompoundDamage(expr, lastResult.isCrit, lastResult.canCrit);

    let finalTotal = result.totalDamage;
    let finalBreakdown = result.breakdown;

    // Petrified Target: Resistance to ALL damage types
    if (targetEffects.damageResistanceAll) {
      finalTotal = Math.floor(finalTotal / 2);
      finalBreakdown = `${finalBreakdown} | Petrified: [Halved by Resistance to All Damage]`;
    }

    // Apply DR and Resistance if the target is the active player character
    if (targetCombatant?.id === character.id || !targetCombatant) {
      const activeType = result.parts[0]?.damageType || 'Slashing';
      const appliedRes = applyResistanceAndDRToDamage(finalTotal, activeType, character);
      finalTotal = appliedRes.finalTotal;
      if (appliedRes.breakdownLogs.length > 0) {
        finalBreakdown = `${finalBreakdown} | Defense: [${appliedRes.breakdownLogs.join('; ')}]`;
      }
    }

    if (onLogAction) {
      const critPrefix = result.isCrit ? '🔥 CRITICAL ' : '';
      onLogAction('damage', `${critPrefix}Damage rolled for ${lastResult.attackName} vs ${lastResult.targetName}: ${finalTotal} damage (${finalBreakdown})`, character.name);
    }

    setRolledDamage({
      total: finalTotal,
      breakdown: finalBreakdown,
      isCrit: result.isCrit,
      canCrit: result.canCrit,
      parts: result.parts,
      applied: false
    });
  };

  // Apply rolled damage directly to combatant's HP
  const handleApplyDamage = () => {
    if (!rolledDamage || !lastResult?.targetCombatantId || !onApplyDamageToCombatant) return;
    onApplyDamageToCombatant(lastResult.targetCombatantId, rolledDamage.total);
    if (onLogAction) {
      onLogAction('damage', `Applied ${rolledDamage.total} damage to ${lastResult.targetName}`, character.name);
    }
    setRolledDamage(prev => prev ? { ...prev, applied: true } : null);
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 md:p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Crosshair className="w-5 h-5 text-amber-500" />
          <h3 className="font-serif font-bold text-amber-200 text-sm">Target AC Hit & Attack Resolver</h3>
          <span className="text-xs bg-amber-950 text-amber-300 border border-amber-600/40 px-2.5 py-0.5 rounded-full font-serif font-bold shadow-sm">
            Attacker: {character.name}
          </span>
        </div>
        <span className="text-[11px] text-stone-400 font-mono">Automated D20 Roll vs Target AC</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Weapon / Attack & Target Selection */}
        <div className="space-y-3">
          {/* Attack / Weapon / Spell Selection */}
          <div>
            <label className="block text-stone-400 text-xs font-bold mb-1 flex items-center gap-1">
              {selectedSpell ? <Wand2 className="w-3.5 h-3.5 text-purple-400" /> : <Swords className="w-3.5 h-3.5 text-amber-500" />}
              <span>Attack / Weapon / Spell</span>
            </label>
            <select
              value={selectedAttackId}
              onChange={(e) => setSelectedAttackId(e.target.value)}
              className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-100 font-bold focus:outline-none focus:border-amber-500"
            >
              {attacksList.length > 0 && (
                <optgroup label="⚔️ Physical Weapons & Attacks">
                  {attacksList.map(atk => (
                    <option key={atk.id} value={atk.id}>
                      {atk.name} (+{atk.attackBonus} to hit, {atk.damage} {atk.damageType})
                    </option>
                  ))}
                </optgroup>
              )}

              {spellsList.length > 0 && (
                <optgroup label="✨ Learned Spells & Cantrips">
                  {spellsList.map(spell => (
                    <option key={spell.id} value={`spell-${spell.id}`}>
                      {spell.name} ({spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}) • Spell Atk {formatModifier(spellAtkBonus)}
                    </option>
                  ))}
                </optgroup>
              )}

              <optgroup label="⚙️ Custom Action">
                <option value="custom">-- Custom Manual Attack --</option>
              </optgroup>
            </select>
          </div>

          {/* Action Category Toggle */}
          <div className="bg-stone-950 p-2 rounded-xl border border-stone-800 text-xs flex items-center justify-between gap-2 flex-wrap">
            <span className="text-stone-400 font-bold text-[11px]">Action Category:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActionType('attack_roll')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                  actionType === 'attack_roll'
                    ? 'bg-amber-600 text-stone-950 shadow-md'
                    : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                }`}
              >
                🎯 Attack Roll (Can Crit)
              </button>
              <button
                type="button"
                onClick={() => setActionType('saving_throw')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                  actionType === 'saving_throw'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                }`}
              >
                🛡️ Save / Direct (No Crit)
              </button>
            </div>
          </div>

          {selectedSpell && (
            <div className="bg-purple-950/40 border border-purple-500/40 p-2.5 rounded-xl text-xs flex items-center justify-between font-mono">
              <span className="text-purple-300 font-bold flex items-center gap-1">
                <Wand2 className="w-3.5 h-3.5" />
                <span>{selectedSpell.name} ({selectedSpell.level === 0 ? 'Cantrip' : `Lvl ${selectedSpell.level}`})</span>
              </span>
              <span className="text-stone-300 text-[11px]">
                Spell Atk: <strong className="text-amber-300">{formatModifier(spellAtkBonus)}</strong> | DC: <strong className="text-amber-300">{spellSaveDC}</strong>
              </span>
            </div>
          )}

          {selectedAttackId === 'custom' && (
            <div className="grid grid-cols-3 gap-2 bg-stone-950 p-2.5 rounded-xl border border-stone-800 text-xs">
              <div className="col-span-3 sm:col-span-1">
                <label className="block text-stone-400 text-[10px] font-bold mb-0.5">Name</label>
                <input
                  type="text"
                  value={customAttackName}
                  onChange={(e) => setCustomAttackName(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded p-1 text-stone-100"
                />
              </div>
              <div>
                <label className="block text-stone-400 text-[10px] font-bold mb-0.5">Atk Bonus</label>
                <input
                  type="number"
                  value={customAttackBonus}
                  onChange={(e) => setCustomAttackBonus(parseInt(e.target.value) || 0)}
                  className="w-full bg-stone-900 border border-stone-700 rounded p-1 text-stone-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-stone-400 text-[10px] font-bold mb-0.5">Damage Expr</label>
                <input
                  type="text"
                  value={customDamageExpr}
                  onChange={(e) => setCustomDamageExpr(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded p-1 text-stone-100 font-mono"
                />
              </div>
            </div>
          )}

          {/* Target Selection */}
          <div>
            <label className="block text-stone-400 text-xs font-bold mb-1 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-amber-500" /> Active Target
            </label>
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-100 font-bold focus:outline-none focus:border-amber-500"
            >
              {combatants.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} (AC {c.armorClass}, HP {c.hpCurrent}/{c.hpMax}) {c.type === 'enemy' ? '[Enemy]' : '[Ally]'}
                </option>
              ))}
              <option value="manual">-- Manual Target AC --</option>
            </select>
          </div>

          {selectedTargetId === 'manual' && (
            <div>
              <label className="block text-stone-400 text-[11px] font-bold mb-1">Target Armor Class (AC)</label>
              <input
                type="number"
                value={manualTargetAc}
                onChange={(e) => setManualTargetAc(parseInt(e.target.value) || 10)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2 text-stone-100 font-mono text-xs"
              />
            </div>
          )}

          {/* Target Cover Modifier */}
          <div>
            <label className="block text-stone-400 text-xs font-bold mb-1">Target Cover Bonus</label>
            <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setCoverBonus(0)}
                className={`py-1.5 px-2 rounded-lg border text-[11px] transition ${
                  coverBonus === 0 ? 'bg-amber-600 text-stone-950 border-amber-400' : 'bg-stone-950 text-stone-400 border-stone-800'
                }`}
              >
                No Cover (+0 AC)
              </button>
              <button
                type="button"
                onClick={() => setCoverBonus(2)}
                className={`py-1.5 px-2 rounded-lg border text-[11px] transition ${
                  coverBonus === 2 ? 'bg-amber-600 text-stone-950 border-amber-400' : 'bg-stone-950 text-stone-400 border-stone-800'
                }`}
              >
                Half Cover (+2 AC)
              </button>
              <button
                type="button"
                onClick={() => setCoverBonus(5)}
                className={`py-1.5 px-2 rounded-lg border text-[11px] transition ${
                  coverBonus === 5 ? 'bg-amber-600 text-stone-950 border-amber-400' : 'bg-stone-950 text-stone-400 border-stone-800'
                }`}
              >
                3/4 Cover (+5 AC)
              </button>
            </div>
          </div>
        </div>

        {/* Right: Roll Mode & Resolution Button */}
        <div className="space-y-3 flex flex-col justify-between">
          <div>
            <label className="block text-stone-400 text-xs font-bold mb-1">Roll Mode</label>
            <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setRollMode('normal')}
                className={`py-2 rounded-xl border text-xs transition ${
                  rollMode === 'normal' ? 'bg-stone-800 text-amber-300 border-amber-500 shadow' : 'bg-stone-950 text-stone-400 border-stone-800'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setRollMode('advantage')}
                className={`py-2 rounded-xl border text-xs transition ${
                  rollMode === 'advantage' ? 'bg-emerald-900/80 text-emerald-200 border-emerald-500 shadow' : 'bg-stone-950 text-stone-400 border-stone-800'
                }`}
              >
                Advantage
              </button>
              <button
                type="button"
                onClick={() => setRollMode('disadvantage')}
                className={`py-2 rounded-xl border text-xs transition ${
                  rollMode === 'disadvantage' ? 'bg-rose-900/80 text-rose-200 border-rose-500 shadow' : 'bg-stone-950 text-stone-400 border-stone-800'
                }`}
              >
                Disadvantage
              </button>
            </div>
          </div>

          {/* Attacker Incapacitated Warning */}
          {attackerEffects.incapacitated && (
            <div className="bg-rose-950/80 border border-rose-500 p-2.5 rounded-xl text-xs space-y-1 font-mono text-rose-200">
              <strong className="text-rose-400 font-bold block flex items-center gap-1">
                <span>🚫 ATTACKER INCAPACITATED</span>
              </strong>
              <span>Attacker is Incapacitated / Paralyzed / Petrified / Stunned / Unconscious and cannot take Actions or Reactions.</span>
            </div>
          )}

          {/* Active Conditions Mechanical Impact */}
          {(advantageSources.length > 0 || disadvantageSources.length > 0) && (
            <div className="bg-amber-950/40 border border-amber-600/40 p-2.5 rounded-xl text-xs space-y-1 font-mono">
              <div className="font-bold text-amber-300 flex items-center justify-between">
                <span>⚡ Active Condition Modifiers:</span>
                <span className="uppercase text-[10px] bg-amber-900 text-amber-200 px-1.5 py-0.5 rounded border border-amber-500/40 font-extrabold">
                  {recommendedRollMode} Auto-Set
                </span>
              </div>
              <ul className="text-[11px] text-stone-300 space-y-0.5 list-disc list-inside">
                {advantageSources.map((s, i) => (
                  <li key={'adv-' + i} className="text-emerald-400">{s}</li>
                ))}
                {disadvantageSources.map((s, i) => (
                  <li key={'dis-' + i} className="text-rose-400">{s}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
              <label className="block text-stone-400 text-xs font-bold">Extra Attack Bonus (e.g. Bless +2)</label>
              {attackerEffects.extraAttackBonusItems.length > 0 && (
                <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/90 border border-cyan-500/50 px-2 py-0.5 rounded flex items-center gap-1 shadow">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Auto-applied: {attackerEffects.extraAttackBonusItems.join(', ')}
                </span>
              )}
            </div>
            <input
              type="number"
              value={extraBonus}
              onChange={(e) => setExtraBonus(parseInt(e.target.value) || 0)}
              className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2 text-stone-100 font-mono text-xs"
            />
          </div>

          <button
            onClick={handleRollAttack}
            className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-extrabold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 mt-2"
          >
            <Dices className="w-5 h-5" />
            <span>Roll Attack vs {targetNameStr} (AC {effectiveTargetAc})</span>
          </button>
        </div>
      </div>

      {/* Resolution Output Card */}
      {lastResult && (
        <div className={`p-4 rounded-xl border space-y-3 transition ${
          lastResult.isCrit
            ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-400/50 text-amber-100'
            : lastResult.isHit
            ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-100'
            : 'bg-rose-950/60 border-rose-600/60 text-rose-100'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-stone-800/60 pb-2">
            <div className="flex items-center gap-2 font-serif font-bold text-sm">
              {lastResult.isCrit ? (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300 animate-bounce" />
                  <span className="text-amber-300 text-base">CRITICAL HIT! (NAT 20)</span>
                </>
              ) : lastResult.isHit ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-300 text-base">{actionType === 'saving_throw' ? 'ACTION EXECUTED' : 'HIT!'}</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-400" />
                  <span className="text-rose-300 text-base">{lastResult.isNat1 ? 'NATURAL 1 - MISS!' : 'MISS!'}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!lastResult.canCrit ? (
                <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-500/50 px-2 py-0.5 rounded-full font-mono font-bold">
                  🛡️ Save / Direct (Cannot Crit)
                </span>
              ) : (
                <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded-full font-mono font-bold">
                  🎯 Attack Roll (Can Crit)
                </span>
              )}
              <div className="text-xs font-mono font-bold text-stone-300">
                Target AC: <strong className="text-stone-100">{lastResult.targetAc}</strong>
                {coverBonus > 0 && <span className="text-amber-400 ml-1">(+{coverBonus} Cover = {lastResult.effectiveTargetAc})</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="bg-stone-950/80 p-2 rounded border border-stone-800">
              <span className="text-stone-400 text-[10px] block">d20 Roll</span>
              <strong className="text-amber-300 text-sm">
                {lastResult.d20Roll2 !== undefined ? `[${lastResult.d20Roll1}, ${lastResult.d20Roll2}] -> ${lastResult.finalD20}` : lastResult.finalD20}
              </strong>
            </div>

            <div className="bg-stone-950/80 p-2 rounded border border-stone-800">
              <span className="text-stone-400 text-[10px] block">Total Attack</span>
              <strong className="text-stone-100 text-sm">{lastResult.totalAttack}</strong>
            </div>

            <div className="bg-stone-950/80 p-2 rounded border border-stone-800">
              <span className="text-stone-400 text-[10px] block">Action</span>
              <strong className="text-stone-200 text-xs truncate block">{lastResult.attackName}</strong>
            </div>

            <div className="bg-stone-950/80 p-2 rounded border border-stone-800">
              <span className="text-stone-400 text-[10px] block">Damage Formula</span>
              <strong className="text-amber-400 text-xs block truncate">{lastResult.damageExpr}</strong>
            </div>
          </div>

          {/* Roll Damage & Apply HP Section */}
          {lastResult.isHit && (
            <div className="pt-2 border-t border-stone-800/60 space-y-2">
              {!rolledDamage ? (
                <button
                  onClick={handleRollDamage}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                >
                  <Flame className="w-4 h-4" />
                  <span>Roll {lastResult.isCrit ? 'CRITICAL ' : ''}Damage ({lastResult.damageExpr})</span>
                </button>
              ) : (
                <div className="w-full space-y-2">
                  <div className="bg-stone-950/90 p-3 rounded-xl border border-amber-500/40 font-mono text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-300 font-bold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Multi-Source Damage Breakdown:
                      </span>
                      <strong className="text-amber-300 text-base font-extrabold">{rolledDamage.total} HP Total</strong>
                    </div>

                    {/* Display Individual Damage Components */}
                    <div className="flex flex-wrap gap-1.5">
                      {rolledDamage.parts.map((p, idx) => (
                        <div key={idx} className="bg-stone-900 border border-stone-800 px-2.5 py-1 rounded-lg text-xs flex items-center gap-1">
                          <span className="text-stone-200 font-bold">{p.formatted}</span>
                          <span className="text-amber-400 font-extrabold">({p.totalPart})</span>
                        </div>
                      ))}
                    </div>

                    <div className="text-[11px] text-stone-400">
                      Formula output: <code className="text-stone-200">{rolledDamage.breakdown}</code>
                    </div>

                    {/* Explanatory rules banners */}
                    {rolledDamage.isCrit && rolledDamage.canCrit && (
                      <div className="text-[11px] bg-amber-950/80 border border-amber-600/40 text-amber-300 p-2 rounded-lg font-sans">
                        ⚡ <strong>D&D 5e Crit Rule Applied:</strong> Attack roll hit critically! All damage dice in <code className="font-mono bg-amber-900/60 px-1 rounded">{lastResult.damageExpr}</code> were doubled (e.g. 1d8 slashing + 1d6 fire became 2d8 slashing + 2d6 fire). Flat numerical bonuses (+3) are added once and not doubled.
                      </div>
                    )}

                    {!rolledDamage.canCrit && (
                      <div className="text-[11px] bg-purple-950/80 border border-purple-600/40 text-purple-300 p-2 rounded-lg font-sans">
                        🛡️ <strong>Saving Throw / Utility Rule:</strong> Spells and features requiring a saving throw do not make attack rolls and cannot critically hit in D&D 5e. Standard damage dice were rolled without doubling.
                      </div>
                    )}
                  </div>

                  {lastResult.targetCombatantId && onApplyDamageToCombatant && (
                    <div className="flex justify-end">
                      <button
                        onClick={handleApplyDamage}
                        disabled={rolledDamage.applied}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow flex items-center gap-1.5 ${
                          rolledDamage.applied
                            ? 'bg-emerald-950 border border-emerald-600 text-emerald-400 cursor-default'
                            : 'bg-rose-700 hover:bg-rose-600 text-white'
                        }`}
                      >
                        {rolledDamage.applied ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Damage Applied to {lastResult.targetName}!</span>
                          </>
                        ) : (
                          <>
                            <Crosshair className="w-4 h-4" />
                            <span>Deduct -{rolledDamage.total} HP from {lastResult.targetName}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
