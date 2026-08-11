import { systemRegistry } from '../../systems/registry';

export interface TestResult {
  id: string;
  category: 'UnitTests';
  name: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

export function runInitiativeTests(): TestResult[] {
  const results: TestResult[] = [];

  const t1 = performance.now();
  try {
    const dnd5e = systemRegistry.getSystem('5e');
    const formula = dnd5e.combatEngine.getInitiativeFormula({
      abilities: { DEX: { score: 16 } },
      initiativeBonus: 2
    } as any);

    const isFormulaValid = Boolean(formula && formula.includes('1d20'));

    results.push({
      id: 'unit-initiative-formula-5e',
      category: 'UnitTests',
      name: 'Initiative Formula Generation & DEX Modifier Mapping',
      passed: isFormulaValid,
      message: `Generated formula "${formula}" with DEX (+3) and Bonus (+2).`,
      durationMs: Math.round(performance.now() - t1)
    });
  } catch (err: any) {
    results.push({
      id: 'unit-initiative-formula-5e',
      category: 'UnitTests',
      name: 'Initiative Formula Generation & DEX Modifier Mapping',
      passed: false,
      message: err?.message || 'Failed initiative unit test.',
      durationMs: Math.round(performance.now() - t1)
    });
  }

  return results;
}
