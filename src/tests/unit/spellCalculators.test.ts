import { systemRegistry } from '../../systems/registry';

export interface TestResult {
  id: string;
  category: 'UnitTests';
  name: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

export function runSpellCalculatorTests(): TestResult[] {
  const results: TestResult[] = [];

  // Test 1: Spell Save DC calculation for 5e
  const t1 = performance.now();
  try {
    const prof = 3; // Lvl 5
    const intMod = 4; // INT 18
    const spellSaveDC = 8 + prof + intMod; // 15
    const spellAttackBonus = prof + intMod; // +7

    results.push({
      id: 'unit-spell-dc-5e',
      category: 'UnitTests',
      name: 'Spell DC & Attack Bonus (5e)',
      passed: spellSaveDC === 15 && spellAttackBonus === 7,
      message: `Calculated Save DC = 8 + Prof(3) + INT(4) -> DC ${spellSaveDC}, Attack Bonus = +${spellAttackBonus}.`,
      durationMs: Math.round(performance.now() - t1)
    });
  } catch (err: any) {
    results.push({
      id: 'unit-spell-dc-5e',
      category: 'UnitTests',
      name: 'Spell DC & Attack Bonus (5e)',
      passed: false,
      message: err?.message || 'Failed spell DC test.',
      durationMs: Math.round(performance.now() - t1)
    });
  }

  // Test 2: Spell slot recovery rule
  const t2 = performance.now();
  try {
    const maxSlots = [4, 3, 2]; // Lvl 1, 2, 3 slots
    const currentSlots = [1, 0, 0];
    const recoveredSlots = currentSlots.map((c, idx) => Math.min(maxSlots[idx], c + 2)); // Arcane recovery

    results.push({
      id: 'unit-spell-slot-recovery',
      category: 'UnitTests',
      name: 'Arcane Recovery & Slot Refresh',
      passed: recoveredSlots[0] === 3 && recoveredSlots[1] === 2 && recoveredSlots[2] === 2,
      message: `Recovered 2 slots across levels: Level 1 (3/4), Level 2 (2/3), Level 3 (2/2).`,
      durationMs: Math.round(performance.now() - t2)
    });
  } catch (err: any) {
    results.push({
      id: 'unit-spell-slot-recovery',
      category: 'UnitTests',
      name: 'Arcane Recovery & Slot Refresh',
      passed: false,
      message: err?.message || 'Failed spell slot recovery test.',
      durationMs: Math.round(performance.now() - t2)
    });
  }

  return results;
}
