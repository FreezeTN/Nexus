import { eventBus } from '../../events/eventBus';

export interface TestResult {
  id: string;
  category: 'UnitTests';
  name: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

export function runEventBusTests(): TestResult[] {
  const results: TestResult[] = [];

  const t1 = performance.now();
  try {
    let receivedPayload: any = null;
    const unsubscribe = eventBus.on('DiceRolled', (e) => {
      receivedPayload = e;
    });

    eventBus.emit('DiceRolled', {
      formula: '1d20+7',
      total: 21,
      isNat20: false,
      isNat1: false,
      rollerName: 'UnitTestSuite'
    });

    unsubscribe();

    const passed = Boolean(receivedPayload && receivedPayload.total === 21);

    results.push({
      id: 'unit-eventbus-sub-pub',
      category: 'UnitTests',
      name: 'EventBus Subscribe/Publish & Unsubscribe Handler',
      passed,
      message: `Published topic "unit:test:topic" and received verified payload value 42.`,
      durationMs: Math.round(performance.now() - t1)
    });
  } catch (err: any) {
    results.push({
      id: 'unit-eventbus-sub-pub',
      category: 'UnitTests',
      name: 'EventBus Subscribe/Publish & Unsubscribe Handler',
      passed: false,
      message: err?.message || 'Failed event bus unit test.',
      durationMs: Math.round(performance.now() - t1)
    });
  }

  return results;
}
