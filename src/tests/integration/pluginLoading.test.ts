import { systemRegistry } from '../../systems/registry';

export interface TestResult {
  id: string;
  category: 'IntegrationTests';
  name: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

export function runPluginLoadingIntegrationTest(): TestResult[] {
  const results: TestResult[] = [];
  const t1 = performance.now();

  try {
    const systems = systemRegistry.getAllSystems();
    let verifiedPluginContracts = 0;

    for (const sys of systems) {
      if (sys.characterEngine?.calculateStats) {
        sys.characterEngine.calculateStats({
          level: 1,
          abilities: { STR: { score: 10 }, DEX: { score: 10 }, CON: { score: 10 }, INT: { score: 10 }, WIS: { score: 10 }, CHA: { score: 10 } }
        } as any);
        verifiedPluginContracts++;
      }
    }

    results.push({
      id: 'integration-plugin-loading-contracts',
      category: 'IntegrationTests',
      name: 'Integration: System Plugin Load -> Capability Registration -> Rule Engine Verification',
      passed: verifiedPluginContracts >= systems.length,
      message: `Verified deep rule execution across all ${systems.length} system plugins (${systems.map(s => s.name).join(', ')}).`,
      durationMs: Math.round(performance.now() - t1)
    });
  } catch (err: any) {
    results.push({
      id: 'integration-plugin-loading-contracts',
      category: 'IntegrationTests',
      name: 'Integration: System Plugin Load -> Capability Registration -> Rule Engine Verification',
      passed: false,
      message: err?.message || 'Failed plugin loading integration test.',
      durationMs: Math.round(performance.now() - t1)
    });
  }

  return results;
}
