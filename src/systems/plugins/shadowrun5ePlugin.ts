import { GameSystemPlugin } from '../types';
import { CharacterData, GearItem, Attack } from '../../types';

export const shadowrun5ePlugin: GameSystemPlugin = {
  id: 'shadowrun',
  name: 'Shadowrun 5th Edition',
  shortName: 'Shadowrun 5e',
  description: 'Cyberpunk urban fantasy dice-pool system (D6s hitting 5/6), condition monitors, essence & karma.',
  badgeColor: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
  icon: '💻',
  primaryResourceName: 'Physical & Stun Condition Monitor',
  version: '3.0.0',
  author: 'Neon Matrix Syndicate',
  category: 'cyberpunk',
  supportedFeatures: ['D6 Dice Pools (Hits on 5+)', 'Glitches & Critical Glitches', 'Essence / Cyberware Strain', 'Nuyen & Karma Ledger'],

  characterEngine: {
    getDefaultAbilities() {
      return {
        STR: { score: 3 },
        DEX: { score: 3 },
        CON: { score: 3 },
        INT: { score: 3 },
        WIS: { score: 3 },
        CHA: { score: 3 }
      };
    },
    calculateStats(char: CharacterData) {
      const sr = char.shadowrun;
      const bod = sr?.bod || Math.max(1, Math.floor((char.abilities?.CON?.score || 10) / 2) || 3);
      const wil = sr?.wil || Math.max(1, Math.floor((char.abilities?.WIS?.score || 10) / 2) || 3);
      const rea = sr?.rea || Math.max(1, Math.floor((char.abilities?.DEX?.score || 10) / 2) || 3);
      const int = sr?.int || Math.max(1, Math.floor((char.abilities?.INT?.score || 10) / 2) || 3);

      const physTrackMax = 8 + Math.ceil(bod / 2);
      const stunTrackMax = 8 + Math.ceil(wil / 2);
      const initMod = rea + int;

      const perceptionSkillRating = sr?.srSkills?.find(s => s.name.toLowerCase().includes('perception'))?.rating || 0;

      return {
        maxHp: physTrackMax,
        armorClass: (sr?.ballisticArmor || 12),
        initiativeBonus: initMod,
        speed: (bod * 2) + 10,
        passivePerception: int + perceptionSkillRating,
        secondaryResourceLabel: 'Stun Track',
        secondaryResourceVal: stunTrackMax - (sr?.stunBoxesCurrent || 0),
        secondaryResourceMax: stunTrackMax
      };
    },
    getProficiencyBonus(level: number) {
      return Math.min(12, level);
    },
    getAbilityModifier(score: number) {
      return score;
    }
  },

  combatEngine: {
    getInitiativeFormula(char: CharacterData) {
      const sr = char.shadowrun;
      const rea = sr?.rea || Math.max(1, Math.floor((char.abilities?.DEX?.score || 10) / 2) || 3);
      const int = sr?.int || Math.max(1, Math.floor((char.abilities?.INT?.score || 10) / 2) || 3);
      const base = rea + int;
      return `1d6+${base}`;
    },
    getAttackBonus(itemOrAttack: GearItem | Attack, char: CharacterData) {
      if ('attackBonus' in itemOrAttack) {
        return itemOrAttack.attackBonus;
      }
      const agi = char.shadowrun?.agi || 4;
      return agi + 6;
    },
    getDamageFormula(itemOrAttack: GearItem | Attack) {
      if ('damage' in itemOrAttack && typeof itemOrAttack.damage === 'string') {
        return itemOrAttack.damage;
      }
      if ('weaponStats' in itemOrAttack && itemOrAttack.weaponStats?.damage) {
        return itemOrAttack.weaponStats.damage;
      }
      return '9P (AP -2)';
    },
    getRollModel(actionType, itemOrAttack, char) {
      const dice = itemOrAttack ? shadowrun5ePlugin.combatEngine.getAttackBonus(itemOrAttack, char) : ((char.shadowrun?.agi || 3) + 4);
      return { kind: 'dicePool', diceCount: dice, successTarget: 5, glitchThreshold: Math.floor(dice / 2) };
    },
    supportsSanityCheck: false,
    supportsConditionMonitors: true
  },

  spellEngine: {
    isSpellcaster(char: CharacterData) {
      return Boolean(char.shadowrun?.mag && char.shadowrun.mag > 0) || Boolean(char.isSpellcaster);
    },
    getSpellSlotLabel(level: number) {
      return `Force ${level} Spells`;
    },
    getSpellStatLabel() {
      return 'Magic + Spellcasting Pool vs Drain';
    }
  },

  data: {
    classes: ['Street Samurai', 'Deckers / Technomancers', 'Mage / Shaman', 'Rigger', 'Physical Adept', 'Face', 'Bounty Hunter'],
    races: ['Human', 'Elf', 'Dwarf', 'Ork', 'Troll'],
    primaryAttributes: ['BOD', 'AGI', 'REA', 'STR', 'WIL', 'LOG', 'INT', 'CHA', 'EDG', 'MAG', 'RES'],
    damageTypes: ['Physical (P)', 'Stun (S)', 'Matrix (G)', 'Elemental Fire', 'Elemental Cold', 'Elemental Electricity', 'Acid']
  }
};
