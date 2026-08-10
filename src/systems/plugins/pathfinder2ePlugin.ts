import { GameSystemPlugin } from '../types';
import { getAbilityModifier } from '../../utils/calculators/abilityCalculators';
import { CharacterData, GearItem, Attack } from '../../types';

export const pathfinder2ePlugin: GameSystemPlugin = {
  id: 'pathfinder',
  name: 'Pathfinder 2nd Edition',
  shortName: 'Pathfinder 2e',
  description: '3-Action Economy system with Proficiency ranks (Untrained, Trained, Expert, Master, Legendary).',
  badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  icon: '🏹',
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
      const conMod = getAbilityModifier(char.abilities?.CON?.score || 10);
      const level = char.level || 1;

      const pfAc = 10 + dexMod + (level + 2);
      const pfHp = Math.max(10, (8 + conMod) * level);

      return {
        maxHp: pfHp,
        armorClass: pfAc,
        initiativeBonus: wisMod + level + 2,
        speed: char.speed || 25,
        passivePerception: 10 + wisMod + level + 2
      };
    },
    getProficiencyBonus(level: number) {
      return level + 2;
    },
    getAbilityModifier(score: number) {
      return getAbilityModifier(score);
    }
  },

  combatEngine: {
    getInitiativeFormula(char: CharacterData) {
      const wisMod = getAbilityModifier(char.abilities?.WIS?.score || 10);
      const bonus = wisMod + (char.level || 1) + 2;
      return `1d20${bonus >= 0 ? '+' : ''}${bonus}`;
    },
    getAttackBonus(itemOrAttack: GearItem | Attack, char: CharacterData) {
      if ('attackBonus' in itemOrAttack) {
        return itemOrAttack.attackBonus;
      }
      const strMod = getAbilityModifier(char.abilities?.STR?.score || 10);
      const dexMod = getAbilityModifier(char.abilities?.DEX?.score || 10);
      const level = char.level || 1;

      let statMod = strMod;
      const notes = itemOrAttack.notes || '';
      if (notes.toLowerCase().includes('ranged') || notes.toLowerCase().includes('finesse')) {
        statMod = Math.max(strMod, dexMod);
      }
      return level + 2 + statMod;
    },
    getDamageFormula(itemOrAttack: GearItem | Attack, char: CharacterData) {
      if ('attackBonus' in itemOrAttack) {
        return itemOrAttack.damage;
      }
      const strMod = getAbilityModifier(char.abilities?.STR?.score || 10);
      const dmg = itemOrAttack.weaponStats?.damage || '1d8';
      return `${dmg}${strMod !== 0 ? (strMod > 0 ? `+${strMod}` : `${strMod}`) : ''}`;
    },
    getRollModel(actionType, itemOrAttack, char) {
      const atk = itemOrAttack ? pathfinder2ePlugin.combatEngine.getAttackBonus(itemOrAttack, char) : 0;
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
      return level === 0 ? 'Cantrips (Heightened)' : `Rank ${level} Spell Slots`;
    },
    getSpellStatLabel() {
      return 'Spell DC (10 + Key Ability Mod + Proficiency + Level)';
    }
  },

  data: {
    classes: ['Alchemist', 'Barbarian', 'Bard', 'Champion', 'Cleric', 'Druid', 'Fighter', 'Gunslinger', 'Inventor', 'Investigator', 'Magus', 'Monk', 'Oracle', 'Psychic', 'Ranger', 'Rogue', 'Sorcerer', 'Summoner', 'Swashbuckler', 'Witch', 'Wizard'],
    races: ['Human', 'Elf', 'Dwarf', 'Gnome', 'Goblin', 'Halfling', 'Leshy', 'Orc', 'Kobold'],
    alignments: ['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'],
    primaryAttributes: ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'],
    damageTypes: ['Acid', 'Bludgeoning', 'Cold', 'Electricity', 'Fire', 'Force', 'Mental', 'Necrotic', 'Piercing', 'Poison', 'Sonic', 'Slashing', 'Spirit', 'Vitality']
  }
};
