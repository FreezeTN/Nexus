import { CharacterData, GearItem } from '../types';

export interface HandsCapacityInfo {
  maxHands: number;
  breakdown: string;
  source: string;
  isTemporary: boolean;
  hasExtraArms: boolean;
  hasNoHands: boolean;
}

export interface EquippedHandsUsage {
  usedHands: number;
  maxHands: number;
  freeHands: number;
  equippedHeldItems: { item: GearItem; hands: number }[];
  equippedShields: GearItem[];
  capacityInfo: HandsCapacityInfo;
}

export interface EquipCheckResult {
  allowed: boolean;
  reason?: string;
  handsNeeded: number;
  currentUsed: number;
  maxHands: number;
}

/**
 * Calculates a character's maximum hands capacity, taking into account:
 * - Base humanoid anatomy (2 hands)
 * - Racial exceptions (Thri-kreen 4 arms, Kasatha 4 arms, etc.)
 * - Active transformations (Wild Shape beast without hands = 0, Girallon form = 4, etc.)
 * - Active spells / conditions / buffs (Girallon's Blessing +2, Astral Arms +2, Extra Arms +2, etc.)
 * - Physical conditions / debuffs (Lost Arm -1, Severed Arm -1, No Arms = 0)
 * - Custom hands override
 */
export function getCharacterHandsCapacity(char: CharacterData): HandsCapacityInfo {
  if (!char) {
    return {
      maxHands: 2,
      breakdown: 'Standard Humanoid (2 hands)',
      source: 'Default',
      isTemporary: false,
      hasExtraArms: false,
      hasNoHands: false
    };
  }

  // 1. Check Active Transformation first (Beast Wild Shape, Polymorph, Shapechange)
  if (char.activeTransformation) {
    const form = char.activeTransformation.form;
    const formName = (form.name || '').toLowerCase();

    // If form explicitly specifies hasHands === false, creature has 0 hands to hold weapons/gear
    if (form.hasHands === false) {
      return {
        maxHands: 0,
        breakdown: `Beast Shape (${form.name}): Natural beast anatomy (0 hands for gear)`,
        source: form.name,
        isTemporary: true,
        hasExtraArms: false,
        hasNoHands: true
      };
    }

    // Check if form specifies an explicit hands count
    if (typeof (form as any).handsCount === 'number') {
      const count = Math.max(0, (form as any).handsCount);
      return {
        maxHands: count,
        breakdown: `${form.name} Form: ${count} hands available`,
        source: form.name,
        isTemporary: true,
        hasExtraArms: count > 2,
        hasNoHands: count === 0
      };
    }

    // Multi-armed monster forms
    if (formName.includes('girallon')) {
      return {
        maxHands: 4,
        breakdown: 'Girallon Shape: 4 powerful gorilla arms',
        source: form.name,
        isTemporary: true,
        hasExtraArms: true,
        hasNoHands: false
      };
    }

    if (formName.includes('marilith')) {
      return {
        maxHands: 6,
        breakdown: 'Marilith Shape: 6 demonic weapon-wielding arms',
        source: form.name,
        isTemporary: true,
        hasExtraArms: true,
        hasNoHands: false
      };
    }

    if (formName.includes('thri-kreen') || formName.includes('thrikreen')) {
      return {
        maxHands: 4,
        breakdown: 'Thri-kreen Form: 4 insectoid limbs',
        source: form.name,
        isTemporary: true,
        hasExtraArms: true,
        hasNoHands: false
      };
    }

    // Default humanoid/ape form
    return {
      maxHands: 2,
      breakdown: `${form.name} Form: Humanoid hands (2 hands)`,
      source: form.name,
      isTemporary: true,
      hasExtraArms: false,
      hasNoHands: false
    };
  }

  // 2. Check Custom DM / Player Override
  if (typeof (char as any).handsCountOverride === 'number') {
    const override = Math.max(0, (char as any).handsCountOverride);
    return {
      maxHands: override,
      breakdown: `Custom Override: ${override} hands set manually`,
      source: 'Custom Override',
      isTemporary: false,
      hasExtraArms: override > 2,
      hasNoHands: override === 0
    };
  }

  // 3. Base Anatomy from Race / Subrace
  let baseHands = 2;
  const raceSources: string[] = [];
  const hybridText = char.hybridHeritage
    ? `${char.hybridHeritage.primaryParent || ''} ${char.hybridHeritage.secondaryParent || ''} ${char.hybridHeritage.customHybridName || ''}`
    : '';
  const fullRaceText = `${char.race || ''} ${hybridText}`.toLowerCase();

  if (fullRaceText.includes('thri-kreen') || fullRaceText.includes('thrikreen')) {
    baseHands = 4;
    raceSources.push('Thri-kreen Secondary Arms (4 Hands)');
  } else if (fullRaceText.includes('kasatha')) {
    baseHands = 4;
    raceSources.push('Kasatha Quad-Wielder (4 Hands)');
  } else if (fullRaceText.includes('girallon')) {
    baseHands = 4;
    raceSources.push('Girallon Heritage (4 Hands)');
  } else if (fullRaceText.includes('marilith')) {
    baseHands = 6;
    raceSources.push('Marilith Heritage (6 Hands)');
  } else if (
    fullRaceText.includes('four-armed') ||
    fullRaceText.includes('4-armed') ||
    fullRaceText.includes('four arms') ||
    fullRaceText.includes('4 arms')
  ) {
    baseHands = 4;
    raceSources.push('Four-Armed Race (4 Hands)');
  } else if (
    fullRaceText.includes('six-armed') ||
    fullRaceText.includes('6-armed') ||
    fullRaceText.includes('six arms') ||
    fullRaceText.includes('6 arms')
  ) {
    baseHands = 6;
    raceSources.push('Six-Armed Race (6 Hands)');
  } else if (fullRaceText.includes('multi-armed') || fullRaceText.includes('extra arms')) {
    baseHands = 4;
    raceSources.push('Multi-Armed Race (4 Hands)');
  } else {
    raceSources.push('Standard Humanoid (2 Hands)');
  }

  // 4. Features & Feats Check (e.g. Simic Hybrid Grappling Appendages, Astral Self)
  let featureBonus = 0;
  const featureSources: string[] = [];
  const allFeatures = [...(char.classFeatures || []), ...(char.feats || [])];

  for (const feat of allFeatures) {
    const featText = `${feat.name || ''} ${feat.description || ''}`.toLowerCase();
    if (
      (featText.includes('secondary arms') || featText.includes('extra arms') || featText.includes('four arms')) &&
      baseHands === 2 &&
      featureBonus === 0
    ) {
      featureBonus += 2;
      featureSources.push(`${feat.name} (+2 arms)`);
    } else if (featText.includes('grappling appendages') && featureBonus === 0) {
      featureBonus += 2;
      featureSources.push(`${feat.name} (+2 appendages)`);
    } else if (featText.includes('third arm') || featText.includes('grafted arm')) {
      featureBonus += 1;
      featureSources.push(`${feat.name} (+1 arm)`);
    }
  }

  // 5. Active Conditions & Temporary Spell Buffs / Debuffs
  let conditionModifier = 0;
  const conditionSources: string[] = [];
  let isTemporary = false;
  let forceZeroHands = false;

  const activeConditions = [
    ...(char.conditions || []),
    ...(char.lingeringInjuries || [])
  ];
  for (const cond of activeConditions) {
    const condLower = cond.toLowerCase();

    // Spells granting extra arms
    if (
      condLower.includes("girallon's blessing") ||
      condLower.includes('girallons blessing') ||
      condLower.includes('girallon blessing')
    ) {
      conditionModifier += 2;
      conditionSources.push("Girallon's Blessing (+2 Arms)");
      isTemporary = true;
    } else if (
      condLower.includes('astral arms') ||
      condLower.includes('arms of the astral self') ||
      condLower.includes('astral self arms')
    ) {
      conditionModifier += 2;
      conditionSources.push('Arms of the Astral Self (+2 Arms)');
      isTemporary = true;
    } else if (
      condLower.includes('four-armed') ||
      condLower.includes('4-armed') ||
      condLower.includes('four arms') ||
      condLower.includes('extra arms')
    ) {
      conditionModifier += 2;
      conditionSources.push(`${cond} (+2 Arms)`);
      isTemporary = true;
    } else if (
      condLower.includes('extra arm') ||
      condLower.includes('third arm') ||
      condLower.includes('grafted arm') ||
      condLower.includes('cyberarm')
    ) {
      conditionModifier += 1;
      conditionSources.push(`${cond} (+1 Arm)`);
      isTemporary = true;
    } else if (condLower.includes('tentacles') || condLower.includes('arms of hadar')) {
      conditionModifier += 2;
      conditionSources.push(`${cond} (+2 Limbs)`);
      isTemporary = true;
    }

    // Limiting conditions / amputations / restraints
    if (
      condLower.includes('lost arm') ||
      condLower.includes('one-armed') ||
      condLower.includes('one armed') ||
      condLower.includes('severed arm') ||
      condLower.includes('amputated arm')
    ) {
      conditionModifier -= 1;
      conditionSources.push(`${cond} (-1 Arm)`);
      isTemporary = true;
    }

    if (
      condLower.includes('lost both arms') ||
      condLower.includes('no arms') ||
      condLower.includes('amputated arms') ||
      condLower.includes('restrained (both hands)') ||
      condLower.includes('tied hands') ||
      condLower.includes('manacled hands')
    ) {
      forceZeroHands = true;
      conditionSources.push(`${cond} (0 Hands Available)`);
      isTemporary = true;
    }
  }

  let finalMax = forceZeroHands ? 0 : Math.max(0, baseHands + featureBonus + conditionModifier);

  const breakdownParts: string[] = [];
  if (raceSources.length > 0) breakdownParts.push(raceSources.join(', '));
  if (featureSources.length > 0) breakdownParts.push(featureSources.join(', '));
  if (conditionSources.length > 0) breakdownParts.push(conditionSources.join(', '));

  return {
    maxHands: finalMax,
    breakdown: breakdownParts.join(' | ') || `Humanoid (${finalMax} hands)`,
    source: conditionSources.length > 0 ? conditionSources[0] : (raceSources[0] || 'Base Anatomy'),
    isTemporary,
    hasExtraArms: finalMax > 2,
    hasNoHands: finalMax === 0
  };
}

/**
 * Checks whether an item functions as a Shield.
 */
export function isShieldItem(item: GearItem): boolean {
  if (!item) return false;
  if (item.armorType === 'Shield') return true;
  if (item.itemType === 'Shield') return true;
  if (item.slot === 'Shield') return true;

  const nameLower = (item.name || '').toLowerCase();
  const notesLower = (item.notes || '').toLowerCase();

  // Exclude non-shield items that merely mention the word "shield"
  const nonShields = ['ring of', 'scroll of', 'potion of', 'brooch of', 'cloak of', 'spell', 'tome of'];
  if (nonShields.some(ns => nameLower.includes(ns))) {
    return false;
  }

  return nameLower.includes('shield') || notesLower.includes('shield (+2 ac)');
}

/**
 * Checks whether an item functions as body armor (e.g. Plate, Chainmail, Leather).
 * Excludes shields.
 */
export function isArmorItem(item: GearItem): boolean {
  if (!item) return false;
  if (isShieldItem(item)) return false;
  if (item.itemType === 'Armor' && item.armorType !== 'Shield') return true;
  if (item.slot === 'Armor') return true;
  if (item.armorType && ['Light', 'Medium', 'Heavy', 'Bonus'].includes(item.armorType)) return true;
  if (typeof item.armorAc === 'number' && item.armorAc > 0) return true;

  const nameLower = (item.name || '').toLowerCase().trim();
  if (nameLower.startsWith('potion of') || nameLower.startsWith('scroll of') || nameLower.startsWith('ring of')) {
    return false;
  }

  const armorPatterns = [
    /\barmor\b/, /\bplate\b/, /\bchainmail\b/, /\bchain mail\b/, /\bbreastplate\b/,
    /\bcuirass\b/, /\bleather\b/, /\bstudded leather\b/, /\bscale mail\b/, /\bchain shirt\b/,
    /\bring mail\b/, /\bhalf plate\b/, /\bfull plate\b/, /\bsplint\b/, /\bbrigandine\b/,
    /\bhauberk\b/, /\bgambeson\b/, /\bhounskull\b/, /\bdragon scale\b/, /\brobes of the archmagi\b/
  ];

  return armorPatterns.some(pat => pat.test(nameLower));
}

/**
 * Checks whether an item is a container (Backpack, Bag of Holding, Sack, Pouch, etc.).
 */
export function isContainerItem(item: GearItem): boolean {
  if (!item) return false;
  if (item.isContainer === true) return true;
  if (Boolean(item.containerType)) return true;
  if (Boolean(item.containerCapacityLbs)) return true;

  const nameLower = (item.name || '').toLowerCase();
  const containerPatterns = [
    /\bbackpack\b/, /\bbag of holding\b/, /\bhaversack\b/, /\bhandy haversack\b/,
    /\bpouch\b/, /\bsack\b/, /\bchest\b/, /\bsatchel\b/, /\bquiver\b/, /\bcomponent pouch\b/
  ];

  return containerPatterns.some(pat => pat.test(nameLower));
}

/**
 * Checks whether an item is a Two-Handed weapon requiring 2 hands to wield.
 */
export function isTwoHandedWeapon(item: GearItem): boolean {
  if (!item) return false;
  if (item.slot === 'Two-Handed') return true;
  if (item.weaponStats?.isTwoHanded === true) return true;
  if (item.weaponStats?.range?.toLowerCase().includes('two-handed')) return true;

  const notesLower = (item.notes || '').toLowerCase();
  if (notesLower.includes('two-handed') && !notesLower.includes('versatile')) return true;

  const nameLower = (item.name || '').toLowerCase();
  const twoHandedPatterns = [
    /\bgreatsword\b/, /\bgreataxe\b/, /\bmaul\b/, /\bglaive\b/, /\bhalberd\b/,
    /\bpike\b/, /\bheavy crossbow\b/, /\blongbow\b/, /\bmusket\b/, /\bheavy flail\b/,
    /\bgreatclub\b/, /\btwo-handed\b/, /\b2-handed\b/
  ];

  return twoHandedPatterns.some(pat => pat.test(nameLower));
}

/**
 * Checks whether an item functions as a Weapon (Melee or Ranged).
 */
export function isWeaponItem(item: GearItem): boolean {
  if (!item) return false;
  if (item.itemType === 'Weapon') return true;
  if (Boolean(item.weaponStats?.damage) || Boolean(item.weaponStats?.attackBonus)) return true;
  if (item.slot === 'Main Hand' || item.slot === 'Off Hand' || item.slot === 'Two-Handed') {
    if (!isShieldItem(item)) return true;
  }

  const nameLower = (item.name || '').toLowerCase().trim();
  const notesLower = (item.notes || '').toLowerCase();

  // Exclude non-weapon item categories
  const nonWeaponPrefixes = [
    'potion of', 'scroll of', 'ring of', 'cloak of', 'boots of', 'helm of', 'amulet of', 'belt of',
    'bag of', 'quiver of', 'horn of', 'pipes of', 'rope of', 'deck of', 'figurine of', 'tome of',
    'manual of', 'oil of', 'dust of', 'candle of', 'bead of', 'iron bands of', 'eyes of', 'brooch of',
    'circlet of', 'medallion of', 'periapt of', 'bracers of defense', 'gauntlets of ogre power'
  ];
  if (nonWeaponPrefixes.some(p => nameLower.startsWith(p) || nameLower.includes(p))) {
    return false;
  }

  if (isShieldItem(item) || isArmorItem(item) || isContainerItem(item)) {
    return false;
  }

  const weaponPatterns = [
    /\bwaraxe\b/, /\bbattleaxe\b/, /\bgreataxe\b/, /\bhandaxe\b/, /\baxe\b/,
    /\bgreatsword\b/, /\blongsword\b/, /\bshortsword\b/, /\bbroadsword\b/, /\bscimitar\b/,
    /\brapier\b/, /\bfalchion\b/, /\bclaymore\b/, /\bblade\b/, /\bkatana\b/, /\bwakizashi\b/,
    /\bcutlass\b/, /\bsaber\b/, /\bsabre\b/, /\bsword\b/,
    /\blongbow\b/, /\bshortbow\b/, /\bcrossbow\b/, /\bbow\b/, /\barbalest\b/,
    /\bdagger\b/, /\bknife\b/, /\bdirk\b/, /\bstiletto\b/, /\bkukri\b/, /\bsai\b/, /\bkatar\b/,
    /\bmace\b/, /\bmorningstar\b/, /\bflail\b/, /\bwarhammer\b/, /\bmaul\b/, /\bclub\b/, /\bgreatclub\b/,
    /\bspear\b/, /\bpike\b/, /\bhalberd\b/, /\bglaive\b/, /\blance\b/, /\btrident\b/, /\bjavelin\b/, /\bpolearm\b/,
    /\bwhip\b/, /\bsling\b/, /\bdart\b/, /\bblowgun\b/, /\bnet\b/, /\bshuriken\b/, /\bscythe\b/, /\bsickle\b/,
    /\bquarterstaff\b/, /\bmusket\b/, /\bpistol\b/, /\brifle\b/, /\bblunderbuss\b/
  ];

  if (weaponPatterns.some(pat => pat.test(nameLower))) {
    return true;
  }

  if (notesLower.includes('simple melee weapon') || notesLower.includes('martial melee weapon') ||
      notesLower.includes('simple ranged weapon') || notesLower.includes('martial ranged weapon') ||
      notesLower.includes('melee weapon') || notesLower.includes('ranged weapon')) {
    return true;
  }

  return false;
}

export interface ItemBadgeInfo {
  label: string;
  icon: string;
  className: string;
  title: string;
}

/**
 * Returns a standardized equipment badge for any inventory item,
 * correctly showing hands requirements, armor category, container type, or worn slot.
 */
export function getItemEquipmentBadge(item: GearItem): ItemBadgeInfo | null {
  if (!item) return null;

  // 1. Shield (Priority #1 - explicitly validated by user: "The Heavy Steel Shield is correctly labeled")
  if (isShieldItem(item)) {
    return {
      icon: '✋',
      label: 'Shield (1H)',
      className: 'text-cyan-300 bg-cyan-950/80 border-cyan-700/60',
      title: 'Shield (Occupies 1 hand. Max 1 active shield bonus)'
    };
  }

  // 2. Weapons (Two-Handed vs One-Handed)
  if (isWeaponItem(item)) {
    if (isTwoHandedWeapon(item)) {
      return {
        icon: '✋',
        label: '2 Hands',
        className: 'text-amber-300 bg-amber-950/80 border-amber-600/60',
        title: 'Two-Handed Weapon (Requires 2 hands to wield)'
      };
    }
    return {
      icon: '✋',
      label: '1 Hand',
      className: 'text-amber-200/90 bg-amber-950/50 border-amber-800/60',
      title: 'One-Handed Weapon (Occupies 1 hand)'
    };
  }

  // 3. Body Armor
  if (isArmorItem(item)) {
    const rawType = item.armorType ? `${item.armorType} Armor` : 'Armor (Body)';
    const label = (rawType === 'Heavy Armor' || rawType === 'Medium Armor' || rawType === 'Light Armor')
      ? rawType
      : 'Armor (Body)';
    return {
      icon: '🛡️',
      label,
      className: 'text-blue-300 bg-blue-950/80 border-blue-700/60',
      title: 'Body Armor (Worn on torso, occupies 0 hands)'
    };
  }

  // 4. Containers
  if (isContainerItem(item)) {
    return {
      icon: '🎒',
      label: 'Container',
      className: 'text-purple-300 bg-purple-950/80 border-purple-700/60',
      title: 'Container / Bag (Stores gear and carried items)'
    };
  }

  // 5. Worn Accessories
  const slot = item.slot;
  const nameLower = (item.name || '').toLowerCase();

  if (slot === 'Ring' || /\bring\b/.test(nameLower)) {
    return {
      icon: '💍',
      label: 'Ring',
      className: 'text-indigo-300 bg-indigo-950/80 border-indigo-700/60',
      title: 'Finger Ring (Worn on finger, occupies 0 hands)'
    };
  }
  if (slot === 'Amulet' || /\b(amulet|necklace|periapt|talisman|medallion|pendant)\b/.test(nameLower)) {
    return {
      icon: '📿',
      label: 'Amulet',
      className: 'text-indigo-300 bg-indigo-950/80 border-indigo-700/60',
      title: 'Amulet / Pendant (Worn around neck, occupies 0 hands)'
    };
  }
  if (slot === 'Cloak' || /\b(cloak|cape|mantle|robe)\b/.test(nameLower)) {
    return {
      icon: '🧥',
      label: 'Cloak',
      className: 'text-indigo-300 bg-indigo-950/80 border-indigo-700/60',
      title: 'Cloak / Mantle (Worn on shoulders, occupies 0 hands)'
    };
  }
  if (slot === 'Boots' || /\b(boots|shoes|slippers|greaves)\b/.test(nameLower)) {
    return {
      icon: '👢',
      label: 'Boots',
      className: 'text-indigo-300 bg-indigo-950/80 border-indigo-700/60',
      title: 'Footwear (Worn on feet, occupies 0 hands)'
    };
  }
  if (slot === 'Headwear' || /\b(helm|helmet|circlet|crown|hat|cap|diadem)\b/.test(nameLower)) {
    return {
      icon: '👑',
      label: 'Head',
      className: 'text-indigo-300 bg-indigo-950/80 border-indigo-700/60',
      title: 'Headwear (Worn on head, occupies 0 hands)'
    };
  }
  if (slot === 'Belt' || /\b(belt|girdle|sash)\b/.test(nameLower)) {
    return {
      icon: '🥋',
      label: 'Belt',
      className: 'text-indigo-300 bg-indigo-950/80 border-indigo-700/60',
      title: 'Belt (Worn around waist, occupies 0 hands)'
    };
  }
  if (slot === 'Gloves' || /\b(gloves|gauntlets|bracers)\b/.test(nameLower)) {
    return {
      icon: '🧤',
      label: 'Gloves',
      className: 'text-indigo-300 bg-indigo-950/80 border-indigo-700/60',
      title: 'Handwear / Gloves (Worn on hands/arms, occupies 0 hands)'
    };
  }

  // 6. Consumables & Held Focuses
  if (item.itemType === 'Potion' || /\bpotion\b/.test(nameLower)) {
    return {
      icon: '🧪',
      label: 'Potion',
      className: 'text-emerald-300 bg-emerald-950/80 border-emerald-700/60',
      title: 'Potion / Consumable'
    };
  }
  if (item.itemType === 'Scroll' || /\bscroll\b/.test(nameLower)) {
    return {
      icon: '📜',
      label: 'Scroll',
      className: 'text-yellow-300 bg-yellow-950/80 border-yellow-700/60',
      title: 'Scroll / Consumable'
    };
  }
  if (item.itemType === 'Wand' || item.itemType === 'Rod' || /\b(wand|rod|staff of)\b/.test(nameLower)) {
    return {
      icon: '🪄',
      label: 'Focus (1H)',
      className: 'text-violet-300 bg-violet-950/80 border-violet-700/60',
      title: 'Spellcasting Focus / Wand (Held in 1 hand)'
    };
  }

  return null;
}

/**
 * Calculates the number of hands an item requires to hold/actively wield when equipped:
 * - Body worn items (Armor, Cloaks, Boots, Rings, Amulets, Helmets, Belts): 0 hands
 * - Two-Handed Weapons (Greatsword, Greataxe, Maul, Pike, Longbow, Heavy Crossbow, etc.): 2 hands
 * - One-Handed Weapons (Longsword, Rapier, Dagger, Mace, Handaxe, Waraxe, etc.): 1 hand
 * - Shields: 1 hand
 * - Wands, Staves, Rods, Held Foci: 1 hand
 */
export function getItemHandsRequired(item: GearItem): number {
  if (!item) return 0;

  // 1. Shields occupy 1 hand
  if (isShieldItem(item)) {
    return 1;
  }

  // 2. Check Two-Handed items / weapons
  if (isTwoHandedWeapon(item)) {
    return 2;
  }

  // 3. Check Weapons (One-Handed)
  if (isWeaponItem(item)) {
    return 1;
  }

  // 4. Explicit Body-worn slots that do NOT require hands
  const bodySlots = ['Armor', 'Headwear', 'Cloak', 'Boots', 'Ring', 'Belt', 'Amulet', 'Gloves', 'Wondrous', 'Inventory'];
  if (item.slot && bodySlots.includes(item.slot)) {
    return 0;
  }

  const nonHandTypes = ['Ring', 'Amulet', 'Cloak', 'Boots', 'Headwear', 'Belt', 'Potion', 'Scroll', 'Wondrous Item'];
  if (item.itemType && nonHandTypes.includes(item.itemType)) {
    return 0;
  }

  // Worn body armor does not take hands
  if (isArmorItem(item)) {
    return 0;
  }

  // 5. Held items (Wands, Rods, Staves, Main Hand / Off Hand slots)
  if (item.slot === 'Main Hand' || item.slot === 'Off Hand') {
    return 1;
  }

  if (item.itemType === 'Wand' || item.itemType === 'Rod') {
    return 1;
  }

  const nameLower = (item.name || '').toLowerCase();
  if (nameLower.includes('wand of') || nameLower.includes('rod of') || nameLower.includes('staff of')) {
    return 1;
  }

  return 0;
}

/**
 * Summarizes the current hands usage across all equipped items for a character.
 */
export function getEquippedHandsUsage(char: CharacterData): EquippedHandsUsage {
  const capacityInfo = getCharacterHandsCapacity(char);
  const inventory = char?.inventory || [];

  const equippedHeldItems: { item: GearItem; hands: number }[] = [];
  const equippedShields: GearItem[] = [];
  let usedHands = 0;

  for (const item of inventory) {
    if (!item.equipped || item.stored) continue;

    const hands = getItemHandsRequired(item);
    if (hands > 0) {
      usedHands += hands;
      equippedHeldItems.push({ item, hands });
    }

    if (isShieldItem(item)) {
      equippedShields.push(item);
    }
  }

  const freeHands = Math.max(0, capacityInfo.maxHands - usedHands);

  return {
    usedHands,
    maxHands: capacityInfo.maxHands,
    freeHands,
    equippedHeldItems,
    equippedShields,
    capacityInfo
  };
}

/**
 * Validates whether a specific item can be equipped without violating hand capacity or D&D shield rules.
 */
export function canEquipItem(char: CharacterData, item: GearItem): EquipCheckResult {
  if (!char || !item) {
    return { allowed: true, handsNeeded: 0, currentUsed: 0, maxHands: 2 };
  }

  // If item is already equipped, user is toggling it off (unequipping is always allowed)
  if (item.equipped) {
    const current = getEquippedHandsUsage(char);
    return { allowed: true, handsNeeded: 0, currentUsed: current.usedHands, maxHands: current.maxHands };
  }

  const handsNeeded = getItemHandsRequired(item);
  const currentUsage = getEquippedHandsUsage(char);
  const maxHands = currentUsage.maxHands;

  // Non-held items (armor suits, cloaks, rings, boots) do not require hands
  if (handsNeeded === 0) {
    return {
      allowed: true,
      handsNeeded: 0,
      currentUsed: currentUsage.usedHands,
      maxHands
    };
  }

  // 1. Check if creature has NO hands available
  if (maxHands === 0) {
    return {
      allowed: false,
      reason: `Cannot equip "${item.name}": ${char.name} has no free hands or humanoid limbs available in this form (${currentUsage.capacityInfo.breakdown}).`,
      handsNeeded,
      currentUsed: currentUsage.usedHands,
      maxHands
    };
  }

  // 2. Check Shield Limits (D&D 5e: "You can benefit from only one shield at a time", and you only have one shield arm)
  if (isShieldItem(item)) {
    if (currentUsage.equippedShields.length > 0) {
      const activeShield = currentUsage.equippedShields[0];
      return {
        allowed: false,
        reason: `Cannot equip "${item.name}": A shield is already equipped ("${activeShield.name}"). Under D&D rules, you can only wield one shield at a time.`,
        handsNeeded,
        currentUsed: currentUsage.usedHands,
        maxHands
      };
    }
  }

  // 3. Check Hands Capacity
  if (currentUsage.usedHands + handsNeeded > maxHands) {
    const heldNames = currentUsage.equippedHeldItems.map(h => `${h.item.name} (${h.hands} hand${h.hands > 1 ? 's' : ''})`).join(', ');
    const handsWord = handsNeeded === 1 ? '1 hand' : `${handsNeeded} hands`;
    const availWord = currentUsage.freeHands === 1 ? '1 hand free' : `${currentUsage.freeHands} hands free`;

    return {
      allowed: false,
      reason: `Cannot equip "${item.name}" (requires ${handsWord}): You only have ${availWord} out of ${maxHands} total hands. Currently occupying hands: ${heldNames || 'None'}. Unequip a weapon or shield first.`,
      handsNeeded,
      currentUsed: currentUsage.usedHands,
      maxHands
    };
  }

  return {
    allowed: true,
    handsNeeded,
    currentUsed: currentUsage.usedHands,
    maxHands
  };
}

/**
 * Reconciles equipped items when hands capacity changes or temporary effects end.
 * If currently equipped items exceed the new hand capacity or exceed 1 shield,
 * excess items are automatically unequipped and returned in the result.
 */
export function reconcileEquippedHands(char: CharacterData): {
  character: CharacterData;
  unequippedItems: GearItem[];
  message?: string;
} {
  if (!char || !char.inventory || char.inventory.length === 0) {
    return { character: char, unequippedItems: [] };
  }

  const capacityInfo = getCharacterHandsCapacity(char);
  const maxHands = capacityInfo.maxHands;

  let currentHandsUsed = 0;
  let shieldsCount = 0;
  const unequippedItems: GearItem[] = [];

  // Pass 1: Keep non-held items, track held items and shields
  // Items will be retained in order, but if limit is exceeded, later items are unequipped
  const updatedInventory: GearItem[] = [];

  for (const item of char.inventory) {
    if (!item.equipped || item.stored) {
      updatedInventory.push(item);
      continue;
    }

    const hands = getItemHandsRequired(item);
    const isShield = isShieldItem(item);

    // Non-held items stay equipped
    if (hands === 0) {
      updatedInventory.push(item);
      continue;
    }

    // Check if adding this shield exceeds shield limit
    if (isShield && shieldsCount >= 1) {
      unequippedItems.push(item);
      updatedInventory.push({ ...item, equipped: false });
      continue;
    }

    // Check if adding this item exceeds maxHands
    if (currentHandsUsed + hands > maxHands) {
      unequippedItems.push(item);
      updatedInventory.push({ ...item, equipped: false });
      continue;
    }

    // Successfully fits within hands limit
    currentHandsUsed += hands;
    if (isShield) shieldsCount++;
    updatedInventory.push(item);
  }

  if (unequippedItems.length === 0) {
    return { character: char, unequippedItems: [] };
  }

  const unequippedNames = unequippedItems.map(i => i.name).join(', ');
  const message = `Hand capacity updated to ${maxHands} hands (${capacityInfo.source}). Automatically unequipped excess items: ${unequippedNames}.`;

  return {
    character: {
      ...char,
      inventory: updatedInventory
    },
    unequippedItems,
    message
  };
}
