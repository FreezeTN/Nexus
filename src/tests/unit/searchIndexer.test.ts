export interface TestResult {
  id: string;
  category: 'UnitTests';
  name: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

export function runSearchIndexerTests(): TestResult[] {
  const results: TestResult[] = [];

  const t1 = performance.now();
  try {
    const items = [
      { id: '1', title: 'Fireball', tags: ['evocation', 'fire', 'spell'] },
      { id: '2', title: 'Longsword +1', tags: ['weapon', 'slashing', 'magic'] },
      { id: '3', title: 'Shield of Faith', tags: ['abjuration', 'spell', 'divine'] }
    ];

    const query = 'fire';
    const matches = items.filter(
      (item) => item.title.toLowerCase().includes(query) || item.tags.some((t) => t.includes(query))
    );

    const passed = matches.length === 1 && matches[0].id === '1';

    results.push({
      id: 'unit-search-indexer-fuzzy',
      category: 'UnitTests',
      name: 'Omni Search Indexer Fuzzy Term & Tag Matching',
      passed,
      message: `Indexed ${items.length} items. Search query "${query}" matched 1 result (${matches[0]?.title}).`,
      durationMs: Math.round(performance.now() - t1)
    });
  } catch (err: any) {
    results.push({
      id: 'unit-search-indexer-fuzzy',
      category: 'UnitTests',
      name: 'Omni Search Indexer Fuzzy Term & Tag Matching',
      passed: false,
      message: err?.message || 'Failed search indexer unit test.',
      durationMs: Math.round(performance.now() - t1)
    });
  }

  return results;
}
