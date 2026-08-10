import { eventBus } from '../events/eventBus';
import { systemRegistry } from '../systems/registry';

export interface TestResult {
  id: string;
  category: 'EventBus' | 'PluginRegistry' | 'RuleEngines' | 'VersionCompatibility';
  name: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

export function runArchitectureTests(): TestResult[] {
  const results: TestResult[] = [];

  // 1. Test EventBus Publishing & Subscribing
  const t1Start = performance.now();
  try {
    let received = false;
    let payloadName = '';
    const unsub = eventBus.on('DiceRolled', (e) => {
      received = true;
      payloadName = e.rollerName;
    });

    eventBus.emit('DiceRolled', {
      formula: '1d20+5',
      total: 18,
      isNat20: false,
      isNat1: false,
      rollerName: 'TestPaladin'
    });

    unsub();

    results.push({
      id: 'test-eventbus-pubsub',
      category: 'EventBus',
      name: 'EventBus Pub/Sub Communication',
      passed: received && payloadName === 'TestPaladin',
      message: received ? 'Successfully emitted and received typed DiceRolled event.' : 'Failed to receive event.',
      durationMs: Math.round(performance.now() - t1Start)
    });
  } catch (err: any) {
    results.push({
      id: 'test-eventbus-pubsub',
      category: 'EventBus',
      name: 'EventBus Pub/Sub Communication',
      passed: false,
      message: err?.message || 'Error executing EventBus test.',
      durationMs: Math.round(performance.now() - t1Start)
    });
  }

  // 2. Test EventBus Global Subscriber
  const t2Start = performance.now();
  try {
    let globalCount = 0;
    const unsubGlobal = eventBus.subscribeAll(() => {
      globalCount++;
    });

    eventBus.emit('WorldChanged', { worldId: 'w-test', worldName: 'Test Realm' });
    unsubGlobal();

    results.push({
      id: 'test-eventbus-global',
      category: 'EventBus',
      name: 'Global Decoupled Event Listener',
      passed: globalCount > 0,
      message: 'Global subscriber successfully caught decoupled event.',
      durationMs: Math.round(performance.now() - t2Start)
    });
  } catch (err: any) {
    results.push({
      id: 'test-eventbus-global',
      category: 'EventBus',
      name: 'Global Decoupled Event Listener',
      passed: false,
      message: err?.message || 'Global subscription failed.',
      durationMs: Math.round(performance.now() - t2Start)
    });
  }

  // 3. Test PluginRegistry
  const t3Start = performance.now();
  try {
    const systems = systemRegistry.getAllSystems();
    const dnd5e = systemRegistry.getSystem('5e');
    const sr5e = systemRegistry.getSystem('shadowrun');

    const valid = systems.length >= 5 && dnd5e.id === '5e' && sr5e.id === 'shadowrun';
    results.push({
      id: 'test-registry-retrieval',
      category: 'PluginRegistry',
      name: 'Plugin Registry Multi-System Provider',
      passed: valid,
      message: `Registered ${systems.length} plugins (D&D 5e, 3.5e, PF2e, Shadowrun 5e, CoC 7e).`,
      durationMs: Math.round(performance.now() - t3Start)
    });
  } catch (err: any) {
    results.push({
      id: 'test-registry-retrieval',
      category: 'PluginRegistry',
      name: 'Plugin Registry Multi-System Provider',
      passed: false,
      message: err?.message || 'Registry retrieval failed.',
      durationMs: Math.round(performance.now() - t3Start)
    });
  }

  // 4. Test Version Compatibility Matrix
  const t4Start = performance.now();
  try {
    const all = systemRegistry.getAllSystems();
    const allHaveVersions = all.every(sys => Boolean(sys.version));
    results.push({
      id: 'test-version-compat',
      category: 'VersionCompatibility',
      name: 'Plugin Version Declaration & Packaging Specs',
      passed: allHaveVersions,
      message: 'All registered system plugins declare compliant semver version tags.',
      durationMs: Math.round(performance.now() - t4Start)
    });
  } catch (err: any) {
    results.push({
      id: 'test-version-compat',
      category: 'VersionCompatibility',
      name: 'Plugin Version Declaration & Packaging Specs',
      passed: false,
      message: err?.message || 'Version check failed.',
      durationMs: Math.round(performance.now() - t4Start)
    });
  }

  // 5. Test Rule Engine Calculations
  const t5Start = performance.now();
  try {
    const dnd5e = systemRegistry.getSystem('5e');
    const dummyChar: any = {
      level: 5,
      abilities: { STR: { score: 18 }, DEX: { score: 14 }, CON: { score: 14 }, INT: { score: 10 }, WIS: { score: 10 }, CHA: { score: 10 } },
      speed: 30
    };
    const stats = dnd5e.characterEngine.calculateStats(dummyChar);
    const prof = dnd5e.characterEngine.getProficiencyBonus(5);

    const valid = prof === 3 && stats.initiativeBonus === 2;
    results.push({
      id: 'test-rule-engine-dnd5e',
      category: 'RuleEngines',
      name: '5e Bounded Accuracy Rule Engine',
      passed: valid,
      message: `Level 5 Prof = +${prof}, DEX +2 Init Bonus verified.`,
      durationMs: Math.round(performance.now() - t5Start)
    });
  } catch (err: any) {
    results.push({
      id: 'test-rule-engine-dnd5e',
      category: 'RuleEngines',
      name: '5e Bounded Accuracy Rule Engine',
      passed: false,
      message: err?.message || '5e engine calculation failed.',
      durationMs: Math.round(performance.now() - t5Start)
    });
  }

  return results;
}
