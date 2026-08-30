import { CharacterData, CharacterId } from '../types';
import { ICharacterRepository, IRepositoryResult } from './types';

const LOCAL_STORAGE_KEY = 'penpaper_characters_data';
const inMemoryFallback = new Map<string, string>();

export class LocalCharacterRepository implements ICharacterRepository {
  private loadAllFromStorage(): CharacterData[] {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        }
      } else {
        const raw = inMemoryFallback.get(LOCAL_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        }
      }
    } catch (err) {
      console.warn('LocalCharacterRepository: Failed to read localStorage', err);
    }
    return [];
  }

  private saveAllToStorage(characters: CharacterData[]): void {
    try {
      const json = JSON.stringify(characters);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY, json);
      } else {
        inMemoryFallback.set(LOCAL_STORAGE_KEY, json);
      }
    } catch (err) {
      console.warn('LocalCharacterRepository: Failed to write to localStorage', err);
    }
  }

  async getCharacter(characterId: CharacterId): Promise<IRepositoryResult<CharacterData>> {
    const all = this.loadAllFromStorage();
    const found = all.find(c => c.id === characterId);
    if (found) {
      return { success: true, data: found };
    }
    return { success: false, error: 'Character not found' };
  }

  async listCharacters(): Promise<IRepositoryResult<CharacterData[]>> {
    const all = this.loadAllFromStorage();
    return { success: true, data: all };
  }

  async saveCharacter(character: CharacterData): Promise<IRepositoryResult<CharacterData>> {
    const all = this.loadAllFromStorage();
    const index = all.findIndex(c => c.id === character.id);
    if (index >= 0) {
      all[index] = character;
    } else {
      all.push(character);
    }
    this.saveAllToStorage(all);
    return { success: true, data: character };
  }

  async deleteCharacter(characterId: CharacterId): Promise<IRepositoryResult<boolean>> {
    const all = this.loadAllFromStorage();
    const filtered = all.filter(c => c.id !== characterId);
    this.saveAllToStorage(filtered);
    return { success: true, data: true };
  }
}
