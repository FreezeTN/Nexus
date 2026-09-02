/**
 * Universal Stacking Modifier Engine
 * 
 * Centralized evaluation pipeline that resolves:
 * - Base stats, class features, racial traits, & ruleset math
 * - Magic items & equipment (attunement checks, stat setters, stacking defenses)
 * - Spell buffs & temporary effects (Bless, Haste, Shield of Faith, Mage Armor, Barkskin)
 * - Conditions & debuffs (Bane, Exhaustion, Cover, Poisoned, Prone, Restrained)
 * - Stacking rules resolution (Additive, Highest-Only, Lowest-Only, Fixed-Override, Floor, Dice Bonus)
 * - Advantage / Disadvantage conflict resolution
 * - Full audit trail & formula breakdown for inspector UIs
 */

import { AbilityName, CharacterData, GearItem } from '../types';
import { getEffectiveAbilities, getAbilityModifier, formatModifier, getProficiencyBonus } from '../utils/calculators/abilityCalculators';
import { getItemAbilitySetter, getItemAbilityBonus } from '../utils/calculators/abilityCalculators';

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================

export type ModifierTarget =
  | 'ac'
  | 'initiative'
  | 'speed'
  | 'hp_max'
  | 'spell_dc'
  | 'spell_attack'
  | 'attack.all'
  | 'attack.melee'
  | 'attack.ranged'
  | 'attack.spell'
  | 'damage.all'
  | 'damage.melee'
  | 'damage.ranged'
  | 'damage.spell'
  | 'saving_throw.all'
  | 'saving_throw.STR'
  | 'saving_throw.DEX'
  | 'saving_throw.CON'
  | 'saving_throw.INT'
  | 'saving_throw.WIS'
  | 'saving_throw.CHA'
  | 'ability.STR'
  | 'ability.DEX'
  | 'ability.CON'
  | 'ability.INT'
  | 'ability.WIS'
  | 'ability.CHA'
  | 'skill.all'
  | `skill.${string}`;

export type ModifierCategory =
  | 'base'
  | 'ability'
  | 'proficiency'
  | 'equipment'
  | 'spell_buff'
  | 'condition_penalty'
  | 'circumstance'
  | 'feat_trait'
  | 'custom';

export type ModifierStackingRule =
  | 'additive'       // Sums normally (standard 5e)
  | 'highest_only'   // Only highest value applies (e.g. 3.5e/PF2e morale/enhancement, competing AC calculations)
  | 'lowest_only'    // Only lowest penalty applies
  | 'override_fixed' // Sets value to fixed number if higher/applicable (Gauntlets of Ogre Power, Mage Armor base 13)
  | 'floor'          // Enforces minimum floor (e.g. Barkskin minimum AC 16)
  | 'dice';          // Grants dynamic dice term (+1d4 Bless, -1d4 Bane, +1d8 Bardic Inspiration)

export interface DomainModifier {
  readonly id: string;
  readonly label: string;
  readonly target: ModifierTarget;
  readonly category: ModifierCategory;
  readonly value: number;
  readonly diceFormula?: string; // e.g. "+1d4", "-1d4", "+1d8"
  readonly stackingRule: ModifierStackingRule;
  readonly source: string;
  readonly isTemporary?: boolean;
  readonly durationRounds?: number;
  readonly advantage?: boolean;
  readonly disadvantage?: boolean;
  readonly conditionTag?: string;
  readonly notes?: string;
}

export interface ActiveBuffEffect {
  readonly id: string;
  readonly name: string;
  readonly category: 'spell' | 'condition' | 'item' | 'feature' | 'circumstance' | 'custom';
  readonly icon?: string;
  readonly description: string;
  readonly modifiers: ReadonlyArray<DomainModifier>;
  readonly durationRounds?: number;
  readonly requiresConcentration?: boolean;
  readonly isDebuff?: boolean;
}

export interface ModifierEvaluationResult {
  readonly target: ModifierTarget;
  readonly baseValue: number;
  readonly finalValue: number;
  readonly effectiveBonus: number;
  readonly appliedModifiers: ReadonlyArray<DomainModifier & { contribution: number }>;
  readonly suppressedModifiers: ReadonlyArray<{ modifier: DomainModifier; reason: string }>;
  readonly diceBonuses: ReadonlyArray<{ dice: string; source: string; sign: 1 | -1 }>;
  readonly advantage: boolean;
  readonly disadvantage: boolean;
  readonly rollMode: 'normal' | 'advantage' | 'disadvantage';
  readonly formulaBreakdown: string;
}

// ==========================================
// 2. PRESET BUFFS & CONDITIONS LIBRARY
// ==========================================

export const BUILTIN_BUFF_PRESETS: Record<string, ActiveBuffEffect> = {
  bless: {
    id: 'bless',
    name: 'Bless',
    category: 'spell',
    icon: '✨',
    description: 'Whenever making an attack roll or saving throw, add +1d4 to the roll.',
    requiresConcentration: true,
    modifiers: [
      {
        id: 'bless_attack',
        label: 'Bless',
        target: 'attack.all',
        category: 'spell_buff',
        value: 0,
        diceFormula: '+1d4',
        stackingRule: 'dice',
        source: 'Bless Spell'
      },
      {
        id: 'bless_saves',
        label: 'Bless',
        target: 'saving_throw.all',
        category: 'spell_buff',
        value: 0,
        diceFormula: '+1d4',
        stackingRule: 'dice',
        source: 'Bless Spell'
      }
    ]
  },
  bane: {
    id: 'bane',
    name: 'Bane',
    category: 'spell',
    icon: '💀',
    description: 'Whenever making an attack roll or saving throw, subtract 1d4 from the roll.',
    isDebuff: true,
    modifiers: [
      {
        id: 'bane_attack',
        label: 'Bane',
        target: 'attack.all',
        category: 'condition_penalty',
        value: 0,
        diceFormula: '-1d4',
        stackingRule: 'dice',
        source: 'Bane Spell'
      },
      {
        id: 'bane_saves',
        label: 'Bane',
        target: 'saving_throw.all',
        category: 'condition_penalty',
        value: 0,
        diceFormula: '-1d4',
        stackingRule: 'dice',
        source: 'Bane Spell'
      }
    ]
  },
  shield_of_faith: {
    id: 'shield_of_faith',
    name: 'Shield of Faith',
    category: 'spell',
    icon: '🛡️',
    description: 'A shimmering field surrounds you, granting a +2 bonus to AC.',
    requiresConcentration: true,
    modifiers: [
      {
        id: 'sof_ac',
        label: 'Shield of Faith',
        target: 'ac',
        category: 'spell_buff',
        value: 2,
        stackingRule: 'additive',
        source: 'Shield of Faith Spell'
      }
    ]
  },
  shield_spell: {
    id: 'shield_spell',
    name: 'Shield (Reaction)',
    category: 'spell',
    icon: '⚡',
    description: 'An invisible barrier of magical force protects you, granting +5 to AC until the start of your next turn.',
    durationRounds: 1,
    modifiers: [
      {
        id: 'shield_reaction_ac',
        label: 'Shield Spell',
        target: 'ac',
        category: 'spell_buff',
        value: 5,
        stackingRule: 'additive',
        source: 'Shield Spell'
      }
    ]
  },
  haste: {
    id: 'haste',
    name: 'Haste',
    category: 'spell',
    icon: '💨',
    description: '+2 AC, doubled movement speed, and advantage on Dexterity saving throws.',
    requiresConcentration: true,
    modifiers: [
      {
        id: 'haste_ac',
        label: 'Haste (+2 AC)',
        target: 'ac',
        category: 'spell_buff',
        value: 2,
        stackingRule: 'additive',
        source: 'Haste Spell'
      },
      {
        id: 'haste_speed',
        label: 'Haste (Doubled Speed)',
        target: 'speed',
        category: 'spell_buff',
        value: 30, // Default 30ft or matched to base
        stackingRule: 'additive',
        source: 'Haste Spell'
      },
      {
        id: 'haste_dex_saves',
        label: 'Haste (Advantage on DEX Saves)',
        target: 'saving_throw.DEX',
        category: 'spell_buff',
        value: 0,
        advantage: true,
        stackingRule: 'additive',
        source: 'Haste Spell'
      }
    ]
  },
  mage_armor: {
    id: 'mage_armor',
    name: 'Mage Armor',
    category: 'spell',
    icon: '🔮',
    description: 'Your base AC becomes 13 + your Dexterity modifier while unarmored.',
    modifiers: [
      {
        id: 'mage_armor_base',
        label: 'Mage Armor (Base 13)',
        target: 'ac',
        category: 'spell_buff',
        value: 13,
        stackingRule: 'override_fixed',
        source: 'Mage Armor Spell'
      }
    ]
  },
  barkskin: {
    id: 'barkskin',
    name: 'Barkskin',
    category: 'spell',
    icon: '🪵',
    description: 'Your skin turns bark-like; your AC cannot be less than 16.',
    requiresConcentration: true,
    modifiers: [
      {
        id: 'barkskin_floor',
        label: 'Barkskin (AC Floor 16)',
        target: 'ac',
        category: 'spell_buff',
        value: 16,
        stackingRule: 'floor',
        source: 'Barkskin Spell'
      }
    ]
  },
  pass_without_trace: {
    id: 'pass_without_trace',
    name: 'Pass Without Trace',
    category: 'spell',
    icon: '🌫️',
    description: '+10 bonus to Dexterity (Stealth) checks and can’t be tracked except by magical means.',
    requiresConcentration: true,
    modifiers: [
      {
        id: 'pwt_stealth',
        label: 'Pass Without Trace',
        target: 'skill.stealth',
        category: 'spell_buff',
        value: 10,
        stackingRule: 'additive',
        source: 'Pass Without Trace Spell'
      }
    ]
  },
  guidance: {
    id: 'guidance',
    name: 'Guidance',
    category: 'spell',
    icon: '🧭',
    description: 'Add +1d4 to one ability check of choice.',
    modifiers: [
      {
        id: 'guidance_skills',
        label: 'Guidance',
        target: 'skill.all',
        category: 'spell_buff',
        value: 0,
        diceFormula: '+1d4',
        stackingRule: 'dice',
        source: 'Guidance Spell'
      }
    ]
  },
  half_cover: {
    id: 'half_cover',
    name: 'Half Cover',
    category: 'circumstance',
    icon: '🧱',
    description: '+2 bonus to AC and Dexterity saving throws.',
    modifiers: [
      {
        id: 'half_cover_ac',
        label: 'Half Cover (+2 AC)',
        target: 'ac',
        category: 'circumstance',
        value: 2,
        stackingRule: 'highest_only',
        source: 'Half Cover'
      },
      {
        id: 'half_cover_dex_save',
        label: 'Half Cover (+2 DEX Save)',
        target: 'saving_throw.DEX',
        category: 'circumstance',
        value: 2,
        stackingRule: 'highest_only',
        source: 'Half Cover'
      }
    ]
  },
  three_quarters_cover: {
    id: 'three_quarters_cover',
    name: 'Three-Quarters Cover',
    category: 'circumstance',
    icon: '🏰',
    description: '+5 bonus to AC and Dexterity saving throws.',
    modifiers: [
      {
        id: '34_cover_ac',
        label: 'Three-Quarters Cover (+5 AC)',
        target: 'ac',
        category: 'circumstance',
        value: 5,
        stackingRule: 'highest_only',
        source: 'Three-Quarters Cover'
      },
      {
        id: '34_cover_dex_save',
        label: 'Three-Quarters Cover (+5 DEX Save)',
        target: 'saving_throw.DEX',
        category: 'circumstance',
        value: 5,
        stackingRule: 'highest_only',
        source: 'Three-Quarters Cover'
      }
    ]
  },
  dodging: {
    id: 'dodging',
    name: 'Dodge Action',
    category: 'circumstance',
    icon: '🏃',
    description: 'Attack rolls against you have disadvantage if you can see the attacker, and you make Dexterity saving throws with advantage.',
    durationRounds: 1,
    modifiers: [
      {
        id: 'dodge_dex_saves',
        label: 'Dodging (Advantage on DEX Saves)',
        target: 'saving_throw.DEX',
        category: 'circumstance',
        value: 0,
        advantage: true,
        stackingRule: 'additive',
        source: 'Dodge Action'
      }
    ]
  },
  slow_spell: {
    id: 'slow_spell',
    name: 'Slow',
    category: 'spell',
    icon: '⏳',
    description: 'An affected target’s speed is halved, it takes a −2 penalty to AC and Dexterity saving throws, and it can’t use reactions.',
    isDebuff: true,
    modifiers: [
      {
        id: 'slow_ac',
        label: 'Slow (-2 AC)',
        target: 'ac',
        category: 'condition_penalty',
        value: -2,
        stackingRule: 'additive',
        source: 'Slow Spell'
      },
      {
        id: 'slow_dex_save',
        label: 'Slow (-2 DEX Save)',
        target: 'saving_throw.DEX',
        category: 'condition_penalty',
        value: -2,
        stackingRule: 'additive',
        source: 'Slow Spell'
      }
    ]
  }
};

// ==========================================
// 3. PIPELINE EVALUATOR CLASS & UTILITIES
// ==========================================

export class UniversalModifierEngine {
  /**
   * Harvests all active modifiers from character state, items, conditions, buffs, and features
   */
  public static collectAllModifiers(character: CharacterData): DomainModifier[] {
    if (!character) return [];

    const modifiers: DomainModifier[] = [];
    const effectiveAbilities = getEffectiveAbilities(character);
    const dexMod = getAbilityModifier(effectiveAbilities?.DEX?.score || 10);
    const conMod = getAbilityModifier(effectiveAbilities?.CON?.score || 10);
    const wisMod = getAbilityModifier(effectiveAbilities?.WIS?.score || 10);

    // 1. Inventory & Equipment Modifiers
    const inventory = character.inventory || [];
    const equipped = inventory.filter(i => {
      if (!i.equipped || i.stored) return false;
      const requiresAttunement = i.requiresAttunement ?? (i.isMagic || (i.notes || '').toLowerCase().includes('attune'));
      if (requiresAttunement && !i.attuned) return false;
      return true;
    });

    let equippedArmor: GearItem | null = null;
    let equippedShield: GearItem | null = null;

    for (const item of equipped) {
      const nameLower = (item.name || '').toLowerCase();
      const notesLower = (item.notes || '').toLowerCase();

      // Shield
      if (item.armorType === 'Shield' || nameLower.includes('shield') || notesLower.includes('shield')) {
        if (!equippedShield) {
          equippedShield = item;
          let shieldBonus = item.armorAc ?? 2;
          const magicMatch = nameLower.match(/\+(\d+)/) || notesLower.match(/\+(\d+)/);
          if (magicMatch) {
            shieldBonus += parseInt(magicMatch[1], 10);
          }
          modifiers.push({
            id: `item_shield_${item.id}`,
            label: item.name,
            target: 'ac',
            category: 'equipment',
            value: shieldBonus,
            stackingRule: 'additive',
            source: `${item.name} (+${shieldBonus} AC)`
          });
        }
        continue;
      }

      // Armor
      const isArmor =
        item.itemType === 'Armor' ||
        (item.armorAc !== undefined && (item.armorType as string) !== 'Shield') ||
        nameLower.includes('armor') ||
        nameLower.includes('plate') ||
        nameLower.includes('mail') ||
        nameLower.includes('leather');

      if (isArmor && !equippedArmor) {
        equippedArmor = item;
      } else {
        // Other magic items providing AC bonus (Ring of Protection, Cloak of Protection, Bracers of Defense)
        let bonusVal = item.acBonus ?? 0;
        if (bonusVal === 0) {
          const acMatch = notesLower.match(/\+(\d+)\s*(?:to\s*)?ac\b|\bac\s*\+(\d+)\b/i) ||
                          nameLower.match(/\+(\d+)\s*(?:to\s*)?ac\b|\bac\s*\+(\d+)\b/i);
          if (acMatch) {
            bonusVal = parseInt(acMatch[1] || acMatch[2] || '0', 10);
          }
        }
        if (bonusVal > 0) {
          modifiers.push({
            id: `item_bonus_${item.id}`,
            label: item.name,
            target: 'ac',
            category: 'equipment',
            value: bonusVal,
            stackingRule: 'additive',
            source: `${item.name} (+${bonusVal} AC)`
          });
        }

        // Saving throw bonuses from magic items (e.g. Ring/Cloak of Protection +1 to all saves)
        const saveMatch = notesLower.match(/\+(\d+)\s*(?:to\s*)?(?:all\s*)?saving\s*throws/i);
        if (saveMatch) {
          const saveVal = parseInt(saveMatch[1], 10);
          modifiers.push({
            id: `item_save_${item.id}`,
            label: item.name,
            target: 'saving_throw.all',
            category: 'equipment',
            value: saveVal,
            stackingRule: 'additive',
            source: `${item.name} (+${saveVal} to all saves)`
          });
        }
      }
    }

    // 2. Class Features & Traits (Fighting Styles, Unarmored Defense)
    const features = character.classFeatures || [];
    const classNameLower = (character.characterClass || '').toLowerCase();
    const featuresText = features.map(f => `${f.name} ${f.description}`).join(' ').toLowerCase();

    // Defense Fighting Style (+1 AC while wearing armor)
    if (equippedArmor) {
      const hasDefenseStyle = features.some(f =>
        f.name.toLowerCase().includes('defense') ||
        f.description.toLowerCase().includes('+1 bonus to ac while wearing armor')
      );
      if (hasDefenseStyle) {
        modifiers.push({
          id: 'feature_defense_style',
          label: 'Defense Fighting Style',
          target: 'ac',
          category: 'feat_trait',
          value: 1,
          stackingRule: 'additive',
          source: 'Defense Fighting Style (+1 AC in armor)'
        });
      }
    }

    // Archery Fighting Style (+2 to ranged attacks)
    const hasArcheryStyle = features.some(f =>
      f.name.toLowerCase().includes('archery') ||
      f.description.toLowerCase().includes('+2 bonus to attack rolls you make with ranged weapons')
    );
    if (hasArcheryStyle) {
      modifiers.push({
        id: 'feature_archery_style',
        label: 'Archery Fighting Style',
        target: 'attack.ranged',
        category: 'feat_trait',
        value: 2,
        stackingRule: 'additive',
        source: 'Archery Fighting Style (+2 ranged attack)'
      });
    }

    // Unarmored Defense (Barbarian CON or Monk WIS)
    if (!equippedArmor) {
      if ((classNameLower.includes('barbarian') || featuresText.includes('unarmored defense')) && conMod > 0) {
        modifiers.push({
          id: 'feature_barbarian_unarmored',
          label: 'Unarmored Defense (CON)',
          target: 'ac',
          category: 'ability',
          value: conMod,
          stackingRule: 'highest_only',
          source: `Barbarian CON Modifier (+${conMod} AC)`
        });
      } else if (classNameLower.includes('monk') && wisMod > 0 && !equippedShield) {
        modifiers.push({
          id: 'feature_monk_unarmored',
          label: 'Unarmored Defense (WIS)',
          target: 'ac',
          category: 'ability',
          value: wisMod,
          stackingRule: 'highest_only',
          source: `Monk WIS Modifier (+${wisMod} AC)`
        });
      }
    }

    // 3. Built-in Active Buffs & Condition Modifiers
    const conditions = character.conditions || [];
    for (const condName of conditions) {
      const condLower = condName.toLowerCase();
      
      // Match active preset buffs stored in conditions
      for (const [key, preset] of Object.entries(BUILTIN_BUFF_PRESETS)) {
        if (condLower === preset.name.toLowerCase() || condLower.includes(preset.name.toLowerCase())) {
          modifiers.push(...preset.modifiers);
        }
      }

      // Exhaustion penalties
      if (condLower.includes('exhaustion')) {
        const lvlMatch = condLower.match(/\d+/);
        const level = lvlMatch ? parseInt(lvlMatch[0], 10) : (character.exhaustionLevel || 1);
        if (level >= 3) {
          modifiers.push({
            id: 'exhaustion_disadv_attacks',
            label: 'Exhaustion Lvl 3+',
            target: 'attack.all',
            category: 'condition_penalty',
            value: 0,
            disadvantage: true,
            stackingRule: 'additive',
            source: 'Exhaustion (Disadvantage on Attacks)'
          });
          modifiers.push({
            id: 'exhaustion_disadv_saves',
            label: 'Exhaustion Lvl 3+',
            target: 'saving_throw.all',
            category: 'condition_penalty',
            value: 0,
            disadvantage: true,
            stackingRule: 'additive',
            source: 'Exhaustion (Disadvantage on Saving Throws)'
          });
        }
        if (level >= 2) {
          modifiers.push({
            id: 'exhaustion_halved_speed',
            label: 'Exhaustion Lvl 2+ (Halved Speed)',
            target: 'speed',
            category: 'condition_penalty',
            value: -(Math.floor((character.speed || 30) / 2)),
            stackingRule: 'additive',
            source: 'Exhaustion (Speed Halved)'
          });
        }
      }

      // Poisoned Condition (Disadvantage on attacks & ability checks)
      if (condLower === 'poisoned') {
        modifiers.push({
          id: 'cond_poisoned_attack',
          label: 'Poisoned',
          target: 'attack.all',
          category: 'condition_penalty',
          value: 0,
          disadvantage: true,
          stackingRule: 'additive',
          source: 'Poisoned (Disadvantage on Attack Rolls)'
        });
        modifiers.push({
          id: 'cond_poisoned_skills',
          label: 'Poisoned',
          target: 'skill.all',
          category: 'condition_penalty',
          value: 0,
          disadvantage: true,
          stackingRule: 'additive',
          source: 'Poisoned (Disadvantage on Ability Checks)'
        });
      }

      // Prone Condition
      if (condLower === 'prone') {
        modifiers.push({
          id: 'cond_prone_attack',
          label: 'Prone',
          target: 'attack.all',
          category: 'condition_penalty',
          value: 0,
          disadvantage: true,
          stackingRule: 'additive',
          source: 'Prone (Disadvantage on Attack Rolls)'
        });
      }

      // Restrained Condition
      if (condLower === 'restrained') {
        modifiers.push({
          id: 'cond_restrained_attack',
          label: 'Restrained',
          target: 'attack.all',
          category: 'condition_penalty',
          value: 0,
          disadvantage: true,
          stackingRule: 'additive',
          source: 'Restrained (Disadvantage on Attacks)'
        });
        modifiers.push({
          id: 'cond_restrained_dex_save',
          label: 'Restrained',
          target: 'saving_throw.DEX',
          category: 'condition_penalty',
          value: 0,
          disadvantage: true,
          stackingRule: 'additive',
          source: 'Restrained (Disadvantage on DEX Saves)'
        });
      }
    }

    // 4. Custom User / DM Modifiers attached to character
    const customMods = (character as any).customModifiers as DomainModifier[] | undefined;
    if (Array.isArray(customMods)) {
      modifiers.push(...customMods);
    }

    return modifiers;
  }

  /**
   * Evaluates a specific target through the full Stacking Engine pipeline
   */
  public static evaluate(
    target: ModifierTarget,
    character: CharacterData,
    options?: {
      equippedArmor?: GearItem | null;
      equippedShield?: GearItem | null;
      attackType?: 'melee' | 'ranged' | 'spell';
      skillKey?: string;
    }
  ): ModifierEvaluationResult {
    const allModifiers = this.collectAllModifiers(character);
    const relevantModifiers = allModifiers.filter(m => {
      if (m.target === target) return true;
      if (target.startsWith('saving_throw.') && m.target === 'saving_throw.all') return true;
      if (target.startsWith('attack.') && m.target === 'attack.all') return true;
      if (target.startsWith('damage.') && m.target === 'damage.all') return true;
      if (target.startsWith('skill.') && m.target === 'skill.all') return true;
      return false;
    });

    const effectiveAbilities = getEffectiveAbilities(character);
    const dexMod = getAbilityModifier(effectiveAbilities?.DEX?.score || 10);
    const profBonus = getProficiencyBonus(character.level || 1);

    // Compute Base Value depending on Target
    let baseValue = 0;
    const formulaParts: string[] = [];

    if (target === 'ac') {
      const inventory = character.inventory || [];
      const armor = options?.equippedArmor !== undefined ? options.equippedArmor : inventory.find(i => i.equipped && !i.stored && (i.itemType === 'Armor' || i.armorAc));
      
      if (armor && armor.armorAc !== undefined) {
        baseValue = armor.armorAc;
        formulaParts.push(`${armor.name} (${baseValue})`);

        if (armor.armorType === 'Heavy') {
          // No Dex bonus
        } else if (armor.armorType === 'Medium') {
          const capDex = Math.min(dexMod, 2);
          baseValue += capDex;
          if (capDex !== 0) formulaParts.push(`DEX [Max +2] (${formatModifier(capDex)})`);
        } else {
          // Light
          baseValue += dexMod;
          if (dexMod !== 0) formulaParts.push(`DEX (${formatModifier(dexMod)})`);
        }
      } else {
        // Natural unarmored base 10 + DEX
        baseValue = 10 + dexMod;
        formulaParts.push(`Unarmored Base (10)`);
        if (dexMod !== 0) formulaParts.push(`DEX (${formatModifier(dexMod)})`);
      }
    } else if (target === 'initiative') {
      baseValue = dexMod;
      formulaParts.push(`DEX (${formatModifier(dexMod)})`);
    } else if (target === 'speed') {
      baseValue = character.speed || 30;
      formulaParts.push(`Base Speed (${baseValue}ft)`);
    } else if (target.startsWith('saving_throw.')) {
      const abName = target.replace('saving_throw.', '') as AbilityName;
      const score = effectiveAbilities[abName]?.score || 10;
      const mod = getAbilityModifier(score);
      const isProf = (character.savingThrowProficiencies || []).includes(abName);
      baseValue = mod + (isProf ? profBonus : 0);
      formulaParts.push(`${abName} Mod (${formatModifier(mod)})`);
      if (isProf) formulaParts.push(`Proficiency (+${profBonus})`);
    } else if (target.startsWith('ability.')) {
      const abName = target.replace('ability.', '') as AbilityName;
      baseValue = effectiveAbilities[abName]?.score || 10;
      formulaParts.push(`Base ${abName} (${baseValue})`);
    } else if (target.startsWith('skill.')) {
      const skillKey = target.replace('skill.', '');
      const skill = (character.skills || []).find(s => s.name.toLowerCase() === skillKey.toLowerCase() || s.id === skillKey);
      if (skill) {
        const score = effectiveAbilities[skill.ability]?.score || 10;
        const mod = getAbilityModifier(score);
        const profMult = skill.expertise ? 2 : skill.proficient ? 1 : 0;
        const pBonus = profMult * profBonus;
        baseValue = mod + pBonus;
        formulaParts.push(`${skill.ability} (${formatModifier(mod)})`);
        if (pBonus > 0) formulaParts.push(skill.expertise ? `Expertise (+${pBonus})` : `Proficiency (+${pBonus})`);
      } else {
        baseValue = 0;
      }
    }

    // Process Stacking Engine Rules
    let effectiveBonus = 0;
    let finalValue = baseValue;
    const appliedModifiers: Array<DomainModifier & { contribution: number }> = [];
    const suppressedModifiers: Array<{ modifier: DomainModifier; reason: string }> = [];
    const diceBonuses: Array<{ dice: string; source: string; sign: 1 | -1 }> = [];
    let hasAdvantage = false;
    let hasDisadvantage = false;

    // Group by category and stacking rule
    const highestOnlyGroups = new Map<string, DomainModifier[]>();
    const lowestOnlyGroups = new Map<string, DomainModifier[]>();
    const additiveMods: DomainModifier[] = [];
    const fixedOverrides: DomainModifier[] = [];
    const floorMods: DomainModifier[] = [];

    for (const mod of relevantModifiers) {
      if (mod.advantage) hasAdvantage = true;
      if (mod.disadvantage) hasDisadvantage = true;

      if (mod.stackingRule === 'dice' && mod.diceFormula) {
        const sign = mod.diceFormula.startsWith('-') ? -1 : 1;
        diceBonuses.push({ dice: mod.diceFormula.replace(/^[+-]/, ''), source: mod.source, sign });
        continue;
      }

      if (mod.stackingRule === 'override_fixed') {
        fixedOverrides.push(mod);
      } else if (mod.stackingRule === 'floor') {
        floorMods.push(mod);
      } else if (mod.stackingRule === 'highest_only') {
        const groupKey = `${mod.category}_${mod.target}`;
        const list = highestOnlyGroups.get(groupKey) || [];
        list.push(mod);
        highestOnlyGroups.set(groupKey, list);
      } else if (mod.stackingRule === 'lowest_only') {
        const groupKey = `${mod.category}_${mod.target}`;
        const list = lowestOnlyGroups.get(groupKey) || [];
        list.push(mod);
        lowestOnlyGroups.set(groupKey, list);
      } else {
        additiveMods.push(mod);
      }
    }

    // 1. Evaluate Fixed Overrides (e.g. Mage Armor sets base AC to 13 + DEX)
    for (const override of fixedOverrides) {
      if (target === 'ac' && override.value > 10) {
        // If unarmored and Mage Armor (13) exceeds default 10
        const overrideAc = override.value + dexMod;
        if (overrideAc > finalValue) {
          finalValue = overrideAc;
          appliedModifiers.push({ ...override, contribution: override.value - 10 });
          formulaParts.push(`Mage Armor Base (${override.value})`);
        } else {
          suppressedModifiers.push({ modifier: override, reason: `Armor already grants AC >= ${override.value}` });
        }
      }
    }

    // 2. Evaluate Highest-Only Groups (e.g. Cover bonuses, Morale bonuses)
    for (const [, group] of highestOnlyGroups.entries()) {
      if (group.length === 0) continue;
      const sorted = [...group].sort((a, b) => b.value - a.value);
      const winner = sorted[0];
      finalValue += winner.value;
      effectiveBonus += winner.value;
      appliedModifiers.push({ ...winner, contribution: winner.value });
      formulaParts.push(`${winner.label} (${formatModifier(winner.value)})`);

      for (let i = 1; i < sorted.length; i++) {
        suppressedModifiers.push({
          modifier: sorted[i],
          reason: `Suppressed by higher ${sorted[i].category} bonus from ${winner.source}`
        });
      }
    }

    // 3. Evaluate Lowest-Only Groups
    for (const [, group] of lowestOnlyGroups.entries()) {
      if (group.length === 0) continue;
      const sorted = [...group].sort((a, b) => a.value - b.value);
      const worst = sorted[0];
      finalValue += worst.value;
      effectiveBonus += worst.value;
      appliedModifiers.push({ ...worst, contribution: worst.value });
      formulaParts.push(`${worst.label} (${formatModifier(worst.value)})`);

      for (let i = 1; i < sorted.length; i++) {
        suppressedModifiers.push({
          modifier: sorted[i],
          reason: `Suppressed by worse penalty from ${worst.source}`
        });
      }
    }

    // 4. Evaluate Additive Modifiers
    for (const mod of additiveMods) {
      if (mod.value !== 0) {
        finalValue += mod.value;
        effectiveBonus += mod.value;
        appliedModifiers.push({ ...mod, contribution: mod.value });
        formulaParts.push(`${mod.label} (${formatModifier(mod.value)})`);
      }
    }

    // 5. Evaluate Floor Constraints (e.g. Barkskin minimum AC 16)
    for (const floor of floorMods) {
      if (finalValue < floor.value) {
        const floorLift = floor.value - finalValue;
        finalValue = floor.value;
        appliedModifiers.push({ ...floor, contribution: floorLift });
        formulaParts.push(`Floor Enforced: ${floor.label} (Min ${floor.value})`);
      } else {
        suppressedModifiers.push({ modifier: floor, reason: `Natural AC (${finalValue}) is already above floor (${floor.value})` });
      }
    }

    // Advantage / Disadvantage Net Mode
    let rollMode: 'normal' | 'advantage' | 'disadvantage' = 'normal';
    if (hasAdvantage && !hasDisadvantage) rollMode = 'advantage';
    else if (!hasAdvantage && hasDisadvantage) rollMode = 'disadvantage';

    let breakdownStr = formulaParts.join(' + ').replace(/\+\s+\-/g, '- ');
    if (diceBonuses.length > 0) {
      const diceParts = diceBonuses.map(d => `${d.sign > 0 ? '+' : '-'}${d.dice} (${d.source})`).join(' ');
      breakdownStr += ` [${diceParts}]`;
    }
    breakdownStr += ` = ${finalValue}`;

    return {
      target,
      baseValue,
      finalValue,
      effectiveBonus,
      appliedModifiers,
      suppressedModifiers,
      diceBonuses,
      advantage: hasAdvantage,
      disadvantage: hasDisadvantage,
      rollMode,
      formulaBreakdown: breakdownStr
    };
  }
}
