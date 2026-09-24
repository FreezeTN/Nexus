import React, { useState } from 'react';
import { Attack, CharacterData, WeaponDamageRow, GearItem } from '../../../types';
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
  calculate35eAttackBonus,
  calculate35eDamageFormula,
  format35eIterativeString,
  get35eEffectiveThreatRange,
  get35eCriticalMultiplier,
  calculate35eCriticalDamage,
  calculate5eCriticalDamage,
  get5eRageBonus,
  get5eSneakAttackInfo,
  get5ePaladinSmiteInfo,
  adjust35eOffhandDamageFormula,
  adjust5eOffhandDamageFormula,
  getEffectiveAbilities,
  getAbilityModifier,
  calculate35eWeaponSizePenalty,
  SIZE_CATEGORY_ORDER,
  isCharacterSpellcaster
} from '../../../utils/dndCalculations';
import {
  Swords,
  Plus,
  Minus,
  Trash2,
  Dices,
  BookMarked,
  Search,
  Crosshair,
  Flame,
  Pencil,
  Sparkles,
  Zap,
  RefreshCw,
  Check,
  Target,
  AlertTriangle
} from 'lucide-react';
import { syncInventoryWeaponsToAttacks } from '../../../utils/gearAttackSync';
import { useLayoutCustomization } from '../../../utils/layoutCustomization';
import { useLanguage } from '../../../i18n/LanguageContext';
import { FullAttackModal } from '../../modals/FullAttackModal';
import { CriticalConfirmationModal } from '../../modals/CriticalConfirmationModal';
import { MetamagicSpellModal } from '../../modals/MetamagicSpellModal';
import { TwoWeaponFightingModal } from '../../modals/TwoWeaponFightingModal';
import { AoOTrackerModal } from '../../modals/AoOTrackerModal';
import { EditAttackModal } from '../../modals/EditAttackModal';
import { Spell, RuleEdition } from '../../../types';

interface AttacksSpellsPanelProps {
  character: CharacterData;
  edition?: RuleEdition;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRoll: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
  onRollDamage: (label: string, expression: string) => void;
  setTargetModalSpell: (spell: any) => void;
  onOpenShapeshift?: () => void;
  onOpenSummonCompanion?: () => void;
}

export const AttacksSpellsPanel: React.FC<AttacksSpellsPanelProps> = ({
  character,
  edition,
  onUpdateCharacter,
  onRoll,
  onRollDamage,
  setTargetModalSpell,
  onOpenShapeshift,
  onOpenSummonCompanion
}) => {
  const { t } = useLanguage();
  const is35e = (edition || character.edition) === '3.5e';
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
  const [justSyncedWeapons, setJustSyncedWeapons] = useState(false);
  const [editingAttack, setEditingAttack] = useState<Attack | null>(null);
  const [showEditAttackModal, setShowEditAttackModal] = useState(false);

  // 5e Tactical Combat Augments & Power Attack
  const [powerAttackWeaponIds, setPowerAttackWeaponIds] = useState<Record<string, boolean>>({});
  const [activeSmiteAttackId, setActiveSmiteAttackId] = useState<string | null>(null);
  const [smiteSlotLevel, setSmiteSlotLevel] = useState<number>(1);
  const [smiteIsFiendOrUndead, setSmiteIsFiendOrUndead] = useState<boolean>(false);
  const [smiteIsCrit, setSmiteIsCrit] = useState<boolean>(false);
  const [panelNotice, setPanelNotice] = useState<string | null>(null);

  const showPanelNotice = (msg: string) => {
    setPanelNotice(msg);
    setTimeout(() => {
      setPanelNotice(prev => (prev === msg ? null : prev));
    }, 4000);
  };

  const handleExecuteDivineSmite = (atk: Attack) => {
    const slot = (character.spellSlots || []).find(s => s.level === smiteSlotLevel);
    if (!slot || slot.current <= 0) {
      showPanelNotice(`⚠️ No Level ${smiteSlotLevel} spell slots remaining!`);
      return;
    }

    const updatedSlots = (character.spellSlots || []).map(s => {
      if (s.level === smiteSlotLevel) {
        return { ...s, current: Math.max(0, s.current - 1) };
      }
      return s;
    });

    onUpdateCharacter({
      ...character,
      spellSlots: updatedSlots
    });

    let diceCount = Math.min(5, 1 + smiteSlotLevel);
    if (smiteIsFiendOrUndead) {
      diceCount = Math.min(6, diceCount + 1);
    }
    if (smiteIsCrit) {
      diceCount = diceCount * 2;
    }

    const smiteDmgExpr = `${diceCount}d8`;
    const critTag = smiteIsCrit ? ' [CRITICAL HIT]' : '';
    const fiendTag = smiteIsFiendOrUndead ? ' (+1d8 vs Fiend/Undead)' : '';

    onRollDamage(
      `⚡ ${atk.name} Divine Smite (Lvl ${smiteSlotLevel} Slot${fiendTag}${critTag})`,
      `${smiteDmgExpr} Radiant`
    );

    setActiveSmiteAttackId(null);
  };

  const handleOpenEditAttack = (atk: Attack) => {
    setEditingAttack(atk);
    setShowEditAttackModal(true);
  };

  const handleOpenAddAttack = () => {
    setEditingAttack(null);
    setShowEditAttackModal(true);
  };

  const handleSaveAttack = (savedAttack: Attack) => {
    const exists = character.attacks.some(a => a.id === savedAttack.id);
    if (exists) {
      onUpdateCharacter({
        ...character,
        attacks: character.attacks.map(a => a.id === savedAttack.id ? savedAttack : a)
      });
    } else {
      onUpdateCharacter({
        ...character,
        attacks: [...character.attacks, savedAttack]
      });
    }
  };

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
      showPanelNotice('Please enter a Weapon / Spell Name before saving.');
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

  const handleCycleGrip35e = (id: string) => {
    onUpdateCharacter({
      ...character,
      attacks: character.attacks.map(a => {
        if (a.id !== id) return a;
        // Cycle: 1-Handed (standard) -> 2-Handed (1.5x STR) -> Off-Hand (0.5x STR) -> 1-Handed
        if (a.isTwoHanded) {
          return { ...a, isTwoHanded: false, isOffhand: true };
        } else if (a.isOffhand) {
          return { ...a, isTwoHanded: false, isOffhand: false };
        } else {
          return { ...a, isTwoHanded: true, isOffhand: false };
        }
      })
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
      showPanelNotice(`"${item.name}" is Stored Away in your stash! Un-store it from inventory before using.`);
      return;
    }
    if (isCharacterDead(character)) {
      showPanelNotice(`${character.name} is Dead! Items and potions cannot bring a dead character back to life. Only revives or manual HP modification can restore life.`);
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

  const handleSpendAmmunition = (item: any) => {
    if ((item.quantity || 0) <= 0) {
      showPanelNotice(`Out of ${item.name}! You have no ammunition left.`);
      return;
    }
    const nextQty = Math.max(0, (item.quantity || 1) - 1);
    const updatedInventory = character.inventory.map(i => {
      if (i.id === item.id) {
        return { ...i, quantity: nextQty };
      }
      return i;
    });

    onUpdateCharacter({
      ...character,
      inventory: updatedInventory
    });

    onRollDamage(`🏹 Expended 1 ${item.name} (${nextQty} remaining)`, '0');
  };

  const handleAdjustItemQuantity = (item: any, delta: number) => {
    const nextQty = Math.max(0, (item.quantity || 0) + delta);
    const updatedInventory = character.inventory.map(i => {
      if (i.id === item.id) {
        return { ...i, quantity: nextQty };
      }
      return i;
    });

    onUpdateCharacter({
      ...character,
      inventory: updatedInventory
    });
  };

  const handleQuickAddAmmo = (ammoName: string, defaultQty: number = 20, weight: number = 1) => {
    const existing = character.inventory.find(i => i.name.toLowerCase() === ammoName.toLowerCase());
    if (existing) {
      handleAdjustItemQuantity(existing, defaultQty);
    } else {
      const newItem: GearItem = {
        id: `ammo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: ammoName,
        quantity: defaultQty,
        weight: weight,
        equipped: false,
        itemType: 'Ammunition',
        notes: `Ammunition bundle (${defaultQty} count).`
      };
      onUpdateCharacter({
        ...character,
        inventory: [...(character.inventory || []), newItem]
      });
    }
  };

  const handleRecoverAmmunition = (item: any) => {
    const recoverCount = Math.max(1, Math.floor((item.quantity || 1) / 2));
    handleAdjustItemQuantity(item, recoverCount);
    onRollDamage(`🏹 Battlefield Search (PHB p. 146): Recovered half spent ammunition (+${recoverCount} ${item.name})!`, '0');
  };

  const handleCastCombatSpell = (spell: any) => {
    if (spell.level > 0 && spell.prepared === false) {
      showPanelNotice(`"${spell.name}" is not prepared! Prepare it in your spellbook first.`);
      return;
    }

    if (spell.level > 0) {
      const slot = character.spellSlots.find(s => s.level === spell.level);
      if (!slot || slot.current <= 0) {
        showPanelNotice(`No Level ${spell.level} spell slots remaining!`);
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
        showPanelNotice(`${character.name} is Dead! Standard healing spells cannot bring a dead character back to life.`);
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
    <div className="space-y-6 relative">
      {/* Dynamic Feedback Banner */}
      {panelNotice && (
        <div className="sticky top-2 z-30 bg-amber-950/95 border border-amber-500/80 text-amber-100 p-3 rounded-xl shadow-lg flex items-center justify-between gap-3 text-xs font-semibold backdrop-blur-md animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="text-base">⚡</span>
            <span>{panelNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setPanelNotice(null)}
            className="p-1 hover:bg-white/10 rounded text-stone-400 hover:text-white transition cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Weapons & Attacks Panel */}
      {showAttacks && (
        <CollapsibleBox
          title={t('combat.attacksAndSpellcasting', 'Weapons, Spell Attacks & Maneuvers')}
          icon={<Swords className="w-5 h-5 text-amber-500" />}
          storageKey="sheet2_attacks"
          headerExtra={
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  const synced = syncInventoryWeaponsToAttacks(character);
                  onUpdateCharacter(synced);
                  setJustSyncedWeapons(true);
                  setTimeout(() => setJustSyncedWeapons(false), 2000);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 border rounded-lg text-xs font-bold transition shadow ${
                  justSyncedWeapons
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                    : 'bg-stone-900 hover:bg-stone-800 border-stone-700 text-stone-200'
                }`}
                title="Synchronize attacks with currently equipped weapons in inventory"
              >
                {justSyncedWeapons ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Synced!
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" /> Sync Weapons
                  </>
                )}
              </button>
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
                onClick={handleOpenAddAttack}
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
                  onClick={handleOpenAddAttack}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                >
                  {t('combat.addFirstAttack', '+ Add your first Weapon or Attack')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {character.attacks.map((atk) => {
                  const meta = getDamageTypeMeta(atk.damageType);
                  const bab = getCharacterBab(character);
                  const atk35e = is35e ? calculate35eAttackBonus(character, atk) : null;
                  const dmg35e = is35e ? calculate35eDamageFormula(character, atk) : null;

                  const isMelee = (atk.range || '').toLowerCase().includes('melee') || (atk.range || '').toLowerCase().includes('5 ft') || !atk.range?.toLowerCase().includes('range');
                  const isRanged = (atk.range || '').toLowerCase().includes('range') || (atk.range ? parseInt(atk.range) > 10 : false);
                  const isHeavyOrTwoHanded = (atk.notes || '').toLowerCase().includes('heavy') || (atk.notes || '').toLowerCase().includes('two-handed') || atk.isTwoHanded;
                  const isFinesseOrRanged = isRanged || (atk.notes || '').toLowerCase().includes('finesse') || ['dagger', 'rapier', 'shortsword', 'scimitar', 'whip', 'dart'].some(w => atk.name.toLowerCase().includes(w));

                  const isPowerAttackActive = Boolean(powerAttackWeaponIds[atk.id]);
                  const powerAttackPen = isPowerAttackActive ? -5 : 0;
                  const powerAttackDmgBonus = isPowerAttackActive ? 10 : 0;

                  const rageInfo = get5eRageBonus(character);
                  const rageBonus = (!is35e && rageInfo.isRaging && isMelee) ? rageInfo.bonusDamage : 0;
                  const sneakInfo = get5eSneakAttackInfo(character);
                  const smiteInfo = get5ePaladinSmiteInfo(character);

                  const sizePenaltyInfo = is35e && atk.weaponSize
                    ? calculate35eWeaponSizePenalty(character.sizeCategory || 'Medium', atk.weaponSize)
                    : null;

                  const has5eTwfStyle = !is35e && Boolean(
                    character.classFeatures?.some(f => f.name.toLowerCase().includes('two-weapon')) ||
                    character.feats?.some(f => f.name.toLowerCase().includes('two-weapon fighting')) ||
                    (character as any).fightingStyle?.toLowerCase().includes('two-weapon')
                  );

                  let baseDamageFor5e = atk.isOffhand ? adjust5eOffhandDamageFormula(atk.damage, has5eTwfStyle) : atk.damage;
                  if (rageBonus > 0) {
                    baseDamageFor5e = `${baseDamageFor5e} + ${rageBonus}`;
                  }
                  if (powerAttackDmgBonus > 0) {
                    baseDamageFor5e = `${baseDamageFor5e} + ${powerAttackDmgBonus}`;
                  }

                  const effectiveDamage = is35e
                    ? (dmg35e?.damageFormula ?? atk.damage)
                    : baseDamageFor5e;

                  const netAttackBonus = (is35e
                    ? (atk35e?.totalAttackBonus ?? atk.attackBonus)
                    : atk.attackBonus + (sizePenaltyInfo?.penalty || 0)) + powerAttackPen;

                  const iterativeAttacks = is35e && atk35e ? atk35e.iterativeAttacks : (is35e ? get35eIterativeAttacks(netAttackBonus, bab) : []);
                  const hasIteratives = iterativeAttacks.length > 1;

                  return (
                    <div
                      key={atk.id}
                      className="bg-stone-950/90 border border-stone-800 hover:border-amber-600/50 rounded-xl p-3 text-xs flex flex-col justify-between gap-2.5 transition shadow-md group min-w-0 overflow-hidden"
                    >
                      <div className="space-y-1.5 min-w-0">
                        {/* Top: Name & Badges & Edit / Delete */}
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
                              {is35e && (
                                <button
                                  type="button"
                                  onClick={() => handleCycleGrip35e(atk.id)}
                                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 transition shrink-0 cursor-pointer ${
                                    atk.isTwoHanded
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                                      : atk.isOffhand
                                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/50 font-bold'
                                      : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-300 hover:border-stone-700'
                                  }`}
                                  title="Click to cycle weapon grip: 1-Handed (1× STR) ➔ 2-Handed (1.5× STR) ➔ Off-Hand (½ STR)"
                                >
                                  <Swords className="w-2.5 h-2.5" />
                                  <span>
                                    {atk.isTwoHanded ? '2-Handed (1.5× STR)' : atk.isOffhand ? 'Off-Hand (½ STR)' : '1-Handed (1× STR)'}
                                  </span>
                                </button>
                              )}
                              {is35e && atk.enhancementBonus && atk.enhancementBonus > 0 && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full border bg-amber-950/60 text-amber-300 border-amber-700/60">
                                  +{atk.enhancementBonus} Magic
                                </span>
                              )}
                              {atk.inventoryItemId && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full border bg-emerald-950/60 text-emerald-300 border-emerald-600/60 flex items-center gap-1" title="Synchronized from equipped inventory weapon">
                                  <span>🗡️</span>
                                  <span>Gear</span>
                                </span>
                              )}
                              {atk.isNatural && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full border bg-emerald-950/60 text-emerald-300 border-emerald-600/60">
                                  🐾 Natural
                                </span>
                              )}
                              {atk.isSecondaryNatural && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full border bg-orange-950/60 text-orange-300 border-orange-600/60">
                                  Secondary (-5)
                                </span>
                              )}
                              {atk.isSoleNaturalAttack && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full border bg-lime-950/60 text-lime-300 border-lime-600/60">
                                  Sole (1.5× STR)
                                </span>
                              )}
                              {!is35e && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleOffhand(atk.id)}
                                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 transition shrink-0 ${
                                    atk.isOffhand
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                                      : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-300 hover:border-stone-700'
                                  }`}
                                  title="Toggle Off-Hand (suppresses positive ability modifier to damage in 5e unless TWF style is active)"
                                >
                                  <Swords className="w-2.5 h-2.5" />
                                  <span>
                                    {atk.isOffhand
                                      ? (has5eTwfStyle ? 'Off-Hand (TWF Style)' : 'Off-Hand (No Mod)')
                                      : 'Off-Hand: Off'}
                                  </span>
                                </button>
                              )}
                              {!is35e && rageBonus > 0 && (
                                <span
                                  className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-red-950/80 text-red-300 border-red-600/70 flex items-center gap-1 shrink-0"
                                  title={`Barbarian Rage active: +${rageBonus} melee damage`}
                                >
                                  <span>🔥</span>
                                  <span>+{rageBonus} Rage</span>
                                </span>
                              )}
                              {(isHeavyOrTwoHanded || isRanged) && (
                                <button
                                  type="button"
                                  onClick={() => setPowerAttackWeaponIds(prev => ({ ...prev, [atk.id]: !prev[atk.id] }))}
                                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 transition shrink-0 cursor-pointer ${
                                    isPowerAttackActive
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                                      : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-300 hover:border-stone-700'
                                  }`}
                                  title={isRanged ? 'Toggle Sharpshooter (-5 to hit, +10 damage)' : 'Toggle Great Weapon Master / Power Attack (-5 to hit, +10 damage)'}
                                >
                                  <Target className="w-2.5 h-2.5" />
                                  <span>{isPowerAttackActive ? (isRanged ? 'Sharpshooter (-5/+10)' : 'GWM (-5/+10)') : (isRanged ? 'Sharpshooter: Off' : 'GWM: Off')}</span>
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleOpenEditAttack(atk)}
                              className="p-1 text-stone-500 hover:text-amber-400 transition opacity-70 group-hover:opacity-100"
                              title="Edit Weapon & Attack Properties"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAttack(atk.id)}
                              className="p-1 text-stone-600 hover:text-rose-400 transition opacity-60 group-hover:opacity-100"
                              title="Delete Attack"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
                                  {atk35e?.fullAttackDisplay || format35eIterativeString(netAttackBonus, bab)}
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

                            {/* Dynamic breakdown line */}
                            {atk35e && (
                              <div className="text-[10px] text-stone-400 border-t border-stone-800/80 pt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 font-mono">
                                <span title="Calculated Attack Formula Breakdown">
                                  <span className="text-stone-500">Atk: </span>
                                  <span className="text-amber-300/90">{atk35e.breakdown}</span>
                                </span>
                                {dmg35e && (
                                  <span title="Calculated Damage Formula Breakdown">
                                    <span className="text-stone-500">Dmg: </span>
                                    <span className="text-rose-300/90">{dmg35e.breakdown}</span>
                                  </span>
                                )}
                              </div>
                            )}

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
                              `${atk.name}${isPowerAttackActive ? ' (-5 Power Attack)' : ''}${sizePenaltyInfo && sizePenaltyInfo.penalty < 0 ? ` (incl. ${sizePenaltyInfo.penalty} size penalty)` : ''} Attack Roll`,
                              20,
                              1,
                              netAttackBonus,
                              'normal'
                            )}
                            className="flex-1 min-w-0 py-1.5 px-2 bg-stone-900 hover:bg-amber-600 text-amber-200 hover:text-stone-950 rounded-lg font-mono font-bold text-xs transition border border-stone-700 hover:border-amber-500 flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] overflow-hidden"
                            title={`Roll Attack: d20 + ${netAttackBonus}${is35e && atk35e ? ` (${atk35e.breakdown})` : ` (base +${atk.attackBonus}${powerAttackPen ? ` ${powerAttackPen} PA` : ''})`}`}
                          >
                            <Crosshair className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Attack ({formatModifier(netAttackBonus)})</span>
                          </button>

                          <button
                            onClick={() => onRollDamage(
                              `${atk.name}${atk.isOffhand ? ' (Off-Hand)' : ''}${rageBonus > 0 ? ' (+Rage)' : ''}${isPowerAttackActive ? ' (+10 PA)' : ''} Damage (${atk.damageType})`,
                              effectiveDamage
                            )}
                            className="flex-1 min-w-0 py-1.5 px-2 bg-rose-950/80 hover:bg-rose-900 text-rose-200 rounded-lg font-mono font-bold text-xs transition border border-rose-600/50 hover:border-rose-400 flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] overflow-hidden"
                            title={`Roll Damage: ${effectiveDamage} (${atk.damageType})${is35e && dmg35e ? ` (${dmg35e.breakdown})` : ''}`}
                          >
                            <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span className="truncate">Dmg ({effectiveDamage})</span>
                          </button>
                        </div>

                        {/* Combat Augments: Critical Hit, Sneak Attack, Divine Smite */}
                        <div className="flex items-center gap-1.5 flex-wrap w-full min-w-0">
                          {/* Critical Hit Roll */}
                          {(() => {
                            if (is35e) {
                              const mult = get35eCriticalMultiplier(atk).multiplier;
                              const crit35e = calculate35eCriticalDamage(effectiveDamage, mult);
                              return (
                                <button
                                  type="button"
                                  onClick={() => onRollDamage(`⚡ ${atk.name} CRITICAL HIT Damage (×${mult}) [${atk.damageType}]`, crit35e.multipliedExpr)}
                                  className="flex-1 min-w-[75px] py-1 px-1.5 bg-amber-950/70 hover:bg-amber-900 text-amber-200 hover:text-amber-100 rounded-lg font-mono font-bold text-[11px] transition border border-amber-600/50 hover:border-amber-400 flex items-center justify-center gap-1 shadow-sm active:scale-[0.98]"
                                  title={`Roll 3.5e Critical Damage: ${crit35e.multipliedExpr} (×${mult} Multiplier)`}
                                >
                                  <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span className="truncate">Crit ⚡ (×{mult})</span>
                                </button>
                              );
                            } else {
                              const crit5e = calculate5eCriticalDamage(effectiveDamage, character, isMelee);
                              return (
                                <button
                                  type="button"
                                  onClick={() => onRollDamage(`⚡ ${atk.name} CRITICAL HIT Damage (${atk.damageType}) [${crit5e.breakdown}]`, crit5e.critExpr)}
                                  className="flex-1 min-w-[75px] py-1 px-1.5 bg-amber-950/70 hover:bg-amber-900 text-amber-200 hover:text-amber-100 rounded-lg font-mono font-bold text-[11px] transition border border-amber-600/50 hover:border-amber-400 flex items-center justify-center gap-1 shadow-sm active:scale-[0.98]"
                                  title={`Roll 5e Critical Damage: ${crit5e.critExpr} (${crit5e.breakdown})`}
                                >
                                  <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span className="truncate">Crit ⚡ ({crit5e.critExpr})</span>
                                </button>
                              );
                            }
                          })()}

                          {/* Sneak Attack Quick Trigger (Rogue) */}
                          {!is35e && sneakInfo.hasSneakAttack && isFinesseOrRanged && (
                            <button
                              type="button"
                              onClick={() => {
                                onRollDamage(
                                  `🗡️ ${atk.name} + Sneak Attack (${atk.damageType}) [Weapon + ${sneakInfo.damageExpr}]`,
                                  `${effectiveDamage} + ${sneakInfo.damageExpr}`
                                );
                              }}
                              className="flex-1 min-w-[95px] py-1 px-1.5 bg-red-950/80 hover:bg-red-900 text-red-200 hover:text-red-100 rounded-lg font-mono font-bold text-[11px] transition border border-red-600/50 hover:border-red-400 flex items-center justify-center gap-1 shadow-sm active:scale-[0.98]"
                              title={`Roll Weapon Damage + Sneak Attack (+${sneakInfo.damageExpr})`}
                            >
                              <span className="shrink-0">🗡️</span>
                              <span className="truncate">+Sneak ({sneakInfo.damageExpr})</span>
                            </button>
                          )}

                          {/* Divine Smite Trigger (Paladin) */}
                          {!is35e && smiteInfo.canSmite && isMelee && (
                            <button
                              type="button"
                              onClick={() => {
                                if (activeSmiteAttackId === atk.id) {
                                  setActiveSmiteAttackId(null);
                                } else {
                                  setActiveSmiteAttackId(atk.id);
                                  if (smiteInfo.availableSlots.length > 0) {
                                    setSmiteSlotLevel(smiteInfo.availableSlots[0].level);
                                  }
                                }
                              }}
                              className={`flex-1 min-w-[80px] py-1 px-1.5 rounded-lg font-mono font-bold text-[11px] transition border flex items-center justify-center gap-1 shadow-sm active:scale-[0.98] cursor-pointer ${
                                activeSmiteAttackId === atk.id
                                  ? 'bg-purple-900 text-purple-100 border-purple-400 ring-1 ring-purple-400/50'
                                  : 'bg-purple-950/80 hover:bg-purple-900 text-purple-200 border-purple-600/50 hover:border-purple-400'
                              }`}
                              title="Open Divine Smite slot expenditure and damage roll"
                            >
                              <Sparkles className="w-3 h-3 text-purple-300 shrink-0" />
                              <span className="truncate">⚡ Smite</span>
                            </button>
                          )}
                        </div>

                        {/* Divine Smite Expander Menu */}
                        {!is35e && activeSmiteAttackId === atk.id && smiteInfo.canSmite && isMelee && (
                          <div className="p-2 rounded-lg bg-purple-950/60 border border-purple-700/60 space-y-2 mt-1 font-mono text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-purple-200 font-bold flex items-center gap-1 text-[11px]">
                                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                <span>Divine Smite (PHB p. 85)</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setActiveSmiteAttackId(null)}
                                className="text-stone-400 hover:text-stone-200 text-[11px]"
                              >
                                ✕
                              </button>
                            </div>

                            {smiteInfo.availableSlots.length === 0 ? (
                              <p className="text-rose-400 text-[11px]">No 1st–5th level spell slots remaining!</p>
                            ) : (
                              <>
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="text-stone-400 text-[10px] block w-full">Slot to Expend:</span>
                                  {smiteInfo.availableSlots.map(slot => (
                                    <button
                                      key={slot.level}
                                      type="button"
                                      onClick={() => setSmiteSlotLevel(slot.level)}
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition ${
                                        smiteSlotLevel === slot.level
                                          ? 'bg-purple-700 text-white border-purple-400 ring-1 ring-purple-300'
                                          : 'bg-stone-900 text-purple-300 border-stone-700 hover:border-purple-500'
                                      }`}
                                    >
                                      Lvl {slot.level} ({slot.baseDice}d8) &bull; {slot.current}/{slot.max}
                                    </button>
                                  ))}
                                </div>

                                <div className="flex items-center justify-between text-[11px] gap-2 pt-1 border-t border-purple-900/60 flex-wrap">
                                  <label className="flex items-center gap-1.5 cursor-pointer text-purple-200">
                                    <input
                                      type="checkbox"
                                      checked={smiteIsFiendOrUndead}
                                      onChange={e => setSmiteIsFiendOrUndead(e.target.checked)}
                                      className="rounded text-purple-600 focus:ring-purple-500 bg-stone-900 border-purple-700"
                                    />
                                    <span>Fiend/Undead (+1d8)</span>
                                  </label>

                                  <label className="flex items-center gap-1.5 cursor-pointer text-amber-200">
                                    <input
                                      type="checkbox"
                                      checked={smiteIsCrit}
                                      onChange={e => setSmiteIsCrit(e.target.checked)}
                                      className="rounded text-amber-600 focus:ring-amber-500 bg-stone-900 border-amber-700"
                                    />
                                    <span>Crit (2× Dice)</span>
                                  </label>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleExecuteDivineSmite(atk)}
                                  className="w-full py-1 bg-gradient-to-r from-purple-700 to-amber-600 hover:from-purple-600 hover:to-amber-500 text-white rounded-lg font-bold text-xs shadow transition active:scale-[0.99] flex items-center justify-center gap-1.5"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                                  <span>
                                    Unleash Smite ({(() => {
                                      let d = Math.min(5, 1 + smiteSlotLevel);
                                      if (smiteIsFiendOrUndead) d = Math.min(6, d + 1);
                                      if (smiteIsCrit) d *= 2;
                                      return `${d}d8 Radiant`;
                                    })()})
                                  </span>
                                </button>
                              </>
                            )}
                          </div>
                        )}

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
      {showCombatSpells && (() => {
        const isCaster = isCharacterSpellcaster(character);
        const hasSpells = Boolean(character.spells && character.spells.length > 0);
        const showPreparedSpells = isCaster || hasSpells;

        return (
          <CollapsibleBox
            title="Combat Ammunition, Potions & Spells Quick Bar"
            icon={<Target className="w-5 h-5 text-amber-500" />}
            storageKey="sheet2_combat_spells"
          >
          <div className="space-y-4 pt-2 text-xs">
            {/* 1. Ammunition & Quiver Quick-Tracker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-serif font-bold text-amber-300 text-xs flex items-center gap-1.5 font-sans">
                  <Target className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ammunition & Quiver Counter</span>
                </span>
                <span className="text-[10px] text-stone-400 font-mono hidden sm:inline">
                  PHB p. 146: Direct +/- expenditure & recovery
                </span>
              </div>

              {(() => {
                const ammoItems = character.inventory.filter(i => {
                  const name = (i.name || '').toLowerCase();
                  const notes = (i.notes || '').toLowerCase();
                  const type = (i.itemType || '').toLowerCase();
                  return (
                    name.includes('arrow') ||
                    name.includes('bolt') ||
                    name.includes('bullet') ||
                    name.includes('needle') ||
                    name.includes('dart') ||
                    type.includes('ammunition') ||
                    notes.includes('ammunition') ||
                    name.includes('quiver')
                  );
                });

                return (
                  <div className="space-y-2">
                    {ammoItems.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {ammoItems.map((ammo) => {
                          const qty = ammo.quantity || 0;
                          const isZero = qty <= 0;
                          const isLow = qty > 0 && qty <= 5;

                          return (
                            <div
                              key={ammo.id}
                              className={`p-2 rounded-xl border flex flex-col justify-between gap-1.5 transition ${
                                isZero
                                  ? 'bg-rose-950/30 border-rose-800/60'
                                  : isLow
                                  ? 'bg-amber-950/30 border-amber-700/60'
                                  : 'bg-stone-950 border-stone-800'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-stone-200 truncate text-xs flex items-center gap-1">
                                  <Target className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span className="truncate">{ammo.name}</span>
                                </span>
                                {isZero && (
                                  <span className="px-1.5 py-0.2 rounded bg-rose-900/80 text-rose-200 text-[9px] font-mono font-bold shrink-0">
                                    EMPTY
                                  </span>
                                )}
                                {isLow && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-900/80 text-amber-200 text-[9px] font-mono font-bold shrink-0">
                                    LOW
                                  </span>
                                )}
                              </div>

                              {/* Quantity Stepper and Shoot Controls */}
                              <div className="flex items-center justify-between gap-1 pt-1 border-t border-stone-800/80">
                                <div className="flex items-center gap-1 bg-stone-900 rounded-lg p-0.5 border border-stone-800">
                                  <button
                                    type="button"
                                    onClick={() => handleAdjustItemQuantity(ammo, -1)}
                                    disabled={qty <= 0}
                                    className="p-1 hover:bg-stone-800 disabled:opacity-30 text-stone-300 rounded transition cursor-pointer"
                                    title="Deduct 1 ammo"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="font-mono font-extrabold px-1.5 text-xs text-amber-300 min-w-[24px] text-center">
                                    {qty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleAdjustItemQuantity(ammo, 1)}
                                    className="p-1 hover:bg-stone-800 text-stone-300 rounded transition cursor-pointer"
                                    title="Add 1 ammo"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleSpendAmmunition(ammo)}
                                    disabled={qty <= 0}
                                    className="px-2 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:hover:bg-amber-600 text-stone-950 font-bold rounded-lg text-[10px] transition font-sans cursor-pointer shadow-sm active:scale-95"
                                    title="Fire 1 shot (deducts 1 and logs)"
                                  >
                                    🏹 Fire (-1)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRecoverAmmunition(ammo)}
                                    className="p-1 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800 rounded-lg text-[10px] transition cursor-pointer"
                                    title="Scavenge & recover 50% spent ammunition after battle (PHB p. 146)"
                                  >
                                    Recv 50%
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-stone-950/70 p-2.5 rounded-xl border border-stone-800 text-stone-400 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span>No ammunition in inventory. Quick-add common ammunition bundles:</span>
                        <div className="flex items-center gap-1 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleQuickAddAmmo('Arrows (20)', 20, 1)}
                            className="px-2 py-0.5 bg-stone-900 hover:bg-amber-950/70 text-amber-300 border border-stone-800 hover:border-amber-600/60 rounded text-[10px] font-mono transition cursor-pointer"
                          >
                            + 20 Arrows
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAddAmmo('Crossbow Bolts (20)', 20, 1.5)}
                            className="px-2 py-0.5 bg-stone-900 hover:bg-amber-950/70 text-amber-300 border border-stone-800 hover:border-amber-600/60 rounded text-[10px] font-mono transition cursor-pointer"
                          >
                            + 20 Bolts
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAddAmmo('Sling Bullets (20)', 20, 1.5)}
                            className="px-2 py-0.5 bg-stone-900 hover:bg-amber-950/70 text-amber-300 border border-stone-800 hover:border-amber-600/60 rounded text-[10px] font-mono transition cursor-pointer"
                          >
                            + 20 Bullets
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAddAmmo('Darts (10)', 10, 2.5)}
                            className="px-2 py-0.5 bg-stone-900 hover:bg-amber-950/70 text-amber-300 border border-stone-800 hover:border-amber-600/60 rounded text-[10px] font-mono transition cursor-pointer"
                          >
                            + 10 Darts
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* 2. Healing Potions & Combat Consumables */}
            <div>
              <span className="font-serif font-bold text-amber-300 text-xs block mb-2 font-sans flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Consumable Potions & Items (Inventory)</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {character.inventory.filter(i => isHealingItem(i)).map((item) => (
                  <div
                    key={item.id}
                    className="bg-stone-950 p-2 rounded-xl border border-stone-800 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-emerald-300 truncate">{item.name}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <button
                          type="button"
                          onClick={() => handleAdjustItemQuantity(item, -1)}
                          disabled={(item.quantity || 0) <= 0}
                          className="p-0.5 hover:bg-stone-800 text-stone-400 rounded transition"
                          title="Decrement quantity"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="text-[10px] text-stone-300 font-mono font-bold">{item.quantity}x</span>
                        <button
                          type="button"
                          onClick={() => handleAdjustItemQuantity(item, 1)}
                          className="p-0.5 hover:bg-stone-800 text-stone-400 rounded transition"
                          title="Increment quantity"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUseHealingItem(item)}
                      className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-600/50 rounded-lg font-bold transition shrink-0 cursor-pointer shadow-sm active:scale-95"
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

            {/* Quick Cast Combat Spells - Only shown if character is a spellcaster or has spells in repertoire */}
            {showPreparedSpells && (
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
            )}
          </div>
        </CollapsibleBox>
        );
      })()}

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

      {/* Dynamic Weapon & Attack Editor Modal */}
      {showEditAttackModal && (
        <EditAttackModal
          isOpen={showEditAttackModal}
          onClose={() => setShowEditAttackModal(false)}
          character={character}
          attack={editingAttack}
          onSave={handleSaveAttack}
        />
      )}
    </div>
  );
};
