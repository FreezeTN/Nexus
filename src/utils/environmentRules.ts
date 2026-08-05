import { EncounterEnvironment } from '../types';

export interface EnvironmentConfig {
  id: EncounterEnvironment;
  name: string;
  shortName: string;
  icon: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  description: string;
  rulesBanner: string;
  specialFeaturesNote?: string;
}

export const ENVIRONMENT_CONFIGS: Record<EncounterEnvironment, EnvironmentConfig> = {
  terrestrial: {
    id: 'terrestrial',
    name: 'Standard Ground / Dungeon',
    shortName: 'Terrestrial',
    icon: '🏰',
    color: 'text-stone-300',
    badgeBg: 'bg-stone-800/80',
    badgeBorder: 'border-stone-700',
    badgeText: 'text-stone-300',
    description: 'Standard dry land, surface terrain, or subterranean dungeon complex.',
    rulesBanner: 'Standard combat rules apply.'
  },
  underwater: {
    id: 'underwater',
    name: 'Underwater / Submerged',
    shortName: 'Underwater',
    icon: '🌊',
    color: 'text-cyan-300',
    badgeBg: 'bg-cyan-950/90',
    badgeBorder: 'border-cyan-500/60',
    badgeText: 'text-cyan-300',
    description: 'Fully submerged aquatic domain (Lakes, Deep Ocean, Aboleth Lair).',
    rulesBanner: '🌊 Underwater Rules: Submerged targets automatically have Fire Damage Resistance (damage halved). Melee weapon attacks have disadvantage unless Piercing (Dagger, Spear, Trident, Shortsword) or attacker has a Swim Speed. Suffocation & Air Supply rules in effect.',
    specialFeaturesNote: 'Activates Aboleth Mucous Cloud, Water Elemental Whelm, and Kraken Aquatic Surge traits!'
  },
  volcanic: {
    id: 'volcanic',
    name: 'Volcanic / Extreme Heat',
    icon: '🌋',
    shortName: 'Volcanic',
    color: 'text-amber-400',
    badgeBg: 'bg-amber-950/90',
    badgeBorder: 'border-amber-500/60',
    badgeText: 'text-amber-300',
    description: 'Magma caverns, molten chambers, or extreme thermal environment.',
    rulesBanner: '🌋 Heat Rules: Thermal heat hazard. Heavy armor wearers face Constitution saves vs Exhaustion after prolonged exposure. Magma hazard zones deal 6d6 Fire damage.',
    specialFeaturesNote: 'Activates Red Dragon Magma Eruptions & Fire Giant Thermal Aura!'
  },
  arctic: {
    id: 'arctic',
    name: 'Arctic / Glacial Cold',
    shortName: 'Arctic',
    icon: '❄️',
    color: 'text-blue-300',
    badgeBg: 'bg-blue-950/90',
    badgeBorder: 'border-blue-500/60',
    badgeText: 'text-blue-200',
    description: 'Sub-zero tundra, glacial ice sheets, or supernatural frost environment.',
    rulesBanner: '❄️ Cold Rules: Slippery ice difficult terrain (DC 10 Acrobatics or fall prone on dash). Extreme cold causes Constitution saves vs Exhaustion without cold weather gear.',
    specialFeaturesNote: 'Freezing hazard terrain & Frost Lair effects active!'
  },
  shadowfell: {
    id: 'shadowfell',
    name: 'Shadowfell / Obscured Fog',
    shortName: 'Shadowfell',
    icon: '🌫️',
    color: 'text-purple-300',
    badgeBg: 'bg-purple-950/90',
    badgeBorder: 'border-purple-500/60',
    badgeText: 'text-purple-300',
    description: 'Pitch darkness, heavily obscured fog, or realm of shadows.',
    rulesBanner: '🌫️ Obscured Rules: Heavily obscured environment. Vision-based Perception checks fail automatically; ranged attacks at unseen targets have disadvantage; advantage on Stealth checks.',
    specialFeaturesNote: 'Grants advantage on Stealth checks to shadowy creatures.'
  },
  aerial: {
    id: 'aerial',
    name: 'High Altitude / Airborne',
    shortName: 'Aerial',
    icon: '🦅',
    color: 'text-sky-300',
    badgeBg: 'bg-sky-950/90',
    badgeBorder: 'border-sky-500/60',
    badgeText: 'text-sky-300',
    description: 'Sky battle, floating island, or aerial cloud platform.',
    rulesBanner: '🦅 Air Combat: Non-flying creatures fall immediately. Knocking airborne creatures prone causes falling damage (1d6 per 10 ft) and lands them on lower ground.',
    specialFeaturesNote: 'Empowers airborne creatures like Dragons, Wyverns & Air Elementals.'
  },
  lair_active: {
    id: 'lair_active',
    name: 'Boss Lair (Lair Actions Engaged)',
    shortName: 'Boss Lair',
    icon: '👑',
    color: 'text-yellow-300',
    badgeBg: 'bg-yellow-950/90',
    badgeBorder: 'border-yellow-500/60',
    badgeText: 'text-yellow-300',
    description: 'Ancient lair of a legendary boss creature.',
    rulesBanner: '👑 Lair Rules: Boss Lair Actions trigger at Initiative Count 20 on each round!',
    specialFeaturesNote: 'Unlocks boss Lair Action triggers for Aboleth, Lich, Red Dragon, and Mummy Lord.'
  }
};

export interface EnvironmentalTraitStatus {
  isEnvironmental: boolean;
  isActive: boolean;
  requiredEnvironment?: EncounterEnvironment;
  badgeLabel: string;
  badgeBg: string;
  badgeText: string;
  actionText?: string;
  dc?: number;
  saveType?: string;
  effectDescription?: string;
}

/**
 * Evaluates whether a given feature or trait is tied to environment/location and if it is currently active.
 */
export function getEnvironmentalTraitStatus(
  featureName: string,
  featureDescription: string,
  currentEnv: EncounterEnvironment
): EnvironmentalTraitStatus {
  const nameLower = (featureName || '').toLowerCase();
  const descLower = (featureDescription || '').toLowerCase();

  // 1. ABOLETH MUCOUS CLOUD
  if (nameLower.includes('mucous cloud') || descLower.includes('under water, surrounded by mucous cloud')) {
    const isActive = currentEnv === 'underwater';
    return {
      isEnvironmental: true,
      isActive,
      requiredEnvironment: 'underwater',
      badgeLabel: isActive ? '🌊 Active Underwater' : '❌ Inactive (Requires Underwater)',
      badgeBg: isActive ? 'bg-cyan-950 border-cyan-500 text-cyan-200' : 'bg-stone-900 border-stone-800 text-stone-500',
      badgeText: isActive ? 'text-cyan-300' : 'text-stone-500',
      actionText: 'Trigger Mucous Cloud Disease Save',
      dc: 14,
      saveType: 'CON',
      effectDescription: 'Creature within 10 ft underwater must succeed on DC 14 CON Save or become diseased (unable to breathe outside water for 1d4 hours).'
    };
  }

  // 2. KOBOLD LIGHT SENSITIVITY
  if (nameLower.includes('light sensitivity') || descLower.includes('bright sunlight')) {
    const isActive = currentEnv === 'terrestrial';
    return {
      isEnvironmental: true,
      isActive,
      requiredEnvironment: 'terrestrial',
      badgeLabel: isActive ? '☀️ Active Sunlight Disadvantage' : '🌙 Inactive (Dim/Shadows)',
      badgeBg: isActive ? 'bg-amber-950 border-amber-500 text-amber-200' : 'bg-stone-900 border-stone-800 text-stone-500',
      badgeText: isActive ? 'text-amber-300' : 'text-stone-500',
      actionText: 'Light Sensitivity Disadvantage Penalty',
      effectDescription: 'Disadvantage on attack rolls and Perception checks relying on sight in direct sunlight.'
    };
  }

  // 3. WATER ELEMENTAL / KRAKEN WHELM & WATER FORM
  if (nameLower.includes('whelm') || nameLower.includes('water form') || descLower.includes('enter a hostile creature\'s space')) {
    const isActive = currentEnv === 'underwater';
    return {
      isEnvironmental: true,
      isActive,
      requiredEnvironment: 'underwater',
      badgeLabel: isActive ? '🌊 Empowered Aquatic Domain' : '⚡ Standard Form',
      badgeBg: isActive ? 'bg-cyan-950 border-cyan-500 text-cyan-200' : 'bg-stone-900 border-stone-800 text-stone-400',
      badgeText: isActive ? 'text-cyan-300' : 'text-stone-400',
      actionText: 'Trigger Aquatic Whelm Surge',
      dc: 15,
      saveType: 'STR',
      effectDescription: 'Creatures in space must succeed on DC 15 STR Save or be engulfed and grappled/restrained.'
    };
  }

  // 4. VOLCANIC LAIR / MAGMA HAZARD
  if (nameLower.includes('volcanic') || nameLower.includes('magma') || descLower.includes('magma erupts')) {
    const isActive = currentEnv === 'volcanic' || currentEnv === 'lair_active';
    return {
      isEnvironmental: true,
      isActive,
      requiredEnvironment: 'volcanic',
      badgeLabel: isActive ? '🌋 Volcanic Lair Hazard Active' : '❌ Lair Inactive',
      badgeBg: isActive ? 'bg-amber-950 border-amber-500 text-amber-200' : 'bg-stone-900 border-stone-800 text-stone-500',
      badgeText: isActive ? 'text-amber-300' : 'text-stone-500',
      actionText: 'Trigger Magma Eruption (6d6 Fire)',
      dc: 15,
      saveType: 'DEX',
      effectDescription: 'Point on ground erupts in magma: DC 15 DEX save or 6d6 Fire damage (half on save).'
    };
  }

  // 5. GELATINOUS CUBE TRANSPARENT
  if (nameLower.includes('transparent') || descLower.includes('motionless cube')) {
    const isActive = currentEnv === 'terrestrial' || currentEnv === 'shadowfell';
    return {
      isEnvironmental: true,
      isActive,
      requiredEnvironment: 'terrestrial',
      badgeLabel: isActive ? '🌫️ Concealed Object (DC 15 Perception)' : '👁️ Visible',
      badgeBg: 'bg-emerald-950 border-emerald-500 text-emerald-200',
      badgeText: 'text-emerald-300',
      effectDescription: 'DC 15 Wisdom (Perception) check required to spot an unmoving cube.'
    };
  }

  return {
    isEnvironmental: false,
    isActive: true,
    badgeLabel: '',
    badgeBg: '',
    badgeText: ''
  };
}

/**
 * Checks if underwater attack rolls suffer disadvantage based on D&D 5e underwater combat rules.
 */
export function isUnderwaterAttackDisadvantaged(
  damageType: string,
  rangeStr: string,
  hasSwimSpeed: boolean = false
): boolean {
  if (hasSwimSpeed) return false;

  const typeLower = (damageType || '').toLowerCase();
  const rangeLower = (rangeStr || '').toLowerCase();

  // Ranged weapon attacks automatically fail beyond normal range or have disadvantage within normal range
  if (rangeLower.includes('ranged') || rangeLower.includes('ft') && !rangeLower.includes('melee')) {
    return true;
  }

  // Melee attacks have disadvantage unless piercing (Dagger, Spear, Trident, Shortsword)
  if (!typeLower.includes('piercing')) {
    return true;
  }

  return false;
}
