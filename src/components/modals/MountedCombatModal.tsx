import React, { useState } from 'react';
import { CharacterData } from '../../types';
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
} from '../../utils/dndCalculations';
import { StablesAndMountsModal } from './StablesAndMountsModal';
import { bindActiveMount, calculateMountEffectiveAC } from '../../data/mountData';
import {
  Shield,
  ShieldAlert,
  Dices,
  X,
  Sparkles,
  Swords,
  Heart,
  ShoppingBag,
  Footprints,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Zap,
  ArrowRight,
  Info
} from 'lucide-react';

interface MountedCombatModalProps {
  isOpen: boolean;
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onClose: () => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
}

export const MountedCombatModal: React.FC<MountedCombatModalProps> = ({
  isOpen,
  character,
  onUpdateCharacter,
  onClose,
  onRoll
}) => {
  const is35e = character.edition === '3.5e';
  const [activeRuleset, setActiveRuleset] = useState<'5e' | '3.5e'>(is35e ? '3.5e' : '5e');
  const [mountControlMode, setMountControlMode] = useState<'controlled' | 'independent'>('controlled');
  const [incomingAttackRoll, setIncomingAttackRoll] = useState<number>(18);
  const [lastCheckMessage, setLastCheckMessage] = useState<string | null>(null);
  const [showStablesModal, setShowStablesModal] = useState(false);

  if (!isOpen) return null;

  const ownedMounts = Array.isArray(character.ownedMounts) ? character.ownedMounts : [];
  const activeMount = ownedMounts.find(m => m.id === character.activeMountId);

  const mountName = activeMount?.name || character.mountInfo?.name || 'Heavy Warhorse';
  const mountAc = activeMount ? calculateMountEffectiveAC(activeMount) : (character.mountInfo?.ac || 14);
  const mountHp = activeMount?.hp ?? (character.mountInfo?.hp || 30);
  const mountHpMax = activeMount?.hpMax ?? (character.mountInfo?.hpMax || 30);
  const mountSpeed = activeMount?.speed || character.mountInfo?.speed || (is35e ? '50 ft.' : '60 ft.');
  const mountSize = activeMount?.size || 'Large';
  const hasMilitarySaddle = activeMount?.saddle === 'military' || activeMount?.saddle === 'exotic_military' || character.mountInfo?.saddle === 'military';

  // Rider calculations
  const isMounted = Boolean(character.isMounted);
  const speedInfo = getEffectiveSpeed(character);
  const riderSpeed = speedInfo.effectiveSpeed || 30;
  const mountCostSpeed = Math.floor(riderSpeed / 2);

  // 3.5e Ride Bonus
  const rideBonusInfo = get35eRideBonus(character);

  // 5e Dex Save & Animal Handling
  const dexSaveDetails = getSavingThrowDetails('DEX', character);
  const dexSaveBonus = dexSaveDetails.bonus;
  const abilities = getEffectiveAbilities(character);
  const wisMod = getAbilityModifier(abilities.WIS?.score || 10);
  const animalHandlingSkill = character.skills?.find(s => s.name.toLowerCase().includes('animal'));
  const animalHandlingBonus = animalHandlingSkill
    ? getSkillBonus(animalHandlingSkill, abilities, character.level || 1, character)
    : wisMod;

  const handleToggleMounted = () => {
    const nextMounted = !isMounted;
    onUpdateCharacter({
      ...character,
      isMounted: nextMounted,
      mountInfo: {
        name: mountName,
        ac: mountAc,
        hp: mountHp,
        hpMax: mountHpMax,
        speed: mountSpeed,
        saddle: activeMount?.saddle || character.mountInfo?.saddle,
        barding: activeMount?.barding || character.mountInfo?.barding
      }
    });
    setLastCheckMessage(
      nextMounted
        ? `Mounted up on ${mountName}! (${activeRuleset === '5e' ? `Costs half speed: ${mountCostSpeed} ft` : 'Standard action or Fast Mount check'})`
        : `Dismounted from ${mountName}. (${activeRuleset === '5e' ? `Costs half speed: ${mountCostSpeed} ft` : 'Standard action or Fast Dismount check'})`
    );
  };

  const handleSwitchMount = (mountId: string) => {
    const updated = bindActiveMount(character, mountId);
    onUpdateCharacter(updated);
    setLastCheckMessage(`Switched active steed to "${updated.mountInfo?.name}".`);
  };

  // 5e Roll DC 10 Dexterity Saving Throw (Forced Movement / Knocked Prone)
  const handleRoll5eDexSave = () => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + dexSaveBonus;
    const passed = total >= 10;
    const conds = character.conditions || [];

    if (passed) {
      const msg = `DC 10 DEX Save (Forced Movement/Knocked Prone): Succeeded! Rolled ${d20} + ${dexSaveBonus} = ${total} vs DC 10. Stayed in the saddle!`;
      setLastCheckMessage(msg);
      if (onRoll) {
        onRoll('DC 10 DEX Save: Stay on Mount (5e PHB p. 198)', 20, 1, dexSaveBonus, 'normal');
      }
    } else {
      const msg = `DC 10 DEX Save (Forced Movement/Knocked Prone): Failed! Rolled ${d20} + ${dexSaveBonus} = ${total} < DC 10. Fell off mount and landed prone in space within 5 ft!`;
      setLastCheckMessage(msg);
      onUpdateCharacter({
        ...character,
        isMounted: false,
        conditions: Array.from(new Set([...conds, 'Prone']))
      });
      if (onRoll) {
        onRoll('DC 10 DEX Save: Fell off Mount & Prone (5e PHB p. 198)', 20, 1, dexSaveBonus, 'normal');
      }
    }
  };

  // 5e Reaction to Dismount on Feet when Mount is Knocked Prone
  const handle5eMountProneReaction = (usedReaction: boolean) => {
    const conds = character.conditions || [];
    if (usedReaction) {
      onUpdateCharacter({
        ...character,
        isMounted: false,
        actionEconomy: {
          ...character.actionEconomy,
          reactionUsed5e: true
        }
      });
      const msg = 'Reaction Spent: Dismounted as mount fell prone and safely landed on feet! (Reaction used)';
      setLastCheckMessage(msg);
      if (onRoll) {
        onRoll('Reaction: Dismount as Mount Falls (Landed on Feet)', 20, 1, 0, 'normal');
      }
    } else {
      onUpdateCharacter({
        ...character,
        isMounted: false,
        conditions: Array.from(new Set([...conds, 'Prone']))
      });
      const msg = 'No Reaction used: Dismounted as mount fell prone and landed PRONE in a space within 5 feet!';
      setLastCheckMessage(msg);
      if (onRoll) {
        onRoll('Mount Knocked Prone: Landed Prone (No Reaction Used)', 20, 1, 0, 'normal');
      }
    }
  };

  // 5e Animal Handling Roll
  const handleRoll5eAnimalHandling = () => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + animalHandlingBonus;
    const msg = `Animal Handling Check (Controlling/Calming Mount): Rolled ${d20} + ${animalHandlingBonus} = ${total}.`;
    setLastCheckMessage(msg);
    if (onRoll) {
      onRoll('Animal Handling (Controlling Mount)', 20, 1, animalHandlingBonus, 'normal');
    }
  };

  // 5e Controlled Mount Action Triggers
  const handle5eControlledAction = (actionType: 'dash' | 'disengage' | 'dodge') => {
    let msg = '';
    if (actionType === 'dash') {
      msg = `Controlled Mount takes DASH Action: Mount doubles its movement this turn (${mountSpeed} base)!`;
    } else if (actionType === 'disengage') {
      msg = `Controlled Mount takes DISENGAGE Action: Mount's movement provokes NO opportunity attacks for the rest of the turn!`;
    } else {
      msg = `Controlled Mount takes DODGE Action: Attack rolls against the mount have disadvantage, and mount has advantage on DEX saves!`;
    }
    setLastCheckMessage(msg);
    if (onRoll) {
      onRoll(`Mount Action: ${actionType.toUpperCase()}`, 20, 1, 0, 'normal');
    }
  };

  // 3.5e Maneuver Roll
  const handleRollManeuver = (maneuver: typeof OFFICIAL_35E_RIDE_MANEUVERS[0]) => {
    const saddleBonus = (maneuver.id === 'stay_in_saddle' && hasMilitarySaddle) ? 2 : 0;
    const effectiveBonus = rideBonusInfo.total + saddleBonus;
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + effectiveBonus;
    const passed = total >= maneuver.dc;
    const saddleNote = saddleBonus > 0 ? ' (incl. +2 Military Saddle)' : '';
    const msg = passed
      ? `Ride: ${maneuver.name} Succeeded! Rolled ${d20} + ${effectiveBonus}${saddleNote} = ${total} vs DC ${maneuver.dc}.`
      : `Ride: ${maneuver.name} Failed! Rolled ${d20} + ${effectiveBonus}${saddleNote} = ${total} vs DC ${maneuver.dc}.`;

    setLastCheckMessage(msg);
    if (onRoll) {
      onRoll(`Ride Check: ${maneuver.name} (DC ${maneuver.dc})${saddleNote}`, 20, 1, effectiveBonus, 'normal');
    }
  };

  // 3.5e Feat Hit Negator
  const handleRollMountedCombatOpposed = () => {
    const result = roll35eMountedCombatHitNegation(character, incomingAttackRoll);
    setLastCheckMessage(result.message);
    if (onRoll) {
      onRoll(`Mounted Combat Opposed Ride vs Attack ${incomingAttackRoll}`, 20, 1, result.rideBonus, 'normal');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-stone-900 border border-amber-600/50 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-stone-900 p-4 border-b border-amber-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-500 flex items-center justify-center text-amber-400 shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif font-black text-amber-200">
                  Mounted Combat
                </h2>
                <span className="text-[10px] font-mono font-bold bg-amber-950 border border-amber-700/60 text-amber-300 px-2 py-0.5 rounded-full">
                  {activeRuleset === '5e' ? '5th Edition' : '3.5e RAW'}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                {activeRuleset === '5e'
                  ? 'Official D&D 5e Rules As Written (PHB p. 198)'
                  : 'Official D&D 3.5e Rules As Written (PHB p. 80, 98)'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Edition Toggle Tab */}
            <div className="flex items-center bg-stone-950 border border-stone-800 rounded-lg p-0.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveRuleset('5e')}
                className={`px-2 py-1 rounded transition cursor-pointer font-bold ${
                  activeRuleset === '5e'
                    ? 'bg-amber-600 text-stone-950'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                5e
              </button>
              <button
                type="button"
                onClick={() => setActiveRuleset('3.5e')}
                className={`px-2 py-1 rounded transition cursor-pointer font-bold ${
                  activeRuleset === '3.5e'
                    ? 'bg-amber-600 text-stone-950'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                3.5e
              </button>
            </div>

            <button
              onClick={() => setShowStablesModal(true)}
              className="px-2.5 py-1 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/60 text-amber-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
              title="Open Stables to buy new mounts, equip saddles, and manage steeds"
            >
              <span>🐎 Stables ({ownedMounts.length})</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Active Mount Status Bar */}
          <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${isMounted ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse' : 'bg-stone-600'}`} />
              <div>
                <div className="font-bold text-stone-200 text-sm flex items-center gap-2 flex-wrap">
                  {ownedMounts.length > 1 ? (
                    <select
                      value={character.activeMountId || ''}
                      onChange={(e) => handleSwitchMount(e.target.value)}
                      className="bg-stone-900 border border-stone-700 rounded px-2 py-0.5 text-xs text-amber-200 font-bold"
                    >
                      {ownedMounts.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.type} - {m.size})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span>{mountName}</span>
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${isMounted ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-stone-800 text-stone-400'}`}>
                    {isMounted ? 'MOUNTED IN SADDLE' : 'ON FOOT / DISMOUNTED'}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700 font-mono">
                    Size: {mountSize}
                  </span>
                  {hasMilitarySaddle && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700 font-bold" title="Military Saddle grants +2 to Stay in Saddle">
                      +2 Stay Saddle
                    </span>
                  )}
                </div>
                <div className="text-xs text-stone-400 flex items-center gap-3 mt-1 flex-wrap font-mono">
                  <span>AC: <b className="text-stone-200">{mountAc}</b></span>
                  <span>HP: <b className="text-emerald-400">{mountHp}/{mountHpMax}</b></span>
                  <span>Mount Speed: <b className="text-sky-400">{mountSpeed}</b></span>
                  {activeMount?.barding && activeMount.barding !== 'none' && (
                    <span className="text-blue-300">Barding: {activeMount.barding}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowStablesModal(true)}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 transition cursor-pointer"
              >
                Change Gear / Tack
              </button>
              <button
                type="button"
                onClick={handleToggleMounted}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow cursor-pointer ${
                  isMounted
                    ? 'bg-amber-950 hover:bg-amber-900 border border-amber-600 text-amber-200'
                    : 'bg-emerald-950 hover:bg-emerald-900 border border-emerald-600 text-emerald-200'
                }`}
              >
                {isMounted ? 'Dismount Saddle' : 'Mount Steed'}
              </button>
            </div>
          </div>

          {/* Feedback message */}
          {lastCheckMessage && (
            <div className="p-3 bg-amber-950/40 border border-amber-600/50 rounded-xl text-xs text-amber-200 flex items-start gap-2 animate-fadeIn">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{lastCheckMessage}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5E MOUNTED COMBAT INTERFACE (PHB p. 198)                                  */}
          {/* ========================================================================= */}
          {activeRuleset === '5e' && (
            <div className="space-y-4">
              {/* 1. Mounting & Dismounting Speed Math */}
              <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-2">
                <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
                  <div className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                    <Footprints className="w-4 h-4 text-amber-400" />
                    <span>Mounting & Dismounting Speed Cost (5e PHB p. 198)</span>
                  </div>
                  <span className="text-[10px] font-mono text-stone-400">
                    Your Speed: <b className="text-sky-300">{riderSpeed} ft</b> • Cost: <b className="text-amber-400">{mountCostSpeed} ft (Half Speed)</b>
                  </span>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Once during your move, you can mount a creature within 5 feet of you or dismount. Doing so costs an amount of movement equal to <b>half your speed ({mountCostSpeed} ft)</b>. You cannot mount if you lack {mountCostSpeed} ft of movement left or if your speed is 0.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleToggleMounted}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1 cursor-pointer ${
                      isMounted
                        ? 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600'
                        : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-600'
                    }`}
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>{isMounted ? `Dismount (Spend ${mountCostSpeed} ft)` : `Mount (Spend ${mountCostSpeed} ft)`}</span>
                  </button>
                  <span className="text-[11px] text-stone-400">
                    Status: {isMounted ? <b className="text-emerald-400">Riding {mountName}</b> : <b className="text-stone-400">On Foot</b>}
                  </span>
                </div>
              </div>

              {/* 2. Controlling a Mount: Controlled vs Independent */}
              <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-3">
                <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
                  <div className="font-bold text-xs text-stone-200 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-sky-400" />
                    <span>Controlling a Mount (PHB p. 198)</span>
                  </div>
                  <div className="flex items-center gap-1 bg-stone-900 border border-stone-700 rounded-lg p-0.5 text-[11px] font-mono">
                    <button
                      type="button"
                      onClick={() => setMountControlMode('controlled')}
                      className={`px-2 py-0.5 rounded transition cursor-pointer font-bold ${
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
                      className={`px-2 py-0.5 rounded transition cursor-pointer font-bold ${
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
                  <div className="space-y-2.5">
                    <p className="text-xs text-stone-300 leading-relaxed">
                      You can control a mount only if it has been trained to accept a rider (domesticated horses, donkeys, etc.). Its initiative <b>changes to match yours</b> when you mount it. It moves as you direct it and can move and act even on the turn you mount it. It has only <b>three action options</b>:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* Dash */}
                      <div className="bg-stone-900 p-2 rounded-lg border border-stone-800 flex flex-col justify-between">
                        <div>
                          <div className="font-bold text-xs text-amber-300">Dash Action</div>
                          <div className="text-[10px] text-stone-400 mt-0.5">
                            Doubles mount's speed for the turn ({mountSpeed} → extra movement).
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handle5eControlledAction('dash')}
                          className="mt-2 py-1 px-2 bg-stone-800 hover:bg-stone-700 text-amber-200 rounded text-[11px] font-mono font-bold transition flex items-center justify-center gap-1 cursor-pointer border border-stone-700"
                        >
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>Mount Dashes</span>
                        </button>
                      </div>

                      {/* Disengage */}
                      <div className="bg-stone-900 p-2 rounded-lg border border-stone-800 flex flex-col justify-between">
                        <div>
                          <div className="font-bold text-xs text-sky-300">Disengage Action</div>
                          <div className="text-[10px] text-stone-400 mt-0.5">
                            Mount's movement provokes <b>no opportunity attacks</b> for rest of turn!
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handle5eControlledAction('disengage')}
                          className="mt-2 py-1 px-2 bg-stone-800 hover:bg-stone-700 text-sky-200 rounded text-[11px] font-mono font-bold transition flex items-center justify-center gap-1 cursor-pointer border border-stone-700"
                        >
                          <Shield className="w-3 h-3 text-sky-400" />
                          <span>Mount Disengages</span>
                        </button>
                      </div>

                      {/* Dodge */}
                      <div className="bg-stone-900 p-2 rounded-lg border border-stone-800 flex flex-col justify-between">
                        <div>
                          <div className="font-bold text-xs text-emerald-300">Dodge Action</div>
                          <div className="text-[10px] text-stone-400 mt-0.5">
                            Attacks vs mount have <b>disadvantage</b>; mount has <b>advantage on DEX saves</b>.
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handle5eControlledAction('dodge')}
                          className="mt-2 py-1 px-2 bg-stone-800 hover:bg-stone-700 text-emerald-200 rounded text-[11px] font-mono font-bold transition flex items-center justify-center gap-1 cursor-pointer border border-stone-700"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Mount Dodges</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 bg-stone-900 p-3 rounded-lg border border-stone-800 text-xs">
                    <p className="text-stone-300 leading-relaxed">
                      Intelligent creatures (dragons, griffons, pegasi) or untrained wild beasts act independently. An independent mount <b>retains its place in the initiative order</b>. Bearing a rider puts <b>no restrictions</b> on the actions it can take (it can attack, cast, use breath weapons). It moves and acts as it wishes; it might flee, attack, or devour a badly injured foe.
                    </p>
                    {activeMount?.attacks && activeMount.attacks.length > 0 && (
                      <div className="pt-2 border-t border-stone-800">
                        <span className="text-[10px] font-mono uppercase text-stone-400 font-bold block mb-1">
                          Mount Natural Weapon Attacks:
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {activeMount.attacks.map((atk, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                if (onRoll) {
                                  onRoll(`${mountName}: ${atk.name}`, 20, 1, atk.bonus, 'normal');
                                }
                              }}
                              className="p-1.5 bg-stone-950 hover:bg-stone-800 border border-stone-700 rounded text-left transition text-stone-200 text-[11px] font-mono flex items-center justify-between"
                            >
                              <span>{atk.name} ({formatModifier(atk.bonus)})</span>
                              <span className="text-amber-400">{atk.damage}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Saving Throws & Reaction Dismount (from Screenshot) */}
              <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-3">
                <div className="font-bold text-xs text-rose-300 flex items-center gap-1.5 border-b border-stone-800 pb-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Dismount Hazards, Saving Throws & Reactions (PHB p. 198)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* DC 10 Dex Save */}
                  <div className="bg-stone-900 p-3 rounded-lg border border-stone-800 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-amber-200">DC 10 Dexterity Save</span>
                        <span className="text-[10px] font-mono text-stone-400">
                          Your Dex Save: <b className="text-emerald-400">{formatModifier(dexSaveBonus)}</b>
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-300 mt-1 leading-snug">
                        Trigger: If an effect <b>moves your mount against its will</b> or if you are <b>knocked prone</b> while mounted.
                        Failure = Fall off mount, landing <b>prone</b> within 5 ft.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleRoll5eDexSave}
                      className="w-full py-1.5 bg-stone-800 hover:bg-amber-950 border border-stone-700 hover:border-amber-600 text-amber-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Dices className="w-3.5 h-3.5 text-amber-400" />
                      <span>Roll DC 10 DEX Save ({formatModifier(dexSaveBonus)})</span>
                    </button>
                  </div>

                  {/* Mount Knocked Prone Reaction */}
                  <div className="bg-stone-900 p-3 rounded-lg border border-stone-800 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-rose-300">Mount Knocked Prone</span>
                        <span className="text-[10px] font-mono text-stone-400">Reaction</span>
                      </div>
                      <p className="text-[11px] text-stone-300 mt-1 leading-snug">
                        If your mount is knocked prone, you can use your <b>reaction</b> to dismount as it falls and <b>land on your feet</b>. Otherwise, you fall prone within 5 ft.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handle5eMountProneReaction(true)}
                        className="py-1 px-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600 text-emerald-200 rounded text-[10px] font-mono font-bold transition cursor-pointer text-center"
                        title="Spend Reaction to dismount and land standing on your feet"
                      >
                        Reaction: Land on Feet
                      </button>
                      <button
                        type="button"
                        onClick={() => handle5eMountProneReaction(false)}
                        className="py-1 px-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-600 text-rose-200 rounded text-[10px] font-mono font-bold transition cursor-pointer text-center"
                        title="Fail to react: Dismounted and fall prone within 5 ft"
                      >
                        Fall Prone with Mount
                      </button>
                    </div>
                  </div>
                </div>

                {/* Opportunity Attack Rule Notice */}
                <div className="p-2.5 bg-stone-900 rounded-lg border border-stone-800 flex items-start gap-2 text-xs text-stone-300">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <b className="text-amber-300">Opportunity Attacks on Mounts:</b> If your mount provokes an opportunity attack while you are on it, the attacker can choose to target <b>YOU or the MOUNT</b>.
                  </div>
                </div>

                {/* Animal Handling Check */}
                <div className="flex items-center justify-between bg-stone-900 p-2.5 rounded-lg border border-stone-800">
                  <div>
                    <span className="font-bold text-xs text-stone-200 block">Animal Handling Check (Wisdom)</span>
                    <span className="text-[10px] text-stone-400">
                      Bonus: <b className="text-sky-300 font-mono">{formatModifier(animalHandlingBonus)}</b> • Control spooked/untrained animals or perform riding stunts
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRoll5eAnimalHandling}
                    className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-sky-200 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer border border-stone-700"
                  >
                    <Dices className="w-3.5 h-3.5 text-sky-400" />
                    <span>Roll ({formatModifier(animalHandlingBonus)})</span>
                  </button>
                </div>
              </div>

              {/* 4. Mounted Combatant Feat (5e PHB p. 168) */}
              <div className="bg-stone-950 p-3.5 rounded-xl border border-amber-600/40 space-y-2.5">
                <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
                  <label className="font-bold text-xs text-amber-300 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(character.hasMountedCombatFeat)}
                      onChange={(e) => onUpdateCharacter({ ...character, hasMountedCombatFeat: e.target.checked })}
                      className="rounded bg-stone-800 border-stone-600 text-amber-500 focus:ring-0 cursor-pointer"
                    />
                    <span>Mounted Combatant Feat (PHB p. 168)</span>
                  </label>
                  <span className="text-[10px] font-mono text-stone-400">
                    {character.hasMountedCombatFeat ? 'Active Feat' : 'Not Learned'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-stone-900 p-2 rounded-lg border border-stone-800 text-stone-300">
                    <b className="text-amber-300 block mb-0.5">⚔️ Advantage vs Smaller</b>
                    Advantage on melee attacks against unmounted creatures smaller than your mount (e.g. Medium or Small).
                  </div>
                  <div className="bg-stone-900 p-2 rounded-lg border border-stone-800 text-stone-300">
                    <b className="text-amber-300 block mb-0.5">🛡️ Redirect Attack</b>
                    You can force an attack targeted at your mount to target you instead.
                  </div>
                  <div className="bg-stone-900 p-2 rounded-lg border border-stone-800 text-stone-300">
                    <b className="text-amber-300 block mb-0.5">💨 Mount Evasion</b>
                    When mount makes a DEX save for half damage, it takes 0 on success and half on failure.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3.5E MOUNTED COMBAT INTERFACE (PHB p. 80, 98)                              */}
          {/* ========================================================================= */}
          {activeRuleset === '3.5e' && (
            <div className="space-y-4">
              {/* Ride Bonus & Feats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 text-center flex flex-col justify-center">
                  <span className="text-[10px] uppercase font-bold text-stone-400">Total Ride Bonus</span>
                  <span className="text-3xl font-serif font-black text-amber-400 my-0.5">
                    {rideBonusInfo.total >= 0 ? `+${rideBonusInfo.total}` : rideBonusInfo.total}
                  </span>
                  <span className="text-[9px] text-stone-500 truncate" title={rideBonusInfo.breakdown.join(', ')}>
                    {rideBonusInfo.breakdown.join(' + ')}
                  </span>
                </div>

                <div className="sm:col-span-2 bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-1.5">
                  <div className="text-xs font-bold text-stone-300">Mounted Combat Rules & Feats</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-stone-900 p-1.5 rounded border border-stone-800 text-stone-300">
                      <b className="text-amber-300">Lance Charge:</b> Deals <b>2× damage</b> on a mounted charge!
                    </div>
                    <div className="bg-stone-900 p-1.5 rounded border border-stone-800 text-stone-300">
                      <b className="text-amber-300">Spirited Charge:</b> 2× melee damage, or <b>3× lance damage</b>!
                    </div>
                    <div className="bg-stone-900 p-1.5 rounded border border-stone-800 text-stone-300">
                      <b className="text-amber-300">Higher Ground:</b> <b>+1 attack</b> vs opponents on foot.
                    </div>
                    <div className="bg-stone-900 p-1.5 rounded border border-stone-800 text-stone-300">
                      <b className="text-amber-300">Ride-By Attack:</b> Charge without provoking AoO on egress.
                    </div>
                  </div>
                </div>
              </div>

              {/* Opposed Mounted Combat Feat Hit Negator */}
              <div className="bg-stone-950 p-3.5 rounded-xl border border-amber-600/40 space-y-3">
                <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
                  <div className="font-bold text-xs text-amber-200 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Mounted Combat Feat: Negate Hit on Mount</span>
                  </div>
                  <span className="text-[10px] text-stone-400">1 / Combat Round</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="sm:col-span-2">
                    <label className="text-xs text-stone-400 font-semibold block mb-1">
                      Incoming Attack Roll on Mount (Total with modifiers)
                    </label>
                    <input
                      type="number"
                      value={incomingAttackRoll}
                      onChange={(e) => setIncomingAttackRoll(parseInt(e.target.value, 10) || 10)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-sm text-stone-200 font-mono font-bold"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleRollMountedCombatOpposed}
                    className="w-full py-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-stone-950 font-black rounded-lg shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Dices className="w-4 h-4" />
                    <span>Negate Hit (Ride Check)</span>
                  </button>
                </div>
              </div>

              {/* Official Ride Maneuver Quick Checks */}
              <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-2">
                <div className="font-bold text-xs text-stone-200 flex items-center gap-1.5">
                  <Swords className="w-3.5 h-3.5 text-amber-400" />
                  <span>Standard 3.5e Ride Maneuver Checks</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {OFFICIAL_35E_RIDE_MANEUVERS.map((maneuver) => (
                    <div
                      key={maneuver.id}
                      className="p-2.5 bg-stone-900/90 border border-stone-800 rounded-lg flex items-center justify-between gap-2"
                    >
                      <div className="pr-1">
                        <div className="font-bold text-xs text-stone-200">{maneuver.name}</div>
                        <div className="text-[10px] text-stone-400 line-clamp-1">{maneuver.description}</div>
                        <div className="text-[10px] text-amber-400 font-mono font-semibold">
                          DC {maneuver.dc} • {maneuver.action} Action
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRollManeuver(maneuver)}
                        className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-xs rounded border border-stone-700 shrink-0 transition flex items-center gap-1 cursor-pointer"
                      >
                        <Dices className="w-3 h-3" />
                        <span>Roll</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-950 border-t border-stone-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {showStablesModal && (
        <StablesAndMountsModal
          isOpen={showStablesModal}
          onClose={() => setShowStablesModal(false)}
          character={character}
          onUpdateCharacter={onUpdateCharacter}
        />
      )}
    </div>
  );
};

