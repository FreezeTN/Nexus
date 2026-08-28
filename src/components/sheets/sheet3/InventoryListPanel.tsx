import React, { useState } from 'react';
import { CharacterData, GearItem } from '../../../types';
import { CollapsibleBox } from '../../common/CollapsibleBox';
import { PRESET_DND_ITEMS } from '../../../data/presetItems';
import { saveCustomCompendiumEntry } from '../../../data/compendiumData';
import { recalculateCharacterAC, getMaxAttunementSlots, getAttunedItemsCount } from '../../../utils/dndCalculations';
import { eventBus } from '../../../events/eventBus';
import { useLanguage } from '../../../i18n/LanguageContext';
import {
  Package,
  Plus,
  Trash2,
  Sparkles,
  CheckSquare,
  Square,
  Tag,
  Edit3,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Archive,
  Shield,
  Swords,
  Search,
  X,
  Target,
  Filter,
  Heart,
  Zap,
  Skull,
  ShieldAlert,
  Sliders,
  Wand2
} from 'lucide-react';

interface InventoryListPanelProps {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRollDamage?: (label: string, expression: string) => void;
}

export const InventoryListPanel: React.FC<InventoryListPanelProps> = ({
  character,
  onUpdateCharacter,
  onRollDamage
}) => {
  const { t } = useLanguage();
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GearItem | null>(null);

  // Search & Category Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'weapon_melee' | 'weapon_ranged' | 'armor' | 'magic' | 'misc'>('all');
  const [attunementWarning, setAttunementWarning] = useState<string | null>(null);

  // Drag-and-Drop state for manual inventory reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // New item form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState<number>(1);
  const [newItemWeight, setNewItemWeight] = useState<number>(1);
  const [newItemCost, setNewItemCost] = useState<number>(10);
  const [newItemNotes, setNewItemNotes] = useState('');
  const [newItemType, setNewItemType] = useState<'Weapon' | 'Armor' | 'Misc'>('Misc');
  const [presetSearch, setPresetSearch] = useState('');

  // Extended Combat, DR & Magical Stats state
  const [newItemDamageReduction, setNewItemDamageReduction] = useState<number | ''>('');
  const [newItemResistance, setNewItemResistance] = useState('');
  const [newItemImmunity, setNewItemImmunity] = useState('');
  const [newItemArmorAc, setNewItemArmorAc] = useState<number | ''>('');
  const [newItemAcBonus, setNewItemAcBonus] = useState<number | ''>('');
  const [newItemArmorType, setNewItemArmorType] = useState<'Light' | 'Medium' | 'Heavy' | 'Shield' | 'Bonus'>('Light');
  const [newItemStealthDisadv, setNewItemStealthDisadv] = useState(false);
  const [newItemWeaponDamage, setNewItemWeaponDamage] = useState('');
  const [newItemWeaponDmgType, setNewItemWeaponDmgType] = useState('Slashing');
  const [newItemWeaponAtkBonus, setNewItemWeaponAtkBonus] = useState('');
  const [newItemWeaponRange, setNewItemWeaponRange] = useState('Melee');
  const [newItemHpBonus, setNewItemHpBonus] = useState<number | ''>('');
  const [newItemInitiativeBonus, setNewItemInitiativeBonus] = useState<number | ''>('');
  const [newItemSpellDcBonus, setNewItemSpellDcBonus] = useState<number | ''>('');
  const [newItemIsMagic, setNewItemIsMagic] = useState(false);
  const [newItemIsCursed, setNewItemIsCursed] = useState(false);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);

  const resetNewItemForm = () => {
    setNewItemName('');
    setNewItemQty(1);
    setNewItemWeight(1);
    setNewItemCost(10);
    setNewItemNotes('');
    setNewItemType('Misc');
    setNewItemDamageReduction('');
    setNewItemResistance('');
    setNewItemImmunity('');
    setNewItemArmorAc('');
    setNewItemAcBonus('');
    setNewItemArmorType('Light');
    setNewItemStealthDisadv(false);
    setNewItemWeaponDamage('');
    setNewItemWeaponDmgType('Slashing');
    setNewItemWeaponAtkBonus('');
    setNewItemWeaponRange('Melee');
    setNewItemHpBonus('');
    setNewItemInitiativeBonus('');
    setNewItemSpellDcBonus('');
    setNewItemIsMagic(false);
    setNewItemIsCursed(false);
    setShowAdvancedStats(false);
  };

  const getItemCategory = (item: GearItem): 'Weapon' | 'Armor' | 'Magic' | 'Misc' => {
    if (item.itemType === 'Armor') return 'Armor';
    if (item.itemType === 'Weapon') return 'Weapon';
    if (item.isMagic) return 'Magic';

    const name = item.name.toLowerCase();
    if (name.includes('armor') || name.includes('shield') || name.includes('chainmail') || name.includes('plate')) return 'Armor';
    if (name.includes('sword') || name.includes('bow') || name.includes('axe') || name.includes('dagger') || name.includes('mace') || name.includes('spear')) return 'Weapon';
    if (name.includes('potion') || name.includes('scroll') || name.includes('ring') || name.includes('wand')) return 'Magic';
    return 'Misc';
  };

  const getItemSubtype = (item: GearItem): 'weapon_melee' | 'weapon_ranged' | 'armor' | 'magic' | 'misc' => {
    const mainCat = getItemCategory(item);
    const name = item.name.toLowerCase();
    if (mainCat === 'Weapon') {
      if (name.includes('bow') || name.includes('crossbow') || name.includes('sling') || name.includes('dart') || name.includes('javelin')) {
        return 'weapon_ranged';
      }
      return 'weapon_melee';
    }
    if (mainCat === 'Armor') return 'armor';
    if (mainCat === 'Magic') return 'magic';
    return 'misc';
  };

  const handleToggleEquipped = (id: string) => {
    const updatedInventory = character.inventory.map(item => {
      if (item.id === id) {
        const nextEquipped = !item.equipped;
        return {
          ...item,
          equipped: nextEquipped,
          stored: nextEquipped ? false : item.stored
        };
      }
      return item;
    });

    const updatedChar = recalculateCharacterAC({
      ...character,
      inventory: updatedInventory
    });

    onUpdateCharacter(updatedChar);
  };

  const handleToggleStored = (id: string) => {
    const updatedInventory = character.inventory.map(item => {
      if (item.id === id) {
        const nextStored = !item.stored;
        return {
          ...item,
          stored: nextStored,
          equipped: nextStored ? false : item.equipped
        };
      }
      return item;
    });

    onUpdateCharacter(recalculateCharacterAC({
      ...character,
      inventory: updatedInventory
    }));
  };

  const handleToggleAttuned = (id: string) => {
    const itemToToggle = character.inventory.find(i => i.id === id);
    if (!itemToToggle) return;

    // If trying to attune an item when already at max capacity
    if (!itemToToggle.attuned) {
      const maxSlots = getMaxAttunementSlots(character).maxSlots;
      const currentAttuned = getAttunedItemsCount(character);
      if (currentAttuned >= maxSlots) {
        setAttunementWarning(`Cannot attune "${itemToToggle.name}": All ${maxSlots} attunement slots are in use! Unattune an item or increase attunement capacity (e.g. Artificer Lvl 10+).`);
        setTimeout(() => setAttunementWarning(null), 5000);
        return;
      }
    }

    setAttunementWarning(null);
    const updatedInventory = character.inventory.map(item => {
      if (item.id === id) {
        const nextAttuned = !item.attuned;
        return {
          ...item,
          attuned: nextAttuned,
          isMagic: nextAttuned ? true : item.isMagic
        };
      }
      return item;
    });

    onUpdateCharacter(recalculateCharacterAC({
      ...character,
      inventory: updatedInventory
    }));
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    const updated = character.inventory.map(item => {
      if (item.id === id) {
        const nextQty = Math.max(1, (item.quantity || 1) + delta);
        return { ...item, quantity: nextQty };
      }
      return item;
    });
    onUpdateCharacter({ ...character, inventory: updated });
  };

  const handleDeleteItem = (id: string) => {
    const updated = character.inventory.filter(i => i.id !== id);
    onUpdateCharacter(recalculateCharacterAC({
      ...character,
      inventory: updated
    }));
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) return;

    const hasWeaponData = newItemType === 'Weapon' || newItemWeaponDamage.trim() || newItemWeaponAtkBonus.trim() || newItemWeaponRange.trim();
    const weaponStats = hasWeaponData ? {
      damage: newItemWeaponDamage.trim() || undefined,
      damageType: newItemWeaponDmgType.trim() || undefined,
      attackBonus: newItemWeaponAtkBonus.trim() || undefined,
      range: newItemWeaponRange.trim() || undefined,
    } : undefined;

    const newItem: GearItem = {
      id: 'gear-' + Date.now(),
      name: newItemName.trim(),
      quantity: newItemQty,
      weight: newItemWeight,
      costGp: newItemCost,
      equipped: false,
      stored: false,
      notes: newItemNotes.trim() || undefined,
      itemType: newItemType,
      damageReduction: newItemDamageReduction !== '' ? Number(newItemDamageReduction) : undefined,
      resistance: newItemResistance.trim() || undefined,
      immunity: newItemImmunity.trim() || undefined,
      armorAc: newItemArmorAc !== '' ? Number(newItemArmorAc) : undefined,
      acBonus: newItemAcBonus !== '' ? Number(newItemAcBonus) : undefined,
      armorType: newItemType === 'Armor' ? newItemArmorType : undefined,
      stealthDisadvantage: newItemStealthDisadv || undefined,
      weaponStats: weaponStats,
      hpMaxBonus: newItemHpBonus !== '' ? Number(newItemHpBonus) : undefined,
      initiativeBonus: newItemInitiativeBonus !== '' ? Number(newItemInitiativeBonus) : undefined,
      spellDcBonus: newItemSpellDcBonus !== '' ? Number(newItemSpellDcBonus) : undefined,
      isMagic: newItemIsMagic || (newItemType === 'Misc' && (newItemSpellDcBonus !== '' || newItemHpBonus !== '')) || undefined,
      isCursed: newItemIsCursed || undefined
    };

    const updatedChar = recalculateCharacterAC({
      ...character,
      inventory: [...character.inventory, newItem]
    });

    onUpdateCharacter(updatedChar);

    eventBus.emit('ItemAdded', {
      characterId: character.id,
      itemName: newItem.name,
      quantity: newItem.quantity || 1
    });

    try {
      saveCustomCompendiumEntry({
        id: 'comp-gear-' + newItem.id,
        name: newItem.name,
        category: 'items',
        edition: character.edition || '5e',
        description: `${newItem.itemType || 'General'} item weighing ${newItem.weight} lbs. ${newItem.notes || ''}`,
        source: 'Custom Inventory Item',
        isCustom: true,
        tags: [character.edition || '5e', newItem.itemType || 'General'],
        itemData: newItem
      });
    } catch (e) {
      console.error('Failed to auto-add item to compendium', e);
    }

    resetNewItemForm();
    setShowAddItemModal(false);
  };

  const handleAddPresetItem = (preset: any) => {
    const newItem: GearItem = {
      id: 'gear-preset-' + Date.now() + Math.random().toString(36).substring(2, 6),
      name: preset.name || 'SRD Equipment',
      quantity: 1,
      weight: preset.weight || 1,
      costGp: preset.costGp || 0,
      equipped: false,
      stored: false,
      notes: preset.notes || '',
      itemType: (preset.category === 'Weapon' || preset.category === 'Armor') ? preset.category : 'Misc',
      armorAc: preset.armorAc,
      armorType: preset.armorType,
      weaponStats: preset.weaponStats
    };

    onUpdateCharacter(recalculateCharacterAC({
      ...character,
      inventory: [...character.inventory, newItem]
    }));

    eventBus.emit('ItemAdded', {
      characterId: character.id,
      itemName: newItem.name,
      quantity: newItem.quantity || 1
    });

    setShowAddItemModal(false);
  };

  // Drag and drop sorting handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newInventory = [...character.inventory];
    const [movedItem] = newInventory.splice(draggedIndex, 1);
    newInventory.splice(dropIndex, 0, movedItem);

    onUpdateCharacter({
      ...character,
      inventory: newInventory
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleMoveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= character.inventory.length) return;
    const newInventory = [...character.inventory];
    const [movedItem] = newInventory.splice(fromIndex, 1);
    newInventory.splice(toIndex, 0, movedItem);

    onUpdateCharacter({
      ...character,
      inventory: newInventory
    });
  };

  // Filtered Inventory List
  const filteredInventoryWithIndices = character.inventory.map((item, originalIndex) => ({
    item,
    originalIndex
  })).filter(({ item }) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchNotes = (item.notes || '').toLowerCase().includes(q);
      const matchType = (item.itemType || '').toLowerCase().includes(q);
      if (!matchName && !matchNotes && !matchType) return false;
    }

    if (categoryFilter === 'all') return true;
    const subtype = getItemSubtype(item);
    return subtype === categoryFilter;
  });

  const countAll = character.inventory.length;
  const countMelee = character.inventory.filter(i => getItemSubtype(i) === 'weapon_melee').length;
  const countRanged = character.inventory.filter(i => getItemSubtype(i) === 'weapon_ranged').length;
  const countArmor = character.inventory.filter(i => getItemSubtype(i) === 'armor').length;
  const countMagic = character.inventory.filter(i => getItemSubtype(i) === 'magic').length;
  const countMisc = character.inventory.filter(i => getItemSubtype(i) === 'misc').length;

  return (
    <CollapsibleBox
      title={t('inventory.title', 'Equipment & Inventory')}
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
          <Plus className="w-4 h-4" /> {t('inventory.addItem', '+ Add Item')}
        </button>
      }
    >
      <div className="space-y-4 pt-2">
        {/* Search and Category Filters */}
        <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-3">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('compendium.searchPlaceholder', "Search inventory items (e.g., 'Plate', 'Dagger', 'Potion')...")}
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

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[10px] font-mono text-stone-400 font-bold uppercase mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-amber-500" /> Filter:
            </span>

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
              <span>{t('common.all', 'All')} ({countAll})</span>
            </button>

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
              <span>{t('combat.weapons', 'Melee')} ({countMelee})</span>
            </button>

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
              <span>{t('combat.weapons', 'Ranged')} ({countRanged})</span>
            </button>

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
              <span>{t('defenses.armorClass', 'Armor')} ({countArmor})</span>
            </button>

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
              <span>{t('inventory.attuned', 'Magic')} ({countMagic})</span>
            </button>

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
              <span>{t('common.misc', 'Misc')} ({countMisc})</span>
            </button>

            {/* Attunement Slot Capacity Pill */}
            {character.edition !== '3.5e' && (() => {
              const maxSlots = getMaxAttunementSlots(character).maxSlots;
              const currentAttuned = getAttunedItemsCount(character);
              return (
                <div className={`ml-auto px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold flex items-center gap-1.5 border ${
                  currentAttuned >= maxSlots
                    ? 'bg-purple-950/80 text-purple-300 border-purple-500/60'
                    : 'bg-stone-900 text-stone-300 border-stone-800'
                }`}
                title={`Attunement Slots: ${currentAttuned}/${maxSlots} active bonded items`}>
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Attuned: {currentAttuned} / {maxSlots}</span>
                </div>
              );
            })()}
          </div>

          {/* Attunement Limit Warning Alert */}
          {attunementWarning && (
            <div className="bg-rose-950/80 border border-rose-600/70 text-rose-200 text-xs px-3 py-2 rounded-xl flex items-center justify-between gap-2 animate-fadeIn">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{attunementWarning}</span>
              </div>
              <button
                type="button"
                onClick={() => setAttunementWarning(null)}
                className="text-rose-400 hover:text-rose-100 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Inventory Items Grid */}
        {character.inventory.length === 0 ? (
          <p className="text-xs text-stone-500 italic py-4 text-center">
            No gear items in inventory. Click &quot;+ Add Item&quot; to log weapons, potions, armor, or adventuring packs!
          </p>
        ) : filteredInventoryWithIndices.length === 0 ? (
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
            {filteredInventoryWithIndices.map(({ item, originalIndex }) => {
              const index = originalIndex;
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
                  {/* Left: Reorder, Toggles, Name */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
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

                    <button
                      onClick={() => handleToggleEquipped(item.id)}
                      className={`flex items-center gap-1 transition px-1.5 py-0.5 rounded border text-[10px] font-mono ${
                        item.equipped
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500 font-bold'
                          : 'bg-stone-900 text-stone-500 border-stone-800 hover:text-stone-300'
                      }`}
                      title={item.equipped ? 'Equipped (Active)' : 'Unequipped (Carried)'}
                    >
                      {item.equipped ? <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> : <Square className="w-3.5 h-3.5" />}
                      <span>EQ</span>
                    </button>

                    <button
                      onClick={() => handleToggleStored(item.id)}
                      className={`flex items-center gap-1 transition px-1.5 py-0.5 rounded border text-[10px] font-mono cursor-pointer ${
                        item.stored
                          ? 'bg-blue-950/80 text-blue-300 border-blue-500 font-bold'
                          : 'bg-stone-900 text-stone-500 border-stone-800 hover:text-stone-300'
                      }`}
                      title={item.stored ? 'Stored Away (In Vault/Camp - Excluded from Weight)' : 'Carried on Person'}
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>{item.stored ? 'STASH' : 'CARRY'}</span>
                    </button>

                    <button
                      onClick={() => handleToggleAttuned(item.id)}
                      className={`flex items-center gap-1 transition px-1.5 py-0.5 rounded border text-[10px] font-mono cursor-pointer ${
                        item.attuned
                          ? 'bg-purple-950/90 text-purple-200 border-purple-500 font-bold shadow'
                          : 'bg-stone-900 text-stone-500 border-stone-800 hover:text-stone-300'
                      }`}
                      title={item.attuned ? 'Attuned Magic Item (Active Bond)' : 'Click to Attune Magic Item'}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>{item.attuned ? 'ATTUNED' : 'ATTUNE'}</span>
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-amber-200 text-sm truncate">{item.name}</span>
                        {item.attuned && (
                          <span className="text-[10px] text-purple-300 bg-purple-950/80 px-1.5 py-0.2 rounded border border-purple-600/60 font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-purple-300" /> Attuned
                          </span>
                        )}
                        {item.itemType && (
                          <span className="text-[10px] text-stone-400 bg-stone-900 px-1.5 py-0.2 rounded border border-stone-800">
                            {item.itemType}
                          </span>
                        )}
                        {item.damageReduction !== undefined && item.damageReduction > 0 && (
                          <span className="text-[10px] text-amber-300 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-600/60 font-bold font-mono" title={`Damage Reduction: Absorbs up to ${item.damageReduction} damage`}>
                            DR {item.damageReduction}
                          </span>
                        )}
                        {item.armorAc !== undefined && (
                          <span className="text-[10px] text-blue-300 bg-blue-950/80 px-1.5 py-0.2 rounded border border-blue-600/60 font-bold font-mono">
                            {item.armorAc} AC
                          </span>
                        )}
                        {item.acBonus !== undefined && item.acBonus > 0 && (
                          <span className="text-[10px] text-blue-300 bg-blue-950/80 px-1.5 py-0.2 rounded border border-blue-600/60 font-bold font-mono">
                            +{item.acBonus} AC
                          </span>
                        )}
                        {item.weaponStats?.damage && (
                          <span className="text-[10px] text-rose-300 bg-rose-950/80 px-1.5 py-0.2 rounded border border-rose-600/60 font-bold font-mono">
                            ⚔️ {item.weaponStats.damage} {item.weaponStats.damageType || ''}
                          </span>
                        )}
                        {item.resistance && (
                          <span className="text-[10px] text-orange-300 bg-orange-950/80 px-1.5 py-0.2 rounded border border-orange-600/60 font-mono">
                            🛡️ Resist {item.resistance}
                          </span>
                        )}
                        {item.immunity && (
                          <span className="text-[10px] text-emerald-300 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-600/60 font-mono">
                            ✨ Immune {item.immunity}
                          </span>
                        )}
                        {item.hpMaxBonus !== undefined && item.hpMaxBonus !== 0 && (
                          <span className="text-[10px] text-red-300 bg-red-950/80 px-1.5 py-0.2 rounded border border-red-600/60 font-mono font-bold">
                            {item.hpMaxBonus > 0 ? `+${item.hpMaxBonus}` : item.hpMaxBonus} Max HP
                          </span>
                        )}
                        {item.spellDcBonus !== undefined && item.spellDcBonus > 0 && (
                          <span className="text-[10px] text-indigo-300 bg-indigo-950/80 px-1.5 py-0.2 rounded border border-indigo-600/60 font-mono">
                            +{item.spellDcBonus} Spell DC
                          </span>
                        )}
                        {item.isCursed && (
                          <span className="text-[10px] text-red-400 bg-red-950 px-1.5 py-0.2 rounded border border-red-700 font-bold">
                            ☠️ Cursed
                          </span>
                        )}
                      </div>
                      {item.notes && (
                        <p className="text-[11px] text-stone-400 truncate max-w-xs">{item.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* Right: Quantity, Weight, Value, Actions */}
                  <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
                    <div className="flex items-center gap-1 bg-stone-900 border border-stone-800 rounded px-1.5 py-0.5">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, -1)}
                        className="px-1 text-stone-400 hover:text-amber-300 font-bold"
                      >
                        -
                      </button>
                      <span className="text-amber-300 font-bold px-1">{item.quantity || 1}x</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, 1)}
                        className="px-1 text-stone-400 hover:text-amber-300 font-bold"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-stone-400 text-[11px]">
                      {((item.weight || 0) * (item.quantity || 1)).toFixed(1)} lbs
                    </span>

                    <span className="text-amber-400 font-bold text-[11px]">
                      {item.costGp ? `${(item.costGp * (item.quantity || 1)).toLocaleString()} GP` : '--'}
                    </span>

                    <button
                      onClick={() => setEditingItem(item)}
                      className="text-stone-500 hover:text-amber-300 p-1 transition"
                      title="Edit Item"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-stone-500 hover:text-rose-400 p-1 transition"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: Add New Item / SRD Preset Picker */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-amber-600/50 rounded-2xl p-6 max-w-xl w-full shadow-2xl text-stone-100 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
              <h3 className="text-lg font-serif font-bold text-amber-300 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" /> Add Gear & Equipment
              </h3>
              <button
                type="button"
                onClick={() => { resetNewItemForm(); setShowAddItemModal(false); }}
                className="text-stone-400 hover:text-stone-200 transition p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Fields for Custom Item */}
            <div className="space-y-3 text-xs overflow-y-auto flex-1 pr-1.5">
              {/* Row 1: Name */}
              <div>
                <label className="block text-stone-300 mb-1 font-semibold">Item Name *</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Dragon Slayer Greatsword, Adamantine Full Plate, Ring of Protection"
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100 font-bold focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Row 2: Quantity, Weight, Cost */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-amber-200 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Weight (lbs)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newItemWeight}
                    onChange={(e) => setNewItemWeight(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Cost (GP)</label>
                  <input
                    type="number"
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-amber-300 font-mono"
                  />
                </div>
              </div>

              {/* Row 3: Category Selector */}
              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Category / Type</label>
                <select
                  value={newItemType}
                  onChange={(e: any) => setNewItemType(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100 font-medium"
                >
                  <option value="Misc">General Adventuring Gear / Wondrous Item / Consumable</option>
                  <option value="Weapon">⚔️ Weapon (Melee / Ranged)</option>
                  <option value="Armor">🛡️ Armor / Shield</option>
                </select>
              </div>

              {/* Weapon Specific Fields */}
              {newItemType === 'Weapon' && (
                <div className="bg-rose-950/20 border border-rose-800/40 rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-rose-300 font-bold font-serif text-xs">
                    <Swords className="w-4 h-4 text-rose-400" />
                    <span>Weapon Combat Statistics</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-stone-400 text-[11px] mb-1">Damage Dice</label>
                      <input
                        type="text"
                        value={newItemWeaponDamage}
                        onChange={(e) => setNewItemWeaponDamage(e.target.value)}
                        placeholder="e.g. 1d8 + 2, 2d6"
                        className="w-full bg-stone-800 border border-rose-700/50 rounded-lg p-1.5 text-rose-200 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-400 text-[11px] mb-1">Damage Type</label>
                      <input
                        type="text"
                        value={newItemWeaponDmgType}
                        onChange={(e) => setNewItemWeaponDmgType(e.target.value)}
                        placeholder="Slashing, Fire..."
                        className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-stone-200"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-400 text-[11px] mb-1">Attack Bonus</label>
                      <input
                        type="text"
                        value={newItemWeaponAtkBonus}
                        onChange={(e) => setNewItemWeaponAtkBonus(e.target.value)}
                        placeholder="e.g. +1, +2"
                        className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-stone-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-400 text-[11px] mb-1">Range / Reach</label>
                      <input
                        type="text"
                        value={newItemWeaponRange}
                        onChange={(e) => setNewItemWeaponRange(e.target.value)}
                        placeholder="Melee, 20/60 ft"
                        className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-stone-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Armor / Shield Specific Fields */}
              {newItemType === 'Armor' && (
                <div className="bg-blue-950/20 border border-blue-800/40 rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-blue-300 font-bold font-serif text-xs">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span>Armor & Shield Statistics</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-stone-400 text-[11px] mb-1">Base AC Value</label>
                      <input
                        type="number"
                        value={newItemArmorAc}
                        onChange={(e) => setNewItemArmorAc(e.target.value === '' ? '' : parseInt(e.target.value))}
                        placeholder="e.g. 14, 16, 18"
                        className="w-full bg-stone-800 border border-blue-700/50 rounded-lg p-1.5 text-blue-200 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-400 text-[11px] mb-1">AC Bonus (+)</label>
                      <input
                        type="number"
                        value={newItemAcBonus}
                        onChange={(e) => setNewItemAcBonus(e.target.value === '' ? '' : parseInt(e.target.value))}
                        placeholder="e.g. 1, 2"
                        className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-stone-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-400 text-[11px] mb-1">Armor Class</label>
                      <select
                        value={newItemArmorType}
                        onChange={(e: any) => setNewItemArmorType(e.target.value)}
                        className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-stone-200"
                      >
                        <option value="Light">Light Armor</option>
                        <option value="Medium">Medium Armor</option>
                        <option value="Heavy">Heavy Armor</option>
                        <option value="Shield">Shield (+2 Base)</option>
                        <option value="Bonus">Accessory Bonus</option>
                      </select>
                    </div>
                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-1.5 text-stone-300 text-[11px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newItemStealthDisadv}
                          onChange={(e) => setNewItemStealthDisadv(e.target.checked)}
                          className="rounded text-amber-500"
                        />
                        <span>Stealth Disadv.</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Damage Reduction, Resistances & Magical Stats (Collapsible or always expandable) */}
              <div className="border border-stone-800 rounded-xl bg-stone-950/60 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAdvancedStats(!showAdvancedStats)}
                  className="w-full px-3 py-2 text-left flex items-center justify-between text-xs font-bold text-amber-300/90 hover:bg-stone-850 transition"
                >
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>Damage Reduction (DR), Resistances & Magical Bonuses</span>
                    {(newItemDamageReduction !== '' || newItemResistance || newItemImmunity || newItemHpBonus !== '' || newItemSpellDcBonus !== '') && (
                      <span className="px-1.5 py-0.2 bg-amber-900/60 text-amber-200 text-[10px] rounded-full border border-amber-600/40">Active</span>
                    )}
                  </span>
                  {showAdvancedStats ? <ChevronUp className="w-3.5 h-3.5 text-stone-400" /> : <ChevronDown className="w-3.5 h-3.5 text-stone-400" />}
                </button>

                {showAdvancedStats && (
                  <div className="p-3 border-t border-stone-800 space-y-3 bg-stone-900/40 text-xs">
                    {/* DR & Defenses */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-amber-300 text-[11px] mb-1 font-semibold" title="Damage Reduction absorbs flat damage from every incoming hit before HP is reduced.">
                          🛡️ Damage Reduction (DR)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={newItemDamageReduction}
                          onChange={(e) => setNewItemDamageReduction(e.target.value === '' ? '' : parseInt(e.target.value))}
                          placeholder="e.g. 2, 5, 10"
                          className="w-full bg-stone-800 border border-amber-600/40 rounded-lg p-1.5 text-amber-200 font-mono font-bold"
                        />
                        <span className="text-[10px] text-stone-500 mt-0.5 block">Flat damage absorbed per hit</span>
                      </div>

                      <div>
                        <label className="block text-orange-300 text-[11px] mb-1 font-semibold">
                          🔥 Damage Resistance
                        </label>
                        <input
                          type="text"
                          value={newItemResistance}
                          onChange={(e) => setNewItemResistance(e.target.value)}
                          placeholder="e.g. Fire, Cold, Slashing"
                          className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-stone-200"
                        />
                        <span className="text-[10px] text-stone-500 mt-0.5 block">Halves damage of this type</span>
                      </div>

                      <div>
                        <label className="block text-emerald-300 text-[11px] mb-1 font-semibold">
                          ✨ Damage Immunity
                        </label>
                        <input
                          type="text"
                          value={newItemImmunity}
                          onChange={(e) => setNewItemImmunity(e.target.value)}
                          placeholder="e.g. Poison, Necrotic, All"
                          className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-stone-200"
                        />
                        <span className="text-[10px] text-stone-500 mt-0.5 block">Reduces damage to 0</span>
                      </div>
                    </div>

                    {/* Magical Modifiers & Mod Toggles */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-stone-800/80">
                      <div>
                        <label className="block text-red-300 text-[11px] mb-1 font-semibold">
                          ❤️ Max HP Modifier
                        </label>
                        <input
                          type="number"
                          value={newItemHpBonus}
                          onChange={(e) => setNewItemHpBonus(e.target.value === '' ? '' : parseInt(e.target.value))}
                          placeholder="e.g. +10, -5"
                          className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-red-200 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-indigo-300 text-[11px] mb-1 font-semibold">
                          🔮 Spell Save DC Bonus
                        </label>
                        <input
                          type="number"
                          value={newItemSpellDcBonus}
                          onChange={(e) => setNewItemSpellDcBonus(e.target.value === '' ? '' : parseInt(e.target.value))}
                          placeholder="e.g. +1, +2"
                          className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-indigo-200 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-yellow-300 text-[11px] mb-1 font-semibold">
                          ⚡ Initiative Bonus
                        </label>
                        <input
                          type="number"
                          value={newItemInitiativeBonus}
                          onChange={(e) => setNewItemInitiativeBonus(e.target.value === '' ? '' : parseInt(e.target.value))}
                          placeholder="e.g. +2"
                          className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-yellow-200 font-mono"
                        />
                      </div>
                    </div>

                    {/* Flags */}
                    <div className="flex items-center gap-4 pt-1">
                      <label className="flex items-center gap-1.5 text-purple-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newItemIsMagic}
                          onChange={(e) => setNewItemIsMagic(e.target.checked)}
                          className="rounded text-purple-600"
                        />
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>Magical Item</span>
                      </label>

                      <label className="flex items-center gap-1.5 text-rose-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newItemIsCursed}
                          onChange={(e) => setNewItemIsCursed(e.target.checked)}
                          className="rounded text-rose-600"
                        />
                        <Skull className="w-3.5 h-3.5 text-rose-400" />
                        <span>Cursed Item</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Item Notes */}
              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Item Notes & Magical Properties</label>
                <textarea
                  value={newItemNotes}
                  onChange={(e) => setNewItemNotes(e.target.value)}
                  rows={2}
                  placeholder="Properties, effects, charges, command words..."
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Quick SRD Presets Library */}
              <div className="pt-3 border-t border-stone-800 space-y-2">
                <span className="font-serif font-bold text-amber-300 text-xs block">
                  Quick Add Official SRD Gear Presets
                </span>
                <input
                  type="text"
                  value={presetSearch}
                  onChange={(e) => setPresetSearch(e.target.value)}
                  placeholder="Search SRD gear catalog..."
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg p-1.5 text-xs text-stone-200"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pt-1">
                  {PRESET_DND_ITEMS.filter(p => p.name?.toLowerCase().includes(presetSearch.toLowerCase())).map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handleAddPresetItem(preset as any)}
                      className="text-left bg-stone-950 hover:bg-stone-800 p-2 rounded-lg border border-stone-800 text-xs flex justify-between items-center transition"
                    >
                      <div>
                        <div className="font-bold text-amber-200">{preset.name}</div>
                        <div className="text-[10px] text-stone-400 font-mono">{preset.weight} lbs | {preset.costGp} GP</div>
                      </div>
                      <span className="text-amber-400 text-xs font-bold">+ Add</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => { resetNewItemForm(); setShowAddItemModal(false); }}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg"
              >
                Save Custom Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Item */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-amber-600/50 rounded-2xl p-6 max-w-lg w-full shadow-2xl text-stone-100 space-y-4 text-xs max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <h3 className="text-lg font-serif font-bold text-amber-300 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-500" />
                <span>Edit Item: {editingItem.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-stone-400 hover:text-stone-200 transition p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 pr-1.5">
              {/* Row 1: Name & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <label className="block text-stone-400 mb-1 font-semibold">Item Name</label>
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Category</label>
                  <select
                    value={editingItem.itemType || 'Misc'}
                    onChange={(e: any) => setEditingItem({ ...editingItem, itemType: e.target.value })}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                  >
                    <option value="Misc">Misc / Gear</option>
                    <option value="Weapon">Weapon</option>
                    <option value="Armor">Armor / Shield</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Qty, Weight, Cost */}
              <div className="grid grid-cols-3 gap-2 font-mono">
                <div>
                  <label className="block text-stone-400 mb-1 font-sans font-semibold">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={editingItem.quantity || 1}
                    onChange={(e) => setEditingItem({ ...editingItem, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-amber-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1 font-sans font-semibold">Weight (lbs)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingItem.weight || 0}
                    onChange={(e) => setEditingItem({ ...editingItem, weight: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1 font-sans font-semibold">Cost (GP)</label>
                  <input
                    type="number"
                    value={editingItem.costGp || 0}
                    onChange={(e) => setEditingItem({ ...editingItem, costGp: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-amber-300 font-bold"
                  />
                </div>
              </div>

              {/* Weapon Stats */}
              {(editingItem.itemType === 'Weapon' || editingItem.weaponStats) && (
                <div className="bg-rose-950/20 border border-rose-800/40 rounded-xl p-2.5 space-y-2">
                  <div className="text-rose-300 font-bold flex items-center gap-1.5 font-serif text-xs">
                    <Swords className="w-3.5 h-3.5 text-rose-400" />
                    <span>Weapon Attack & Damage</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                    <div>
                      <label className="block text-stone-400 text-[10px] font-sans">Damage</label>
                      <input
                        type="text"
                        value={editingItem.weaponStats?.damage || ''}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          weaponStats: { ...(editingItem.weaponStats || {}), damage: e.target.value }
                        })}
                        placeholder="1d8+2"
                        className="w-full bg-stone-800 border border-rose-700/40 rounded p-1.5 text-rose-200 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-400 text-[10px] font-sans">Damage Type</label>
                      <input
                        type="text"
                        value={editingItem.weaponStats?.damageType || ''}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          weaponStats: { ...(editingItem.weaponStats || {}), damageType: e.target.value }
                        })}
                        placeholder="Slashing"
                        className="w-full bg-stone-800 border border-stone-700 rounded p-1.5 text-stone-200"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-400 text-[10px] font-sans">Attack Bonus</label>
                      <input
                        type="text"
                        value={editingItem.weaponStats?.attackBonus || ''}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          weaponStats: { ...(editingItem.weaponStats || {}), attackBonus: e.target.value }
                        })}
                        placeholder="+1"
                        className="w-full bg-stone-800 border border-stone-700 rounded p-1.5 text-stone-200"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-400 text-[10px] font-sans">Range</label>
                      <input
                        type="text"
                        value={editingItem.weaponStats?.range || ''}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          weaponStats: { ...(editingItem.weaponStats || {}), range: e.target.value }
                        })}
                        placeholder="Melee"
                        className="w-full bg-stone-800 border border-stone-700 rounded p-1.5 text-stone-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Armor Stats */}
              {(editingItem.itemType === 'Armor' || editingItem.armorAc !== undefined || editingItem.acBonus !== undefined) && (
                <div className="bg-blue-950/20 border border-blue-800/40 rounded-xl p-2.5 space-y-2">
                  <div className="text-blue-300 font-bold flex items-center gap-1.5 font-serif text-xs">
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    <span>Armor & Shield Defenses</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                    <div>
                      <label className="block text-stone-400 text-[10px] font-sans">Base AC</label>
                      <input
                        type="number"
                        value={editingItem.armorAc ?? ''}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          armorAc: e.target.value === '' ? undefined : parseInt(e.target.value)
                        })}
                        placeholder="16"
                        className="w-full bg-stone-800 border border-blue-700/40 rounded p-1.5 text-blue-200 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-400 text-[10px] font-sans">AC Bonus (+)</label>
                      <input
                        type="number"
                        value={editingItem.acBonus ?? ''}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          acBonus: e.target.value === '' ? undefined : parseInt(e.target.value)
                        })}
                        placeholder="1"
                        className="w-full bg-stone-800 border border-stone-700 rounded p-1.5 text-stone-200"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-400 text-[10px] font-sans">Armor Type</label>
                      <select
                        value={editingItem.armorType || 'Light'}
                        onChange={(e: any) => setEditingItem({ ...editingItem, armorType: e.target.value })}
                        className="w-full bg-stone-800 border border-stone-700 rounded p-1.5 text-stone-200 font-sans"
                      >
                        <option value="Light">Light</option>
                        <option value="Medium">Medium</option>
                        <option value="Heavy">Heavy</option>
                        <option value="Shield">Shield</option>
                        <option value="Bonus">Bonus</option>
                      </select>
                    </div>
                    <div className="flex items-center pt-4">
                      <label className="flex items-center gap-1.5 text-stone-300 text-[11px] cursor-pointer font-sans">
                        <input
                          type="checkbox"
                          checked={editingItem.stealthDisadvantage || false}
                          onChange={(e) => setEditingItem({ ...editingItem, stealthDisadvantage: e.target.checked })}
                          className="rounded text-amber-500"
                        />
                        <span>Stealth Disadv.</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Combat Defenses: DR, Resistance, Immunity */}
              <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-3 space-y-2.5">
                <div className="text-amber-300 font-bold flex items-center gap-1.5 font-serif text-xs">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Damage Reduction (DR) & Resistances</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-amber-300 text-[11px] mb-1 font-semibold">Damage Reduction (DR)</label>
                    <input
                      type="number"
                      min="0"
                      value={editingItem.damageReduction ?? ''}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        damageReduction: e.target.value === '' ? undefined : parseInt(e.target.value)
                      })}
                      placeholder="e.g. 3, 5"
                      className="w-full bg-stone-800 border border-amber-600/40 rounded p-1.5 text-amber-200 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-orange-300 text-[11px] mb-1 font-semibold">Resistance</label>
                    <input
                      type="text"
                      value={editingItem.resistance || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, resistance: e.target.value || undefined })}
                      placeholder="Fire, Cold"
                      className="w-full bg-stone-800 border border-stone-700 rounded p-1.5 text-stone-200"
                    />
                  </div>
                  <div>
                    <label className="block text-emerald-300 text-[11px] mb-1 font-semibold">Immunity</label>
                    <input
                      type="text"
                      value={editingItem.immunity || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, immunity: e.target.value || undefined })}
                      placeholder="Poison, Acid"
                      className="w-full bg-stone-800 border border-stone-700 rounded p-1.5 text-stone-200"
                    />
                  </div>
                </div>

                {/* Modifiers */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-stone-800 font-mono">
                  <div>
                    <label className="block text-red-300 text-[10px] font-sans">Max HP Mod</label>
                    <input
                      type="number"
                      value={editingItem.hpMaxBonus ?? ''}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        hpMaxBonus: e.target.value === '' ? undefined : parseInt(e.target.value)
                      })}
                      placeholder="+10"
                      className="w-full bg-stone-800 border border-stone-700 rounded p-1.5 text-red-200"
                    />
                  </div>
                  <div>
                    <label className="block text-indigo-300 text-[10px] font-sans">Spell DC Bonus</label>
                    <input
                      type="number"
                      value={editingItem.spellDcBonus ?? ''}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        spellDcBonus: e.target.value === '' ? undefined : parseInt(e.target.value)
                      })}
                      placeholder="+1"
                      className="w-full bg-stone-800 border border-stone-700 rounded p-1.5 text-indigo-200"
                    />
                  </div>
                  <div>
                    <label className="block text-yellow-300 text-[10px] font-sans">Initiative Bonus</label>
                    <input
                      type="number"
                      value={editingItem.initiativeBonus ?? ''}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        initiativeBonus: e.target.value === '' ? undefined : parseInt(e.target.value)
                      })}
                      placeholder="+2"
                      className="w-full bg-stone-800 border border-stone-700 rounded p-1.5 text-yellow-200"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-1.5 text-purple-300 cursor-pointer font-sans">
                    <input
                      type="checkbox"
                      checked={editingItem.isMagic || false}
                      onChange={(e) => setEditingItem({ ...editingItem, isMagic: e.target.checked })}
                      className="rounded text-purple-600"
                    />
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Magical</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-rose-400 cursor-pointer font-sans">
                    <input
                      type="checkbox"
                      checked={editingItem.isCursed || false}
                      onChange={(e) => setEditingItem({ ...editingItem, isCursed: e.target.checked })}
                      className="rounded text-rose-600"
                    />
                    <Skull className="w-3.5 h-3.5 text-rose-400" />
                    <span>Cursed</span>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Notes</label>
                <textarea
                  value={editingItem.notes || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                  rows={2}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const updatedInventory = character.inventory.map(i => i.id === editingItem.id ? editingItem : i);
                  onUpdateCharacter(recalculateCharacterAC({
                    ...character,
                    inventory: updatedInventory
                  }));
                  setEditingItem(null);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </CollapsibleBox>
  );
};
