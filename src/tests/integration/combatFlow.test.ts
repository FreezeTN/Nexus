import { systemRegistry } from '../../systems/registry';
import { CharacterService } from '../../services/CharacterService';
import { toCharacterId } from '../../types';

export interface TestResult {
  id: string;
  category: 'IntegrationTests';
  name: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

export async function runCombatFlowIntegrationTest(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const t1 = performance.now();

  try {
    const dnd5e = systemRegistry.getSystem('5e');

    // 1. Create character state
    let char: any = {
      id: toCharacterId('char-combat-flow-1'),
      name: 'Eldrin Starweaver',
      level: 4,
      hpCurrent: 24,
      hpMax: 24,
      abilities: { STR: { score: 10 }, DEX: { score: 14 }, CON: { score: 12 }, INT: { score: 18 }, WIS: { score: 12 }, CHA: { score: 8 } },
      inventory: []
    };

    // 2. Add item to inventory
    char = await CharacterService.addItemToInventory(char, {
      id: 'wand-magic-missile',
      name: 'Wand of Magic Missiles',
      quantity: 1,
      weight: 1,
      equipped: true
    }, undefined, false);

    // 3. Roll initiative
    const initFormula = dnd5e.combatEngine.getInitiativeFormula(char);

    // 4. Calculate stats
    const stats = dnd5e.characterEngine.calculateStats(char);

    const isPassed = Boolean(initFormula) && char.inventory.length === 1 && char.level === 4;

    results.push({
      id: 'integration-combat-flow',
      category: 'IntegrationTests',
      name: 'Integration: Create Character -> Add Inventory -> Roll Initiative -> Calculate Stats',
      passed: isPassed,
      message: `Executed combat creation flow for ${char.name} (Lvl 4 Mage). Initiative formula: "${initFormula}". Item equipped: ${char.inventory[0].name}.`,
      durationMs: Math.round(performance.now() - t1)
    });
  } catch (err: any) {
    results.push({
      id: 'integration-combat-flow',
      category: 'IntegrationTests',
      name: 'Integration: Create Character -> Add Inventory -> Roll Initiative -> Calculate Stats',
      passed: false,
      message: err?.message || 'Failed combat flow integration test.',
      durationMs: Math.round(performance.now() - t1)
    });
  }

  return results;
}
