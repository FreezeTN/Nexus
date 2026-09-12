import React, { useState } from 'react';
import { CharacterData } from '../../../types';
import { Combatant } from '../../combat/encounter/encounterTypes';
import {
  OFFICIAL_35E_RIDE_MANEUVERS,
  get35eRideBonus,
  roll35eMountedCombatHitNegation,
  getSavingThrowDetails,
  getEffectiveSpeed,
  getAbilityModifier,
  getEffectiveAbilities,
  formatModifier,
  getSkillBonus
} from '../../../utils/dndCalculations';
import { playDiceSound, playHitSound, playMissSound } from '../../../utils/diceAudio';
import {
  Shield,
  ShieldAlert,
  Dices,
  Footprints,
  AlertTriangle,
  CheckCircle2,
  Zap,
  ArrowRight,
  Info,
  Swords,
  ChevronRight,
  RotateCcw
} from 'lucide-react';

interface MountedCombatRuleTabProps {
  character: CharacterData;
  combatants?: Combatant[];
  allCharacters?: CharacterData[];
  activeCombatantId?: string;
  onUpdateCharacter?: (updated: CharacterData) => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
}

export const MountedCombatRuleTab: React.FC<MountedCombatRuleTabProps> = ({
  character,
  combatants = [],
  allCharacters = [],
  activeCombatantId,
  onUpdateCharacter,
  onRoll
}) => {
  const is35e = character.edition === '3.5e';
  const [activeEditionTab, setActiveEditionTab] = useState<'5e' | '3.5e'>(is35e ? '3.5e' : '5e');
  const [mountControlMode, setMountControlMode] = useState<'controlled' | 'independent'>('controlled');
  const [rollResultNotice, setRollResultNotice] = useState<string | null>(null);

  // Speed and mount metrics
  const isMounted = Boolean(character.isMounted);
  const speedInfo = getEffectiveSpeed(character);
  const riderSpeed = speedInfo.effectiveSpeed || 30;
  const mountCostSpeed = Math.floor(riderSpeed / 2);
  const mountName = character.mountInfo?.name || 'Heavy Warhorse';
  const mountSpeed = character.mountInfo?.speed || (activeEditionTab === '5e' ? '60 ft.' : '50 ft.');

  // 5e Dex Save & Animal Handling
  const dexSaveDetails = getSavingThrowDetails('DEX', character);
  const dexSaveBonus = dexSaveDetails.bonus;
  const abilities = getEffectiveAbilities(character);
  const wisMod = getAbilityModifier(abilities.WIS?.score || 10);
  const animalHandlingSkill = character.skills?.find(s => s.name.toLowerCase().includes('animal'));
  const animalHandlingBonus = animalHandlingSkill
    ? getSkillBonus(animalHandlingSkill, abilities, character.level || 1, character)
    : wisMod;

  // 3.5e Ride Bonus
  const rideBonusInfo = get35eRideBonus(character);

  // 5e Roll DC 10 Dexterity Saving Throw
  const handleRoll5eDexSave = () => {
    playDiceSound();
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + dexSaveBonus;
    const passed = total >= 10;
    const conds = character.conditions || [];

    if (passed) {
      playHitSound(false);
      const msg = `DC 10 DEX Save: Succeeded! Rolled ${d20} + ${dexSaveBonus} = ${total} vs DC 10. Stayed in the saddle!`;
      setRollResultNotice(msg);
      if (onRoll) {
        onRoll('DC 10 DEX Save: Stay Mounted (5e PHB p. 198)', 20, 1, dexSaveBonus, 'normal');
      }
    } else {
      playMissSound();
      const msg = `DC 10 DEX Save: Failed! Rolled ${d20} + ${dexSaveBonus} = ${total} vs DC 10. Fell off mount and landed prone in a space within 5 feet!`;
      setRollResultNotice(msg);
      if (onUpdateCharacter) {
        onUpdateCharacter({
          ...character,
          isMounted: false,
          conditions: Array.from(new Set([...conds, 'Prone']))
        });
      }
      if (onRoll) {
        onRoll('DC 10 DEX Save: Fell off Mount & Landed Prone (5e PHB p. 198)', 20, 1, dexSaveBonus, 'normal');
      }
    }
  };

  // 5e Reaction when mount is knocked prone
  const handle5eMountProneReaction = (usedReaction: boolean) => {
    const conds = character.conditions || [];
    if (usedReaction) {
      if (onUpdateCharacter) {
        onUpdateCharacter({
          ...character,
          isMounted: false,
          actionEconomy: {
            ...character.actionEconomy,
            reactionUsed5e: true
          }
        });
      }
      setRollResultNotice('Reaction Used: Dismounted as mount fell prone and safely landed on your feet!');
      if (onRoll) {
        onRoll('Reaction: Land on Feet as Mount Falls', 20, 1, 0, 'normal');
      }
    } else {
      if (onUpdateCharacter) {
        onUpdateCharacter({
          ...character,
          isMounted: false,
          conditions: Array.from(new Set([...conds, 'Prone']))
        });
      }
      setRollResultNotice('No Reaction Used: Dismounted as mount fell prone and landed PRONE within 5 feet.');
      if (onRoll) {
        onRoll('Mount Knocked Prone: Landed Prone', 20, 1, 0, 'normal');
      }
    }
  };

  // 5e Animal Handling Roll
  const handleRoll5eAnimalHandling = () => {
    playDiceSound();
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + animalHandlingBonus;
    setRollResultNotice(`Animal Handling Check: Rolled ${d20} + ${animalHandlingBonus} = ${total}.`);
    if (onRoll) {
      onRoll('Animal Handling (Controlling Mount)', 20, 1, animalHandlingBonus, 'normal');
    }
  };

  // 5e Controlled mount actions
  const handleControlledAction = (act: 'dash' | 'disengage' | 'dodge') => {
    let msg = '';
    if (act === 'dash') {
      msg = `Controlled Mount takes DASH Action: Speed doubled to ${parseInt(mountSpeed, 10) * 2 || 120} ft for this turn!`;
    } else if (act === 'disengage') {
      msg = `Controlled Mount takes DISENGAGE Action: Movement provokes NO opportunity attacks for the rest of the turn!`;
    } else {
      msg = `Controlled Mount takes DODGE Action: Attacks against mount have Disadvantage; mount has Advantage on DEX saves!`;
    }
    setRollResultNotice(msg);
    if (onRoll) {
      onRoll(`Mount Action: ${act.toUpperCase()}`, 20, 1, 0, 'normal');
    }
  };

  // Toggle mount state
  const handleToggleMounted = () => {
    const nextMounted = !isMounted;
    if (onUpdateCharacter) {
      onUpdateCharacter({
        ...character,
        isMounted: nextMounted
      });
    }
    setRollResultNotice(
      nextMounted
        ? `Mounted up on ${mountName}! (${activeEditionTab === '5e' ? `Costs half speed: ${mountCostSpeed} ft` : 'Standard action'})`
        : `Dismounted from ${mountName}. (${activeEditionTab === '5e' ? `Costs half speed: ${mountCostSpeed} ft` : 'Standard action'})`
    );
  };

  // 3.5e Maneuver check
  const handleRoll35eManeuver = (maneuver: typeof OFFICIAL_35E_RIDE_MANEUVERS[0]) => {
    playDiceSound();
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + rideBonusInfo.total;
    const passed = total >= maneuver.dc;
    if (passed) playHitSound(false);
    else playMissSound();
    const msg = passed
      ? `Ride: ${maneuver.name} Succeeded! Rolled ${d20} + ${rideBonusInfo.total} = ${total} vs DC ${maneuver.dc}.`
      : `Ride: ${maneuver.name} Failed! Rolled ${d20} + ${rideBonusInfo.total} = ${total} vs DC ${maneuver.dc}.`;
    setRollResultNotice(msg);
    if (onRoll) {
      onRoll(`Ride Check: ${maneuver.name} (DC ${maneuver.dc})`, 20, 1, rideBonusInfo.total, 'normal');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Edition Switcher */}
      <div className="bg-stone-900/90 p-4 rounded-xl border border-stone-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-serif font-black text-amber-200">Mounted Combat</h3>
            <span className="text-[10px] font-mono font-bold bg-amber-950 border border-amber-700/60 text-amber-300 px-2 py-0.5 rounded-full">
              {activeEditionTab === '5e' ? '5e PHB p. 198' : '3.5e PHB p. 80, 98'}
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-0.5">
            {activeEditionTab === '5e'
              ? 'Mounting speed costs, DC 10 Dexterity saves, reaction dismounts, and controlled vs. independent mounts.'
              : 'Ride maneuvers, mounted charge multipliers (Lance/Spirited Charge), and opposed Ride checks.'}
          </p>
        </div>

        {/* Ruleset Toggle */}
        <div className="flex items-center gap-1 bg-stone-950 border border-stone-800 rounded-lg p-1 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveEditionTab('5e')}
            className={`px-3 py-1 rounded font-bold transition cursor-pointer ${
              activeEditionTab === '5e'
                ? 'bg-amber-600 text-stone-950 shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            5e Rules
          </button>
          <button
            type="button"
            onClick={() => setActiveEditionTab('3.5e')}
            className={`px-3 py-1 rounded font-bold transition cursor-pointer ${
              activeEditionTab === '3.5e'
                ? 'bg-amber-600 text-stone-950 shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            3.5e Rules
          </button>
        </div>
      </div>

      {/* Live Feedback Banner */}
      {rollResultNotice && (
        <div className="p-3 bg-amber-950/40 border border-amber-600/50 rounded-xl text-xs text-amber-200 flex items-start gap-2 animate-fadeIn">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>{rollResultNotice}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5E MOUNTED COMBAT (PHB p. 198)                                            */}
      {/* ========================================================================= */}
      {activeEditionTab === '5e' && (
        <div className="space-y-4">
          {/* Section 1: Mounting and Dismounting */}
          <div className="bg-stone-900/80 p-4 rounded-xl border border-stone-800 space-y-2.5">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <div className="font-bold text-sm text-amber-300 flex items-center gap-2">
                <Footprints className="w-4 h-4 text-amber-400" />
                <span>Mounting & Dismounting Speed Cost</span>
              </div>
              <span className="text-xs font-mono text-stone-400">
                Speed: <b className="text-sky-300">{riderSpeed} ft</b> • Mount Cost: <b className="text-amber-400">{mountCostSpeed} ft (½ Speed)</b>
              </span>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Once during your move, you can mount a creature that is within 5 feet of you or dismount. Doing so costs an amount of movement equal to <b>half your speed</b>. For example, if your speed is 30 feet, you must spend 15 feet of movement to mount a horse. Therefore, you can't mount it if you don't have 15 feet of movement left or if your speed is 0.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleToggleMounted}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow ${
                  isMounted
                    ? 'bg-amber-950 hover:bg-amber-900 text-amber-200 border border-amber-600'
                    : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-600'
                }`}
              >
                <ArrowRight className="w-4 h-4" />
                <span>{isMounted ? `Dismount (Costs ${mountCostSpeed} ft)` : `Mount Steed (Costs ${mountCostSpeed} ft)`}</span>
              </button>
              <span className="text-xs text-stone-400 font-mono">
                Current Status: {isMounted ? <b className="text-emerald-400 font-bold">Mounted ({mountName})</b> : <b className="text-stone-400">On Foot</b>}
              </span>
            </div>
          </div>

          {/* Section 2: Dismount Hazards & Reactions */}
          <div className="bg-stone-900/80 p-4 rounded-xl border border-stone-800 space-y-3">
            <div className="font-bold text-sm text-rose-300 flex items-center gap-2 border-b border-stone-800 pb-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Dismount Hazards, Saving Throws & Reactions</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* DC 10 Dexterity Saving Throw */}
              <div className="bg-stone-950 p-3 rounded-lg border border-stone-800 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-amber-200">DC 10 Dexterity Saving Throw</span>
                    <span className="text-[10px] font-mono text-stone-400">
                      Dex Save: <b className="text-emerald-400">{formatModifier(dexSaveBonus)}</b>
                    </span>
                  </div>
                  <p className="text-xs text-stone-300 mt-1 leading-snug">
                    If an effect <b>moves your mount against its will</b> while you're on it, or if you are <b>knocked prone</b> while mounted, you must succeed on a DC 10 Dexterity saving throw or fall off the mount, landing <b>prone</b> in a space within 5 feet of it.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRoll5eDexSave}
                  className="w-full py-1.5 bg-stone-800 hover:bg-amber-950 border border-stone-700 hover:border-amber-600 text-amber-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm mt-2"
                >
                  <Dices className="w-4 h-4 text-amber-400" />
                  <span>Roll DC 10 DEX Save ({formatModifier(dexSaveBonus)})</span>
                </button>
              </div>

              {/* Mount Knocked Prone Reaction */}
              <div className="bg-stone-950 p-3 rounded-lg border border-stone-800 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-rose-300">Mount Knocked Prone</span>
                    <span className="text-[10px] font-mono text-stone-400">Reaction</span>
                  </div>
                  <p className="text-xs text-stone-300 mt-1 leading-snug">
                    If your mount is knocked prone, you can use your <b>reaction</b> to dismount it as it falls and <b>land on your feet</b>. Otherwise, you are dismounted and fall prone in a space within 5 feet of it.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => handle5eMountProneReaction(true)}
                    className="py-1.5 px-2 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600 text-emerald-200 rounded-lg text-xs font-mono font-bold transition cursor-pointer text-center"
                    title="Spend reaction to land standing on your feet"
                  >
                    Reaction: Land on Feet
                  </button>
                  <button
                    type="button"
                    onClick={() => handle5eMountProneReaction(false)}
                    className="py-1.5 px-2 bg-rose-950 hover:bg-rose-900 border border-rose-600 text-rose-200 rounded-lg text-xs font-mono font-bold transition cursor-pointer text-center"
                    title="No reaction: Fall prone within 5 feet"
                  >
                    Fall Prone with Mount
                  </button>
                </div>
              </div>
            </div>

            {/* Opportunity Attacks Callout */}
            <div className="p-3 bg-stone-950 rounded-lg border border-stone-800 flex items-start gap-2 text-xs text-stone-300">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <b className="text-amber-300">Opportunity Attacks on Mounts:</b> In either case, if the mount provokes an opportunity attack while you're on it, the attacker can choose to target <b>YOU or the MOUNT</b>.
              </div>
            </div>

            {/* Animal Handling Check */}
            <div className="flex items-center justify-between bg-stone-950 p-2.5 rounded-lg border border-stone-800">
              <div>
                <span className="font-bold text-xs text-stone-200 block">Animal Handling Check (Wisdom)</span>
                <span className="text-[10px] text-stone-400">
                  Modifier: <b className="text-sky-300 font-mono">{formatModifier(animalHandlingBonus)}</b> • Calm a panicked mount, execute daring maneuvers, or direct untrained beasts
                </span>
              </div>
              <button
                type="button"
                onClick={handleRoll5eAnimalHandling}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-sky-200 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer border border-stone-700"
              >
                <Dices className="w-4 h-4 text-sky-400" />
                <span>Roll ({formatModifier(animalHandlingBonus)})</span>
              </button>
            </div>
          </div>

          {/* Section 3: Controlling a Mount */}
          <div className="bg-stone-900/80 p-4 rounded-xl border border-stone-800 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <div className="font-bold text-sm text-stone-200 flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-400" />
                <span>Controlling a Mount (PHB p. 198)</span>
              </div>
              <div className="flex items-center gap-1 bg-stone-950 border border-stone-700 rounded-lg p-0.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setMountControlMode('controlled')}
                  className={`px-2.5 py-1 rounded transition cursor-pointer font-bold ${
                    mountControlMode === 'controlled'
                      ? 'bg-sky-600 text-stone-950'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Controlled Mount
                </button>
                <button
                  type="button"
                  onClick={() => setMountControlMode('independent')}
                  className={`px-2.5 py-1 rounded transition cursor-pointer font-bold ${
                    mountControlMode === 'independent'
                      ? 'bg-amber-600 text-stone-950'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Independent Mount
                </button>
              </div>
            </div>

            {mountControlMode === 'controlled' ? (
              <div className="space-y-3">
                <p className="text-xs text-stone-300 leading-relaxed">
                  You can control a mount only if it has been trained to accept a rider. Domesticated horses, donkeys, and similar creatures are assumed to have such training. The initiative of a controlled mount <b>changes to match yours</b> when you mount it. It moves as you direct it, and it has only <b>three action options</b>: Dash, Disengage, and Dodge. A controlled mount can move and act even on the turn that you mount it.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Dash */}
                  <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800 flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-xs text-amber-300">Dash Action</div>
                      <div className="text-[11px] text-stone-400 mt-1">
                        Mount doubles its speed for this turn ({mountSpeed} → extra movement).
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleControlledAction('dash')}
                      className="mt-2.5 py-1 px-2 bg-stone-800 hover:bg-stone-700 text-amber-200 rounded text-xs font-mono font-bold transition flex items-center justify-center gap-1 cursor-pointer border border-stone-700"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Take Dash</span>
                    </button>
                  </div>

                  {/* Disengage */}
                  <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800 flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-xs text-sky-300">Disengage Action</div>
                      <div className="text-[11px] text-stone-400 mt-1">
                        Mount's movement provokes <b>no opportunity attacks</b> for rest of turn.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleControlledAction('disengage')}
                      className="mt-2.5 py-1 px-2 bg-stone-800 hover:bg-stone-700 text-sky-200 rounded text-xs font-mono font-bold transition flex items-center justify-center gap-1 cursor-pointer border border-stone-700"
                    >
                      <Shield className="w-3.5 h-3.5 text-sky-400" />
                      <span>Take Disengage</span>
                    </button>
                  </div>

                  {/* Dodge */}
                  <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800 flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-xs text-emerald-300">Dodge Action</div>
                      <div className="text-[11px] text-stone-400 mt-1">
                        Attacks vs mount have <b>disadvantage</b>; mount has <b>advantage on DEX saves</b>.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleControlledAction('dodge')}
                      className="mt-2.5 py-1 px-2 bg-stone-800 hover:bg-stone-700 text-emerald-200 rounded text-xs font-mono font-bold transition flex items-center justify-center gap-1 cursor-pointer border border-stone-700"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Take Dodge</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 bg-stone-950 p-3.5 rounded-lg border border-stone-800 text-xs text-stone-300">
                <p className="leading-relaxed">
                  An independent mount <b>retains its place in the initiative order</b>. Bearing a rider puts <b>no restrictions</b> on the actions the mount can take, and it moves and acts as it wishes. It might flee from combat, decide to attack and devour a badly injured foe, or otherwise act against your wishes. Intelligent creatures, such as dragons, act independently.
                </p>
                <div className="p-2 bg-stone-900 rounded border border-stone-800 text-[11px] text-stone-400">
                  Tip: Use the Mount attack actions on your sheet or the Animal Handling check above if you wish to guide or persuade an independent mount.
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Mounted Combatant Feat (PHB p. 168) */}
          <div className="bg-stone-900/80 p-4 rounded-xl border border-amber-600/40 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <label className="font-bold text-sm text-amber-300 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(character.hasMountedCombatFeat)}
                  onChange={(e) => {
                    if (onUpdateCharacter) {
                      onUpdateCharacter({
                        ...character,
                        hasMountedCombatFeat: e.target.checked
                      });
                    }
                  }}
                  className="rounded bg-stone-800 border-stone-600 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span>Mounted Combatant Feat (PHB p. 168)</span>
              </label>
              <span className="text-xs font-mono text-stone-400">
                {character.hasMountedCombatFeat ? <b className="text-emerald-400">Active</b> : 'Not Selected'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs text-stone-300">
              <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800">
                <b className="text-amber-300 block mb-1">⚔️ Advantage vs Smaller</b>
                You have advantage on melee attack rolls against any unmounted creature that is smaller than your mount.
              </div>
              <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800">
                <b className="text-amber-300 block mb-1">🛡️ Redirect Attacks</b>
                You can force an attack targeted at your mount to target you instead.
              </div>
              <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800">
                <b className="text-amber-300 block mb-1">💨 Mount Evasion</b>
                If your mount is subjected to an effect that allows a Dexterity saving throw for half damage, it takes no damage on success and half damage on failure.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3.5E MOUNTED COMBAT (PHB p. 80, 98)                                        */}
      {/* ========================================================================= */}
      {activeEditionTab === '3.5e' && (
        <div className="space-y-4">
          {/* Ride Bonus & Modifiers */}
          <div className="bg-stone-900/80 p-4 rounded-xl border border-stone-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-stone-950 p-3 rounded-lg border border-stone-800 text-center flex flex-col justify-center">
              <span className="text-[10px] uppercase font-bold text-stone-400">Total Ride Bonus</span>
              <span className="text-3xl font-serif font-black text-amber-400 my-0.5">
                {rideBonusInfo.total >= 0 ? `+${rideBonusInfo.total}` : rideBonusInfo.total}
              </span>
              <span className="text-[10px] text-stone-500">
                {rideBonusInfo.breakdown.join(' + ')}
              </span>
            </div>

            <div className="sm:col-span-2 bg-stone-950 p-3 rounded-lg border border-stone-800 space-y-1 text-xs">
              <b className="text-amber-300">3.5e Tactical Charges & Combat Feats:</b>
              <ul className="space-y-1 text-[11px] text-stone-300 list-disc list-inside">
                <li><b>Lance Charge:</b> Deals <b>double damage</b> when used from the back of a charging steed.</li>
                <li><b>Spirited Charge:</b> 2× damage with melee weapons, or <b>3× damage with a lance</b>!</li>
                <li><b>Higher Ground:</b> <b>+1 bonus on melee attacks</b> against foes on foot smaller than your mount.</li>
                <li><b>Ride-By Attack:</b> Move before and after a charge without provoking opportunity attacks from the target.</li>
              </ul>
            </div>
          </div>

          {/* 3.5e Ride Maneuver Table */}
          <div className="bg-stone-900/80 p-4 rounded-xl border border-stone-800 space-y-3">
            <div className="font-bold text-sm text-stone-200 flex items-center gap-2">
              <Swords className="w-4 h-4 text-amber-400" />
              <span>Standard 3.5e Ride Maneuver Checks</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {OFFICIAL_35E_RIDE_MANEUVERS.map((maneuver) => (
                <div
                  key={maneuver.id}
                  className="p-2.5 bg-stone-950 border border-stone-800 rounded-lg flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-bold text-xs text-stone-200">{maneuver.name}</div>
                    <div className="text-[10px] text-stone-400">{maneuver.description}</div>
                    <div className="text-[10px] text-amber-400 font-mono font-semibold mt-0.5">
                      DC {maneuver.dc} • {maneuver.action} Action
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRoll35eManeuver(maneuver)}
                    className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-xs rounded border border-stone-700 shrink-0 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>Roll</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
