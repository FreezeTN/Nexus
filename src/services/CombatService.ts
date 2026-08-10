import { CharacterData } from '../types';
import { calculateInitiativeBonus, calculateArmorClass } from '../systems/dnd5e/combat';
import { eventBus } from '../events/eventBus';

export interface Combatant {
  id: string;
  name: string;
  initiative: number;
  hp: number;
  maxHp: number;
  ac: number;
  isNpc?: boolean;
}

export class CombatService {
  public static createCombatantFromCharacter(character: CharacterData, initRoll?: number): Combatant {
    const initBonus = calculateInitiativeBonus(character);
    const initiative = initRoll !== undefined ? initRoll + initBonus : initBonus;
    const ac = calculateArmorClass(character);

    return {
      id: character.id,
      name: character.name,
      initiative,
      hp: character.hpCurrent,
      maxHp: character.hpMax,
      ac,
      isNpc: false
    };
  }

  public static startEncounter(encounterName: string, combatants: Combatant[]): Combatant[] {
    const sorted = [...combatants].sort((a, b) => b.initiative - a.initiative);
    eventBus.emit('CombatStarted', {
      encounterName,
      participantsCount: sorted.length
    });
    return sorted;
  }
}
