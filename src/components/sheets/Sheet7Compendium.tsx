import React, { useState, useMemo, useEffect } from 'react';
import { CharacterData, Spell, Feat, ClassFeature, GearItem, RuleEdition } from '../../types';
import { getAbilityModifier, formatModifier, recalculateCharacterAC } from '../../utils/dndCalculations';
import { eventBus } from '../../events/eventBus';
import { isDuplicateSpell } from '../../utils/spellUtils';
import { getMonsterPortraitUrl } from '../../data/monsterPortraits';
import {
  parseAbilityScoreBonuses,
  parseDamageReductionFromText,
  parseNaturalArmorFromText,
  parseSpellResistanceFromText,
  parseEnergyResistancesFromText,
  getScalingStatAtLevel
} from '../../utils/homebrewValidator';
import { systemRegistry } from '../../systems';
import { useLanguage } from '../../i18n/LanguageContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useHomebrewSync } from '../../hooks/useHomebrewSync';
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
  Upload,
  Cloud,
  Database,
  RefreshCw,
  Edit3,
  Scale,
  ShieldCheck
} from 'lucide-react';
import { LegalLicensingModal } from '../modals/LegalLicensingModal';

interface Sheet7CompendiumProps {
  activeCharacter?: CharacterData;
  allCharacters?: CharacterData[];
  onUpdateCharacter?: (updated: CharacterData) => void;
  onUpdateAllCharacters?: React.Dispatch<React.SetStateAction<CharacterData[]>>;
  onAddItemToInventory?: (item: GearItem, targetId?: string) => void;
  onAddMonsterToRoster?: (monster: CharacterData) => void;
  enabledSystems?: RuleEdition[];
}

export const Sheet7Compendium: React.FC<Sheet7CompendiumProps> = ({
  activeCharacter,
  allCharacters = [],
  onUpdateCharacter,
  onUpdateAllCharacters,
  onAddItemToInventory,
  onAddMonsterToRoster,
  enabledSystems
}) => {
  const { t } = useLanguage();
  const { currentUser, tier, tierConfig, hasHomebrewCloudSync, openUpgradeModal } = useSubscription();
  const { syncStatus, isCloudSynced, syncNow } = useHomebrewSync(currentUser, tier);

  const [selectedCategory, setSelectedCategory] = useState<CompendiumCategory | 'all'>('all');
  const [selectedSystem, setSelectedSystem] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CompendiumItem | null>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<CompendiumItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<CompendiumItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showLegalModal, setShowLegalModal] = useState(false);

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
    const updated = deleteCustomCompendiumEntry(
      itemToDelete.id, 
      itemToDelete.name, 
      itemToDelete.category,
      {
        userId: currentUser?.uid,
        userTier: tier,
        userProfile: currentUser
      }
    );
    setCustomEntries(updated);
    eventBus.emit('CompendiumUpdated', { id: itemToDelete.id, name: itemToDelete.name });
    showToast(`Deleted "${itemToDelete.name}" from Compendium`);
    if (selectedDetailItem?.id === itemToDelete.id) {
      setSelectedDetailItem(null);
    }
    setItemToDelete(null);
  };

  const handleOpenEditModal = (item: CompendiumItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingItem(item);
    setShowCustomModal(true);
  };

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setShowCustomModal(true);
  };

  const countCorrespondingEntities = (item: CompendiumItem, charList: CharacterData[]): number => {
    if (!item || !charList || charList.length === 0) return 0;
    const targetName = (item.name || '').trim().toLowerCase();
    if (!targetName) return 0;

    if (item.category === 'monsters') {
      return charList.filter(c =>
        c.isMonster && (
          c.id === item.id ||
          (c.name && c.name.toLowerCase().startsWith(targetName)) ||
          (c.race && c.race.toLowerCase() === targetName)
        )
      ).length;
    }

    if (item.category === 'items') {
      return charList.reduce((acc, c) => {
        const matchingItems = (c.inventory || []).filter(g => g.name && g.name.toLowerCase() === targetName);
        return acc + matchingItems.length;
      }, 0);
    }

    if (item.category === 'spells') {
      return charList.reduce((acc, c) => {
        const matchingSpells = (c.spells || []).filter(s => s.name && s.name.toLowerCase() === targetName);
        return acc + matchingSpells.length;
      }, 0);
    }

    if (item.category === 'races') {
      return charList.filter(c => c.race && c.race.toLowerCase() === targetName).length;
    }

    if (item.category === 'classes') {
      return charList.filter(c =>
        (c.characterClass && c.characterClass.toLowerCase() === targetName) ||
        ((c as any).class && (c as any).class.toLowerCase() === targetName) ||
        (c.optionalRules?.secondaryClass && c.optionalRules.secondaryClass.toLowerCase() === targetName)
      ).length;
    }

    if (item.category === 'feats') {
      return charList.reduce((acc, c) => {
        const matchingFeats = (c.feats || []).filter(f => f.name && f.name.toLowerCase() === targetName);
        return acc + matchingFeats.length;
      }, 0);
    }

    if (item.category === 'features') {
      return charList.reduce((acc, c) => {
        const matchingFeatures = (c.classFeatures || []).filter(f => f.name && f.name.toLowerCase() === targetName);
        return acc + matchingFeatures.length;
      }, 0);
    }

    return 0;
  };

  const handleSaveEditedItem = (updatedItem: CompendiumItem, syncEntities: boolean) => {
    saveCustomCompendiumEntry(updatedItem, {
      userId: currentUser?.uid,
      userTier: tier,
      userProfile: currentUser
    });

    const refreshed = loadCustomCompendiumEntries();
    setCustomEntries(refreshed);

    if (selectedDetailItem && (selectedDetailItem.id === updatedItem.id || selectedDetailItem.name === updatedItem.name)) {
      setSelectedDetailItem(updatedItem);
    }

    let affectedCount = 0;
    if (syncEntities && allCharacters && onUpdateAllCharacters && editingItem) {
      const origName = (editingItem.name || '').trim().toLowerCase();

      const updatedAll = allCharacters.map(char => {
        let changed = false;
        let c = { ...char };

        if (updatedItem.category === 'monsters' && updatedItem.monsterData && c.isMonster) {
          const isMatch = c.id === editingItem.id ||
            (c.name && c.name.toLowerCase().startsWith(origName)) ||
            (c.race && c.race.toLowerCase() === origName);

          if (isMatch) {
            changed = true;
            affectedCount++;
            const md = (updatedItem.monsterData || {}) as any;
            const newHpMax = md.hpMax ?? c.hpMax;
            const hpRatio = c.hpMax > 0 ? c.hpCurrent / c.hpMax : 1;
            const adjustedCurrentHp = Math.min(newHpMax, Math.round(hpRatio * newHpMax));

            let updatedName = updatedItem.name;
            if (c.name.includes('#')) {
              const suffix = c.name.split('#')[1];
              updatedName = `${updatedItem.name} #${suffix}`;
            }

            c = {
              ...c,
              name: updatedName,
              race: md.race || c.race,
              armorClass: md.armorClass ?? c.armorClass,
              hpMax: newHpMax,
              hpCurrent: adjustedCurrentHp,
              speed: md.speed ?? c.speed,
              challengeRating: md.challengeRating ?? c.challengeRating,
              subclass: md.subclass ?? c.subclass,
              sizeCategory: md.sizeCategory ?? c.sizeCategory,
              alignment: md.alignment ?? c.alignment,
              abilities: md.abilities ? { ...c.abilities, ...md.abilities } : c.abilities,
              attacks: md.attacks || c.attacks,
              monsterXpReward: md.monsterXpReward ?? c.monsterXpReward,
              spellResist: md.spellResistance ?? md.spellResist ?? c.spellResist,
              touchAcOverride: md.touchArmorClass ?? md.touchAcOverride ?? c.touchAcOverride,
              flatFootedAcOverride: md.flatFootedArmorClass ?? md.flatFootedAcOverride ?? c.flatFootedAcOverride,
              baseAttackBonus: md.baseAttackBonus ?? md.bab ?? c.baseAttackBonus,
              fortSaveBase: md.fortitudeSave ?? md.fortSaveBase ?? c.fortSaveBase,
              refSaveBase: md.reflexSave ?? md.refSaveBase ?? c.refSaveBase,
              willSaveBase: md.willSaveBase ?? md.willSave ?? c.willSaveBase,
              damageReductionValue: md.damageReductionValue ?? md.damageReduction ?? c.damageReductionValue,
              additionalNotes: md.notes ?? c.additionalNotes
            };
          }
        }

        if (updatedItem.category === 'items' && Array.isArray(c.inventory)) {
          let invChanged = false;
          const updatedInv = c.inventory.map(g => {
            if (g.name && g.name.toLowerCase() === origName) {
              invChanged = true;
              changed = true;
              affectedCount++;
              const idata = (updatedItem.itemData || {}) as any;
              return {
                ...g,
                name: updatedItem.name,
                notes: updatedItem.description || g.notes,
                costGp: typeof idata.costGp === 'number' ? idata.costGp : g.costGp,
                weight: typeof idata.weight === 'number' ? idata.weight : g.weight,
                itemType: idata.itemType || g.itemType,
                armorAc: idata.armorClass ?? idata.armorAc ?? g.armorAc,
                acBonus: idata.acBonus ?? g.acBonus,
                requiresAttunement: idata.requiresAttunement ?? g.requiresAttunement,
                isMagic: !!idata.rarity || g.isMagic,
                damageReduction: idata.damageReduction ?? g.damageReduction,
                weaponStats: (idata.weaponStats || idata.damage) ? {
                  damage: idata.damage || idata.weaponStats?.damage || g.weaponStats?.damage,
                  damageType: idata.damageType || idata.weaponStats?.damageType || g.weaponStats?.damageType,
                  range: idata.range || idata.weaponStats?.range || g.weaponStats?.range || 'Melee',
                  notes: idata.properties?.join(', ') || idata.notes || g.weaponStats?.notes
                } : g.weaponStats
              };
            }
            return g;
          });

          if (invChanged) {
            c = recalculateCharacterAC({ ...c, inventory: updatedInv });
          }
        }

        if (updatedItem.category === 'spells' && Array.isArray(c.spells)) {
          let spellChanged = false;
          const updatedSpells = c.spells.map(s => {
            if (s.name && s.name.toLowerCase() === origName) {
              spellChanged = true;
              changed = true;
              affectedCount++;
              const sd = (updatedItem.spellData || {}) as any;
              return {
                ...s,
                name: updatedItem.name,
                level: sd.level ?? s.level,
                school: sd.school || s.school,
                castingTime: sd.castingTime || s.castingTime,
                range: sd.range || s.range,
                duration: sd.duration || s.duration,
                components: sd.components || s.components,
                description: updatedItem.description || s.description,
                damage: sd.damage || s.damage,
                damageType: sd.damageType || s.damageType,
                saveType: sd.saveType || s.saveType,
                higherLevel: sd.higherLevel || s.higherLevel
              };
            }
            return s;
          });

          if (spellChanged) {
            c = { ...c, spells: updatedSpells };
          }
        }

        if (updatedItem.category === 'races') {
          const raceLower = (c.race || '').toLowerCase();
          const tplName = (c.hybridHeritage?.templateName || '').toLowerCase();
          const baseName = (c.hybridHeritage?.baseRaceName || '').toLowerCase();
          const secParent = (c.hybridHeritage?.secondaryParent || '').toLowerCase();
          const priParent = (c.hybridHeritage?.primaryParent || '').toLowerCase();

          const isRaceMatch =
            raceLower === origName ||
            raceLower.includes(origName) ||
            tplName === origName ||
            baseName === origName ||
            secParent === origName ||
            priParent === origName ||
            (Array.isArray(c.classFeatures) && c.classFeatures.some(f => f.source && f.source.toLowerCase().includes(origName)));

          if (isRaceMatch) {
            changed = true;
            affectedCount++;
            const rd = (updatedItem.raceData || {}) as any;
            c = {
              ...c,
              speed: rd.speed ? (typeof rd.speed === 'number' ? rd.speed : parseInt(String(rd.speed), 10) || c.speed) : c.speed,
              damageReductionValue: rd.damageReductionValue ?? rd.damageReduction ?? c.damageReductionValue,
              racialSkillBonuses: rd.racialSkillBonuses || c.racialSkillBonuses
            };
            if (raceLower === origName) {
              c.race = updatedItem.name;
            }
            c = recalculateCharacterAC(c);
          }
        }

        if (updatedItem.category === 'classes') {
          const isClassMatch = (c.characterClass && c.characterClass.toLowerCase() === origName) ||
            ((c as any).class && (c as any).class.toLowerCase() === origName);
          if (isClassMatch) {
            changed = true;
            affectedCount++;
            const cd = (updatedItem.classData || {}) as any;
            c = {
              ...c,
              characterClass: updatedItem.name,
              hitDiceTotal: cd.hitDie ? `${c.level}${cd.hitDie}` : c.hitDiceTotal
            };
          }
        }

        if (updatedItem.category === 'feats' && Array.isArray(c.feats)) {
          let featChanged = false;
          const updatedFeats = c.feats.map(f => {
            if (f.name && f.name.toLowerCase() === origName) {
              featChanged = true;
              changed = true;
              affectedCount++;
              return {
                ...f,
                name: updatedItem.name,
                description: updatedItem.description || f.description,
                prerequisite: updatedItem.featData?.prerequisite || f.prerequisite,
                statBonus: updatedItem.featData?.statBonus !== undefined ? updatedItem.featData.statBonus : f.statBonus,
                hpPerLevel: updatedItem.featData?.hpPerLevel !== undefined ? updatedItem.featData.hpPerLevel : f.hpPerLevel,
                hpMaxBonus: updatedItem.featData?.hpMaxBonus !== undefined ? updatedItem.featData.hpMaxBonus : f.hpMaxBonus
              };
            }
            return f;
          });

          if (featChanged) {
            c = { ...c, feats: updatedFeats };
          }
        }

        return c;
      });

      onUpdateAllCharacters(updatedAll);

      if (activeCharacter && onUpdateCharacter) {
        const updatedActive = updatedAll.find(c => c.id === activeCharacter.id);
        if (updatedActive) {
          onUpdateCharacter(updatedActive);
        }
      }
    }

    eventBus.emit('CompendiumUpdated', { id: updatedItem.id, name: updatedItem.name });
    showToast(
      `✨ Updated "${updatedItem.name}" in compendium${syncEntities && affectedCount > 0 ? ` and synchronized ${affectedCount} linked entity/entities!` : '!'}`
    );
    setEditingItem(null);
    setShowCustomModal(false);
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
      // 1. Gather ability score bonuses (structured or parsed from string/description)
      let bonusesToApply: Array<{ stat: string; value: number }> = [];
      if (item.raceData.abilityBonuses && item.raceData.abilityBonuses.length > 0) {
        bonusesToApply = item.raceData.abilityBonuses.map(b => ({ stat: b.ability, value: b.bonus }));
      } else if (item.raceData.abilityBonusesStr || item.description) {
        const parsed = parseAbilityScoreBonuses(item.raceData.abilityBonusesStr || item.description);
        bonusesToApply = parsed.map(p => ({ stat: p.stat, value: p.value }));
      }

      // Clone abilities and apply bonuses
      const updatedAbilities: Record<string, any> = { ...(activeCharacter.abilities || {}) };
      const appliedBonusSummaries: string[] = [];
      const validStats = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

      for (const b of bonusesToApply) {
        if (b.stat === 'ALL') {
          for (const s of validStats) {
            const currentScore = updatedAbilities[s]?.score ?? 10;
            updatedAbilities[s] = {
              ...(updatedAbilities[s] || {}),
              score: Math.max(1, currentScore + b.value)
            };
          }
          appliedBonusSummaries.push(`${b.value >= 0 ? '+' : ''}${b.value} All`);
        } else if (validStats.includes(b.stat)) {
          const s = b.stat;
          const currentScore = updatedAbilities[s]?.score ?? 10;
          updatedAbilities[s] = {
            ...(updatedAbilities[s] || {}),
            score: Math.max(1, currentScore + b.value)
          };
          appliedBonusSummaries.push(`${b.value >= 0 ? '+' : ''}${b.value} ${s}`);
        }
      }

      // 2. Character Level & Scaling Defenses Resolution
      const charLevel = activeCharacter.level || 1;

      // Damage Reduction (DR)
      let drValue = item.raceData.damageReductionValue;
      let drBypass = item.raceData.damageReductionBypass || '-';

      if (item.raceData.damageReductionScaling && item.raceData.damageReductionScaling.length > 0) {
        drValue = getScalingStatAtLevel(item.raceData.damageReductionScaling, charLevel);
      } else if (drValue === undefined || drValue === 0) {
        const fullRaceText = [
          item.description,
          ...(item.raceData.traits || []).map(t => `${t.name}: ${t.description}`)
        ].join(' ');

        const detectedDr = parseDamageReductionFromText(fullRaceText, charLevel);
        if (detectedDr) {
          drValue = detectedDr.value;
          drBypass = detectedDr.bypass || '-';
        }
      }

      // Natural Armor Resolution
      let natArmorBonus: number | undefined = item.raceData.naturalArmorBonus;
      if (item.raceData.naturalArmorScaling && item.raceData.naturalArmorScaling.length > 0) {
        natArmorBonus = getScalingStatAtLevel(item.raceData.naturalArmorScaling, charLevel);
      } else if (natArmorBonus === undefined) {
        const fullRaceText = [
          item.description,
          ...(item.raceData.traits || []).map(t => `${t.name}: ${t.description}`)
        ].join(' ');
        const detectedNat = parseNaturalArmorFromText(fullRaceText, charLevel);
        if (detectedNat) {
          natArmorBonus = detectedNat.value;
        }
      }

      // Spell Resistance Resolution
      let spellResistVal: number | undefined = item.raceData.spellResistanceBase;
      if (item.raceData.spellResistanceScaling && item.raceData.spellResistanceScaling.length > 0) {
        const extraSr = getScalingStatAtLevel(item.raceData.spellResistanceScaling, charLevel);
        spellResistVal = (item.raceData.spellResistanceBase || 10) + extraSr;
      } else if (item.raceData.spellResistanceScalingProgression?.includes('Level')) {
        spellResistVal = 10 + charLevel;
      } else if (spellResistVal === undefined) {
        const fullRaceText = [
          item.description,
          ...(item.raceData.traits || []).map(t => `${t.name}: ${t.description}`)
        ].join(' ');
        const detectedSr = parseSpellResistanceFromText(fullRaceText, charLevel);
        if (detectedSr) {
          spellResistVal = detectedSr.value;
        }
      }

      // Energy Resistances Resolution
      const resolvedEnergyRes: Record<string, number> = { ...(activeCharacter.energyResistances || {}) };
      if (Array.isArray(item.raceData.energyResistances) && item.raceData.energyResistances.length > 0) {
        for (const er of item.raceData.energyResistances) {
          const typeKey = (er.energyType || '').toLowerCase();
          if (!typeKey) continue;
          let val = er.value || 5;
          if (Array.isArray(er.scaling) && er.scaling.length > 0) {
            val = getScalingStatAtLevel(er.scaling, charLevel);
          }
          resolvedEnergyRes[typeKey] = Math.max(resolvedEnergyRes[typeKey] || 0, val);
        }
      } else {
        const fullRaceText = [
          item.description,
          ...(item.raceData.traits || []).map(t => `${t.name}: ${t.description}`)
        ].join(' ');
        const detectedERs = parseEnergyResistancesFromText(fullRaceText, charLevel);
        for (const er of detectedERs) {
          const typeKey = (er.energyType || '').toLowerCase();
          resolvedEnergyRes[typeKey] = Math.max(resolvedEnergyRes[typeKey] || 0, er.value);
        }
      }

      // 3. Racial Traits handling (clear existing racial traits to avoid piling duplicates)
      const currentFeatures = Array.isArray(activeCharacter.classFeatures) ? activeCharacter.classFeatures : [];
      const existingNonRacialFeatures = currentFeatures.filter(f => !f.source?.includes('Racial Trait') && !f.source?.includes('Spell-Like Ability') && !f.source?.includes('Innate Spellcasting'));
      
      const racialTraits: ClassFeature[] = (item.raceData.traits || []).map(t => ({
        id: 'rt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        name: t.name,
        source: `${item.name} Racial Trait`,
        description: t.description,
        recharge: (t.recharge as any) || 'Special'
      }));

      // Append 3.5e Spell-Like Abilities unlocked at current level
      if (Array.isArray(item.raceData.spellLikeAbilities) && item.raceData.spellLikeAbilities.length > 0) {
        const unlockedSLAs: ClassFeature[] = item.raceData.spellLikeAbilities
          .filter(sla => (sla.minLevel || 1) <= charLevel)
          .map(sla => ({
            id: 'sla-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            name: `SLA: ${sla.spellName} (${sla.usage})`,
            source: `${item.name} Spell-Like Ability`,
            description: `Granted at ${sla.levelRange || 'Level ' + sla.minLevel}. Usage: ${sla.usage}. ${sla.notes || ''}`,
            recharge: (sla.usage.includes('day') ? 'Long Rest' : sla.usage.includes('will') ? 'None' : 'Special') as any
          }));
        racialTraits.push(...unlockedSLAs);
      }

      // Append 5e Innate Spells unlocked at current level
      if (Array.isArray(item.raceData.innateSpells5e) && item.raceData.innateSpells5e.length > 0) {
        const unlocked5eSpells: ClassFeature[] = item.raceData.innateSpells5e
          .filter(s => (s.level || 1) <= charLevel)
          .map(s => ({
            id: 'isp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            name: `Innate: ${s.spellName} (${s.recharge})`,
            source: `${item.name} Innate Spellcasting`,
            description: `Cast ${s.spellName} (${s.recharge}) using ${s.ability || 'Charisma'}.`,
            recharge: (s.recharge.includes('Rest') ? 'Long Rest' : 'None') as any
          }));
        racialTraits.push(...unlocked5eSpells);
      }

      // Add Natural Weapons to customAttacks if present
      const currentAttacks = Array.isArray(activeCharacter.customAttacks) ? [...activeCharacter.customAttacks] : [];
      if (Array.isArray(item.raceData.naturalWeapons) && item.raceData.naturalWeapons.length > 0) {
        for (const nw of item.raceData.naturalWeapons) {
          const alreadyExists = currentAttacks.some(a => a.name.toLowerCase() === nw.name.toLowerCase());
          if (!alreadyExists) {
            currentAttacks.push({
              id: 'att-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
              name: `${nw.name} (Natural)`,
              attackBonus: 0,
              damageDice: nw.damage || '1d6',
              damageType: 'Physical',
              range: 'Melee',
              notes: nw.notes || `${item.name} Natural Weapon`
            });
          }
        }
      }

      // 4. Update Character & recalculate combat derived stats
      const updatedCharacter = recalculateCharacterAC({
        ...activeCharacter,
        race: item.name,
        speed: item.raceData.speed || activeCharacter.speed || 30,
        sizeCategory: (item.raceData.size as any) || activeCharacter.sizeCategory || 'Medium',
        abilities: updatedAbilities as any,
        damageReductionValue: drValue !== undefined ? drValue : activeCharacter.damageReductionValue,
        damageReductionBypass: drValue !== undefined ? drBypass : activeCharacter.damageReductionBypass,
        naturalArmorBonus: natArmorBonus !== undefined ? natArmorBonus : activeCharacter.naturalArmorBonus,
        spellResist: spellResistVal !== undefined ? spellResistVal : activeCharacter.spellResist,
        energyResistances: resolvedEnergyRes,
        customAttacks: currentAttacks,
        damageResistances: Array.from(new Set([...(activeCharacter.damageResistances || []), ...(item.raceData.damageResistances5e || [])])),
        classFeatures: [...existingNonRacialFeatures, ...racialTraits]
      });

      onUpdateCharacter(updatedCharacter);

      const bonusLabel = appliedBonusSummaries.length > 0 ? ` (${appliedBonusSummaries.join(', ')})` : '';
      const drLabel = drValue ? ` • DR ${drValue}/${drBypass} (Lv.${charLevel})` : '';
      const acLabel = natArmorBonus ? ` • +${natArmorBonus} Nat AC` : '';
      const srLabel = spellResistVal ? ` • SR ${spellResistVal}` : '';
      showToast(`🧬 Applied Race "${item.name}" to ${activeCharacter.name}${bonusLabel}${drLabel}${acLabel}${srLabel}!`);
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
    } else if (item.category === 'feats') {
      const fd = item.featData || {};
      const newFeat: Feat = {
        id: 'feat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        name: fd.name || item.name,
        source: item.source || 'Feat',
        description: item.description || fd.description || '',
        prerequisite: fd.prerequisite,
        statBonus: fd.statBonus,
        actionType: fd.actionType,
        hpMaxBonus: fd.hpMaxBonus,
        hpPerLevel: fd.hpPerLevel
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
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-serif font-black text-stone-100 flex items-center gap-3">
                <span>Monsters, Spells, Items & Rules Compendium</span>
              </h2>
              {hasHomebrewCloudSync ? (
                <button
                  onClick={() => syncNow()}
                  title="Your custom homebrew items are continuously synced to the Firestore cloud database across all your devices. Click to force sync now."
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-full text-xs font-mono transition cursor-pointer"
                >
                  <Cloud className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>Cloud Database Sync Active</span>
                  {syncStatus === 'syncing' && <RefreshCw className="w-3 h-3 animate-spin ml-1 text-amber-400" />}
                </button>
              ) : (
                <button
                  onClick={() => openUpgradeModal('Upgrade to Hero or Guild Master tier to enable automatic Cloud Database Sync for your custom homebrew items, spells, and monsters!', 'hero')}
                  title="Free Tier: Homebrew is saved locally in browser cache. Upgrade to sync with cloud database across devices."
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/40 text-stone-400 hover:text-amber-300 rounded-full text-xs font-mono transition cursor-pointer group"
                >
                  <Database className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-400" />
                  <span>Local Cache Mode</span>
                  <span className="text-[10px] text-amber-400/90 font-bold ml-1">Unlock Cloud Sync ✨</span>
                </button>
              )}
            </div>
            <p className="text-stone-400 text-sm max-w-2xl leading-relaxed">
              Explore pre-loaded SRD rules library or create custom entries. DM homebrew weapons, spells, monsters, and features automatically save and can be added directly to any character sheet or encounter!
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowLegalModal(true)}
              className="px-4 py-3 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border border-stone-800 hover:border-amber-500/40 font-bold rounded-2xl transition flex items-center justify-center gap-2 shrink-0 text-sm cursor-pointer shadow-md"
              title="Open Gaming Licenses, SRD 5.1 Creative Commons notice, OGL 1.0a, and non-affiliation disclaimers"
            >
              <Scale className="w-4 h-4 text-amber-400" />
              <span>Legal & Licenses</span>
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 shrink-0 text-sm cursor-pointer"
            >
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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-stone-900 text-amber-400 border border-stone-800">
                          {item.category}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-stone-900 text-stone-400 border border-stone-800">
                          {item.edition || '5e'}
                        </span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                          isCustom
                            ? 'bg-violet-950/60 text-violet-300 border-violet-700/50'
                            : item.edition === '3.5e'
                            ? 'bg-amber-950/50 text-amber-300 border-amber-600/40'
                            : item.edition === 'pathfinder'
                            ? 'bg-purple-950/50 text-purple-300 border-purple-600/40'
                            : 'bg-blue-950/50 text-blue-300 border-blue-600/40'
                        }`}>
                          {isCustom ? 'Homebrew' : item.edition === '3.5e' ? 'OGL 1.0a' : item.edition === 'pathfinder' ? 'ORC' : 'CC-BY-4.0'}
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
                        <>
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditModal(item, e)}
                            title="Edit Custom Entry"
                            className="p-1.5 text-stone-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustom(item, e)}
                            title="Delete Custom Entry"
                            className="p-1.5 text-stone-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
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
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold uppercase px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                  {selectedDetailItem.category}
                </span>
                <span className="text-xs font-mono text-stone-400">
                  {selectedDetailItem.edition || '5e'} System • {selectedDetailItem.source}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  selectedDetailItem.isCustom
                    ? 'bg-violet-950/60 text-violet-300 border-violet-700/50'
                    : selectedDetailItem.edition === '3.5e'
                    ? 'bg-amber-950/50 text-amber-300 border-amber-600/40'
                    : selectedDetailItem.edition === 'pathfinder'
                    ? 'bg-purple-950/50 text-purple-300 border-purple-600/40'
                    : 'bg-blue-950/50 text-blue-300 border-blue-600/40'
                }`}>
                  {selectedDetailItem.isCustom ? 'User Homebrew' : selectedDetailItem.edition === '3.5e' ? 'SRD 3.5 (OGL 1.0a)' : selectedDetailItem.edition === 'pathfinder' ? 'Pathfinder (ORC / OGL)' : 'SRD 5.1 (CC-BY-4.0)'}
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

                  {/* 3.5e Combat & Defenses Bar */}
                  {m.edition === '3.5e' && (
                    <div className="bg-stone-900/90 border border-amber-500/20 p-3 rounded-2xl space-y-2">
                      <div className="text-[11px] font-mono text-amber-300 font-bold uppercase tracking-wider flex items-center justify-between">
                        <span>🛡️ 3.5e Combat & Defenses</span>
                        {m.senses && <span className="text-stone-400 font-normal lowercase">{m.senses}</span>}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                        <div className="bg-stone-950/80 border border-stone-800/80 p-1.5 rounded-xl">
                          <div className="text-[10px] text-stone-400 font-mono">Touch AC</div>
                          <div className="font-bold text-stone-200">{m.touchAcOverride ?? 10}</div>
                        </div>
                        <div className="bg-stone-950/80 border border-stone-800/80 p-1.5 rounded-xl">
                          <div className="text-[10px] text-stone-400 font-mono">Flat-Footed AC</div>
                          <div className="font-bold text-stone-200">{m.flatFootedAcOverride ?? m.armorClass ?? 10}</div>
                        </div>
                        <div className="bg-stone-950/80 border border-stone-800/80 p-1.5 rounded-xl">
                          <div className="text-[10px] text-stone-400 font-mono">Base Attack (BAB)</div>
                          <div className="font-bold text-amber-400">+{m.bab ?? 0}</div>
                        </div>
                        <div className="bg-stone-950/80 border border-stone-800/80 p-1.5 rounded-xl">
                          <div className="text-[10px] text-stone-400 font-mono">DR / SR</div>
                          <div className="font-bold text-emerald-400">
                            {m.damageReductionValue ? `DR ${m.damageReductionValue}/${m.damageReductionBypass}` : m.spellResist ? `SR ${m.spellResist}` : '—'}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                        <div className="bg-stone-950/60 border border-stone-800/60 p-1.5 rounded-lg flex items-center justify-center gap-1.5">
                          <span className="text-[10px] font-mono text-stone-400">Fort:</span>
                          <span className="font-bold text-stone-100">{formatModifier((m.fortSaveBase || 0) + getAbilityModifier(m.abilities?.CON?.score || 10))}</span>
                        </div>
                        <div className="bg-stone-950/60 border border-stone-800/60 p-1.5 rounded-lg flex items-center justify-center gap-1.5">
                          <span className="text-[10px] font-mono text-stone-400">Ref:</span>
                          <span className="font-bold text-stone-100">{formatModifier((m.refSaveBase || 0) + getAbilityModifier(m.abilities?.DEX?.score || 10))}</span>
                        </div>
                        <div className="bg-stone-950/60 border border-stone-800/60 p-1.5 rounded-lg flex items-center justify-center gap-1.5">
                          <span className="text-[10px] font-mono text-stone-400">Will:</span>
                          <span className="font-bold text-stone-100">{formatModifier((m.willSaveBase || 0) + getAbilityModifier(m.abilities?.WIS?.score || 10))}</span>
                        </div>
                      </div>
                    </div>
                  )}

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
                                <p className="text-xs text-stone-300 italic bg-stone-950/50 p-1.5 rounded-lg border border-stone-800">
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
                {(selectedDetailItem.edition === '5e' || !selectedDetailItem.edition) && selectedDetailItem.itemData.attunement && <div>Attunement: <strong className="text-rose-400">Required</strong></div>}
              </div>
            )}

            {selectedDetailItem.category === 'feats' && selectedDetailItem.featData && (
              <div className="bg-stone-900/80 border border-stone-800 p-3.5 rounded-2xl space-y-2 text-xs font-mono">
                {selectedDetailItem.featData.prerequisite && (
                  <div>Prerequisite: <strong className="text-amber-300">{selectedDetailItem.featData.prerequisite}</strong></div>
                )}
                {selectedDetailItem.featData.actionType && (
                  <div>Action Economy: <strong className="text-stone-300">{selectedDetailItem.featData.actionType}</strong></div>
                )}
                {selectedDetailItem.featData.statBonus && (
                  <div>Stat Bonus: <strong className="text-indigo-300">{selectedDetailItem.featData.statBonus}</strong></div>
                )}
                {selectedDetailItem.featData.hpPerLevel !== undefined && selectedDetailItem.featData.hpPerLevel !== 0 && (
                  <div className="flex items-center gap-1.5 text-rose-300">
                    <span>❤️</span>
                    <span>HP Scaling: <strong className="text-rose-200">+{selectedDetailItem.featData.hpPerLevel} HP per level</strong></span>
                  </div>
                )}
                {selectedDetailItem.featData.hpMaxBonus !== undefined && selectedDetailItem.featData.hpMaxBonus !== 0 && (
                  <div className="flex items-center gap-1.5 text-rose-300">
                    <span>❤️</span>
                    <span>Max HP Bonus: <strong className="text-rose-200">+{selectedDetailItem.featData.hpMaxBonus} HP</strong></span>
                  </div>
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

            {selectedDetailItem.category === 'races' && selectedDetailItem.raceData && (() => {
              const darkvisionDisplay = (() => {
                const dv = selectedDetailItem.raceData.darkvision;
                if (typeof dv === 'number') return `${dv} ft`;
                if (dv === true) return '60 ft';
                if (typeof dv === 'string' && dv.trim()) {
                  return dv.includes('ft') ? dv : `${dv} ft`;
                }
                if (selectedDetailItem.raceData.senses?.toLowerCase().includes('darkvision')) {
                  return selectedDetailItem.raceData.senses;
                }
                return 'None';
              })();

              const fullText = [
                selectedDetailItem.description,
                ...(selectedDetailItem.raceData.traits || []).map(t => `${t.name}: ${t.description}`)
              ].join(' ');

              const currentLvl = activeCharacter?.level || 1;

              const detectedDr = (() => {
                const rd = selectedDetailItem.raceData;
                if (rd.damageReductionScaling && rd.damageReductionScaling.length > 0) {
                  return {
                    value: getScalingStatAtLevel(rd.damageReductionScaling, currentLvl),
                    bypass: rd.damageReductionBypass || '-',
                    progression: rd.damageReductionScalingProgression || rd.damageReductionScaling.map(s => `${s.value}@Lv${s.level}`).join('/')
                  };
                }
                if (rd.damageReductionValue !== undefined) {
                  return {
                    value: rd.damageReductionValue,
                    bypass: rd.damageReductionBypass || '-',
                    progression: rd.damageReductionScalingProgression
                  };
                }
                const parsed = parseDamageReductionFromText(fullText, currentLvl);
                if (parsed) {
                  return {
                    value: parsed.value,
                    bypass: parsed.bypass || '-',
                    progression: parsed.scalingProgression
                  };
                }
                return null;
              })();

              const detectedNatArmor = (() => {
                const rd = selectedDetailItem.raceData;
                if (rd.naturalArmorScaling && rd.naturalArmorScaling.length > 0) {
                  return {
                    value: getScalingStatAtLevel(rd.naturalArmorScaling, currentLvl),
                    progression: rd.naturalArmorScalingProgression || rd.naturalArmorScaling.map(s => `+${s.value}@Lv${s.level}`).join('/')
                  };
                }
                if (rd.naturalArmorBonus !== undefined) {
                  return {
                    value: rd.naturalArmorBonus,
                    progression: rd.naturalArmorScalingProgression
                  };
                }
                const parsed = parseNaturalArmorFromText(fullText, currentLvl);
                if (parsed) {
                  return {
                    value: parsed.value,
                    progression: parsed.scalingProgression
                  };
                }
                return null;
              })();

              const detectedSr = (() => {
                const rd = selectedDetailItem.raceData;
                if (rd.spellResistanceScaling && rd.spellResistanceScaling.length > 0) {
                  const extra = getScalingStatAtLevel(rd.spellResistanceScaling, currentLvl);
                  return {
                    value: (rd.spellResistanceBase || 10) + extra,
                    progression: rd.spellResistanceScalingProgression
                  };
                }
                if (rd.spellResistanceBase !== undefined) {
                  return {
                    value: rd.spellResistanceBase,
                    progression: rd.spellResistanceScalingProgression
                  };
                }
                const parsed = parseSpellResistanceFromText(fullText, currentLvl);
                if (parsed) {
                  return {
                    value: parsed.value,
                    progression: parsed.scalingProgression
                  };
                }
                return null;
              })();

              const abilityBonusesDisplay = (() => {
                if (selectedDetailItem.raceData.abilityBonuses && selectedDetailItem.raceData.abilityBonuses.length > 0) {
                  return selectedDetailItem.raceData.abilityBonuses
                    .map(b => `${b.bonus >= 0 ? '+' : ''}${b.bonus} ${b.ability}`)
                    .join(', ');
                }
                if (selectedDetailItem.raceData.abilityBonusesStr) {
                  return selectedDetailItem.raceData.abilityBonusesStr;
                }
                const parsed = parseAbilityScoreBonuses(selectedDetailItem.description);
                if (parsed.length > 0) {
                  return parsed.map(b => `${b.value >= 0 ? '+' : ''}${b.value} ${b.stat}`).join(', ');
                }
                return 'None / Standard';
              })();

              const rd = selectedDetailItem.raceData;

              return (
                <div className="space-y-3 bg-stone-900/80 border border-stone-800 p-4 rounded-2xl text-xs text-stone-300">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                    <div>Speed: <strong className="text-amber-400">{rd.speed || 30} ft</strong></div>
                    <div>Size: <strong className="text-cyan-300">{rd.size || 'Medium'}</strong></div>
                    <div>Darkvision: <strong className="text-purple-300">{darkvisionDisplay}</strong></div>
                    <div>Type: <strong className="text-emerald-300">{rd.creatureType || 'Humanoid'}</strong></div>
                  </div>

                  {/* Ability Modifiers & Core Defenses summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-stone-800/80 font-mono text-xs">
                    <div>
                      <span className="text-stone-400">Ability Modifiers: </span>
                      <strong className="text-amber-300">{abilityBonusesDisplay}</strong>
                    </div>
                    {detectedDr && (
                      <div>
                        <span className="text-stone-400">Damage Reduction: </span>
                        <strong className="text-sky-300">DR {detectedDr.value}/{detectedDr.bypass}</strong>
                        {detectedDr.progression && (
                          <span className="text-[10px] text-stone-500 block">Scaling: {detectedDr.progression}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 3.5e Defenses: Natural Armor, SR, Energy Resistances, Immunities */}
                  {(detectedNatArmor || detectedSr || (rd.energyResistances && rd.energyResistances.length > 0) || (rd.immunities && rd.immunities.length > 0)) && (
                    <div className="p-2.5 rounded-xl bg-stone-950/70 border border-stone-800/80 space-y-1.5 font-mono text-xs">
                      <div className="text-[11px] text-amber-400 uppercase font-bold tracking-wider">Defenses & Resistances</div>
                      <div className="flex flex-wrap gap-2">
                        {detectedNatArmor && (
                          <span className="px-2 py-0.5 rounded-md bg-stone-800 border border-stone-700 text-stone-200">
                            Natural Armor: <strong className="text-emerald-300">+{detectedNatArmor.value}</strong>
                            {detectedNatArmor.progression && <span className="text-[10px] text-stone-400 ml-1">({detectedNatArmor.progression})</span>}
                          </span>
                        )}
                        {detectedSr && (
                          <span className="px-2 py-0.5 rounded-md bg-stone-800 border border-stone-700 text-stone-200">
                            Spell Resistance: <strong className="text-purple-300">{detectedSr.value}</strong>
                            {detectedSr.progression && <span className="text-[10px] text-stone-400 ml-1">({detectedSr.progression})</span>}
                          </span>
                        )}
                        {rd.energyResistances && rd.energyResistances.map((er, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-amber-950/40 border border-amber-800/60 text-amber-200">
                            Resist {er.energyType} {er.scaling ? getScalingStatAtLevel(er.scaling, currentLvl) : er.value}
                            {er.scalingProgression && <span className="text-[10px] text-amber-400/70 ml-1">({er.scalingProgression})</span>}
                          </span>
                        ))}
                        {rd.immunities && rd.immunities.map((imm, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-800/60 text-emerald-200">
                            Immune: {imm}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 5e Defenses & Racial Mechanics */}
                  {(rd.damageResistances5e?.length || rd.conditionImmunities5e?.length || rd.naturalArmorFormula5e || rd.scalingRacialDice5e) && (
                    <div className="p-2.5 rounded-xl bg-stone-950/70 border border-stone-800/80 space-y-1.5 font-mono text-xs">
                      <div className="text-[11px] text-cyan-400 uppercase font-bold tracking-wider">5e Racial Features</div>
                      <div className="flex flex-wrap gap-2">
                        {rd.damageResistances5e && rd.damageResistances5e.length > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-sky-950/40 border border-sky-800/60 text-sky-200">
                            Resistances: <strong>{rd.damageResistances5e.join(', ')}</strong>
                          </span>
                        )}
                        {rd.conditionImmunities5e && rd.conditionImmunities5e.length > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-950/40 border border-indigo-800/60 text-indigo-200">
                            Condition Immunities: <strong>{rd.conditionImmunities5e.join(', ')}</strong>
                          </span>
                        )}
                        {rd.naturalArmorFormula5e && (
                          <span className="px-2 py-0.5 rounded-md bg-stone-800 border border-stone-700 text-stone-200">
                            AC Formula: <strong>{rd.naturalArmorFormula5e}</strong>
                          </span>
                        )}
                        {rd.scalingRacialDice5e && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-950/40 border border-purple-800/60 text-purple-200">
                            {rd.scalingRacialDice5e.name}: <strong>{rd.scalingRacialDice5e.progression}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Natural Weapons */}
                  {rd.naturalWeapons && rd.naturalWeapons.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-stone-950/70 border border-stone-800/80 space-y-1.5 font-mono text-xs">
                      <div className="text-[11px] text-rose-400 uppercase font-bold tracking-wider">Natural Weapons</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {rd.naturalWeapons.map((nw, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-300">
                            <span className="font-bold text-rose-300">{nw.name}</span>
                            <span className="text-amber-300">{nw.damage} + {nw.ability || 'STR'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skill Affinities */}
                  {rd.skillAffinities && (
                    <div className="p-2 rounded-xl bg-stone-950/60 border border-stone-800 text-xs font-mono">
                      <span className="text-amber-400 font-bold mr-1.5">Skill Affinities:</span>
                      <span className="text-stone-300">
                        {typeof rd.skillAffinities === 'string'
                          ? rd.skillAffinities
                          : Array.isArray(rd.skillAffinities)
                          ? rd.skillAffinities.map((sa: any) => `+${sa.bonus || 2} ${sa.skill}`).join(', ')
                          : ''}
                      </span>
                    </div>
                  )}

                  {/* Spell-Like Abilities (SLAs) */}
                  {rd.spellLikeAbilities && rd.spellLikeAbilities.length > 0 && (
                    <div className="pt-2 border-t border-stone-800/80 space-y-1.5">
                      <div className="text-[11px] font-mono text-cyan-300 uppercase font-bold">Spell-Like Abilities (SLAs):</div>
                      <div className="space-y-1 font-mono text-xs">
                        {rd.spellLikeAbilities.map((sla, idx) => {
                          const isUnlocked = currentLvl >= (sla.minLevel || 1);
                          return (
                            <div key={idx} className={`p-2 rounded-lg border flex flex-wrap items-center justify-between gap-1.5 ${isUnlocked ? 'bg-cyan-950/20 border-cyan-800/50 text-cyan-200' : 'bg-stone-950/40 border-stone-800/40 text-stone-500'}`}>
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 rounded bg-stone-800 text-[10px] text-stone-300 font-bold">{sla.levelRange || `Lv ${sla.minLevel}+`}</span>
                                <strong className="text-stone-200">{sla.spellName}</strong>
                              </div>
                              <div className="text-[11px] text-stone-400">
                                <span className="text-amber-300 font-bold">{sla.usage}</span>
                                {sla.notes && <span className="ml-1.5 text-stone-500">({sla.notes})</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 5e Innate Spells */}
                  {rd.innateSpells5e && rd.innateSpells5e.length > 0 && (
                    <div className="pt-2 border-t border-stone-800/80 space-y-1.5">
                      <div className="text-[11px] font-mono text-cyan-300 uppercase font-bold">Innate Spellcasting (5e):</div>
                      <div className="space-y-1 font-mono text-xs">
                        {rd.innateSpells5e.map((s, idx) => (
                          <div key={idx} className="p-2 rounded-lg border bg-cyan-950/20 border-cyan-800/50 text-cyan-200 flex items-center justify-between text-xs">
                            <span>Level {s.level}+: <strong>{s.spellName}</strong> ({s.ability || 'CHA'})</span>
                            <span className="text-amber-300">{s.recharge}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {rd.traits && rd.traits.length > 0 && (
                    <div className="pt-2 border-t border-stone-800/80 space-y-2">
                      <div className="text-[11px] font-mono text-amber-300 uppercase font-bold">Racial Traits:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {rd.traits.map((trait, idx) => (
                          <div key={idx} className="bg-stone-950/60 p-2.5 rounded-xl border border-stone-800 space-y-0.5">
                            <div className="font-bold text-amber-200">{trait.name}</div>
                            <p className="text-[11px] text-stone-400">{trait.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

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

            {/* Legal Provenance & Licensing Information */}
            <div className="bg-stone-900/60 border border-stone-800/80 rounded-2xl p-3.5 flex items-start gap-3 text-xs">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-bold text-stone-200">
                    {selectedDetailItem.isCustom
                      ? 'Custom Homebrew Content'
                      : selectedDetailItem.edition === '3.5e'
                      ? 'D&D 3.5e System Reference Document (OGL 1.0a)'
                      : selectedDetailItem.edition === 'pathfinder'
                      ? 'Pathfinder Reference Document (ORC / OGL)'
                      : '5e System Reference Document 5.1 (CC-BY-4.0)'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowLegalModal(true)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 underline font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <span>View License Terms</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  {selectedDetailItem.isCustom
                    ? 'Authored or imported locally by user. User retains all copyright and ownership over original homebrew.'
                    : selectedDetailItem.edition === '3.5e'
                    ? 'Open Game Content published under the Wizards of the Coast Open Game License v1.0a.'
                    : selectedDetailItem.edition === 'pathfinder'
                    ? 'Published under the Open Game License or Open RPG Creative License (Paizo Inc.).'
                    : 'System Reference Document 5.1 (“SRD 5.1”) by Wizards of the Coast LLC, licensed under Creative Commons Attribution 4.0 International (CC-BY-4.0).'}
                </p>
              </div>
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
                  <>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(selectedDetailItem)}
                      className="px-3.5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 hover:border-amber-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      title="Edit this entry & synchronize linked entities"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Edit Entry</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemToDelete(selectedDetailItem)}
                      className="px-3.5 py-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 border border-rose-800/50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      title="Delete custom entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Entry</span>
                    </button>
                  </>
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
          onClose={() => {
            setShowCustomModal(false);
            setEditingItem(null);
          }}
          activeCharacter={activeCharacter}
          onUpdateCharacter={onUpdateCharacter}
          onAddItemToInventory={onAddItemToInventory}
          editingItem={editingItem}
          correspondingEntitiesCount={editingItem ? countCorrespondingEntities(editingItem, allCharacters || []) : 0}
          onSaveEditedItem={handleSaveEditedItem}
          onSaved={(newItem) => {
            setCustomEntries(loadCustomCompendiumEntries());
            showToast(`✨ Created custom homebrew entry "${newItem.name}"!`);
            setShowCustomModal(false);
            setEditingItem(null);
          }}
          allCustomItems={customEntries}
          onImportCustomItems={(imported) => {
            setCustomEntries(imported);
            showToast('✨ Compendium entries refreshed!');
          }}
        />
      )}

      {/* LEGAL & LICENSING COMPLIANCE MODAL */}
      <LegalLicensingModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
      />
    </div>
  );
};
