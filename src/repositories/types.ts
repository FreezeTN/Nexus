import { CharacterData, CharacterId, UserId } from '../types';

export interface IRepositoryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ICharacterRepository {
  getCharacter(characterId: CharacterId): Promise<IRepositoryResult<CharacterData>>;
  listCharacters(userId?: UserId): Promise<IRepositoryResult<CharacterData[]>>;
  saveCharacter(character: CharacterData, userId?: UserId): Promise<IRepositoryResult<CharacterData>>;
  deleteCharacter(characterId: CharacterId, userId?: UserId): Promise<IRepositoryResult<boolean>>;
}

export interface ICampaignRepository<TCampaignEntity = any> {
  getCampaignEntities(): Promise<IRepositoryResult<TCampaignEntity[]>>;
  saveCampaignEntities(entities: TCampaignEntity[]): Promise<IRepositoryResult<boolean>>;
}
