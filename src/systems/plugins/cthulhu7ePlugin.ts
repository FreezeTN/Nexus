import { GameSystemPlugin } from '../types';
import { CharacterData, GearItem, Attack } from '../../types';

export const cthulhu7ePlugin: GameSystemPlugin = {
  id: 'cthulhu',
  name: 'Call of Cthulhu 7th Edition',
  shortName: 'CoC 7e',
  description: 'Percentile (d100) cosmic horror investigation system, featuring Sanity loss, Luck rolls, and Major Wounds.',
  badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  icon: '🐙',
  primaryResourceName: 'Hit Points & Sanity (SAN)',

  characterEngine: {
    getDefaultAbilities() {
      return {
        STR: { score: 50 },
        DEX: { score: 50 },
        CON: { score: 50 },
        INT: { score: 60 },
        WIS: { score: 60 },
        CHA: { score: 50 }
      };
    },
    calculateStats(char: CharacterData) {
      const con = char.abilities?.CON?.score || 50;
      const siz = char.abilities?.STR?.score || 50;
      const dex = char.abilities?.DEX?.score || 50;

      const cocHp = char.sanity?.max ? Math.floor((con + siz) / 10) : Math.floor((con + 50) / 10);
      const sanCurrent = char.sanity?.current ?? 50;
      const sanMax = char.sanity?.max ?? 99;

      return {
        maxHp: Math.max(6, cocHp),
        armorClass: 0,
        initiativeBonus: Math.floor(dex / 5),
        speed: dex >= 50 && siz >= 50 ? 8 : 7,
        passivePerception: Math.floor((char.abilities?.INT?.score || 60) / 2),
        secondaryResourceLabel: 'Sanity (SAN)',
        secondaryResourceVal: sanCurrent,
        secondaryResourceMax: sanMax
      };
    },
    getProficiencyBonus(level: number) {
      return level * 5;
    },
    getAbilityModifier(score: number) {
      return Math.floor(score / 5);
    }
  },

  combatEngine: {
    getInitiativeFormula(char: CharacterData) {
      const dex = char.abilities?.DEX?.score || 50;
      return `DEX ${dex}`;
    },
    getAttackBonus(itemOrAttack: GearItem | Attack, char: CharacterData) {
      if ('attackBonus' in itemOrAttack) {
        return itemOrAttack.attackBonus;
      }
      return 50;
    },
    getDamageFormula(itemOrAttack: GearItem | Attack, char: CharacterData) {
      if ('damage' in itemOrAttack) {
        return itemOrAttack.damage;
      }
      return itemOrAttack.weaponStats?.damage || '1D6 + Build DB';
    },
    getRollModel(actionType, itemOrAttack, char) {
      const target = itemOrAttack ? cthulhu7ePlugin.combatEngine.getAttackBonus(itemOrAttack, char) : 50;
      return {
        kind: 'percentile',
        targetPercentage: target,
        hardTarget: Math.floor(target / 2),
        extremeTarget: Math.floor(target / 5)
      };
    },
    supportsSanityCheck: true,
    supportsConditionMonitors: false
  },

  spellEngine: {
    isSpellcaster() {
      return true;
    },
    getSpellSlotLabel() {
      return 'Magic Points (MP) & Sanity Cost';
    },
    getSpellStatLabel() {
      return 'POW / Hard Cthulhu Mythos Check';
    }
  },

  data: {
    classes: ['Private Investigator', 'Professor / Scholar', 'Journalist / Author', 'Doctor / Alienist', 'Antiquarian', 'Police Detective', 'Archaeologist', 'Dilettante'],
    races: ['Human'],
    primaryAttributes: ['STR', 'CON', 'SIZ', 'DEX', 'APP', 'INT', 'POW', 'EDU', 'LUK'],
    damageTypes: ['Blunt Force', 'Piercing / Firearms', 'Fire', 'Acid', 'Drowning', 'Explosive', 'Mythos Magic / Psychic Trauma']
  }
};
