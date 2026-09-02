import React, { useState, useMemo, useEffect } from 'react';
import { CharacterData, Spell, Feat, ClassFeature, GearItem, RuleEdition } from '../../types';
import { getAbilityModifier, formatModifier, recalculateCharacterAC } from '../../utils/dndCalculations';
import { eventBus } from '../../events/eventBus';
import { isDuplicateSpell } from '../../utils/spellUtils';
import { getMonsterPortraitUrl } from '../../data/monsterPortraits';
import { systemRegistry } from '../../systems';
import { useLanguage } from '../../i18n/LanguageContext';
import { HomebrewForgeModal } from '../compendium/HomebrewForgeModal';
import {
  CompendiumItem,
  CompendiumCategory,
  getInitialBaseCompendium,
  loadCustomCompendiumEntries,
  saveCustomCompendiumEntry,
  deleteCustomCompendiumEntry
} from '../../data/compendiumData';
import {
  Search,
  Plus,
  Trash2,
  BookOpen,
  Filter,
  Sparkles,
  Shield,
  Wand2,
  Sword,
  Scroll,
  Layers,
  Dices,
  Check,
  Zap,
  Info,
  X,
  UserPlus,
  ExternalLink,
  ChevronRight,
  Eye,
  Crown,
  Tag,
  Download,
  Upload
} from 'lucide-react';

interface Sheet7CompendiumProps {
  activeCharacter?: CharacterData;
  onUpdateCharacter?: (updated: CharacterData) => void;
  onAddItemToInventory?: (item: GearItem, targetId?: string) => void;
  onAddMonsterToRoster?: (monster: CharacterData) => void;
  enabledSystems?: RuleEdition[];
}

export const Sheet7Compendium: React.FC<Sheet7CompendiumProps> = ({
  activeCharacter,
  onUpdateCharacter,
  onAddItemToInventory,
  onAddMonsterToRoster,
  enabledSystems
}) => {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<CompendiumCategory | 'all'>('all');
  const [selectedSystem, setSelectedSystem] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<CompendiumItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<CompendiumItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Custom entries stored in localStorage
  const [customEntries, setCustomEntries] = useState<CompendiumItem[]>(() => loadCustomCompendiumEntries());

  useEffect(() => {
    const handleCompendiumUpdate = () => {
      setCustomEntries(loadCustomCompendiumEntries());
    };
    eventBus.on('CompendiumUpdated', handleCompendiumUpdate);
    return () => {
      eventBus.off('CompendiumUpdated', handleCompendiumUpdate);
    };
  }, []);

  // Base SRD entries memoized once
  const baseEntries = useMemo(() => getInitialBaseCompendium(), []);

  // Combine Base SRD + Custom entries with strict deduplication
  const allCompendiumItems = useMemo(() => {
    const validCategories: CompendiumCategory[] = ['monsters', 'spells', 'items', 'classes', 'races', 'feats', 'features', 'skills'];
    const sanitizedCustom = customEntries.filter((item) => item && item.id && item.name && validCategories.includes(item.category));
    
    const combined = [...sanitizedCustom, ...baseEntries];
    const seenIds = new Set<string>();
    const seenKeys = new Set<string>();
    const result: CompendiumItem[] = [];

    for (const item of combined) {
      if (!item || !item.id || !item.name) continue;
      const nameKey = `${item.name.trim().toLowerCase()}_${item.category}`;
      if (!seenIds.has(item.id) && !seenKeys.has(nameKey)) {
        seenIds.add(item.id);
        seenKeys.add(nameKey);
        result.push(item);
      }
    }

    return result;
  }, [customEntries, baseEntries]);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered List
  const filteredItems = useMemo(() => {
    return allCompendiumItems.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;

      // System filter
      if (selectedSystem !== 'all') {
        const itemEdition = item.edition || '5e';
        if (itemEdition !== selectedSystem) return false;
      } else if (enabledSystems && enabledSystems.length > 0) {
        const itemEdition = (item.edition || '5e') as RuleEdition;
        if (!enabledSystems.includes(itemEdition)) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = item.name.toLowerCase().includes(q);
        const descMatch = item.description.toLowerCase().includes(q);
        const sourceMatch = item.source.toLowerCase().includes(q);
        const tagsMatch = item.tags?.some((t) => t.toLowerCase().includes(q));
        if (!nameMatch && !descMatch && !sourceMatch && !tagsMatch) return false;
      }

      return true;
    });
  }, [allCompendiumItems, selectedCategory, selectedSystem, searchQuery]);

  // Category Counters
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: allCompendiumItems.length,
      monsters: 0,
      spells: 0,
      items: 0,
      classes: 0,
      races: 0,
      feats: 0,
      features: 0,
      skills: 0
    };
    allCompendiumItems.forEach((item) => {
      if (counts[item.category] !== undefined) {
        counts[item.category]++;
      }
    });
    return counts;
  }, [allCompendiumItems]);

  // Delete Custom Entry
  const handleDeleteCustom = (item: CompendiumItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToDelete(item);
  };

  const confirmDeleteCustom = () => {
    if (!itemToDelete) return;
    const updated = deleteCustomCompendiumEntry(itemToDelete.id, itemToDelete.name, itemToDelete.category);
    setCustomEntries(updated);
    eventBus.emit('CompendiumUpdated', { id: itemToDelete.id, name: itemToDelete.name });
    showToast(`Deleted "${itemToDelete.name}" from Compendium`);
    if (selectedDetailItem?.id === itemToDelete.id) {
      setSelectedDetailItem(null);
    }
    setItemToDelete(null);
  };

  // Add Item/Spell/Feat/Feature/Class/Race to Active Character
  const handleAddToCharacter = (item: CompendiumItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (!activeCharacter || !onUpdateCharacter) {
      showToast('⚠️ No active character selected to receive this item!');
      return;
    }

    if (item.category === 'items') {
      const customItemData = (item.itemData || {}) as any;
      const isWeapon = customItemData.itemType === 'Weapon' || customItemData.type === 'weapon' || !!customItemData.damage || !!customItemData.weaponStats?.damage;
      const isArmor = customItemData.itemType === 'Armor' || customItemData.type === 'armor' || customItemData.type === 'shield' || customItemData.armorAc !== undefined || customItemData.armorClass !== undefined;
      const costVal = typeof customItemData.costGp === 'number' ? customItemData.costGp : (parseFloat(customItemData.cost || '0') || 0);

      const newItem: GearItem = {
        id: 'inv-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        name: item.name,
        quantity: customItemData.quantity || 1,
        weight: typeof customItemData.weight === 'number' ? customItemData.weight : (parseFloat(customItemData.weight || '1') || 1),
        costGp: costVal,
        equipped: false,
        stored: false,
        notes: customItemData.notes || item.description,
        itemType: customItemData.itemType || (isWeapon ? 'Weapon' : isArmor ? 'Armor' : 'Misc'),
        armorAc: customItemData.armorAc ?? customItemData.armorClass,
        armorType: customItemData.armorType,
        acBonus: customItemData.acBonus,
        damageReduction: customItemData.damageReduction,
        resistance: customItemData.resistance,
        immunity: customItemData.immunity,
        hpMaxBonus: customItemData.hpMaxBonus,
        initiativeBonus: customItemData.initiativeBonus,
        spellDcBonus: customItemData.spellDcBonus,
        isMagic: customItemData.isMagic || !!customItemData.rarity || item.tags?.includes('Magic'),
        isCursed: customItemData.isCursed,
        requiresAttunement: customItemData.attunement ?? customItemData.requiresAttunement,
        weaponStats: customItemData.weaponStats || (customItemData.damage ? {
          damage: customItemData.damage,
          damageType: customItemData.damageType,
          attackBonus: customItemData.attackBonus,
          range: customItemData.range,
          notes: customItemData.properties?.join(', ') || customItemData.notes
        } : undefined)
      };

      if (onAddItemToInventory) {
        onAddItemToInventory(newItem, activeCharacter.id);
      } else if (onUpdateCharacter) {
        const currentInventory = Array.isArray(activeCharacter.inventory) ? activeCharacter.inventory : [];
        onUpdateCharacter(recalculateCharacterAC({
          ...activeCharacter,
          inventory: [newItem, ...currentInventory]
        }));
        eventBus.emit('ItemAdded', {
          characterId: activeCharacter.id,
          itemName: newItem.name,
          quantity: newItem.quantity || 1
        });
      }
      showToast(`🎒 Added "${item.name}" to ${activeCharacter.name}'s inventory!`);
    } else if (item.category === 'classes' && item.classData) {
      const newFeatures: ClassFeature[] = (item.classData.featuresByLevel || [])
        .filter(f => f.level <= (activeCharacter.level || 1))
        .map(f => ({
          id: 'cf-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          name: f.name,
          source: `${item.name} Lvl ${f.level}`,
          description: f.description,
          recharge: 'Long Rest'
        }));

      onUpdateCharacter({
        ...activeCharacter,
        characterClass: item.name,
        hitDiceTotal: item.classData.hitDie ? `${activeCharacter.level || 1}${item.classData.hitDie}` : activeCharacter.hitDiceTotal,
        classFeatures: [...(activeCharacter.classFeatures || []), ...newFeatures]
      });
      showToast(`🛡️ Applied Class "${item.name}" to ${activeCharacter.name}!`);
    } else if (item.category === 'races' && item.raceData) {
      const racialTraits: ClassFeature[] = (item.raceData.traits || []).map(t => ({
        id: 'rt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        name: t.name,
        source: `${item.name} Racial Trait`,
        description: t.description,
        recharge: (t.recharge as any) || 'Special'
      }));

      onUpdateCharacter({
        ...activeCharacter,
        race: item.name,
        speed: item.raceData.speed || activeCharacter.speed || 30,
        classFeatures: [...(activeCharacter.classFeatures || []), ...racialTraits]
      });
      showToast(`🧬 Applied Race "${item.name}" to ${activeCharacter.name}!`);
    } else if (item.category === 'spells' && item.spellData) {
      const spellCandidate = {
        name: item.spellData.name || item.name,
        description: item.description
      };

      const dup = isDuplicateSpell(activeCharacter.spells || [], spellCandidate);
      if (dup.isDuplicate) {
        showToast(`⚠️ "${spellCandidate.name}" is already in ${activeCharacter.name}'s spellbook!`);
        return;
      }

      const newSpell: Spell = {
        id: 'spell-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        name: spellCandidate.name,
        level: item.spellData.level ?? 1,
        school: item.spellData.school || 'Evocation',
        castingTime: item.spellData.castingTime || '1 action',
        range: item.spellData.range || '60 ft',
        components: item.spellData.components || 'V, S',
        duration: item.spellData.duration || 'Instantaneous',
        description: item.description,
        prepared: true,
        damage: item.spellData.damage,
        damageType: item.spellData.damageType,
        saveType: item.spellData.saveType
      };

      onUpdateCharacter({
        ...activeCharacter,
        spells: [...(activeCharacter.spells || []), newSpell]
      });
      showToast(`🪄 Added spell "${item.name}" to ${activeCharacter.name}'s spellbook!`);
    } else if (item.category === 'feats' && item.featData) {
      const newFeat: Feat = {
        id: 'feat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        name: item.featData.name || item.name,
        source: item.source || 'Feat',
        description: item.description,
        prerequisite: item.featData.prerequisite
      };

      onUpdateCharacter({
        ...activeCharacter,
        feats: [...(activeCharacter.feats || []), newFeat]
      });
      showToast(`📜 Added feat "${item.name}" to ${activeCharacter.name}!`);
    } else if (item.category === 'features' && item.featureData) {
      const newFeature: ClassFeature = {
        id: 'feat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        name: item.featureData.name || item.name,
        source: item.source || 'Class Feature',
        description: item.description,
        recharge: item.featureData.recharge || 'Long Rest',
        usesMax: item.featureData.usesMax,
        usesRemaining: item.featureData.usesMax
      };

      onUpdateCharacter({
        ...activeCharacter,
        classFeatures: [...(activeCharacter.classFeatures || []), newFeature]
      });
      showToast(`✨ Added feature "${item.name}" to ${activeCharacter.name}!`);
    } else if (item.category === 'monsters' && item.monsterData && onAddMonsterToRoster) {
      const newMonster: CharacterData = {
        ...(item.monsterData as CharacterData),
        id: 'monster-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        name: `${item.name} #${Math.floor(Math.random() * 100) + 1}`,
        isMonster: true
      };
      onAddMonsterToRoster(newMonster);
      showToast(`👹 Spawned "${newMonster.name}" into your Campaign Roster!`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 bg-amber-500 text-stone-950 px-4 py-2.5 rounded-xl font-bold text-sm shadow-xl flex items-center gap-2 border border-amber-300 animate-bounce">
          <Check className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* COMPENDIUM HEADER */}
      <div className="bg-stone-950 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -z-0 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-serif font-black text-stone-100 flex items-center gap-3">
              <span>Monsters, Spells, Items & Rules Compendium</span>
            </h2>
            <p className="text-stone-400 text-sm max-w-2xl leading-relaxed">
              Explore pre-loaded SRD rules library or create custom entries. DM homebrew weapons, spells, monsters, and features automatically save and can be added directly to any character sheet or encounter!
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowCustomModal(true)}
              className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 shrink-0 text-sm cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-stone-950 animate-pulse" />
              <span>✨ Homebrew & Rules Forge Studio</span>
            </button>
          </div>
        </div>

        {/* SEARCH AND SYSTEM FILTER BAR */}
        <div className="mt-6 pt-6 border-t border-stone-800/80 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('compendium.searchPlaceholder', 'Search spells, monsters, magic items, rules...')}
              className="w-full pl-10 pr-4 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-stone-200 placeholder-stone-500 text-sm focus:outline-none focus:border-amber-500/80"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent py-1 shrink-0 max-w-full pr-4">
            <span className="text-xs font-mono text-stone-400 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-amber-400" /> System:
            </span>
            {[
              { id: 'all', label: t('common.all', 'Active Systems') },
              ...systemRegistry.getAllSystems().map(sys => ({ id: sys.id, label: sys.shortName }))
            ]
              .filter(sys => sys.id === 'all' || !enabledSystems || enabledSystems.includes(sys.id as RuleEdition))
              .map((sys) => (
              <button
                key={sys.id}
                onClick={() => setSelectedSystem(sys.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition whitespace-nowrap shrink-0 ${
                  selectedSystem === sys.id
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                {sys.label}
              </button>
            ))}
            <div className="w-6 shrink-0 h-1" />
          </div>
        </div>

        {/* CATEGORY TABS */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent pt-2 pb-2 pr-4">
          {[
            { id: 'all' as const, label: t('common.all', 'All Entries'), icon: Layers, count: categoryCounts.all },
            { id: 'monsters' as const, label: t('compendium.monsters', 'Monsters & NPCs'), icon: Crown, count: categoryCounts.monsters },
            { id: 'spells' as const, label: t('compendium.spells', 'Spells & Magic'), icon: Wand2, count: categoryCounts.spells },
            { id: 'items' as const, label: t('compendium.items', 'Items & Gear'), icon: Sword, count: categoryCounts.items },
            { id: 'classes' as const, label: t('wizard.stepClass', 'Classes'), icon: Shield, count: categoryCounts.classes },
            { id: 'races' as const, label: t('wizard.stepRace', 'Races & Lineages'), icon: Sparkles, count: categoryCounts.races },
            { id: 'feats' as const, label: t('wizard.stepFeats', 'Feats'), icon: Scroll, count: categoryCounts.feats },
            { id: 'features' as const, label: t('level.featuresUnlocked', 'Features'), icon: Sparkles, count: categoryCounts.features },
            { id: 'skills' as const, label: t('skills.title', 'Skills'), icon: Dices, count: categoryCounts.skills }
          ].map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-stone-950 text-amber-400' : 'bg-stone-800 text-stone-400'}`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
          <div className="w-8 shrink-0 h-1" />
        </div>
      </div>

      {/* COMPENDIUM ENTRIES GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-stone-400 px-1">
          <span>Showing {filteredItems.length} compendium entries</span>
          {activeCharacter && (
            <span className="text-amber-400 font-sans">Active Target: <strong>{activeCharacter.name}</strong></span>
          )}
        </div>

        {filteredItems.length === 0 ? (
          <div className="bg-stone-950 border border-stone-800 rounded-2xl p-12 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-stone-600 mx-auto" />
            <h3 className="text-lg font-serif font-bold text-stone-300">No matching compendium entries found</h3>
            <p className="text-stone-500 text-sm max-w-md mx-auto">
              Try adjusting your search filter, system selection, or category tab. Or click "+ Add Custom Entry" to create a new one!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const isCustom = item.isCustom;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedDetailItem(item)}
                  className={`bg-stone-950 border rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between space-y-3 cursor-pointer group hover:border-amber-500/60 hover:shadow-xl hover:shadow-amber-950/20 ${
                    isCustom ? 'border-amber-600/40 bg-stone-950/90' : 'border-stone-800'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Header badges */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-stone-900 text-amber-400 border border-stone-800">
                          {item.category}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-stone-900 text-stone-400 border border-stone-800">
                          {item.edition || '5e'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {isCustom && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            Custom
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-stone-500 truncate max-w-[100px]">
                          {item.source}
                        </span>
                      </div>
                    </div>

                    {/* Entry Name */}
                    <h3 className="font-serif font-bold text-base text-stone-100 group-hover:text-amber-300 transition flex items-center justify-between">
                      <span>{item.name}</span>
                    </h3>

                    {/* Specific Subtitle Details */}
                    {item.category === 'items' && item.itemData && (
                      <div className="text-xs font-mono text-emerald-400 flex items-center gap-2">
                        {item.itemData.damage && <span>Dmg: {item.itemData.damage} {item.itemData.damageType}</span>}
                        {item.itemData.armorClass && <span>AC: +{item.itemData.armorClass}</span>}
                        {item.itemData.cost && <span>Cost: {item.itemData.cost}</span>}
                      </div>
                    )}

                    {item.category === 'spells' && item.spellData && (
                      <div className="text-xs font-mono text-purple-300 flex items-center gap-2">
                        <span>Lvl {item.spellData.level === 0 ? 'Cantrip' : item.spellData.level} {item.spellData.school}</span>
                        {item.spellData.range && <span>• {item.spellData.range}</span>}
                      </div>
                    )}

                    {item.category === 'monsters' && item.monsterData && (
                      <div className="text-xs font-mono text-rose-400 flex items-center gap-2">
                        <span>CR {item.monsterData.challengeRating || (item.monsterData.subclass ? item.monsterData.subclass.replace(/^CR\s*/i, '') : '1')}</span>
                        <span>• HP {item.monsterData.hpMax}</span>
                        <span>• AC {item.monsterData.armorClass}</span>
                      </div>
                    )}

                    {item.category === 'classes' && item.classData && (
                      <div className="text-xs font-mono text-cyan-300">
                        Hit Die: {item.classData.hitDie} • {item.classData.role}
                      </div>
                    )}

                    {item.category === 'skills' && item.skillData && (
                      <div className="text-xs font-mono text-amber-300">
                        Ability: {item.skillData.ability} ({item.skillData.system})
                      </div>
                    )}

                    {/* Description Snippet */}
                    <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
                      {item.category === 'monsters' && item.monsterData
                        ? `${item.monsterData.race || 'Monstrosity'} • ${item.monsterData.characterClass || 'Monster'} (CR ${item.monsterData.challengeRating || (item.monsterData.subclass ? item.monsterData.subclass.replace(/^CR\s*/i, '') : '1')}) - ${item.monsterData.alignment || 'Neutral'}. HP: ${item.monsterData.hpMax}, AC: ${item.monsterData.armorClass}.${item.monsterData.backstory ? ` ${item.monsterData.backstory}` : ''}`
                        : item.description}
                    </p>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-2 border-t border-stone-800/60 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-stone-400 hover:text-amber-300 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> Details
                    </span>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {isCustom && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCustom(item, e)}
                          title="Delete Custom Entry"
                          className="p-1.5 text-stone-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {['items', 'spells', 'feats', 'features', 'monsters', 'classes', 'races'].includes(item.category) && (
                        <button
                          onClick={(e) => handleAddToCharacter(item, e)}
                          className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>
                            {item.category === 'monsters'
                              ? 'Spawn'
                              : item.category === 'classes'
                              ? 'Apply Class'
                              : item.category === 'races'
                              ? 'Apply Race'
                              : 'Add to Sheet'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedDetailItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-950 border border-stone-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedDetailItem(null)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-100 p-1.5 rounded-full hover:bg-stone-900 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="space-y-2 border-b border-stone-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                  {selectedDetailItem.category}
                </span>
                <span className="text-xs font-mono text-stone-400">
                  {selectedDetailItem.edition || '5e'} System • {selectedDetailItem.source}
                </span>
              </div>
              <h3 className="text-2xl font-serif font-black text-stone-100">
                {selectedDetailItem.name}
              </h3>
            </div>

            {/* Modal Specific Fields */}
            {selectedDetailItem.category === 'monsters' && selectedDetailItem.monsterData && (() => {
              const m = selectedDetailItem.monsterData;
              const portrait = m.portraitUrl || getMonsterPortraitUrl(m.name, m.id);
              
              return (
                <div className="space-y-5">
                  {/* Monster Portrait & Header Summary */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-stone-900/60 p-4 rounded-2xl border border-stone-800">
                    {portrait && (
                      <img
                        src={portrait}
                        alt={m.name || selectedDetailItem.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl border-2 border-amber-500/40 shadow-lg shrink-0"
                      />
                    )}
                    <div className="space-y-1 text-center sm:text-left flex-1">
                      <div className="text-xs font-mono text-amber-400 font-bold uppercase">
                        {m.sizeCategory || 'Medium'} {m.race || 'Monstrosity'} • {m.alignment || 'Neutral'}
                      </div>
                      <div className="text-xs text-stone-300 font-mono flex items-center justify-center sm:justify-start gap-3 flex-wrap">
                        <span>CR: <strong className="text-purple-400">{m.challengeRating || (m.subclass ? m.subclass.replace(/^CR\s*/i, '') : '1')}</strong></span>
                        {m.monsterXpReward ? <span>• XP: <strong className="text-amber-300">{m.monsterXpReward} XP</strong></span> : null}
                        {m.speed ? <span>• Speed: <strong className="text-cyan-300">{m.speed} ft</strong></span> : null}
                      </div>
                    </div>
                  </div>

                  {/* Core Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 bg-stone-900/80 border border-stone-800 p-3.5 rounded-2xl text-center">
                    <div>
                      <div className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">Armor Class</div>
                      <div className="text-xl font-serif font-bold text-amber-400">{m.armorClass || 10}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">Hit Points</div>
                      <div className="text-xl font-serif font-bold text-emerald-400">
                        {m.hpMax || 10} {m.hitDiceTotal ? <span className="text-xs text-stone-400 font-sans">({m.hitDiceTotal})</span> : null}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">Challenge Rating</div>
                      <div className="text-xl font-serif font-bold text-purple-400">{m.challengeRating || (m.subclass ? m.subclass.replace(/^CR\s*/i, '') : '1')}</div>
                    </div>
                  </div>

                  {/* Ability Scores Grid */}
                  {m.abilities && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-mono text-amber-300 uppercase font-bold flex items-center gap-1.5">
                        <span>📊 Ability Scores</span>
                      </h4>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                        {(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const).map((ability) => {
                          const score = m.abilities?.[ability]?.score ?? 10;
                          const mod = getAbilityModifier(score);
                          return (
                            <div key={ability} className="bg-stone-900/90 border border-stone-800 p-2 rounded-xl">
                              <div className="text-[10px] font-mono text-stone-400 font-bold">{ability}</div>
                              <div className="text-sm font-bold text-stone-100">{score}</div>
                              <div className="text-[11px] font-mono font-bold text-amber-400">{formatModifier(mod)}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Multiattack & Actions / Moves */}
                  {(m.multiattack || (m.attacks && m.attacks.length > 0)) && (
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-mono text-amber-300 uppercase font-bold flex items-center gap-1.5">
                        <span>⚔️ Actions & Moves</span>
                      </h4>

                      {m.multiattack && (
                        <div className="bg-amber-950/30 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-200 leading-relaxed font-serif">
                          <strong className="text-amber-400 uppercase font-mono tracking-wider mr-1.5">Multiattack:</strong>
                          {m.multiattack}
                        </div>
                      )}

                      {m.attacks && m.attacks.length > 0 && (
                        <div className="grid grid-cols-1 gap-2">
                          {m.attacks.map((atk, idx) => (
                            <div key={atk.id || idx} className="bg-stone-900/80 border border-stone-800 p-3 rounded-xl space-y-1">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="font-serif font-bold text-stone-100 text-sm">{atk.name}</span>
                                <div className="flex items-center gap-2 text-xs font-mono">
                                  {atk.attackBonus !== undefined && (
                                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-bold">
                                      {formatModifier(atk.attackBonus)} to hit
                                    </span>
                                  )}
                                  {atk.range && (
                                    <span className="bg-stone-800 text-stone-300 px-2 py-0.5 rounded-md">
                                      {atk.range}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {(atk.damage || atk.damageType) && (
                                <div className="text-xs font-mono text-emerald-400 font-bold">
                                  Damage: {atk.damage || '0'} {atk.damageType || ''}
                                </div>
                              )}
                              {atk.notes && (
                                <p className="text-xs text-stone-300 italic bg-stone-950/50 p-1.5 rounded-lg border border-stone-850">
                                  {atk.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Traits & Features / Feats */}
                  {((m.classFeatures && m.classFeatures.length > 0) || (m.feats && m.feats.length > 0)) && (
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-mono text-amber-300 uppercase font-bold flex items-center gap-1.5">
                        <span>✨ Special Traits & Feats</span>
                      </h4>
                      <div className="space-y-2">
                        {m.classFeatures?.map((feat, idx) => (
                          <div key={feat.id || idx} className="bg-stone-900/80 border border-stone-800 p-3 rounded-xl space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-serif font-bold text-amber-200 text-sm">{feat.name}</span>
                              {feat.source && <span className="text-[10px] font-mono text-stone-400 uppercase bg-stone-800 px-2 py-0.5 rounded">{feat.source}</span>}
                            </div>
                            <p className="text-xs text-stone-300 leading-relaxed">{feat.description}</p>
                          </div>
                        ))}
                        {m.feats?.map((feat, idx) => (
                          <div key={feat.id || idx} className="bg-stone-900/80 border border-stone-800 p-3 rounded-xl space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-serif font-bold text-amber-200 text-sm">{feat.name}</span>
                              {feat.prerequisite && <span className="text-[10px] font-mono text-amber-400">Req: {feat.prerequisite}</span>}
                            </div>
                            <p className="text-xs text-stone-300 leading-relaxed">{feat.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Legendary Actions */}
                  {m.legendaryActions && m.legendaryActions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-mono text-purple-300 uppercase font-bold flex items-center gap-1.5">
                        <span>👑 Legendary Actions</span>
                      </h4>
                      <div className="space-y-2">
                        {m.legendaryActions.map((leg, idx) => (
                          <div key={leg.id || idx} className="bg-purple-950/20 border border-purple-800/40 p-3 rounded-xl space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-serif font-bold text-purple-200 text-sm">{leg.name}</span>
                              <span className="text-[10px] font-mono text-purple-300 bg-purple-900/50 px-2 py-0.5 rounded">
                                Cost: {leg.cost || 1} Action{leg.cost && leg.cost > 1 ? 's' : ''}
                              </span>
                            </div>
                            <p className="text-xs text-stone-300 leading-relaxed">{leg.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lair Actions */}
                  {m.lairActions && m.lairActions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-mono text-emerald-300 uppercase font-bold flex items-center gap-1.5">
                        <span>🏰 Lair Actions</span>
                      </h4>
                      <div className="space-y-2">
                        {m.lairActions.map((lair, idx) => (
                          <div key={lair.id || idx} className="bg-emerald-950/20 border border-emerald-800/40 p-3 rounded-xl space-y-1">
                            <div className="font-serif font-bold text-emerald-200 text-sm">{lair.name}</div>
                            <p className="text-xs text-stone-300 leading-relaxed">{lair.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Spells */}
                  {m.spells && m.spells.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-mono text-indigo-300 uppercase font-bold flex items-center gap-1.5">
                        <span>📜 Inherent Spells</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {m.spells.map((sp, idx) => (
                          <div key={sp.id || idx} className="bg-stone-900/80 border border-stone-800 p-2.5 rounded-xl text-xs space-y-0.5">
                            <div className="font-bold text-indigo-200">{sp.name}</div>
                            <div className="text-[10px] font-mono text-stone-400">
                              Level {sp.level === 0 ? 'Cantrip' : sp.level} {sp.school || ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {selectedDetailItem.category === 'items' && selectedDetailItem.itemData && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-stone-900/80 border border-stone-800 p-3 rounded-2xl text-xs font-mono text-stone-300">
                <div>Type: <strong className="text-amber-400 uppercase">{selectedDetailItem.itemData.type || 'Gear'}</strong></div>
                {selectedDetailItem.itemData.damage && <div>Damage: <strong className="text-emerald-400">{selectedDetailItem.itemData.damage}</strong></div>}
                {selectedDetailItem.itemData.armorClass && <div>AC Bonus: <strong className="text-cyan-400">+{selectedDetailItem.itemData.armorClass}</strong></div>}
                {selectedDetailItem.itemData.cost && <div>Value: <strong className="text-amber-300">{selectedDetailItem.itemData.cost}</strong></div>}
                {selectedDetailItem.itemData.weight && <div>Weight: <strong className="text-stone-300">{selectedDetailItem.itemData.weight} lb</strong></div>}
                {selectedDetailItem.itemData.rarity && <div>Rarity: <strong className="text-purple-300 capitalize">{selectedDetailItem.itemData.rarity}</strong></div>}
                {selectedDetailItem.itemData.attunement && <div>Attunement: <strong className="text-rose-400">Required</strong></div>}
              </div>
            )}

            {selectedDetailItem.category === 'feats' && selectedDetailItem.featData && (
              <div className="bg-stone-900/80 border border-stone-800 p-3.5 rounded-2xl space-y-2 text-xs font-mono">
                {selectedDetailItem.featData.prerequisite && (
                  <div>Prerequisite: <strong className="text-amber-300">{selectedDetailItem.featData.prerequisite}</strong></div>
                )}
                {selectedDetailItem.featData.source && (
                  <div>Source: <strong className="text-cyan-300">{selectedDetailItem.featData.source}</strong></div>
                )}
              </div>
            )}

            {selectedDetailItem.category === 'features' && selectedDetailItem.featureData && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-stone-900/80 border border-stone-800 p-3 rounded-2xl text-xs font-mono text-stone-300">
                <div>Source: <strong className="text-amber-400">{selectedDetailItem.featureData.source || 'Class Feature'}</strong></div>
                {selectedDetailItem.featureData.usesMax ? (
                  <div>Uses: <strong className="text-emerald-400">{selectedDetailItem.featureData.usesMax} / {selectedDetailItem.featureData.recharge || 'Long Rest'}</strong></div>
                ) : null}
              </div>
            )}

            {selectedDetailItem.category === 'spells' && selectedDetailItem.spellData && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-stone-900/80 border border-stone-800 p-3 rounded-2xl text-xs font-mono text-stone-300">
                  <div>Level: <strong className="text-purple-300">{selectedDetailItem.spellData.level === 0 ? 'Cantrip' : `Level ${selectedDetailItem.spellData.level}`}</strong></div>
                  <div>School: <strong className="text-amber-400">{selectedDetailItem.spellData.school || 'General'}</strong></div>
                  <div>Casting Time: <strong className="text-stone-200">{selectedDetailItem.spellData.castingTime || '1 action'}</strong></div>
                  <div>Range: <strong className="text-stone-200">{selectedDetailItem.spellData.range || 'Touch'}</strong></div>
                  <div>Components: <strong className="text-stone-200">{selectedDetailItem.spellData.components || 'V, S'}</strong></div>
                  <div>Duration: <strong className="text-stone-200">{selectedDetailItem.spellData.duration || 'Instantaneous'}</strong></div>
                  {selectedDetailItem.spellData.damage && (
                    <div className="col-span-2 sm:col-span-1">Damage: <strong className="text-emerald-400">{selectedDetailItem.spellData.damage} {selectedDetailItem.spellData.damageType || ''}</strong></div>
                  )}
                  {selectedDetailItem.spellData.saveType && (
                    <div>Save DC: <strong className="text-cyan-300">{selectedDetailItem.spellData.saveType} Save</strong></div>
                  )}
                </div>
                {selectedDetailItem.spellData.shortDescription && (
                  <div className="bg-purple-950/20 border border-purple-800/40 p-3 rounded-xl text-xs text-purple-200 leading-relaxed">
                    <strong className="font-mono text-purple-400 uppercase mr-1">Summary:</strong>
                    {selectedDetailItem.spellData.shortDescription}
                  </div>
                )}
              </div>
            )}

            {selectedDetailItem.category === 'classes' && selectedDetailItem.classData && (
              <div className="space-y-2 bg-stone-900/80 border border-stone-800 p-4 rounded-2xl text-xs font-mono text-stone-300">
                <div>Hit Die: <strong className="text-amber-400">{selectedDetailItem.classData.hitDie}</strong></div>
                <div>Primary Ability: <strong className="text-cyan-300">{selectedDetailItem.classData.primaryAbility}</strong></div>
                <div>Role: <strong className="text-emerald-300">{selectedDetailItem.classData.role}</strong></div>
                {selectedDetailItem.classData.subclasses && (
                  <div>Subclasses: <span className="text-stone-400">{selectedDetailItem.classData.subclasses.join(', ')}</span></div>
                )}
              </div>
            )}

            {selectedDetailItem.category === 'races' && selectedDetailItem.raceData && (
              <div className="space-y-3 bg-stone-900/80 border border-stone-800 p-4 rounded-2xl text-xs text-stone-300">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                  <div>Speed: <strong className="text-amber-400">{selectedDetailItem.raceData.speed || 30} ft</strong></div>
                  <div>Size: <strong className="text-cyan-300">{selectedDetailItem.raceData.size || 'Medium'}</strong></div>
                  <div>Darkvision: <strong className="text-purple-300">{selectedDetailItem.raceData.darkvision ? `${selectedDetailItem.raceData.darkvision} ft` : 'None'}</strong></div>
                  <div>Origin: <strong className="text-emerald-300">Lineage</strong></div>
                </div>
                {selectedDetailItem.raceData.traits && selectedDetailItem.raceData.traits.length > 0 && (
                  <div className="pt-2 border-t border-stone-800/80 space-y-2">
                    <div className="text-[11px] font-mono text-amber-300 uppercase font-bold">Racial Traits:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedDetailItem.raceData.traits.map((trait, idx) => (
                        <div key={idx} className="bg-stone-950/60 p-2.5 rounded-xl border border-stone-800 space-y-0.5">
                          <div className="font-bold text-amber-200">{trait.name}</div>
                          <p className="text-[11px] text-stone-400">{trait.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedDetailItem.category === 'skills' && selectedDetailItem.skillData && (
              <div className="bg-stone-900/80 border border-stone-800 p-4 rounded-2xl text-xs space-y-2">
                <div className="font-mono text-amber-300">Governing Ability: <strong>{selectedDetailItem.skillData.ability}</strong></div>
                {selectedDetailItem.skillData.exampleUses && (
                  <div>
                    <div className="text-stone-400 font-bold mb-1">Common Example Checks:</div>
                    <ul className="list-disc list-inside text-stone-300 space-y-1">
                      {selectedDetailItem.skillData.exampleUses.map((ex, i) => (
                        <li key={i}>{ex}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Description Body */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono text-stone-400 uppercase font-bold">
                {selectedDetailItem.category === 'monsters' ? 'Lore & Description' : 'Description & Rules'}
              </h4>
              <p className="text-stone-200 text-sm leading-relaxed whitespace-pre-wrap bg-stone-900/40 p-4 rounded-2xl border border-stone-800/80">
                {selectedDetailItem.description}
              </p>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-stone-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDetailItem(null)}
                  className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
                {(selectedDetailItem.isCustom || customEntries.some(c => c.id === selectedDetailItem.id || (c.name.toLowerCase() === selectedDetailItem.name.toLowerCase() && c.category === selectedDetailItem.category))) && (
                  <button
                    type="button"
                    onClick={() => setItemToDelete(selectedDetailItem)}
                    className="px-3.5 py-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 border border-rose-800/50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    title="Delete custom entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Entry</span>
                  </button>
                )}
              </div>

              {['items', 'spells', 'feats', 'features', 'monsters', 'classes', 'races'].includes(selectedDetailItem.category) && (
                <button
                  type="button"
                  onClick={() => {
                    handleAddToCharacter(selectedDetailItem);
                    setSelectedDetailItem(null);
                  }}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-amber-950/30 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {selectedDetailItem.category === 'monsters'
                      ? 'Spawn Monster in Roster'
                      : selectedDetailItem.category === 'classes'
                      ? `Apply Class to ${activeCharacter?.name || 'Character'}`
                      : selectedDetailItem.category === 'races'
                      ? `Apply Race to ${activeCharacter?.name || 'Character'}`
                      : `Add to ${activeCharacter?.name || 'Character'}`}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* IN-APP DELETE CONFIRMATION MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-950 border border-stone-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-stone-100">Delete Custom Entry?</h3>
                <p className="text-xs text-stone-400 font-mono">This will remove the item from your compendium database.</p>
              </div>
            </div>

            <div className="p-3.5 bg-stone-900/80 rounded-2xl border border-stone-800/80 space-y-1">
              <div className="text-sm font-bold text-amber-300 font-serif">{itemToDelete.name}</div>
              <div className="text-xs text-stone-400 font-mono">
                {itemToDelete.category.toUpperCase()} • {itemToDelete.edition || '5e'} • {itemToDelete.source}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCustom}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-rose-950/40 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Entry</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HOMEBREW & RULES FORGE STUDIO MODAL */}
      {showCustomModal && (
        <HomebrewForgeModal
          initialSystem={selectedSystem !== 'all' ? (selectedSystem as any) : '5e'}
          onClose={() => setShowCustomModal(false)}
          activeCharacter={activeCharacter}
          onUpdateCharacter={onUpdateCharacter}
          onAddItemToInventory={onAddItemToInventory}
          onSaved={(newItem) => {
            setCustomEntries(loadCustomCompendiumEntries());
            showToast(`✨ Created custom homebrew entry "${newItem.name}"!`);
          }}
          allCustomItems={customEntries}
          onImportCustomItems={(imported) => {
            setCustomEntries(imported);
            showToast('✨ Compendium entries refreshed!');
          }}
        />
      )}
    </div>
  );
};
