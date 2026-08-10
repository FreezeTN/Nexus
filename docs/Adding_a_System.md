# Guide: Adding a New TRPG System Plugin

## Overview
Adding a new Tabletop RPG system (e.g., Cyberpunk RED, Call of Cthulhu, Savage Worlds, Pathfinder 2e) to Pen & Paper Platform requires implementing a single `GameSystemPlugin` object and registering it with the `systemRegistry`.

## Step-by-Step Plugin Creation

### Step 1: Define the Edition Identifier
In `/src/types.ts`, add your new edition identifier to `RuleEdition`:
```typescript
export type RuleEdition = '5e' | '3.5e' | 'shadowrun' | 'pathfinder' | 'cthulhu' | 'cyberpunk_red';
```

### Step 2: Create the Plugin File
In `/src/systems/plugins/cyberpunkRedPlugin.ts`:

```typescript
import { GameSystemPlugin } from '../types';

export const cyberpunkRedPlugin: GameSystemPlugin = {
  id: 'cyberpunk_red',
  name: 'Cyberpunk RED',
  shortName: 'CP RED',
  description: 'Dark future roleplaying in Night City using the Interlock engine (d10 + Stat + Skill).',
  badgeColor: 'bg-red-600/20 text-red-300 border-red-500/40',
  icon: '🦾',
  primaryResourceName: 'Hit Points & Humanity',
  version: '1.0.0',
  author: 'Night City Operative',
  category: 'cyberpunk',
  supportedFeatures: ['Interlock Engine (1d10 + Stat + Skill)', 'Humanity & Cyberpsychosis', 'Eurodollars (eb)'],

  characterEngine: {
    getDefaultAbilities() {
      return {
        INT: { score: 6 },
        REF: { score: 6 },
        DEX: { score: 6 },
        TECH: { score: 6 },
        COOL: { score: 6 },
        WILL: { score: 6 },
        LUCK: { score: 6 },
        MOVE: { score: 6 },
        BODY: { score: 6 },
        EMP: { score: 6 }
      } as any;
    },
    calculateStats(char) {
      return {
        maxHp: 35,
        armorClass: 11,
        initiativeBonus: 6,
        speed: 30,
        passivePerception: 14
      };
    },
    getProficiencyBonus(level) {
      return Math.floor(level / 2);
    },
    getAbilityModifier(score) {
      return score;
    }
  },

  combatEngine: {
    getInitiativeFormula(char) {
      return '1d10 + REF';
    },
    getAttackBonus(item, char) {
      return 6;
    },
    getDamageFormula(item) {
      return '3d6';
    },
    getRollModel(actionType, item, char) {
      return {
        kind: 'd20', // or custom dicePool
        modifier: 6,
        formula: '1d10 + Stat + Skill',
        targetType: 'DC'
      };
    }
  },

  spellEngine: {
    isSpellcaster() { return false; },
    getSpellSlotLabel() { return 'N/A'; },
    getSpellStatLabel() { return 'N/A'; }
  },

  data: {
    classes: ['Solo', 'Netrunner', 'Tech', 'Medtech', 'Media', 'Executive', 'Fixer', 'Nomad', 'Rockerboy'],
    races: ['Human'],
    primaryAttributes: ['INT', 'REF', 'DEX', 'TECH', 'COOL', 'WILL', 'LUCK', 'MOVE', 'BODY', 'EMP']
  }
};
```

### Step 3: Register in `systemRegistry`
In `/src/systems/index.ts`:
```typescript
import { systemRegistry } from './registry';
import { cyberpunkRedPlugin } from './plugins/cyberpunkRedPlugin';

systemRegistry.registerSystem(cyberpunkRedPlugin);
```

Done! Your new system plugin will automatically be recognized across the Command Palette, Extension Manager, New Character Generator, Compendium, and Options Modals!
