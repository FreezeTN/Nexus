import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CompendiumItem } from '../../../data/compendiumData';
import { SupportedEdition } from './ForgeTypes';
import { Users, Sparkles, Plus, Trash2, Shield, Eye, Globe, Zap, Sword, Flame, Wand2, BookmarkCheck, Check, Snowflake, Droplets, Volume2, Copy, GitFork, Dna, Layers } from 'lucide-react';
import {
  CLASSIC_SRD_HALF_BREEDS,
  PARENT_RACE_CATALOG,
  ClassicSRDHalfBreed
} from '../../../data/halfBreedData';
import { generateProceduralRace } from '../../../services/proceduralGenerators';
import {
  validateHomebrewRace,
  parseAbilityScoreBonuses,
  parseDamageReductionFromText,
  parseSlashProgression,
  getScalingStatAtLevel
} from '../../../utils/homebrewValidator';
import { ValidationBadgeBanner } from './ValidationBadgeBanner';
import { ValidationConfirmModal } from './ValidationConfirmModal';

export interface RacialTraitItem {
  id: string;
  name: string;
  description: string;
  actionType: 'Passive' | 'Action' | 'Bonus Action' | 'Reaction' | 'Special';
  recharge: 'Passive' | 'Short Rest' | 'Long Rest' | 'Proficiency Bonus / Long Rest' | 'None';
}

export interface SubraceItem {
  id: string;
  name: string;
  description: string;
  traitBonus: string;
}

export interface NaturalWeaponItem {
  id: string;
  name: string;
  damage: string;
  ability: string;
  notes?: string;
  isChoice?: boolean;
}

export interface SpellLikeAbilityItem {
  id: string;
  levelRange: string;
  minLevel: number;
  spellName: string;
  usage: string;
  notes?: string;
}

export interface InnateSpell5eItem {
  id: string;
  level: number;
  spellName: string;
  recharge: string;
  ability: string;
}

interface RaceStudioProps {
  edition: SupportedEdition;
  sourceAuthor: string;
  onSave: (item: CompendiumItem) => void;
  onClose: () => void;
  editingItem?: CompendiumItem | null;
}

const DAMAGE_TYPES_5E = [
  'Acid', 'Cold', 'Fire', 'Force', 'Lightning', 'Necrotic', 'Poison', 'Psychic', 'Radiant', 'Thunder'
];

const CONDITION_IMMUNITIES_5E = [
  'Poisoned', 'Charmed', 'Frightened', 'Paralyzed', 'Petrified', 'Exhaustion'
];

const ENERGY_TYPES_35E = ['acid', 'cold', 'electricity', 'fire', 'sonic'];
const IMMUNITIES_35E = ['Poison', 'Sleep', 'Paralysis', 'Disease', 'Charm', 'Petrification', 'Mind-Affecting'];

export interface ElementResConfig {
  mode: 'scaling' | 'flat';
  progression: string;
  flatValue: number;
}

const DEFAULT_ELEMENT_CONFIGS: Record<string, ElementResConfig> = {
  acid: { mode: 'scaling', progression: '3/6/9/12/15 at levels 1/5/10/15/20', flatValue: 5 },
  cold: { mode: 'scaling', progression: '3/6/9/12/15 at levels 1/5/10/15/20', flatValue: 5 },
  electricity: { mode: 'scaling', progression: '3/6/9/12/15 at levels 1/5/10/15/20', flatValue: 5 },
  fire: { mode: 'scaling', progression: '5/10/15/20/25 at levels 1/5/10/15/20', flatValue: 5 },
  sonic: { mode: 'flat', progression: '3/6/9/12/15 at levels 1/5/10/15/20', flatValue: 5 }
};

const ELEMENT_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; colorText: string; colorBg: string; colorBorder: string }> = {
  acid: { label: 'Acid', icon: Droplets, colorText: 'text-lime-400', colorBg: 'bg-lime-950/40', colorBorder: 'border-lime-500/40' },
  cold: { label: 'Cold', icon: Snowflake, colorText: 'text-sky-300', colorBg: 'bg-sky-950/40', colorBorder: 'border-sky-500/40' },
  electricity: { label: 'Electricity', icon: Zap, colorText: 'text-yellow-300', colorBg: 'bg-yellow-950/40', colorBorder: 'border-yellow-500/40' },
  fire: { label: 'Fire', icon: Flame, colorText: 'text-orange-400', colorBg: 'bg-orange-950/40', colorBorder: 'border-orange-500/40' },
  sonic: { label: 'Sonic', icon: Volume2, colorText: 'text-purple-300', colorBg: 'bg-purple-950/40', colorBorder: 'border-purple-500/40' }
};

export const RaceStudio: React.FC<RaceStudioProps> = ({
  edition,
  sourceAuthor,
  onSave,
  onClose,
  editingItem
}) => {
  const is35e = edition === '3.5e' || edition === 'pathfinder';
  const is5e = edition === '5e';
  const draftKey = `penpaper_forge_race_draft_${edition}`;

  const rd = editingItem?.raceData;

  // Track draft restored indicator
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);

  // Core Biology
  const [name, setName] = useState(editingItem?.name || '');
  const [description, setDescription] = useState(editingItem?.description || '');
  const [creatureType, setCreatureType] = useState(rd?.creatureType || 'Humanoid');
  const [size, setSize] = useState<'Medium' | 'Small' | 'Large' | 'Tiny'>((rd?.size as any) || 'Medium');
  const [speed, setSpeed] = useState(rd?.speed || 30);
  const [speedNotes, setSpeedNotes] = useState(rd?.speedNotes || '30 ft. walking');
  
  // Ability Bonuses & Senses
  const [abilityBonusesStr, setAbilityBonusesStr] = useState(
    rd?.abilityBonusesStr || (is35e ? '+4 Strength, +4 Dexterity, +2 Constitution, +2 Intelligence, +4 Charisma' : '+2 Dexterity, +1 Charisma')
  );
  const [senses, setSenses] = useState(rd?.senses || (is35e ? 'Low-Light Vision, Darkvision out to 60 ft.' : 'Darkvision 60 ft.'));

  // Automatically detect Darkvision range from senses text
  const detectedDarkvision = useMemo(() => {
    if (!senses) return false;
    const lower = senses.toLowerCase();
    if (!lower.includes('darkvision')) return false;
    const m = senses.match(/darkvision\s*(?:out\s*to\s*)?(\d+)\s*(?:ft|feet)?/i);
    return m ? parseInt(m[1], 10) : 60;
  }, [senses]);

  // ========================================================
  // 3.5e & PATHFINDER SCALING DEFENSES & MECHANICS
  // ========================================================
  const [drMode, setDrMode] = useState<'scaling' | 'flat' | 'none'>(() => {
    if (rd?.damageReductionScalingProgression) return 'scaling';
    if (rd?.damageReductionValue !== undefined) return 'flat';
    return is35e ? 'scaling' : 'none';
  });
  const [damageReductionValue, setDamageReductionValue] = useState<number | undefined>(rd?.damageReductionValue ?? 2);
  const [damageReductionBypass, setDamageReductionBypass] = useState<string>(rd?.damageReductionBypass || '-');
  const [drScalingProgression, setDrScalingProgression] = useState<string>(
    rd?.damageReductionScalingProgression || '2/4/6/8/10 at levels 1/5/10/15/20'
  );

  // Natural Armor (3.5e)
  const [natArmorMode, setNatArmorMode] = useState<'scaling' | 'flat' | 'none'>(() => {
    if (rd?.naturalArmorScalingProgression) return 'scaling';
    if (rd?.naturalArmorBonus !== undefined) return 'flat';
    return is35e ? 'scaling' : 'none';
  });
  const [naturalArmorBonus, setNaturalArmorBonus] = useState<number | undefined>(rd?.naturalArmorBonus ?? 1);
  const [natArmorScalingProgression, setNatArmorScalingProgression] = useState<string>(
    rd?.naturalArmorScalingProgression || '+1/+2/+3 at levels 1/5/15'
  );

  // Spell Resistance (SR) (3.5e)
  const [srMode, setSrMode] = useState<'scaling' | 'level_formula' | 'flat' | 'none'>(() => {
    if (rd?.spellResistanceScalingProgression?.includes('Level')) return 'level_formula';
    if (rd?.spellResistanceScalingProgression) return 'scaling';
    if (rd?.spellResistanceBase !== undefined) return 'flat';
    return is35e ? 'scaling' : 'none';
  });
  const [srBase, setSrBase] = useState<number>(rd?.spellResistanceBase ?? 10);
  const [srScalingProgression, setSrScalingProgression] = useState<string>(
    rd?.spellResistanceScalingProgression || '10 + 2/4/6/8/10 at levels 1/5/10/15/20'
  );
  const [flatSrValue, setFlatSrValue] = useState<number>(15);

  // Energy Resistances & Immunities (3.5e)
  const [energyResMode, setEnergyResMode] = useState<'scaling' | 'flat' | 'none'>(() => {
    if (rd?.energyResistances && rd.energyResistances.length > 0) {
      if (rd.energyResistances[0].scalingProgression) return 'scaling';
      return 'flat';
    }
    return is35e ? 'scaling' : 'none';
  });
  // Scope: 'uniform' means all selected energy types share a single progression; 'individual' allows per-element custom curves
  const [energyResScope, setEnergyResScope] = useState<'uniform' | 'individual'>(() => {
    if (rd?.energyResistances && rd.energyResistances.length > 1) {
      const firstProg = rd.energyResistances[0].scalingProgression || `flat:${rd.energyResistances[0].value}`;
      const differs = rd.energyResistances.some(
        r => (r.scalingProgression || `flat:${r.value}`) !== firstProg
      );
      if (differs) return 'individual';
    }
    return 'uniform';
  });
  const [energyResProgression, setEnergyResProgression] = useState<string>(
    rd?.energyResistances?.[0]?.scalingProgression || '3/6/9/12/15 at levels 1/5/10/15/20'
  );
  const [selectedEnergyTypes, setSelectedEnergyTypes] = useState<string[]>(() => {
    if (rd?.energyResistances && rd.energyResistances.length > 0) {
      return rd.energyResistances.map(r => r.energyType.toLowerCase());
    }
    return ['acid', 'cold', 'electricity', 'fire'];
  });
  const [flatEnergyValue, setFlatEnergyValue] = useState<number>(5);
  const [elementResConfigs, setElementResConfigs] = useState<Record<string, ElementResConfig>>(() => {
    const initial: Record<string, ElementResConfig> = { ...DEFAULT_ELEMENT_CONFIGS };
    if (rd?.energyResistances && Array.isArray(rd.energyResistances)) {
      for (const er of rd.energyResistances) {
        const k = (er.energyType || '').toLowerCase();
        if (k) {
          initial[k] = {
            mode: er.scalingProgression ? 'scaling' : 'flat',
            progression: er.scalingProgression || '3/6/9/12/15 at levels 1/5/10/15/20',
            flatValue: er.value || 5
          };
        }
      }
    }
    return initial;
  });
  const [immunities35e, setImmunities35e] = useState<string[]>(() => {
    if (rd?.immunities && Array.isArray(rd.immunities)) return rd.immunities;
    return is35e ? ['Poison'] : [];
  });

  // Natural Weapons (3.5e)
  const [naturalWeapons, setNaturalWeapons] = useState<NaturalWeaponItem[]>(() => {
    if (rd?.naturalWeapons && Array.isArray(rd.naturalWeapons) && rd.naturalWeapons.length > 0) {
      return rd.naturalWeapons.map((nw, i) => ({
        id: `nw_${i + 1}`,
        name: nw.name,
        damage: nw.damage,
        ability: nw.ability || 'STR',
        notes: nw.notes || '',
        isChoice: nw.isChoice ?? true
      }));
    }
    if (is35e) {
      return [
        { id: 'nw1', name: 'Claws', damage: '1d4+STR', ability: 'STR', notes: "Player's choice, if available", isChoice: true },
        { id: 'nw2', name: 'Bite', damage: '1d6+STR', ability: 'STR', notes: "Player's choice, if available", isChoice: true },
        { id: 'nw3', name: 'Gore', damage: '1d8+STR', ability: 'STR', notes: "Player's choice, if available", isChoice: true }
      ];
    }
    return [];
  });

  // Skill Affinities (3.5e)
  const [skillAffinitiesStr, setSkillAffinitiesStr] = useState<string>(() => {
    if (typeof rd?.skillAffinities === 'string') return rd.skillAffinities;
    if (Array.isArray(rd?.skillAffinities)) {
      return rd.skillAffinities.map(a => `${a.bonus >= 0 ? '+' : ''}${a.bonus} ${a.skill}`).join(', ');
    }
    return is35e ? '+2 Bluff, +2 Perception (Listen & Spot), +4 Sense Motive, +2 Spellcraft, +2 Tumble' : '';
  });

  // Spell-Like Abilities (SLAs) with Level Tiers (3.5e)
  const [spellLikeAbilities, setSpellLikeAbilities] = useState<SpellLikeAbilityItem[]>(() => {
    if (rd?.spellLikeAbilities && Array.isArray(rd.spellLikeAbilities) && rd.spellLikeAbilities.length > 0) {
      return rd.spellLikeAbilities.map((sla, i) => ({
        id: `sla_${i + 1}`,
        levelRange: sla.levelRange || `Levels ${sla.minLevel || 1}-${(sla.minLevel || 1) + 1}`,
        minLevel: sla.minLevel || 1,
        spellName: sla.spellName,
        usage: sla.usage || '1/day',
        notes: sla.notes || ''
      }));
    }
    if (is35e) {
      return [
        { id: 'sla1', levelRange: 'Levels 1-2', minLevel: 1, spellName: 'Eldritch Blast', usage: 'at will' },
        { id: 'sla2', levelRange: 'Levels 3-4', minLevel: 3, spellName: 'Scorching Ray', usage: '3/day' },
        { id: 'sla3', levelRange: 'Levels 5-6', minLevel: 5, spellName: 'Hold Person', usage: '2/day' },
        { id: 'sla4', levelRange: 'Levels 7-8', minLevel: 7, spellName: 'Poison', usage: '3/day' },
        { id: 'sla5', levelRange: 'Levels 9-10', minLevel: 9, spellName: 'Fireball, hellish', usage: '2/day', notes: 'only harms non-evil creatures' },
        { id: 'sla6', levelRange: 'Levels 11-12', minLevel: 11, spellName: 'Blasphemy', usage: '1/day' },
        { id: 'sla7', levelRange: 'Levels 13-14', minLevel: 13, spellName: 'Unholy Aura', usage: '2/day' },
        { id: 'sla8', levelRange: 'Levels 15-16', minLevel: 15, spellName: 'Horrid Wilting', usage: '1/day' },
        { id: 'sla9', levelRange: 'Levels 17-18', minLevel: 17, spellName: 'Power Word: Kill', usage: '2/day' },
        { id: 'sla10', levelRange: 'Levels 19-20', minLevel: 19, spellName: "Mordenkainen's Disjunction", usage: '1/day' }
      ];
    }
    return [];
  });

  // ========================================================
  // 5e EXCLUSIVE DEFENSES & RACIAL MECHANICS
  // ========================================================
  const [damageResistances5e, setDamageResistances5e] = useState<string[]>(rd?.damageResistances5e || ['Fire']);
  const [damageImmunities5e, setDamageImmunities5e] = useState<string[]>(rd?.damageImmunities5e || []);
  const [conditionImmunities5e, setConditionImmunities5e] = useState<string[]>(rd?.conditionImmunities5e || []);
  const [naturalArmorFormula5e, setNaturalArmorFormula5e] = useState<string>(rd?.naturalArmorFormula5e || 'standard');
  const [scalingRacialDice5e, setScalingRacialDice5e] = useState<{ enabled: boolean; name: string; progression: string; damageType: string }>(() => ({
    enabled: !!rd?.scalingRacialDice5e,
    name: rd?.scalingRacialDice5e?.name || 'Breath Weapon / Dragon Spark',
    progression: rd?.scalingRacialDice5e?.progression || '2d6 at 1st level, 3d6 at 6th level, 4d6 at 11th level, 5d6 at 16th level',
    damageType: rd?.scalingRacialDice5e?.damageType || 'Fire'
  }));
  const [innateSpells5e, setInnateSpells5e] = useState<InnateSpell5eItem[]>(() => {
    if (rd?.innateSpells5e && Array.isArray(rd.innateSpells5e) && rd.innateSpells5e.length > 0) {
      return rd.innateSpells5e.map((s, i) => ({
        id: `is_${i + 1}`,
        level: s.level,
        spellName: s.spellName,
        recharge: s.recharge,
        ability: s.ability || 'Charisma'
      }));
    }
    if (is5e) {
      return [
        { id: 'is1', level: 1, spellName: 'Thaumaturgy', recharge: 'At Will', ability: 'Charisma' },
        { id: 'is2', level: 3, spellName: 'Hellish Rebuke', recharge: '1/Long Rest', ability: 'Charisma' },
        { id: 'is3', level: 5, spellName: 'Darkness', recharge: '1/Long Rest', ability: 'Charisma' }
      ];
    }
    return [];
  });
  const [innateSpellAbility5e, setInnateSpellAbility5e] = useState<'Charisma' | 'Intelligence' | 'Wisdom'>('Charisma');

  // Traits
  const [traits, setTraits] = useState<RacialTraitItem[]>(() => {
    if (rd?.traits && Array.isArray(rd.traits) && rd.traits.length > 0) {
      return rd.traits.map((t: any, idx: number) => ({
        id: t.id || `t${idx + 1}`,
        name: t.name || 'Trait',
        description: t.description || '',
        actionType: t.actionType || 'Passive',
        recharge: t.recharge || 'Passive'
      }));
    }
    return [
      {
        id: 't1',
        name: is35e ? 'Origin Traits' : 'Planar Shifting',
        description: is35e
          ? 'Born of infernal or celestial ancestry, with natural resilience and innate planar spellcasting.'
          : 'As a bonus action, teleport up to 30 feet to an unoccupied space you can see.',
        actionType: is35e ? 'Passive' : 'Bonus Action',
        recharge: is35e ? 'Passive' : 'Proficiency Bonus / Long Rest'
      },
      {
        id: 't2',
        name: is35e ? 'Fiendish Fortitude' : 'Resilient Ancestry',
        description: is35e
          ? 'Possesses high resistance to planar elements and natural damage reduction.'
          : 'You have advantage on saving throws against being charmed and resistance against radiant damage.',
        actionType: 'Passive',
        recharge: 'Passive'
      }
    ];
  });

  // Subraces
  const [subraces, setSubraces] = useState<SubraceItem[]>(() => {
    if (rd?.subraces && Array.isArray(rd.subraces) && rd.subraces.length > 0) {
      return rd.subraces.map((s: any, idx: number) => ({
        id: s.id || `sr${idx + 1}`,
        name: s.name || 'Subrace',
        description: s.description || '',
        traitBonus: s.traitBonus || ''
      }));
    }
    return [
      {
        id: 'sr1',
        name: is35e ? 'Abyssal Bloodline' : 'Astral Nomad',
        description: is35e ? 'Infused with chaotic demonic energy.' : 'Lineage steeped in cosmic starlight and deep astral void.',
        traitBonus: is35e ? '+2 STR, Gore attack bonus' : '+1 Intelligence, Astral Senses trait'
      }
    ];
  });

  // Languages & Lore
  const [languages, setLanguages] = useState(Array.isArray(rd?.languages) ? rd.languages.join(', ') : (rd?.languages || 'Common, Infernal or Draconic'));
  const [ageAndLifespan, setAgeAndLifespan] = useState(rd?.ageAndLifespan || 'Reach physical maturity at age 18 and can live up to 350 years.');
  const [alignmentTendencies, setAlignmentTendencies] = useState(rd?.alignmentTendencies || (is35e ? 'Often Chaotic or Neutral Evil, but individuals choose their own path.' : 'Tend toward Chaotic Good or Neutral.'));

  const [isGenerating, setIsGenerating] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  // ========================================================
  // HALF-BREED & HYBRID LINEAGE STUDIO STATE
  // ========================================================
  const [showHalfBreedModal, setShowHalfBreedModal] = useState(false);
  const [halfBreedMode, setHalfBreedMode] = useState<'srd' | 'custom'>('srd');
  const [selectedSRDHalfBreedId, setSelectedSRDHalfBreedId] = useState<string>(() => {
    const list = CLASSIC_SRD_HALF_BREEDS.filter(hb => hb.edition === (is35e ? '3.5e' : '5e'));
    return list[0]?.id || CLASSIC_SRD_HALF_BREEDS[0].id;
  });
  const [parent1Name, setParent1Name] = useState<string>('Human');
  const [parent2Name, setParent2Name] = useState<string>('Elf');
  const [hybridDominance, setHybridDominance] = useState<'balanced' | 'parent1' | 'parent2'>('balanced');
  const [hybridVigorType, setHybridVigorType] = useState<'feat' | 'hp' | 'skill' | 'stat'>('stat');

  // Available SRD half-breeds for the current ruleset
  const availableSRDHalfBreeds = useMemo(() => {
    const matched = CLASSIC_SRD_HALF_BREEDS.filter(hb => hb.edition === (is35e ? '3.5e' : '5e'));
    return matched.length > 0 ? matched : CLASSIC_SRD_HALF_BREEDS;
  }, [is35e]);

  const activeSRDSelection = useMemo(() => {
    return availableSRDHalfBreeds.find(hb => hb.id === selectedSRDHalfBreedId) || availableSRDHalfBreeds[0];
  }, [availableSRDHalfBreeds, selectedSRDHalfBreedId]);

  // ========================================================
  // FORM DRAFT PERSISTENCE (Saves to localStorage, restores on load)
  // ========================================================
  const isInitialMount = useRef(true);

  // Restore draft on mount if not editing an existing item
  useEffect(() => {
    if (editingItem) return;
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.name) setName(d.name);
        if (d.description) setDescription(d.description);
        if (d.creatureType) setCreatureType(d.creatureType);
        if (d.size) setSize(d.size);
        if (d.speed) setSpeed(d.speed);
        if (d.speedNotes) setSpeedNotes(d.speedNotes);
        if (d.abilityBonusesStr) setAbilityBonusesStr(d.abilityBonusesStr);
        if (d.senses) setSenses(d.senses);
        if (d.drMode) setDrMode(d.drMode);
        if (d.damageReductionValue !== undefined) setDamageReductionValue(d.damageReductionValue);
        if (d.damageReductionBypass) setDamageReductionBypass(d.damageReductionBypass);
        if (d.drScalingProgression) setDrScalingProgression(d.drScalingProgression);
        if (d.natArmorMode) setNatArmorMode(d.natArmorMode);
        if (d.naturalArmorBonus !== undefined) setNaturalArmorBonus(d.naturalArmorBonus);
        if (d.natArmorScalingProgression) setNatArmorScalingProgression(d.natArmorScalingProgression);
        if (d.srMode) setSrMode(d.srMode);
        if (d.srBase !== undefined) setSrBase(d.srBase);
        if (d.srScalingProgression) setSrScalingProgression(d.srScalingProgression);
        if (d.flatSrValue !== undefined) setFlatSrValue(d.flatSrValue);
        if (d.energyResMode) setEnergyResMode(d.energyResMode);
        if (d.energyResScope) setEnergyResScope(d.energyResScope);
        if (d.energyResProgression) setEnergyResProgression(d.energyResProgression);
        if (d.elementResConfigs) setElementResConfigs(d.elementResConfigs);
        if (Array.isArray(d.selectedEnergyTypes)) setSelectedEnergyTypes(d.selectedEnergyTypes);
        if (d.flatEnergyValue !== undefined) setFlatEnergyValue(d.flatEnergyValue);
        if (Array.isArray(d.immunities35e)) setImmunities35e(d.immunities35e);
        if (Array.isArray(d.naturalWeapons)) setNaturalWeapons(d.naturalWeapons);
        if (d.skillAffinitiesStr) setSkillAffinitiesStr(d.skillAffinitiesStr);
        if (Array.isArray(d.spellLikeAbilities)) setSpellLikeAbilities(d.spellLikeAbilities);
        if (Array.isArray(d.damageResistances5e)) setDamageResistances5e(d.damageResistances5e);
        if (Array.isArray(d.damageImmunities5e)) setDamageImmunities5e(d.damageImmunities5e);
        if (Array.isArray(d.conditionImmunities5e)) setConditionImmunities5e(d.conditionImmunities5e);
        if (d.naturalArmorFormula5e) setNaturalArmorFormula5e(d.naturalArmorFormula5e);
        if (d.scalingRacialDice5e) setScalingRacialDice5e(d.scalingRacialDice5e);
        if (Array.isArray(d.innateSpells5e)) setInnateSpells5e(d.innateSpells5e);
        if (Array.isArray(d.traits)) setTraits(d.traits);
        if (Array.isArray(d.subraces)) setSubraces(d.subraces);
        if (d.languages) setLanguages(d.languages);
        if (d.ageAndLifespan) setAgeAndLifespan(d.ageAndLifespan);
        if (d.alignmentTendencies) setAlignmentTendencies(d.alignmentTendencies);
        setHasRestoredDraft(true);
      }
    } catch {
      // Ignore corrupt storage
    }
  }, [editingItem, draftKey]);

  // Debounced auto-save draft whenever state changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (editingItem) return;

    const timer = setTimeout(() => {
      try {
        const draftState = {
          name,
          description,
          creatureType,
          size,
          speed,
          speedNotes,
          abilityBonusesStr,
          senses,
          drMode,
          damageReductionValue,
          damageReductionBypass,
          drScalingProgression,
          natArmorMode,
          naturalArmorBonus,
          natArmorScalingProgression,
          srMode,
          srBase,
          srScalingProgression,
          flatSrValue,
          energyResMode,
          energyResScope,
          energyResProgression,
          elementResConfigs,
          selectedEnergyTypes,
          flatEnergyValue,
          immunities35e,
          naturalWeapons,
          skillAffinitiesStr,
          spellLikeAbilities,
          damageResistances5e,
          damageImmunities5e,
          conditionImmunities5e,
          naturalArmorFormula5e,
          scalingRacialDice5e,
          innateSpells5e,
          traits,
          subraces,
          languages,
          ageAndLifespan,
          alignmentTendencies
        };
        localStorage.setItem(draftKey, JSON.stringify(draftState));
        setIsDraftSaved(true);
      } catch {
        // Ignore quota
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [
    name, description, creatureType, size, speed, speedNotes, abilityBonusesStr, senses,
    drMode, damageReductionValue, damageReductionBypass, drScalingProgression,
    natArmorMode, naturalArmorBonus, natArmorScalingProgression,
    srMode, srBase, srScalingProgression, flatSrValue,
    energyResMode, energyResScope, energyResProgression, elementResConfigs, selectedEnergyTypes, flatEnergyValue, immunities35e,
    naturalWeapons, skillAffinitiesStr, spellLikeAbilities,
    damageResistances5e, damageImmunities5e, conditionImmunities5e, naturalArmorFormula5e,
    scalingRacialDice5e, innateSpells5e, traits, subraces, languages, ageAndLifespan, alignmentTendencies,
    editingItem, draftKey
  ]);

  const updateElementResConfig = (element: string, updates: Partial<ElementResConfig>) => {
    setElementResConfigs(prev => ({
      ...prev,
      [element]: {
        ...(prev[element] || DEFAULT_ELEMENT_CONFIGS[element] || { mode: 'scaling', progression: '3/6/9/12/15 at levels 1/5/10/15/20', flatValue: 5 }),
        ...updates
      }
    }));
  };

  const copyElementConfigToAll = (fromElement: string) => {
    const src = elementResConfigs[fromElement] || DEFAULT_ELEMENT_CONFIGS[fromElement];
    if (!src) return;
    setElementResConfigs(prev => {
      const next = { ...prev };
      for (const elem of selectedEnergyTypes) {
        next[elem] = { ...src };
      }
      return next;
    });
  };

  const clearDraft = () => {
    localStorage.removeItem(draftKey);
    setHasRestoredDraft(false);
    setName('');
    setDescription('');
    setAbilityBonusesStr(is35e ? '+2 STR, +2 CON' : '+2 DEX, +1 CHA');
    setTraits([
      {
        id: 't1',
        name: 'Racial Resilience',
        description: 'Passive defensive resilience granted by heritage.',
        actionType: 'Passive',
        recharge: 'Passive'
      }
    ]);
  };

  // Live Validation
  const validation = useMemo(() => {
    return validateHomebrewRace({
      name,
      speed,
      abilityBonusesStr,
      traits: traits.map(t => ({ name: t.name, description: t.description })),
      edition
    });
  }, [name, speed, abilityBonusesStr, traits, edition]);

  // Live Parsed Ability Bonuses Preview
  const parsedStats = useMemo(() => {
    return parseAbilityScoreBonuses(abilityBonusesStr);
  }, [abilityBonusesStr]);

  // Parsed DR Scaling Progression preview
  const parsedDrProgression = useMemo(() => {
    if (drMode !== 'scaling') return null;
    return parseSlashProgression(drScalingProgression);
  }, [drMode, drScalingProgression]);

  // Parsed Natural Armor Scaling Progression preview
  const parsedNatArmorProgression = useMemo(() => {
    if (natArmorMode !== 'scaling') return null;
    return parseSlashProgression(natArmorScalingProgression);
  }, [natArmorMode, natArmorScalingProgression]);

  // Parsed SR Scaling Progression preview
  const parsedSrProgression = useMemo(() => {
    if (srMode !== 'scaling') return null;
    return parseSlashProgression(srScalingProgression);
  }, [srMode, srScalingProgression]);

  // Parsed Energy Resistance Progression preview
  const parsedEnergyProgression = useMemo(() => {
    if (energyResMode !== 'scaling') return null;
    return parseSlashProgression(energyResProgression);
  }, [energyResMode, energyResProgression]);

  // Trait management
  const addTrait = () => {
    setTraits([
      ...traits,
      {
        id: `tr_${Date.now()}`,
        name: 'New Racial Trait',
        description: 'Describe the trait rules, dice mechanics, and flavor.',
        actionType: 'Passive',
        recharge: 'Passive'
      }
    ]);
  };

  const updateTrait = (id: string, field: keyof RacialTraitItem, value: any) => {
    setTraits(traits.map(t => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const removeTrait = (id: string) => {
    setTraits(traits.filter(t => t.id !== id));
  };

  // Subrace management
  const addSubrace = () => {
    setSubraces([
      ...subraces,
      {
        id: `sbr_${Date.now()}`,
        name: 'New Subrace / Lineage Variant',
        description: 'Flavor and biological divergence.',
        traitBonus: '+1 Ability Score or Unique Lineage Perk'
      }
    ]);
  };

  const updateSubrace = (id: string, field: keyof SubraceItem, value: any) => {
    setSubraces(subraces.map(s => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const removeSubrace = (id: string) => {
    setSubraces(subraces.filter(s => s.id !== id));
  };

  // Natural weapons management (3.5e)
  const addNaturalWeapon = () => {
    setNaturalWeapons([
      ...naturalWeapons,
      {
        id: `nw_${Date.now()}`,
        name: 'Natural Weapon',
        damage: '1d6+STR',
        ability: 'STR',
        notes: '',
        isChoice: true
      }
    ]);
  };

  const updateNaturalWeapon = (id: string, field: keyof NaturalWeaponItem, value: any) => {
    setNaturalWeapons(naturalWeapons.map(nw => nw.id === id ? { ...nw, [field]: value } : nw));
  };

  const removeNaturalWeapon = (id: string) => {
    setNaturalWeapons(naturalWeapons.filter(nw => nw.id !== id));
  };

  // SLA management (3.5e)
  const addSLA = () => {
    setSpellLikeAbilities([
      ...spellLikeAbilities,
      {
        id: `sla_${Date.now()}`,
        levelRange: 'Levels 1-2',
        minLevel: 1,
        spellName: 'Magic Missile',
        usage: '1/day',
        notes: ''
      }
    ]);
  };

  const updateSLA = (id: string, field: keyof SpellLikeAbilityItem, value: any) => {
    setSpellLikeAbilities(spellLikeAbilities.map(sla => sla.id === id ? { ...sla, [field]: value } : sla));
  };

  const removeSLA = (id: string) => {
    setSpellLikeAbilities(spellLikeAbilities.filter(sla => sla.id !== id));
  };

  // Innate spells 5e management
  const addInnateSpell5e = () => {
    setInnateSpells5e([
      ...innateSpells5e,
      {
        id: `is_${Date.now()}`,
        level: 1,
        spellName: 'Mage Hand',
        recharge: 'At Will',
        ability: innateSpellAbility5e
      }
    ]);
  };

  const updateInnateSpell5e = (id: string, field: keyof InnateSpell5eItem, value: any) => {
    setInnateSpells5e(innateSpells5e.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeInnateSpell5e = (id: string) => {
    setInnateSpells5e(innateSpells5e.filter(s => s.id !== id));
  };

  // 1-Click Load Trueblood Template Preset (from Screenshot 1)
  const loadTieflingTruebloodPreset = () => {
    setName('Tiefling Trueblood');
    setDescription('Direct descendants of ancient infernal pacts. Their heritage carries extraordinary martial prowess, formidable scaling damage reduction, innate spell resistance, and potent demonic SLAs that unlock as they grow in power.');
    setCreatureType('Humanoid (Planetouched / Fiendish)');
    setSize('Medium');
    setSpeed(40);
    setSpeedNotes('Land Speed increases by 10 ft. from base creature (40 ft. total)');
    setAbilityBonusesStr('+4 Strength, +4 Dexterity, +2 Constitution, +2 Intelligence, +4 Charisma');
    setSenses('Low-Light Vision, Darkvision out to 60 ft.');
    setDrMode('scaling');
    setDrScalingProgression('2/4/6/8/10 at levels 1/5/10/15/20');
    setDamageReductionBypass('-');
    setNatArmorMode('scaling');
    setNatArmorScalingProgression('+1/+2/+3 at levels 1/5/15');
    setSrMode('scaling');
    setSrScalingProgression('10 + 2/4/6/8/10 at levels 1/5/10/15/20');
    setEnergyResMode('scaling');
    setEnergyResProgression('3/6/9/12/15 at levels 1/5/10/15/20');
    setSelectedEnergyTypes(['acid', 'cold', 'electricity', 'fire']);
    setImmunities35e(['Poison']);
    setNaturalWeapons([
      { id: 'nw1', name: 'Claws', damage: '1d4+STR', ability: 'STR', notes: "Player's choice, if available", isChoice: true },
      { id: 'nw2', name: 'Bite', damage: '1d6+STR', ability: 'STR', notes: "Player's choice, if available", isChoice: true },
      { id: 'nw3', name: 'Gore', damage: '1d8+STR', ability: 'STR', notes: "Player's choice, if available", isChoice: true }
    ]);
    setSkillAffinitiesStr('+2 Bluff, +2 Perception (Listen & Spot), +4 Sense Motive, +2 Spellcraft, +2 Tumble');
    setSpellLikeAbilities([
      { id: 'sla1', levelRange: 'Levels 1-2', minLevel: 1, spellName: 'Eldritch Blast', usage: 'at will' },
      { id: 'sla2', levelRange: 'Levels 3-4', minLevel: 3, spellName: 'Scorching Ray', usage: '3/day' },
      { id: 'sla3', levelRange: 'Levels 5-6', minLevel: 5, spellName: 'Hold Person', usage: '2/day' },
      { id: 'sla4', levelRange: 'Levels 7-8', minLevel: 7, spellName: 'Poison', usage: '3/day' },
      { id: 'sla5', levelRange: 'Levels 9-10', minLevel: 9, spellName: 'Fireball, hellish', usage: '2/day', notes: 'only harms non-evil creatures' },
      { id: 'sla6', levelRange: 'Levels 11-12', minLevel: 11, spellName: 'Blasphemy', usage: '1/day' },
      { id: 'sla7', levelRange: 'Levels 13-14', minLevel: 13, spellName: 'Unholy Aura', usage: '2/day', notes: 'and Finger of Death' },
      { id: 'sla8', levelRange: 'Levels 15-16', minLevel: 15, spellName: 'Horrid Wilting', usage: '1/day' },
      { id: 'sla9', levelRange: 'Levels 17-18', minLevel: 17, spellName: 'Power Word: Kill', usage: '2/day' },
      { id: 'sla10', levelRange: 'Levels 19-20', minLevel: 19, spellName: "Mordenkainen's Disjunction", usage: '1/day' }
    ]);
    setLanguages('Common, Infernal, Abyssal');
  };

  // Apply a classic SRD Half-Breed directly to the forge form
  const handleApplySRDHalfBreed = (hb: ClassicSRDHalfBreed) => {
    setName(hb.name.replace(/\s*\([^)]*\)/, ''));
    setDescription(hb.description);
    setSize(hb.size as any);
    setSpeed(hb.speed);
    setSpeedNotes(`${hb.speed} ft. walking`);
    setCreatureType(
      hb.name.toLowerCase().includes('dragon')
        ? 'Dragon / Humanoid'
        : hb.name.toLowerCase().includes('celestial') || hb.name.toLowerCase().includes('fiend')
        ? 'Outsider (Native)'
        : hb.name.toLowerCase().includes('giant') || hb.name.toLowerCase().includes('ogre')
        ? 'Giant / Humanoid'
        : 'Humanoid'
    );
    setAbilityBonusesStr(hb.statBonusText);

    // Vision & Senses
    if (hb.hasDarkvision && hb.hasLowLightVision) {
      setSenses('Darkvision 60 ft., Low-Light Vision');
    } else if (hb.hasDarkvision) {
      setSenses('Darkvision 60 ft.');
    } else if (hb.hasLowLightVision) {
      setSenses('Low-Light Vision');
    } else {
      setSenses('Normal');
    }

    // Traits
    setTraits(
      hb.traits.map((t, i) => ({
        id: `hb_tr_${Date.now()}_${i}`,
        name: t.name,
        description: t.description,
        actionType: 'Passive',
        recharge: 'Passive'
      }))
    );

    // Specific 3.5e mechanics
    if (is35e) {
      if (hb.flySpeed) {
        setSpeedNotes(`${hb.speed} ft. walking, Fly ${hb.flySpeed} ft.`);
      }
      if (hb.name.toLowerCase().includes('celestial')) {
        setNatArmorMode('flat');
        setNaturalArmorBonus(1);
        setSrMode('scaling');
        setSrScalingProgression('10 + 1 per HD');
        setEnergyResMode('flat');
        setFlatEnergyValue(10);
        setSelectedEnergyTypes(['acid', 'cold', 'electricity']);
      } else if (hb.name.toLowerCase().includes('dragon')) {
        setNatArmorMode('flat');
        setNaturalArmorBonus(4);
        setImmunities35e(['Sleep', 'Paralysis']);
      } else if (hb.name.toLowerCase().includes('ogre')) {
        setNatArmorMode('flat');
        setNaturalArmorBonus(4);
      } else if (hb.name.toLowerCase().includes('giant')) {
        setEnergyResMode('flat');
        setFlatEnergyValue(5);
        setSelectedEnergyTypes(['fire']);
      } else if (hb.name.toLowerCase().includes('fiend')) {
        setNatArmorMode('flat');
        setNaturalArmorBonus(1);
        setDrMode('flat');
        setDamageReductionValue(5);
        setDamageReductionBypass('magic');
        setEnergyResMode('flat');
        setFlatEnergyValue(10);
        setSelectedEnergyTypes(['acid', 'cold', 'electricity', 'fire']);
        setImmunities35e(['Poison']);
        setNaturalWeapons([
          { id: `nw_f1`, name: 'Claws (x2)', damage: '1d4+STR', ability: 'STR', notes: 'Primary natural weapon', isChoice: false },
          { id: `nw_f2`, name: 'Bite', damage: '1d6+STR', ability: 'STR', notes: 'Secondary natural weapon', isChoice: false }
        ]);
      }
    } else {
      // 5e adjustments
      if (hb.name.toLowerCase().includes('dragon')) {
        setDamageResistances5e(['Fire']);
        setScalingRacialDice5e({
          enabled: true,
          name: 'Dragon Breath Weapon',
          progression: '2d6 at 1st level, 3d6 at 6th level, 4d6 at 11th level, 5d6 at 16th level',
          damageType: 'Fire'
        });
      }
    }

    setShowHalfBreedModal(false);
  };

  // Forge a synthesized custom hybrid from two parent lineages
  const handleForgeCustomHybrid = () => {
    const p1 = PARENT_RACE_CATALOG.find(p => p.name === parent1Name) || PARENT_RACE_CATALOG[0];
    const p2 = PARENT_RACE_CATALOG.find(p => p.name === parent2Name) || PARENT_RACE_CATALOG[1];

    let hybridName = '';
    if (hybridDominance === 'balanced') {
      hybridName = `${p1.name}-${p2.name} Hybrid`;
    } else if (hybridDominance === 'parent1') {
      hybridName = `${p1.name}blood ${p2.name}`;
    } else {
      hybridName = `${p2.name}blood ${p1.name}`;
    }

    setName(hybridName);
    setDescription(
      `A distinctive cross-lineage bearing the bloodlines of both ${p1.name} and ${p2.name}. ` +
      `Combines ${p1.name.toLowerCase()} physical traits with the cultural resilience and inherent power of their ${p2.name.toLowerCase()} lineage.`
    );
    setCreatureType('Humanoid');

    // Size & Speed
    const blendedSize = hybridDominance === 'parent2' ? p2.size : p1.size;
    setSize(blendedSize as any);
    const blendedSpeed = Math.round((p1.speed + p2.speed) / 2 / 5) * 5;
    setSpeed(blendedSpeed);
    setSpeedNotes(`${blendedSpeed} ft. walking (hybrid average of ${p1.name} and ${p2.name})`);

    // Senses
    if (p1.hasDarkvision || p2.hasDarkvision) {
      setSenses('Darkvision 60 ft.');
    } else {
      setSenses('Normal');
    }

    // Ability scores
    const stat1 = p1.statBonusHint || '+1 to Primary Ability';
    const stat2 = p2.statBonusHint || '+1 to Secondary Ability';
    setAbilityBonusesStr(`${stat1}, ${stat2}`);

    // Traits
    const newTraits: RacialTraitItem[] = [
      {
        id: `tr_hyb_p1_${Date.now()}`,
        name: `${p1.name} Heritage: ${p1.primaryTraitName}`,
        description: p1.primaryTraitDesc,
        actionType: 'Passive',
        recharge: 'Passive'
      },
      {
        id: `tr_hyb_p2_${Date.now()}`,
        name: `${p2.name} Heritage: ${p2.primaryTraitName}`,
        description: p2.primaryTraitDesc,
        actionType: 'Passive',
        recharge: 'Passive'
      },
      {
        id: `tr_hyb_vigor_${Date.now()}`,
        name: 'Hybrid Vigor',
        description:
          hybridVigorType === 'hp'
            ? 'Your diverse lineage grants you remarkable hardiness (+1 hit point per character level).'
            : hybridVigorType === 'skill'
            ? 'You inherit diverse cultural knowledge, gaining proficiency in two additional skills of your choice.'
            : hybridVigorType === 'feat'
            ? 'Your adaptable dual heritage grants you one bonus origin feat or racial talent.'
            : 'You gain a +1 bonus to an ability score of your choice not modified by your parents.',
        actionType: 'Passive',
        recharge: 'Passive'
      }
    ];
    setTraits(newTraits);

    setShowHalfBreedModal(false);
  };

  // Auto Generate via Procedural Generator
  const handleAutoFill = () => {
    setIsGenerating(true);
    try {
      const generated = generateProceduralRace(name, edition === 'pathfinder' ? 'pathfinder' : edition === '3.5e' ? '3.5e' : '5e');
      if (generated) {
        setName(generated.name || name || 'Voidtouched Astralkin');
        setDescription(generated.description || '');
        setCreatureType(generated.creatureType || 'Humanoid');
        setSize((generated.size as any) || 'Medium');
        setSpeed(Number(generated.speed) || 30);
        setSpeedNotes(generated.speedNotes || `${generated.speed || 30} ft. walking`);
        setAbilityBonusesStr(generated.abilityBonusesStr || '+2 / +1 to Ability Scores');
        if (generated.senses) {
          setSenses(generated.senses);
        } else if (generated.darkvision) {
          setSenses('Darkvision 60 ft.');
        } else {
          setSenses('Normal');
        }
        if (Array.isArray(generated.traits) && generated.traits.length > 0) {
          setTraits(
            generated.traits.map((tr: any, i: number) => ({
              id: `tr_gen_${i}`,
              name: tr.name || `Trait ${i + 1}`,
              description: tr.description || '',
              actionType: (tr.actionType as any) || 'Passive',
              recharge: (tr.recharge as any) || 'Passive'
            }))
          );
        }
        if (Array.isArray(generated.subraces) && generated.subraces.length > 0) {
          setSubraces(
            generated.subraces.map((sr: any, i: number) => ({
              id: `sr_gen_${i}`,
              name: sr.name || `Subrace ${i + 1}`,
              description: sr.description || '',
              traitBonus: sr.traitBonus || ''
            }))
          );
        }
        if (Array.isArray(generated.languages)) {
          setLanguages(generated.languages.join(', '));
        }
        if (generated.ageAndLifespan) setAgeAndLifespan(generated.ageAndLifespan);
        if (generated.alignmentTendencies) setAlignmentTendencies(generated.alignmentTendencies);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const executeSave = () => {
    const structuredBonuses = parsedStats
      .filter(b => ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA', 'ALL'].includes(b.stat))
      .map(b => ({ ability: b.stat, bonus: b.value }));

    // Prepare 3.5e scaling payload
    let drScalingPayload: Array<{ level: number; value: number }> | undefined = undefined;
    let drVal: number | undefined = undefined;
    let drBypassStr: string | undefined = undefined;

    if (drMode === 'scaling' && parsedDrProgression) {
      drScalingPayload = parsedDrProgression.scaling;
      drVal = parsedDrProgression.scaling[0]?.value ?? 2;
      drBypassStr = damageReductionBypass?.trim() || '-';
    } else if (drMode === 'flat' && damageReductionValue !== undefined) {
      drVal = damageReductionValue;
      drBypassStr = damageReductionBypass?.trim() || '-';
    }

    // Natural armor payload
    let natArmorScalingPayload: Array<{ level: number; value: number }> | undefined = undefined;
    let natArmorVal: number | undefined = undefined;
    if (natArmorMode === 'scaling' && parsedNatArmorProgression) {
      natArmorScalingPayload = parsedNatArmorProgression.scaling;
      natArmorVal = parsedNatArmorProgression.scaling[0]?.value ?? 1;
    } else if (natArmorMode === 'flat') {
      natArmorVal = naturalArmorBonus;
    }

    // Spell resistance payload
    let srScalingPayload: Array<{ level: number; value: number }> | undefined = undefined;
    let srBaseVal: number | undefined = undefined;
    let srProgStr: string | undefined = undefined;
    if (srMode === 'scaling' && parsedSrProgression) {
      srBaseVal = parsedSrProgression.base || 10;
      srScalingPayload = parsedSrProgression.scaling;
      srProgStr = srScalingProgression;
    } else if (srMode === 'level_formula') {
      srBaseVal = 10;
      srProgStr = '10 + Level';
    } else if (srMode === 'flat') {
      srBaseVal = flatSrValue;
    }

    // Energy resistances payload
    let energyResistancesPayload: any[] | undefined = undefined;
    if (selectedEnergyTypes.length > 0) {
      if (energyResScope === 'individual') {
        energyResistancesPayload = selectedEnergyTypes.map(t => {
          const cfg = elementResConfigs[t] || DEFAULT_ELEMENT_CONFIGS[t] || { mode: 'scaling', progression: energyResProgression, flatValue: 5 };
          if (cfg.mode === 'scaling') {
            const parsed = parseSlashProgression(cfg.progression);
            return {
              energyType: t,
              value: parsed?.scaling[0]?.value ?? 3,
              scalingProgression: cfg.progression,
              scaling: parsed?.scaling
            };
          } else {
            return {
              energyType: t,
              value: cfg.flatValue || 5
            };
          }
        });
      } else {
        if (energyResMode === 'scaling' && parsedEnergyProgression) {
          energyResistancesPayload = selectedEnergyTypes.map(t => ({
            energyType: t,
            value: parsedEnergyProgression.scaling[0]?.value ?? 3,
            scalingProgression: energyResProgression,
            scaling: parsedEnergyProgression.scaling
          }));
        } else if (energyResMode === 'flat') {
          energyResistancesPayload = selectedEnergyTypes.map(t => ({
            energyType: t,
            value: flatEnergyValue
          }));
        }
      }
    }

    const raceDataPayload: any = {
      size,
      speed,
      speedNotes,
      creatureType,
      abilityBonuses: structuredBonuses.length > 0 ? structuredBonuses : undefined,
      abilityBonusesStr,
      darkvision: detectedDarkvision ? detectedDarkvision : false,
      senses: senses.trim() || 'Normal',
      traits: traits.map(t => ({
        name: t.name,
        description: t.description,
        actionType: t.actionType,
        recharge: t.recharge
      })),
      subraces: subraces.map(s => ({
        name: s.name,
        description: s.description,
        traitBonus: s.traitBonus
      })),
      languages: languages.split(',').map(s => s.trim()).filter(Boolean),
      ageAndLifespan,
      alignmentTendencies
    };

    // Attach 3.5e specific properties
    if (is35e) {
      if (drVal !== undefined) {
        raceDataPayload.damageReductionValue = drVal;
        raceDataPayload.damageReductionBypass = drBypassStr || '-';
      }
      if (drScalingPayload) {
        raceDataPayload.damageReductionScaling = drScalingPayload;
        raceDataPayload.damageReductionScalingProgression = drScalingProgression;
      }
      if (natArmorVal !== undefined) {
        raceDataPayload.naturalArmorBonus = natArmorVal;
      }
      if (natArmorScalingPayload) {
        raceDataPayload.naturalArmorScaling = natArmorScalingPayload;
        raceDataPayload.naturalArmorScalingProgression = natArmorScalingProgression;
      }
      if (srBaseVal !== undefined) {
        raceDataPayload.spellResistanceBase = srBaseVal;
      }
      if (srProgStr) {
        raceDataPayload.spellResistanceScalingProgression = srProgStr;
        if (srScalingPayload) raceDataPayload.spellResistanceScaling = srScalingPayload;
      }
      if (energyResistancesPayload) {
        raceDataPayload.energyResistances = energyResistancesPayload;
      }
      if (immunities35e.length > 0) {
        raceDataPayload.immunities = immunities35e;
      }
      if (naturalWeapons.length > 0) {
        raceDataPayload.naturalWeapons = naturalWeapons.map(nw => ({
          name: nw.name,
          damage: nw.damage,
          ability: nw.ability,
          notes: nw.notes,
          isChoice: nw.isChoice
        }));
      }
      if (skillAffinitiesStr.trim()) {
        raceDataPayload.skillAffinities = skillAffinitiesStr.trim();
      }
      if (spellLikeAbilities.length > 0) {
        raceDataPayload.spellLikeAbilities = spellLikeAbilities.map(sla => ({
          levelRange: sla.levelRange,
          minLevel: sla.minLevel,
          spellName: sla.spellName,
          usage: sla.usage,
          notes: sla.notes
        }));
      }
    }

    // Attach 5e specific properties
    if (is5e) {
      if (damageResistances5e.length > 0) raceDataPayload.damageResistances5e = damageResistances5e;
      if (damageImmunities5e.length > 0) raceDataPayload.damageImmunities5e = damageImmunities5e;
      if (conditionImmunities5e.length > 0) raceDataPayload.conditionImmunities5e = conditionImmunities5e;
      if (naturalArmorFormula5e !== 'standard') raceDataPayload.naturalArmorFormula5e = naturalArmorFormula5e;
      if (scalingRacialDice5e.enabled) {
        raceDataPayload.scalingRacialDice5e = {
          name: scalingRacialDice5e.name,
          progression: scalingRacialDice5e.progression,
          damageType: scalingRacialDice5e.damageType
        };
      }
      if (innateSpells5e.length > 0) {
        raceDataPayload.innateSpells5e = innateSpells5e.map(s => ({
          level: s.level,
          spellName: s.spellName,
          recharge: s.recharge,
          ability: s.ability
        }));
      }
    }

    const newItem: CompendiumItem = {
      id: editingItem?.id || `custom-race-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      category: 'races',
      edition,
      source: sourceAuthor.trim() || editingItem?.source || 'Custom Homebrew',
      description: description.trim() || `${name} — ${size} ${creatureType}. Speed: ${speed} ft. ${abilityBonusesStr}.`,
      isCustom: true,
      tags: ['races', edition, size, creatureType, 'Homebrew'],
      raceData: raceDataPayload
    };

    // Clean up draft on successful save
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // Ignore
    }

    onSave(newItem);
    setShowOverrideModal(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (validation.hasCritical) {
      setShowOverrideModal(true);
      return;
    }

    executeSave();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in text-stone-200">
      {/* Top Banner with Auto-Fill / Presets */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-linear-to-r from-emerald-950/40 via-stone-900 to-stone-900 border border-emerald-500/30 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/30 text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-emerald-200">Homebrew Race & Lineage Forge ({edition.toUpperCase()})</h4>
              {hasRestoredDraft && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-500/50 text-amber-300 flex items-center gap-1">
                  <BookmarkCheck className="w-3 h-3 text-amber-400" />
                  <span>Unsaved Draft Restored</span>
                </span>
              )}
              {isDraftSaved && (
                <span className="text-[10px] font-mono text-stone-400 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Saved locally</span>
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400">
              {is35e
                ? 'Design 3.5e lineages with scaling DR, natural armor, energy resistances, SR, natural weapons, and tiered SLAs.'
                : 'Design 5e species with innate spells, damage resistances, condition immunities, and scaling racial dice.'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowHalfBreedModal(true)}
            className="px-3 py-1.5 bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-500/50 rounded-xl text-indigo-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
            title="Design a Half-Breed or Hybrid race (Classic SRD or Custom Cross-Lineage)"
          >
            <GitFork className="w-3.5 h-3.5 text-indigo-400" />
            <span>Half-Breed / Hybrid Studio</span>
          </button>

          {is35e && (
            <button
              type="button"
              onClick={loadTieflingTruebloodPreset}
              className="px-3 py-1.5 bg-amber-950/70 hover:bg-amber-900/80 border border-amber-500/50 rounded-xl text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
              title="Loads the complete Tiefling Trueblood origin traits preset with all scaling stats"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Trueblood Preset</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleAutoFill}
            disabled={isGenerating}
            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded-xl text-stone-200 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isGenerating ? 'Forging...' : 'Procedural Idea'}</span>
          </button>

          {hasRestoredDraft && (
            <button
              type="button"
              onClick={clearDraft}
              className="px-2.5 py-1.5 bg-stone-900 hover:bg-rose-950/60 border border-stone-700 hover:border-rose-500/50 rounded-xl text-stone-400 hover:text-rose-300 text-[11px] font-mono transition cursor-pointer"
              title="Discard draft and reset form"
            >
              Clear Draft
            </button>
          )}
        </div>
      </div>

      {/* 1. Core Species Identity */}
      <div className="space-y-4 bg-stone-900/80 border border-stone-800 p-4 rounded-2xl">
        <h5 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span>1. Species Identity & Biology</span>
        </h5>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-mono text-stone-400 mb-1">
              Race / Lineage Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Tiefling Trueblood, Voidtouched Astralkin"
              className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-stone-400 mb-1">Creature Type & Subtypes</label>
            <input
              type="text"
              value={creatureType}
              onChange={e => setCreatureType(e.target.value)}
              placeholder="e.g. Humanoid (Planetouched), Monstrosity, Fey"
              className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-mono text-stone-400 mb-1">Size Category</label>
            <select
              value={size}
              onChange={e => setSize(e.target.value as any)}
              className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs cursor-pointer"
            >
              <option value="Tiny">Tiny (Sprite scale)</option>
              <option value="Small">Small (Halfling / Gnome scale)</option>
              <option value="Medium">Medium (Human / Elf scale)</option>
              <option value="Large">Large (Centaur / Goliath scale)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-stone-400 mb-1">Base Walking Speed (ft.)</label>
            <input
              type="number"
              value={speed}
              onChange={e => setSpeed(parseInt(e.target.value, 10) || 30)}
              className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-emerald-400 font-mono font-bold text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-stone-400 mb-1">Speed Notes / Modifiers</label>
            <input
              type="text"
              value={speedNotes}
              onChange={e => setSpeedNotes(e.target.value)}
              placeholder="e.g. Land Speed increases by 10 ft. from base creature"
              className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-mono text-stone-400 mb-1">Ability Score Increases</label>
            <input
              type="text"
              value={abilityBonusesStr}
              onChange={e => setAbilityBonusesStr(e.target.value)}
              placeholder="e.g. +4 Strength, +4 Dexterity, +2 Constitution, +2 Intelligence, +4 Charisma"
              className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
            />
            {parsedStats.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="text-[10px] font-mono text-stone-500">Detected:</span>
                {parsedStats.map((st, idx) => (
                  <span
                    key={idx}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                      st.value >= 0
                        ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                        : 'bg-rose-950/70 border-rose-500/50 text-rose-300'
                    }`}
                  >
                    {st.value >= 0 ? `+${st.value}` : st.value} {st.stat}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-mono text-stone-400 mb-1">Senses & Vision</label>
            <input
              type="text"
              value={senses}
              onChange={e => setSenses(e.target.value)}
              placeholder="e.g. Darkvision 60 ft., Low-Light Vision, Blindsight 10 ft."
              className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs focus:border-emerald-500 focus:outline-none"
            />
            {senses.trim() && (
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="text-[10px] font-mono text-stone-500">Detected:</span>
                {detectedDarkvision ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border bg-purple-950/70 border-purple-500/50 text-purple-300 flex items-center gap-1">
                    <Eye className="w-3 h-3 text-purple-400" />
                    <span>Darkvision {detectedDarkvision} ft.</span>
                  </span>
                ) : null}
                {senses.toLowerCase().includes('low-light') && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border bg-indigo-950/70 border-indigo-500/50 text-indigo-300">
                    Low-Light Vision
                  </span>
                )}
                {senses.toLowerCase().includes('blindsight') && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border bg-cyan-950/70 border-cyan-500/50 text-cyan-300">
                    Blindsight
                  </span>
                )}
                {senses.toLowerCase().includes('tremorsense') && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border bg-amber-950/70 border-amber-500/50 text-amber-300">
                    Tremorsense
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-[11px] font-mono text-stone-400 mb-1">Origins, Lore & Appearance</label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the aesthetic, physical traits, cultural origins, and roleplay hooks..."
            className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs leading-relaxed"
          />
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. D&D 3.5e & PATHFINDER SCALING DEFENSES & STATS PANEL */}
      {/* ======================================================== */}
      {is35e && (
        <div className="space-y-4 bg-stone-900/90 border border-sky-500/40 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-stone-800">
            <h5 className="text-xs font-mono font-bold text-sky-300 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-sky-400" />
              <span>2. 3.5e Defenses & Level-Scaling Attributes</span>
            </h5>
            <span className="text-[10px] font-mono text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded-full border border-sky-500/30">
              3.5e Classic / Tactical Systems
            </span>
          </div>

          {/* DR SECTION */}
          <div className="bg-stone-950/70 border border-stone-800 p-3.5 rounded-xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-mono font-bold text-stone-200 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-sky-400" />
                <span>Damage Reduction (DR)</span>
              </label>
              <div className="flex items-center gap-1 bg-stone-900 border border-stone-800 p-0.5 rounded-lg text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setDrMode('scaling')}
                  className={`px-2.5 py-1 rounded-md transition ${drMode === 'scaling' ? 'bg-sky-500 text-stone-950 font-bold' : 'text-stone-400 hover:text-stone-200'}`}
                >
                  Level Scaling
                </button>
                <button
                  type="button"
                  onClick={() => setDrMode('flat')}
                  className={`px-2.5 py-1 rounded-md transition ${drMode === 'flat' ? 'bg-sky-500 text-stone-950 font-bold' : 'text-stone-400 hover:text-stone-200'}`}
                >
                  Flat DR
                </button>
                <button
                  type="button"
                  onClick={() => setDrMode('none')}
                  className={`px-2.5 py-1 rounded-md transition ${drMode === 'none' ? 'bg-stone-800 text-stone-300' : 'text-stone-500 hover:text-stone-300'}`}
                >
                  None
                </button>
              </div>
            </div>

            {drMode === 'scaling' && (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono text-stone-400 mb-0.5">Scaling Progression Syntax</label>
                    <input
                      type="text"
                      value={drScalingProgression}
                      onChange={e => setDrScalingProgression(e.target.value)}
                      placeholder="e.g. 2/4/6/8/10 at levels 1/5/10/15/20"
                      className="w-full px-3 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-sky-300 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-stone-400 mb-0.5">Bypass Material / Type</label>
                    <input
                      type="text"
                      value={damageReductionBypass}
                      onChange={e => setDamageReductionBypass(e.target.value)}
                      placeholder="e.g. -, magic, silver, cold iron"
                      className="w-full px-3 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-stone-200 font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Scaling Preview Badges */}
                {parsedDrProgression && (
                  <div className="p-2 bg-sky-950/30 border border-sky-500/20 rounded-lg flex items-center gap-2 flex-wrap text-[11px] font-mono">
                    <span className="text-stone-400">Progression Preview:</span>
                    {parsedDrProgression.scaling.map(tier => (
                      <span key={tier.level} className="px-2 py-0.5 bg-sky-900/60 border border-sky-500/40 text-sky-200 rounded-md">
                        Lv {tier.level}: <strong className="text-white">DR {tier.value}/{damageReductionBypass || '-'}</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {drMode === 'flat' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono text-stone-400 mb-0.5">Flat DR Value</label>
                  <input
                    type="number"
                    min={0}
                    value={damageReductionValue !== undefined ? damageReductionValue : ''}
                    onChange={e => setDamageReductionValue(e.target.value === '' ? undefined : Math.max(0, parseInt(e.target.value, 10)))}
                    placeholder="e.g. 5"
                    className="w-full px-3 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-sky-300 font-mono font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-stone-400 mb-0.5">Bypass</label>
                  <input
                    type="text"
                    value={damageReductionBypass}
                    onChange={e => setDamageReductionBypass(e.target.value)}
                    placeholder="e.g. magic, silver, -"
                    className="w-full px-3 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-stone-200 font-mono text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* NATURAL ARMOR & SPELL RESISTANCE SECTION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Natural Armor */}
            <div className="bg-stone-950/70 border border-stone-800 p-3.5 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-stone-200 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Natural Armour</span>
                </label>
                <div className="flex items-center gap-1 text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => setNatArmorMode('scaling')}
                    className={`px-2 py-0.5 rounded ${natArmorMode === 'scaling' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400'}`}
                  >
                    Scaling
                  </button>
                  <button
                    type="button"
                    onClick={() => setNatArmorMode('flat')}
                    className={`px-2 py-0.5 rounded ${natArmorMode === 'flat' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400'}`}
                  >
                    Flat
                  </button>
                  <button
                    type="button"
                    onClick={() => setNatArmorMode('none')}
                    className={`px-2 py-0.5 rounded ${natArmorMode === 'none' ? 'bg-stone-800 text-stone-300' : 'text-stone-500'}`}
                  >
                    None
                  </button>
                </div>
              </div>

              {natArmorMode === 'scaling' ? (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={natArmorScalingProgression}
                    onChange={e => setNatArmorScalingProgression(e.target.value)}
                    placeholder="e.g. +1/+2/+3 at levels 1/5/15"
                    className="w-full px-3 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-amber-300 font-mono text-xs"
                  />
                  {parsedNatArmorProgression && (
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono">
                      {parsedNatArmorProgression.scaling.map(tier => (
                        <span key={tier.level} className="px-1.5 py-0.5 bg-amber-950/60 border border-amber-500/40 text-amber-200 rounded">
                          Lv {tier.level}: <strong>+{tier.value} AC</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : natArmorMode === 'flat' ? (
                <input
                  type="number"
                  min={0}
                  value={naturalArmorBonus !== undefined ? naturalArmorBonus : ''}
                  onChange={e => setNaturalArmorBonus(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                  placeholder="Flat AC bonus (e.g. 2)"
                  className="w-full px-3 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-amber-300 font-mono font-bold text-xs"
                />
              ) : null}
            </div>

            {/* Spell Resistance */}
            <div className="bg-stone-950/70 border border-stone-800 p-3.5 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-stone-200 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Spell Resistance (SR)</span>
                </label>
                <div className="flex items-center gap-1 text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => setSrMode('scaling')}
                    className={`px-2 py-0.5 rounded ${srMode === 'scaling' ? 'bg-purple-500 text-stone-950 font-bold' : 'text-stone-400'}`}
                  >
                    10 + Scaling
                  </button>
                  <button
                    type="button"
                    onClick={() => setSrMode('level_formula')}
                    className={`px-2 py-0.5 rounded ${srMode === 'level_formula' ? 'bg-purple-500 text-stone-950 font-bold' : 'text-stone-400'}`}
                  >
                    10 + Level
                  </button>
                  <button
                    type="button"
                    onClick={() => setSrMode('none')}
                    className={`px-2 py-0.5 rounded ${srMode === 'none' ? 'bg-stone-800 text-stone-300' : 'text-stone-500'}`}
                  >
                    None
                  </button>
                </div>
              </div>

              {srMode === 'scaling' ? (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={srScalingProgression}
                    onChange={e => setSrScalingProgression(e.target.value)}
                    placeholder="e.g. 10 + 2/4/6/8/10 at levels 1/5/10/15/20"
                    className="w-full px-3 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-purple-300 font-mono text-xs"
                  />
                  {parsedSrProgression && (
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono">
                      {parsedSrProgression.scaling.map(tier => (
                        <span key={tier.level} className="px-1.5 py-0.5 bg-purple-950/60 border border-purple-500/40 text-purple-200 rounded">
                          Lv {tier.level}: <strong>SR {parsedSrProgression.base + tier.value}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : srMode === 'level_formula' ? (
                <div className="p-2 bg-purple-950/30 border border-purple-500/30 rounded-lg text-xs font-mono text-purple-200">
                  Formula: <strong>10 + Character Level</strong> (scales automatically on sheet)
                </div>
              ) : null}
            </div>
          </div>

          {/* ENERGY RESISTANCES & IMMUNITIES */}
          <div className="bg-stone-950/70 border border-stone-800 p-3.5 rounded-xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-mono font-bold text-stone-200 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>Energy Resistances & Immunities</span>
              </label>

              {/* Scope & Mode controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Uniform vs Per-Element Scope Toggle */}
                <div className="flex items-center bg-stone-900 border border-stone-800 rounded-lg p-0.5 text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => setEnergyResScope('uniform')}
                    className={`px-2 py-0.5 rounded transition ${energyResScope === 'uniform' ? 'bg-stone-700 text-stone-100 font-bold' : 'text-stone-400 hover:text-stone-200'}`}
                    title="All selected energy types share the same scaling progression or flat value"
                  >
                    Uniform (All Elements)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnergyResScope('individual')}
                    className={`px-2 py-0.5 rounded transition ${energyResScope === 'individual' ? 'bg-orange-600 text-white font-bold' : 'text-stone-400 hover:text-stone-200'}`}
                    title="Configure different scaling progressions or flat values for each element individually"
                  >
                    Per-Element Custom
                  </button>
                </div>

                {energyResScope === 'uniform' && (
                  <div className="flex items-center gap-1 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setEnergyResMode('scaling')}
                      className={`px-2 py-0.5 rounded ${energyResMode === 'scaling' ? 'bg-orange-500 text-stone-950 font-bold' : 'text-stone-400'}`}
                    >
                      Scaling Progression
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnergyResMode('flat')}
                      className={`px-2 py-0.5 rounded ${energyResMode === 'flat' ? 'bg-orange-500 text-stone-950 font-bold' : 'text-stone-400'}`}
                    >
                      Flat
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Applicable Energy Types */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-stone-400">Select Resisted Elements:</span>
                {energyResScope === 'individual' && selectedEnergyTypes.length > 0 && (
                  <span className="text-[10px] font-mono text-orange-400/80">
                    Each element can scale differently below
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ENERGY_TYPES_35E.map(energy => {
                  const isSelected = selectedEnergyTypes.includes(energy);
                  const meta = ELEMENT_META[energy];
                  const Icon = meta ? meta.icon : Flame;
                  return (
                    <button
                      key={energy}
                      type="button"
                      onClick={() => {
                        setSelectedEnergyTypes(
                          isSelected ? selectedEnergyTypes.filter(e => e !== energy) : [...selectedEnergyTypes, energy]
                        );
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold capitalize transition cursor-pointer border flex items-center gap-1.5 ${
                        isSelected
                          ? meta
                            ? `${meta.colorBg} ${meta.colorBorder} ${meta.colorText} shadow`
                            : 'bg-orange-950 border-orange-500 text-orange-300 shadow'
                          : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{energy}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* If Uniform Mode: Single Input for all elements */}
            {energyResScope === 'uniform' && (
              <>
                {energyResMode === 'scaling' && (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={energyResProgression}
                      onChange={e => setEnergyResProgression(e.target.value)}
                      placeholder="e.g. 3/6/9/12/15 at levels 1/5/10/15/20"
                      className="w-full px-3 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-orange-300 font-mono text-xs"
                    />
                    {parsedEnergyProgression && (
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono">
                        <span className="text-stone-400">Resist Preview (All Elements):</span>
                        {parsedEnergyProgression.scaling.map(tier => (
                          <span key={tier.level} className="px-1.5 py-0.5 bg-orange-950/60 border border-orange-500/40 text-orange-200 rounded">
                            Lv {tier.level}: <strong>Resist {tier.value}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {energyResMode === 'flat' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-stone-400">Flat Resist Value:</span>
                    <input
                      type="number"
                      value={flatEnergyValue}
                      onChange={e => setFlatEnergyValue(parseInt(e.target.value, 10) || 0)}
                      className="w-24 px-2 py-1 bg-stone-900 border border-stone-700 rounded-lg text-orange-300 font-mono text-xs font-bold"
                    />
                  </div>
                )}
              </>
            )}

            {/* If Per-Element Custom Mode: Dedicated row/card for each selected element */}
            {energyResScope === 'individual' && (
              <div className="space-y-2 pt-1">
                {selectedEnergyTypes.length === 0 ? (
                  <div className="p-3 rounded-lg bg-stone-900/60 border border-stone-800 text-stone-400 text-xs font-mono text-center">
                    Select one or more elements above to configure individual scaling progressions.
                  </div>
                ) : (
                  selectedEnergyTypes.map(elem => {
                    const cfg = elementResConfigs[elem] || DEFAULT_ELEMENT_CONFIGS[elem] || { mode: 'scaling', progression: '3/6/9/12/15 at levels 1/5/10/15/20', flatValue: 5 };
                    const meta = ELEMENT_META[elem];
                    const Icon = meta ? meta.icon : Flame;
                    const parsed = cfg.mode === 'scaling' ? parseSlashProgression(cfg.progression) : null;

                    return (
                      <div
                        key={elem}
                        className={`p-2.5 rounded-xl border ${meta?.colorBorder || 'border-stone-800'} ${meta?.colorBg || 'bg-stone-900/40'} space-y-2`}
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-1.5">
                            <Icon className={`w-3.5 h-3.5 ${meta?.colorText || 'text-orange-400'}`} />
                            <span className={`text-xs font-mono font-bold capitalize ${meta?.colorText || 'text-stone-200'}`}>
                              {elem} Resistance
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Element Mode Toggle */}
                            <div className="flex items-center bg-stone-950 border border-stone-800 rounded-md p-0.5 text-[10px] font-mono">
                              <button
                                type="button"
                                onClick={() => updateElementResConfig(elem, { mode: 'scaling' })}
                                className={`px-2 py-0.5 rounded transition ${cfg.mode === 'scaling' ? 'bg-orange-600 text-white font-bold' : 'text-stone-400 hover:text-stone-200'}`}
                              >
                                Scaling
                              </button>
                              <button
                                type="button"
                                onClick={() => updateElementResConfig(elem, { mode: 'flat' })}
                                className={`px-2 py-0.5 rounded transition ${cfg.mode === 'flat' ? 'bg-orange-600 text-white font-bold' : 'text-stone-400 hover:text-stone-200'}`}
                              >
                                Flat
                              </button>
                            </div>

                            {/* Copy to other elements */}
                            {selectedEnergyTypes.length > 1 && (
                              <button
                                type="button"
                                onClick={() => copyElementConfigToAll(elem)}
                                className="px-2 py-0.5 rounded bg-stone-950/80 hover:bg-stone-800 border border-stone-800 text-[10px] font-mono text-stone-400 hover:text-stone-200 flex items-center gap-1 transition"
                                title={`Copy ${elem} progression to all other selected elements`}
                              >
                                <Copy className="w-3 h-3" />
                                <span>Copy to All</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Input & Live Preview */}
                        {cfg.mode === 'scaling' ? (
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              value={cfg.progression}
                              onChange={e => updateElementResConfig(elem, { progression: e.target.value })}
                              placeholder="e.g. 5/10/15/20/25 at levels 1/5/10/15/20"
                              className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-orange-200 font-mono text-xs focus:border-orange-500 focus:outline-none"
                            />
                            {parsed && (
                              <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono">
                                <span className="text-stone-400">Preview:</span>
                                {parsed.scaling.map(tier => (
                                  <span
                                    key={tier.level}
                                    className="px-1.5 py-0.5 bg-stone-950 border border-orange-500/40 text-orange-200 rounded"
                                  >
                                    Lv {tier.level}: <strong>Resist {tier.value}</strong>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-stone-400">Flat Resist Value:</span>
                            <input
                              type="number"
                              value={cfg.flatValue}
                              onChange={e => updateElementResConfig(elem, { flatValue: parseInt(e.target.value, 10) || 0 })}
                              className="w-24 px-2 py-1 bg-stone-950 border border-stone-700 rounded-lg text-orange-300 font-mono text-xs font-bold"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Immunities */}
            <div className="pt-2 border-t border-stone-800">
              <span className="text-[10px] font-mono text-stone-400 block mb-1">Total Immunities:</span>
              <div className="flex flex-wrap gap-1.5">
                {IMMUNITIES_35E.map(imm => {
                  const hasImm = immunities35e.includes(imm);
                  return (
                    <button
                      key={imm}
                      type="button"
                      onClick={() => {
                        setImmunities35e(hasImm ? immunities35e.filter(i => i !== imm) : [...immunities35e, imm]);
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer border ${
                        hasImm
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      Immunity: {imm}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* NATURAL WEAPONS */}
          <div className="bg-stone-950/70 border border-stone-800 p-3.5 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-stone-200 flex items-center gap-1.5">
                <Sword className="w-3.5 h-3.5 text-rose-400" />
                <span>Natural Weapons</span>
              </label>
              <button
                type="button"
                onClick={addNaturalWeapon}
                className="px-2 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded text-[11px] font-mono text-emerald-400 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Attack</span>
              </button>
            </div>

            <div className="space-y-2">
              {naturalWeapons.map(nw => (
                <div key={nw.id} className="p-2 bg-stone-900 border border-stone-800 rounded-lg grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs">
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      value={nw.name}
                      onChange={e => updateNaturalWeapon(nw.id, 'name', e.target.value)}
                      placeholder="Weapon Name (e.g. Claws, Bite, Gore)"
                      className="w-full px-2 py-1 bg-stone-950 border border-stone-700 rounded text-stone-200 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      value={nw.damage}
                      onChange={e => updateNaturalWeapon(nw.id, 'damage', e.target.value)}
                      placeholder="Damage (e.g. 1d4+STR)"
                      className="w-full px-2 py-1 bg-stone-950 border border-stone-700 rounded text-amber-300 font-mono text-xs"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      value={nw.notes || ''}
                      onChange={e => updateNaturalWeapon(nw.id, 'notes', e.target.value)}
                      placeholder="Notes (e.g. Player's choice)"
                      className="w-full px-2 py-1 bg-stone-950 border border-stone-700 rounded text-stone-400 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeNaturalWeapon(nw.id)}
                      className="p-1 text-stone-500 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SKILL AFFINITIES */}
          <div className="bg-stone-950/70 border border-stone-800 p-3.5 rounded-xl space-y-1.5">
            <label className="text-xs font-mono font-bold text-stone-200 flex items-center gap-1.5">
              <span>Skill Affinities (Racial Bonuses)</span>
            </label>
            <input
              type="text"
              value={skillAffinitiesStr}
              onChange={e => setSkillAffinitiesStr(e.target.value)}
              placeholder="e.g. +2 Bluff, +2 Perception (Listen & Spot), +4 Sense Motive, +2 Spellcraft, +2 Tumble"
              className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-emerald-300 font-mono text-xs"
            />
          </div>

          {/* SPELL-LIKE ABILITIES BY LEVEL TIERS */}
          <div className="bg-stone-950/70 border border-stone-800 p-3.5 rounded-xl space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-mono font-bold text-stone-200 flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Spell-Like Abilities (SLAs) by Character Level</span>
              </label>
              <button
                type="button"
                onClick={addSLA}
                className="px-2 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded text-[11px] font-mono text-purple-300 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add SLA Tier</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {spellLikeAbilities.map(sla => (
                <div key={sla.id} className="p-2 bg-stone-900 border border-stone-800 rounded-lg grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs">
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      value={sla.levelRange}
                      onChange={e => updateSLA(sla.id, 'levelRange', e.target.value)}
                      placeholder="Levels 1-2"
                      className="w-full px-2 py-1 bg-stone-950 border border-stone-700 rounded text-purple-300 font-mono text-xs"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      value={sla.spellName}
                      onChange={e => updateSLA(sla.id, 'spellName', e.target.value)}
                      placeholder="Spell Name (e.g. Eldritch Blast)"
                      className="w-full px-2 py-1 bg-stone-950 border border-stone-700 rounded text-stone-200 font-bold text-xs"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      value={sla.usage}
                      onChange={e => updateSLA(sla.id, 'usage', e.target.value)}
                      placeholder="Usage (e.g. at will, 3/day, 2/day)"
                      className="w-full px-2 py-1 bg-stone-950 border border-stone-700 rounded text-stone-400 font-mono text-xs"
                    />
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeSLA(sla.id)}
                      className="p-1 text-stone-500 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. D&D 5e DEFENSES & RACIAL PROGRESSION PANEL */}
      {/* ======================================================== */}
      {is5e && (
        <div className="space-y-4 bg-stone-900/90 border border-emerald-500/40 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-stone-800">
            <h5 className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>2. 5e Defenses & Racial Progression</span>
            </h5>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
              D&D 5e Bounded Accuracy
            </span>
          </div>

          {/* 5e Damage Resistances */}
          <div className="bg-stone-950/70 border border-stone-800 p-3.5 rounded-xl space-y-2">
            <label className="text-xs font-mono font-bold text-stone-200 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>Damage Resistances (Half Damage)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DAMAGE_TYPES_5E.map(dt => {
                const isSelected = damageResistances5e.includes(dt);
                return (
                  <button
                    key={dt}
                    type="button"
                    onClick={() => {
                      setDamageResistances5e(
                        isSelected ? damageResistances5e.filter(t => t !== dt) : [...damageResistances5e, dt]
                      );
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer border ${
                      isSelected
                        ? 'bg-orange-950 border-orange-500 text-orange-300 shadow'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    Resist {dt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5e Condition & Damage Immunities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-stone-950/70 border border-stone-800 p-3.5 rounded-xl space-y-2">
              <label className="text-xs font-mono font-bold text-stone-200">Condition Immunities</label>
              <div className="flex flex-wrap gap-1.5">
                {CONDITION_IMMUNITIES_5E.map(cond => {
                  const isImm = conditionImmunities5e.includes(cond);
                  return (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => {
                        setConditionImmunities5e(isImm ? conditionImmunities5e.filter(c => c !== cond) : [...conditionImmunities5e, cond]);
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer border ${
                        isImm
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      {cond}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5e Natural Armor Formula */}
            <div className="bg-stone-950/70 border border-stone-800 p-3.5 rounded-xl space-y-2">
              <label className="text-xs font-mono font-bold text-stone-200">AC Calculation / Natural Armor</label>
              <select
                value={naturalArmorFormula5e}
                onChange={e => setNaturalArmorFormula5e(e.target.value)}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-200 text-xs cursor-pointer"
              >
                <option value="standard">Standard (Worn Armor or 10 + DEX)</option>
                <option value="13 + DEX">13 + DEX (e.g. Lizardfolk Natural Armor)</option>
                <option value="12 + CON">12 + CON (e.g. Loxodon Natural Armor)</option>
                <option value="+1 AC">+1 Flat AC (e.g. Warforged Integrated Protection)</option>
              </select>
            </div>
          </div>

          {/* 5e Innate Spells by Level */}
          <div className="bg-stone-950/70 border border-stone-800 p-3.5 rounded-xl space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-mono font-bold text-stone-200 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Innate Spellcasting by Character Level</span>
                </label>
                <select
                  value={innateSpellAbility5e}
                  onChange={e => setInnateSpellAbility5e(e.target.value as any)}
                  className="px-2 py-0.5 bg-stone-900 border border-stone-700 rounded text-purple-300 text-xs font-mono cursor-pointer"
                >
                  <option value="Charisma">Charisma</option>
                  <option value="Intelligence">Intelligence</option>
                  <option value="Wisdom">Wisdom</option>
                </select>
              </div>
              <button
                type="button"
                onClick={addInnateSpell5e}
                className="px-2 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded text-[11px] font-mono text-purple-300 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Spell</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {innateSpells5e.map(isp => (
                <div key={isp.id} className="p-2 bg-stone-900 border border-stone-800 rounded-lg grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs">
                  <div className="sm:col-span-3">
                    <span className="text-[10px] font-mono text-stone-500 block">Min Level</span>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={isp.level}
                      onChange={e => updateInnateSpell5e(isp.id, 'level', parseInt(e.target.value, 10) || 1)}
                      className="w-full px-2 py-1 bg-stone-950 border border-stone-700 rounded text-purple-300 font-mono text-xs"
                    />
                  </div>
                  <div className="sm:col-span-5">
                    <span className="text-[10px] font-mono text-stone-500 block">Spell Name</span>
                    <input
                      type="text"
                      value={isp.spellName}
                      onChange={e => updateInnateSpell5e(isp.id, 'spellName', e.target.value)}
                      placeholder="e.g. Darkness"
                      className="w-full px-2 py-1 bg-stone-950 border border-stone-700 rounded text-stone-200 font-bold text-xs"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <span className="text-[10px] font-mono text-stone-500 block">Recharge</span>
                    <input
                      type="text"
                      value={isp.recharge}
                      onChange={e => updateInnateSpell5e(isp.id, 'recharge', e.target.value)}
                      placeholder="1/Long Rest"
                      className="w-full px-2 py-1 bg-stone-950 border border-stone-700 rounded text-stone-300 text-xs font-mono"
                    />
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeInnateSpell5e(isp.id)}
                      className="p-1 text-stone-500 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5e Scaling Racial Dice (e.g. Dragonborn Breath Weapon) */}
          <div className="bg-stone-950/70 border border-stone-800 p-3.5 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-stone-200 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Scaling Racial Dice (e.g. Breath Weapon / Racial Attack)</span>
              </label>
              <input
                type="checkbox"
                checked={scalingRacialDice5e.enabled}
                onChange={e => setScalingRacialDice5e({ ...scalingRacialDice5e, enabled: e.target.checked })}
                className="rounded text-emerald-500 focus:ring-0 cursor-pointer"
              />
            </div>

            {scalingRacialDice5e.enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-mono text-stone-400 mb-0.5">Feature Name</label>
                  <input
                    type="text"
                    value={scalingRacialDice5e.name}
                    onChange={e => setScalingRacialDice5e({ ...scalingRacialDice5e, name: e.target.value })}
                    className="w-full px-2 py-1 bg-stone-900 border border-stone-700 rounded text-stone-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-stone-400 mb-0.5">Dice Progression Syntax</label>
                  <input
                    type="text"
                    value={scalingRacialDice5e.progression}
                    onChange={e => setScalingRacialDice5e({ ...scalingRacialDice5e, progression: e.target.value })}
                    className="w-full px-2 py-1 bg-stone-900 border border-stone-700 rounded text-amber-300 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-stone-400 mb-0.5">Damage Type</label>
                  <select
                    value={scalingRacialDice5e.damageType}
                    onChange={e => setScalingRacialDice5e({ ...scalingRacialDice5e, damageType: e.target.value })}
                    className="w-full px-2 py-1 bg-stone-900 border border-stone-700 rounded text-stone-200 text-xs cursor-pointer"
                  >
                    {DAMAGE_TYPES_5E.map(dt => (
                      <option key={dt} value={dt}>{dt}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Racial Traits & Powers */}
      <div className="space-y-4 bg-stone-900/80 border border-stone-800 p-4 rounded-2xl">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>3. Racial Traits & Powers</span>
          </h5>
          <button
            type="button"
            onClick={addTrait}
            className="px-3 py-1 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg text-emerald-400 hover:text-emerald-300 text-xs font-mono flex items-center gap-1 cursor-pointer transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Trait</span>
          </button>
        </div>

        <div className="space-y-3">
          {traits.map((t, idx) => (
            <div key={t.id} className="bg-stone-950/80 border border-stone-800 p-3.5 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={t.name}
                  onChange={e => updateTrait(t.id, 'name', e.target.value)}
                  placeholder="Trait Name"
                  className="font-bold text-emerald-300 text-xs bg-transparent border-b border-transparent hover:border-stone-700 focus:border-emerald-500 focus:outline-none flex-1 py-0.5"
                />
                <button
                  type="button"
                  onClick={() => removeTrait(t.id)}
                  className="p-1 text-stone-500 hover:text-rose-400 transition cursor-pointer"
                  title="Remove trait"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <textarea
                rows={2}
                value={t.description}
                onChange={e => updateTrait(t.id, 'description', e.target.value)}
                placeholder="Mechanics, damage dice, saving throw DCs, and flavor rules..."
                className="w-full px-3 py-1.5 bg-stone-900/60 border border-stone-800 rounded-lg text-stone-200 text-xs leading-relaxed"
              />

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-stone-500 block mb-0.5">Action Cost:</span>
                  <select
                    value={t.actionType}
                    onChange={e => updateTrait(t.id, 'actionType', e.target.value as any)}
                    className="w-full px-2 py-1 bg-stone-900 border border-stone-800 rounded text-stone-300 cursor-pointer"
                  >
                    <option value="Passive">Passive</option>
                    <option value="Action">Action</option>
                    <option value="Bonus Action">Bonus Action</option>
                    <option value="Reaction">Reaction</option>
                    <option value="Special">Special / Free</option>
                  </select>
                </div>
                <div>
                  <span className="text-stone-500 block mb-0.5">Recharge:</span>
                  <select
                    value={t.recharge}
                    onChange={e => updateTrait(t.id, 'recharge', e.target.value as any)}
                    className="w-full px-2 py-1 bg-stone-900 border border-stone-800 rounded text-stone-300 cursor-pointer"
                  >
                    <option value="Passive">Passive / Always On</option>
                    <option value="Short Rest">Short Rest</option>
                    <option value="Long Rest">Long Rest</option>
                    <option value="Proficiency Bonus / Long Rest">Proficiency Bonus / Long Rest</option>
                    <option value="None">At Will / Unlimited</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Subraces & Lineage Branches */}
      <div className="space-y-4 bg-stone-900/80 border border-stone-800 p-4 rounded-2xl">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>4. Subraces & Lineage Branches</span>
          </h5>
          <button
            type="button"
            onClick={addSubrace}
            className="px-3 py-1 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg text-emerald-400 hover:text-emerald-300 text-xs font-mono flex items-center gap-1 cursor-pointer transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Subrace</span>
          </button>
        </div>

        <div className="space-y-3">
          {subraces.map((sub, idx) => (
            <div key={sub.id} className="bg-stone-950/80 border border-stone-800 p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={sub.name}
                  onChange={e => updateSubrace(sub.id, 'name', e.target.value)}
                  placeholder="Subrace Name"
                  className="font-bold text-emerald-300 text-xs bg-transparent border-b border-transparent hover:border-stone-700 focus:border-emerald-500 focus:outline-none flex-1 py-0.5"
                />
                <button
                  type="button"
                  onClick={() => removeSubrace(sub.id)}
                  className="p-1 text-stone-500 hover:text-rose-400 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <textarea
                rows={1}
                value={sub.description}
                onChange={e => updateSubrace(sub.id, 'description', e.target.value)}
                placeholder="Lineage description and cultural differences..."
                className="w-full px-3 py-1.5 bg-stone-900/60 border border-stone-800 rounded-lg text-stone-300 text-xs"
              />

              <input
                type="text"
                value={sub.traitBonus}
                onChange={e => updateSubrace(sub.id, 'traitBonus', e.target.value)}
                placeholder="Subrace stat bonus / unique traits (e.g. +1 Wisdom, Stealth Proficiency)"
                className="w-full px-3 py-1.5 bg-stone-900/40 border border-stone-800 rounded-lg text-stone-300 text-xs font-mono"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 5. Languages & Cultural Lore */}
      <div className="space-y-4 bg-stone-900/80 border border-stone-800 p-4 rounded-2xl">
        <h5 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
          <Globe className="w-4 h-4" />
          <span>5. Languages & Roleplay Details</span>
        </h5>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-mono text-stone-400 mb-1">Languages</label>
            <input
              type="text"
              value={languages}
              onChange={e => setLanguages(e.target.value)}
              placeholder="e.g. Common, Infernal, Abyssal, Draconic"
              className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Age & Lifespan</label>
              <input
                type="text"
                value={ageAndLifespan}
                onChange={e => setAgeAndLifespan(e.target.value)}
                placeholder="e.g. Mature at 18, live up to 350 years"
                className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Alignment Tendencies</label>
              <input
                type="text"
                value={alignmentTendencies}
                onChange={e => setAlignmentTendencies(e.target.value)}
                placeholder="e.g. Tend toward Chaotic Evil or Neutral"
                className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Validation & Balance Guard */}
      <ValidationBadgeBanner validation={validation} categoryLabel="Race / Ancestry" />

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 text-xs font-bold rounded-xl transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!name.trim()}
          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-stone-950 text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
        >
          <Users className="w-4 h-4" />
          <span>{editingItem ? 'Update Race Entry' : 'Save Race to Compendium'}</span>
        </button>
      </div>

      {/* Half-Breed & Hybrid Studio Modal */}
      {showHalfBreedModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
          onClick={() => setShowHalfBreedModal(false)}
        >
          <div
            className="bg-stone-900 border border-indigo-500/50 rounded-2xl p-5 max-w-3xl w-full shadow-2xl text-stone-100 max-h-[90vh] overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/20 border border-indigo-500/40 rounded-xl text-indigo-400">
                  <GitFork className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-indigo-200">
                    Half-Breed & Hybrid Lineage Studio
                  </h3>
                  <p className="text-xs text-stone-400">
                    Instantly import official SRD half-breed archetypes or forge a custom cross-lineage with blended traits.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHalfBreedModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-2 border-b border-stone-800 pb-2">
              <button
                type="button"
                onClick={() => setHalfBreedMode('srd')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  halfBreedMode === 'srd'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>Classic SRD Half-Breeds ({availableSRDHalfBreeds.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setHalfBreedMode('custom')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  halfBreedMode === 'custom'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <Dna className="w-3.5 h-3.5" />
                <span>Custom Hybrid Lineage Blender</span>
              </button>
            </div>

            {/* TAB 1: CLASSIC SRD HALF-BREEDS */}
            {halfBreedMode === 'srd' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-stone-400 mb-1 font-mono">Select Classic SRD Lineage:</label>
                  <select
                    value={selectedSRDHalfBreedId}
                    onChange={(e) => setSelectedSRDHalfBreedId(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-indigo-300 font-bold focus:border-indigo-500 focus:outline-none"
                  >
                    {availableSRDHalfBreeds.map((hb) => (
                      <option key={hb.id} value={hb.id}>
                        {hb.name} [{hb.edition.toUpperCase()}] — {hb.source}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Preview Card */}
                {activeSRDSelection && (
                  <div className="bg-stone-950 border border-indigo-900/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                      <div className="font-bold text-indigo-300 text-sm">{activeSRDSelection.name}</div>
                      <div className="flex items-center gap-2 font-mono text-[11px] text-stone-400">
                        <span>Size: {activeSRDSelection.size}</span>
                        <span>•</span>
                        <span>Speed: {activeSRDSelection.speed} ft. {activeSRDSelection.flySpeed ? `(Fly ${activeSRDSelection.flySpeed} ft.)` : ''}</span>
                        <span>•</span>
                        <span>{activeSRDSelection.hasDarkvision ? 'Darkvision 60 ft.' : activeSRDSelection.hasLowLightVision ? 'Low-Light Vision' : 'Normal Vision'}</span>
                      </div>
                    </div>

                    <p className="text-stone-300 italic text-xs leading-relaxed">{activeSRDSelection.description}</p>

                    <div className="p-2 bg-indigo-950/50 border border-indigo-500/30 rounded-lg text-indigo-200 font-mono">
                      <strong className="text-indigo-400">Stat Adjustments:</strong> {activeSRDSelection.statBonusText}
                    </div>

                    {/* Traits List */}
                    <div className="space-y-2 pt-1">
                      <span className="font-bold text-stone-300 block font-mono text-[11px] uppercase tracking-wider">
                        Racial Traits ({activeSRDSelection.traits.length}):
                      </span>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {activeSRDSelection.traits.map((tr, idx) => (
                          <div key={idx} className="p-2 bg-stone-900/80 border border-stone-800 rounded-lg space-y-0.5">
                            <div className="font-bold text-amber-300">{tr.name}</div>
                            <div className="text-stone-400 text-[11px] leading-relaxed">{tr.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => handleApplySRDHalfBreed(activeSRDSelection)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg flex items-center gap-2 transition"
                      >
                        <Check className="w-4 h-4" />
                        <span>Apply {activeSRDSelection.name.split(' (')[0]} to Forge</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CUSTOM HYBRID BLENDER */}
            {halfBreedMode === 'custom' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Parent 1 */}
                  <div className="bg-stone-950 border border-stone-800 rounded-xl p-3 space-y-2">
                    <label className="block text-indigo-400 font-mono font-bold">Parent Lineage 1:</label>
                    <select
                      value={parent1Name}
                      onChange={(e) => setParent1Name(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-200 font-bold"
                    >
                      {PARENT_RACE_CATALOG.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name} ({p.statBonusHint || '+1 to Stat'})
                        </option>
                      ))}
                    </select>
                    {(() => {
                      const p1 = PARENT_RACE_CATALOG.find((p) => p.name === parent1Name) || PARENT_RACE_CATALOG[0];
                      return (
                        <div className="text-[11px] text-stone-400 space-y-1 pt-1">
                          <div>Size: {p1.size} • Speed: {p1.speed} ft. • {p1.hasDarkvision ? 'Darkvision' : 'Normal'}</div>
                          <div className="text-amber-300 font-mono">Trait: {p1.primaryTraitName}</div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Parent 2 */}
                  <div className="bg-stone-950 border border-stone-800 rounded-xl p-3 space-y-2">
                    <label className="block text-indigo-400 font-mono font-bold">Parent Lineage 2:</label>
                    <select
                      value={parent2Name}
                      onChange={(e) => setParent2Name(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-200 font-bold"
                    >
                      {PARENT_RACE_CATALOG.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name} ({p.statBonusHint || '+1 to Stat'})
                        </option>
                      ))}
                    </select>
                    {(() => {
                      const p2 = PARENT_RACE_CATALOG.find((p) => p.name === parent2Name) || PARENT_RACE_CATALOG[1];
                      return (
                        <div className="text-[11px] text-stone-400 space-y-1 pt-1">
                          <div>Size: {p2.size} • Speed: {p2.speed} ft. • {p2.hasDarkvision ? 'Darkvision' : 'Normal'}</div>
                          <div className="text-amber-300 font-mono">Trait: {p2.primaryTraitName}</div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Dominance and Hybrid Vigor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-stone-400 mb-1 font-mono">Lineage Dominance:</label>
                    <select
                      value={hybridDominance}
                      onChange={(e) => setHybridDominance(e.target.value as any)}
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2 text-stone-200"
                    >
                      <option value="balanced">Balanced 50/50 Dual Heritage</option>
                      <option value="parent1">Dominant {parent1Name} Physical Traits</option>
                      <option value="parent2">Dominant {parent2Name} Physical Traits</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1 font-mono">Hybrid Vigor Benefit:</label>
                    <select
                      value={hybridVigorType}
                      onChange={(e) => setHybridVigorType(e.target.value as any)}
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2 text-stone-200"
                    >
                      <option value="stat">+1 Free Ability Score of Choice</option>
                      <option value="hp">Enduring Vitality (+1 HP per character level)</option>
                      <option value="skill">Dual Cultural Mastery (2 Bonus Skills)</option>
                      <option value="feat">Versatile Adaptability (1 Bonus Feat / Talent)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleForgeCustomHybrid}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg flex items-center gap-2 transition"
                  >
                    <Dna className="w-4 h-4" />
                    <span>Synthesize & Apply {parent1Name}-{parent2Name} Hybrid</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Game-Breaking Warning Confirmation Modal */}
      <ValidationConfirmModal
        isOpen={showOverrideModal}
        entryName={name}
        category="Race / Ancestry"
        validation={validation}
        onProceedAnyway={executeSave}
        onCancel={() => setShowOverrideModal(false)}
      />
    </form>
  );
};
