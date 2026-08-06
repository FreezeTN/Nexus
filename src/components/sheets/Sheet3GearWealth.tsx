import React, { useState } from 'react';
import { CharacterData, GearItem, Attack } from '../../types';
import { CollapsibleBox } from '../common/CollapsibleBox';
import { saveCustomCompendiumEntry } from '../../data/compendiumData';
import { PRESET_DND_ITEMS } from '../../data/presetItems';
import { ShadowrunMatrixRiggingPanel } from '../shadowrun/ShadowrunMatrixRiggingPanel';
import { getCarryingCapacity, getTotalWeight, getTotalWealthInGold, getEncumbranceDetails, getWeightBreakdown, OFFICIAL_DAMAGE_TYPES, recalculateCharacterAC, isHealingItem, getHealingExpression, rollHealing, getEffectiveMaxHp } from '../../utils/dndCalculations';
import {
  Coins,
  Package,
  Plus,
  Trash2,
  Sparkles,
  Weight,
  ShieldAlert,
  CheckSquare,
  Square,
  Gem,
  Calculator,
  Store,
  Tag,
  Edit3,
  Scale,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Archive,
  Shield,
  Swords,
  Heart,
  Maximize2,
  Zap,
  Search,
  X,
  Target,
  Filter
} from 'lucide-react';

interface Sheet3Props {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRollDamage?: (label: string, expression: string) => void;
}

export const Sheet3GearWealth: React.FC<Sheet3Props> = ({
  character,
  onUpdateCharacter,
  onRollDamage
}) => {
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GearItem | null>(null);

  // Search & Category Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'weapon_melee' | 'weapon_ranged' | 'armor' | 'magic' | 'misc'>('all');

  // Dynamic Item Categorization Engine
  const getItemCategory = (item: GearItem): 'Weapon' | 'Armor' | 'Magic' | 'Misc' => {
    // 1. Explicit itemType if set
    if (item.itemType === 'Armor') return 'Armor';
    if (item.itemType === 'Weapon') return 'Weapon';

    // 2. Stats presence checks
    if (item.armorAc !== undefined || item.armorType !== undefined || item.stealthDisadvantage !== undefined) {
      return 'Armor';
    }
    if (item.weaponStats !== undefined && (item.weaponStats.damage || item.weaponStats.attackBonus || item.weaponStats.range)) {
      return 'Weapon';
    }

    const name = item.name.toLowerCase();
    const notes = (item.notes || '').toLowerCase();

    // 3. Name or notes keyword matching for Armor & Shield
    if (
      name.includes('armor') || name.includes('armour') || name.includes('plate') ||
      name.includes('mail') || name.includes('leather') || name.includes('padded') ||
      name.includes('hide') || name.includes('chain') || name.includes('breastplate') ||
      name.includes('splint') || name.includes('scale') || name.includes('shield') ||
      name.includes('cuirass') || name.includes('buckler') || name.includes('helm') ||
      name.includes('gauntlet') || name.includes('bracer') || name.includes('greave') ||
      notes.includes('ac ') || notes.includes('armor class') || notes.includes('shield')
    ) {
      return 'Armor';
    }

    // 4. Name or notes keyword matching for Weapons
    if (
      name.includes('sword') || name.includes('longsword') || name.includes('shortsword') ||
      name.includes('greatsword') || name.includes('rapier') || name.includes('scimitar') ||
      name.includes('axe') || name.includes('handaxe') || name.includes('battleaxe') || name.includes('greataxe') ||
      name.includes('dagger') || name.includes('bow') || name.includes('crossbow') ||
      name.includes('mace') || name.includes('hammer') || name.includes('warhammer') ||
      name.includes('spear') || name.includes('halberd') || name.includes('pike') ||
      name.includes('glaive') || name.includes('staff') || name.includes('quarterstaff') ||
      name.includes('club') || name.includes('sickle') || name.includes('whip') ||
      name.includes('lance') || name.includes('dart') || name.includes('sling') ||
      name.includes('javelin') || name.includes('rifle') || name.includes('pistol') ||
      name.includes('musket') || name.includes('flail') || name.includes('morningstar') ||
      name.includes('trident') || name.includes('scythe') || name.includes('firearm') ||
      notes.includes('finesse') || notes.includes('versatile') || notes.includes('reach') ||
      notes.includes('ammunition') || notes.includes('melee weapon') || notes.includes('ranged weapon')
    ) {
      return 'Weapon';
    }

    if (item.isMagic || item.attuned) {
      return 'Magic';
    }

    return 'Misc';
  };

  const isRangedWeapon = (item: GearItem): boolean => {
    if (getItemCategory(item) !== 'Weapon') return false;
    const range = (item.weaponStats?.range || '').toLowerCase();
    const name = item.name.toLowerCase();
    const notes = (item.notes || '').toLowerCase();

    if (
      range.includes('ranged') ||
      range.includes('/') ||
      range.includes('60') ||
      range.includes('80') ||
      range.includes('100') ||
      range.includes('150') ||
      range.includes('300') ||
      (range.includes('ft') && !range.includes('5 ft melee'))
    ) {
      return true;
    }

    if (
      name.includes('bow') ||
      name.includes('crossbow') ||
      name.includes('dart') ||
      name.includes('sling') ||
      name.includes('rifle') ||
      name.includes('pistol') ||
      name.includes('musket') ||
      name.includes('javelin') ||
      name.includes('blowgun') ||
      name.includes('firearm')
    ) {
      return true;
    }

    if (notes.includes('ranged') || notes.includes('ammunition') || notes.includes('thrown')) {
      return true;
    }

    return false;
  };

  const isMeleeWeapon = (item: GearItem): boolean => {
    if (getItemCategory(item) !== 'Weapon') return false;
    return !isRangedWeapon(item);
  };

  // Drag and drop inventory reordering state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleMoveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= character.inventory.length) return;
    const updated = [...character.inventory];
    const [movedItem] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, movedItem);
    onUpdateCharacter({ ...character, inventory: updated });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      handleMoveItem(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Official D&D Preset Item Selection State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');

  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState<number>(1);
  const [itemWeight, setItemWeight] = useState<number>(1);
  const [itemCostGp, setItemCostGp] = useState<string>('');
  const [itemEquipped, setItemEquipped] = useState(false);
  const [itemStored, setItemStored] = useState(false);
  const [itemMagic, setItemMagic] = useState(false);
  const [itemNotes, setItemNotes] = useState('');
  const [itemDamageReduction, setItemDamageReduction] = useState<number>(0);
  const [itemResistance, setItemResistance] = useState<string>('');
  const [itemImmunity, setItemImmunity] = useState<string>('');
  const [itemHpMaxBonus, setItemHpMaxBonus] = useState<number>(0);

  // Item Type & Specific Parameters
  const [itemType, setItemType] = useState<'Armor' | 'Weapon' | 'Misc'>('Misc');

  // Armor Specific State
  const [armorPreset, setArmorPreset] = useState<string>('Custom');
  const [itemArmorAc, setItemArmorAc] = useState<number>(18);
  const [itemArmorType, setItemArmorType] = useState<'Heavy' | 'Medium' | 'Light' | 'Shield' | 'Bonus'>('Heavy');
  const [stealthDisadvantage, setStealthDisadvantage] = useState<boolean>(false);

  // Weapon Specific State
  const [weaponAttackBonus, setWeaponAttackBonus] = useState<string>('+5');
  const [weaponDamage, setWeaponDamage] = useState<string>('1d8 + 3');
  const [weaponDamageType, setWeaponDamageType] = useState<string>('Slashing');
  const [weaponRange, setWeaponRange] = useState<string>('5 ft Melee');
  const [weaponNotes, setWeaponNotes] = useState<string>('');

  const handleSelectPresetItem = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (!presetId) return;

    const preset = PRESET_DND_ITEMS.find(p => p.id === presetId);
    if (!preset) return;

    setItemType(preset.category);
    setItemName(preset.name);
    setItemWeight(preset.weight);
    setItemCostGp(preset.costGp !== undefined ? String(preset.costGp) : '');
    setItemMagic(preset.isMagic || false);
    setItemNotes(preset.notes || '');
    setItemDamageReduction(preset.damageReduction || 0);
    setItemResistance(preset.resistance || '');
    setItemImmunity(preset.immunity || '');
    setItemHpMaxBonus(preset.hpMaxBonus || 0);

    if (preset.category === 'Armor') {
      setItemArmorAc(preset.armorAc !== undefined ? preset.armorAc : 10);
      setItemArmorType(preset.armorType || 'Heavy');
      setStealthDisadvantage(preset.stealthDisadvantage || false);
    } else if (preset.category === 'Weapon') {
      setWeaponAttackBonus(preset.weaponStats?.attackBonus || '+0');
      setWeaponDamage(preset.weaponStats?.damage || '1d8');
      setWeaponDamageType(preset.weaponStats?.damageType || 'Slashing');
      setWeaponRange(preset.weaponStats?.range || '5 ft Melee');
      setWeaponNotes(preset.weaponStats?.notes || '');
    }
  };

  const handleSelectArmorPreset = (preset: string) => {
    setArmorPreset(preset);
    let ac = 18;
    let type: 'Heavy' | 'Medium' | 'Light' | 'Shield' | 'Bonus' = 'Heavy';
    let stealth = false;
    let defaultName = '';

    if (preset === 'Plate') {
      ac = 18; type = 'Heavy'; stealth = true; defaultName = 'Plate Armor';
    } else if (preset === 'Splint') {
      ac = 17; type = 'Heavy'; stealth = true; defaultName = 'Splint Armor';
    } else if (preset === 'ChainMail') {
      ac = 16; type = 'Heavy'; stealth = true; defaultName = 'Chain Mail';
    } else if (preset === 'HalfPlate') {
      ac = 15; type = 'Medium'; stealth = true; defaultName = 'Half Plate';
    } else if (preset === 'ScaleMail') {
      ac = 14; type = 'Medium'; stealth = true; defaultName = 'Scale Mail';
    } else if (preset === 'Breastplate') {
      ac = 14; type = 'Medium'; stealth = false; defaultName = 'Breastplate';
    } else if (preset === 'StuddedLeather') {
      ac = 12; type = 'Light'; stealth = false; defaultName = 'Studded Leather';
    } else if (preset === 'Leather') {
      ac = 11; type = 'Light'; stealth = false; defaultName = 'Leather Armor';
    } else if (preset === 'Shield') {
      ac = 2; type = 'Shield'; stealth = false; defaultName = 'Shield';
    }

    setItemArmorAc(ac);
    setItemArmorType(type);
    setStealthDisadvantage(stealth);
    if (!itemName && defaultName) setItemName(defaultName);
  };

  // Wealth edit handler
  const handleWealthChange = (coin: keyof CharacterData['wealth'], value: number) => {
    onUpdateCharacter({
      ...character,
      wealth: {
        ...character.wealth,
        [coin]: Math.max(0, value)
      }
    });
  };

  // Weight Calculation Mode Handler
  const handleWeightModeChange = (mode: 'equipped_only' | 'carried_only' | 'all_items') => {
    onUpdateCharacter({
      ...character,
      optionalRules: {
        ...character.optionalRules,
        weightCalculationMode: mode
      }
    });
  };

  // Inventory item actions
  const handleToggleEquipped = (itemId: string) => {
    const itemToToggle = character.inventory.find(i => i.id === itemId);
    if (!itemToToggle) return;

    if (!itemToToggle.equipped && character.activeTransformation && character.activeTransformation.form.hasHands === false) {
      alert(`❌ Cannot equip weapons or gear in this form! Your active transformation (${character.activeTransformation.form.name}) lacks hands/humanoid anatomy.`);
      return;
    }

    const updated = character.inventory.map(item => {
      if (item.id === itemId) {
        const isEquippedNow = !item.equipped;
        return {
          ...item,
          equipped: isEquippedNow,
          stored: isEquippedNow ? false : item.stored // Equipping removes stored status
        };
      }
      return item;
    });
    onUpdateCharacter(recalculateCharacterAC({ ...character, inventory: updated }));
  };

  const handleToggleStored = (itemId: string) => {
    const updated = character.inventory.map(item => {
      if (item.id === itemId) {
        const isStoredNow = !item.stored;
        return {
          ...item,
          stored: isStoredNow,
          equipped: isStoredNow ? false : item.equipped // Storing away un-equips item
        };
      }
      return item;
    });
    onUpdateCharacter(recalculateCharacterAC({ ...character, inventory: updated }));
  };

  const handleToggleAttuned = (itemId: string) => {
    const itemToToggle = character.inventory.find(i => i.id === itemId);
    if (!itemToToggle) return;

    // Count currently attuned items excluding this item if already attuned
    const currentlyAttunedCount = character.inventory.filter(i => i.attuned && i.id !== itemId).length;

    if (!itemToToggle.attuned && currentlyAttunedCount >= 3) {
      alert('You can only attune to a maximum of 3 magic items at once!');
      return;
    }

    const updated = character.inventory.map(item =>
      item.id === itemId ? { ...item, attuned: !item.attuned } : item
    );
    onUpdateCharacter({ ...character, inventory: updated });
  };

  const handleQuantityChange = (itemId: string, delta: number) => {
    const updated = character.inventory.map(item => {
      if (item.id === itemId) {
        const nextQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: nextQty };
      }
      return item;
    }).filter(item => item.quantity > 0);
    onUpdateCharacter(recalculateCharacterAC({ ...character, inventory: updated }));
  };

  const handleDeleteItem = (itemId: string) => {
    const deletedItem = character.inventory.find(i => i.id === itemId);
    const updatedInventory = character.inventory.filter(i => i.id !== itemId);
    let updatedAttacks = character.attacks || [];
    if (deletedItem?.itemType === 'Weapon') {
      updatedAttacks = updatedAttacks.filter(a => a.id !== 'atk-' + itemId && a.name.toLowerCase() !== deletedItem.name.toLowerCase());
    }
    onUpdateCharacter(recalculateCharacterAC({
      ...character,
      inventory: updatedInventory,
      attacks: updatedAttacks
    }));
  };

  const handleUseHealingItem = (item: GearItem) => {
    if (item.stored) {
      alert(`"${item.name}" is Stored Away in your stash! Un-store it from inventory before using.`);
      return;
    }
    const expr = getHealingExpression(item);
    const { totalHeal, breakdown } = rollHealing(expr);
    const newHp = Math.min(getEffectiveMaxHp(character), character.hpCurrent + totalHeal);
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

    onRollDamage?.(`Consumed ${item.name} (${breakdown}) - Restored +${hpGained} HP!`, expr);
  };

  const handleAddItem = () => {
    if (!itemName.trim()) {
      alert('Please enter an Item Name before saving.');
      return;
    }
    const parsedPrice = itemCostGp !== '' ? Math.max(0, parseFloat(itemCostGp) || 0) : undefined;
    const finalDamageType = weaponDamageType === 'Custom' ? 'Slashing' : (weaponDamageType || 'Slashing');
    
    let finalNotes = itemNotes;
    if (itemType === 'Armor' && !finalNotes) {
      finalNotes = itemArmorType === 'Shield'
        ? `+${itemArmorAc} AC (Shield)`
        : itemArmorType === 'Bonus'
        ? `+${itemArmorAc} AC`
        : `AC ${itemArmorAc} (${itemArmorType} Armor${stealthDisadvantage ? ', Stealth Disadvantage' : ''})`;
    }

    const newItem: GearItem = {
      id: 'inv-' + Date.now(),
      name: itemName,
      quantity: itemQty,
      weight: itemWeight,
      costGp: parsedPrice,
      equipped: itemEquipped,
      stored: itemStored,
      isMagic: itemMagic,
      attuned: false,
      notes: finalNotes,
      itemType,
      armorAc: itemType === 'Armor' ? itemArmorAc : undefined,
      armorType: itemType === 'Armor' ? itemArmorType : undefined,
      damageReduction: itemDamageReduction > 0 ? itemDamageReduction : undefined,
      resistance: itemResistance.trim() ? itemResistance.trim() : undefined,
      immunity: itemImmunity.trim() ? itemImmunity.trim() : undefined,
      hpMaxBonus: itemHpMaxBonus !== 0 ? itemHpMaxBonus : undefined,
      stealthDisadvantage: itemType === 'Armor' ? stealthDisadvantage : undefined,
      weaponStats: itemType === 'Weapon' ? {
        attackBonus: weaponAttackBonus,
        damage: weaponDamage,
        damageType: finalDamageType,
        range: weaponRange,
        notes: weaponNotes
      } : undefined
    };

    let updatedAttacks = [...(character.attacks || [])];
    if (itemType === 'Weapon') {
      const parsedAtkBonus = parseInt(weaponAttackBonus.replace(/[^0-9-]/g, '')) || 0;
      const newAttack: Attack = {
        id: 'atk-' + newItem.id,
        name: newItem.name,
        attackBonus: parsedAtkBonus,
        damage: weaponDamage || '1d8',
        damageType: finalDamageType,
        range: weaponRange || '5 ft Melee',
        notes: weaponNotes || finalNotes
      };
      updatedAttacks.push(newAttack);
    }

    const updatedChar: CharacterData = {
      ...character,
      inventory: [...character.inventory, newItem],
      attacks: updatedAttacks
    };

    onUpdateCharacter(recalculateCharacterAC(updatedChar));

    // Auto-add new custom item to Compendium
    try {
      saveCustomCompendiumEntry({
        id: 'comp-item-' + newItem.id,
        name: newItem.name,
        category: 'items',
        edition: character.edition || '5e',
        description: newItem.notes || `Custom item added by player/DM: ${newItem.name}`,
        source: `${character.name}'s Custom Creation`,
        isCustom: true,
        tags: [itemType, character.edition || '5e', 'Custom'],
        itemData: {
          type: itemType.toLowerCase() as any,
          cost: itemCostGp ? `${itemCostGp} gp` : '1 gp',
          weight: itemWeight,
          damage: weaponDamage,
          damageType: weaponDamageType,
          armorClass: itemArmorAc
        }
      });
    } catch (e) {
      console.error('Failed to auto-add item to compendium', e);
    }

    // Reset fields
    setItemName('');
    setItemQty(1);
    setItemWeight(1);
    setItemCostGp('');
    setItemEquipped(false);
    setItemStored(false);
    setItemMagic(false);
    setItemNotes('');
    setItemDamageReduction(0);
    setItemResistance('');
    setItemHpMaxBonus(0);
    setItemType('Misc');
    setShowAddItemModal(false);
  };

  const handleSaveEditedItem = () => {
    if (!editingItem) return;
    if (!editingItem.name.trim()) {
      alert('Please enter an Item Name.');
      return;
    }

    const updatedInventory = character.inventory.map(i => i.id === editingItem.id ? editingItem : i);
    let updatedAttacks = [...(character.attacks || [])];

    if (editingItem.itemType === 'Weapon') {
      const stats = editingItem.weaponStats || {
        attackBonus: '+5',
        damage: '1d8',
        damageType: 'Slashing',
        range: '5 ft Melee'
      };
      const parsedAtkBonus = parseInt(String(stats.attackBonus || '0').replace(/[^0-9-]/g, '')) || 0;
      const atkId = 'atk-' + editingItem.id;
      const existingAtkIdx = updatedAttacks.findIndex(a => a.id === atkId || a.name.toLowerCase() === editingItem.name.toLowerCase());
      const finalDmgType = stats.damageType === 'Custom' ? 'Slashing' : (stats.damageType || 'Slashing');

      const weaponAtk: Attack = {
        id: atkId,
        name: editingItem.name,
        attackBonus: parsedAtkBonus,
        damage: stats.damage || '1d8',
        damageType: finalDmgType,
        range: stats.range || '5 ft Melee',
        notes: stats.notes || editingItem.notes
      };

      if (existingAtkIdx >= 0) {
        updatedAttacks[existingAtkIdx] = weaponAtk;
      } else {
        updatedAttacks.push(weaponAtk);
      }
    }

    const updatedChar: CharacterData = {
      ...character,
      inventory: updatedInventory,
      attacks: updatedAttacks
    };

    onUpdateCharacter(recalculateCharacterAC(updatedChar));
    setEditingItem(null);
  };

  const weightBreakdown = getWeightBreakdown(character);
  const totalWeight = weightBreakdown.activeWeight;
  const carryingCapacity = getCarryingCapacity(character);
  const encumbranceInfo = getEncumbranceDetails(character);
  const isEncumbered = encumbranceInfo.status !== 'Normal';
  const attunedItemsCount = character.inventory.filter(i => i.attuned).length;
  const totalGoldVal = getTotalWealthInGold(character);

  const totalGearBaseVal = character.inventory.reduce((sum, item) => sum + ((item.costGp || 0) * item.quantity), 0);
  const vendorMargin = character.vendorMargin || 120;
  const vendorMultiplier = vendorMargin / 100;
  const totalGearRetailVal = Math.round((totalGearBaseVal * vendorMultiplier) * 100) / 100;

  // Category Counts for Filter Badges
  const countAll = character.inventory.length;
  const countMelee = character.inventory.filter(i => getItemCategory(i) === 'Weapon' && isMeleeWeapon(i)).length;
  const countRanged = character.inventory.filter(i => getItemCategory(i) === 'Weapon' && isRangedWeapon(i)).length;
  const countArmor = character.inventory.filter(i => getItemCategory(i) === 'Armor').length;
  const countMagic = character.inventory.filter(i => i.isMagic || i.attuned || getItemCategory(i) === 'Magic').length;
  const countMisc = character.inventory.filter(i => getItemCategory(i) === 'Misc' && !i.isMagic && !i.attuned).length;

  // Filtered Inventory Mapping
  const filteredInventory = character.inventory
    .map((item, originalIndex) => ({ item, originalIndex }))
    .filter(({ item }) => {
      // 1. Category Filter
      if (categoryFilter === 'weapon_melee' && (getItemCategory(item) !== 'Weapon' || !isMeleeWeapon(item))) {
        return false;
      }
      if (categoryFilter === 'weapon_ranged' && (getItemCategory(item) !== 'Weapon' || !isRangedWeapon(item))) {
        return false;
      }
      if (categoryFilter === 'armor' && getItemCategory(item) !== 'Armor') {
        return false;
      }
      if (categoryFilter === 'magic' && !item.isMagic && !item.attuned && getItemCategory(item) !== 'Magic') {
        return false;
      }
      if (categoryFilter === 'misc' && (getItemCategory(item) !== 'Misc' || item.isMagic || item.attuned)) {
        return false;
      }

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const nameMatch = item.name.toLowerCase().includes(q);
        const notesMatch = item.notes ? item.notes.toLowerCase().includes(q) : false;
        const typeMatch = item.itemType ? item.itemType.toLowerCase().includes(q) : false;
        const armorMatch = item.armorType ? item.armorType.toLowerCase().includes(q) : false;
        const dmgMatch = item.weaponStats?.damage ? item.weaponStats.damage.toLowerCase().includes(q) : false;
        const dmgTypeMatch = item.weaponStats?.damageType ? item.weaponStats.damageType.toLowerCase().includes(q) : false;
        const resistMatch = item.resistance ? item.resistance.toLowerCase().includes(q) : false;
        const immuneMatch = item.immunity ? item.immunity.toLowerCase().includes(q) : false;

        return nameMatch || notesMatch || typeMatch || armorMatch || dmgMatch || dmgTypeMatch || resistMatch || immuneMatch;
      }

      return true;
    });

  if (character.edition === 'shadowrun') {
    const sr = character.shadowrun || {
      bod: 5, agi: 5, rea: 4, str: 4, wil: 4, log: 3, int: 4, cha: 3, edg: 3, edgCurrent: 3, ess: 6.0, mag: 0, res: 0,
      nuyen: 25000, karmaCurrent: 10, karmaTotal: 50, streetCred: 2, notoriety: 1, publicAwareness: 0,
      physicalBoxesCurrent: 0, stunBoxesCurrent: 0, overflowBoxesCurrent: 0, ballisticArmor: 12, impactArmor: 10,
      qualities: [], cyberware: [], srSkills: [], vehicles: []
    };

    const updateSR = (patch: Partial<typeof sr>) => {
      onUpdateCharacter({
        ...character,
        shadowrun: {
          ...sr,
          ...patch
        }
      });
    };

    const handleAdjustNuyen = (delta: number) => {
      updateSR({ nuyen: Math.max(0, sr.nuyen + delta) });
    };

    return (
      <div className="space-y-6 pb-12">
        {/* NUYEN VAULT & CERTIFIED CREDSTICKS */}
        <div className="bg-stone-900 border border-cyan-500/50 rounded-2xl p-5 md:p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
            <div>
              <h3 className="text-xl font-bold font-serif text-cyan-300 flex items-center gap-2">
                <Coins className="w-6 h-6 text-cyan-400" /> Nuyen Vault & Certified Credstick Pouch
              </h3>
              <p className="text-xs text-stone-400">
                Directly edit your available Nuyen (¥) funds, track certified credstick accounts, karma, and runner reputation.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-stone-950 border border-cyan-500/40 px-3 py-1.5 rounded-xl text-xs font-mono">
              <span className="text-stone-400">Current Balance:</span>
              <strong className="text-cyan-300 text-sm">¥{sr.nuyen.toLocaleString()}</strong>
            </div>
          </div>

          {/* MAIN NUYEN BALANCE EDIT INPUT */}
          <div className="bg-stone-950 border border-cyan-500/40 p-4 rounded-xl space-y-3">
            <span className="text-xs uppercase font-bold text-cyan-400 tracking-wider block">
              Available Nuyen Funds (¥)
            </span>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 font-mono text-2xl font-extrabold">¥</span>
                <input
                  type="number"
                  min="0"
                  value={sr.nuyen}
                  onChange={(e) => updateSR({ nuyen: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full bg-stone-900 border border-stone-700 focus:border-cyan-400 rounded-xl pl-9 pr-4 py-2 font-mono text-2xl font-extrabold text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  placeholder="Enter Nuyen amount..."
                />
              </div>

              {/* Quick adjustment buttons */}
              <div className="flex flex-col gap-2">
                {/* Top Row: Positive (+) buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { label: '+¥100', val: 100, cls: 'bg-cyan-950 border-cyan-800/80 text-cyan-400 hover:bg-cyan-900' },
                    { label: '+¥1k', val: 1000, cls: 'bg-cyan-950 border-cyan-700 text-cyan-300 hover:bg-cyan-900' },
                    { label: '+¥5k', val: 5000, cls: 'bg-cyan-900 border-cyan-600 text-cyan-200 hover:bg-cyan-800' },
                    { label: '+¥10k', val: 10000, cls: 'bg-emerald-950 border-emerald-700 text-emerald-300 hover:bg-emerald-900' },
                    { label: '+¥50k', val: 50000, cls: 'bg-emerald-900 border-emerald-600 text-emerald-200 hover:bg-emerald-800' },
                    { label: '+¥100k', val: 100000, cls: 'bg-emerald-800 border-emerald-500 text-emerald-100 hover:bg-emerald-700' },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      onClick={() => handleAdjustNuyen(btn.val)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition shadow-sm ${btn.cls}`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Bottom Row: Negative (-) buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { label: '-¥100', val: -100, cls: 'bg-rose-950 border-rose-800/80 text-rose-400 hover:bg-rose-900' },
                    { label: '-¥1k', val: -1000, cls: 'bg-rose-950 border-rose-700 text-rose-300 hover:bg-rose-900' },
                    { label: '-¥5k', val: -5000, cls: 'bg-rose-900 border-rose-600 text-rose-200 hover:bg-rose-800' },
                    { label: '-¥10k', val: -10000, cls: 'bg-rose-900 border-rose-500 text-rose-200 hover:bg-rose-800' },
                    { label: '-¥50k', val: -50000, cls: 'bg-rose-800 border-rose-500 text-rose-100 hover:bg-rose-700' },
                    { label: '-¥100k', val: -100000, cls: 'bg-rose-700 border-rose-400 text-white hover:bg-rose-600' },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      onClick={() => handleAdjustNuyen(btn.val)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition shadow-sm ${btn.cls}`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* KARMA & RUNNER REPUTATION GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-stone-950 border border-stone-800 p-3 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">Unspent Karma</span>
              <input
                type="number"
                min="0"
                value={sr.karmaCurrent}
                onChange={(e) => updateSR({ karmaCurrent: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full bg-stone-900 border border-stone-700 rounded text-center font-mono text-lg font-bold text-amber-300 p-1"
              />
            </div>

            <div className="bg-stone-950 border border-stone-800 p-3 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Total Karma Earned</span>
              <input
                type="number"
                min="0"
                value={sr.karmaTotal}
                onChange={(e) => updateSR({ karmaTotal: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full bg-stone-900 border border-stone-700 rounded text-center font-mono text-lg font-bold text-stone-300 p-1"
              />
            </div>

            <div className="bg-stone-950 border border-stone-800 p-3 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-purple-400 block mb-1">Street Cred</span>
              <input
                type="number"
                min="0"
                value={sr.streetCred}
                onChange={(e) => updateSR({ streetCred: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full bg-stone-900 border border-stone-700 rounded text-center font-mono text-lg font-bold text-purple-300 p-1"
              />
            </div>

            <div className="bg-stone-950 border border-stone-800 p-3 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-rose-400 block mb-1">Notoriety</span>
              <input
                type="number"
                min="0"
                value={sr.notoriety}
                onChange={(e) => updateSR({ notoriety: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full bg-stone-900 border border-stone-700 rounded text-center font-mono text-lg font-bold text-rose-300 p-1"
              />
            </div>

            <div className="bg-stone-950 border border-stone-800 p-3 rounded-xl text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">Public Awareness</span>
              <input
                type="number"
                min="0"
                value={sr.publicAwareness}
                onChange={(e) => updateSR({ publicAwareness: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full bg-stone-900 border border-stone-700 rounded text-center font-mono text-lg font-bold text-emerald-300 p-1"
              />
            </div>
          </div>

          {/* SIN & LIFESTYLE CONTROLS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-stone-950/80 border border-stone-800 p-3.5 rounded-xl">
            <div>
              <label className="text-xs font-bold text-stone-300 block mb-1">SIN Status (Identity)</label>
              <select
                value={sr.sinType || 'Fake SIN'}
                onChange={(e) => updateSR({ sinType: e.target.value as any })}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="Fake SIN">Fake SIN</option>
                <option value="Corporate">Corporate SIN</option>
                <option value="National">National SIN</option>
                <option value="Criminal">Criminal SIN</option>
                <option value="Unregistered">Unregistered (SINless)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-300 block mb-1">Fake SIN Rating</label>
              <select
                value={sr.fakeSinRating || 4}
                onChange={(e) => updateSR({ fakeSinRating: parseInt(e.target.value) || 1 })}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              >
                {[1, 2, 3, 4, 5, 6].map(r => (
                  <option key={r} value={r}>Rating {r} SIN</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-300 block mb-1">Lifestyle Level</label>
              <select
                value={sr.lifestyle || 'Middle'}
                onChange={(e) => updateSR({ lifestyle: e.target.value as any })}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
              >
                <option value="Squatter">Squatter (¥500 / mo)</option>
                <option value="Low">Low Lifestyle (¥2,000 / mo)</option>
                <option value="Middle">Middle Lifestyle (¥5,000 / mo)</option>
                <option value="High">High Lifestyle (¥10,000 / mo)</option>
                <option value="Luxury">Luxury Lifestyle (¥100,000 / mo)</option>
              </select>
            </div>
          </div>
        </div>

        {/* MATRIX CYBERDECK & RIGGING PANEL */}
        <ShadowrunMatrixRiggingPanel
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          onRollPool={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* VENDOR BANNER (If character is marked as a vendor) */}
      {character.isVendor && (
        <div className="bg-gradient-to-r from-amber-950/90 via-stone-900 to-amber-950/90 border border-amber-500/60 p-4 rounded-2xl shadow-xl text-amber-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-900/60 border border-amber-500/50 rounded-xl">
              <Store className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-lg text-amber-200">{character.name}’s Merchant Shop</span>
                <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono font-bold">
                  VENDOR ACTIVE
                </span>
              </div>
              <p className="text-xs text-stone-300 font-sans mt-0.5">
                Items sold by this merchant use a <strong className="text-amber-300">{vendorMargin}% margin</strong> ({vendorMultiplier}x markup over base price).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="bg-stone-900/90 border border-stone-700 px-3 py-1.5 rounded-xl text-stone-300 text-center">
              <span className="text-[10px] uppercase block text-stone-400">Base Catalog Value</span>
              <span className="font-bold text-amber-300">{totalGearBaseVal.toLocaleString()} GP</span>
            </div>
            <div className="bg-amber-900/80 border border-amber-500/50 px-3 py-1.5 rounded-xl text-amber-200 text-center">
              <span className="text-[10px] uppercase block text-amber-400 font-bold">Store Retail Value ({vendorMargin}%)</span>
              <span className="font-bold text-emerald-300 text-sm">{totalGearRetailVal.toLocaleString()} GP</span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: Wealth & Coin Pouch */}
      <CollapsibleBox
        title="Wealth & Coin Pouch"
        icon={<Coins className="w-5 h-5 text-amber-500" />}
        storageKey="sheet3_wealth"
        headerExtra={
          <div className="flex items-center gap-2 text-xs font-mono">
            <div className="bg-stone-950 border border-stone-800 text-stone-400 px-2 py-0.5 rounded-lg hidden sm:block">
              Coins: <strong className="text-amber-300">{totalGoldVal} GP</strong>
            </div>
            <div className="bg-amber-950 border border-amber-500/50 text-amber-100 px-2.5 py-0.5 rounded-lg font-bold">
              Net Worth: ~{(totalGoldVal + totalGearBaseVal).toLocaleString()} GP
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {/* Copper */}
          <div className="bg-stone-950 border border-amber-900/40 p-3 rounded-xl text-center">
            <div className="text-[10px] uppercase font-mono font-bold text-amber-700 mb-1">Copper (CP)</div>
            <input
              type="number"
              min="0"
              value={character.wealth.cp}
              onChange={(e) => handleWealthChange('cp', parseInt(e.target.value) || 0)}
              className="w-full bg-stone-900 border border-stone-800 text-center font-mono text-lg font-bold text-amber-600 rounded p-1"
            />
          </div>

          {/* Silver */}
          <div className="bg-stone-950 border border-stone-700 p-3 rounded-xl text-center">
            <div className="text-[10px] uppercase font-mono font-bold text-stone-400 mb-1">Silver (SP)</div>
            <input
              type="number"
              min="0"
              value={character.wealth.sp}
              onChange={(e) => handleWealthChange('sp', parseInt(e.target.value) || 0)}
              className="w-full bg-stone-900 border border-stone-800 text-center font-mono text-lg font-bold text-stone-300 rounded p-1"
            />
          </div>

          {/* Electrum */}
          <div className="bg-stone-950 border border-teal-900/40 p-3 rounded-xl text-center">
            <div className="text-[10px] uppercase font-mono font-bold text-teal-400 mb-1">Electrum (EP)</div>
            <input
              type="number"
              min="0"
              value={character.wealth.ep}
              onChange={(e) => handleWealthChange('ep', parseInt(e.target.value) || 0)}
              className="w-full bg-stone-900 border border-stone-800 text-center font-mono text-lg font-bold text-teal-300 rounded p-1"
            />
          </div>

          {/* Gold */}
          <div className="bg-stone-950 border border-amber-500/50 p-3 rounded-xl text-center shadow-md">
            <div className="text-[10px] uppercase font-mono font-bold text-amber-400 mb-1">Gold (GP)</div>
            <input
              type="number"
              min="0"
              value={character.wealth.gp}
              onChange={(e) => handleWealthChange('gp', parseInt(e.target.value) || 0)}
              className="w-full bg-stone-900 border border-amber-500/40 text-center font-mono text-xl font-extrabold text-amber-300 rounded p-1"
            />
          </div>

          {/* Platinum */}
          <div className="bg-stone-950 border border-cyan-500/40 p-3 rounded-xl text-center">
            <div className="text-[10px] uppercase font-mono font-bold text-cyan-400 mb-1">Platinum (PP)</div>
            <input
              type="number"
              min="0"
              value={character.wealth.pp}
              onChange={(e) => handleWealthChange('pp', parseInt(e.target.value) || 0)}
              className="w-full bg-stone-900 border border-stone-800 text-center font-mono text-lg font-bold text-cyan-200 rounded p-1"
            />
          </div>
        </div>
      </CollapsibleBox>

      {/* SECTION 2: Attunement Slots & Weight Capacity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Attunement Tracker */}
        <CollapsibleBox
          title="Magic Item Attunement"
          icon={<Sparkles className="w-5 h-5 text-purple-300" />}
          storageKey="sheet3_attunement"
          headerExtra={
            <div className="font-mono text-sm font-extrabold text-purple-300">
              {attunedItemsCount} / 3 <span className="text-[10px] text-stone-500 font-normal">Slots Used</span>
            </div>
          }
        >
          <div className="pt-2 text-xs text-stone-400 space-y-2">
            <p className="text-[11px] text-stone-300">
              Maximum 3 magic items attuned simultaneously in 5e rules.
            </p>
            {attunedItemsCount > 0 ? (
              <div className="space-y-1">
                {character.inventory.filter(i => i.attuned).map(item => (
                  <div key={item.id} className="text-[11px] text-purple-300 font-semibold bg-purple-950/40 border border-purple-800/40 px-2 py-1 rounded flex items-center justify-between">
                    <span>✨ {item.name}</span>
                    <span className="text-[10px] text-stone-400 font-mono">Attuned</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-stone-500 italic">No magic items currently attuned.</p>
            )}
          </div>
        </CollapsibleBox>

        {/* Encumbrance / Weight Capacity */}
        <CollapsibleBox
          title="Weight & Carrying Capacity"
          icon={<Weight className="w-5 h-5 text-amber-500" />}
          storageKey="sheet3_encumbrance"
          headerExtra={
            <div className="flex items-center gap-2">
              {encumbranceInfo.isVariant && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-mono font-bold hidden sm:flex items-center gap-1">
                  <Scale className="w-3 h-3 text-amber-400" /> VARIANT
                </span>
              )}
              <span className={`font-mono text-xs font-bold ${
                encumbranceInfo.status === 'Over Capacity' || encumbranceInfo.status === 'Heavily Encumbered'
                  ? 'text-rose-400'
                  : encumbranceInfo.status === 'Encumbered'
                  ? 'text-amber-400'
                  : 'text-amber-300'
              }`}>
                {encumbranceInfo.totalWeight.toFixed(1)} / {encumbranceInfo.maxCapacity} lbs
              </span>
            </div>
          }
        >
          <div className="space-y-3 pt-2">
            {/* Weight Counting Mode Selector */}
            <div className="flex items-center justify-between gap-2 bg-stone-950 p-2 rounded-xl border border-stone-800 text-[11px] flex-wrap">
              <span className="text-stone-400 font-medium">Weight Mode:</span>
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => handleWeightModeChange('carried_only')}
                  className={`px-2 py-1 rounded font-bold transition ${
                    weightBreakdown.mode === 'carried_only'
                      ? 'bg-amber-600 text-stone-950 shadow'
                      : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                  }`}
                  title="Equipped + Backpack items count (Default - Stored items in Stash/Camp excluded)"
                >
                  Backpack & Equipped (Default)
                </button>
                <button
                  type="button"
                  onClick={() => handleWeightModeChange('equipped_only')}
                  className={`px-2 py-1 rounded font-bold transition ${
                    weightBreakdown.mode === 'equipped_only'
                      ? 'bg-amber-600 text-stone-950 shadow'
                      : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                  }`}
                  title="Only actively equipped items contribute to carried weight"
                >
                  Equipped Only
                </button>
                <button
                  type="button"
                  onClick={() => handleWeightModeChange('all_items')}
                  className={`px-2 py-1 rounded font-bold transition ${
                    weightBreakdown.mode === 'all_items'
                      ? 'bg-amber-600 text-stone-950 shadow'
                      : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                  }`}
                  title="All items in inventory count toward weight including stored camp items"
                >
                  All Items (Inc. Stored)
                </button>
              </div>
            </div>

            {/* Size & Powerful Build Config Bar */}
            <div className="flex items-center justify-between gap-2 bg-stone-950/80 p-2 rounded-xl border border-amber-900/40 text-[11px] flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-stone-400 font-medium flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5 text-amber-500" /> Size:
                </span>
                <select
                  value={character.sizeCategory || 'Medium'}
                  onChange={(e) => onUpdateCharacter({ ...character, sizeCategory: e.target.value as any })}
                  className="bg-stone-900 border border-stone-700 text-amber-300 font-bold rounded px-2 py-0.5 text-[11px]"
                >
                  <option value="Fine">Fine (1/8 Capacity)</option>
                  <option value="Diminutive">Diminutive (1/4 Capacity)</option>
                  <option value="Tiny">Tiny (1/2 Capacity)</option>
                  <option value="Small">Small ({character.edition === '3.5e' ? '3/4' : 'x1'} Capacity)</option>
                  <option value="Medium">Medium (Standard x1)</option>
                  <option value="Large">Large (x2 Capacity)</option>
                  <option value="Huge">Huge (x4 Capacity)</option>
                  <option value="Gargantuan">Gargantuan (x8 Capacity)</option>
                  <option value="Colossal">Colossal (x16 Capacity)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => onUpdateCharacter({
                  ...character,
                  optionalRules: {
                    ...character.optionalRules,
                    hasPowerfulBuild: !encumbranceInfo.hasPowerfulBuild
                  }
                })}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition flex items-center gap-1.5 ${
                  encumbranceInfo.hasPowerfulBuild
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 ring-1 ring-amber-500/30'
                    : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                }`}
                title="Counts as one size category larger for carrying capacity and push/drag/lift weight"
              >
                <Zap className={`w-3 h-3 ${encumbranceInfo.hasPowerfulBuild ? 'text-amber-400 fill-amber-400' : 'text-stone-500'}`} />
                Powerful Build {encumbranceInfo.hasPowerfulBuild ? '(Active +1 Tier)' : '(Off)'}
              </button>
            </div>

            {/* Weight Subtotals Chips */}
            <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-center">
              <div className={`p-1.5 rounded-lg border transition ${
                weightBreakdown.mode === 'equipped_only' || weightBreakdown.mode === 'carried_only' || weightBreakdown.mode === 'all_items'
                  ? 'bg-amber-950/60 border-amber-500/60 ring-1 ring-amber-500/30'
                  : 'bg-stone-950/60 border-stone-800 opacity-60'
              }`}>
                <div className="text-amber-400/90 font-sans font-bold">Equipped</div>
                <div className="text-amber-200 font-bold text-xs">{weightBreakdown.equippedWeight.toFixed(1)} lbs</div>
              </div>
              <div className={`p-1.5 rounded-lg border transition ${
                weightBreakdown.mode === 'carried_only' || weightBreakdown.mode === 'all_items'
                  ? 'bg-amber-950/60 border-amber-500/60 ring-1 ring-amber-500/30'
                  : 'bg-stone-950/60 border-stone-800 opacity-60'
              }`}>
                <div className="text-amber-400/90 font-sans font-bold">In Backpack</div>
                <div className="text-amber-200 font-bold text-xs">{weightBreakdown.carriedWeight.toFixed(1)} lbs</div>
              </div>
              <div className={`p-1.5 rounded-lg border transition ${
                weightBreakdown.mode === 'all_items'
                  ? 'bg-amber-950/60 border-amber-500/60 ring-1 ring-amber-500/30'
                  : 'bg-blue-950/30 border-blue-600/40 opacity-70'
              }`}>
                <div className="text-blue-300/90 font-sans font-bold flex items-center justify-center gap-1">
                  <Archive className="w-3 h-3 text-blue-400" /> Stored (Ignored)
                </div>
                <div className="text-blue-200 font-bold text-xs">{weightBreakdown.storedWeight.toFixed(1)} lbs</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-stone-950 rounded-full h-3 border border-stone-800 overflow-hidden relative">
              <div
                className={`h-full transition-all ${
                  encumbranceInfo.status === 'Over Capacity'
                    ? 'bg-rose-600'
                    : encumbranceInfo.status === 'Heavily Encumbered'
                    ? 'bg-rose-500'
                    : encumbranceInfo.status === 'Encumbered'
                    ? 'bg-amber-500'
                    : 'bg-emerald-600'
                }`}
                style={{ width: `${Math.min(100, (encumbranceInfo.totalWeight / encumbranceInfo.maxCapacity) * 100)}%` }}
              />
            </div>

            {/* Threshold Indicators & Status */}
            {encumbranceInfo.isVariant ? (
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[10px] font-mono text-stone-400">
                  <span>Encumbered: {encumbranceInfo.encumberedThreshold} lbs</span>
                  <span>Heavy: {encumbranceInfo.heavilyEncumberedThreshold} lbs</span>
                  <span>Max: {encumbranceInfo.maxCapacity} lbs</span>
                </div>

                {encumbranceInfo.status !== 'Normal' && (
                  <div className={`text-[11px] p-2 rounded-lg font-bold flex items-center justify-between gap-2 border ${
                    encumbranceInfo.status === 'Over Capacity'
                      ? 'bg-rose-950/80 border-rose-600 text-rose-300'
                      : encumbranceInfo.status === 'Heavily Encumbered'
                      ? 'bg-rose-950/60 border-rose-700/60 text-rose-300'
                      : 'bg-amber-950/60 border-amber-600/50 text-amber-300'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        STATUS: <strong>{encumbranceInfo.status.toUpperCase()}</strong>
                        {encumbranceInfo.speedPenalty > 0 && ` (-${encumbranceInfo.speedPenalty} ft Speed)`}
                      </span>
                    </div>
                    {encumbranceInfo.hasDisadvantage && (
                      <span className="text-[10px] bg-rose-900/80 text-rose-200 border border-rose-500 px-1.5 py-0.5 rounded font-mono font-bold">
                        DISADVANTAGE ON CHECKS & SAVES
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              isEncumbered && (
                <div className="text-[10px] text-rose-400 flex items-center gap-1 font-bold">
                  <ShieldAlert className="w-3.5 h-3.5" /> OVER CAPACITY! Speed reduced by 10 ft.
                </div>
              )
            )}

            {/* Push / Drag / Lift Capacity Footer */}
            <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 bg-stone-950/60 px-2.5 py-1.5 rounded-lg border border-stone-800/80">
              <span className="flex items-center gap-1 text-stone-300">
                <Zap className="w-3 h-3 text-amber-500" /> Push / Drag / Lift Capacity:
              </span>
              <span className="text-amber-300 font-bold">{encumbranceInfo.pushDragLift} lbs ({encumbranceInfo.effectiveSize} Size Tier)</span>
            </div>
          </div>
        </CollapsibleBox>
      </div>

      {/* SECTION 3: Gear Inventory List */}
      <CollapsibleBox
        title="Equipment & Inventory"
        icon={<Package className="w-5 h-5 text-amber-500" />}
        storageKey="sheet3_equipment"
        headerExtra={
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAddItemModal(true);
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-md"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        }
      >
        <div className="space-y-4 pt-2">

        {/* SEARCH & CATEGORY FILTER TOOLBAR */}
        <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-3">
          {/* Search Input Bar */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search inventory items (e.g., 'Plate', 'Dagger', 'Potion')..."
              className="w-full bg-stone-900 border border-stone-700 focus:border-amber-500 rounded-xl pl-9 pr-8 py-1.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-stone-400 hover:text-stone-200 p-0.5 rounded transition"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[10px] font-mono text-stone-400 font-bold uppercase mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-amber-500" /> Filter:
            </span>

            {/* All Items */}
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1.5 ${
                categoryFilter === 'all'
                  ? 'bg-amber-600 text-stone-950 shadow'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-amber-400" />
              <span>All Items</span>
              <span className={`text-[10px] font-mono px-1 rounded ${categoryFilter === 'all' ? 'bg-amber-800/40 text-stone-950' : 'bg-stone-800 text-stone-400'}`}>
                {countAll}
              </span>
            </button>

            {/* Melee Weapons */}
            <button
              type="button"
              onClick={() => setCategoryFilter('weapon_melee')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1.5 ${
                categoryFilter === 'weapon_melee'
                  ? 'bg-rose-700 text-white shadow'
                  : 'bg-stone-900 text-stone-400 hover:text-rose-300 border border-stone-800'
              }`}
            >
              <Swords className="w-3.5 h-3.5 text-rose-400" />
              <span>Melee Weapons</span>
              <span className={`text-[10px] font-mono px-1 rounded ${categoryFilter === 'weapon_melee' ? 'bg-rose-900 text-rose-100' : 'bg-stone-800 text-stone-400'}`}>
                {countMelee}
              </span>
            </button>

            {/* Ranged Weapons */}
            <button
              type="button"
              onClick={() => setCategoryFilter('weapon_ranged')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1.5 ${
                categoryFilter === 'weapon_ranged'
                  ? 'bg-orange-700 text-white shadow'
                  : 'bg-stone-900 text-stone-400 hover:text-orange-300 border border-stone-800'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-orange-400" />
              <span>Ranged Weapons</span>
              <span className={`text-[10px] font-mono px-1 rounded ${categoryFilter === 'weapon_ranged' ? 'bg-orange-900 text-orange-100' : 'bg-stone-800 text-stone-400'}`}>
                {countRanged}
              </span>
            </button>

            {/* Armor & Shields */}
            <button
              type="button"
              onClick={() => setCategoryFilter('armor')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1.5 ${
                categoryFilter === 'armor'
                  ? 'bg-blue-700 text-white shadow'
                  : 'bg-stone-900 text-stone-400 hover:text-blue-300 border border-stone-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Armor & Shields</span>
              <span className={`text-[10px] font-mono px-1 rounded ${categoryFilter === 'armor' ? 'bg-blue-900 text-blue-100' : 'bg-stone-800 text-stone-400'}`}>
                {countArmor}
              </span>
            </button>

            {/* Magic Items */}
            <button
              type="button"
              onClick={() => setCategoryFilter('magic')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1.5 ${
                categoryFilter === 'magic'
                  ? 'bg-purple-700 text-white shadow'
                  : 'bg-stone-900 text-stone-400 hover:text-purple-300 border border-stone-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Magic Items</span>
              <span className={`text-[10px] font-mono px-1 rounded ${categoryFilter === 'magic' ? 'bg-purple-900 text-purple-100' : 'bg-stone-800 text-stone-400'}`}>
                {countMagic}
              </span>
            </button>

            {/* General / Misc Items */}
            <button
              type="button"
              onClick={() => setCategoryFilter('misc')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1.5 ${
                categoryFilter === 'misc'
                  ? 'bg-stone-700 text-white shadow'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-stone-400" />
              <span>General / Misc</span>
              <span className={`text-[10px] font-mono px-1 rounded ${categoryFilter === 'misc' ? 'bg-stone-800 text-stone-100' : 'bg-stone-800 text-stone-400'}`}>
                {countMisc}
              </span>
            </button>
          </div>
        </div>

        {character.activeTransformation && character.activeTransformation.form.hasHands === false && (
          <div className="bg-purple-950/90 border border-purple-500/70 rounded-xl p-3 mb-3 flex items-center justify-between text-xs text-purple-200 shadow">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🐾</span>
              <div>
                <strong className="text-amber-300 font-bold block">{character.activeTransformation.form.name} (No Hands / Beast Form)</strong>
                <span className="text-stone-300 text-[11px] block">
                  Equipment, weapons, and armor are merged into beast form and automatically unequipped. Revert transformation or switch to a form with hands to re-equip items.
                </span>
              </div>
            </div>
          </div>
        )}

        {character.inventory.length === 0 ? (
          <p className="text-xs text-stone-500 italic py-4 text-center">
            No gear items in inventory. Click "+ Add Item" to log weapons, potions, armor, or adventuring packs!
          </p>
        ) : filteredInventory.length === 0 ? (
          <div className="bg-stone-950/60 border border-stone-800/80 rounded-xl p-6 text-center space-y-2">
            <Package className="w-8 h-8 text-stone-600 mx-auto" />
            <p className="text-xs text-stone-400 font-medium">
              No items in your inventory match the active search filter {searchQuery ? `("${searchQuery}")` : ''}.
            </p>
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setCategoryFilter('all'); }}
              className="px-3 py-1 bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-600/50 rounded-lg text-xs font-bold transition inline-block mt-1"
            >
              Reset Search & Filters
            </button>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredInventory.map(({ item, originalIndex }) => {
              const index = originalIndex;
              const basePrice = item.costGp;
              const hasPrice = basePrice !== undefined && basePrice !== null && !isNaN(Number(basePrice));
              const qty = Math.max(1, Number(item.quantity) || 1);
              const totalBasePrice = hasPrice ? Math.round((Number(basePrice) || 0) * qty * 100) / 100 : 0;
              const vendorRetailPrice = hasPrice ? Math.round(((Number(basePrice) || 0) * vendorMultiplier) * 100) / 100 : undefined;
              const totalVendorPrice = vendorRetailPrice !== undefined ? Math.round((vendorRetailPrice * qty) * 100) / 100 : undefined;

              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`p-3 rounded-xl border transition-all text-xs flex flex-wrap items-center justify-between gap-3 ${
                    draggedIndex === index
                      ? 'opacity-40 border-dashed border-amber-500 bg-amber-950/20'
                      : dragOverIndex === index
                      ? 'border-amber-400 bg-amber-950/60 scale-[1.01] shadow-lg ring-2 ring-amber-500/50'
                      : item.stored
                      ? 'bg-blue-950/20 border-blue-800/40 hover:border-blue-700/60'
                      : item.equipped
                      ? 'bg-amber-950/30 border-amber-600/40 hover:border-amber-500/60'
                      : 'bg-stone-950 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  {/* Left: Drag Handle, Toggles & Item Info */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
                    {/* Drag Handle & Reorder Controls */}
                    <div className="flex items-center gap-0.5 text-stone-500 shrink-0">
                      <div
                        className="p-1 cursor-grab active:cursor-grabbing hover:text-amber-400 transition rounded"
                        title="Drag to reorder item in inventory"
                      >
                        <GripVertical className="w-4 h-4 text-stone-400 hover:text-amber-300" />
                      </div>
                      <div className="flex flex-col text-[10px]">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMoveItem(index, index - 1); }}
                          disabled={index === 0}
                          className="hover:text-amber-300 disabled:opacity-20 disabled:hover:text-stone-500 transition leading-none p-0.5"
                          title="Move item up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMoveItem(index, index + 1); }}
                          disabled={index === character.inventory.length - 1}
                          className="hover:text-amber-300 disabled:opacity-20 disabled:hover:text-stone-500 transition leading-none p-0.5"
                          title="Move item down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Equipped Button */}
                    <button
                      onClick={() => handleToggleEquipped(item.id)}
                      className={`flex items-center gap-1 transition px-1.5 py-0.5 rounded border text-[10px] font-mono ${
                        item.equipped
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500 font-bold'
                          : 'text-stone-500 border-stone-800 hover:text-amber-300'
                      }`}
                      title="Toggle Equipped (Active equipment carried on person)"
                    >
                      {item.equipped ? (
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-stone-500" />
                      )}
                      <span>[EQ]</span>
                    </button>

                    {/* Stored Away / Camp Button */}
                    <button
                      onClick={() => handleToggleStored(item.id)}
                      className={`flex items-center gap-1 transition px-1.5 py-0.5 rounded border text-[10px] font-mono ${
                        item.stored
                          ? 'bg-blue-950/90 text-blue-300 border-blue-500 font-bold'
                          : 'text-stone-500 border-stone-800 hover:text-blue-300'
                      }`}
                      title="Toggle Stored Away (Stored in camp / base stash - does not contribute to carried weight)"
                    >
                      <Archive className="w-3.5 h-3.5 text-blue-400" />
                      <span>{item.stored ? 'STORED' : 'STORE'}</span>
                    </button>

                    {/* Magic Item / Attunement Tag */}
                    {item.isMagic && (
                      <button
                        onClick={() => handleToggleAttuned(item.id)}
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold border transition ${
                          item.attuned
                            ? 'bg-purple-900 text-purple-200 border-purple-500'
                            : 'bg-stone-800 text-purple-400 border-stone-700 hover:border-purple-500'
                        }`}
                        title="Click to toggle Magic Item Attunement"
                      >
                        {item.attuned ? 'ATTUNED' : 'MAGIC'}
                      </button>
                    )}

                    <div>
                      <div className="font-serif font-bold text-stone-100 text-sm flex items-center gap-2 flex-wrap">
                        <span>{item.name}</span>

                        {item.itemType === 'Armor' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-amber-950/90 text-amber-300 px-1.5 py-0.5 rounded border border-amber-600/50">
                            <Shield className="w-3 h-3 text-amber-400" /> Armor {item.armorAc ? `(AC ${item.armorAc})` : ''}
                          </span>
                        )}

                        {item.itemType === 'Weapon' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-rose-950/90 text-rose-300 px-1.5 py-0.5 rounded border border-rose-600/50">
                            <Swords className="w-3 h-3 text-rose-400" /> Weapon {item.weaponStats?.damage ? `(${item.weaponStats.damage})` : ''}
                          </span>
                        )}

                        {item.damageReduction && item.damageReduction > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-cyan-950/90 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/50 font-bold" title="Damage Reduction granted by this item">
                            <Shield className="w-3 h-3 text-cyan-400" /> DR {item.damageReduction}
                          </span>
                        )}

                        {item.resistance && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-orange-950/90 text-orange-300 px-1.5 py-0.5 rounded border border-orange-500/50 font-bold" title="Damage Resistance granted by this item">
                            <Sparkles className="w-3 h-3 text-orange-400" /> Resist: {item.resistance}
                          </span>
                        )}

                        {item.immunity && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-purple-950/90 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/50 font-bold" title="Damage Immunity granted by this item (0 HP taken)">
                            <Shield className="w-3 h-3 text-purple-400" /> Immune: {item.immunity}
                          </span>
                        )}

                        {item.stored && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-blue-950 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/50">
                            <Archive className="w-3 h-3 text-blue-400" /> Stored Away (Stash)
                          </span>
                        )}

                        {item.equipped && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/50">
                            Equipped
                          </span>
                        )}

                        {/* Item Price Badges */}
                        {hasPrice ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono bg-amber-950/80 text-amber-200 px-2 py-0.5 rounded border border-amber-600/40">
                            <Tag className="w-3 h-3 text-amber-400" />
                            <span>{basePrice} GP</span>
                            {item.quantity > 1 && <span className="text-amber-400/80">({totalBasePrice} GP total)</span>}
                          </span>
                        ) : (
                          <button
                            onClick={() => setEditingItem(item)}
                            className="text-[10px] font-mono text-stone-500 hover:text-amber-300 underline"
                          >
                            + Add Price
                          </button>
                        )}

                        {/* Vendor Retail Price Badge if vendor */}
                        {character.isVendor && hasPrice && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono bg-emerald-950/90 text-emerald-200 px-2 py-0.5 rounded border border-emerald-600/50 shadow-sm" title={`Selling price at ${vendorMargin}% markup`}>
                            <Store className="w-3 h-3 text-emerald-400" />
                            <span>Retail ({vendorMargin}%): {vendorRetailPrice} GP</span>
                            {item.quantity > 1 && <span className="text-emerald-400/80">({totalVendorPrice} GP)</span>}
                          </span>
                        )}
                      </div>
                      {item.notes && <p className="text-stone-400 text-[11px] italic mt-0.5">{item.notes}</p>}
                    </div>
                  </div>

                  {/* Right: Quantity Adjuster, Weight & Actions */}
                  <div className="flex items-center gap-3 text-stone-300">
                    {/* Weight */}
                    <div className="text-right text-[11px] font-mono">
                      <div className="text-stone-400">Weight:</div>
                      <div className={`font-bold ${
                        item.stored
                          ? 'text-blue-300/60 line-through'
                          : !item.equipped && weightBreakdown.mode === 'equipped_only'
                          ? 'text-stone-400'
                          : 'text-amber-200'
                      }`}>
                        {((Number(item.weight) || 0) * (Number(item.quantity) || 1)).toFixed(1)} lbs
                      </div>
                      {item.stored ? (
                        <div className="text-[9px] text-blue-400 font-sans font-semibold">Stored (0 lbs)</div>
                      ) : !item.equipped && weightBreakdown.mode === 'equipped_only' ? (
                        <div className="text-[9px] text-stone-500 font-sans">Unequipped (0 lbs)</div>
                      ) : null}
                    </div>

                    {/* Healing Item Action */}
                    {isHealingItem(item) && (
                      <button
                        onClick={() => handleUseHealingItem(item)}
                        disabled={item.stored}
                        className={`px-2.5 py-1 font-bold rounded-lg text-xs flex items-center gap-1 transition shadow-md ${
                          item.stored
                            ? 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed opacity-60'
                            : 'bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-500/50'
                        }`}
                        title={item.stored ? 'Item stored away in stash. Un-store item to use.' : 'Consume 1 and restore HP'}
                      >
                        <Heart className="w-3.5 h-3.5 fill-rose-300 text-emerald-200" />
                        {item.stored ? 'Stored (Cannot Use)' : 'Use (Heal)'}
                      </button>
                    )}

                    {/* Quantity */}
                    <div className="flex items-center gap-1.5 bg-stone-900 px-2 py-1 rounded-lg border border-stone-800">
                      <span className="text-[10px] text-stone-400 font-mono">Qty:</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, -1)}
                        className="w-5 h-5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded font-bold flex items-center justify-center text-xs"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-amber-300 min-w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, 1)}
                        className="w-5 h-5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded font-bold flex items-center justify-center text-xs"
                      >
                        +
                      </button>
                    </div>

                    {/* Edit Item / Price */}
                    <button
                      onClick={() => setEditingItem(item)}
                      className="text-stone-400 hover:text-amber-300 p-1 transition"
                      title="Edit Item Details & Price"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete Item */}
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-stone-500 hover:text-rose-400 p-1 transition"
                      title="Delete Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </CollapsibleBox>

      {/* MODAL: Add Inventory Item */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-amber-600/50 rounded-2xl p-6 max-w-lg w-full shadow-2xl text-stone-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-serif font-bold text-amber-300 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-500" /> Add Inventory Item
            </h3>

            <div className="space-y-3 text-xs">
              {/* Quick Select Official D&D Item Preset */}
              <div className="p-3 bg-stone-950/90 border border-amber-500/40 rounded-xl space-y-1.5 shadow-inner">
                <label className="block text-amber-300 font-bold text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Pre-generated Official D&D Item
                  </span>
                  <span className="text-[10px] text-amber-500/80 font-sans font-normal">Auto-fills Stats</span>
                </label>
                <select
                  value={selectedPresetId}
                  onChange={(e) => handleSelectPresetItem(e.target.value)}
                  className="w-full bg-stone-800 border border-amber-600/50 rounded-lg p-2 text-stone-100 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="">-- Select an Official D&D Item Preset... --</option>
                  <optgroup label="⚔️ Simple Weapons">
                    {PRESET_DND_ITEMS.filter(i => i.subCategory === 'Simple Weapon').map(i => (
                      <option key={i.id} value={i.id}>{i.name} ({i.weaponStats?.damage}, {i.costGp} GP, {i.weight} lbs)</option>
                    ))}
                  </optgroup>
                  <optgroup label="⚔️ Martial Weapons">
                    {PRESET_DND_ITEMS.filter(i => i.subCategory === 'Martial Weapon').map(i => (
                      <option key={i.id} value={i.id}>{i.name} ({i.weaponStats?.damage}, {i.costGp} GP, {i.weight} lbs)</option>
                    ))}
                  </optgroup>
                  <optgroup label="✨ Magic Weapons">
                    {PRESET_DND_ITEMS.filter(i => i.subCategory === 'Magic Weapon').map(i => (
                      <option key={i.id} value={i.id}>{i.name} (Magic, {i.weaponStats?.damage}, {i.costGp} GP)</option>
                    ))}
                  </optgroup>
                  <optgroup label="🛡️ Light & Medium Armors">
                    {PRESET_DND_ITEMS.filter(i => i.subCategory === 'Light Armor' || i.subCategory === 'Medium Armor').map(i => (
                      <option key={i.id} value={i.id}>{i.name} (AC {i.armorAc}, {i.costGp} GP, {i.weight} lbs)</option>
                    ))}
                  </optgroup>
                  <optgroup label="🛡️ Heavy Armors & Shields">
                    {PRESET_DND_ITEMS.filter(i => i.subCategory === 'Heavy Armor' || i.subCategory === 'Shield').map(i => (
                      <option key={i.id} value={i.id}>{i.name} (AC {i.armorAc}, {i.costGp} GP, {i.weight} lbs)</option>
                    ))}
                  </optgroup>
                  <optgroup label="🧪 Potions & Scrolls">
                    {PRESET_DND_ITEMS.filter(i => i.subCategory === 'Potion' || i.subCategory === 'Scroll').map(i => (
                      <option key={i.id} value={i.id}>{i.name} ({i.costGp} GP)</option>
                    ))}
                  </optgroup>
                  <optgroup label="💍 Rings, Cloaks & Wondrous Items">
                    {PRESET_DND_ITEMS.filter(i => i.subCategory === 'Ring/Wondrous').map(i => (
                      <option key={i.id} value={i.id}>{i.name} ({i.costGp} GP)</option>
                    ))}
                  </optgroup>
                  <optgroup label="🎒 Adventuring Gear & Tools">
                    {PRESET_DND_ITEMS.filter(i => i.subCategory === 'Adventuring Gear' || i.subCategory === 'Tool/Focus').map(i => (
                      <option key={i.id} value={i.id}>{i.name} ({i.costGp} GP, {i.weight} lbs)</option>
                    ))}
                  </optgroup>
                </select>
                <p className="text-[10px] text-stone-400">
                  Selecting a preset automatically fills category, name, price, weight, magic status, AC / weapon damage, DR, resistance, and item notes.
                </p>
              </div>

              {/* Item Type Picker */}
              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Item Category / Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setItemType('Misc')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      itemType === 'Misc'
                        ? 'bg-amber-600 border-amber-400 text-white shadow-lg shadow-amber-900/30'
                        : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <Package className="w-4 h-4" /> Misc
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemType('Armor')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      itemType === 'Armor'
                        ? 'bg-amber-600 border-amber-400 text-white shadow-lg shadow-amber-900/30'
                        : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <Shield className="w-4 h-4" /> Armor
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemType('Weapon')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      itemType === 'Weapon'
                        ? 'bg-amber-600 border-amber-400 text-white shadow-lg shadow-amber-900/30'
                        : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <Swords className="w-4 h-4" /> Weapon
                  </button>
                </div>
              </div>

              {/* Armor Specific Parameters */}
              {itemType === 'Armor' && (
                <div className="p-3 bg-stone-950/80 border border-amber-600/40 rounded-xl space-y-3">
                  <div className="text-amber-300 font-bold flex items-center gap-1.5 text-xs">
                    <Shield className="w-4 h-4 text-amber-400" /> Armor Stats & AC Calculation
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1">Preset Armor Type</label>
                    <select
                      value={armorPreset}
                      onChange={(e) => handleSelectArmorPreset(e.target.value)}
                      className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                    >
                      <option value="Custom">Custom Armor</option>
                      <option value="Plate">Plate Armor (AC 18, Heavy, Stealth Disadv)</option>
                      <option value="Splint">Splint Armor (AC 17, Heavy, Stealth Disadv)</option>
                      <option value="ChainMail">Chain Mail (AC 16, Heavy, Stealth Disadv)</option>
                      <option value="HalfPlate">Half Plate (AC 15 + Dex max 2, Medium, Stealth Disadv)</option>
                      <option value="ScaleMail">Scale Mail (AC 14 + Dex max 2, Medium, Stealth Disadv)</option>
                      <option value="Breastplate">Breastplate (AC 14 + Dex max 2, Medium)</option>
                      <option value="StuddedLeather">Studded Leather (AC 12 + Dex, Light)</option>
                      <option value="Leather">Leather Armor (AC 11 + Dex, Light)</option>
                      <option value="Shield">Shield (+2 AC)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-stone-400 mb-1">Base AC / AC Value</label>
                      <input
                        type="number"
                        min="0"
                        value={itemArmorAc}
                        onChange={(e) => setItemArmorAc(parseInt(e.target.value) || 0)}
                        className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-amber-300 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-400 mb-1">Armor Category</label>
                      <select
                        value={itemArmorType}
                        onChange={(e) => setItemArmorType(e.target.value as any)}
                        className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                      >
                        <option value="Heavy">Heavy Armor</option>
                        <option value="Medium">Medium Armor</option>
                        <option value="Light">Light Armor</option>
                        <option value="Shield">Shield</option>
                        <option value="Bonus">Magic AC Bonus (+AC)</option>
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-stone-300">
                    <input
                      type="checkbox"
                      checked={stealthDisadvantage}
                      onChange={(e) => setStealthDisadvantage(e.target.checked)}
                      className="accent-amber-500 rounded"
                    />
                    <span>Stealth Disadvantage</span>
                  </label>
                </div>
              )}

              {/* Weapon Specific Parameters */}
              {itemType === 'Weapon' && (
                <div className="p-3 bg-stone-950/80 border border-rose-600/40 rounded-xl space-y-3">
                  <div className="text-rose-300 font-bold flex items-center gap-1.5 text-xs">
                    <Swords className="w-4 h-4 text-rose-400" /> Weapon Combat Parameters
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-stone-400 mb-1">Attack Bonus</label>
                      <input
                        type="text"
                        value={weaponAttackBonus}
                        onChange={(e) => setWeaponAttackBonus(e.target.value)}
                        placeholder="e.g. +5 or 5"
                        className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-amber-300 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-400 mb-1">Damage Expression</label>
                      <input
                        type="text"
                        value={weaponDamage}
                        onChange={(e) => setWeaponDamage(e.target.value)}
                        placeholder="e.g. 1d8 + 3 or 1d8 + 3 Slashing + 1d6 Fire"
                        className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-amber-200 font-mono font-bold"
                      />
                      <span className="text-[10px] text-stone-400 block mt-0.5">Supports multi-damage (e.g. 1d8 + 3 Slashing + 1d6 Fire)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-stone-400 mb-1">Damage Type</label>
                      <select
                        value={OFFICIAL_DAMAGE_TYPES.some(d => d.name.toLowerCase() === weaponDamageType.toLowerCase()) ? OFFICIAL_DAMAGE_TYPES.find(d => d.name.toLowerCase() === weaponDamageType.toLowerCase())?.name : 'Custom'}
                        onChange={(e) => {
                          if (e.target.value === 'Custom') {
                            setWeaponDamageType('Custom');
                          } else {
                            setWeaponDamageType(e.target.value);
                          }
                        }}
                        className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100 font-medium"
                      >
                        {OFFICIAL_DAMAGE_TYPES.map(d => (
                          <option key={d.name} value={d.name}>{d.icon} {d.name}</option>
                        ))}
                        <option value="Custom">✨ Custom / Dual / Multi...</option>
                      </select>

                      {(!OFFICIAL_DAMAGE_TYPES.some(d => d.name.toLowerCase() === weaponDamageType.toLowerCase()) || weaponDamageType === 'Custom') && (
                        <input
                          type="text"
                          value={weaponDamageType === 'Custom' ? '' : weaponDamageType}
                          onChange={(e) => setWeaponDamageType(e.target.value || 'Custom')}
                          placeholder="e.g. Slashing / Fire or Piercing + Poison"
                          className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-amber-200 mt-1 font-mono text-xs"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-stone-400 mb-1">Range</label>
                      <input
                        type="text"
                        value={weaponRange}
                        onChange={(e) => setWeaponRange(e.target.value)}
                        placeholder="e.g. 5 ft Melee or 20/60 ft"
                        className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-stone-400 mb-1">Item Name *</label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Potion of Healing, Cloak of Protection"
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={itemQty}
                    onChange={(e) => setItemQty(parseInt(e.target.value) || 1)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1">Weight (lbs)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={itemWeight}
                    onChange={(e) => setItemWeight(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-amber-300 font-bold mb-1">Price / Value (GP)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="e.g. 50"
                    value={itemCostGp}
                    onChange={(e) => setItemCostGp(e.target.value)}
                    className="w-full bg-stone-800 border border-amber-600/50 rounded-lg p-2 text-amber-200 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 py-1 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer text-stone-300">
                  <input
                    type="checkbox"
                    checked={itemEquipped}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setItemEquipped(isChecked);
                      if (isChecked) setItemStored(false);
                    }}
                    className="accent-amber-500 rounded"
                  />
                  <span>Equipped</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-blue-300">
                  <input
                    type="checkbox"
                    checked={itemStored}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setItemStored(isChecked);
                      if (isChecked) setItemEquipped(false);
                    }}
                    className="accent-blue-500 rounded"
                  />
                  <span>Stored Away (Camp / Base Stash)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-stone-300">
                  <input
                    type="checkbox"
                    checked={itemMagic}
                    onChange={(e) => setItemMagic(e.target.checked)}
                    className="accent-purple-500 rounded"
                  />
                  <span>Magic Item</span>
                </label>
              </div>

              {/* Item Defensive Properties: Damage Reduction, Resistance & Immunity */}
              <div className="p-3 bg-stone-950/80 border border-cyan-600/40 rounded-xl space-y-3">
                <div className="text-cyan-300 font-bold flex items-center gap-1.5 text-xs">
                  <Shield className="w-4 h-4 text-cyan-400" /> Defense & Combat Stats (DR, Resistance & Immunity)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-stone-300 text-xs mb-1 font-semibold">Damage Reduction (DR)</label>
                    <input
                      type="number"
                      min="0"
                      value={itemDamageReduction}
                      onChange={(e) => setItemDamageReduction(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="e.g. 2 or 5"
                      className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-cyan-300 font-mono font-bold text-xs"
                    />
                    <span className="text-[10px] text-stone-500 block mt-0.5">Flat damage absorbed</span>
                  </div>

                  <div>
                    <label className="block text-stone-300 text-xs mb-1 font-semibold">Resistance Granted</label>
                    <input
                      type="text"
                      value={itemResistance}
                      onChange={(e) => setItemResistance(e.target.value)}
                      placeholder="e.g. Fire, Cold, All"
                      className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-orange-300 font-mono font-bold text-xs"
                    />
                    <span className="text-[10px] text-stone-500 block mt-0.5">Halves damage</span>
                  </div>

                  <div>
                    <label className="block text-purple-300 text-xs mb-1 font-semibold">Immunity Granted</label>
                    <input
                      type="text"
                      value={itemImmunity}
                      onChange={(e) => setItemImmunity(e.target.value)}
                      placeholder="e.g. Poison, Fire, All"
                      className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-purple-300 font-mono font-bold text-xs"
                    />
                    <span className="text-[10px] text-stone-500 block mt-0.5">Negates damage (0 HP taken)</span>
                  </div>

                  <div>
                    <label className="block text-rose-300 text-xs mb-1 font-semibold">Max HP Bonus / Penalty</label>
                    <input
                      type="number"
                      value={itemHpMaxBonus}
                      onChange={(e) => setItemHpMaxBonus(parseInt(e.target.value) || 0)}
                      placeholder="e.g. +10 or -5"
                      className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-rose-300 font-mono font-bold text-xs"
                    />
                    <span className="text-[10px] text-stone-500 block mt-0.5">While equipped</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-stone-400 mb-1">Notes / Item Description</label>
                <textarea
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  rows={2}
                  placeholder="Special properties, armor class bonuses, charges..."
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddItemModal(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg"
              >
                Save Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Inventory Item & Price */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-amber-600/50 rounded-2xl p-6 max-w-lg w-full shadow-2xl text-stone-100 space-y-4">
            <h3 className="text-lg font-serif font-bold text-amber-300 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-500" /> Edit Item Details & Price
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-400 mb-1">Item Name</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={editingItem.quantity}
                    onChange={(e) => setEditingItem({ ...editingItem, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1">Weight (lbs)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={editingItem.weight}
                    onChange={(e) => setEditingItem({ ...editingItem, weight: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-amber-300 font-bold mb-1">Price per unit (GP)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="e.g. 50"
                    value={editingItem.costGp !== undefined ? editingItem.costGp : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingItem({
                        ...editingItem,
                        costGp: val !== '' ? Math.max(0, parseFloat(val) || 0) : undefined
                      });
                    }}
                    className="w-full bg-stone-800 border border-amber-600/50 rounded-lg p-2 text-amber-200 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 py-1 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer text-stone-300">
                  <input
                    type="checkbox"
                    checked={editingItem.equipped}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      if (isChecked && character.activeTransformation && character.activeTransformation.form.hasHands === false) {
                        alert(`❌ Cannot equip weapons or gear in this form! Your active transformation (${character.activeTransformation.form.name}) lacks hands/humanoid anatomy.`);
                        return;
                      }
                      setEditingItem({
                        ...editingItem,
                        equipped: isChecked,
                        stored: isChecked ? false : editingItem.stored
                      });
                    }}
                    className="accent-amber-500 rounded"
                  />
                  <span>Equipped</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-blue-300">
                  <input
                    type="checkbox"
                    checked={!!editingItem.stored}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setEditingItem({
                        ...editingItem,
                        stored: isChecked,
                        equipped: isChecked ? false : editingItem.equipped
                      });
                    }}
                    className="accent-blue-500 rounded"
                  />
                  <span>Stored Away (Camp / Base Stash)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-stone-300">
                  <input
                    type="checkbox"
                    checked={editingItem.isMagic}
                    onChange={(e) => setEditingItem({ ...editingItem, isMagic: e.target.checked })}
                    className="accent-purple-500 rounded"
                  />
                  <span>Magic Item</span>
                </label>
              </div>

              {/* Weapon Specific Parameters in Edit Modal */}
              {editingItem.itemType === 'Weapon' && (
                <div className="p-3 bg-stone-950/80 border border-rose-600/40 rounded-xl space-y-3">
                  <div className="text-rose-300 font-bold flex items-center gap-1.5 text-xs">
                    <Swords className="w-4 h-4 text-rose-400" /> Weapon Combat Parameters
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-stone-400 mb-1">Attack Bonus</label>
                      <input
                        type="text"
                        value={editingItem.weaponStats?.attackBonus ?? '+5'}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          weaponStats: {
                            ...(editingItem.weaponStats || { damage: '1d8', damageType: 'Slashing', range: '5 ft Melee' }),
                            attackBonus: e.target.value
                          }
                        })}
                        placeholder="e.g. +5 or 5"
                        className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-amber-300 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-400 mb-1">Damage Expression</label>
                      <input
                        type="text"
                        value={editingItem.weaponStats?.damage ?? '1d8 + 3'}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          weaponStats: {
                            ...(editingItem.weaponStats || { attackBonus: '+5', damageType: 'Slashing', range: '5 ft Melee' }),
                            damage: e.target.value
                          }
                        })}
                        placeholder="e.g. 1d8 + 3 or 1d8 + 3 Slashing + 1d6 Fire"
                        className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-amber-200 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-stone-400 mb-1">Damage Type</label>
                      <select
                        value={OFFICIAL_DAMAGE_TYPES.some(d => d.name.toLowerCase() === (editingItem.weaponStats?.damageType || 'Slashing').toLowerCase()) ? OFFICIAL_DAMAGE_TYPES.find(d => d.name.toLowerCase() === (editingItem.weaponStats?.damageType || 'Slashing').toLowerCase())?.name : 'Custom'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingItem({
                            ...editingItem,
                            weaponStats: {
                              ...(editingItem.weaponStats || { attackBonus: '+5', damage: '1d8', range: '5 ft Melee' }),
                              damageType: val
                            }
                          });
                        }}
                        className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100 font-medium"
                      >
                        {OFFICIAL_DAMAGE_TYPES.map(d => (
                          <option key={d.name} value={d.name}>{d.icon} {d.name}</option>
                        ))}
                        <option value="Custom">✨ Custom / Dual / Multi...</option>
                      </select>

                      {(!OFFICIAL_DAMAGE_TYPES.some(d => d.name.toLowerCase() === (editingItem.weaponStats?.damageType || 'Slashing').toLowerCase()) || editingItem.weaponStats?.damageType === 'Custom') && (
                        <input
                          type="text"
                          value={editingItem.weaponStats?.damageType === 'Custom' ? '' : (editingItem.weaponStats?.damageType || '')}
                          onChange={(e) => setEditingItem({
                            ...editingItem,
                            weaponStats: {
                              ...(editingItem.weaponStats || { attackBonus: '+5', damage: '1d8', range: '5 ft Melee' }),
                              damageType: e.target.value || 'Custom'
                            }
                          })}
                          placeholder="e.g. Slashing / Fire or Piercing + Poison"
                          className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-amber-200 mt-1 font-mono text-xs"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-stone-400 mb-1">Range</label>
                      <input
                        type="text"
                        value={editingItem.weaponStats?.range ?? '5 ft Melee'}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          weaponStats: {
                            ...(editingItem.weaponStats || { attackBonus: '+5', damage: '1d8', damageType: 'Slashing' }),
                            range: e.target.value
                          }
                        })}
                        placeholder="e.g. 5 ft Melee or 20/60 ft"
                        className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Item Defensive Properties: Damage Reduction, Resistance & Immunity */}
              <div className="p-3 bg-stone-950/80 border border-cyan-600/40 rounded-xl space-y-3">
                <div className="text-cyan-300 font-bold flex items-center gap-1.5 text-xs">
                  <Shield className="w-4 h-4 text-cyan-400" /> Defense & Combat Stats (DR, Resistance & Immunity)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-stone-300 text-xs mb-1 font-semibold">Damage Reduction (DR)</label>
                    <input
                      type="number"
                      min="0"
                      value={editingItem.damageReduction || 0}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        damageReduction: Math.max(0, parseInt(e.target.value) || 0)
                      })}
                      placeholder="e.g. 2 or 5"
                      className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-cyan-300 font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-300 text-xs mb-1 font-semibold">Resistance Granted</label>
                    <input
                      type="text"
                      value={editingItem.resistance || ''}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        resistance: e.target.value
                      })}
                      placeholder="e.g. Fire, Cold, Slashing, All"
                      className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-orange-300 font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-300 text-xs mb-1 font-semibold">Immunity Granted</label>
                    <input
                      type="text"
                      value={editingItem.immunity || ''}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        immunity: e.target.value
                      })}
                      placeholder="e.g. Poison, Fire, All"
                      className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-purple-300 font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-rose-300 text-xs mb-1 font-semibold">Max HP Bonus / Penalty</label>
                    <input
                      type="number"
                      value={editingItem.hpMaxBonus || 0}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        hpMaxBonus: parseInt(e.target.value) || 0
                      })}
                      placeholder="e.g. +10 or -5"
                      className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-rose-300 font-mono font-bold text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-stone-400 mb-1">Notes / Item Description</label>
                <textarea
                  value={editingItem.notes || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                  rows={2}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditedItem}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
