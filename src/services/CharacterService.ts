import { CharacterData, CharacterId, GearItem, UserId } from '../types';
import { CharacterRepositoryProvider } from '../repositories/CharacterRepositoryProvider';
import { eventBus } from '../events/eventBus';
import { getCombinedLevel } from '../systems/dnd5e/classes';

export class CharacterService {
  public static async saveCharacter(
    character: CharacterData,
    userId?: UserId,
    isLoggedIn: boolean = false
  ): Promise<CharacterData> {
    const repo = CharacterRepositoryProvider.getRepository(isLoggedIn);
    const result = await repo.saveCharacter(character, userId);
    
    if (result.success && result.data) {
      eventBus.emit('CharacterUpdated', { character: result.data });
      return result.data;
    }
    throw new Error(result.error || 'Failed to save character');
  }

  public static async levelUp(
    character: CharacterData,
    newLevel: number,
    userId?: UserId,
    isLoggedIn: boolean = false
  ): Promise<CharacterData> {
    const oldLevel = getCombinedLevel(character);
    const updated: CharacterData = {
      ...character,
      level: newLevel
    };

    const saved = await this.saveCharacter(updated, userId, isLoggedIn);
    eventBus.emit('CharacterLevelUp', {
      characterId: saved.id,
      characterName: saved.name,
      oldLevel,
      newLevel
    });

    return saved;
  }

  public static async addItemToInventory(
    character: CharacterData,
    item: GearItem,
    userId?: UserId,
    isLoggedIn: boolean = false
  ): Promise<CharacterData> {
    const existingIndex = character.inventory.findIndex(i => i.name.toLowerCase() === item.name.toLowerCase());
    let newInventory = [...character.inventory];

    if (existingIndex >= 0) {
      const existing = newInventory[existingIndex];
      newInventory[existingIndex] = {
        ...existing,
        quantity: (existing.quantity || 1) + (item.quantity || 1)
      };
    } else {
      newInventory.push(item);
    }

    const updated = { ...character, inventory: newInventory };
    const saved = await this.saveCharacter(updated, userId, isLoggedIn);

    eventBus.emit('ItemAdded', {
      characterId: saved.id,
      itemName: item.name,
      quantity: item.quantity || 1
    });

    return saved;
  }

  public static async modifyHp(
    character: CharacterData,
    delta: number,
    userId?: UserId,
    isLoggedIn: boolean = false
  ): Promise<CharacterData> {
    let newHp = character.hpCurrent + delta;
    newHp = Math.max(0, Math.min(character.hpMax, newHp));

    const updated: CharacterData = {
      ...character,
      hpCurrent: newHp
    };

    return await this.saveCharacter(updated, userId, isLoggedIn);
  }
}
