import { useCallback, useSyncExternalStore } from 'react';
import { RuleEdition } from '../types';
import { systemRegistry } from '../systems';

export type LayoutFeatureId =
  // Sheet 1: Stats & Features
  | 's1_workspace'
  | 's1_characterHeader'
  | 's1_abilityScores'
  | 's1_savingThrows35e'
  | 's1_sanityMadness'
  | 's1_skills'
  | 's1_classFeatures'
  | 's1_feats'
  // Sheet 2: Combat
  | 's2_vitalityHpOrb'
  | 's2_defenseStats'
  | 's2_deathSavesForm'
  | 's2_resistancesDr'
  | 's2_conditionsPanel'
  | 's2_encounterTracker'
  | 's2_attacksWeapons'
  | 's2_combatSpellsPotions'
  // Sheet 3: Gear & Wealth
  | 's3_wealthCurrency'
  | 's3_magicAttunement'
  | 's3_encumbrance'
  | 's3_inventoryList'
  // Sheet 4: Spells
  | 's4_spellcastingStats'
  | 's4_spellbookList'
  // Sheet 5: Description & Notes
  | 's5_appearanceDemographics'
  | 's5_roleplayingTraits'
  | 's5_backstory'
  | 's5_alliesFactionsNotes'
  // Shadowrun Specific
  | 'sr_stats'
  | 'sr_skills'
  | 'sr_combat'
  | 'sr_matrix'
  | 'sr_spells'
  // Global UI
  | 'ui_quickStatsBar';

export type SheetCategory = 'sheet1' | 'sheet2' | 'sheet3' | 'sheet4' | 'sheet5' | 'shadowrun' | 'global';

export interface LayoutFeatureDef {
  id: LayoutFeatureId | string;
  name: string;
  sheet: SheetCategory;
  sheetLabel: string;
  description: string;
  defaultEnabled: boolean;
  category: string;
  editions?: (RuleEdition | 'all' | string)[];
}

export const ALL_LAYOUT_FEATURES: LayoutFeatureDef[] = [
  // Sheet 1: Stats & Features
  {
    id: 's1_workspace',
    name: 'Workspace Dashboard',
    sheet: 'sheet1',
    sheetLabel: 'Stats & Features',
    description: 'Pinned quick-access widget bar with character vitals, initiative counter, quick scratchpad notes, quest log and dice tray.',
    defaultEnabled: true,
    category: 'Dashboard & Quick Tools',
    editions: ['all']
  },
  {
    id: 's1_characterHeader',
    name: 'Character Profile Header',
    sheet: 'sheet1',
    sheetLabel: 'Stats & Features',
    description: 'Character portrait, identity info, race, class, level advancement button, XP progress and Inspiration badge.',
    defaultEnabled: true,
    category: 'Core Character Identity',
    editions: ['5e', '3.5e', 'pathfinder', 'cthulhu']
  },
  {
    id: 's1_abilityScores',
    name: 'Ability Scores & Modifiers',
    sheet: 'sheet1',
    sheetLabel: 'Stats & Features',
    description: 'STR, DEX, CON, INT, WIS, CHA scores, modifier calculations, saving throw proficiencies and ability check rollers.',
    defaultEnabled: true,
    category: 'Core Attributes',
    editions: ['5e', '3.5e', 'pathfinder', 'cthulhu']
  },
  {
    id: 's1_savingThrows35e',
    name: '3.5e Saving Throws (Fort / Ref / Will)',
    sheet: 'sheet1',
    sheetLabel: 'Stats & Features',
    description: 'Dedicated 3.5e D&D / Pathfinder Fortitude, Reflex, and Will saving throw modifier calculators and direct roll triggers.',
    defaultEnabled: true,
    category: '3.5e & Pathfinder Mechanics',
    editions: ['3.5e', 'pathfinder']
  },
  {
    id: 's1_sanityMadness',
    name: 'Sanity & Madness Panel',
    sheet: 'sheet1',
    sheetLabel: 'Stats & Features',
    description: 'Call of Cthulhu / optional DMG p.264 sanity score tracker, madness thresholds and mental trauma status effects.',
    defaultEnabled: true,
    category: 'Sanity & Horror',
    editions: ['cthulhu', '5e']
  },
  {
    id: 's1_skills',
    name: 'Skills & Proficiencies List',
    sheet: 'sheet1',
    sheetLabel: 'Stats & Features',
    description: 'Full interactive skill list with proficient/expertise toggles, 3.5e skill rank allocations, and one-click D20 skill checks.',
    defaultEnabled: true,
    category: 'Skills & Proficiencies',
    editions: ['5e', '3.5e', 'pathfinder', 'cthulhu']
  },
  {
    id: 's1_classFeatures',
    name: 'Class Features & Resource Counters',
    sheet: 'sheet1',
    sheetLabel: 'Stats & Features',
    description: 'Class archetype features, Ki/Rage/Sorcery point counters, recharge triggers (Short/Long Rest), Shapeshift and Summon shortcuts.',
    defaultEnabled: true,
    category: 'Class Mechanics',
    editions: ['5e', '3.5e', 'pathfinder']
  },
  {
    id: 's1_feats',
    name: 'Feats & Special Traits',
    sheet: 'sheet1',
    sheetLabel: 'Stats & Features',
    description: 'Active character feats, racial traits, prerequisites, HP bonus contributions and homebrew abilities.',
    defaultEnabled: true,
    category: 'Feats & Traits',
    editions: ['5e', '3.5e', 'pathfinder']
  },

  // Sheet 2: Combat
  {
    id: 's2_vitalityHpOrb',
    name: 'Vitality & HP Orb / Rest Controls',
    sheet: 'sheet2',
    sheetLabel: 'Combat',
    description: 'Animated 3D liquid HP orb, Temp HP adjuster, Max HP formula inspector, and Short / Long Rest Hit Dice modal launcher.',
    defaultEnabled: true,
    category: 'Vitality & Health',
    editions: ['5e', '3.5e', 'pathfinder', 'cthulhu']
  },
  {
    id: 's2_defenseStats',
    name: 'Armor Class, Initiative & Speed',
    sheet: 'sheet2',
    sheetLabel: 'Combat',
    description: 'AC calculation breakdown, DEX initiative roller, speed modifiers (encumbrance/armor), Touch AC and Flat-Footed AC.',
    defaultEnabled: true,
    category: 'Defenses & Movement',
    editions: ['5e', '3.5e', 'pathfinder', 'cthulhu']
  },
  {
    id: 's2_deathSavesForm',
    name: 'Death Saves & Transformation Bar',
    sheet: 'sheet2',
    sheetLabel: 'Combat',
    description: '3-success / 3-failure death save tracker, automated Nat 20/Nat 1 roller, Shapeshift (Wild Shape) and Summon engine launcher.',
    defaultEnabled: true,
    category: 'Life & Form',
    editions: ['5e', '3.5e', 'pathfinder']
  },
  {
    id: 's2_resistancesDr',
    name: 'Resistances, Immunities & DR',
    sheet: 'sheet2',
    sheetLabel: 'Combat',
    description: 'Collapsible damage resistance badges (50%), damage immunities (100%), and flat Damage Reduction (DR) calculations.',
    defaultEnabled: true,
    category: 'Damage Mitigation',
    editions: ['5e', '3.5e', 'pathfinder', 'cthulhu']
  },
  {
    id: 's2_conditionsPanel',
    name: 'Active Conditions & Status Effects',
    sheet: 'sheet2',
    sheetLabel: 'Combat',
    description: 'Exhaustion levels 1-6, Blinded, Charmed, Paralyzed, Poisoned, Stunned, Prone, and custom affliction tracking tags.',
    defaultEnabled: true,
    category: 'Conditions & Afflictions',
    editions: ['5e', '3.5e', 'pathfinder', 'cthulhu']
  },
  {
    id: 's2_encounterTracker',
    name: 'Interactive Encounter & Initiative Tracker',
    sheet: 'sheet2',
    sheetLabel: 'Combat',
    description: 'Party & monster turn-order manager, combat round counter, initiative sorter, active turn highlighter and audio bells.',
    defaultEnabled: true,
    category: 'Encounter Management',
    editions: ['5e', '3.5e', 'pathfinder', 'cthulhu']
  },
  {
    id: 's2_attacksWeapons',
    name: 'Weapons, Spell Attacks & Maneuvers',
    sheet: 'sheet2',
    sheetLabel: 'Combat',
    description: 'Weapon attack rolls, damage dice expressions, versatile/finesse properties, custom attack builder and rules cheat sheet.',
    defaultEnabled: true,
    category: 'Attacks & Offense',
    editions: ['5e', '3.5e', 'pathfinder', 'cthulhu']
  },
  {
    id: 's2_combatSpellsPotions',
    name: 'Combat Spells & Potions Quick Bar',
    sheet: 'sheet2',
    sheetLabel: 'Combat',
    description: 'Quick-access prepared spell casting bar with automatic slot deduction and inventory healing potion drinking buttons.',
    defaultEnabled: true,
    category: 'Quick Combat Actions',
    editions: ['5e', '3.5e', 'pathfinder']
  },

  // Sheet 3: Gear & Wealth
  {
    id: 's3_wealthCurrency',
    name: 'Coinage, Currency & Vault',
    sheet: 'sheet3',
    sheetLabel: 'Gear & Wealth',
    description: 'CP, SP, EP, GP, PP coin pouches, total Gold conversion value, currency exchange rates, and vault storage balance.',
    defaultEnabled: true,
    category: 'Treasury & Coins',
    editions: ['5e', '3.5e', 'pathfinder', 'cthulhu']
  },
  {
    id: 's3_magicAttunement',
    name: 'Magic Item Attunement Slots',
    sheet: 'sheet3',
    sheetLabel: 'Gear & Wealth',
    description: 'Standard 3-slot attunement manager for magical rings, cloaks, artifacts, and attunement requirement warnings.',
    defaultEnabled: true,
    category: 'Magic Items',
    editions: ['5e', '3.5e', 'pathfinder']
  },
  {
    id: 's3_encumbrance',
    name: 'Carrying Capacity & Encumbrance',
    sheet: 'sheet3',
    sheetLabel: 'Gear & Wealth',
    description: 'Total carried weight vs STR capacity bar, variant encumbrance penalties, push/drag/lift maximums and Powerful Build bonuses.',
    defaultEnabled: true,
    category: 'Weight & Capacity',
    editions: ['5e', '3.5e', 'pathfinder', 'cthulhu']
  },
  {
    id: 's3_inventoryList',
    name: 'Equipment & Inventory Manager',
    sheet: 'sheet3',
    sheetLabel: 'Gear & Wealth',
    description: 'Categorized gear, armor, weapons, consumable items, weight/quantity trackers, equip toggles, stash markers and item search.',
    defaultEnabled: true,
    category: 'Inventory Items',
    editions: ['5e', '3.5e', 'pathfinder', 'cthulhu']
  },

  // Sheet 4: Spells
  {
    id: 's4_spellcastingStats',
    name: 'Spellcasting Stats & Slot Tracker',
    sheet: 'sheet4',
    sheetLabel: 'Spells',
    description: 'Spellcasting ability modifier, Spell Save DC, Spell Attack Bonus, and Level 1 to 9 interactive slot tracker pips.',
    defaultEnabled: true,
    category: 'Spellcasting Core',
    editions: ['5e', '3.5e', 'pathfinder']
  },
  {
    id: 's4_spellbookList',
    name: 'Spellbook & Grimoire List',
    sheet: 'sheet4',
    sheetLabel: 'Spells',
    description: 'Cantrips through 9th level spellbook, ritual casting tags, prepared toggles, component indicators (V,S,M) and targeted spell casting.',
    defaultEnabled: true,
    category: 'Grimoire & Spells',
    editions: ['5e', '3.5e', 'pathfinder', 'cthulhu']
  },

  // Sheet 5: Description & Notes
  {
    id: 's5_appearanceDemographics',
    name: 'Character Description & Demographics',
    sheet: 'sheet5',
    sheetLabel: 'Description & Notes',
    description: 'Gender, age, height, weight, eyes, hair, skin, creature size category (Tiny to Colossal) and powerful build modifiers.',
    defaultEnabled: true,
    category: 'Physical Appearance',
    editions: ['all']
  },
  {
    id: 's5_roleplayingTraits',
    name: 'Roleplaying Traits & Personality',
    sheet: 'sheet5',
    sheetLabel: 'Description & Notes',
    description: 'Formatted text editors for Personality Traits, Ideals, Bonds, and Flaws with markdown support.',
    defaultEnabled: true,
    category: 'Roleplay Traits',
    editions: ['all']
  },
  {
    id: 's5_backstory',
    name: 'Character Backstory & Origins',
    sheet: 'sheet5',
    sheetLabel: 'Description & Notes',
    description: 'Full-length narrative backstory editor for character history, defining moments, mentors and origin tales.',
    defaultEnabled: true,
    category: 'Narrative Backstory',
    editions: ['all']
  },
  {
    id: 's5_alliesFactionsNotes',
    name: 'Allies, Factions & Campaign Quest Log',
    sheet: 'sheet5',
    sheetLabel: 'Description & Notes',
    description: 'Guild memberships, faction standings, NPC contacts, dungeon clues, active quests, and campaign session scratchpad.',
    defaultEnabled: true,
    category: 'Campaign & Quest Log',
    editions: ['all']
  },

  // Shadowrun System Features
  {
    id: 'sr_stats',
    name: 'Shadowrun Attributes & Cyberware',
    sheet: 'shadowrun',
    sheetLabel: 'Shadowrun Panels',
    description: 'Body, Agility, Reaction, Strength, Willpower, Logic, Intuition, Charisma, Edge, Essence and installed Cyberware.',
    defaultEnabled: true,
    category: 'Shadowrun Core',
    editions: ['shadowrun']
  },
  {
    id: 'sr_skills',
    name: 'Shadowrun Skills & Dice Pool Roller',
    sheet: 'shadowrun',
    sheetLabel: 'Shadowrun Panels',
    description: 'Shadowrun 5e combat, physical, matrix, and social skills with D6 dice pool calculations and glitch detection.',
    defaultEnabled: true,
    category: 'Shadowrun Skills',
    editions: ['shadowrun']
  },
  {
    id: 'sr_combat',
    name: 'Shadowrun Combat & Condition Monitors',
    sheet: 'shadowrun',
    sheetLabel: 'Shadowrun Panels',
    description: 'Physical & Stun damage condition monitor tracks, wound penalties, ballistic/impact armor, and firearm fire modes.',
    defaultEnabled: true,
    category: 'Shadowrun Combat',
    editions: ['shadowrun']
  },
  {
    id: 'sr_matrix',
    name: 'Shadowrun Matrix, Decks & Vehicles',
    sheet: 'shadowrun',
    sheetLabel: 'Shadowrun Panels',
    description: 'Cyberdeck ratings, attack/sleaze/firewall programs, Overwatch score counter, and rigger vehicle drone stats.',
    defaultEnabled: true,
    category: 'Shadowrun Matrix & Rigging',
    editions: ['shadowrun']
  },
  {
    id: 'sr_spells',
    name: 'Shadowrun Spells, Adept Powers & Complex Forms',
    sheet: 'shadowrun',
    sheetLabel: 'Shadowrun Panels',
    description: 'Awakened magic spells, adept powers, drain resistance calculations, and technomancer complex forms.',
    defaultEnabled: true,
    category: 'Shadowrun Magic',
    editions: ['shadowrun']
  },

  // Global UI
  {
    id: 'ui_quickStatsBar',
    name: 'Quick Stats Header Bar',
    sheet: 'global',
    sheetLabel: 'Global UI',
    description: 'Persistent top quick-glance bar showing HP, AC, Speed, Passive Perception, and Spell Save DC.',
    defaultEnabled: true,
    category: 'Navigation & Headers',
    editions: ['all']
  }
];

/**
 * Dynamically resolves all layout features applicable to a specific TRPG edition.
 * Integrates directly with systemRegistry: automatically includes any custom layout features
 * provided by newly installed or future game system plugins.
 */
export function getFeaturesForEdition(edition: RuleEdition | string = '5e'): LayoutFeatureDef[] {
  // 1. Filter core ALL_LAYOUT_FEATURES
  const coreFeatures = ALL_LAYOUT_FEATURES.filter(f => {
    if (!f.editions || f.editions.includes('all')) return true;
    return f.editions.includes(edition as RuleEdition);
  });

  // 2. Query systemRegistry for dynamic layoutFeatures if present
  try {
    const system = systemRegistry.getSystem(edition as RuleEdition);
    if (system && Array.isArray(system.layoutFeatures) && system.layoutFeatures.length > 0) {
      const existingIds = new Set(coreFeatures.map(f => f.id));
      const extraFeatures = (system.layoutFeatures as LayoutFeatureDef[]).filter(
        (f) => !existingIds.has(f.id)
      );
      return [...coreFeatures, ...extraFeatures];
    }
  } catch (e) {
    console.error('Error fetching dynamic layout features for edition:', e);
  }

  return coreFeatures;
}

/**
 * Returns the list of sheet categories that have at least one feature for the specified edition.
 */
export function getSheetsForEdition(edition: RuleEdition | string = '5e'): SheetCategory[] {
  const features = getFeaturesForEdition(edition);
  const sheetSet = new Set<SheetCategory>();
  features.forEach(f => sheetSet.add(f.sheet));

  const standardOrder: SheetCategory[] = ['sheet1', 'sheet2', 'sheet3', 'sheet4', 'sheet5', 'shadowrun', 'global'];
  return standardOrder.filter(sheet => sheetSet.has(sheet));
}

const STORAGE_KEY_LAYOUT_SETTINGS = 'penpaper_layout_settings_v2';
const EVENT_LAYOUT_CHANGED = 'penpaper_layout_settings_changed';

let currentSettings: Record<LayoutFeatureId, boolean> | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Error notifying layout settings listener:', e);
    }
  });
}

/**
 * Returns default settings map with all features set to their defaultEnabled value.
 */
export function getDefaultLayoutSettings(): Record<LayoutFeatureId, boolean> {
  const settings = {} as Record<LayoutFeatureId, boolean>;
  ALL_LAYOUT_FEATURES.forEach((feature) => {
    settings[feature.id as LayoutFeatureId] = feature.defaultEnabled;
  });
  return settings;
}

/**
 * Load saved layout settings from localStorage or defaults.
 */
export function getLayoutSettings(): Record<LayoutFeatureId, boolean> {
  if (currentSettings) {
    return currentSettings;
  }
  const defaults = getDefaultLayoutSettings();
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LAYOUT_SETTINGS);
    if (saved) {
      const parsed = JSON.parse(saved);
      currentSettings = { ...defaults, ...parsed };
      return currentSettings;
    }
  } catch (e) {
    console.error('Failed to parse layout settings from storage:', e);
  }
  currentSettings = defaults;
  return currentSettings;
}

/**
 * Persist layout settings to localStorage and notify all active components.
 */
export function saveLayoutSettings(settings: Record<LayoutFeatureId, boolean>): void {
  currentSettings = settings;
  try {
    localStorage.setItem(STORAGE_KEY_LAYOUT_SETTINGS, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent(EVENT_LAYOUT_CHANGED, { detail: settings }));
  } catch (e) {
    console.error('Failed to save layout settings:', e);
  }
  notifyListeners();
}

/**
 * Check if a single feature is currently visible.
 */
export function isFeatureVisible(featureId: LayoutFeatureId | string): boolean {
  const settings = getLayoutSettings();
  return (settings as any)[featureId] !== false;
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);

  const handleStorageOrEvent = (e: Event) => {
    if (e.type === EVENT_LAYOUT_CHANGED) {
      const customEvent = e as CustomEvent<Record<LayoutFeatureId, boolean>>;
      if (customEvent.detail && customEvent.detail !== currentSettings) {
        currentSettings = customEvent.detail;
      }
    } else {
      // Storage event from another window/tab
      currentSettings = null;
      getLayoutSettings();
    }
    callback();
  };

  window.addEventListener(EVENT_LAYOUT_CHANGED, handleStorageOrEvent);
  window.addEventListener('storage', handleStorageOrEvent);

  return () => {
    listeners.delete(callback);
    window.removeEventListener(EVENT_LAYOUT_CHANGED, handleStorageOrEvent);
    window.removeEventListener('storage', handleStorageOrEvent);
  };
}

function getSnapshot(): Record<LayoutFeatureId, boolean> {
  return getLayoutSettings();
}

/**
 * Preset Layouts for rapid toggling
 */
export interface LayoutPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  apply: (edition?: RuleEdition | string) => Record<LayoutFeatureId, boolean>;
}

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: 'all',
    name: 'All Features (Default)',
    description: 'Enables every feature, statbox, combat tool, and note panel for this TRPG.',
    icon: '✨',
    apply: (edition) => {
      const current = { ...getLayoutSettings() };
      const targetFeatures = edition ? getFeaturesForEdition(edition) : ALL_LAYOUT_FEATURES;
      targetFeatures.forEach(f => { (current as any)[f.id] = true; });
      return current;
    }
  },
  {
    id: 'combat_focus',
    name: 'Combat & Tactical Focus',
    description: 'Keeps HP/monitors, defenses, attacks and quick actions; hides flavor text and long backstory.',
    icon: '⚔️',
    apply: (edition) => {
      const current = { ...getLayoutSettings() };
      const targetFeatures = edition ? getFeaturesForEdition(edition) : ALL_LAYOUT_FEATURES;
      targetFeatures.forEach(f => {
        if (
          f.sheet === 'sheet2' ||
          f.sheet === 'shadowrun' ||
          f.id === 's1_abilityScores' ||
          f.id === 's1_classFeatures' ||
          f.id === 's4_spellcastingStats' ||
          f.id === 's4_spellbookList' ||
          f.id === 'ui_quickStatsBar'
        ) {
          (current as any)[f.id] = true;
        } else {
          (current as any)[f.id] = false;
        }
      });
      return current;
    }
  },
  {
    id: 'minimalist',
    name: 'Minimalist / Streamlined',
    description: 'Clean and compact: Core stats, vitals, and primary actions only.',
    icon: '🌿',
    apply: (edition) => {
      const current = { ...getLayoutSettings() };
      const targetFeatures = edition ? getFeaturesForEdition(edition) : ALL_LAYOUT_FEATURES;
      targetFeatures.forEach(f => {
        if ([
          's1_abilityScores', 's1_skills', 's2_vitalityHpOrb', 's2_defenseStats',
          's2_attacksWeapons', 's3_inventoryList', 's4_spellbookList',
          'sr_stats', 'sr_combat', 'ui_quickStatsBar'
        ].includes(f.id)) {
          (current as any)[f.id] = true;
        } else {
          (current as any)[f.id] = false;
        }
      });
      return current;
    }
  },
  {
    id: 'roleplay_focus',
    name: 'Roleplay & Narrative Focus',
    description: 'Emphasizes identity, traits, backstory, quest notes, skills and class/character features.',
    icon: '📜',
    apply: (edition) => {
      const current = { ...getLayoutSettings() };
      const targetFeatures = edition ? getFeaturesForEdition(edition) : ALL_LAYOUT_FEATURES;
      targetFeatures.forEach(f => {
        if (f.sheet === 'sheet5' || f.sheet === 'sheet1' || f.sheet === 'sheet3' || f.id === 'sr_skills') {
          (current as any)[f.id] = true;
        } else if (['s2_vitalityHpOrb', 's2_defenseStats', 's2_attacksWeapons', 'sr_stats'].includes(f.id)) {
          (current as any)[f.id] = true;
        } else {
          (current as any)[f.id] = false;
        }
      });
      return current;
    }
  }
];

/**
 * React Hook that subscribes to layout customization changes and provides reactive state and controls.
 */
export function useLayoutCustomization() {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const isVisible = useCallback((featureId: LayoutFeatureId | string): boolean => {
    return (settings as any)[featureId] !== false;
  }, [settings]);

  const toggleFeature = useCallback((featureId: LayoutFeatureId | string) => {
    const nextVal = !((settings as any)[featureId] !== false);
    const updated = { ...settings, [featureId]: nextVal };
    saveLayoutSettings(updated);
  }, [settings]);

  const setFeatureVisible = useCallback((featureId: LayoutFeatureId | string, visible: boolean) => {
    const updated = { ...settings, [featureId]: visible };
    saveLayoutSettings(updated);
  }, [settings]);

  const enableAllInSheet = useCallback((sheetCategory: SheetCategory, edition?: RuleEdition | string) => {
    const updated = { ...settings };
    const targetFeatures = edition ? getFeaturesForEdition(edition) : ALL_LAYOUT_FEATURES;
    targetFeatures.filter(f => f.sheet === sheetCategory).forEach(f => {
      (updated as any)[f.id] = true;
    });
    saveLayoutSettings(updated);
  }, [settings]);

  const disableAllInSheet = useCallback((sheetCategory: SheetCategory, edition?: RuleEdition | string) => {
    const updated = { ...settings };
    const targetFeatures = edition ? getFeaturesForEdition(edition) : ALL_LAYOUT_FEATURES;
    targetFeatures.filter(f => f.sheet === sheetCategory).forEach(f => {
      (updated as any)[f.id] = false;
    });
    saveLayoutSettings(updated);
  }, [settings]);

  const applyPreset = useCallback((presetId: string, edition?: RuleEdition | string) => {
    const preset = LAYOUT_PRESETS.find(p => p.id === presetId);
    if (preset) {
      const updated = preset.apply(edition);
      saveLayoutSettings(updated);
    }
  }, []);

  const resetToDefaults = useCallback((edition?: RuleEdition | string) => {
    if (!edition) {
      const defaults = getDefaultLayoutSettings();
      saveLayoutSettings(defaults);
    } else {
      const updated = { ...settings };
      const targetFeatures = getFeaturesForEdition(edition);
      targetFeatures.forEach(f => {
        (updated as any)[f.id] = f.defaultEnabled;
      });
      saveLayoutSettings(updated);
    }
  }, [settings]);

  const enableAllForEdition = useCallback((edition: RuleEdition | string) => {
    const updated = { ...settings };
    getFeaturesForEdition(edition).forEach(f => { (updated as any)[f.id] = true; });
    saveLayoutSettings(updated);
  }, [settings]);

  const disableAllForEdition = useCallback((edition: RuleEdition | string) => {
    const updated = { ...settings };
    getFeaturesForEdition(edition).forEach(f => { (updated as any)[f.id] = false; });
    saveLayoutSettings(updated);
  }, [settings]);

  const countEnabledInSheet = useCallback((sheetCategory: SheetCategory, edition?: RuleEdition | string): { enabled: number; total: number } => {
    const targetFeatures = edition ? getFeaturesForEdition(edition) : ALL_LAYOUT_FEATURES;
    const sheetFeatures = targetFeatures.filter(f => f.sheet === sheetCategory);
    const enabled = sheetFeatures.filter(f => (settings as any)[f.id] !== false).length;
    return { enabled, total: sheetFeatures.length };
  }, [settings]);

  const countEnabledForEdition = useCallback((edition: RuleEdition | string): { enabled: number; total: number } => {
    const targetFeatures = getFeaturesForEdition(edition);
    const enabled = targetFeatures.filter(f => (settings as any)[f.id] !== false).length;
    return { enabled, total: targetFeatures.length };
  }, [settings]);

  return {
    settings,
    isVisible,
    toggleFeature,
    setFeatureVisible,
    enableAllInSheet,
    disableAllInSheet,
    applyPreset,
    resetToDefaults,
    enableAllForEdition,
    disableAllForEdition,
    countEnabledInSheet,
    countEnabledForEdition
  };
}
