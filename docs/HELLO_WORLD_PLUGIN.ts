import { GameSystemPlugin } from '../src/systems/types';

export const helloWorldPlugin: GameSystemPlugin = {
  id: '5e' as any, // Example extension ID
  name: 'Hello World TRPG Plugin',
  shortName: 'HW-TRPG',
  description: 'Demonstrates a standard GameSystemPlugin package with custom roll mechanics and EventBus integration.',
  badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  icon: '🌟',
  primaryResourceName: 'Stamina Points',
  version: '1.0.0',
  minPlatformVersion: '1.5.0',
  author: 'Community Developer',
  category: 'universal',
  supportedFeatures: ['Custom Dice Pool', 'Decoupled Event Listening', 'Stamina Engine'],

  characterEngine: {
    getDefaultAbilities() {
      return {
        STR: { score: 10 },
        DEX: { score: 10 },
        CON: { score: 10 },
        INT: { score: 10 },
        WIS: { score: 10 },
        CHA: { score: 10 }
      };
    },
    calculateStats(char) {
      return {
        maxHp: (char.level || 1) * 8 + 10,
        armorClass: 10 + Math.floor(((char.abilities?.DEX?.score || 10) - 10) / 2),
        initiativeBonus: Math.floor(((char.abilities?.DEX?.score || 10) - 10) / 2),
        speed: 30,
        passivePerception: 10 + Math.floor(((char.abilities?.WIS?.score || 10) - 10) / 2)
      };
    },
    getProficiencyBonus(level) {
      return Math.floor((level - 1) / 4) + 2;
    },
    getAbilityModifier(score) {
      return Math.floor((score - 10) / 2);
    }
  },

  combatEngine: {
    getInitiativeFormula(char) {
      const mod = Math.floor(((char.abilities?.DEX?.score || 10) - 10) / 2);
      return `1d20${mod >= 0 ? '+' : ''}${mod}`;
    },
    getAttackBonus(itemOrAttack, char) {
      return Math.floor(((char.abilities?.STR?.score || 10) - 10) / 2) + 2;
    },
    getDamageFormula(itemOrAttack) {
      return '1d8+2';
    },
    getRollModel() {
      return { kind: 'd20', modifier: 2, formula: '1d20+2', targetType: 'AC' };
    }
  },

  spellEngine: {
    isSpellcaster() { return true; },
    getSpellSlotLabel(lvl) { return `Tier ${lvl} Power Slots`; },
    getSpellStatLabel() { return 'Power DC'; }
  },

  data: {
    classes: ['Hero', 'Adept', 'Scout'],
    races: ['Human', 'Eldritch', 'Construct'],
    primaryAttributes: ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']
  }
};
