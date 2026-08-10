import { describe, it, expect } from 'vitest';
import { runArchitectureTests } from './systemTestSuite';

describe('Architecture & Plugin System Verification', () => {
  it('runs all automated platform tests and expects 100% pass rate', async () => {
    const results = await runArchitectureTests();
    expect(results.length).toBeGreaterThan(0);
    const failed = results.filter(r => !r.passed);
    expect(failed.length).toBe(0);
  });
});
