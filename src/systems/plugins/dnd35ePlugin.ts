import { GameSystemPlugin } from '../types';
import { getAbilityModifier } from '../../utils/calculators/abilityCalculators';
import { getEffectiveMaxHp, getArmorClassBreakdown } from '../../utils/dndCalculations';
import { CharacterData, GearItem, Attack } from '../../types';

export const dnd35ePlugin: GameSystemPlugin = {
  id: '3.5e',
  name: 'Dungeons & Dragons 3.5 Edition',
  shortName: 'D&D 3.5e',
  description: 'Classic 3.5e mechanics with Base Attack Bonus (BAB), Fortitude/Reflex/Will saves, and skill points.',
  badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  icon: '📜',
  primaryResourceName: 'Hit Points',

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
    calculateStats(char: CharacterData) {
      const dexMod = getAbilityModifier(char.abilities?.DEX?.score || 10);
      const wisMod = getAbilityModifier(char.abilities?.WIS?.score || 10);
      const spotSkill = char.skills?.find(s => s.name === 'Spot' || s.name === 'Perception');
      let passiveSpot = 10 + wisMod;
      if (spotSkill?.proficient) passiveSpot += (char.level || 1);

      return {
        maxHp: getEffectiveMaxHp(char),
        armorClass: getArmorClassBreakdown(char).total,
        initiativeBonus: dexMod + (char.initiativeBonus || 0),
        speed: char.speed || 30,
        passivePerception: passiveSpot
      };
    },
    getProficiencyBonus(level: number) {
      return Math.floor(level * 0.75);
    },
    getAbilityModifier(score: number) {
      return getAbilityModifier(score);
    }
  },

  combatEngine: {
    getInitiativeFormula(char: CharacterData) {
      const dexMod = getAbilityModifier(char.abilities?.DEX?.score || 10);
      const bonus = dexMod + (char.initiativeBonus || 0);
      return `1d20${bonus >= 0 ? '+' : ''}${bonus}`;
    },
    getAttackBonus(itemOrAttack: GearItem | Attack, char: CharacterData) {
      if ('attackBonus' in itemOrAttack) {
        return itemOrAttack.attackBonus;
      }
      const strMod = getAbilityModifier(char.abilities?.STR?.score || 10);
      const dexMod = getAbilityModifier(char.abilities?.DEX?.score || 10);
      const bab = Math.floor((char.level || 1) * 0.75);

      let statMod = strMod;
      const notes = itemOrAttack.notes || '';
      if (notes.toLowerCase().includes('ranged')) {
        statMod = dexMod;
      }
      return bab + statMod;
    },
    getDamageFormula(itemOrAttack: GearItem | Attack, char: CharacterData) {
      if ('attackBonus' in itemOrAttack) {
        return itemOrAttack.damage;
      }
      const strMod = getAbilityModifier(char.abilities?.STR?.score || 10);
      const dmg = itemOrAttack.weaponStats?.damage || '1d8';
      return `${dmg}${strMod !== 0 ? (strMod > 0 ? `+${strMod}` : `${strMod}`) : ''}`;
    },
    supportsSanityCheck: false,
    supportsConditionMonitors: false
  },

  spellEngine: {
    isSpellcaster(char: CharacterData) {
      return Boolean(char.isSpellcaster);
    },
    getSpellSlotLabel(level: number) {
      return level === 0 ? '0-Level Spells' : `Level ${level} Spells/Day`;
    },
    getSpellStatLabel() {
      return 'Spell Save DC (10 + Spell Level + Ability Mod)';
    }
  },

  data: {
    classes: ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Wizard'],
    races: ['Human', 'Dwarf', 'Elf', 'Gnome', 'Half-Elf', 'Half-Orc', 'Halfling'],
    alignments: ['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'],
    primaryAttributes: ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'],
    damageTypes: ['Acid', 'Bludgeoning', 'Cold', 'Fire', 'Force', 'Electricity', 'Negative Energy', 'Piercing', 'Poison', 'Sonic', 'Positive Energy', 'Slashing']
  }
};
