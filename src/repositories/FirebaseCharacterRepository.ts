import { CharacterData, CharacterId, UserId } from '../types';
import { ICharacterRepository, IRepositoryResult } from './types';
import { saveCharacterToCloud, loadUserCharactersFromCloud, deleteCharacterFromCloud } from '../lib/firebase';

export class FirebaseCharacterRepository implements ICharacterRepository {
  async getCharacter(characterId: CharacterId): Promise<IRepositoryResult<CharacterData>> {
    try {
      const listRes = await this.listCharacters();
      if (listRes.success && listRes.data) {
        const found = listRes.data.find(c => c.id === characterId);
        if (found) return { success: true, data: found };
      }
      return { success: false, error: 'Character not found in Firebase' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Firebase error' };
    }
  }

  async listCharacters(userId?: UserId): Promise<IRepositoryResult<CharacterData[]>> {
    try {
      if (!userId) return { success: true, data: [] };
      const characters = await loadUserCharactersFromCloud(userId);
      return { success: true, data: characters };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to list Firebase characters' };
    }
  }

  async saveCharacter(character: CharacterData, userId?: UserId): Promise<IRepositoryResult<CharacterData>> {
    try {
      if (!userId) return { success: false, error: 'User ID required for Firebase save' };
      await saveCharacterToCloud(userId, character);
      return { success: true, data: character };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to save character to Firebase' };
    }
  }

  async deleteCharacter(characterId: CharacterId, userId?: UserId): Promise<IRepositoryResult<boolean>> {
    try {
      if (!userId) return { success: false, error: 'User ID required for Firebase delete' };
      await deleteCharacterFromCloud(characterId);
      return { success: true, data: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete character from Firebase' };
    }
  }
}
