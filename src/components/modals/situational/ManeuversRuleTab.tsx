import React, { useState } from 'react';
import { CharacterData } from '../../../types';
import { Combatant } from '../../combat/encounter/encounterTypes';
import {
  calculate35eCombatManeuvers,
  formatModifier,
  getCharacterBab,
  getEffectiveAbilities,
  getAbilityModifier,
  get35eSizeManeuverModifier
} from '../../../utils/dndCalculations';
import {
  playDiceSound,
  playHitSound,
  playMissSound
} from '../../../utils/diceAudio';
import {
  Swords,
  Dices,
  Shield,
  Zap,
  CheckCircle2,
  ChevronRight,
  Info,
  Sparkles,
  Flame,
  ArrowRight,
  AlertTriangle,
  Move,
  Users
} from 'lucide-react';

interface ManeuversRuleTabProps {
  character: CharacterData;
  combatants?: Combatant[];
  allCharacters?: CharacterData[];
  activeCombatantId?: string;
  onUpdateCharacter?: (updated: CharacterData) => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
}

type ManeuverType = 'grapple' | 'trip' | 'disarm' | 'bullRush' | 'sunder';

export const ManeuversRuleTab: React.FC<ManeuversRuleTabProps> = ({
  character,
  combatants = [],
  allCharacters = [],
  activeCombatantId,
  onUpdateCharacter,
  onRoll
}) => {
  const [activeManeuver, setActiveManeuver] = useState<ManeuverType>('grapple');
  const [selectedAttackerId, setSelectedAttackerId] = useState<string>(activeCombatantId || 'active-char');
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [attackerWeaponCat, setAttackerWeaponCat] = useState<'twoHanded' | 'oneHanded' | 'light' | 'unarmed'>('oneHanded');
  const [defenderWeaponCat, setDefenderWeaponCat] = useState<'twoHanded' | 'oneHanded' | 'light'>('oneHanded');
  const [defenderSize, setDefenderSize] = useState<string>('Medium');
  const [defenderStrMod, setDefenderStrMod] = useState<number>(2);
  const [defenderBab, setDefenderBab] = useState<number>(3);
  const [defenderStability, setDefenderStability] = useState<boolean>(false);

  // Opposed check outcome state
  const [opposedOutcome, setOpposedOutcome] = useState<{
    maneuver: string;
    attackerRoll: number;
    attackerTotal: number;
    defenderRoll: number;
    defenderTotal: number;
    success: boolean;
    margin: number;
    notes: string;
  } | null>(null);

  // Determine active character object
  const activeChar = (selectedAttackerId === 'active-char' || !selectedAttackerId)
    ? character
    : allCharacters.find(ch => ch.id === selectedAttackerId) || character;

  const maneuvers = calculate35eCombatManeuvers(activeChar);

  const getAttackerWeaponBonus = () => {
    if (attackerWeaponCat === 'twoHanded') return 4;
    if (attackerWeaponCat === 'light' || attackerWeaponCat === 'unarmed') return -4;
    return 0;
  };

  const getDefenderWeaponBonus = () => {
    if (defenderWeaponCat === 'twoHanded') return 4;
    if (defenderWeaponCat === 'light') return -4;
    return 0;
  };

  const defenderSizeMod = get35eSizeManeuverModifier(defenderSize);

  const handleToggleFeat = (featKey: keyof NonNullable<CharacterData['improvedManeuvers']>) => {
    if (!onUpdateCharacter) return;
    const current = activeChar.improvedManeuvers || {};
    const updated = {
      ...current,
      [featKey]: !current[featKey]
    };
    onUpdateCharacter({
      ...activeChar,
      improvedManeuvers: updated
    });
  };

  const handleRollSingle = (label: string, bonus: number) => {
    playDiceSound();
    if (onRoll) {
      onRoll(`[Combat Maneuver] ${label}`, 20, 1, bonus, 'normal');
    }
  };

  // Run full opposed simulation
  const handleResolveOpposed = (type: ManeuverType) => {
    playDiceSound();
    const atkD20 = Math.floor(Math.random() * 20) + 1;
    const defD20 = Math.floor(Math.random() * 20) + 1;

    let atkMod = 0;
    let defMod = 0;
    let notes = '';

    if (type === 'grapple') {
      atkMod = maneuvers.grapple.checkBonus;
      defMod = defenderBab + defenderStrMod + defenderSizeMod;
      const atkTotal = atkD20 + atkMod;
      const defTotal = defD20 + defMod;
      const success = atkTotal >= defTotal;
      const margin = atkTotal - defTotal;
      notes = success
        ? `Grapple hold established! Both combatants are grappled (lose Dex bonus to AC vs third parties). Attacker can pin, damage, or move opponent on subsequent actions.`
        : `Grapple attempt thwarted. Opponent broke free or prevented the hold.`;

      if (success) playHitSound(false);
      else playMissSound();

      setOpposedOutcome({
        maneuver: 'Grapple Check',
        attackerRoll: atkD20,
        attackerTotal: atkTotal,
        defenderRoll: defD20,
        defenderTotal: defTotal,
        success,
        margin,
        notes
      });
      return;
    }

    if (type === 'trip') {
      atkMod = maneuvers.trip.checkBonus;
      defMod = defenderStrMod + defenderSizeMod + (defenderStability ? 4 : 0);
      const atkTotal = atkD20 + atkMod;
      const defTotal = defD20 + defMod;
      const success = atkTotal >= defTotal;
      const margin = atkTotal - defTotal;
      notes = success
        ? `Trip successful! Defender is knocked PRONE (-4 melee attack, -4 AC vs melee, +4 AC vs ranged).${maneuvers.trip.improvedFeatActive ? ' Improved Trip grants an immediate free melee attack!' : ''}`
        : `Trip failed! (Defender may immediately react with an opposed check to trip the attacker!).`;

      if (success) playHitSound(false);
      else playMissSound();

      setOpposedOutcome({
        maneuver: 'Trip Check',
        attackerRoll: atkD20,
        attackerTotal: atkTotal,
        defenderRoll: defD20,
        defenderTotal: defTotal,
        success,
        margin,
        notes
      });
      return;
    }

    if (type === 'disarm') {
      atkMod = maneuvers.disarm.checkBonus + getAttackerWeaponBonus();
      defMod = defenderBab + defenderStrMod + getDefenderWeaponBonus();
      const atkTotal = atkD20 + atkMod;
      const defTotal = defD20 + defMod;
      const success = atkTotal >= defTotal;
      const margin = atkTotal - defTotal;
      notes = success
        ? `Disarm successful! Defender’s weapon or item flies from their grip and lands at their feet (or in attacker’s free hand if unarmed attempt).`
        : `Disarm failed!${!maneuvers.disarm.improvedFeatActive ? ' Defender may immediately make a free counter-disarm attempt!' : ''}`;

      if (success) playHitSound(false);
      else playMissSound();

      setOpposedOutcome({
        maneuver: 'Disarm Check',
        attackerRoll: atkD20,
        attackerTotal: atkTotal,
        defenderRoll: defD20,
        defenderTotal: defTotal,
        success,
        margin,
        notes
      });
      return;
    }

    if (type === 'bullRush') {
      atkMod = maneuvers.bullRush.checkBonus + (isCharging ? 2 : 0);
      defMod = defenderStrMod + defenderSizeMod + (defenderStability ? 4 : 0);
      const atkTotal = atkD20 + atkMod;
      const defTotal = defD20 + defMod;
      const success = atkTotal >= defTotal;
      const margin = atkTotal - defTotal;
      const pushFeet = success ? 5 + Math.floor(margin / 5) * 5 : 0;
      notes = success
        ? `Bull Rush successful! Opponent is pushed back ${pushFeet} ft. Attacker may move with them if desired without provoking AoOs.`
        : `Bull Rush failed! Attacker is halted in front of opponent.`;

      if (success) playHitSound(false);
      else playMissSound();

      setOpposedOutcome({
        maneuver: 'Bull Rush Check',
        attackerRoll: atkD20,
        attackerTotal: atkTotal,
        defenderRoll: defD20,
        defenderTotal: defTotal,
        success,
        margin,
        notes
      });
      return;
    }

    if (type === 'sunder') {
      atkMod = maneuvers.sunder.checkBonus + getAttackerWeaponBonus();
      defMod = defenderBab + defenderStrMod + getDefenderWeaponBonus();
      const atkTotal = atkD20 + atkMod;
      const defTotal = defD20 + defMod;
      const success = atkTotal >= defTotal;
      const margin = atkTotal - defTotal;
      notes = success
        ? `Sunder hit successful! Roll weapon damage against the target item. Subtract item Hardness; remaining damage reduces item HP.`
        : `Sunder attack parried or missed the target item.`;

      if (success) playHitSound(false);
      else playMissSound();

      setOpposedOutcome({
        maneuver: 'Sunder Check',
        attackerRoll: atkD20,
        attackerTotal: atkTotal,
        defenderRoll: defD20,
        defenderTotal: defTotal,
        success,
        margin,
        notes
      });
      return;
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif font-bold text-amber-200 text-sm sm:text-base">
              Special Combat Maneuvers (D&D 3.5e PHB p. 154-159 & 5e Contests)
            </h3>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Opposed rolls for tactical actions with automated BAB, Size, Feats, and weapon categories.
          </p>
        </div>

        {/* Attacker selector if combatants exist */}
        {combatants.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <Users className="w-4 h-4 text-stone-400" />
            <select
              value={selectedAttackerId}
              onChange={(e) => setSelectedAttackerId(e.target.value)}
              className="bg-stone-900 border border-stone-700 text-amber-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
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

      {/* Maneuver Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { id: 'grapple' as const, label: 'Grapple', icon: '🤼', bonus: maneuvers.grapple.checkBonus },
          { id: 'trip' as const, label: 'Trip', icon: '🦵', bonus: maneuvers.trip.checkBonus },
          { id: 'disarm' as const, label: 'Disarm', icon: '⚔️', bonus: maneuvers.disarm.checkBonus },
          { id: 'bullRush' as const, label: 'Bull Rush', icon: '🐂', bonus: maneuvers.bullRush.checkBonus },
          { id: 'sunder' as const, label: 'Sunder', icon: '🔨', bonus: maneuvers.sunder.checkBonus },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveManeuver(tab.id);
              setOpposedOutcome(null);
            }}
            className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
              activeManeuver === tab.id
                ? 'bg-amber-950/60 border-amber-500/80 text-amber-200 shadow-md ring-1 ring-amber-500/30'
                : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-base">{tab.icon}</span>
              <span className="font-mono text-xs font-bold text-amber-400">
                {formatModifier(tab.bonus)}
              </span>
            </div>
            <span className="font-bold text-xs mt-1 text-stone-200">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Attacker Feat & Stance Toggles */}
      <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Attacker Feats & Stance
          </span>
          <span className="text-[11px] text-stone-400 font-mono">
            Attacker Size: <strong className="text-amber-300">{activeChar.sizeCategory || 'Medium'}</strong> ({formatModifier(maneuvers.sizeModifier)})
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleToggleFeat('improvedGrapple')}
            className={`px-3 py-1.5 rounded-lg border text-left font-mono transition flex items-center justify-between ${
              activeChar.improvedManeuvers?.improvedGrapple
                ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-300'
            }`}
          >
            <span>Imp Grapple (+4)</span>
            {activeChar.improvedManeuvers?.improvedGrapple && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={() => handleToggleFeat('improvedTrip')}
            className={`px-3 py-1.5 rounded-lg border text-left font-mono transition flex items-center justify-between ${
              activeChar.improvedManeuvers?.improvedTrip
                ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-300'
            }`}
          >
            <span>Imp Trip (+4)</span>
            {activeChar.improvedManeuvers?.improvedTrip && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={() => handleToggleFeat('improvedDisarm')}
            className={`px-3 py-1.5 rounded-lg border text-left font-mono transition flex items-center justify-between ${
              activeChar.improvedManeuvers?.improvedDisarm
                ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-300'
            }`}
          >
            <span>Imp Disarm (+4)</span>
            {activeChar.improvedManeuvers?.improvedDisarm && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={() => handleToggleFeat('improvedBullRush')}
            className={`px-3 py-1.5 rounded-lg border text-left font-mono transition flex items-center justify-between ${
              activeChar.improvedManeuvers?.improvedBullRush
                ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-300'
            }`}
          >
            <span>Imp Bull Rush (+4)</span>
            {activeChar.improvedManeuvers?.improvedBullRush && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Maneuver Details & Interactive Opposed Roller */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column: Maneuver Rules & Attacker Check */}
        <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <h4 className="font-serif font-bold text-amber-300 text-sm flex items-center gap-2">
              <span>{activeManeuver.toUpperCase()}</span>
              <span className="text-[10px] text-stone-400 font-mono">
                {activeChar.name}
              </span>
            </h4>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              (maneuvers as any)[activeManeuver]?.provokesAoO
                ? 'bg-rose-950 border border-rose-600/60 text-rose-300'
                : 'bg-emerald-950 border border-emerald-600/60 text-emerald-300'
            }`}>
              {(maneuvers as any)[activeManeuver]?.provokesAoO ? '⚠️ Provokes AoO' : '🛡️ No AoO (Feat)'}
            </span>
          </div>

          <p className="text-xs text-stone-300 leading-relaxed">
            {(maneuvers as any)[activeManeuver]?.description}
          </p>

          <div className="p-3 rounded-lg bg-stone-900 border border-stone-800 font-mono text-xs space-y-1 text-stone-300">
            <div className="text-stone-400 text-[11px]">Formula Breakdown:</div>
            <div className="text-amber-300 font-bold">
              {(maneuvers as any)[activeManeuver]?.formula}
            </div>
            {activeManeuver === 'bullRush' && (
              <label className="flex items-center gap-2 pt-1 cursor-pointer text-amber-300">
                <input
                  type="checkbox"
                  checked={isCharging}
                  onChange={(e) => setIsCharging(e.target.checked)}
                  className="rounded border-stone-700 bg-stone-800 text-amber-600"
                />
                <span>Charging (+2 bonus to Bull Rush check)</span>
              </label>
            )}
            {(activeManeuver === 'disarm' || activeManeuver === 'sunder') && (
              <div className="pt-2 flex items-center gap-2">
                <span className="text-stone-400 text-[11px]">Attacker Weapon:</span>
                <select
                  value={attackerWeaponCat}
                  onChange={(e: any) => setAttackerWeaponCat(e.target.value)}
                  className="bg-stone-800 border border-stone-700 text-xs rounded px-2 py-0.5 text-amber-200"
                >
                  <option value="twoHanded">Two-Handed (+4)</option>
                  <option value="oneHanded">One-Handed (+0)</option>
                  <option value="light">Light (-4)</option>
                  <option value="unarmed">Unarmed (-4)</option>
                </select>
              </div>
            )}
          </div>

          {/* Quick Roll Attacker Check */}
          <div className="flex gap-2">
            {activeManeuver === 'trip' && (
              <button
                type="button"
                onClick={() => handleRollSingle('Trip Touch Attack', maneuvers.trip.touchAttackBonus)}
                className="flex-1 py-2 px-3 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded-lg text-xs font-mono font-bold text-amber-300 flex items-center justify-center gap-1.5 transition"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>Touch Atk ({formatModifier(maneuvers.trip.touchAttackBonus)})</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => handleRollSingle(`${activeManeuver} Check`, (maneuvers as any)[activeManeuver]?.checkBonus + (activeManeuver === 'bullRush' && isCharging ? 2 : 0) + (activeManeuver === 'disarm' ? getAttackerWeaponBonus() : 0))}
              className="flex-1 py-2 px-3 bg-amber-950/80 hover:bg-amber-900/80 border border-amber-600/60 rounded-lg text-xs font-mono font-bold text-amber-200 flex items-center justify-center gap-1.5 transition"
            >
              <Dices className="w-3.5 h-3.5" />
              <span>Roll Check ({formatModifier((maneuvers as any)[activeManeuver]?.checkBonus + (activeManeuver === 'bullRush' && isCharging ? 2 : 0) + (activeManeuver === 'disarm' ? getAttackerWeaponBonus() : 0))})</span>
            </button>
          </div>
        </div>

        {/* Right Column: Defender Config & Opposed Simulation */}
        <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <h4 className="font-serif font-bold text-stone-200 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-stone-400" />
              <span>Defender Opposed Parameters</span>
            </h4>
            <span className="text-[10px] text-stone-400 font-mono">Opponent</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-stone-400 block mb-1">Defender Size</label>
              <select
                value={defenderSize}
                onChange={(e) => setDefenderSize(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 text-stone-200 rounded-lg px-2.5 py-1.5 font-mono"
              >
                <option value="Colossal">Colossal (+16)</option>
                <option value="Gargantuan">Gargantuan (+12)</option>
                <option value="Huge">Huge (+8)</option>
                <option value="Large">Large (+4)</option>
                <option value="Medium">Medium (+0)</option>
                <option value="Small">Small (-4)</option>
                <option value="Tiny">Tiny (-8)</option>
              </select>
            </div>

            <div>
              <label className="text-stone-400 block mb-1">Defender STR Mod</label>
              <input
                type="number"
                value={defenderStrMod}
                onChange={(e) => setDefenderStrMod(parseInt(e.target.value) || 0)}
                className="w-full bg-stone-900 border border-stone-700 text-stone-200 rounded-lg px-2.5 py-1.5 font-mono"
              />
            </div>

            <div>
              <label className="text-stone-400 block mb-1">Defender Base Atk (BAB)</label>
              <input
                type="number"
                value={defenderBab}
                onChange={(e) => setDefenderBab(parseInt(e.target.value) || 0)}
                className="w-full bg-stone-900 border border-stone-700 text-stone-200 rounded-lg px-2.5 py-1.5 font-mono"
              />
            </div>

            <div>
              {(activeManeuver === 'trip' || activeManeuver === 'bullRush') ? (
                <div>
                  <label className="text-stone-400 block mb-1">Stability Bonus</label>
                  <label className="flex items-center gap-1.5 pt-1 text-stone-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={defenderStability}
                      onChange={(e) => setDefenderStability(e.target.checked)}
                      className="rounded border-stone-700 bg-stone-900 text-amber-500"
                    />
                    <span>4+ Legs / Dwarf (+4)</span>
                  </label>
                </div>
              ) : (
                <div>
                  <label className="text-stone-400 block mb-1">Defender Weapon</label>
                  <select
                    value={defenderWeaponCat}
                    onChange={(e: any) => setDefenderWeaponCat(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 text-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                  >
                    <option value="twoHanded">Two-Handed (+4)</option>
                    <option value="oneHanded">One-Handed (+0)</option>
                    <option value="light">Light (-4)</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Opposed Roll Button */}
          <button
            type="button"
            onClick={() => handleResolveOpposed(activeManeuver)}
            className="w-full py-2.5 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-stone-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition"
          >
            <Dices className="w-4 h-4" />
            <span>Simulate Full Opposed {activeManeuver.toUpperCase()} Roll</span>
          </button>

          {/* Simulation Outcome Box */}
          {opposedOutcome && (
            <div className={`p-3 rounded-xl border text-xs space-y-1.5 font-mono ${
              opposedOutcome.success
                ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-200'
                : 'bg-rose-950/60 border-rose-600/60 text-rose-200'
            }`}>
              <div className="flex items-center justify-between font-bold">
                <span>{opposedOutcome.maneuver} Outcome:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-sans ${
                  opposedOutcome.success ? 'bg-emerald-800 text-emerald-100' : 'bg-rose-800 text-rose-100'
                }`}>
                  {opposedOutcome.success ? 'SUCCESS' : 'FAILED'}
                </span>
              </div>
              <div className="text-[11px] text-stone-300">
                Attacker: <strong className="text-amber-300">d20 ({opposedOutcome.attackerRoll})</strong> = {opposedOutcome.attackerTotal} vs Defender: <strong className="text-stone-300">d20 ({opposedOutcome.defenderRoll})</strong> = {opposedOutcome.defenderTotal}
                {' '}(Margin: {opposedOutcome.margin > 0 ? `+${opposedOutcome.margin}` : opposedOutcome.margin})
              </div>
              <p className="text-[11px] font-sans text-stone-200 pt-1 border-t border-stone-800/60">
                {opposedOutcome.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
