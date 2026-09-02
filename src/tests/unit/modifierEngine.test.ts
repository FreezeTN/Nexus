import { UniversalModifierEngine } from '../../domain/modifierEngine';
import { CharacterData } from '../../types';

export interface TestResult {
  id: string;
  category: 'UnitTests';
  name: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

const createBaseCharacter = (overrides?: Partial<CharacterData>): CharacterData => ({
  id: 'test-char-1',
  name: 'Valeros',
  edition: '5e',
  characterClass: 'Fighter',
  subclass: 'Champion',
  race: 'Human',
  background: 'Soldier',
  alignment: 'Neutral Good',
  level: 5,
  hpMax: 44,
  hpCurrent: 44,
  speed: 30,
  armorClass: 10,
  abilities: {
    STR: { score: 16 },
    DEX: { score: 14 },
    CON: { score: 14 },
    INT: { score: 10 },
    WIS: { score: 12 },
    CHA: { score: 8 },
  },
  inventory: [],
  conditions: [],
  savingThrowProficiencies: ['STR', 'CON'],
  ...(overrides as any)
} as CharacterData);

export function runModifierEngineTests(): TestResult[] {
  const results: TestResult[] = [];

  // Test 1: Unarmored base + DEX
  const t1 = performance.now();
  try {
    const char = createBaseCharacter(); // DEX 14 (+2)
    const result = UniversalModifierEngine.evaluate('ac', char);
    const passed = result.baseValue === 12 && result.finalValue === 12;
    results.push({
      id: 'unit-modifier-base-ac',
      category: 'UnitTests',
      name: 'Modifier Engine Base AC (10 + DEX)',
      passed,
      message: `Evaluated Base AC = 10 + DEX(+2) -> ${result.finalValue}`,
      durationMs: Math.round(performance.now() - t1)
    });
  } catch (err: any) {
    results.push({
      id: 'unit-modifier-base-ac',
      category: 'UnitTests',
      name: 'Modifier Engine Base AC (10 + DEX)',
      passed: false,
      message: err?.message || 'Error',
      durationMs: Math.round(performance.now() - t1)
    });
  }

  // Test 2: Additive Stacking (Shield + Shield of Faith)
  const t2 = performance.now();
  try {
    const char = createBaseCharacter({
      inventory: [
        {
          id: 'shield-1',
          name: 'Shield',
          itemType: 'Armor',
          armorType: 'Shield',
          armorAc: 2,
          equipped: true,
          quantity: 1,
          weight: 6
        }
      ],
      conditions: ['Shield of Faith']
    });
    const result = UniversalModifierEngine.evaluate('ac', char);
    const passed = result.finalValue === 16;
    results.push({
      id: 'unit-modifier-additive-stacking',
      category: 'UnitTests',
      name: 'Modifier Engine Additive Stacking (Shield + Shield of Faith)',
      passed,
      message: `Stacking 12 (Base) + 2 (Shield) + 2 (Shield of Faith) -> AC ${result.finalValue}`,
      durationMs: Math.round(performance.now() - t2)
    });
  } catch (err: any) {
    results.push({
      id: 'unit-modifier-additive-stacking',
      category: 'UnitTests',
      name: 'Modifier Engine Additive Stacking (Shield + Shield of Faith)',
      passed: false,
      message: err?.message || 'Error',
      durationMs: Math.round(performance.now() - t2)
    });
  }

  // Test 3: Highest-Only Rule & Audit Suppression (Half Cover vs Three-Quarters Cover)
  const t3 = performance.now();
  try {
    const char = createBaseCharacter({
      conditions: ['Half Cover', 'Three-Quarters Cover']
    });
    const result = UniversalModifierEngine.evaluate('ac', char);
    const suppressed = result.suppressedModifiers.find(s => s.modifier.label.includes('Half Cover'));
    const passed = result.finalValue === 17 && !!suppressed;
    results.push({
      id: 'unit-modifier-highest-only-suppression',
      category: 'UnitTests',
      name: 'Modifier Engine Highest-Only Conflict Resolution & Audit Trail',
      passed,
      message: `Three-Quarters (+5) applied, Half Cover (+2) suppressed: ${suppressed?.reason || ''}`,
      durationMs: Math.round(performance.now() - t3)
    });
  } catch (err: any) {
    results.push({
      id: 'unit-modifier-highest-only-suppression',
      category: 'UnitTests',
      name: 'Modifier Engine Highest-Only Conflict Resolution & Audit Trail',
      passed: false,
      message: err?.message || 'Error',
      durationMs: Math.round(performance.now() - t3)
    });
  }

  // Test 4: Floor enforcement (Barkskin minimum 16)
  const t4 = performance.now();
  try {
    const char = createBaseCharacter({
      abilities: {
        STR: { score: 16 },
        DEX: { score: 10 },
        CON: { score: 14 },
        INT: { score: 10 },
        WIS: { score: 12 },
        CHA: { score: 8 },
      },
      conditions: ['Barkskin']
    });
    const result = UniversalModifierEngine.evaluate('ac', char);
    const passed = result.baseValue === 10 && result.finalValue === 16;
    results.push({
      id: 'unit-modifier-floor-barkskin',
      category: 'UnitTests',
      name: 'Modifier Engine Floor Constraint (Barkskin Min AC 16)',
      passed,
      message: `Enforced floor: Base 10 raised to ${result.finalValue}`,
      durationMs: Math.round(performance.now() - t4)
    });
  } catch (err: any) {
    results.push({
      id: 'unit-modifier-floor-barkskin',
      category: 'UnitTests',
      name: 'Modifier Engine Floor Constraint (Barkskin Min AC 16)',
      passed: false,
      message: err?.message || 'Error',
      durationMs: Math.round(performance.now() - t4)
    });
  }

  // Test 5: Dynamic Dice Terms (Bless +1d4 & Bane -1d4)
  const t5 = performance.now();
  try {
    const char = createBaseCharacter({
      conditions: ['Bless', 'Bane']
    });
    const result = UniversalModifierEngine.evaluate('attack.all', char);
    const hasBlessDice = result.diceBonuses.some(d => d.dice === '1d4' && d.sign === 1);
    const hasBaneDice = result.diceBonuses.some(d => d.dice === '1d4' && d.sign === -1);
    const passed = hasBlessDice && hasBaneDice;
    results.push({
      id: 'unit-modifier-dice-terms',
      category: 'UnitTests',
      name: 'Modifier Engine Dynamic Dice Terms (+1d4 Bless / -1d4 Bane)',
      passed,
      message: `Dynamic terms resolved: +1d4 (Bless), -1d4 (Bane)`,
      durationMs: Math.round(performance.now() - t5)
    });
  } catch (err: any) {
    results.push({
      id: 'unit-modifier-dice-terms',
      category: 'UnitTests',
      name: 'Modifier Engine Dynamic Dice Terms (+1d4 Bless / -1d4 Bane)',
      passed: false,
      message: err?.message || 'Error',
      durationMs: Math.round(performance.now() - t5)
    });
  }

  // Test 6: Advantage / Disadvantage Conflict Resolution
  const t6 = performance.now();
  try {
    const char = createBaseCharacter({
      conditions: ['Haste', 'Restrained']
    });
    const result = UniversalModifierEngine.evaluate('saving_throw.DEX', char);
    const passed = result.advantage && result.disadvantage && result.rollMode === 'normal';
    results.push({
      id: 'unit-modifier-adv-disadv-resolution',
      category: 'UnitTests',
      name: 'Modifier Engine Advantage/Disadvantage Conflict Resolution',
      passed,
      message: `Haste Advantage + Restrained Disadvantage -> Roll Mode: ${result.rollMode}`,
      durationMs: Math.round(performance.now() - t6)
    });
  } catch (err: any) {
    results.push({
      id: 'unit-modifier-adv-disadv-resolution',
      category: 'UnitTests',
      name: 'Modifier Engine Advantage/Disadvantage Conflict Resolution',
      passed: false,
      message: err?.message || 'Error',
      durationMs: Math.round(performance.now() - t6)
    });
  }

  return results;
}
