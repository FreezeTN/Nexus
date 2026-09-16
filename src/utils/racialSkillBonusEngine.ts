import { CharacterData, Skill, AbilityName, RacialSkillBonus, RacialSkillBonusType } from '../types';

/**
 * Standard SRD 3.5e and 5e Racial Skill Bonuses Catalog.
 * Applied automatically to characters who have a matching race if no custom bonuses are assigned.
 */
export const SRD_RACIAL_SKILL_BONUSES: Record<string, RacialSkillBonus[]> = {
  // 3.5e Core SRD Races
  'elf': [
    { id: 'srd-elf-listen', type: 'specific', skillName: 'Listen', bonus: 2, source: 'Elf Keen Senses' },
    { id: 'srd-elf-search', type: 'specific', skillName: 'Search', bonus: 2, source: 'Elf Keen Senses' },
    { id: 'srd-elf-spot', type: 'specific', skillName: 'Spot', bonus: 2, source: 'Elf Keen Senses' }
  ],
  'half-elf': [
    { id: 'srd-halfelf-listen', type: 'specific', skillName: 'Listen', bonus: 1, source: 'Half-Elf Senses' },
    { id: 'srd-halfelf-search', type: 'specific', skillName: 'Search', bonus: 1, source: 'Half-Elf Senses' },
    { id: 'srd-halfelf-spot', type: 'specific', skillName: 'Spot', bonus: 1, source: 'Half-Elf Senses' },
    { id: 'srd-halfelf-diplomacy', type: 'specific', skillName: 'Diplomacy', bonus: 2, source: 'Half-Elf Social' },
    { id: 'srd-halfelf-gather', type: 'specific', skillName: 'Gather Information', bonus: 2, source: 'Half-Elf Social' }
  ],
  'halfling': [
    { id: 'srd-halfling-climb', type: 'specific', skillName: 'Climb', bonus: 2, source: 'Halfling Agility' },
    { id: 'srd-halfling-jump', type: 'specific', skillName: 'Jump', bonus: 2, source: 'Halfling Agility' },
    { id: 'srd-halfling-listen', type: 'specific', skillName: 'Listen', bonus: 2, source: 'Halfling Keen Ears' },
    { id: 'srd-halfling-movesilently', type: 'specific', skillName: 'Move Silently', bonus: 2, source: 'Halfling Stealth' }
  ],
  'gnome': [
    { id: 'srd-gnome-listen', type: 'specific', skillName: 'Listen', bonus: 2, source: 'Gnome Keen Senses' },
    { id: 'srd-gnome-craft', type: 'specific', skillName: 'Craft (Alchemy)', bonus: 2, source: 'Gnome Crafting' }
  ],
  'dwarf': [
    { id: 'srd-dwarf-appraise', type: 'conditional', skillName: 'Appraise', bonus: 2, condition: 'related to stone or metal', source: 'Stonecunning' },
    { id: 'srd-dwarf-craft', type: 'conditional', skillName: 'Craft', bonus: 2, condition: 'related to stone or metal', source: 'Stonecunning' }
  ],
  'goblin': [
    { id: 'srd-goblin-movesilently', type: 'specific', skillName: 'Move Silently', bonus: 4, source: 'Goblin Sneak' },
    { id: 'srd-goblin-ride', type: 'specific', skillName: 'Ride', bonus: 4, source: 'Goblin Wolf-Rider' }
  ],
  'kobold': [
    { id: 'srd-kobold-search', type: 'specific', skillName: 'Search', bonus: 2, source: 'Kobold Senses' },
    { id: 'srd-kobold-craft', type: 'specific', skillName: 'Craft (Trapmaking)', bonus: 2, source: 'Kobold Trapper' }
  ],
  'lizardfolk': [
    { id: 'srd-lizardfolk-balance', type: 'specific', skillName: 'Balance', bonus: 4, source: 'Lizardfolk Tail' },
    { id: 'srd-lizardfolk-jump', type: 'specific', skillName: 'Jump', bonus: 4, source: 'Lizardfolk Powerful Legs' },
    { id: 'srd-lizardfolk-swim', type: 'specific', skillName: 'Swim', bonus: 4, source: 'Lizardfolk Aquatic' }
  ],
  'merfolk': [
    { id: 'srd-merfolk-swim', type: 'specific', skillName: 'Swim', bonus: 8, source: 'Aquatic Heritage' }
  ]
};

/**
 * Normalizes skill names for comparison (lowercasing, trimming, removing brackets/parentheses).
 */
export function normalizeSkillName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[()[\]]/g, '')
    .trim();
}

/**
 * Checks if a racial bonus targeting bonusSkillName applies to targetSkillName.
 */
export function matchesSkillName(bonusSkillName: string | undefined, targetSkillName: string): boolean {
  if (!bonusSkillName || !targetSkillName) return false;
  const nBonus = normalizeSkillName(bonusSkillName);
  const nTarget = normalizeSkillName(targetSkillName);

  if (nBonus === nTarget) return true;

  // Handles compound names (e.g. "Perception (Listen & Spot)" matching "Listen" or "Spot")
  if (nBonus.includes(nTarget) || nTarget.includes(nBonus)) return true;

  // 5e Perception mapping to 3.5e Spot or Listen
  if ((nBonus === 'spot' || nBonus === 'listen') && nTarget === 'perception') return true;
  if (nBonus === 'perception' && (nTarget === 'spot' || nTarget === 'listen')) return true;

  // 5e Stealth mapping to 3.5e Hide or Move Silently
  if ((nBonus === 'hide' || nBonus === 'move silently') && nTarget === 'stealth') return true;
  if (nBonus === 'stealth' && (nTarget === 'hide' || nTarget === 'move silently')) return true;

  // 5e Athletics mapping to 3.5e Climb, Jump, or Swim
  if ((nBonus === 'climb' || nBonus === 'jump' || nBonus === 'swim') && nTarget === 'athletics') return true;
  if (nBonus === 'athletics' && (nTarget === 'climb' || nTarget === 'jump' || nTarget === 'swim')) return true;

  return false;
}

/**
 * Retrieves all racial skill bonuses active for a character.
 * Uses character.racialSkillBonuses if present; and resolves bonuses from hybrid templates,
 * base creatures, custom compendium races, and standard SRD racial catalog.
 */
export function getCharacterRacialSkillBonuses(character?: CharacterData): RacialSkillBonus[] {
  if (!character) return [];

  const collectedBonuses: RacialSkillBonus[] = [];

  // 1. If character has explicit custom racialSkillBonuses defined, include them
  if (Array.isArray(character.racialSkillBonuses) && character.racialSkillBonuses.length > 0) {
    collectedBonuses.push(...character.racialSkillBonuses);
  }

  // 2. Identify all candidate race / template / heritage names and keywords for this character
  const candidateNames: string[] = [];
  const addCandidate = (name?: string) => {
    if (!name || typeof name !== 'string') return;
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!candidateNames.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      candidateNames.push(trimmed);
    }
    // Also clean emojis, prefixes, and homebrew/template suffixes
    const clean = trimmed
      .replace(/^[✨🌟🧬🧝🐉😈👿🔥❄️💀\s]+/, '')
      .replace(/\s*\((?:homebrew|custom|half-breed|half-breed template|template|universal|augmented)[^)]*\)$/i, '')
      .replace(/^Half-/i, '')
      .trim();
    if (clean && !candidateNames.some(c => c.toLowerCase() === clean.toLowerCase())) {
      candidateNames.push(clean);
    }
  };

  addCandidate(character.race);
  if (character.hybridHeritage) {
    addCandidate(character.hybridHeritage.templateName);
    addCandidate(character.hybridHeritage.secondaryParent);
    addCandidate(character.hybridHeritage.baseRaceName);
    addCandidate(character.hybridHeritage.primaryParent);
    addCandidate(character.hybridHeritage.customHybridName);
  }

  // Also inspect classFeatures for template or race sources
  if (Array.isArray(character.classFeatures)) {
    for (const f of character.classFeatures) {
      if (f.source) {
        const matchTpl = /Template:\s*([^;,\n]+)/i.exec(f.source);
        if (matchTpl && matchTpl[1]) addCandidate(matchTpl[1]);
        const matchBase = /Base Creature:\s*([^;,\n]+)/i.exec(f.source);
        if (matchBase && matchBase[1]) addCandidate(matchBase[1]);
        const matchTrait = /(.*?)\s+Racial Trait/i.exec(f.source);
        if (matchTrait && matchTrait[1]) addCandidate(matchTrait[1]);
      }
      if (f.name) {
        const matchHb = /Half-Breed Template:\s*([^;,\n]+)/i.exec(f.name);
        if (matchHb && matchHb[1]) addCandidate(matchHb[1]);
      }
    }
  }

  // Also split composite race names like "Tiefling Trueblood Human" or "Half-Dragon Elf"
  if (character.race) {
    const raw = character.race.trim();
    const words = raw.split(/\s+/);
    if (words.length > 1) {
      addCandidate(words[words.length - 1]);
      addCandidate(words.slice(0, words.length - 1).join(' '));
    }
  }

  // 3. Check custom compendium races in localStorage
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('dnd_app_custom_compendium_v1');
      if (saved) {
        const customEntries = JSON.parse(saved);
        if (Array.isArray(customEntries)) {
          for (const e of customEntries) {
            const isRace = e.category === 'races' || (e.category as string) === 'race' || (e.tags && e.tags.includes('races'));
            if (!isRace || !e.name) continue;

            const entryName = (e.name || '').trim();
            const entryLower = entryName.toLowerCase();
            const cleanEntryName = entryName
              .replace(/^[✨🌟🧬🧝🐉😈👿🔥❄️💀\s]+/, '')
              .replace(/\s*\((?:homebrew|custom|half-breed|half-breed template|template|universal)[^)]*\)$/i, '')
              .replace(/^Half-/i, '')
              .trim()
              .toLowerCase();

            const isMatch = candidateNames.some(cName => {
              const cLower = cName.toLowerCase();
              const cleanC = cLower
                .replace(/^[✨🌟🧬🧝🐉😈👿🔥❄️💀\s]+/, '')
                .replace(/\s*\((?:homebrew|custom|half-breed|half-breed template|template|universal)[^)]*\)$/i, '')
                .replace(/^Half-/i, '')
                .trim();
              return (
                entryLower === cLower ||
                cleanEntryName === cleanC ||
                entryLower === cleanC ||
                cleanEntryName === cLower ||
                (cleanEntryName.length >= 4 && cLower.includes(cleanEntryName)) ||
                (cleanC.length >= 4 && entryLower.includes(cleanC)) ||
                (character.hybridHeritage?.templateId && e.id === character.hybridHeritage.templateId) ||
                (character.hybridHeritage?.baseRaceId && e.id === character.hybridHeritage.baseRaceId)
              );
            });

            if (isMatch) {
              const rd: any = e.raceData || e;
              if (Array.isArray(rd.racialSkillBonuses) && rd.racialSkillBonuses.length > 0) {
                for (const b of rd.racialSkillBonuses) {
                  collectedBonuses.push(b);
                }
              } else if (Array.isArray(e.racialSkillBonuses) && e.racialSkillBonuses.length > 0) {
                for (const b of e.racialSkillBonuses) {
                  collectedBonuses.push(b);
                }
              }

              // Text fallback for skill affinities if structured bonuses are missing
              const affText = rd.skillAffinities || rd.skillAffinitiesStr || '';
              if (affText && !collectedBonuses.some(b => b.source?.includes(entryName))) {
                const regex = /([+-]?\d+)\s*(?:racial\s*bonus\s*(?:on|to)\s*)?([A-Za-z\s()]+?)(?:checks?)?(?:,|$|\.|\n)/gi;
                let sm: RegExpExecArray | null;
                while ((sm = regex.exec(affText)) !== null) {
                  const bVal = parseInt(sm[1], 10);
                  const skName = sm[2]?.trim();
                  if (!isNaN(bVal) && skName && skName.length < 30) {
                    collectedBonuses.push({
                      id: `rsb-aff-${entryName}-${skName}`,
                      type: 'specific',
                      skillName: skName,
                      bonus: bVal,
                      source: `${entryName} Racial Trait`
                    });
                  }
                }
              }
            }
          }
        }
      }
    }
  } catch {
    // Ignore storage parsing errors in test/preview environments
  }

  // 4. Check candidate names for standard SRD catalog matches
  for (const cName of candidateNames) {
    const cLower = cName.toLowerCase();
    for (const [key, bonuses] of Object.entries(SRD_RACIAL_SKILL_BONUSES)) {
      if (cLower.includes(key)) {
        for (const b of bonuses) {
          collectedBonuses.push(b);
        }
      }
    }
  }

  // 5. Deduplicate collected bonuses
  const deduped: RacialSkillBonus[] = [];
  for (const b of collectedBonuses) {
    const isDup = deduped.some(d =>
      d.type === b.type &&
      d.bonus === b.bonus &&
      (d.skillName || '').toLowerCase() === (b.skillName || '').toLowerCase() &&
      (d.ability || '').toUpperCase() === (b.ability || '').toUpperCase() &&
      (d.condition || '').toLowerCase() === (b.condition || '').toLowerCase()
    );
    if (!isDup) {
      deduped.push(b);
    }
  }

  return deduped;
}

export interface RacialBonusMatch {
  bonusObj: RacialSkillBonus;
  value: number;
  type: RacialSkillBonusType;
  description: string;
  source: string;
  condition?: string;
}

export interface RacialSkillResolution {
  skillName: string;
  ability: AbilityName;
  unconditionalBonus: number; // Highest unconditional racial bonus (Non-stacking)
  highestUnconditionalSource?: string;
  allUnconditionalMatches: RacialBonusMatch[];
  conditionalMatches: RacialBonusMatch[];
  hasConditional: boolean;
  effectiveTotalWithConditions: number; // Non-stacking highest including active conditions
  activeConditionDescriptions: string[];
}

/**
 * Resolves racial skill bonuses for a specific skill adhering strictly to D&D rules:
 * "In D&D racial skill bonusses shall be applied to a characters skills as a racial bonus.
 * Racial bonusses do not stack with one another, only the highest bonus applies."
 *
 * 3 ways a racial bonus can be applied:
 * 1. Specific skill (e.g. +2 on Spot, +5 to Jump, +8 to Swim)
 * 2. Ability modifier affiliated (e.g. +2 to all DEX-based skills)
 * 3. Conditional on specific circumstances (e.g. +4 on Spot checks at night)
 *
 * @param skill The skill being evaluated
 * @param character The character possessing the race and traits
 * @param activeConditionIds Optional array of conditional bonus IDs that are active for this roll
 */
export function resolveRacialSkillBonus(
  skill: Skill,
  character?: CharacterData,
  activeConditionIds: string[] = []
): RacialSkillResolution {
  const allBonuses = getCharacterRacialSkillBonuses(character);
  const unconditionalMatches: RacialBonusMatch[] = [];
  const conditionalMatches: RacialBonusMatch[] = [];

  for (const b of allBonuses) {
    let applies = false;
    let desc = '';

    if (b.type === 'specific') {
      if (matchesSkillName(b.skillName, skill.name)) {
        applies = true;
        desc = `+${b.bonus} to ${b.skillName || skill.name}`;
      }
    } else if (b.type === 'ability') {
      if (b.ability && b.ability.toUpperCase() === skill.ability.toUpperCase()) {
        applies = true;
        desc = `+${b.bonus} to all ${b.ability}-based skills`;
      }
    } else if (b.type === 'conditional') {
      if (matchesSkillName(b.skillName, skill.name)) {
        conditionalMatches.push({
          bonusObj: b,
          value: b.bonus,
          type: 'conditional',
          description: `+${b.bonus} to ${b.skillName || skill.name} (${b.condition || 'specific condition'})`,
          source: b.source || 'Racial Trait',
          condition: b.condition
        });
      }
    }

    if (applies) {
      unconditionalMatches.push({
        bonusObj: b,
        value: b.bonus,
        type: b.type,
        description: desc,
        source: b.source || 'Racial Trait'
      });
    }
  }

  // Non-stacking rule: Racial bonuses of the same type do not stack, only the highest applies!
  let highestUnconditional = 0;
  let highestSource: string | undefined;

  for (const m of unconditionalMatches) {
    if (m.value > highestUnconditional) {
      highestUnconditional = m.value;
      highestSource = `${m.source}: ${m.description}`;
    }
  }

  // Calculate total if active conditions apply (still non-stacking, highest overall applies!)
  let effectiveTotal = highestUnconditional;
  const activeConditionDescriptions: string[] = [];

  for (const c of conditionalMatches) {
    if (activeConditionIds.includes(c.bonusObj.id)) {
      activeConditionDescriptions.push(c.description);
      if (c.value > effectiveTotal) {
        effectiveTotal = c.value;
      }
    }
  }

  return {
    skillName: skill.name,
    ability: skill.ability,
    unconditionalBonus: highestUnconditional,
    highestUnconditionalSource: highestSource,
    allUnconditionalMatches: unconditionalMatches,
    conditionalMatches,
    hasConditional: conditionalMatches.length > 0,
    effectiveTotalWithConditions: effectiveTotal,
    activeConditionDescriptions
  };
}

/**
 * Returns the effective numeric racial skill bonus to add to a skill.
 * If activeConditionIds is passed, evaluates whether active conditions beat unconditional bonuses.
 */
export function getRacialSkillBonusForSkill(
  skill: Skill,
  character?: CharacterData,
  activeConditionIds: string[] = []
): number {
  if (!character) return 0;
  const res = resolveRacialSkillBonus(skill, character, activeConditionIds);
  return activeConditionIds.length > 0 ? res.effectiveTotalWithConditions : res.unconditionalBonus;
}

/**
 * Returns all conditional racial bonuses applicable to a skill for situational prompting.
 */
export function getApplicableConditionalRacialBonuses(
  skill: Skill,
  character?: CharacterData
): RacialSkillBonus[] {
  if (!character) return [];
  const res = resolveRacialSkillBonus(skill, character);
  return res.conditionalMatches.map(m => m.bonusObj);
}

/**
 * Parses freeform skill affinities text (e.g. "+2 Spot, +5 Jump, +2 to all DEX-based skills, +4 on Spot checks at night")
 * into structured RacialSkillBonus array.
 */
export function parseSkillAffinitiesString(text: string, defaultSource: string = 'Racial Trait'): RacialSkillBonus[] {
  if (!text || !text.trim()) return [];

  const results: RacialSkillBonus[] = [];
  const chunks = text.split(/[,;\n]+/).map(c => c.trim()).filter(Boolean);

  const abilityRegex = /(?:all\s+)?(str|dex|con|int|wis|cha)(?:-based|\s+based)?\s+skills?/i;
  const bonusRegex = /([+-]?\d+)/;
  const conditionRegex = /(?:when|if|while|at|in|under|on|against|related\s+to)\s+(.+)$/i;

  chunks.forEach((chunk, index) => {
    const bonusMatch = chunk.match(bonusRegex);
    const bonus = bonusMatch ? parseInt(bonusMatch[1], 10) : 2;

    // Check if ability-based (e.g. "+2 to all DEX-based skills")
    const abilityMatch = chunk.match(abilityRegex);
    if (abilityMatch) {
      const ability = abilityMatch[1].toUpperCase() as AbilityName;
      results.push({
        id: `racial_bonus_${Date.now()}_${index}`,
        type: 'ability',
        ability,
        bonus,
        source: defaultSource
      });
      return;
    }

    // Check if conditional (e.g. "+4 on Spot checks at night" or "+2 Appraise related to stone or metal")
    const condMatch = chunk.match(conditionRegex);
    if (condMatch) {
      const condition = condMatch[1].trim();
      // Extract skill name by removing bonus, "on/to", "checks", and condition
      let skillPart = chunk
        .replace(bonusRegex, '')
        .replace(conditionRegex, '')
        .replace(/\b(?:on|to|for|in|checks?)\b/gi, '')
        .trim();
      
      if (!skillPart) skillPart = 'Spot';

      results.push({
        id: `racial_bonus_${Date.now()}_${index}`,
        type: 'conditional',
        skillName: skillPart,
        bonus,
        condition,
        source: defaultSource
      });
      return;
    }

    // Otherwise specific skill bonus (e.g. "+2 Spot", "+5 to Jump", "+8 to Swim")
    let cleanSkill = chunk
      .replace(bonusRegex, '')
      .replace(/\b(?:on|to|for|checks?)\b/gi, '')
      .trim();

    if (cleanSkill) {
      results.push({
        id: `racial_bonus_${Date.now()}_${index}`,
        type: 'specific',
        skillName: cleanSkill,
        bonus,
        source: defaultSource
      });
    }
  });

  return results;
}
