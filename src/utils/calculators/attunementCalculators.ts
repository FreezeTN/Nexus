import { CharacterData, GearItem } from '../../types';

export interface AttunementSlotsBreakdown {
  maxSlots: number;
  isArtificer: boolean;
  artificerLevel: number;
  featureName?: string;
  grantedByItems: number;
  reason: string;
}

export interface AttunementStatus {
  currentAttuned: number;
  maxAttuned: number;
  isOverLimit: boolean;
  attunedItems: GearItem[];
  unattunedAttunableItems: GearItem[];
  breakdown: AttunementSlotsBreakdown;
}

/**
 * Calculates max attunement slots for a character.
 * Standard is 3. Artificers get bonus slots at levels 10, 14, and 18.
 */
export function getMaxAttunementSlots(char: CharacterData): AttunementSlotsBreakdown {
  if (!char) {
    return {
      maxSlots: 3,
      isArtificer: false,
      artificerLevel: 0,
      grantedByItems: 0,
      reason: 'Standard 5e (3 slots)'
    };
  }

  const primaryClass = (char.characterClass || '').toLowerCase();
  const secondaryClass = (char.optionalRules?.secondaryClass || '').toLowerCase();

  let isArtificer = false;
  let artificerLevel = 0;

  if (primaryClass.includes('artificer')) {
    isArtificer = true;
    artificerLevel = char.level || 1;
  } else if (char.optionalRules?.useMulticlassing && secondaryClass.includes('artificer')) {
    isArtificer = true;
    artificerLevel = char.optionalRules?.secondaryLevel || 1;
  }

  let baseSlots = 3;
  let featureName: string | undefined = undefined;

  if (isArtificer) {
    if (artificerLevel >= 18) {
      baseSlots = 6;
      featureName = 'Magic Item Master (Level 18)';
    } else if (artificerLevel >= 14) {
      baseSlots = 5;
      featureName = 'Magic Item Savant (Level 14)';
    } else if (artificerLevel >= 10) {
      baseSlots = 4;
      featureName = 'Magic Item Adept (Level 10)';
    }
  }

  let grantedByItems = 0;
  const inventory = char.inventory || [];
  for (const item of inventory) {
    if (item.equipped && !item.stored && item.attunementSlotsGranted) {
      grantedByItems += item.attunementSlotsGranted;
    }
  }

  const maxSlots = baseSlots + grantedByItems;

  let reason = `Standard 5e (3 slots)`;
  if (featureName) {
    reason = `Artificer: ${featureName} (${baseSlots} slots)`;
  }
  if (grantedByItems > 0) {
    reason += ` + ${grantedByItems} from Magic Items`;
  }

  return {
    maxSlots,
    isArtificer,
    artificerLevel,
    featureName,
    grantedByItems,
    reason
  };
}

/**
 * Checks item attunement requirement.
 */
export function itemRequiresAttunement(item: GearItem): boolean {
  if (item.requiresAttunement !== undefined) {
    return item.requiresAttunement;
  }
  const notes = (item.notes || '').toLowerCase();
  const name = (item.name || '').toLowerCase();
  return notes.includes('attune') || notes.includes('requires attunement') || name.includes('(attuned)');
}

/**
 * Returns comprehensive attunement status for a character.
 */
export function getAttunementStatus(char: CharacterData): AttunementStatus {
  const breakdown = getMaxAttunementSlots(char);
  const inventory = char.inventory || [];

  const attunedItems: GearItem[] = [];
  const unattunedAttunableItems: GearItem[] = [];

  inventory.forEach(item => {
    const req = itemRequiresAttunement(item);
    if (req) {
      if (item.attuned) {
        attunedItems.push(item);
      } else {
        unattunedAttunableItems.push(item);
      }
    }
  });

  return {
    currentAttuned: attunedItems.length,
    maxAttuned: breakdown.maxSlots,
    isOverLimit: attunedItems.length > breakdown.maxSlots,
    attunedItems,
    unattunedAttunableItems,
    breakdown
  };
}

