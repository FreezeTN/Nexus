import { RuleEdition, CharacterData, GearItem, Attack, Spell, AbilityName } from '../types';

export interface CharacterStatsSummary {
  maxHp: number;
  armorClass: number;
  initiativeBonus: number;
  speed: number;
  passivePerception: number;
  secondaryResourceLabel?: string;
  secondaryResourceVal?: number;
  secondaryResourceMax?: number;
}

export interface SystemCharacterEngine {
  getDefaultAbilities(): Record<AbilityName, { score: number; overrideBonus?: number }>;
  calculateStats(char: CharacterData): CharacterStatsSummary;
  getProficiencyBonus(level: number): number;
  getAbilityModifier(score: number): number;
}

export interface SystemCombatEngine {
  getInitiativeFormula(char: CharacterData): string;
  getAttackBonus(itemOrAttack: GearItem | Attack, char: CharacterData): number;
  getDamageFormula(itemOrAttack: GearItem | Attack, char: CharacterData): string;
  supportsSanityCheck?: boolean;
  supportsConditionMonitors?: boolean;
}

export interface SystemSpellEngine {
  isSpellcaster(char: CharacterData): boolean;
  getSpellSlotLabel(level: number): string;
  getSpellStatLabel(): string;
  canCastSpell?(spell: Spell, char: CharacterData): { allowed: boolean; reason?: string };
}

export interface SystemDataCatalog {
  classes: string[];
  races: string[];
  alignments?: string[];
  primaryAttributes: string[];
  damageTypes?: string[];
}

export interface GameSystemPlugin {
  id: RuleEdition;
  name: string;
  shortName: string;
  description: string;
  badgeColor: string;
  icon: string;
  primaryResourceName: string;
  
  characterEngine: SystemCharacterEngine;
  combatEngine: SystemCombatEngine;
  spellEngine: SystemSpellEngine;
  data: SystemDataCatalog;
}
