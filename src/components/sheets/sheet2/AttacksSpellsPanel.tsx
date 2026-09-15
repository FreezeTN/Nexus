import React, { useState } from 'react';
import { Attack, CharacterData, WeaponDamageRow } from '../../../types';
import { CollapsibleBox } from '../../common/CollapsibleBox';
import { COMBAT_CHEAT_SHEET } from '../../../data/dndRulesData';
import { isShapeshiftAbility } from '../../../data/transformationData';
import { isCompanionSummonAbility } from '../../../data/companionData';
import {
  formatModifier,
  OFFICIAL_DAMAGE_TYPES,
  getDamageTypeMeta,
  isHealingItem,
  isHealingSpell,
  getHealingExpression,
  rollHealing,
  isCharacterDead,
  isReviveSpell,
  getEffectiveMaxHp,
  getCharacterBab,
  get35eIterativeAttacks,
  format35eIterativeString,
  get35eEffectiveThreatRange,
  get35eCriticalMultiplier,
  adjust35eOffhandDamageFormula,
  adjust5eOffhandDamageFormula,
  getEffectiveAbilities,
  getAbilityModifier,
  calculate35eWeaponSizePenalty,
  SIZE_CATEGORY_ORDER
} from '../../../utils/dndCalculations';
import {
  Swords,
  Plus,
  Trash2,
  Dices,
  BookMarked,
  Search,
  Crosshair,
  Flame,
  Pencil,
  Sparkles,
  Zap
} from 'lucide-react';
import { useLayoutCustomization } from '../../../utils/layoutCustomization';
import { useLanguage } from '../../../i18n/LanguageContext';
import { FullAttackModal } from '../../modals/FullAttackModal';
import { CriticalConfirmationModal } from '../../modals/CriticalConfirmationModal';
import { MetamagicSpellModal } from '../../modals/MetamagicSpellModal';
import { TwoWeaponFightingModal } from '../../modals/TwoWeaponFightingModal';
import { AoOTrackerModal } from '../../modals/AoOTrackerModal';
import { Spell } from '../../../types';

interface AttacksSpellsPanelProps {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRoll: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
  onRollDamage: (label: string, expression: string) => void;
  setTargetModalSpell: (spell: any) => void;
  onOpenShapeshift?: () => void;
  onOpenSummonCompanion?: () => void;
}

export const AttacksSpellsPanel: React.FC<AttacksSpellsPanelProps> = ({
  character,
  onUpdateCharacter,
  onRoll,
  onRollDamage,
  setTargetModalSpell,
  onOpenShapeshift,
  onOpenSummonCompanion
}) => {
  const { t } = useLanguage();
  const is35e = character.edition === '3.5e';
  const [cheatCategory, setCheatCategory] = useState<'All' | 'Action' | 'Bonus Action' | 'Reaction' | 'Maneuver' | 'Condition'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [showAddAttackModal, setShowAddAttackModal] = useState(false);
  const [selectedFullAttack, setSelectedFullAttack] = useState<Attack | null>(null);
  const [critModalAttack, setCritModalAttack] = useState<Attack | null>(null);
  const [critModalThreatRoll, setCritModalThreatRoll] = useState<number | undefined>(undefined);
  const [critModalAttackBonus, setCritModalAttackBonus] = useState<number | undefined>(undefined);
  const [metamagicModalSpell, setMetamagicModalSpell] = useState<Spell | null>(null);
  const [show35eTwfModal, setShow35eTwfModal] = useState(false);
  const [show35eAoOModal, setShow35eAoOModal] = useState(false);

  // New Attack Form
  const [attackName, setAttackName] = useState('');
  const [attackBonus, setAttackBonus] = useState<number>(5);
  const [attackDamage, setAttackDamage] = useState('1d8 + 3');
  const [attackDamageType, setAttackDamageType] = useState('Slashing');
  const [attackRange, setAttackRange] = useState('5 ft Melee');
  const [attackNotes, setAttackNotes] = useState('');
  const [attackIsOffhand, setAttackIsOffhand] = useState(false);
  const [attackWeaponSize, setAttackWeaponSize] = useState<string>('Medium');
  const [attackAdditionalDamage, setAttackAdditionalDamage] = useState<WeaponDamageRow[]>([]);

  const effectiveMaxHp = getEffectiveMaxHp(character);

  const handleAddAttack = () => {
    if (!attackName.trim()) {
      alert('Please enter a Weapon / Spell Name before saving.');
      return;
    }
    const finalType = attackDamageType === 'Custom' ? 'Slashing' : (attackDamageType || 'Slashing');
    const validExtra = attackAdditionalDamage.filter(r => r.damage && r.damage.trim());
    const newAttack: Attack = {
      id: 'atk-' + Date.now(),
      name: attackName,
      attackBonus: attackBonus,
      damage: attackDamage || '1d8',
      damageType: finalType,
      range: attackRange,
      notes: attackNotes,
      isOffhand: attackIsOffhand,
      weaponSize: is35e ? (attackWeaponSize as any) : undefined,
      additionalDamageRows: validExtra.length > 0 ? validExtra : undefined
    };
    onUpdateCharacter({
      ...character,
      attacks: [...character.attacks, newAttack]
    });
    setAttackName('');
    setAttackDamage('1d8 + 3');
    setAttackDamageType('Slashing');
    setAttackRange('5 ft Melee');
    setAttackNotes('');
    setAttackIsOffhand(false);
    setAttackWeaponSize('Medium');
    setAttackAdditionalDamage([]);
    setShowAddAttackModal(false);
  };

  const handleToggleOffhand = (id: string) => {
    onUpdateCharacter({
      ...character,
      attacks: character.attacks.map(a => a.id === id ? { ...a, isOffhand: !a.isOffhand } : a)
    });
  };

  const handleDeleteAttack = (id: string) => {
    onUpdateCharacter({
      ...character,
      attacks: character.attacks.filter(a => a.id !== id)
    });
  };

  const handleUseHealingItem = (item: any) => {
    if (item.stored) {
      alert(`"${item.name}" is Stored Away in your stash! Un-store it from inventory before using.`);
      return;
    }
    if (isCharacterDead(character)) {
      alert(`${character.name} is Dead! Items and potions cannot bring a dead character back to life. Only revives or manual HP modification can restore life.`);
      return;
    }

    const expr = getHealingExpression(item);
    const { totalHeal, breakdown } = rollHealing(expr);
    const newHp = Math.min(effectiveMaxHp, character.hpCurrent + totalHeal);
    const hpGained = newHp - character.hpCurrent;

    const updatedInventory = character.inventory.map(i => {
      if (i.id === item.id) {
        return { ...i, quantity: i.quantity - 1 };
      }
      return i;
    }).filter(i => i.quantity > 0);

    onUpdateCharacter({
      ...character,
      hpCurrent: newHp,
      inventory: updatedInventory
    });

    onRollDamage(`Consumed ${item.name} (${breakdown}) - Restored +${hpGained} HP!`, expr);
  };

  const handleCastCombatSpell = (spell: any) => {
    if (spell.level > 0 && spell.prepared === false) {
      alert(`"${spell.name}" is not prepared! Prepare it in your spellbook first.`);
      return;
    }

    if (spell.level > 0) {
      const slot = character.spellSlots.find(s => s.level === spell.level);
      if (!slot || slot.current <= 0) {
        alert(`No Level ${spell.level} spell slots remaining!`);
        return;
      }
    }

    if (isReviveSpell(spell)) {
      const expr = spell.damage || getHealingExpression(spell) || '1d8 + 3';
      const { totalHeal } = rollHealing(expr);
      const reviveHp = Math.min(effectiveMaxHp, Math.max(1, totalHeal || 1));
      const cleanedConditions = (character.conditions || []).filter(c => c !== 'Dead');

      onUpdateCharacter({
        ...character,
        hpCurrent: reviveHp,
        deathSavesFailures: 0,
        deathSavesSuccesses: 0,
        conditions: cleanedConditions,
        spellSlots: spell.level > 0
          ? character.spellSlots.map(s => s.level === spell.level ? { ...s, current: Math.max(0, s.current - 1) } : s)
          : character.spellSlots
      });

      onRollDamage(`✨ Cast ${spell.name} (Revive) - ${character.name} has been returned to life with ${reviveHp} HP!`, '1d20');
      return;
    }

    const isHealing = isHealingSpell(spell) || spell.damageType === 'Healing';

    if (isHealing) {
      if (isCharacterDead(character)) {
        alert(`${character.name} is Dead! Standard healing spells cannot bring a dead character back to life.`);
        return;
      }

      const expr = getHealingExpression(spell) || '1d8 + 3';
      const { totalHeal, breakdown } = rollHealing(expr);
      const newHp = Math.min(effectiveMaxHp, character.hpCurrent + totalHeal);
      const gained = newHp - character.hpCurrent;

      onUpdateCharacter({
        ...character,
        hpCurrent: newHp,
        spellSlots: spell.level > 0
          ? character.spellSlots.map(s => s.level === spell.level ? { ...s, current: Math.max(0, s.current - 1) } : s)
          : character.spellSlots
      });

      onRollDamage(`Cast ${spell.name} (Heal ${breakdown}) - Restored +${gained} HP!`, expr);
      return;
    }

    setTargetModalSpell(spell);
  };

  const { isVisible } = useLayoutCustomization();

  const showAttacks = isVisible('s2_attacksWeapons');
  const showCombatSpells = isVisible('s2_combatSpellsPotions');

  return (
    <div className="space-y-6">
      {/* Weapons & Attacks Panel */}
      {showAttacks && (
        <CollapsibleBox
          title={t('combat.attacksAndSpellcasting', 'Weapons, Spell Attacks & Maneuvers')}
          icon={<Swords className="w-5 h-5 text-amber-500" />}
          storageKey="sheet2_attacks"
          headerExtra={
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShow35eTwfModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 rounded-lg text-xs font-bold transition shadow"
                title={character.edition === '3.5e'
                  ? "Two-Weapon Fighting dual-wielding penalties and attack sequence"
                  : "Two-Weapon Fighting off-hand bonus action attack sequence"}
              >
                <Swords className="w-3.5 h-3.5 text-amber-400" /> Dual-Wield (TWF)
              </button>
              {character.edition === '3.5e' && (
                <button
                  onClick={() => setShow35eAoOModal(true)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 rounded-lg text-xs font-bold transition shadow"
                  title="Attacks of Opportunity budget and provocation triggers"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> AoO Strike
                </button>
              )}
              <button
                onClick={() => setShowCheatSheet(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-amber-950/90 hover:bg-amber-900 border border-amber-600/50 text-amber-300 rounded-lg text-xs font-bold transition shadow"
              >
                <BookMarked className="w-3.5 h-3.5 text-amber-400" /> {t('combat.actions', 'Actions & Rules')}
              </button>
              <button
                onClick={() => setShowAddAttackModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-amber-700/80 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition"
              >
                <Plus className="w-3.5 h-3.5" /> {t('combat.addAttack', 'Add Attack')}
              </button>
            </div>
          }
        >
          <div className="pt-1">
            {character.attacks.length === 0 ? (
              <div className="text-center py-6 px-4 border border-dashed border-stone-800 rounded-xl text-stone-500 space-y-2">
                <Swords className="w-8 h-8 mx-auto text-stone-600 opacity-60" />
                <p className="text-xs">{t('combat.noAttacksYet', 'No attacks added yet. Click "Add Attack" to configure weapons or spell attacks.')}</p>
                <button
                  onClick={() => setShowAddAttackModal(true)}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                >
                  {t('combat.addFirstAttack', '+ Add your first Weapon or Attack')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {character.attacks.map((atk) => {
                  const meta = getDamageTypeMeta(atk.damageType);
                  const is35e = character.edition === '3.5e';
                  const bab = getCharacterBab(character);
                  const sizePenaltyInfo = is35e && atk.weaponSize
                    ? calculate35eWeaponSizePenalty(character.sizeCategory || 'Medium', atk.weaponSize)
                    : null;
                  const netAttackBonus = atk.attackBonus + (sizePenaltyInfo?.penalty || 0);

                  const iterativeAttacks = is35e ? get35eIterativeAttacks(netAttackBonus, bab) : [];
                  const hasIteratives = iterativeAttacks.length > 1;

                  const has5eTwfStyle = !is35e && Boolean(
                    character.classFeatures?.some(f => f.name.toLowerCase().includes('two-weapon')) ||
                    character.feats?.some(f => f.name.toLowerCase().includes('two-weapon fighting')) ||
                    (character as any).fightingStyle?.toLowerCase().includes('two-weapon')
                  );
                  const abilities = getEffectiveAbilities(character);
                  const strMod = getAbilityModifier(abilities?.STR?.score || 10);
                  const effectiveDamage = atk.isOffhand
                    ? (is35e ? adjust35eOffhandDamageFormula(atk.damage, strMod) : adjust5eOffhandDamageFormula(atk.damage, has5eTwfStyle))
                    : atk.damage;

                  return (
                    <div
                      key={atk.id}
                      className="bg-stone-950/90 border border-stone-800 hover:border-amber-600/50 rounded-xl p-3 text-xs flex flex-col justify-between gap-2.5 transition shadow-md group min-w-0 overflow-hidden"
                    >
                      <div className="space-y-1.5 min-w-0">
                        {/* Top: Name & Badges & Delete */}
                        <div className="flex items-start justify-between gap-2 min-w-0">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-serif font-bold text-amber-200 text-sm truncate max-w-full" title={atk.name}>
                                {atk.name}
                              </span>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}>
                                <span>{meta.icon}</span>
                                <span>{atk.damageType}</span>
                              </span>
                              {atk.additionalDamageRows?.map((extraDmg, idx) => (
                                <span key={extraDmg.id || idx} className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-orange-950/80 text-orange-200 border-orange-600/60 flex items-center gap-1 shrink-0">
                                  <span>+</span>
                                  <span>{extraDmg.damage} {extraDmg.damageType}</span>
                                  {extraDmg.label && <span className="text-stone-400">({extraDmg.label})</span>}
                                </span>
                              ))}
                              {atk.range && (
                                <span className="text-[10px] text-stone-400 font-mono bg-stone-900 border border-stone-800 px-1.5 py-0.5 rounded shrink-0">
                                  {atk.range}
                                </span>
                              )}
                              {is35e && atk.weaponSize && (
                                <span
                                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${
                                    sizePenaltyInfo && sizePenaltyInfo.penalty < 0
                                      ? 'bg-rose-950/80 text-rose-300 border-rose-600/70 font-bold'
                                      : 'bg-stone-900 text-stone-300 border-stone-800'
                                  }`}
                                  title={
                                    sizePenaltyInfo && sizePenaltyInfo.penalty < 0
                                      ? `Weapon Size: ${atk.weaponSize} (${sizePenaltyInfo.penalty} attack penalty due to ${sizePenaltyInfo.stepsDiff} step difference from ${character.sizeCategory || 'Medium'} wielder)`
                                      : `Weapon Size: ${atk.weaponSize} (Appropriate size for ${character.sizeCategory || 'Medium'} wielder)`
                                  }
                                >
                                  <span>Size: {atk.weaponSize}</span>
                                  {sizePenaltyInfo && sizePenaltyInfo.penalty < 0 && (
                                    <span className="text-rose-400 font-bold font-mono">{sizePenaltyInfo.penalty}</span>
                                  )}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleToggleOffhand(atk.id)}
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 transition shrink-0 ${
                                  atk.isOffhand
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                                    : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-300 hover:border-stone-700'
                                }`}
                                title={is35e
                                  ? "Toggle Off-Hand (applies ½ STR damage modifier in 3.5e)"
                                  : "Toggle Off-Hand (suppresses positive ability modifier to damage in 5e unless TWF style is active)"}
                              >
                                <Swords className="w-2.5 h-2.5" />
                                <span>
                                  {atk.isOffhand
                                    ? (is35e
                                        ? 'Off-Hand (½ STR)'
                                        : (has5eTwfStyle ? 'Off-Hand (TWF Style)' : 'Off-Hand (No Mod)'))
                                    : 'Off-Hand: Off'}
                                </span>
                              </button>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteAttack(atk.id)}
                            className="p-1 text-stone-600 hover:text-rose-400 transition shrink-0 opacity-60 group-hover:opacity-100"
                            title="Delete Attack"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Notes / Special Rules */}
                        {atk.notes ? (
                          <p className="text-stone-400 text-[11px] leading-snug line-clamp-2">
                            {atk.notes}
                          </p>
                        ) : (
                          <p className="text-stone-600 italic text-[10px]">
                            Standard weapon or spell attack
                          </p>
                        )}

                        {/* 3.5e Iterative Attacks Progression & Full Attack Bar */}
                        {is35e && (
                          <div className="bg-stone-900/90 border border-amber-800/40 rounded-lg p-2 space-y-1.5 font-mono">
                            <div className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span>Full Attack:</span>
                                <span className="text-amber-100 font-extrabold">
                                  {format35eIterativeString(netAttackBonus, bab)}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedFullAttack(atk)}
                                className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-sans font-bold text-[10px] rounded transition shadow flex items-center gap-1 shrink-0 active:scale-95"
                                title="Open Full Attack sequence, Power Attack, Haste & Tactical modifiers"
                              >
                                <span>⚡ Full Attack</span>
                              </button>
                            </div>

                            {/* Iterative Attack Step Chips */}
                            {hasIteratives ? (
                              <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-stone-800/70">
                                <span className="text-[10px] text-stone-400 font-sans">Iterative:</span>
                                {iterativeAttacks.map((it) => (
                                  <button
                                    key={it.attackNumber}
                                    type="button"
                                    onClick={() => onRoll(`${atk.name} (${it.label})`, 20, 1, it.bonus, 'normal')}
                                    className="px-1.5 py-0.5 bg-stone-950 hover:bg-amber-950/80 text-amber-200/90 hover:text-amber-200 border border-stone-800 hover:border-amber-600/60 rounded text-[10px] transition font-bold"
                                    title={`Roll ${it.label}: d20 + ${it.bonus}`}
                                  >
                                    {it.label.slice(0, 3)}: {it.display}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[10px] text-stone-500 font-sans pt-0.5">
                                BAB +{bab} (1 attack; 2nd iterative unlocks at BAB +6)
                              </div>
                            )}

                            {/* 3.5e Critical Threat Range & Multiplier */}
                            {(() => {
                              const threat = get35eEffectiveThreatRange(atk);
                              const mult = get35eCriticalMultiplier(atk);
                              return (
                                <div className="flex items-center justify-between text-[10px] font-mono bg-stone-950/80 px-2 py-1 rounded border border-stone-800">
                                  <div className="flex items-center gap-1">
                                    <span className="text-stone-400">Crit Threat:</span>
                                    <span className="text-amber-300 font-bold">{threat.display}/{mult.display}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCritModalAttack(atk);
                                      setCritModalThreatRoll(threat.minThreat);
                                      setCritModalAttackBonus(netAttackBonus);
                                    }}
                                    className="px-1.5 py-0.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/50 text-amber-300 rounded text-[9px] font-bold transition flex items-center gap-1"
                                    title="Open 3.5e Critical Confirmation Roll & Damage Multiplier Calculator"
                                  >
                                    <span>Confirm/Crit</span>
                                  </button>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons: Snug & Equal Width with Guaranteed Containment */}
                      <div className="flex flex-col gap-1.5 pt-2 border-t border-stone-900 w-full min-w-0">
                        <div className="flex items-center gap-2 w-full min-w-0">
                          <button
                            onClick={() => onRoll(
                              `${atk.name}${sizePenaltyInfo && sizePenaltyInfo.penalty < 0 ? ` (incl. ${sizePenaltyInfo.penalty} size penalty)` : ''} Attack Roll`,
                              20,
                              1,
                              netAttackBonus,
                              'normal'
                            )}
                            className="flex-1 min-w-0 py-1.5 px-2 bg-stone-900 hover:bg-amber-600 text-amber-200 hover:text-stone-950 rounded-lg font-mono font-bold text-xs transition border border-stone-700 hover:border-amber-500 flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] overflow-hidden"
                            title={`Roll Attack: d20 + ${netAttackBonus}${sizePenaltyInfo && sizePenaltyInfo.penalty < 0 ? ` (base +${atk.attackBonus}, ${sizePenaltyInfo.penalty} weapon size penalty)` : ''}`}
                          >
                            <Crosshair className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Attack ({formatModifier(netAttackBonus)})</span>
                          </button>

                          <button
                            onClick={() => onRollDamage(`${atk.name}${atk.isOffhand ? ' (Off-Hand)' : ''} Damage (${atk.damageType})`, effectiveDamage)}
                            className="flex-1 min-w-0 py-1.5 px-2 bg-rose-950/80 hover:bg-rose-900 text-rose-200 rounded-lg font-mono font-bold text-xs transition border border-rose-600/50 hover:border-rose-400 flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] overflow-hidden"
                            title={`Roll Damage: ${effectiveDamage} (${atk.damageType})${atk.isOffhand ? (is35e ? ' - ½ STR applied' : (has5eTwfStyle ? ' - TWF Style applied' : ' - Ability mod suppressed')) : ''}`}
                          >
                            <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span className="truncate">Dmg ({effectiveDamage})</span>
                          </button>
                        </div>

                        {/* Extra Damage Roll Buttons */}
                        {atk.additionalDamageRows && atk.additionalDamageRows.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-stone-900">
                            {atk.additionalDamageRows.map((extraDmg, idx) => (
                              <button
                                key={extraDmg.id || idx}
                                onClick={() => onRollDamage(`${atk.name} Extra Damage (${extraDmg.label || extraDmg.damageType})`, extraDmg.damage)}
                                className="flex-1 min-w-[120px] py-1 px-2 bg-orange-950/60 hover:bg-orange-900 text-orange-200 rounded-lg font-mono font-bold text-[11px] transition border border-orange-700/50 hover:border-orange-500 flex items-center justify-center gap-1 shadow-sm active:scale-[0.98]"
                                title={`Roll Extra Damage: ${extraDmg.damage} (${extraDmg.damageType})`}
                              >
                                <Flame className="w-3 h-3 text-orange-400 shrink-0" />
                                <span className="truncate">+{extraDmg.damage} {extraDmg.damageType} {extraDmg.label ? `(${extraDmg.label})` : ''}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CollapsibleBox>
      )}

      {/* Combat Spells & Consumables Quick Bar */}
      {showCombatSpells && (
        <CollapsibleBox
          title="Combat Spells & Potions Quick Bar"
          icon={<Sparkles className="w-5 h-5 text-amber-500" />}
          storageKey="sheet2_combat_spells"
        >
        <div className="space-y-4 pt-2 text-xs">
          {/* Healing Potions & Items */}
          <div>
            <span className="font-serif font-bold text-amber-300 text-xs block mb-2 font-sans">
              Consumable Potions & Items (Inventory)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {character.inventory.filter(i => isHealingItem(i)).map((item) => (
                <div
                  key={item.id}
                  className="bg-stone-950 p-2 rounded-xl border border-stone-800 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-bold text-emerald-300">{item.name}</div>
                    <div className="text-[10px] text-stone-400 font-mono">Qty: {item.quantity}</div>
                  </div>
                  <button
                    onClick={() => handleUseHealingItem(item)}
                    className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-600/50 rounded-lg font-bold transition shrink-0"
                  >
                    Drink / Heal
                  </button>
                </div>
              ))}
              {character.inventory.filter(i => isHealingItem(i)).length === 0 && (
                <p className="text-stone-500 italic text-[11px] col-span-full">
                  No potions or healing items in inventory.
                </p>
              )}
            </div>
          </div>

          {/* Quick Cast Combat Spells */}
          <div>
            <span className="font-serif font-bold text-amber-300 text-xs block mb-2 font-sans">
              Prepared Spells (Click to Cast & Track Slots)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {character.spells.filter(s => s.prepared !== false).map((spell) => (
                <div
                  key={spell.id}
                  className="bg-stone-950 p-2 rounded-xl border border-stone-800 flex items-center justify-between gap-2"
                >
                  <div className="truncate">
                    <div className="font-bold text-amber-200 truncate">{spell.name}</div>
                    <div className="text-[10px] text-stone-400 font-mono">
                      {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {character.edition === '3.5e' && (
                      <button
                        type="button"
                        onClick={() => setMetamagicModalSpell(spell)}
                        className="px-2 py-1 bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-600/50 rounded-lg font-bold transition text-[11px] flex items-center gap-1 shadow cursor-pointer"
                        title="Apply 3.5e Metamagic Feats (Empower, Maximize, Quicken, Extend, Enlarge, Widen, Silent, Still)"
                      >
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span>Metamagic</span>
                      </button>
                    )}
                    {isShapeshiftAbility(spell.name, spell.description) && (
                      <button
                        onClick={onOpenShapeshift}
                        className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/60 rounded-lg font-bold transition text-[11px] flex items-center gap-1 shadow cursor-pointer"
                        title="Launch Nexus Shapeshift Engine"
                      >
                        <span>🐾</span>
                        <span>Shapeshift</span>
                      </button>
                    )}
                    {isCompanionSummonAbility(spell.name, spell.description) && (
                      <button
                        onClick={onOpenSummonCompanion}
                        className="px-2 py-1 bg-teal-950 hover:bg-teal-900 text-teal-200 border border-teal-500/60 rounded-lg font-bold transition text-[11px] flex items-center gap-1 shadow cursor-pointer"
                        title="Launch Nexus Companion & Summon Engine"
                      >
                        <span>🦅</span>
                        <span>Summon</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleCastCombatSpell(spell)}
                      className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 text-amber-200 border border-amber-600/50 rounded-lg font-bold transition"
                    >
                      Cast
                    </button>
                  </div>
                </div>
              ))}
              {character.spells.filter(s => s.prepared !== false).length === 0 && (
                <p className="text-stone-500 italic text-[11px] col-span-full">
                  No prepared spells found in spellbook.
                </p>
              )}
            </div>
          </div>
        </div>
      </CollapsibleBox>
      )}

      {/* MODAL: Add Attack */}
      {showAddAttackModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-amber-600/50 rounded-2xl p-6 max-w-lg w-full shadow-2xl text-stone-100 space-y-4">
            <h3 className="text-lg font-serif font-bold text-amber-300 flex items-center gap-2 border-b border-stone-800 pb-2">
              <Swords className="w-5 h-5 text-amber-500" /> Configure New Weapon / Attack
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Attack / Weapon Name *</label>
                <input
                  type="text"
                  value={attackName}
                  onChange={(e) => setAttackName(e.target.value)}
                  placeholder="e.g. Longsword, Fire Bolt, Bite"
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Attack Bonus Modifier</label>
                  <input
                    type="number"
                    value={attackBonus}
                    onChange={(e) => setAttackBonus(parseInt(e.target.value) || 0)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Damage Formula</label>
                  <input
                    type="text"
                    value={attackDamage}
                    onChange={(e) => setAttackDamage(e.target.value)}
                    placeholder="e.g. 1d8 + 3"
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Damage Type</label>
                  <select
                    value={attackDamageType}
                    onChange={(e) => setAttackDamageType(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                  >
                    {OFFICIAL_DAMAGE_TYPES.map(dt => (
                      <option key={dt.name} value={dt.name}>{dt.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Range / Reach</label>
                  <input
                    type="text"
                    value={attackRange}
                    onChange={(e) => setAttackRange(e.target.value)}
                    placeholder="e.g. 5 ft Melee or 60 ft Ranged"
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 bg-stone-950/60 rounded-xl border border-stone-800">
                <input
                  type="checkbox"
                  id="attack-is-offhand"
                  checked={attackIsOffhand}
                  onChange={(e) => setAttackIsOffhand(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0 bg-stone-900 border-stone-700"
                />
                <label htmlFor="attack-is-offhand" className="cursor-pointer text-stone-200 font-medium select-none">
                  Designate as Off-Hand Weapon ({character.edition === '3.5e' ? '½ STR damage bonus' : 'Suppresses ability modifier to damage unless TWF style'})
                </label>
              </div>

              {is35e && (
                <div className="p-2.5 bg-stone-950/60 rounded-xl border border-stone-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-stone-300 font-semibold text-xs">
                      Weapon Size Category (PHB p. 113)
                    </label>
                    <span className="text-[11px] text-stone-400 font-mono">
                      Wielder: <strong className="text-amber-300">{character.sizeCategory || 'Medium'}</strong>
                    </span>
                  </div>
                  <select
                    value={attackWeaponSize}
                    onChange={(e) => setAttackWeaponSize(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg p-1.5 text-stone-100 font-mono text-xs cursor-pointer"
                  >
                    {SIZE_CATEGORY_ORDER.map(sz => (
                      <option key={sz} value={sz}>
                        {sz} {sz === (character.sizeCategory || 'Medium') ? '(Matches Wielder Size)' : ''}
                      </option>
                    ))}
                  </select>
                  {(() => {
                    const penalty = calculate35eWeaponSizePenalty(character.sizeCategory || 'Medium', attackWeaponSize);
                    if (penalty.penalty < 0) {
                      return (
                        <p className="text-[11px] text-amber-300 font-mono">
                          ⚠️ {penalty.penalty} cumulative attack penalty ({penalty.stepsDiff} size step difference from {character.sizeCategory || 'Medium'} wielder)
                        </p>
                      );
                    }
                    return (
                      <p className="text-[11px] text-emerald-400 font-mono">
                        ✓ No size penalty (properly sized for {character.sizeCategory || 'Medium'} creature)
                      </p>
                    );
                  })()}
                </div>
              )}

              {/* Additional Damage Rows in Add Attack Modal */}
              <div className="bg-stone-950/60 p-2.5 rounded-xl border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-300">
                    Additional Damage Rows {attackAdditionalDamage.length > 0 && `(${attackAdditionalDamage.length}/10)`}
                  </span>
                  <button
                    type="button"
                    disabled={attackAdditionalDamage.length >= 10}
                    onClick={() => {
                      if (attackAdditionalDamage.length >= 10) return;
                      setAttackAdditionalDamage(prev => [
                        ...prev,
                        {
                          id: 'atk-dmg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
                          damage: '1d6',
                          damageType: 'Fire',
                          label: ''
                        }
                      ]);
                    }}
                    className={`px-2 py-0.5 text-[10px] rounded flex items-center gap-1 transition font-bold ${
                      attackAdditionalDamage.length >= 10
                        ? 'bg-stone-800 text-stone-500 cursor-not-allowed opacity-60'
                        : 'bg-amber-600/80 hover:bg-amber-600 text-stone-950 cursor-pointer active:scale-95'
                    }`}
                    title={attackAdditionalDamage.length >= 10 ? 'Maximum 10 additional damage rows reached' : 'Add extra damage row'}
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Damage Row</span>
                  </button>
                </div>

                {attackAdditionalDamage.length === 0 ? (
                  <p className="text-[11px] text-stone-500 italic">No additional damage types added (e.g. +2d6 Radiant, 1d4 Poison).</p>
                ) : (
                  <div className="space-y-1.5">
                    {attackAdditionalDamage.map((row, idx) => (
                      <div key={row.id || idx} className="grid grid-cols-12 gap-1.5 items-center font-mono bg-stone-900 p-1.5 rounded border border-stone-800">
                        <div className="col-span-4">
                          <input
                            type="text"
                            value={row.damage}
                            onChange={(e) => {
                              const updated = [...attackAdditionalDamage];
                              updated[idx] = { ...updated[idx], damage: e.target.value };
                              setAttackAdditionalDamage(updated);
                            }}
                            placeholder="e.g. 1d6"
                            className="w-full bg-stone-800 border border-stone-700 rounded p-1 text-xs text-amber-200"
                          />
                        </div>
                        <div className="col-span-4">
                          <select
                            value={row.damageType}
                            onChange={(e) => {
                              const updated = [...attackAdditionalDamage];
                              updated[idx] = { ...updated[idx], damageType: e.target.value };
                              setAttackAdditionalDamage(updated);
                            }}
                            className="w-full bg-stone-800 border border-stone-700 rounded p-1 text-xs text-stone-200"
                          >
                            {OFFICIAL_DAMAGE_TYPES.map(dt => (
                              <option key={dt.name} value={dt.name}>{dt.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <input
                            type="text"
                            value={row.label || ''}
                            onChange={(e) => {
                              const updated = [...attackAdditionalDamage];
                              updated[idx] = { ...updated[idx], label: e.target.value };
                              setAttackAdditionalDamage(updated);
                            }}
                            placeholder="Condition"
                            className="w-full bg-stone-800 border border-stone-700 rounded p-1 text-[11px] text-stone-300 font-sans"
                          />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => {
                              setAttackAdditionalDamage(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="text-stone-500 hover:text-rose-400 p-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Notes / Special Effects</label>
                <textarea
                  value={attackNotes}
                  onChange={(e) => setAttackNotes(e.target.value)}
                  placeholder="e.g. Versatile (1d10), Finesse, Reach..."
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                onClick={() => setShowAddAttackModal(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAttack}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg"
              >
                Save Attack
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Actions & Combat Cheat Sheet */}
      {showCheatSheet && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-amber-600/50 rounded-2xl p-6 max-w-2xl w-full shadow-2xl text-stone-100 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-lg font-serif font-bold text-amber-300 flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-amber-500" /> D&D Combat Actions Reference
              </h3>
              <button
                onClick={() => setShowCheatSheet(false)}
                className="px-3 py-1 bg-stone-800 hover:bg-stone-700 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {(['All', 'Action', 'Bonus Action', 'Reaction', 'Condition'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCheatCategory(cat)}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    cheatCategory === cat ? 'bg-amber-600 text-white' : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search combat rules, Grapple, Dodge, Opportunity Attacks..."
                className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {COMBAT_CHEAT_SHEET.filter(rule => {
                const matchCat = cheatCategory === 'All' || rule.category === cheatCategory;
                const matchSearch = rule.name.toLowerCase().includes(searchQuery.toLowerCase()) || rule.description.toLowerCase().includes(searchQuery.toLowerCase());
                return matchCat && matchSearch;
              }).map(rule => (
                <div key={rule.id} className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-amber-200 text-sm">{rule.name}</span>
                    <span className="text-[10px] font-mono bg-stone-800 px-2 py-0.5 rounded text-stone-400">
                      {rule.category}
                    </span>
                  </div>
                  <p className="text-stone-300 text-xs leading-relaxed">{rule.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3.5e Full Attack & Tactical Modifiers Modal */}
      {selectedFullAttack && (
        <FullAttackModal
          isOpen={Boolean(selectedFullAttack)}
          onClose={() => setSelectedFullAttack(null)}
          character={character}
          attack={selectedFullAttack}
          onRoll={onRoll}
          onRollDamage={onRollDamage}
        />
      )}

      {/* 3.5e Critical Threat Confirmation & Damage Multiplier Modal */}
      {critModalAttack && (
        <CriticalConfirmationModal
          isOpen={Boolean(critModalAttack)}
          onClose={() => setCritModalAttack(null)}
          attack={critModalAttack}
          character={character}
          initialThreatRoll={critModalThreatRoll}
          initialAttackBonus={critModalAttackBonus}
          onRoll={onRoll}
          onRollDamage={onRollDamage}
        />
      )}

      {/* 3.5e Metamagic Spell Enhancer Modal */}
      {metamagicModalSpell && (
        <MetamagicSpellModal
          isOpen={Boolean(metamagicModalSpell)}
          onClose={() => setMetamagicModalSpell(null)}
          spell={metamagicModalSpell}
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          onRollDamage={onRollDamage}
        />
      )}

      {/* 3.5e Two-Weapon Fighting Modal */}
      {character.edition === '3.5e' && (
        <TwoWeaponFightingModal
          isOpen={show35eTwfModal}
          onClose={() => setShow35eTwfModal(false)}
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          onRoll={onRoll}
          onRollDamage={onRollDamage}
        />
      )}

      {/* 3.5e Attacks of Opportunity Tracker Modal */}
      {character.edition === '3.5e' && (
        <AoOTrackerModal
          isOpen={show35eAoOModal}
          onClose={() => setShow35eAoOModal(false)}
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          onRollAttack={(label, bonus) => onRoll(label, 20, 1, bonus, 'normal')}
        />
      )}
    </div>
  );
};
