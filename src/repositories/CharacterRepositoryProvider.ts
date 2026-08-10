import { ICharacterRepository } from './types';
import { FirebaseCharacterRepository } from './FirebaseCharacterRepository';
import { LocalCharacterRepository } from './LocalCharacterRepository';

export class CharacterRepositoryProvider {
  private static firebaseRepo = new FirebaseCharacterRepository();
  private static localRepo = new LocalCharacterRepository();

  public static getRepository(isLoggedIn: boolean = false): ICharacterRepository {
    if (isLoggedIn) {
      return this.firebaseRepo;
    }
    return this.localRepo;
  }
}
