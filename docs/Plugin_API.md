# Plugin API & System Engine Specifications

## Overview
Every TRPG ruleset in Pen & Paper Platform is defined by a `GameSystemPlugin` object. Plugins expose engines for character statistics, combat roll models, spell slot calculations, and reference data catalogs.

## `GameSystemPlugin` Interface Contract

```typescript
export interface GameSystemPlugin {
  id: RuleEdition; // '5e' | '3.5e' | 'shadowrun' | 'pathfinder' | 'cthulhu'
  name: string;
  shortName: string;
  description: string;
  badgeColor: string;
  icon: string;
  primaryResourceName: string; // e.g. "Hit Points", "Physical & Stun Condition Monitor"

  // Extension Metadata
  version?: string;
  author?: string;
  website?: string;
  license?: string;
  category?: 'fantasy' | 'cyberpunk' | 'horror' | 'tactical' | 'universal';
  supportedFeatures?: string[];

  characterEngine: SystemCharacterEngine;
  combatEngine: SystemCombatEngine;
  spellEngine: SystemSpellEngine;
  data: SystemDataCatalog;
}
```

## Sub-Engines

### 1. `SystemCharacterEngine`
```typescript
export interface SystemCharacterEngine {
  getDefaultAbilities(): Record<AbilityName, { score: number; overrideBonus?: number }>;
  calculateStats(char: CharacterData): CharacterStatsSummary;
  getProficiencyBonus(level: number): number;
  getAbilityModifier(score: number): number;
}
```

### 2. `SystemCombatEngine`
Abstracted roll models to avoid forcing non-D&D systems into d20 constraints:
```typescript
export type RollModel =
  | { kind: 'd20'; modifier: number; formula: string; targetType: 'AC' | 'DC' }
  | { kind: 'dicePool'; diceCount: number; successTarget: number; glitchThreshold?: number }
  | { kind: 'percentile'; targetPercentage: number; hardTarget?: number; extremeTarget?: number };

export interface SystemCombatEngine {
  getInitiativeFormula(char: CharacterData): string;
  getAttackBonus(itemOrAttack: GearItem | Attack, char: CharacterData): number;
  getDamageFormula(itemOrAttack: GearItem | Attack, char: CharacterData): string;
  getRollModel?(actionType: 'attack' | 'check' | 'save', itemOrAttack: GearItem | Attack | undefined, char: CharacterData): RollModel;
  resolveRoll?(rollModel: RollModel): { total: number; summary: string; isCritical?: boolean };
  supportsSanityCheck?: boolean;
  supportsConditionMonitors?: boolean;
}
```

### 3. `SystemSpellEngine`
```typescript
export interface SystemSpellEngine {
  isSpellcaster(char: CharacterData): boolean;
  getSpellSlotLabel(level: number): string;
  getSpellStatLabel(): string;
  canCastSpell?(spell: Spell, char: CharacterData): { allowed: boolean; reason?: string };
}
```

### 4. `SystemDataCatalog`
```typescript
export interface SystemDataCatalog {
  classes: string[];
  races: string[];
  alignments?: string[];
  primaryAttributes: string[];
  damageTypes?: string[];
  defaultClassData?: Record<string, { hd: string; primaryStat: string }>;
}
```
