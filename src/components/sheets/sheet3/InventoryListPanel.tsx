import React, { useState, useMemo, useEffect } from 'react';
import { CharacterData, GearItem, ItemContainer, ContainerType } from '../../../types';
import { CollapsibleBox } from '../../common/CollapsibleBox';
import { PRESET_DND_ITEMS } from '../../../data/presetItems';
import { loadCustomCompendiumEntries, saveCustomCompendiumEntry, deleteCustomCompendiumEntry, CompendiumItem } from '../../../data/compendiumData';
import { recalculateCharacterAC, getMaxAttunementSlots, getAttunedItemsCount } from '../../../utils/dndCalculations';
import { getCharacterContainers, PRESET_CONTAINERS, getContainerWeightSummaries } from '../../../utils/containerUtils';
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
  Wand2,
  FolderPlus,
  ArrowRightLeft,
  Briefcase,
  Check,
  BookOpen,
  Layers,
  Crown,
  Coins,
  Eye
} from 'lucide-react';

interface InventoryListPanelProps {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onAddItemToInventory?: (item: GearItem, targetId?: string) => void;
  onRollDamage?: (label: string, expression: string) => void;
}

export const InventoryListPanel: React.FC<InventoryListPanelProps> = ({
  character,
  onUpdateCharacter,
  onAddItemToInventory,
  onRollDamage
}) => {
  const { t } = useLanguage();
  const currentInventory = Array.isArray(character.inventory) ? character.inventory : [];
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showContainerModal, setShowContainerModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GearItem | null>(null);

  // Search & Category Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'containers' | 'weapon_melee' | 'weapon_ranged' | 'armor' | 'magic' | 'misc'>('all');
  const [selectedContainerTab, setSelectedContainerTab] = useState<string>('all');
  const [attunementWarning, setAttunementWarning] = useState<string | null>(null);
  const [openMoveDropdownId, setOpenMoveDropdownId] = useState<string | null>(null);

  // Container modal state
  const [newContainerName, setNewContainerName] = useState('');
  const [newContainerType, setNewContainerType] = useState<ContainerType>('backpack');
  const [newContainerCapacity, setNewContainerCapacity] = useState<number>(30);
  const [newContainerIsExtradimensional, setNewContainerIsExtradimensional] = useState<boolean>(false);
  const [newContainerFixedWeight, setNewContainerFixedWeight] = useState<number>(5);
  const [newContainerNotes, setNewContainerNotes] = useState('');

  // Drag-and-Drop state for manual inventory reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Add Item Modal & Catalog State
  const [addItemModalTab, setAddItemModalTab] = useState<'catalog' | 'custom'>('catalog');
  const [catalogCategory, setCatalogCategory] = useState<'all' | 'custom' | 'weapons' | 'armor' | 'magic' | 'consumables' | 'gear'>('all');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [customCompendiumList, setCustomCompendiumList] = useState<CompendiumItem[]>([]);
  const [saveToCompendiumAlso, setSaveToCompendiumAlso] = useState(true);
  const [quickAddFeedback, setQuickAddFeedback] = useState<string | null>(null);
  const [catalogItemToDelete, setCatalogItemToDelete] = useState<UnifiedCatalogItem | null>(null);

  // Highlight newly added items from AI Forge / Compendium
  const [highlightedItemName, setHighlightedItemName] = useState<string | null>(null);

  // Sync custom compendium items whenever the add item modal opens or compendium changes
  useEffect(() => {
    if (showAddItemModal) {
      setCustomCompendiumList(loadCustomCompendiumEntries());
    }
  }, [showAddItemModal]);

  useEffect(() => {
    const handleCompendiumUpdate = () => {
      setCustomCompendiumList(loadCustomCompendiumEntries());
    };
    eventBus.on('CompendiumUpdated', handleCompendiumUpdate);
    return () => {
      eventBus.off('CompendiumUpdated', handleCompendiumUpdate);
    };
  }, []);

  // Listen for ItemAdded events for this character
  useEffect(() => {
    const unsubscribe = eventBus.on('ItemAdded', (payload: { characterId: string; itemName: string; quantity?: number }) => {
      const isTarget = !payload.characterId || 
        payload.characterId === character.id || 
        (character.name && payload.characterId.toLowerCase() === character.name.trim().toLowerCase());
      if (isTarget) {
        setCategoryFilter('all');
        setSearchQuery('');
        setHighlightedItemName(payload.itemName);
        setTimeout(() => {
          setHighlightedItemName(null);
        }, 4000);
      }
    });
    return () => unsubscribe();
  }, [character.id, character.name]);

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

  // Unified Catalog Item Interface
  interface UnifiedCatalogItem {
    id: string;
    name: string;
    isCustom: boolean;
    category: 'Weapon' | 'Armor' | 'Magic' | 'Misc';
    subCategory?: string;
    weight: number;
    costGp: number;
    costDisplay?: string;
    damage?: string;
    damageType?: string;
    attackBonus?: string;
    range?: string;
    armorAc?: number;
    armorType?: string;
    acBonus?: number;
    damageReduction?: number;
    resistance?: string;
    immunity?: string;
    hpMaxBonus?: number;
    initiativeBonus?: number;
    spellDcBonus?: number;
    isMagic?: boolean;
    isCursed?: boolean;
    rarity?: string;
    requiresAttunement?: boolean;
    notes?: string;
    source?: string;
    rawItemData?: any;
  }

  // Combined Catalog Entries: Custom Compendium items + SRD Presets
  const catalogItems = useMemo<UnifiedCatalogItem[]>(() => {
    const list: UnifiedCatalogItem[] = [];

    // 1. Custom Compendium Items
    customCompendiumList
      .filter(item => item.category === 'items')
      .forEach(item => {
        const d: any = item.itemData || {};
        const costGpVal = typeof d.costGp === 'number' ? d.costGp : (parseFloat(d.cost || '0') || 0);
        const isWeapon = d.itemType === 'Weapon' || d.type === 'weapon' || !!d.weaponStats?.damage || !!d.damage;
        const isArmor = d.itemType === 'Armor' || d.type === 'armor' || d.type === 'shield' || d.armorAc !== undefined || d.armorClass !== undefined;
        const isMagic = d.isMagic || !!d.rarity || item.tags?.includes('Magic') || ['potion', 'scroll', 'wand', 'ring', 'rod', 'staff', 'wondrous'].includes(d.type);

        let cat: 'Weapon' | 'Armor' | 'Magic' | 'Misc' = 'Misc';
        if (isWeapon) cat = 'Weapon';
        else if (isArmor) cat = 'Armor';
        else if (isMagic) cat = 'Magic';

        list.push({
          id: item.id,
          name: item.name,
          isCustom: true,
          category: cat,
          subCategory: d.type || (isWeapon ? 'Weapon' : isArmor ? 'Armor' : 'Misc'),
          weight: typeof d.weight === 'number' ? d.weight : (parseFloat(d.weight || '1') || 1),
          costGp: costGpVal,
          costDisplay: d.cost || (costGpVal > 0 ? `${costGpVal} GP` : '0 GP'),
          damage: d.weaponStats?.damage || d.damage,
          damageType: d.weaponStats?.damageType || d.damageType,
          attackBonus: d.weaponStats?.attackBonus || d.attackBonus,
          range: d.weaponStats?.range || d.range,
          armorAc: d.armorAc ?? d.armorClass,
          armorType: d.armorType,
          acBonus: d.acBonus,
          damageReduction: d.damageReduction,
          resistance: d.resistance,
          immunity: d.immunity,
          hpMaxBonus: d.hpMaxBonus,
          initiativeBonus: d.initiativeBonus,
          spellDcBonus: d.spellDcBonus,
          isMagic: isMagic,
          isCursed: d.isCursed,
          rarity: d.rarity,
          requiresAttunement: d.attunement ?? d.requiresAttunement,
          notes: d.notes || item.description,
          source: item.source || 'Homebrew Compendium',
          rawItemData: d
        });
      });

    // 2. Preset SRD Items
    PRESET_DND_ITEMS.forEach((preset, idx) => {
      list.push({
        id: `srd-preset-${idx}-${preset.name.replace(/\s+/g, '-').toLowerCase()}`,
        name: preset.name,
        isCustom: false,
        category: (preset.category === 'Weapon' || preset.category === 'Armor') ? preset.category : (preset.isMagic ? 'Magic' : 'Misc'),
        subCategory: preset.subCategory || preset.category,
        weight: preset.weight || 1,
        costGp: preset.costGp || 0,
        costDisplay: `${preset.costGp || 0} GP`,
        damage: preset.weaponStats?.damage,
        damageType: preset.weaponStats?.damageType,
        attackBonus: preset.weaponStats?.attackBonus,
        range: preset.weaponStats?.range,
        armorAc: preset.armorAc,
        armorType: preset.armorType,
        isMagic: preset.isMagic,
        notes: preset.notes,
        source: 'SRD Official'
      });
    });

    return list;
  }, [customCompendiumList]);

  // Filtered Catalog Items based on category filter and search
  const filteredCatalogItems = useMemo(() => {
    return catalogItems.filter(item => {
      // Category filter
      if (catalogCategory === 'custom' && !item.isCustom) return false;
      if (catalogCategory === 'weapons' && item.category !== 'Weapon') return false;
      if (catalogCategory === 'armor' && item.category !== 'Armor') return false;
      if (catalogCategory === 'magic' && !item.isMagic && item.category !== 'Magic') return false;
      if (catalogCategory === 'consumables') {
        const sub = (item.subCategory || '').toLowerCase();
        const name = item.name.toLowerCase();
        const isConsumable = sub.includes('potion') || sub.includes('scroll') || sub.includes('consumable') || name.includes('potion') || name.includes('scroll') || name.includes('ration') || name.includes('arrow') || name.includes('bolt') || name.includes('vial');
        if (!isConsumable) return false;
      }
      if (catalogCategory === 'gear') {
        if (item.category === 'Weapon' || item.category === 'Armor' || item.category === 'Magic') return false;
      }

      // Search filter
      if (catalogSearch.trim()) {
        const q = catalogSearch.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchNotes = (item.notes || '').toLowerCase().includes(q);
        const matchDamage = (item.damage || '').toLowerCase().includes(q);
        const matchType = (item.subCategory || item.category).toLowerCase().includes(q);
        const matchSource = (item.source || '').toLowerCase().includes(q);
        if (!matchName && !matchNotes && !matchDamage && !matchType && !matchSource) return false;
      }

      return true;
    });
  }, [catalogItems, catalogCategory, catalogSearch]);

  const customCatalogItemsCount = useMemo(() => catalogItems.filter(i => i.isCustom).length, [catalogItems]);
  const weaponsCatalogCount = useMemo(() => catalogItems.filter(i => i.category === 'Weapon').length, [catalogItems]);
  const armorCatalogCount = useMemo(() => catalogItems.filter(i => i.category === 'Armor').length, [catalogItems]);
  const magicCatalogCount = useMemo(() => catalogItems.filter(i => i.isMagic || i.category === 'Magic').length, [catalogItems]);

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
    const currentInv = Array.isArray(character.inventory) ? character.inventory : [];
    const itemToDelete = currentInv.find(i => i.id === id);
    const updated = currentInv.filter(i => i.id !== id);
    
    onUpdateCharacter(recalculateCharacterAC({
      ...character,
      inventory: updated
    }));

    if (itemToDelete) {
      eventBus.emit('ItemRemoved', {
        characterId: character.id,
        itemName: itemToDelete.name,
        quantity: itemToDelete.quantity || 1
      });
    }
  };

  const handleAddCatalogItem = (catalogItem: UnifiedCatalogItem, qty: number = 1) => {
    const hasWeaponData = catalogItem.category === 'Weapon' || !!catalogItem.damage || !!catalogItem.attackBonus || !!catalogItem.range;
    const weaponStats = hasWeaponData ? {
      damage: catalogItem.damage,
      damageType: catalogItem.damageType,
      attackBonus: catalogItem.attackBonus,
      range: catalogItem.range,
      notes: catalogItem.rawItemData?.weaponStats?.notes || (catalogItem.rawItemData?.properties ? catalogItem.rawItemData.properties.join(', ') : catalogItem.notes)
    } : undefined;

    const determinedItemType: 'Weapon' | 'Armor' | 'Misc' = 
      catalogItem.category === 'Weapon' || catalogItem.rawItemData?.type === 'weapon' ? 'Weapon' :
      catalogItem.category === 'Armor' || catalogItem.rawItemData?.type === 'armor' || catalogItem.rawItemData?.type === 'shield' ? 'Armor' : 'Misc';

    const newGearItem: GearItem = {
      id: 'gear-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: catalogItem.name,
      quantity: Math.max(1, qty || 1),
      weight: catalogItem.weight ?? 1,
      costGp: catalogItem.costGp ?? 0,
      equipped: false,
      stored: false,
      notes: catalogItem.notes || catalogItem.rawItemData?.notes || undefined,
      itemType: determinedItemType,
      armorAc: catalogItem.armorAc,
      armorType: catalogItem.armorType as any,
      acBonus: catalogItem.acBonus,
      damageReduction: catalogItem.damageReduction,
      resistance: catalogItem.resistance,
      immunity: catalogItem.immunity,
      hpMaxBonus: catalogItem.hpMaxBonus,
      initiativeBonus: catalogItem.initiativeBonus,
      spellDcBonus: catalogItem.spellDcBonus,
      isMagic: catalogItem.isMagic || undefined,
      isCursed: catalogItem.isCursed || undefined,
      requiresAttunement: catalogItem.requiresAttunement || undefined,
      weaponStats: weaponStats
    };

    if (onAddItemToInventory) {
      onAddItemToInventory(newGearItem, character.id);
    } else {
      const currentInventory = Array.isArray(character.inventory) ? character.inventory : [];
      const updatedInventory = [newGearItem, ...currentInventory];

      const updatedChar = recalculateCharacterAC({
        ...character,
        inventory: updatedInventory
      });

      onUpdateCharacter(updatedChar);

      eventBus.emit('ItemAdded', {
        characterId: character.id,
        itemName: newGearItem.name,
        quantity: newGearItem.quantity || 1
      });
    }

    setQuickAddFeedback(`Added "${newGearItem.name}" to ${character.name || 'Character'}'s inventory!`);
    setTimeout(() => setQuickAddFeedback(null), 2500);
  };

  const handleDeleteCustomCatalogItem = (item: UnifiedCatalogItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.isCustom) return;
    setCatalogItemToDelete(item);
  };

  const confirmDeleteCatalogItem = () => {
    if (!catalogItemToDelete) return;
    const updated = deleteCustomCompendiumEntry(catalogItemToDelete.id, catalogItemToDelete.name, 'items');
    setCustomCompendiumList(updated);
    eventBus.emit('CompendiumUpdated', { id: catalogItemToDelete.id, name: catalogItemToDelete.name });
    setQuickAddFeedback(`Deleted "${catalogItemToDelete.name}" from Compendium`);
    setTimeout(() => setQuickAddFeedback(null), 2500);
    setCatalogItemToDelete(null);
  };

  const handleCustomizeCatalogItem = (item: UnifiedCatalogItem) => {
    setNewItemName(item.name);
    setNewItemQty(1);
    setNewItemWeight(item.weight ?? 1);
    setNewItemCost(item.costGp ?? 0);
    setNewItemNotes(item.notes || '');
    setNewItemType(item.category === 'Weapon' || item.category === 'Armor' ? item.category : 'Misc');
    setNewItemArmorAc(item.armorAc ?? '');
    setNewItemAcBonus(item.acBonus ?? '');
    setNewItemArmorType((item.armorType as any) || 'Light');
    setNewItemWeaponDamage(item.damage || '');
    setNewItemWeaponDmgType(item.damageType || 'Slashing');
    setNewItemWeaponAtkBonus(item.attackBonus || '');
    setNewItemWeaponRange(item.range || 'Melee');
    setNewItemDamageReduction(item.damageReduction ?? '');
    setNewItemResistance(item.resistance || '');
    setNewItemImmunity(item.immunity || '');
    setNewItemHpBonus(item.hpMaxBonus ?? '');
    setNewItemInitiativeBonus(item.initiativeBonus ?? '');
    setNewItemSpellDcBonus(item.spellDcBonus ?? '');
    setNewItemIsMagic(!!item.isMagic);
    setNewItemIsCursed(!!item.isCursed);
    if (item.damageReduction || item.resistance || item.immunity || item.hpMaxBonus || item.spellDcBonus || item.initiativeBonus) {
      setShowAdvancedStats(true);
    }
    setAddItemModalTab('custom');
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

    if (onAddItemToInventory) {
      onAddItemToInventory(newItem, character.id);
    } else {
      const currentInventory = Array.isArray(character.inventory) ? character.inventory : [];
      const updatedChar = recalculateCharacterAC({
        ...character,
        inventory: [newItem, ...currentInventory]
      });

      onUpdateCharacter(updatedChar);

      eventBus.emit('ItemAdded', {
        characterId: character.id,
        itemName: newItem.name,
        quantity: newItem.quantity || 1
      });
    }

    if (saveToCompendiumAlso) {
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
        setCustomCompendiumList(loadCustomCompendiumEntries());
      } catch (e) {
        console.error('Failed to auto-add item to compendium', e);
      }
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

    if (onAddItemToInventory) {
      onAddItemToInventory(newItem, character.id);
    } else {
      const currentInventory = Array.isArray(character.inventory) ? character.inventory : [];
      onUpdateCharacter(recalculateCharacterAC({
        ...character,
        inventory: [newItem, ...currentInventory]
      }));

      eventBus.emit('ItemAdded', {
        characterId: character.id,
        itemName: newItem.name,
        quantity: newItem.quantity || 1
      });
    }

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

  const characterContainers = getCharacterContainers(character);
  const containerSummaries = getContainerWeightSummaries(character);

  const handleMoveItemToContainer = (itemId: string, targetContainerId?: string, isEquipped?: boolean, isStored?: boolean) => {
    const updatedInventory = character.inventory.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          containerId: isEquipped || isStored ? undefined : targetContainerId,
          equipped: isEquipped ?? (targetContainerId ? false : item.equipped),
          stored: isStored ?? (targetContainerId ? false : (isEquipped ? false : item.stored))
        };
      }
      return item;
    });

    onUpdateCharacter(recalculateCharacterAC({
      ...character,
      inventory: updatedInventory
    }));
    setOpenMoveDropdownId(null);
  };

  const handleAddContainer = (preset?: Omit<ItemContainer, 'id'>) => {
    const newCont: ItemContainer = preset ? {
      ...preset,
      id: `container-${Date.now()}`
    } : {
      id: `container-${Date.now()}`,
      name: newContainerName || 'Custom Container',
      type: newContainerType,
      capacityLbs: newContainerCapacity || 30,
      isExtradimensional: newContainerIsExtradimensional,
      fixedWeightLbs: newContainerFixedWeight || 5,
      notes: newContainerNotes
    };

    const updatedContainers = [...(character.containers || []), newCont];
    onUpdateCharacter({
      ...character,
      containers: updatedContainers
    });

    setNewContainerName('');
    setNewContainerNotes('');
  };

  const handleDeleteContainer = (containerId: string) => {
    // Unassign items inside this container
    const updatedInventory = character.inventory.map(item => {
      if (item.containerId === containerId) {
        return { ...item, containerId: undefined };
      }
      return item;
    });

    const updatedContainers = (character.containers || []).filter(c => c.id !== containerId);
    onUpdateCharacter({
      ...character,
      containers: updatedContainers,
      inventory: updatedInventory
    });
  };

  // Filtered Inventory List
  const filteredInventoryWithIndices = currentInventory.map((item, originalIndex) => ({
    item,
    originalIndex
  })).filter(({ item }) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (item.name || '').toLowerCase().includes(q);
      const matchNotes = (item.notes || '').toLowerCase().includes(q);
      const matchType = (item.itemType || '').toLowerCase().includes(q);
      if (!matchName && !matchNotes && !matchType) return false;
    }

    if (categoryFilter === 'all' || categoryFilter === 'containers') return true;
    const subtype = getItemSubtype(item);
    return subtype === categoryFilter;
  });

  const countAll = currentInventory.length;
  const countContainers = characterContainers.length;
  const countMelee = currentInventory.filter(i => getItemSubtype(i) === 'weapon_melee').length;
  const countRanged = currentInventory.filter(i => getItemSubtype(i) === 'weapon_ranged').length;
  const countArmor = currentInventory.filter(i => getItemSubtype(i) === 'armor').length;
  const countMagic = currentInventory.filter(i => getItemSubtype(i) === 'magic').length;
  const countMisc = currentInventory.filter(i => getItemSubtype(i) === 'misc').length;

  return (
    <CollapsibleBox
      title={t('inventory.title', 'Equipment & Inventory')}
      icon={<Package className="w-5 h-5 text-amber-500" />}
      storageKey="sheet3_equipment"
      headerExtra={
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowContainerModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-xl text-xs font-bold transition shadow-sm"
            title="Manage Backpacks, Bags of Holding, and Stash Chests"
          >
            <Briefcase className="w-3.5 h-3.5 text-amber-400" />
            <span>Bags & Containers ({countContainers})</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAddItemModal(true);
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-md"
          >
            <Plus className="w-4 h-4" /> {t('inventory.addItem', '+ Add Item')}
          </button>
        </div>
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
              onClick={() => setCategoryFilter('containers')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1.5 ${
                categoryFilter === 'containers'
                  ? 'bg-purple-700 text-white shadow'
                  : 'bg-stone-900 text-purple-400 hover:text-purple-300 border border-stone-800'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-purple-400" />
              <span>By Bag / Container ({countContainers})</span>
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
        {categoryFilter === 'containers' ? (
          <div className="space-y-4">
            {/* Top Bar with Manage Containers button */}
            <div className="flex items-center justify-between bg-stone-900/60 p-3 rounded-xl border border-stone-800">
              <div>
                <h4 className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-amber-400" />
                  Bags & Containers Organization
                </h4>
                <p className="text-[11px] text-stone-400">
                  Organize your gear into backpacks, pouches, or extradimensional spaces like Bags of Holding.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowContainerModal(true)}
                className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shrink-0"
              >
                <FolderPlus className="w-4 h-4" />
                <span>+ Add / Manage Bags</span>
              </button>
            </div>

            {/* Container Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {containerSummaries.containers.map(summary => {
                const isExtradimensional = summary.container.isExtradimensional;
                const isOverCapacity = summary.isOverCapacity;
                const percentFull = Math.min(100, Math.round((summary.currentWeightLbs / Math.max(1, summary.container.capacityLbs)) * 100));
                const remainingCap = summary.container.capacityLbs - summary.currentWeightLbs;

                return (
                  <div
                    key={summary.container.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isExtradimensional
                        ? 'bg-purple-950/20 border-purple-800/40 hover:border-purple-700/60'
                        : isOverCapacity
                          ? 'bg-rose-950/20 border-rose-800/60'
                          : 'bg-stone-900/50 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-stone-200">{summary.container.name}</span>
                          {isExtradimensional && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700/60 text-[9px] font-bold">
                              ✨ Extradimensional (0 lbs load)
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-stone-400">
                          {summary.items.length} item{summary.items.length === 1 ? '' : 's'} enclosed
                          {summary.container.notes ? ` • ${summary.container.notes}` : ''}
                        </p>
                      </div>

                      <div className="text-right font-mono text-xs">
                        <span className={`font-bold ${isOverCapacity ? 'text-rose-400' : 'text-amber-300'}`}>
                          {summary.currentWeightLbs.toFixed(1)} / {summary.container.capacityLbs} lbs
                        </span>
                        <div className="text-[9px] text-stone-500">
                          {remainingCap >= 0 ? `${remainingCap.toFixed(1)} lbs free` : `Over by ${Math.abs(remainingCap).toFixed(1)} lbs!`}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-stone-950 rounded-full overflow-hidden mb-3 border border-stone-800">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOverCapacity
                            ? 'bg-rose-500'
                            : isExtradimensional
                              ? 'bg-purple-500'
                              : percentFull > 85
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percentFull}%` }}
                      />
                    </div>

                    {/* Items List Inside Container */}
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {summary.items.length === 0 ? (
                        <p className="text-[10px] text-stone-500 italic text-center py-2">
                          Empty bag. Use the location dropdown on any item to place it in here.
                        </p>
                      ) : (
                        summary.items.map(item => (
                          <div
                            key={item.id}
                            className="p-1.5 rounded-lg bg-stone-950/70 border border-stone-800/80 flex items-center justify-between text-xs font-sans gap-2"
                          >
                            <div className="min-w-0 flex items-center gap-1.5 truncate">
                              <span className="text-amber-200 text-xs font-medium truncate">{item.name}</span>
                              {item.quantity && item.quantity > 1 && (
                                <span className="text-[10px] text-stone-400 font-mono">({item.quantity}x)</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                              <span className="text-stone-400">
                                {((item.weight || 0) * (item.quantity || 1)).toFixed(1)} lbs
                              </span>
                              <button
                                type="button"
                                onClick={() => handleMoveItemToContainer(item.id, undefined, false, false)}
                                className="text-stone-500 hover:text-amber-400 p-0.5"
                                title="Move out of bag to main load"
                              >
                                <ArrowRightLeft className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Items Not In Any Container (Equipped / Main Load / Stored) */}
              <div className="p-3.5 rounded-xl border bg-stone-900/40 border-stone-800">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h5 className="font-bold text-xs text-amber-200 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-amber-400" />
                      Main Carried Load (Directly on Person)
                    </h5>
                    <p className="text-[10px] text-stone-400">Items carried directly on harness, bandolier, or belt</p>
                  </div>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {character.inventory.filter(i => !i.containerId && !i.stored).length === 0 ? (
                    <p className="text-[10px] text-stone-500 italic text-center py-2">No unbagged items.</p>
                  ) : (
                    character.inventory.filter(i => !i.containerId && !i.stored).map(item => (
                      <div
                        key={item.id}
                        className="p-1.5 rounded-lg bg-stone-950/70 border border-stone-800/80 flex items-center justify-between text-xs font-sans gap-2"
                      >
                        <div className="min-w-0 flex items-center gap-1.5 truncate">
                          {item.equipped && (
                            <span className="text-[9px] px-1 py-0.2 bg-emerald-950 text-emerald-300 border border-emerald-700/60 rounded">
                              EQ
                            </span>
                          )}
                          <span className="text-amber-200 text-xs font-medium truncate">{item.name}</span>
                          {item.quantity && item.quantity > 1 && (
                            <span className="text-[10px] text-stone-400 font-mono">({item.quantity}x)</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                          <span className="text-stone-400">
                            {((item.weight || 0) * (item.quantity || 1)).toFixed(1)} lbs
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Stash at Camp */}
              <div className="p-3.5 rounded-xl border bg-blue-950/10 border-blue-900/30">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h5 className="font-bold text-xs text-blue-300 flex items-center gap-1.5">
                      <Archive className="w-4 h-4 text-blue-400" />
                      Camp Vault & Storage (0 lbs carried)
                    </h5>
                    <p className="text-[10px] text-stone-400">Items stored in stronghold or vault</p>
                  </div>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {character.inventory.filter(i => i.stored).length === 0 ? (
                    <p className="text-[10px] text-stone-500 italic text-center py-2">No stored items.</p>
                  ) : (
                    character.inventory.filter(i => i.stored).map(item => (
                      <div
                        key={item.id}
                        className="p-1.5 rounded-lg bg-stone-950/70 border border-stone-800/80 flex items-center justify-between text-xs font-sans gap-2"
                      >
                        <span className="text-blue-200 text-xs font-medium truncate">{item.name}</span>
                        <span className="text-stone-400 font-mono text-[11px]">
                          {((item.weight || 0) * (item.quantity || 1)).toFixed(1)} lbs
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : character.inventory.length === 0 ? (
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
                    highlightedItemName === item.name
                      ? 'bg-emerald-950/60 border-emerald-400 ring-2 ring-emerald-500/80 shadow-lg shadow-emerald-950/50 animate-pulse'
                      : draggedIndex === index
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

                  {/* Right: Container Assignment, Quantity, Weight, Value, Actions */}
                  <div className="flex items-center gap-2.5 shrink-0 font-mono text-xs flex-wrap sm:flex-nowrap">
                    {/* Quick Container Location Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMoveDropdownId(openMoveDropdownId === item.id ? null : item.id);
                        }}
                        className={`px-2 py-0.5 rounded border text-[10px] flex items-center gap-1 transition ${
                          item.containerId
                            ? 'bg-purple-950/80 text-purple-200 border-purple-700/60 hover:bg-purple-900'
                            : item.equipped
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50'
                              : item.stored
                                ? 'bg-blue-950/60 text-blue-300 border-blue-700/50'
                                : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                        }`}
                        title="Change item bag / location"
                      >
                        <span className="truncate max-w-[100px]">
                          {item.containerId
                            ? (characterContainers.find(c => c.id === item.containerId)?.name || 'In Bag')
                            : item.equipped
                              ? '⚔️ Equipped'
                              : item.stored
                                ? '📦 Stored'
                                : '🎒 Main Bag'}
                        </span>
                        <ChevronDown className="w-3 h-3 text-stone-400 shrink-0" />
                      </button>

                      {openMoveDropdownId === item.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 mt-1 z-40 w-52 bg-stone-900 border border-stone-700 rounded-xl shadow-2xl p-1.5 space-y-1 text-[11px] font-sans"
                        >
                          <div className="text-[9px] font-bold uppercase text-stone-500 px-2 py-0.5 border-b border-stone-800">
                            Move Item Location
                          </div>
                          <button
                            type="button"
                            onClick={() => handleMoveItemToContainer(item.id, undefined, true, false)}
                            className="w-full text-left px-2 py-1 rounded hover:bg-emerald-950/60 text-emerald-300 flex items-center justify-between"
                          >
                            <span>⚔️ Equipped on Body</span>
                            {item.equipped && <CheckSquare className="w-3 h-3 text-emerald-400" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveItemToContainer(item.id, undefined, false, false)}
                            className="w-full text-left px-2 py-1 rounded hover:bg-stone-800 text-stone-200 flex items-center justify-between"
                          >
                            <span>🎒 Main Inventory Load</span>
                            {!item.containerId && !item.equipped && !item.stored && <CheckSquare className="w-3 h-3 text-amber-400" />}
                          </button>
                          {characterContainers.map(cont => (
                            <button
                              key={cont.id}
                              type="button"
                              onClick={() => handleMoveItemToContainer(item.id, cont.id, false, false)}
                              className={`w-full text-left px-2 py-1 rounded hover:bg-stone-800 flex items-center justify-between ${
                                cont.isExtradimensional ? 'text-purple-300' : 'text-stone-300'
                              }`}
                            >
                              <span className="truncate">{cont.name}</span>
                              {item.containerId === cont.id && <CheckSquare className="w-3 h-3 text-purple-400" />}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleMoveItemToContainer(item.id, undefined, false, true)}
                            className="w-full text-left px-2 py-1 rounded hover:bg-blue-950/60 text-blue-300 flex items-center justify-between border-t border-stone-800 pt-1"
                          >
                            <span>📦 Stored (Camp / Vault)</span>
                            {item.stored && <CheckSquare className="w-3 h-3 text-blue-400" />}
                          </button>
                        </div>
                      )}
                    </div>

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

      {/* MODAL: Add New Item / Unified Compendium & SRD Catalog Picker */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-stone-900 border border-amber-600/50 rounded-2xl p-4 sm:p-5 max-w-3xl w-full shadow-2xl text-stone-100 space-y-3 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-600/50 flex items-center justify-center">
                  <Package className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-serif font-bold text-amber-300">
                    Add Gear, Weapons & Magic Items
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Browse official SRD gear, your custom homebrew compendium, or craft a custom item.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { resetNewItemForm(); setShowAddItemModal(false); }}
                className="text-stone-400 hover:text-stone-200 transition p-1.5 rounded-lg hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Add Feedback Toast */}
            {quickAddFeedback && (
              <div className="bg-emerald-950/90 border border-emerald-500/70 text-emerald-200 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 shadow-lg animate-pulse shrink-0">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">{quickAddFeedback}</span>
              </div>
            )}

            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-stone-800 pb-2 shrink-0">
              <button
                type="button"
                onClick={() => setAddItemModalTab('catalog')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  addItemModalTab === 'catalog'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Browse Catalog & Compendium</span>
                <span className="px-1.5 py-0.2 bg-black/40 rounded-full text-[10px] font-mono">
                  {catalogItems.length}
                </span>
                {customCatalogItemsCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-400 text-stone-950 rounded-full text-[10px] font-bold">
                    {customCatalogItemsCount} Homebrew
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setAddItemModalTab('custom')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  addItemModalTab === 'custom'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Craft Custom Item</span>
              </button>
            </div>

            {/* TAB 1: BROWSE CATALOG & COMPENDIUM */}
            {addItemModalTab === 'catalog' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-3">
                {/* Search & Category Filter Bar */}
                <div className="space-y-2 shrink-0">
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      placeholder="Search items by name, properties, damage type, source..."
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-8 py-2 text-xs text-stone-100 placeholder-stone-500 focus:border-amber-500 focus:outline-none"
                    />
                    {catalogSearch && (
                      <button
                        type="button"
                        onClick={() => setCatalogSearch('')}
                        className="absolute right-2.5 text-stone-500 hover:text-stone-300"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setCatalogCategory('all')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${
                        catalogCategory === 'all'
                          ? 'bg-amber-700 text-white'
                          : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
                      }`}
                    >
                      All ({catalogItems.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setCatalogCategory('custom')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                        catalogCategory === 'custom'
                          ? 'bg-amber-500 text-stone-950 shadow-sm'
                          : 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/60 border border-amber-600/40'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Homebrew ({customCatalogItemsCount})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCatalogCategory('weapons')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap flex items-center gap-1 ${
                        catalogCategory === 'weapons'
                          ? 'bg-rose-700 text-white'
                          : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
                      }`}
                    >
                      <Swords className="w-3 h-3 text-rose-400" />
                      <span>Weapons ({weaponsCatalogCount})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCatalogCategory('armor')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap flex items-center gap-1 ${
                        catalogCategory === 'armor'
                          ? 'bg-blue-700 text-white'
                          : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
                      }`}
                    >
                      <Shield className="w-3 h-3 text-blue-400" />
                      <span>Armor & Shields ({armorCatalogCount})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCatalogCategory('magic')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap flex items-center gap-1 ${
                        catalogCategory === 'magic'
                          ? 'bg-purple-700 text-white'
                          : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      <span>Magic Items ({magicCatalogCount})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCatalogCategory('consumables')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap flex items-center gap-1 ${
                        catalogCategory === 'consumables'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
                      }`}
                    >
                      <span>🧪 Potions & Consumables</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCatalogCategory('gear')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap flex items-center gap-1 ${
                        catalogCategory === 'gear'
                          ? 'bg-stone-700 text-white'
                          : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
                      }`}
                    >
                      <Package className="w-3 h-3 text-stone-400" />
                      <span>Adventuring Gear</span>
                    </button>
                  </div>
                </div>

                {/* Catalog Items Scroll List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {filteredCatalogItems.length === 0 ? (
                    <div className="p-8 text-center bg-stone-950/60 rounded-xl border border-stone-800 space-y-2">
                      <Package className="w-8 h-8 text-stone-600 mx-auto" />
                      <p className="text-stone-300 font-semibold text-xs">No matching items found</p>
                      <p className="text-stone-500 text-[11px]">
                        {catalogCategory === 'custom'
                          ? 'You have not created any custom items in the Homebrew Forge or Compendium yet.'
                          : 'Try adjusting your search query or switch to "Craft Custom Item" to make a new one.'}
                      </p>
                      {catalogCategory === 'custom' && (
                        <button
                          type="button"
                          onClick={() => setAddItemModalTab('custom')}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition"
                        >
                          <Plus className="w-3.5 h-3.5" /> Craft Custom Item Now
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredCatalogItems.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          item.isCustom
                            ? 'bg-amber-950/20 border-amber-700/50 hover:border-amber-500/80'
                            : 'bg-stone-950 border-stone-800 hover:border-stone-700'
                        }`}
                      >
                        {/* Item Details */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-stone-100 text-xs sm:text-sm">
                              {item.name}
                            </span>

                            {item.isCustom ? (
                              <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-500/50 rounded text-[10px] font-bold flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-400" /> Homebrew
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-stone-800 text-stone-400 rounded text-[10px] font-mono">
                                SRD
                              </span>
                            )}

                            {item.rarity && (
                              <span className="px-1.5 py-0.5 bg-purple-950/80 text-purple-300 border border-purple-700/50 rounded text-[10px] capitalize">
                                {item.rarity}
                              </span>
                            )}

                            {item.requiresAttunement && (
                              <span className="px-1.5 py-0.5 bg-indigo-950/80 text-indigo-300 border border-indigo-700/50 rounded text-[10px]">
                                Attunement
                              </span>
                            )}
                          </div>

                          {/* Stats Chips */}
                          <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
                            <span className="text-stone-400">
                              ⚖️ {item.weight} lbs
                            </span>
                            <span className="text-amber-400 font-bold">
                              💰 {item.costDisplay || `${item.costGp} GP`}
                            </span>

                            {item.damage && (
                              <span className="text-rose-300 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/50 font-bold">
                                ⚔️ {item.damage} {item.damageType || ''}
                              </span>
                            )}

                            {item.armorAc !== undefined && (
                              <span className="text-blue-300 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/50 font-bold">
                                🛡️ {item.armorAc} AC ({item.armorType || 'Armor'})
                              </span>
                            )}

                            {item.acBonus !== undefined && item.acBonus > 0 && (
                              <span className="text-blue-300 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/50 font-bold">
                                +{item.acBonus} AC
                              </span>
                            )}

                            {item.damageReduction !== undefined && item.damageReduction > 0 && (
                              <span className="text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-700/50 font-bold">
                                🛡️ DR {item.damageReduction}
                              </span>
                            )}

                            {item.resistance && (
                              <span className="text-orange-300 bg-orange-950/60 px-1.5 py-0.5 rounded border border-orange-800/50">
                                🔥 Resist: {item.resistance}
                              </span>
                            )}

                            {item.hpMaxBonus !== undefined && item.hpMaxBonus !== 0 && (
                              <span className="text-red-300 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800/50">
                                ❤️ {item.hpMaxBonus > 0 ? `+${item.hpMaxBonus}` : item.hpMaxBonus} HP
                              </span>
                            )}
                          </div>

                          {/* Notes/Description */}
                          {item.notes && (
                            <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">
                              {item.notes}
                            </p>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-800">
                          {item.isCustom && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteCustomCatalogItem(item, e)}
                              className="p-1.5 bg-stone-850 hover:bg-rose-950/50 text-stone-500 hover:text-rose-400 rounded-xl text-xs transition border border-stone-800 hover:border-rose-900/50 flex items-center justify-center cursor-pointer"
                              title="Delete from custom compendium"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleCustomizeCatalogItem(item)}
                            className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-stone-100 rounded-xl text-xs font-semibold transition border border-stone-700 flex items-center gap-1 cursor-pointer"
                            title="Customize this item before adding"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Customize</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAddCatalogItem(item, 1)}
                            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: CRAFT CUSTOM ITEM */}
            {addItemModalTab === 'custom' && (
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

                {/* Damage Reduction, Resistances & Magical Stats */}
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

                {/* Save to Compendium checkbox */}
                <div className="p-2.5 bg-stone-950/80 border border-stone-800 rounded-xl flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-stone-300">
                    <input
                      type="checkbox"
                      checked={saveToCompendiumAlso}
                      onChange={(e) => setSaveToCompendiumAlso(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-0"
                    />
                    <div>
                      <span className="font-semibold text-xs text-amber-200 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        Save to Compendium
                      </span>
                      <span className="text-[10px] text-stone-500 block">
                        Stores this item in your custom compendium for all characters
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex justify-between items-center pt-3 border-t border-stone-800 shrink-0">
              <div className="text-[11px] text-stone-500">
                {addItemModalTab === 'catalog' ? (
                  <span>Showing {filteredCatalogItems.length} items in catalog</span>
                ) : (
                  <span>Custom item will be added to {character.name || 'character'}'s inventory</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { resetNewItemForm(); setShowAddItemModal(false); }}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold transition"
                >
                  Close
                </button>
                {addItemModalTab === 'custom' && (
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg transition"
                  >
                    Save & Add Custom Item
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP CONFIRMATION FOR DELETING CUSTOM CATALOG ITEM */}
      {catalogItemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-950 border border-stone-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-stone-100">Delete Custom Item?</h3>
                <p className="text-xs text-stone-400 font-mono">This will remove the item from your compendium catalog.</p>
              </div>
            </div>

            <div className="p-3.5 bg-stone-900/80 rounded-2xl border border-stone-800/80 space-y-1">
              <div className="text-sm font-bold text-amber-300 font-serif">{catalogItemToDelete.name}</div>
              <div className="text-xs text-stone-400 font-mono">
                {catalogItemToDelete.category} • {catalogItemToDelete.weight || 0} lbs • {catalogItemToDelete.costGp || 0} GP
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCatalogItemToDelete(null)}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCatalogItem}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-rose-950/40 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Item</span>
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

            <div className="flex items-center justify-between pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => {
                  handleDeleteItem(editingItem.id);
                  setEditingItem(null);
                }}
                className="px-3 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Item
              </button>
              <div className="flex items-center gap-2">
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
                    const currentInv = Array.isArray(character.inventory) ? character.inventory : [];
                    const updatedInventory = currentInv.map(i => i.id === editingItem.id ? editingItem : i);
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
        </div>
      )}

      {/* MODAL: Manage Bags & Item Containers */}
      {showContainerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-stone-800 bg-stone-950">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-stone-100 text-sm">
                  Manage Bags & Adventuring Containers
                </h3>
              </div>
              <button
                onClick={() => setShowContainerModal(false)}
                className="text-stone-400 hover:text-stone-200 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Presets Grid */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                  Quick Add Standard Container
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESET_CONTAINERS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddContainer(preset)}
                      className="p-2.5 rounded-xl border border-stone-800 bg-stone-950/80 hover:border-amber-600/60 hover:bg-stone-800 text-left transition space-y-1 group"
                    >
                      <div className="font-bold text-stone-200 text-xs group-hover:text-amber-300 flex items-center justify-between">
                        <span>{preset.name}</span>
                        <Plus className="w-3.5 h-3.5 text-stone-500 group-hover:text-amber-400" />
                      </div>
                      <div className="text-[10px] text-stone-400 flex items-center justify-between font-mono">
                        <span>Cap: {preset.capacityLbs} lbs</span>
                        {preset.isExtradimensional && (
                          <span className="text-purple-300 font-sans font-bold">✨ 0 lb Load</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Container Form */}
              <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 space-y-3">
                <span className="text-[11px] font-bold text-stone-300 uppercase tracking-wider block">
                  Create Custom Container / Bag
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-400 mb-1 font-semibold">Container Name</label>
                    <input
                      type="text"
                      value={newContainerName}
                      onChange={(e) => setNewContainerName(e.target.value)}
                      placeholder="e.g. Leather Saddlebag, Secret Pouch"
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1 font-semibold">Container Type</label>
                    <select
                      value={newContainerType}
                      onChange={(e) => setNewContainerType(e.target.value as ContainerType)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100 focus:border-amber-500 focus:outline-none"
                    >
                      <option value="backpack">Backpack</option>
                      <option value="pouch">Pouch / Belt Pouch</option>
                      <option value="sack">Sack / Large Bag</option>
                      <option value="chest">Chest / Stash Box</option>
                      <option value="quiver">Quiver / Case</option>
                      <option value="bag_of_holding">Bag of Holding (Extradimensional)</option>
                      <option value="handy_haversack">Handy Haversack (Extradimensional)</option>
                      <option value="portable_hole">Portable Hole (Extradimensional)</option>
                      <option value="custom">Other Custom</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-400 mb-1 font-semibold">Max Capacity (lbs)</label>
                    <input
                      type="number"
                      value={newContainerCapacity}
                      onChange={(e) => setNewContainerCapacity(Number(e.target.value) || 0)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-amber-300 font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1 font-semibold">Empty Weight (lbs)</label>
                    <input
                      type="number"
                      value={newContainerFixedWeight}
                      onChange={(e) => setNewContainerFixedWeight(Number(e.target.value) || 0)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-amber-300 font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-2 text-purple-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newContainerIsExtradimensional}
                      onChange={(e) => setNewContainerIsExtradimensional(e.target.checked)}
                      className="rounded text-purple-600"
                    />
                    <span className="font-semibold">✨ Extradimensional Space</span>
                    <span className="text-[10px] text-stone-400">(Contents do not add weight to character)</span>
                  </label>
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Notes / Description</label>
                  <input
                    type="text"
                    value={newContainerNotes}
                    onChange={(e) => setNewContainerNotes(e.target.value)}
                    placeholder="e.g. Strapped to horse, locked with dc 15 key"
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleAddContainer()}
                  className="w-full py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" /> Add Custom Container
                </button>
              </div>

              {/* Existing Containers List */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                  Current Containers ({characterContainers.length})
                </span>

                <div className="space-y-2">
                  {characterContainers.map(container => {
                    const itemCount = character.inventory.filter(i => i.containerId === container.id).length;
                    return (
                      <div
                        key={container.id}
                        className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-200">{container.name}</span>
                            {container.isExtradimensional && (
                              <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700/60 text-[9px] font-bold">
                                ✨ Extradimensional
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                            Capacity: {container.capacityLbs} lbs • Holds {itemCount} item{itemCount === 1 ? '' : 's'}
                            {container.notes ? ` • ${container.notes}` : ''}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteContainer(container.id)}
                          className="p-1.5 text-stone-500 hover:text-rose-400 transition rounded-lg hover:bg-stone-800"
                          title="Remove Container"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-stone-800 bg-stone-950 flex justify-end">
              <button
                type="button"
                onClick={() => setShowContainerModal(false)}
                className="px-5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl font-bold transition text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </CollapsibleBox>
  );
};
