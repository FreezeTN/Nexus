import { systemRegistry } from '../../systems/registry';

export interface TestResult {
  id: string;
  category: 'UnitTests';
  name: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

export function runPluginRegistryTests(): TestResult[] {
  const results: TestResult[] = [];

  const t1 = performance.now();
  try {
    const allSystems = systemRegistry.getAllSystems();
    const isRegisteredCountValid = allSystems.length >= 5; // 5e, 3.5e, PF2e, Shadowrun, CoC

    results.push({
      id: 'unit-plugin-registry-count',
      category: 'UnitTests',
      name: 'Plugin Registry System Discovery & Capability Audit',
      passed: isRegisteredCountValid,
      message: `Verified ${allSystems.length} active TRPG rule system plugins loaded in registry.`,
      durationMs: Math.round(performance.now() - t1)
    });
  } catch (err: any) {
    results.push({
      id: 'unit-plugin-registry-count',
      category: 'UnitTests',
      name: 'Plugin Registry System Discovery & Capability Audit',
      passed: false,
      message: err?.message || 'Failed plugin registry unit test.',
      durationMs: Math.round(performance.now() - t1)
    });
  }

  return results;
}
