import React, { useState } from 'react';
import { CharacterData, Attack, Spell, GearItem } from '../../types';
import {
  Swords,
  Wand2,
  FlaskConical,
  Zap,
  Sparkles,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Shield,
  Heart,
  Dices,
  AlertTriangle,
  Flame,
  CheckCircle2,
  X,
  Volume2
} from 'lucide-react';
import {
  getEffectiveAbilities,
  getAbilityModifier,
  formatModifier,
  getProficiencyBonus,
  getEffectiveSpellSaveDC,
  getEffectiveSpellAttackBonus
} from '../../utils/dndCalculations';
import { evaluateCharacterConditions } from '../../utils/conditionCalculations';
import { isSpellConcentration, startConcentration, dropConcentration } from '../../utils/concentrationEngine';
import {
  playDiceSound,
  playHitSound,
  playSpellCastSound,
  playHealSound,
  playInitiativeTurnSound,
  playDamageAppliedSound
} from '../../utils/soundEffects';
import { useLanguage } from '../../i18n/LanguageContext';

interface TacticalActionDockProps {
  character: CharacterData;
  onUpdateCharacter: (char: CharacterData) => void;
  onRoll: (label: string, diceSides: number, count?: number, modifier?: number, mode?: 'normal' | 'advantage' | 'disadvantage') => void;
}

export const TacticalActionDock: React.FC<TacticalActionDockProps> = ({
  character,
  onUpdateCharacter,
  onRoll
}) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'attacks' | 'spells' | 'consumables' | 'features'>('attacks');
  const [rollMode, setRollMode] = useState<'normal' | 'advantage' | 'disadvantage'>('normal');

  // Turn Action Economy State (per turn tracking)
  const [hasUsedAction, setHasUsedAction] = useState(false);
  const [hasUsedBonusAction, setHasUsedBonusAction] = useState(false);
  const [hasUsedReaction, setHasUsedReaction] = useState(false);
  const [spentMovement, setSpentMovement] = useState(0);

  const effectiveAbilities = getEffectiveAbilities(character);
  const profBonus = getProficiencyBonus(character.level);
  const conditionEval = evaluateCharacterConditions(character);

  const baseSpeed = character.speed || 30;
  const effectiveSpeed = conditionEval.speedOverrideZero
    ? 0
    : Math.floor(baseSpeed * conditionEval.speedMultiplier);

  // Equipped Weapons / Attacks
  const equippedWeapons = (character.inventory || []).filter(item => item.equipped && item.weaponStats);
  const preparedSpells = (character.spells || []).filter(s => s.prepared || s.level === 0);
  const consumables = (character.inventory || []).filter(item => {
    const name = item.name.toLowerCase();
    const type = (item.itemType || '').toLowerCase();
    return (
      name.includes('potion') ||
      name.includes('scroll') ||
      name.includes('elixir') ||
      name.includes('antitoxin') ||
      name.includes('oil') ||
      type.includes('consumable')
    );
  });

  const handleResetTurn = () => {
    setHasUsedAction(false);
    setHasUsedBonusAction(false);
    setHasUsedReaction(false);
    setSpentMovement(0);
    playInitiativeTurnSound();
  };

  // Roll Weapon Attack
  const handleWeaponAttack = (weapon: GearItem) => {
    const stats = weapon.weaponStats;
    if (!stats) return;

    const ability: 'STR' | 'DEX' = stats.isFinesse
      ? (getAbilityModifier(effectiveAbilities.DEX.score) > getAbilityModifier(effectiveAbilities.STR.score) ? 'DEX' : 'STR')
      : (stats.isRanged ? 'DEX' : 'STR');

    const mod = getAbilityModifier(effectiveAbilities[ability].score);
    const attackBonus = (stats.attackBonusModifier || 0) + mod + profBonus;

    // Determine roll mode with conditions
    const finalMode = conditionEval.hasAttackDisadvantage && rollMode === 'normal'
      ? 'disadvantage'
      : (conditionEval.hasAttackAdvantage && rollMode === 'normal' ? 'advantage' : rollMode);

    playDiceSound();
    onRoll(`⚔️ Attack: ${weapon.name} (${ability})`, 20, 1, attackBonus, finalMode);
    setHasUsedAction(true);
  };

  // Roll Weapon Damage
  const handleWeaponDamage = (weapon: GearItem, isVersatile = false) => {
    const stats = weapon.weaponStats;
    if (!stats) return;

    const dmgStr = (isVersatile && stats.versatileDamage) ? stats.versatileDamage : (stats.damage || '1d8');
    const ability: 'STR' | 'DEX' = stats.isFinesse
      ? (getAbilityModifier(effectiveAbilities.DEX.score) > getAbilityModifier(effectiveAbilities.STR.score) ? 'DEX' : 'STR')
      : (stats.isRanged ? 'DEX' : 'STR');

    const mod = getAbilityModifier(effectiveAbilities[ability].score) + (stats.damageBonusModifier || 0);

    // Parse dice expression
    const match = dmgStr.match(/(\d+)d(\d+)/i);
    const count = match ? parseInt(match[1], 10) : 1;
    const sides = match ? parseInt(match[2], 10) : 8;

    playHitSound();
    onRoll(`💥 Damage: ${weapon.name} (${stats.damageType || 'Damage'})`, sides, count, mod, 'normal');
  };

  // Quick Cast Spell
  const handleCastSpell = (spell: Spell) => {
    if (spell.level > 0) {
      // Find available slot
      const slots = [...character.spellSlots];
      const slotIndex = slots.findIndex(s => s.level === spell.level);
      if (slotIndex !== -1 && slots[slotIndex].current > 0) {
        slots[slotIndex] = {
          ...slots[slotIndex],
          current: slots[slotIndex].current - 1
        };
        onUpdateCharacter({
          ...character,
          spellSlots: slots
        });
      }
    }

    // Check Concentration
    if (isSpellConcentration(spell)) {
      const { updatedCharacter, previousSpellName } = startConcentration(character, spell);
      onUpdateCharacter(updatedCharacter);
    }

    playSpellCastSound();

    if (spell.damage) {
      const match = spell.damage.match(/(\d+)d(\d+)/i);
      const count = match ? parseInt(match[1], 10) : 1;
      const sides = match ? parseInt(match[2], 10) : 6;
      onRoll(`✨ Cast: ${spell.name} (${spell.damageType || 'Magical'})`, sides, count, 0, 'normal');
    } else {
      onRoll(`✨ Cast: ${spell.name} (Lvl ${spell.level})`, 20, 1, 0, 'normal');
    }

    setHasUsedAction(true);
  };

  // Use Consumable Item
  const handleUseConsumable = (item: GearItem) => {
    const isHealing = item.name.toLowerCase().includes('healing') || item.name.toLowerCase().includes('potion');

    if (isHealing) {
      let healAmount = 7; // Average standard potion 2d4+2
      if (item.name.toLowerCase().includes('greater')) healAmount = 14;
      if (item.name.toLowerCase().includes('superior')) healAmount = 28;
      if (item.name.toLowerCase().includes('supreme')) healAmount = 45;

      const newHp = Math.min(character.hpMax, character.hpCurrent + healAmount);
      playHealSound();

      // Decrement item quantity
      const updatedInventory = character.inventory.map(i => {
        if (i.id === item.id) {
          return { ...i, quantity: Math.max(0, i.quantity - 1) };
        }
        return i;
      }).filter(i => i.quantity > 0);

      onUpdateCharacter({
        ...character,
        hpCurrent: newHp,
        inventory: updatedInventory
      });

      onRoll(`🧪 Consumed ${item.name} (+${healAmount} HP)`, 4, 2, 2, 'normal');
    } else {
      playSpellCastSound();
      const updatedInventory = character.inventory.map(i => {
        if (i.id === item.id) {
          return { ...i, quantity: Math.max(0, i.quantity - 1) };
        }
        return i;
      }).filter(i => i.quantity > 0);

      onUpdateCharacter({
        ...character,
        inventory: updatedInventory
      });

      onRoll(`📜 Used Consumable: ${item.name}`, 20, 1, 0, 'normal');
    }
  };

  // Drop Concentration
  const handleDropConcentration = () => {
    const updated = dropConcentration(character);
    onUpdateCharacter(updated);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex flex-col items-center pointer-events-none">
      {/* Floating Toggle Header / Status Bar */}
      <div className="pointer-events-auto w-full max-w-4xl px-3 pb-1">
        <div className="bg-stone-950/95 backdrop-blur-md border border-amber-500/40 rounded-t-2xl shadow-2xl px-3 py-2 flex items-center justify-between gap-2 text-xs">
          {/* Left: Action Economy Indicators */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1.5 font-bold font-serif text-amber-300 hover:text-amber-100 bg-amber-950/60 border border-amber-600/50 px-2.5 py-1 rounded-xl transition cursor-pointer"
            >
              <Swords className="w-4 h-4 text-amber-400" />
              <span>Tactical Action HUD</span>
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>

            {/* Action Economy Bubbles */}
            <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px]">
              <button
                onClick={() => setHasUsedAction(!hasUsedAction)}
                className={`px-2 py-0.5 rounded-lg border font-bold transition flex items-center gap-1 cursor-pointer ${
                  hasUsedAction
                    ? 'bg-stone-900 border-stone-800 text-stone-600 line-through'
                    : 'bg-emerald-950/80 border-emerald-600/70 text-emerald-300'
                }`}
                title="Action (Attack, Cast Spell, Dash, Disengage, Dodge, Help, Hide, Ready, Search, Use Object)"
              >
                <span>Act</span>
              </button>

              <button
                onClick={() => setHasUsedBonusAction(!hasUsedBonusAction)}
                className={`px-2 py-0.5 rounded-lg border font-bold transition flex items-center gap-1 cursor-pointer ${
                  hasUsedBonusAction
                    ? 'bg-stone-900 border-stone-800 text-stone-600 line-through'
                    : 'bg-cyan-950/80 border-cyan-600/70 text-cyan-300'
                }`}
                title="Bonus Action (Offhand attack, quickened spells, class bonus abilities)"
              >
                <span>Bonus</span>
              </button>

              <button
                onClick={() => setHasUsedReaction(!hasUsedReaction)}
                className={`px-2 py-0.5 rounded-lg border font-bold transition flex items-center gap-1 cursor-pointer ${
                  hasUsedReaction
                    ? 'bg-stone-900 border-stone-800 text-stone-600 line-through'
                    : 'bg-amber-950/80 border-amber-600/70 text-amber-300'
                }`}
                title="Reaction (Opportunity Attack, Shield spell, Counterspell, Absorb Elements)"
              >
                <span>React</span>
              </button>

              <div
                className="px-2 py-0.5 rounded-lg border bg-stone-900 border-stone-800 text-stone-300 font-bold"
                title="Movement Speed Budget"
              >
                <span>Move: {Math.max(0, effectiveSpeed - spentMovement)} / {effectiveSpeed} ft</span>
              </div>

              <button
                onClick={handleResetTurn}
                className="p-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-amber-300 border border-stone-800 transition cursor-pointer"
                title="Reset Turn (Recharge Action, Bonus Action, Reaction & Movement)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Center/Right: Concentration Rune & Condition Badges */}
          <div className="flex items-center gap-2">
            {/* Active Concentration Badge */}
            {character.activeConcentration && (
              <div className="flex items-center gap-1 bg-purple-950/90 border border-purple-500 text-purple-200 px-2 py-0.5 rounded-lg font-mono text-[11px] animate-pulse">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span className="font-bold truncate max-w-[120px]">{character.activeConcentration.spellName}</span>
                <button
                  type="button"
                  onClick={handleDropConcentration}
                  className="text-purple-400 hover:text-rose-300 ml-1 p-0.5"
                  title="Drop Concentration"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Active Conditions Warning Badges */}
            {conditionEval.activeConditionNames.length > 0 && (
              <div className="flex items-center gap-1">
                {conditionEval.activeConditionNames.slice(0, 2).map((c, i) => (
                  <span
                    key={i}
                    className="bg-rose-950/80 border border-rose-600/70 text-rose-300 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}

            {/* Advantage / Disadvantage Toggle */}
            <div className="flex items-center bg-stone-900 border border-stone-800 rounded-lg p-0.5 font-mono text-[10px]">
              <button
                onClick={() => setRollMode('advantage')}
                className={`px-1.5 py-0.5 rounded transition ${rollMode === 'advantage' ? 'bg-emerald-600 text-stone-950 font-bold' : 'text-emerald-400 hover:text-emerald-200'}`}
                title="Force Advantage (Roll 2d20, take highest)"
              >
                ADV
              </button>
              <button
                onClick={() => setRollMode('normal')}
                className={`px-1.5 py-0.5 rounded transition ${rollMode === 'normal' ? 'bg-stone-700 text-stone-100 font-bold' : 'text-stone-400 hover:text-stone-200'}`}
              >
                NORM
              </button>
              <button
                onClick={() => setRollMode('disadvantage')}
                className={`px-1.5 py-0.5 rounded transition ${rollMode === 'disadvantage' ? 'bg-rose-600 text-stone-950 font-bold' : 'text-rose-400 hover:text-rose-200'}`}
                title="Force Disadvantage (Roll 2d20, take lowest)"
              >
                DIS
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Tactical Action Dock Panel */}
      {isExpanded && (
        <div className="pointer-events-auto w-full max-w-4xl px-3 pb-3">
          <div className="bg-stone-950 border-x border-b border-amber-500/40 rounded-b-2xl shadow-2xl p-3 space-y-3 animate-fadeIn">
            {/* Sub-tabs: Attacks, Spells, Consumables, Class Features */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => setActiveSubTab('attacks')}
                  className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 transition ${
                    activeSubTab === 'attacks'
                      ? 'bg-amber-600 text-stone-950 shadow'
                      : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
                  }`}
                >
                  <Swords className="w-3.5 h-3.5" />
                  <span>Weapons & Attacks ({equippedWeapons.length + (character.attacks || []).length})</span>
                </button>

                <button
                  onClick={() => setActiveSubTab('spells')}
                  className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 transition ${
                    activeSubTab === 'spells'
                      ? 'bg-purple-600 text-stone-950 shadow'
                      : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
                  }`}
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Quick Spells ({preparedSpells.length})</span>
                </button>

                <button
                  onClick={() => setActiveSubTab('consumables')}
                  className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 transition ${
                    activeSubTab === 'consumables'
                      ? 'bg-cyan-600 text-stone-950 shadow'
                      : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
                  }`}
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>Potions & Scrolls ({consumables.length})</span>
                </button>

                <button
                  onClick={() => setActiveSubTab('features')}
                  className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 transition ${
                    activeSubTab === 'features'
                      ? 'bg-emerald-600 text-stone-950 shadow'
                      : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Class Powers ({character.classFeatures.length})</span>
                </button>
              </div>

              {/* Spell DC & Spell Attack Summary */}
              {character.isSpellcaster && (
                <div className="hidden md:flex items-center gap-2 font-mono text-[11px] text-stone-400">
                  <span>Spell DC: <strong className="text-purple-300">{getEffectiveSpellSaveDC(character)}</strong></span>
                  <span>Spell Atk: <strong className="text-purple-300">{formatModifier(getEffectiveSpellAttackBonus(character))}</strong></span>
                </div>
              )}
            </div>

            {/* Panel Body */}
            <div className="max-h-60 overflow-y-auto pr-1">
              {/* 1. ATTACKS VIEW */}
              {activeSubTab === 'attacks' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {equippedWeapons.map((w) => {
                    const stats = w.weaponStats;
                    const ability: 'STR' | 'DEX' = stats?.isFinesse
                      ? (getAbilityModifier(effectiveAbilities.DEX.score) > getAbilityModifier(effectiveAbilities.STR.score) ? 'DEX' : 'STR')
                      : (stats?.isRanged ? 'DEX' : 'STR');
                    const mod = getAbilityModifier(effectiveAbilities[ability].score);
                    const atkBonus = (stats?.attackBonusModifier || 0) + mod + profBonus;

                    return (
                      <div
                        key={w.id}
                        className="bg-stone-900/80 border border-stone-800 rounded-xl p-2 flex flex-col justify-between gap-1.5 hover:border-amber-500/50 transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-200 text-xs truncate">{w.name}</span>
                          <span className="text-[10px] font-mono bg-stone-950 px-1.5 py-0.5 rounded text-stone-400">
                            {stats?.range || 'Melee'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleWeaponAttack(w)}
                            className="flex-1 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold font-mono text-xs py-1 rounded-lg transition flex items-center justify-center gap-1"
                          >
                            <Dices className="w-3.5 h-3.5" />
                            <span>Atk {formatModifier(atkBonus)}</span>
                          </button>

                          <button
                            onClick={() => handleWeaponDamage(w, false)}
                            className="flex-1 bg-rose-950 hover:bg-rose-900 border border-rose-700/60 text-rose-200 font-bold font-mono text-xs py-1 rounded-lg transition flex items-center justify-center gap-1"
                          >
                            <span>Dmg {stats?.damage}</span>
                          </button>

                          {stats?.isVersatile && (
                            <button
                              onClick={() => handleWeaponDamage(w, true)}
                              className="bg-purple-950 hover:bg-purple-900 border border-purple-700/60 text-purple-200 font-bold font-mono text-[10px] px-1.5 py-1 rounded-lg transition"
                              title="Versatile 2-Handed Damage"
                            >
                              2H {stats.versatileDamage}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {equippedWeapons.length === 0 && (
                    <div className="col-span-full py-4 text-center text-xs text-stone-500">
                      No equipped weapons found. Equip a weapon from Sheet 3 (Gear) to access quick combat attacks!
                    </div>
                  )}
                </div>
              )}

              {/* 2. SPELLS VIEW */}
              {activeSubTab === 'spells' && (
                <div className="space-y-2">
                  {/* Spell Slot Trackers */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-stone-900/60 p-2 rounded-xl border border-stone-800/80 font-mono text-xs">
                    <span className="text-[10px] text-stone-400 uppercase font-bold mr-1">Slots:</span>
                    {(character.spellSlots || []).map((slot) => (
                      <div
                        key={slot.level}
                        className={`px-2 py-0.5 rounded-lg border text-[11px] flex items-center gap-1 ${
                          slot.current > 0
                            ? 'bg-purple-950/80 border-purple-600/70 text-purple-300'
                            : 'bg-stone-950 border-stone-800 text-stone-600'
                        }`}
                      >
                        <span>Lvl {slot.level}:</span>
                        <strong>{slot.current}/{slot.max}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {preparedSpells.map((s) => {
                      const isConc = isSpellConcentration(s);
                      return (
                        <div
                          key={s.id}
                          className="bg-stone-900/80 border border-stone-800 rounded-xl p-2 flex flex-col justify-between gap-1.5 hover:border-purple-500/50 transition"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-purple-200 text-xs truncate">{s.name}</span>
                            <div className="flex items-center gap-1">
                              {isConc && (
                                <span className="text-[9px] font-mono bg-purple-950 text-purple-300 border border-purple-700/60 px-1 rounded font-bold">
                                  Conc
                                </span>
                              )}
                              <span className="text-[10px] font-mono bg-stone-950 px-1.5 py-0.5 rounded text-stone-400">
                                {s.level === 0 ? 'Cantrip' : `Lvl ${s.level}`}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleCastSpell(s)}
                            className="w-full bg-purple-600 hover:bg-purple-500 text-stone-950 font-bold font-mono text-xs py-1 rounded-lg transition flex items-center justify-center gap-1"
                          >
                            <Wand2 className="w-3.5 h-3.5" />
                            <span>Cast {s.damage ? `(${s.damage})` : ''}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. CONSUMABLES VIEW */}
              {activeSubTab === 'consumables' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {consumables.map((item) => (
                    <div
                      key={item.id}
                      className="bg-stone-900/80 border border-stone-800 rounded-xl p-2 flex items-center justify-between gap-2 hover:border-cyan-500/50 transition"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-cyan-200 text-xs truncate">{item.name}</div>
                        <div className="text-[10px] font-mono text-stone-400">Qty: {item.quantity}</div>
                      </div>

                      <button
                        onClick={() => handleUseConsumable(item)}
                        className="bg-cyan-600 hover:bg-cyan-500 text-stone-950 font-bold font-mono text-xs px-2.5 py-1 rounded-lg transition flex items-center gap-1 shrink-0"
                      >
                        <FlaskConical className="w-3 h-3" />
                        <span>Use</span>
                      </button>
                    </div>
                  ))}

                  {consumables.length === 0 && (
                    <div className="col-span-full py-4 text-center text-xs text-stone-500">
                      No potions or consumables in inventory.
                    </div>
                  )}
                </div>
              )}

              {/* 4. CLASS FEATURES VIEW */}
              {activeSubTab === 'features' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(character.classFeatures || []).map((f) => (
                    <div
                      key={f.id}
                      className="bg-stone-900/80 border border-stone-800 rounded-xl p-2 flex flex-col justify-between gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-200 text-xs">{f.name}</span>
                        {f.usesMax !== undefined && (
                          <span className="text-[10px] font-mono bg-stone-950 px-1.5 py-0.5 rounded text-emerald-400">
                            Uses: {f.usesRemaining || 0}/{f.usesMax}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-400 line-clamp-2">{f.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
