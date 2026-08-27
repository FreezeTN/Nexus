import { CharacterData, Spell } from '../types';
import { PRESET_5E_SPELLS } from '../data/presetSpells';
import { PRESET_DND_ITEMS, PresetItem } from '../data/presetItems';
import { OFFICIAL_BULK_MONSTERS } from '../data/srdRulesLibrary';
import { DND_CONDITIONS } from '../data/conditionsData';

export interface IndexedSearchResult {
  id: string;
  title: string;
  category: 'Monsters' | 'Spells' | 'Items' | 'Quests' | 'Locations' | 'Factions' | 'NPCs' | 'Notes' | 'Characters' | 'Actions' | 'Conditions';
  subcategory?: string;
  description: string;
  iconType: string;
  relevanceScore: number;
  metadata?: Record<string, any>;
  actionData: {
    type: 'navigate_tab' | 'select_character' | 'open_modal' | 'custom';
    target?: string;
    payload?: any;
  };
}

export interface CampaignEntity {
  id: string;
  name: string;
  type: 'npc' | 'location' | 'quest' | 'faction' | 'item' | 'session' | 'note' | 'monster' | 'pc' | 'timeline';
  summary: string;
  region?: string;
  status?: string;
  faction?: string;
  tags?: string[];
  connections?: Array<{
    targetId: string;
    targetName: string;
    relationship: string;
    targetType: string;
  }>;
}

export const SAMPLE_CAMPAIGN_ENTITIES: CampaignEntity[] = [
  {
    id: 'entity-1',
    name: 'Ancient Red Dragon',
    type: 'monster',
    summary: 'Colossal wyrm dwelling in Mount Hotenow. Fiery breath and immense hoarded wealth.',
    region: 'Neverwinter Wood',
    status: 'Boss Encounter',
    connections: [
      { targetId: 'entity-2', targetName: 'Dragon Mountain', relationship: 'Lairs At', targetType: 'location' },
      { targetId: 'entity-3', targetName: 'Cult of the Dragon', relationship: 'Worshipped By', targetType: 'faction' },
      { targetId: 'entity-5', targetName: 'Dragon Slayer Longsword', relationship: 'Guards Artifact', targetType: 'item' }
    ]
  },
  {
    id: 'entity-2',
    name: 'Dragon Mountain',
    type: 'location',
    summary: 'Towering volcanic peak shrouded in ash and lightning. Home to ancient draconic ruins.',
    region: 'Sword Mountains',
    status: 'Dangerous Dungeons',
    connections: [
      { targetId: 'entity-1', targetName: 'Ancient Red Dragon', relationship: 'Lair Of', targetType: 'monster' },
      { targetId: 'entity-4', targetName: 'Dragon Hunt Quest', relationship: 'Site Of Quest', targetType: 'quest' }
    ]
  },
  {
    id: 'entity-3',
    name: 'Cult of the Dragon',
    type: 'faction',
    summary: 'Fanatical organization striving to elevate chromatic dragons and undead dracoloches.',
    region: 'Faerûn Wide',
    status: 'Hostile Faction',
    connections: [
      { targetId: 'entity-1', targetName: 'Ancient Red Dragon', relationship: 'Reveres', targetType: 'monster' },
      { targetId: 'entity-6', targetName: 'Session 18: Dragonfire Incident', relationship: 'Appears In', targetType: 'session' }
    ]
  },
  {
    id: 'entity-4',
    name: 'Dragon Hunt Quest',
    type: 'quest',
    summary: 'High-level bounty issued by Neverwinter Council to slay the terror of Mount Hotenow.',
    status: 'In Progress',
    region: 'Sword Coast',
    connections: [
      { targetId: 'entity-2', targetName: 'Dragon Mountain', relationship: 'Location', targetType: 'location' },
      { targetId: 'entity-5', targetName: 'Dragon Slayer Longsword', relationship: 'Reward Item', targetType: 'item' }
    ]
  },
  {
    id: 'entity-5',
    name: 'Dragon Slayer Longsword',
    type: 'item',
    summary: '+1 Longsword dealing bonus 3d6 damage against draconic species.',
    status: 'Rare Magic Weapon',
    connections: [
      { targetId: 'entity-1', targetName: 'Ancient Red Dragon', relationship: 'Bane Of', targetType: 'monster' },
      { targetId: 'entity-4', targetName: 'Dragon Hunt Quest', relationship: 'Quest Loot', targetType: 'quest' }
    ]
  },
  {
    id: 'entity-6',
    name: 'Session 18: Dragonfire Incident',
    type: 'session',
    summary: 'The party encountered cult spies in Phandalin before setting off towards Dragon Mountain.',
    status: 'Completed Session',
    connections: [
      { targetId: 'entity-3', targetName: 'Cult of the Dragon', relationship: 'Climax Encounter', targetType: 'faction' },
      { targetId: 'entity-7', targetName: 'Town of Phandalin', relationship: 'Starting Location', targetType: 'location' }
    ]
  },
  {
    id: 'entity-7',
    name: 'Town of Phandalin',
    type: 'location',
    summary: 'Frontier mining settlement at the foot of the Sword Mountains. Party base camp.',
    region: 'Sword Coast',
    status: 'Safe Haven',
    connections: [
      { targetId: 'entity-8', targetName: 'Stonehill Inn', relationship: 'Contains', targetType: 'location' },
      { targetId: 'entity-9', targetName: 'Gundren Rockseeker', relationship: 'Patron NPC', targetType: 'npc' }
    ]
  },
  {
    id: 'entity-8',
    name: 'Stonehill Inn',
    type: 'location',
    summary: 'Cozy rustic tavern operated by Toblen Stonehill. Gathering point for rumors.',
    region: 'Phandalin Square',
    connections: [
      { targetId: 'entity-7', targetName: 'Town of Phandalin', relationship: 'Located Within', targetType: 'location' }
    ]
  },
  {
    id: 'entity-9',
    name: 'Gundren Rockseeker',
    type: 'npc',
    summary: 'Dwarf merchant who rediscovered the long-lost Wave Echo Cave.',
    status: 'Allied Patron',
    faction: 'Rockseeker Clan',
    connections: [
      { targetId: 'entity-4', targetName: 'Dragon Hunt Quest', relationship: 'Quest Sponsor', targetType: 'quest' },
      { targetId: 'entity-6', targetName: 'Session 18: Dragonfire Incident', relationship: 'Key Informant', targetType: 'session' },
      { targetId: 'entity-5', targetName: 'Dragon Slayer Longsword', relationship: 'Artifact Finder', targetType: 'item' },
      { targetId: 'entity-3', targetName: 'Cult of the Dragon', relationship: 'Hunted By', targetType: 'faction' },
      { targetId: 'entity-10', targetName: 'Sildar Hallwinter', relationship: 'Traveling Companion', targetType: 'pc' },
      { targetId: 'entity-7', targetName: 'Town of Phandalin', relationship: 'Base Headquarters', targetType: 'location' },
      { targetId: 'entity-11', targetName: '1492 DR Lost Mine Expedition', relationship: 'Timeline Epoch', targetType: 'timeline' }
    ]
  },
  {
    id: 'entity-10',
    name: 'Sildar Hallwinter',
    type: 'pc',
    summary: 'Veteran warrior of the Lords Alliance dispatched to maintain order in Phandalin.',
    status: 'Allied Hero',
    connections: [
      { targetId: 'entity-9', targetName: 'Gundren Rockseeker', relationship: 'Sworn Protector', targetType: 'npc' },
      { targetId: 'entity-7', targetName: 'Town of Phandalin', relationship: 'Stationed At', targetType: 'location' }
    ]
  },
  {
    id: 'entity-11',
    name: '1492 DR Lost Mine Expedition',
    type: 'timeline',
    summary: 'Historic campaign era marking the rediscovery of the Forge of Spells and the defense of the Sword Coast.',
    status: 'Campaign Era',
    connections: [
      { targetId: 'entity-9', targetName: 'Gundren Rockseeker', relationship: 'Initiator', targetType: 'npc' },
      { targetId: 'entity-4', targetName: 'Dragon Hunt Quest', relationship: 'Primary Quest Arc', targetType: 'quest' }
    ]
  }
];

class UnifiedSearchIndexer {
  private cache: Map<string, IndexedSearchResult[]> = new Map();
  private isIndexed = false;
  private primaryIndex: IndexedSearchResult[] = [];

  public initializeIndex(characters: CharacterData[] = [], customEntities: CampaignEntity[] = []) {
    const list: IndexedSearchResult[] = [];

    // 1. Monsters
    OFFICIAL_BULK_MONSTERS.forEach((monster) => {
      const cr = monster.challengeRating || monster.subclass?.replace(/^CR\s*/i, '') || '1/2';
      list.push({
        id: `m-${monster.name}`,
        title: monster.name,
        category: 'Monsters',
        subcategory: monster.race || 'Beast',
        description: `CR ${cr} • AC ${monster.armorClass} • HP ${monster.hpMax} • ${monster.alignment || 'Neutral'}`,
        iconType: 'monster',
        relevanceScore: 1,
        metadata: monster,
        actionData: { type: 'navigate_tab', target: 'dm', payload: { monster } }
      });
    });

    // 2. Spells
    PRESET_5E_SPELLS.forEach((spell) => {
      list.push({
        id: `s-${spell.name}`,
        title: spell.name,
        category: 'Spells',
        subcategory: spell.school,
        description: `${spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`} ${spell.school} • ${spell.castingTime} • Range: ${spell.range}`,
        iconType: 'spell',
        relevanceScore: 1,
        metadata: spell,
        actionData: { type: 'navigate_tab', target: 'spells', payload: { spell } }
      });
    });

    // 3. Items
    PRESET_DND_ITEMS.forEach((item) => {
      list.push({
        id: `i-${item.name}`,
        title: item.name,
        category: 'Items',
        subcategory: item.category || 'Equipment',
        description: `${item.category || 'Gear'} • ${item.weight || 0} lbs • ${item.costGp ? `${item.costGp} gp` : '1 gp'}`,
        iconType: 'item',
        relevanceScore: 1,
        metadata: item,
        actionData: { type: 'navigate_tab', target: 'gear', payload: { item } }
      });
    });

    // 4. Conditions
    DND_CONDITIONS.forEach((cond) => {
      list.push({
        id: `c-${cond.id}`,
        title: cond.name,
        category: 'Conditions',
        description: cond.summary,
        iconType: 'condition',
        relevanceScore: 1,
        metadata: cond,
        actionData: { type: 'navigate_tab', target: 'combat' }
      });
    });

    // 5. Characters
    characters.forEach((char) => {
      list.push({
        id: `char-${char.id}`,
        title: char.name,
        category: 'Characters',
        subcategory: char.edition || '5e',
        description: `Level ${char.level || 1} ${char.race || ''} ${char.characterClass || ''} (HP ${char.hpCurrent}/${char.hpMax})`,
        iconType: 'character',
        relevanceScore: 2,
        metadata: char,
        actionData: { type: 'select_character', target: char.id, payload: char }
      });
    });

    // 6. Campaign Entities (Locations, Quests, Factions, NPCs, Sessions, Dragon entities)
    const entities = [...SAMPLE_CAMPAIGN_ENTITIES, ...customEntities];
    entities.forEach((e) => {
      let cat: IndexedSearchResult['category'] = 'Notes';
      if (e.type === 'location') cat = 'Locations';
      else if (e.type === 'quest') cat = 'Quests';
      else if (e.type === 'faction') cat = 'Factions';
      else if (e.type === 'npc') cat = 'NPCs';
      else if (e.type === 'monster') cat = 'Monsters';
      else if (e.type === 'item') cat = 'Items';
      else if (e.type === 'session') cat = 'Notes';

      list.push({
        id: e.id,
        title: e.name,
        category: cat,
        subcategory: e.region || e.status,
        description: e.summary,
        iconType: e.type,
        relevanceScore: 2,
        metadata: e,
        actionData: { type: 'navigate_tab', target: 'notes', payload: e }
      });
    });

    this.primaryIndex = list;
    this.cache.clear();
    this.isIndexed = true;
  }

  public search(query: string, categoryFilter?: string): IndexedSearchResult[] {
    if (!query.trim()) {
      if (categoryFilter && categoryFilter !== 'All') {
        return this.primaryIndex.filter((item) => item.category === categoryFilter);
      }
      return this.primaryIndex;
    }

    const cleanQuery = query.toLowerCase().trim();
    const cacheKey = `${cleanQuery}::${categoryFilter || 'All'}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const words = cleanQuery.split(/\s+/);

    const matches: Array<{ item: IndexedSearchResult; score: number }> = [];

    for (let i = 0; i < this.primaryIndex.length; i++) {
      const item = this.primaryIndex[i];

      if (categoryFilter && categoryFilter !== 'All' && item.category !== categoryFilter) {
        continue;
      }

      const titleLower = item.title.toLowerCase();
      const catLower = item.category.toLowerCase();
      const descLower = item.description.toLowerCase();
      const subLower = (item.subcategory || '').toLowerCase();

      let score = 0;

      // Exact title match gets highest score
      if (titleLower === cleanQuery) {
        score += 100;
      } else if (titleLower.startsWith(cleanQuery)) {
        score += 50;
      } else if (titleLower.includes(cleanQuery)) {
        score += 25;
      }

      // Word matches
      words.forEach((w) => {
        if (titleLower.includes(w)) score += 15;
        if (subLower.includes(w)) score += 10;
        if (catLower.includes(w)) score += 5;
        if (descLower.includes(w)) score += 3;
      });

      if (score > 0) {
        matches.push({ item, score: score * item.relevanceScore });
      }
    }

    matches.sort((a, b) => b.score - a.score);
    const results = matches.map((m) => m.item);

    // Limit cache size to 100 entries to optimize memory
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(cacheKey, results);
    return results;
  }
}

export const searchIndexer = new UnifiedSearchIndexer();
