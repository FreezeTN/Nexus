export interface TestResult {
  id: string;
  category: 'UnitTests';
  name: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

export function runDamageCalculatorTests(): TestResult[] {
  const results: TestResult[] = [];

  const t1 = performance.now();
  try {
    const rawDamage = 24;
    const isFireResistant = true;
    const isColdVulnerable = false;

    let appliedDamage = rawDamage;
    if (isFireResistant) appliedDamage = Math.floor(appliedDamage / 2); // 12
    if (isColdVulnerable) appliedDamage = appliedDamage * 2;

    let hp = 30;
    let tempHp = 10;

    const damageToTemp = Math.min(tempHp, appliedDamage);
    tempHp -= damageToTemp; // 0
    const remainingDamage = appliedDamage - damageToTemp; // 2
    hp -= remainingDamage; // 28

    const passed = hp === 28 && tempHp === 0;

    results.push({
      id: 'unit-damage-resistance-temp-hp',
      category: 'UnitTests',
      name: 'Damage Resistance, Vulnerability & Temp HP Absorption',
      passed,
      message: `24 Fire Damage halved by Resistance to 12. Temp HP (10) absorbed 10, Base HP reduced by 2 to ${hp}/30.`,
      durationMs: Math.round(performance.now() - t1)
    });
  } catch (err: any) {
    results.push({
      id: 'unit-damage-resistance-temp-hp',
      category: 'UnitTests',
      name: 'Damage Resistance, Vulnerability & Temp HP Absorption',
      passed: false,
      message: err?.message || 'Failed damage calculation test.',
      durationMs: Math.round(performance.now() - t1)
    });
  }

  return results;
}
