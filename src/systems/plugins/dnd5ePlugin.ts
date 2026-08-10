import { GameSystemPlugin } from '../types';
import { getAbilityModifier, getProficiencyBonus } from '../../utils/calculators/abilityCalculators';
import { getEffectiveMaxHp, getArmorClassBreakdown } from '../../utils/dndCalculations';
import { CharacterData, GearItem, Attack } from '../../types';

export const dnd5ePlugin: GameSystemPlugin = {
  id: '5e',
  name: 'Dungeons & Dragons 5th Edition',
  shortName: 'D&D 5e',
  description: 'Standard 5e d20 mechanics with bounded accuracy, advantage/disadvantage, and spell slots.',
  badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
  icon: '⚔️',
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
      const prof = getProficiencyBonus(char.level || 1);
      const perceptionSkill = char.skills?.find(s => s.name === 'Perception');
      let passivePerc = 10 + wisMod;
      if (perceptionSkill?.proficient) passivePerc += prof;
      if (perceptionSkill?.expertise) passivePerc += prof;

      return {
        maxHp: getEffectiveMaxHp(char),
        armorClass: getArmorClassBreakdown(char).total,
        initiativeBonus: dexMod + (char.initiativeBonus || 0),
        speed: char.speed || 30,
        passivePerception: passivePerc
      };
    },
    getProficiencyBonus(level: number) {
      return getProficiencyBonus(level);
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
      const prof = getProficiencyBonus(char.level || 1);

      let statMod = strMod;
      const notes = itemOrAttack.notes || '';
      if (notes.toLowerCase().includes('ranged') || notes.toLowerCase().includes('finesse')) {
        statMod = Math.max(strMod, dexMod);
      }
      return statMod + prof;
    },
    getDamageFormula(itemOrAttack: GearItem | Attack, char: CharacterData) {
      if ('attackBonus' in itemOrAttack) {
        return itemOrAttack.damage;
      }
      const strMod = getAbilityModifier(char.abilities?.STR?.score || 10);
      const dexMod = getAbilityModifier(char.abilities?.DEX?.score || 10);
      let statMod = strMod;
      const notes = itemOrAttack.notes || '';
      if (notes.toLowerCase().includes('ranged') || notes.toLowerCase().includes('finesse')) {
        statMod = Math.max(strMod, dexMod);
      }
      const dmg = itemOrAttack.weaponStats?.damage || '1d6';
      return `${dmg}${statMod !== 0 ? (statMod > 0 ? `+${statMod}` : `${statMod}`) : ''}`;
    },
    getRollModel(actionType, itemOrAttack, char) {
      const atk = itemOrAttack ? dnd5ePlugin.combatEngine.getAttackBonus(itemOrAttack, char) : 0;
      return { kind: 'd20', modifier: atk, formula: `1d20${atk >= 0 ? '+' : ''}${atk}`, targetType: 'AC' };
    },
    supportsSanityCheck: false,
    supportsConditionMonitors: false
  },

  spellEngine: {
    isSpellcaster(char: CharacterData) {
      return Boolean(char.isSpellcaster);
    },
    getSpellSlotLabel(level: number) {
      return level === 0 ? 'Cantrips' : `Level ${level} Slots`;
    },
    getSpellStatLabel() {
      return 'Spell Save DC & Attack Mod';
    }
  },

  data: {
    classes: ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard', 'Artificer'],
    races: ['Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling'],
    alignments: ['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'],
    primaryAttributes: ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'],
    damageTypes: ['Acid', 'Bludgeoning', 'Cold', 'Fire', 'Force', 'Lightning', 'Necrotic', 'Piercing', 'Poison', 'Psychic', 'Radiant', 'Slashing', 'Thunder']
  }
};
