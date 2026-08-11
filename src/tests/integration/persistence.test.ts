import { CharacterRepositoryProvider } from '../../repositories/CharacterRepositoryProvider';
import { toCharacterId } from '../../types';

export interface TestResult {
  id: string;
  category: 'IntegrationTests';
  name: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

export async function runPersistenceIntegrationTest(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const t1 = performance.now();

  try {
    const repo = CharacterRepositoryProvider.getRepository(false);
    const testChar: any = {
      id: toCharacterId('char-persist-test-1'),
      name: 'Thrum Ironhand',
      level: 5,
      hpCurrent: 45,
      hpMax: 45,
      inventory: [{ id: 'i1', name: 'Warhammer', quantity: 1, weight: 5, equipped: true }]
    };

    await repo.saveCharacter(testChar);
    const reloadedResult = await repo.getCharacter(toCharacterId('char-persist-test-1'));
    const reloaded = reloadedResult.data;

    const isSuccess = Boolean(reloaded && reloaded.name === 'Thrum Ironhand' && reloaded.inventory.length === 1);

    results.push({
      id: 'integration-persistence-save-reload',
      category: 'IntegrationTests',
      name: 'Integration: Save Character -> Local Repository Store -> Reload & Re-hydrate',
      passed: isSuccess,
      message: `Persisted character "${testChar.name}" with 1 item. Successfully retrieved back from local storage repository.`,
      durationMs: Math.round(performance.now() - t1)
    });
  } catch (err: any) {
    results.push({
      id: 'integration-persistence-save-reload',
      category: 'IntegrationTests',
      name: 'Integration: Save Character -> Local Repository Store -> Reload & Re-hydrate',
      passed: false,
      message: err?.message || 'Failed persistence integration test.',
      durationMs: Math.round(performance.now() - t1)
    });
  }

  return results;
}
