import { SupportedEdition } from '../components/compendium/forge/ForgeTypes';

export type ValidationSeverity = 'info' | 'warning' | 'critical';

export interface ValidationIssue {
  id: string;
  field?: string;
  severity: ValidationSeverity;
  title: string;
  message: string;
  suggestion?: string;
  ruleCategory: 'stat_increment' | 'bounded_accuracy' | 'action_economy' | 'defense' | 'formatting' | 'syntax';
}

export interface ValidationResult {
  isValid: boolean; // false only if there are critical errors
  hasWarnings: boolean;
  hasCritical: boolean;
  score: number; // 0 to 100 (100 = perfectly balanced)
  issues: ValidationIssue[];
}

/**
 * Parses ability score increments from any freeform text or dedicated bonus string.
 * Detects patterns like:
 * - "+10 to Strength"
 * - "+10 STR"
 * - "Strength +10"
 * - "+2 Str, +1 Dex"
 * - "+4 to all stats"
 * - "+5 Constitution"
 */
export interface ParsedStatBonus {
  stat: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA' | 'ALL' | 'ANY';
  value: number;
  rawMatch: string;
}

export function parseAbilityScoreBonuses(input: string): ParsedStatBonus[] {
  if (!input || typeof input !== 'string') return [];
  const results: ParsedStatBonus[] = [];

  // Match "+/-X to all stats/attributes"
  const allMatch = input.match(/([+-]?\d+)\s*(?:to\s*)?(?:all\s*(?:ability\s*scores|stats|attributes))/i);
  if (allMatch) {
    const val = parseInt(allMatch[1], 10);
    if (!isNaN(val)) {
      results.push({ stat: 'ALL', value: val, rawMatch: allMatch[0] });
    }
  }

  // Match "+/-X to any/one ability score"
  const anyMatch = input.match(/([+-]?\d+)\s*(?:to\s*)?(?:any|one|choice of)\s*(?:ability\s*score|stat)/i);
  if (anyMatch) {
    const val = parseInt(anyMatch[1], 10);
    if (!isNaN(val)) {
      results.push({ stat: 'ANY', value: val, rawMatch: anyMatch[0] });
    }
  }

  // Stat patterns: (STR|STRENGTH|DEX|DEXTERITY|CON|CONSTITUTION|INT|INTELLIGENCE|WIS|WISDOM|CHA|CHARISMA)
  const statRegexes = [
    // "+2 Strength" or "+10 STR" or "-2 Dex"
    /([+-]?\d+)\s*(?:to\s*)?(STR(?:ENGTH)?|DEX(?:TERITY)?|CON(?:STITUTION)?|INT(?:ELLIGENCE)?|WIS(?:DOM)?|CHA(?:RISMA)?)/gi,
    // "Strength +2" or "STR +10" or "Dexterity: +2"
    /(STR(?:ENGTH)?|DEX(?:TERITY)?|CON(?:STITUTION)?|INT(?:ELLIGENCE)?|WIS(?:DOM)?|CHA(?:RISMA)?)\s*(?::\s*|\s+)?([+-]?\d+)/gi
  ];

  const statMap: Record<string, 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'> = {
    str: 'STR', strength: 'STR',
    dex: 'DEX', dexterity: 'DEX',
    con: 'CON', constitution: 'CON',
    int: 'INT', intelligence: 'INT',
    wis: 'WIS', wisdom: 'WIS',
    cha: 'CHA', charisma: 'CHA'
  };

  // Run first regex
  let m: RegExpExecArray | null;
  while ((m = statRegexes[0].exec(input)) !== null) {
    const val = parseInt(m[1], 10);
    const key = m[2].toLowerCase();
    const normalized = statMap[key];
    if (normalized && !isNaN(val)) {
      results.push({ stat: normalized, value: val, rawMatch: m[0] });
    }
  }

  // Run second regex
  while ((m = statRegexes[1].exec(input)) !== null) {
    const key = m[1].toLowerCase();
    const val = parseInt(m[2], 10);
    const normalized = statMap[key];
    if (normalized && !isNaN(val)) {
      // Avoid duplicate if already matched
      if (!results.some(r => r.stat === normalized && r.value === val)) {
        results.push({ stat: normalized, value: val, rawMatch: m[0] });
      }
    }
  }

  return results;
}

/**
 * Validate stat bonuses against system bounded accuracy guidelines
 */
export function validateStatIncrements(
  bonuses: ParsedStatBonus[],
  sourceType: 'feat' | 'race' | 'item' | 'class' | 'general',
  edition: SupportedEdition = '5e'
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Max thresholds per system
  const maxSingleStatThresholds: Record<SupportedEdition, { warn: number; critical: number }> = {
    '5e': { warn: 3, critical: 4 }, // 5e bounded accuracy (+2 max for feats/races, +3 for artifact)
    '3.5e': { warn: 5, critical: 7 }, // 3.5e has higher enhancement bonuses (+6 max normal)
    'pathfinder': { warn: 3, critical: 4 },
    'shadowrun': { warn: 3, critical: 5 },
    'cthulhu': { warn: 25, critical: 40 } // CoC is percentile (1-100)
  };

  const limits = maxSingleStatThresholds[edition] || maxSingleStatThresholds['5e'];

  let totalPositiveStatBonus = 0;

  for (const bonus of bonuses) {
    if (bonus.stat === 'ALL') {
      if (bonus.value >= 2) {
        issues.push({
          id: `stat-all-extreme-${Date.now()}`,
          severity: bonus.value >= 3 ? 'critical' : 'warning',
          title: `Game-Breaking Universal Stat Increment (+${bonus.value} to All Stats)`,
          message: `Granting +${bonus.value} to every ability score simultaneously destabilizes the game's bounded accuracy and math curve.`,
          suggestion: `Consider granting +2 to one primary score and +1 to a secondary score instead.`,
          ruleCategory: 'stat_increment'
        });
      }
      totalPositiveStatBonus += bonus.value * 6;
      continue;
    }

    if (bonus.value > 0) {
      totalPositiveStatBonus += bonus.value;
    }

    // Critical stat jump (e.g. +10 STR)
    if (bonus.value >= limits.critical || (edition === '5e' && bonus.value >= 4)) {
      issues.push({
        id: `stat-critical-${bonus.stat}`,
        severity: 'critical',
        title: `Extreme Stat Increment: +${bonus.value} ${bonus.stat}`,
        message: `A single bonus of +${bonus.value} to ${bonus.stat} severely breaks standard ${edition.toUpperCase()} progression. In D&D 5e, ability score improvements are strictly capped at +2.`,
        suggestion: `Reduce bonus to +1 or +2 to align with official 5e rules and prevent breaking combat balance.`,
        ruleCategory: 'stat_increment'
      });
    } else if (bonus.value >= limits.warn) {
      issues.push({
        id: `stat-warn-${bonus.stat}`,
        severity: 'warning',
        title: `High Stat Increment: +${bonus.value} ${bonus.stat}`,
        message: `+${bonus.value} to ${bonus.stat} is higher than standard feats or racial traits (standard maximum is +2).`,
        suggestion: `Consider capping the bonus at +2, or require high-level prerequisites / legendary attunement.`,
        ruleCategory: 'stat_increment'
      });
    }
  }

  // Total stat bonus check for Races and Feats
  if (sourceType === 'race' && totalPositiveStatBonus > 3 && edition === '5e') {
    issues.push({
      id: `race-total-stats-${totalPositiveStatBonus}`,
      severity: totalPositiveStatBonus >= 6 ? 'critical' : 'warning',
      title: `Excessive Total Ability Score Bonus (+${totalPositiveStatBonus} Total)`,
      message: `Standard 5e races provide at most +3 total ability score bonuses (e.g. +2/+1 or +1/+1/+1, with Mountain Dwarf as an extreme outlier at +2/+2).`,
      suggestion: `Distribute +2 to one ability score and +1 to another.`,
      ruleCategory: 'stat_increment'
    });
  }

  if (sourceType === 'feat' && totalPositiveStatBonus > 2 && edition === '5e') {
    issues.push({
      id: `feat-total-stats-${totalPositiveStatBonus}`,
      severity: totalPositiveStatBonus >= 4 ? 'critical' : 'warning',
      title: `Excessive Feat Ability Score Bonus (+${totalPositiveStatBonus} Total)`,
      message: `Standard 5e half-feats provide +1 to a single ability score alongside secondary traits. Standard ASIs grant at most +2.`,
      suggestion: `Reduce the ability score increase to +1 or make the feat purely trait-based.`,
      ruleCategory: 'stat_increment'
    });
  }

  return issues;
}

// ---------------------------------------------------------------------------
// ITEM VALIDATOR
// ---------------------------------------------------------------------------
export interface ValidateItemParams {
  name: string;
  itemType?: string;
  rarity?: string;
  cost?: string | number;
  weight?: number;
  requiresAttunement?: boolean;
  damageFormula?: string;
  damageType?: string;
  acBonus?: number;
  armorAc?: number;
  damageReduction?: number;
  resistance?: string;
  immunity?: string;
  hpBonus?: number;
  spellDcBonus?: number;
  initiativeBonus?: number;
  attackBonus?: number | string;
  propertiesText?: string;
  description?: string;
  edition?: SupportedEdition;
}

export function validateHomebrewItem(params: ValidateItemParams): ValidationResult {
  const issues: ValidationIssue[] = [];
  const edition = params.edition || '5e';

  // 1. Check Name
  if (!params.name.trim()) {
    issues.push({
      id: 'item-name-required',
      severity: 'critical',
      title: 'Missing Item Name',
      message: 'Item name is required for compendium indexing.',
      ruleCategory: 'syntax'
    });
  }

  // 2. Check Weight & Cost
  if (params.weight !== undefined && params.weight < 0) {
    issues.push({
      id: 'item-neg-weight',
      severity: 'critical',
      title: 'Invalid Weight Value',
      message: `Weight cannot be negative (${params.weight} lbs).`,
      suggestion: 'Set weight to 0 for weightless items.',
      ruleCategory: 'formatting'
    });
  }

  // 3. Attack Bonus
  const atkBonus = typeof params.attackBonus === 'string'
    ? parseInt(params.attackBonus.replace(/[^0-9-]/g, ''), 10)
    : params.attackBonus;

  if (atkBonus !== undefined && !isNaN(atkBonus)) {
    if (atkBonus >= 6) {
      issues.push({
        id: 'item-atk-critical',
        severity: 'critical',
        title: `Game-Breaking Weapon Attack Bonus (+${atkBonus})`,
        message: `In 5e bounded accuracy, +3 is the maximum standard bonus for legendary items (e.g. Holy Avenger). A +${atkBonus} bonus breaks hit chances.`,
        suggestion: 'Cap weapon bonus at +1 (Uncommon), +2 (Rare), or +3 (Very Rare/Legendary).',
        ruleCategory: 'bounded_accuracy'
      });
    } else if (atkBonus >= 4) {
      issues.push({
        id: 'item-atk-warn',
        severity: 'warning',
        title: `High Weapon Attack Bonus (+${atkBonus})`,
        message: `+${atkBonus} exceeds the official 5e maximum weapon modifier of +3.`,
        suggestion: 'Consider setting bonus to +3 and adding a unique active ability instead.',
        ruleCategory: 'bounded_accuracy'
      });
    }
  }

  // 4. AC Bonus & Base AC
  if (params.acBonus !== undefined && params.acBonus !== null && !isNaN(params.acBonus)) {
    if (params.acBonus >= 5) {
      issues.push({
        id: 'item-ac-critical',
        severity: 'critical',
        title: `Extreme AC Bonus (+${params.acBonus} AC)`,
        message: `Granting +${params.acBonus} AC from a single item easily pushes character AC into untouchable territory (25+ AC).`,
        suggestion: 'In 5e, standard shields grant +2 AC, and magic armor bonuses cap at +3.',
        ruleCategory: 'defense'
      });
    } else if (params.acBonus >= 3 && params.rarity && !['Very Rare', 'Legendary', 'Artifact'].includes(params.rarity)) {
      issues.push({
        id: 'item-ac-rarity-warn',
        severity: 'warning',
        title: `High AC Bonus (+${params.acBonus}) on ${params.rarity} Item`,
        message: `A +${params.acBonus} AC modifier is typically reserved for Very Rare or Legendary gear and should require attunement.`,
        suggestion: 'Enable "Requires Attunement" and upgrade rarity to Very Rare/Legendary.',
        ruleCategory: 'defense'
      });
    }
  }

  if (params.armorAc !== undefined && params.armorAc > 20) {
    issues.push({
      id: 'item-base-ac-critical',
      severity: 'critical',
      title: `Excessive Base Armor AC (${params.armorAc} AC)`,
      message: `Full Plate armor has a base AC of 18. A base AC of ${params.armorAc} makes the wearer near-immune to non-boss creatures.`,
      suggestion: 'Set base AC to 18 (Full Plate) or 17 (Splint) and use an AC Bonus (+1 to +3) if enchanted.',
      ruleCategory: 'defense'
    });
  }

  // 5. Damage Reduction (DR)
  if (params.damageReduction !== undefined && params.damageReduction > 0) {
    if (params.damageReduction >= 15 && edition === '5e') {
      issues.push({
        id: 'item-dr-critical',
        severity: 'critical',
        title: `Extreme Damage Reduction (DR ${params.damageReduction})`,
        message: `Damage Reduction of ${params.damageReduction} completely negates most regular attacks in 5e, making normal encounters trivial.`,
        suggestion: 'In 5e, DR is rarely above 3 (e.g. Heavy Armor Master feat is DR 3). Consider DR 2–5.',
        ruleCategory: 'defense'
      });
    } else if (params.damageReduction >= 8 && edition === '5e') {
      issues.push({
        id: 'item-dr-warn',
        severity: 'warning',
        title: `High Damage Reduction (DR ${params.damageReduction})`,
        message: `DR ${params.damageReduction} will absorb all damage from minor monster hits on every round.`,
        suggestion: 'Consider adding limited charges (e.g. 3 charges / long rest) or reducing flat DR to 3–5.',
        ruleCategory: 'defense'
      });
    }
  }

  // 6. Spell DC Bonus
  if (params.spellDcBonus !== undefined && params.spellDcBonus > 0) {
    if (params.spellDcBonus >= 4) {
      issues.push({
        id: 'item-spell-dc-critical',
        severity: 'critical',
        title: `Overpowered Spell Save DC Modifier (+${params.spellDcBonus})`,
        message: `Spell Save DC bonuses are extremely powerful in 5e because saving throw scaling is flat. +${params.spellDcBonus} makes enemy saves nearly impossible.`,
        suggestion: 'Maximum official items (like +3 Wand of the War Mage) provide +3 DC.',
        ruleCategory: 'bounded_accuracy'
      });
    }
  }

  // 7. Max HP Bonus
  if (params.hpBonus !== undefined && params.hpBonus > 50) {
    issues.push({
      id: 'item-hp-warn',
      severity: 'warning',
      title: `Massive Max HP Increase (+${params.hpBonus} HP)`,
      message: `A flat HP increase of +${params.hpBonus} is equivalent to 5–10 levels of health for most character classes.`,
      suggestion: 'Consider scaling bonus with character level (e.g. +1 HP per level) or setting bonus to +10–20.',
      ruleCategory: 'defense'
    });
  }

  // 8. Damage Formula & Dice Validation
  if (params.damageFormula) {
    const diceMatch = params.damageFormula.match(/^(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?$/i);
    if (!diceMatch && !params.damageFormula.includes('+') && !params.damageFormula.includes('d')) {
      issues.push({
        id: 'item-dmg-format-warn',
        severity: 'info',
        title: 'Non-Standard Damage Notation',
        message: `Damage formula "${params.damageFormula}" does not follow standard dice format (e.g., 1d8, 2d6 + 3).`,
        ruleCategory: 'syntax'
      });
    } else if (diceMatch) {
      const numDice = parseInt(diceMatch[1], 10);
      const dieSides = parseInt(diceMatch[2], 10);
      const allowedSides = [4, 6, 8, 10, 12, 20, 100];
      
      if (!allowedSides.includes(dieSides)) {
        issues.push({
          id: 'item-dmg-die-invalid',
          severity: 'warning',
          title: `Non-Standard Die Type (d${dieSides})`,
          message: `Standard TTRPG dice are d4, d6, d8, d10, d12, d20, and d100.`,
          ruleCategory: 'syntax'
        });
      }

      if (numDice >= 6 && params.itemType === 'weapon') {
        issues.push({
          id: 'item-dmg-excessive',
          severity: 'critical',
          title: `Overpowered Weapon Damage (${params.damageFormula})`,
          message: `Standard weapons deal 1d4 to 2d6 base damage (Greatsword = 2d6). Dealing ${params.damageFormula} on every standard attack will trivialise combat encounters.`,
          suggestion: 'Set base weapon damage to standard (e.g. 1d8 or 2d6) and add extra damage as a triggered power (e.g. +2d6 fire on a crit).',
          ruleCategory: 'bounded_accuracy'
        });
      }
    }
  }

  // 9. Attunement check on powerful items
  const isHighPower = (params.acBonus && params.acBonus >= 2) ||
    (params.damageReduction && params.damageReduction >= 3) ||
    (params.spellDcBonus && params.spellDcBonus >= 2) ||
    Boolean(params.immunity);

  if (isHighPower && !params.requiresAttunement && edition === '5e') {
    issues.push({
      id: 'item-attunement-recommended',
      severity: 'warning',
      title: 'Attunement Recommended for Potent Item',
      message: 'This item grants significant combat or defensive bonuses. Without attunement, characters can stack multiple identical items without restriction.',
      suggestion: 'Enable "Requires Attunement" to enforce the 3-item attunement limit.',
      ruleCategory: 'bounded_accuracy'
    });
  }

  // 10. Check description for rogue stat increments
  if (params.description) {
    const parsedStats = parseAbilityScoreBonuses(params.description);
    const statIssues = validateStatIncrements(parsedStats, 'item', edition);
    issues.push(...statIssues);
  }

  const hasCritical = issues.some(i => i.severity === 'critical');
  const hasWarnings = issues.some(i => i.severity === 'warning');
  
  // Calculate balance score (100 is ideal, each warning drops score)
  let score = 100;
  issues.forEach(i => {
    if (i.severity === 'critical') score -= 35;
    else if (i.severity === 'warning') score -= 15;
    else score -= 5;
  });

  return {
    isValid: !hasCritical,
    hasWarnings,
    hasCritical,
    score: Math.max(0, score),
    issues
  };
}

// ---------------------------------------------------------------------------
// FEAT VALIDATOR
// ---------------------------------------------------------------------------
export interface ValidateFeatParams {
  name: string;
  category?: string;
  prerequisite?: string;
  statBonus?: string;
  description: string;
  edition?: SupportedEdition;
}

export function validateHomebrewFeat(params: ValidateFeatParams): ValidationResult {
  const issues: ValidationIssue[] = [];
  const edition = params.edition || '5e';

  if (!params.name.trim()) {
    issues.push({
      id: 'feat-name-required',
      severity: 'critical',
      title: 'Missing Feat Name',
      message: 'Feat name is required.',
      ruleCategory: 'syntax'
    });
  }

  // Parse stat bonuses from statBonus field AND description
  const combinedText = `${params.statBonus || ''} ${params.description || ''}`;
  const parsedStats = parseAbilityScoreBonuses(combinedText);
  const statIssues = validateStatIncrements(parsedStats, 'feat', edition);
  issues.push(...statIssues);

  // Check for immunities in feat text
  if (/gain(?:s)?\s+immunity\s+to/i.test(params.description) || /immune\s+to\s+(?:all\s+)?damage/i.test(params.description)) {
    issues.push({
      id: 'feat-immunity-warn',
      severity: 'critical',
      title: 'Permanent Damage Immunity in Feat',
      message: 'Permanent damage immunity granted through a feat is extremely rare in 5e and can bypass entire encounter mechanics.',
      suggestion: 'Consider granting Damage Resistance or a Reaction to reduce damage instead of full Immunity.',
      ruleCategory: 'defense'
    });
  }

  // Check for infinite free high-level spell slots
  if (/cast\s+(?:wish|meteor swarm|power word kill|disintegrate)\s+(?:at will|without spending)/i.test(params.description)) {
    issues.push({
      id: 'feat-free-high-spell',
      severity: 'critical',
      title: 'Unconstrained High-Tier Spell Casting',
      message: 'Casting 6th–9th level spells at will without spell slot costs or once-per-long-rest limits breaks all campaign balance.',
      suggestion: 'Limit casting to 1 / Long Rest or link it to character level progression.',
      ruleCategory: 'action_economy'
    });
  }

  const hasCritical = issues.some(i => i.severity === 'critical');
  const hasWarnings = issues.some(i => i.severity === 'warning');

  let score = 100;
  issues.forEach(i => {
    if (i.severity === 'critical') score -= 35;
    else if (i.severity === 'warning') score -= 15;
    else score -= 5;
  });

  return {
    isValid: !hasCritical,
    hasWarnings,
    hasCritical,
    score: Math.max(0, score),
    issues
  };
}

// ---------------------------------------------------------------------------
// RACE / ANCESTRY VALIDATOR
// ---------------------------------------------------------------------------
export interface ValidateRaceParams {
  name: string;
  speed?: number;
  abilityBonusesStr?: string;
  traits?: Array<{ name: string; description: string }>;
  edition?: SupportedEdition;
}

export function validateHomebrewRace(params: ValidateRaceParams): ValidationResult {
  const issues: ValidationIssue[] = [];
  const edition = params.edition || '5e';

  if (!params.name.trim()) {
    issues.push({
      id: 'race-name-required',
      severity: 'critical',
      title: 'Missing Ancestry Name',
      message: 'Race name is required.',
      ruleCategory: 'syntax'
    });
  }

  // Speed checks
  if (params.speed !== undefined) {
    if (params.speed >= 60) {
      issues.push({
        id: 'race-speed-critical',
        severity: 'critical',
        title: `Extreme Base Movement Speed (${params.speed} ft.)`,
        message: `Standard 5e walking speed is 25–35 ft. A base speed of ${params.speed} ft. trivializes tactical positioning and melee kiting.`,
        suggestion: 'Set base speed to 30 ft. (or 35 ft. for fast lineages like Wood Elf).',
        ruleCategory: 'bounded_accuracy'
      });
    } else if (params.speed > 35) {
      issues.push({
        id: 'race-speed-warn',
        severity: 'warning',
        title: `High Movement Speed (${params.speed} ft.)`,
        message: `Speed of ${params.speed} ft. is faster than almost all standard races (Wood Elf is 35 ft., Centaur is 40 ft.).`,
        ruleCategory: 'bounded_accuracy'
      });
    } else if (params.speed < 20) {
      issues.push({
        id: 'race-speed-low',
        severity: 'warning',
        title: `Extremely Low Movement Speed (${params.speed} ft.)`,
        message: 'Speeds below 20 ft. severely penalize player mobility in grid combat.',
        ruleCategory: 'formatting'
      });
    }
  }

  // Ability score bonuses
  if (params.abilityBonusesStr) {
    const parsed = parseAbilityScoreBonuses(params.abilityBonusesStr);
    const statIssues = validateStatIncrements(parsed, 'race', edition);
    issues.push(...statIssues);
  }

  // Check traits for flight or extreme traits
  if (params.traits && params.traits.length > 0) {
    params.traits.forEach(tr => {
      if (/fly(?:ing)?\s+speed\s+equal\s+to/i.test(tr.description) || /unlimited\s+flight/i.test(tr.description)) {
        issues.push({
          id: `race-flight-advisory-${tr.name}`,
          severity: 'info',
          title: `Flight Trait Detected in "${tr.name}"`,
          message: 'Inherent 1st-level flight can bypass low-level terrain hazards and puzzle obstacles. Many DMs restrict flying races at Tier 1.',
          suggestion: 'Consider restricting flight while wearing medium/heavy armor or unlocking it at level 5.',
          ruleCategory: 'defense'
        });
      }
    });

    if (params.traits.length > 6) {
      issues.push({
        id: 'race-traits-overload',
        severity: 'warning',
        title: `Too Many Racial Traits (${params.traits.length} Traits)`,
        message: 'Most official races have 3 to 5 traits. Having more than 6 can result in an overloaded character sheet.',
        suggestion: 'Consolidate minor traits or move specialized abilities to a subrace option.',
        ruleCategory: 'action_economy'
      });
    }
  }

  const hasCritical = issues.some(i => i.severity === 'critical');
  const hasWarnings = issues.some(i => i.severity === 'warning');

  let score = 100;
  issues.forEach(i => {
    if (i.severity === 'critical') score -= 35;
    else if (i.severity === 'warning') score -= 15;
    else score -= 5;
  });

  return {
    isValid: !hasCritical,
    hasWarnings,
    hasCritical,
    score: Math.max(0, score),
    issues
  };
}

// ---------------------------------------------------------------------------
// CLASS VALIDATOR
// ---------------------------------------------------------------------------
export interface ValidateClassParams {
  name: string;
  hitDie?: string;
  savingThrows?: string[];
  spellProgression?: string;
  features?: Array<{ name: string; level: number; description: string }>;
  edition?: SupportedEdition;
}

export function validateHomebrewClass(params: ValidateClassParams): ValidationResult {
  const issues: ValidationIssue[] = [];
  const edition = params.edition || '5e';

  if (!params.name.trim()) {
    issues.push({
      id: 'class-name-required',
      severity: 'critical',
      title: 'Missing Class Name',
      message: 'Class name is required.',
      ruleCategory: 'syntax'
    });
  }

  // 5e Saving Throws Rule: Exactly 1 Strong (DEX, CON, WIS) + 1 Weak (STR, INT, CHA)
  if (params.savingThrows && edition === '5e') {
    if (params.savingThrows.length > 2) {
      issues.push({
        id: 'class-saves-count',
        severity: 'critical',
        title: `Too Many Saving Throw Proficiencies (${params.savingThrows.length} Saves)`,
        message: 'All standard D&D 5e classes receive exactly TWO saving throw proficiencies.',
        suggestion: 'Select exactly one Strong save (DEX, CON, or WIS) and one Weak save (STR, INT, or CHA).',
        ruleCategory: 'defense'
      });
    } else if (params.savingThrows.length === 2) {
      const strongSaves = ['DEX', 'CON', 'WIS'];
      const hasStrongCount = params.savingThrows.filter(st => strongSaves.includes(st)).length;
      if (hasStrongCount === 2) {
        issues.push({
          id: 'class-two-strong-saves',
          severity: 'warning',
          title: `Two Major Saving Throws Selected (${params.savingThrows.join(' & ')})`,
          message: 'No official 5e class grants both DEX/CON/WIS simultaneously at Level 1, as these are the most common defensive saves in the game.',
          suggestion: 'Pair one major save (DEX/CON/WIS) with one minor save (STR/INT/CHA).',
          ruleCategory: 'defense'
        });
      }
    }
  }

  // Hit Die vs Spell Progression
  if (params.hitDie === 'd12' && params.spellProgression === 'Full' && edition === '5e') {
    issues.push({
      id: 'class-d12-full-caster',
      severity: 'critical',
      title: 'Full Spellcaster with d12 Hit Die',
      message: 'Full spellcasters (Wizard, Sorcerer, Cleric, Druid, Bard) are balanced around d6 or d8 hit dice. A d12 full caster combines maximum hit points with 9th-level spell power.',
      suggestion: 'Change hit die to d6 or d8, or reduce spell progression to Third / Half caster.',
      ruleCategory: 'bounded_accuracy'
    });
  }

  const hasCritical = issues.some(i => i.severity === 'critical');
  const hasWarnings = issues.some(i => i.severity === 'warning');

  let score = 100;
  issues.forEach(i => {
    if (i.severity === 'critical') score -= 35;
    else if (i.severity === 'warning') score -= 15;
    else score -= 5;
  });

  return {
    isValid: !hasCritical,
    hasWarnings,
    hasCritical,
    score: Math.max(0, score),
    issues
  };
}

// ---------------------------------------------------------------------------
// SPELL VALIDATOR
// ---------------------------------------------------------------------------
export interface ValidateSpellParams {
  name: string;
  level: number;
  school?: string;
  damageFormula?: string;
  castingTime?: string;
  duration?: string;
  isConcentration?: boolean;
  description?: string;
  edition?: SupportedEdition;
}

export function validateHomebrewSpell(params: ValidateSpellParams): ValidationResult {
  const issues: ValidationIssue[] = [];
  const edition = params.edition || '5e';

  if (!params.name.trim()) {
    issues.push({
      id: 'spell-name-required',
      severity: 'critical',
      title: 'Missing Spell Name',
      message: 'Spell name is required.',
      ruleCategory: 'syntax'
    });
  }

  // Cantrip Damage Sanity (Level 0)
  if (params.level === 0 && params.damageFormula) {
    const diceMatch = params.damageFormula.match(/^(\d+)d(\d+)/i);
    if (diceMatch) {
      const numDice = parseInt(diceMatch[1], 10);
      const dieSides = parseInt(diceMatch[2], 10);
      if (numDice > 1 && dieSides >= 6) {
        issues.push({
          id: 'spell-cantrip-dmg-high',
          severity: 'warning',
          title: `High Base Cantrip Damage (${params.damageFormula})`,
          message: 'Level 0 Cantrips in 5e deal 1 die of damage at base (e.g. 1d10 Fire Bolt, 1d12 Toll the Dead, 1d8 Ray of Frost), scaling at levels 5, 11, and 17.',
          suggestion: 'Set base cantrip damage to 1d8 or 1d10.',
          ruleCategory: 'bounded_accuracy'
        });
      }
    }
  }

  // Level 1 damage outlier
  if (params.level === 1 && params.damageFormula) {
    const diceMatch = params.damageFormula.match(/^(\d+)d(\d+)/i);
    if (diceMatch) {
      const numDice = parseInt(diceMatch[1], 10);
      const dieSides = parseInt(diceMatch[2], 10);
      if (numDice >= 5 && dieSides >= 8) {
        issues.push({
          id: 'spell-lvl1-dmg-critical',
          severity: 'critical',
          title: `Overpowered 1st-Level Damage (${params.damageFormula})`,
          message: 'Standard 1st-level single-target spells deal ~3d8 (Guiding Bolt = 4d6, Inflict Wounds = 3d10). Dealing 5d8+ at Level 1 will one-shot bosses.',
          suggestion: 'Reduce damage to 3d8 or 4d6 for 1st-level spells.',
          ruleCategory: 'bounded_accuracy'
        });
      }
    }
  }

  // Concentration Check: Long duration buffs/debuffs without concentration
  const isLongDuration = params.duration && (
    params.duration.includes('minute') ||
    params.duration.includes('hour') ||
    params.duration.includes('day')
  );
  if (isLongDuration && !params.isConcentration && params.level > 0 && edition === '5e') {
    issues.push({
      id: 'spell-concentration-notice',
      severity: 'info',
      title: 'Non-Concentration Sustained Spell',
      message: `Spell lasts "${params.duration}" without requiring Concentration. In 5e, most persistent combat buffs/debuffs require Concentration to prevent stacking multiple effects.`,
      suggestion: 'Enable Concentration if this spell grants ongoing combat advantages.',
      ruleCategory: 'action_economy'
    });
  }

  const hasCritical = issues.some(i => i.severity === 'critical');
  const hasWarnings = issues.some(i => i.severity === 'warning');

  let score = 100;
  issues.forEach(i => {
    if (i.severity === 'critical') score -= 35;
    else if (i.severity === 'warning') score -= 15;
    else score -= 5;
  });

  return {
    isValid: !hasCritical,
    hasWarnings,
    hasCritical,
    score: Math.max(0, score),
    issues
  };
}
