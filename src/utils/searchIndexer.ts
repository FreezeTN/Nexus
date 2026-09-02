import { CharacterData, Spell, GearItem, Attack } from '../types';
import { PRESET_5E_SPELLS, PRESET_35E_SPELLS } from '../data/presetSpells';
import { PRESET_DND_ITEMS, PresetItem } from '../data/presetItems';
import { OFFICIAL_BULK_MONSTERS } from '../data/srdRulesLibrary';
import { DND_CONDITIONS } from '../data/conditionsData';
import { loadCustomCompendiumEntries } from '../data/compendiumData';
import { DEFAULT_WORLD_LOCATIONS } from '../services/campaignService';
import { AMBIENT_TRACKS } from './ambientSoundscapes';

export type SearchCategory =
  | 'Monsters'
  | 'Spells'
  | 'Items'
  | 'Quests'
  | 'Locations'
  | 'Factions'
  | 'NPCs'
  | 'Notes'
  | 'Characters'
  | 'Actions'
  | 'Conditions'
  | 'Audio'
  | 'Compendium';

export interface IndexedSearchResult {
  id: string;
  title: string;
  category: SearchCategory;
  subcategory?: string;
  description: string;
  iconType: string;
  relevanceScore: number;
  tags?: string[];
  badge?: string;
  metadata?: Record<string, any>;
  actionData: {
    type: 'navigate_tab' | 'select_character' | 'dice_roll' | 'equip_item' | 'apply_condition' | 'play_audio' | 'open_modal' | 'custom';
    target?: string;
    payload?: any;
    label?: string;
  };
  secondaryAction?: {
    type: 'dice_roll' | 'equip_item' | 'apply_condition' | 'navigate_tab' | 'copy_text';
    label: string;
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
    const seenIds = new Set<string>();

    const addEntry = (entry: IndexedSearchResult) => {
      if (!seenIds.has(entry.id)) {
        seenIds.add(entry.id);
        list.push(entry);
      }
    };

    // 1. All Characters (Party Members & Active)
    characters.forEach((char) => {
      addEntry({
        id: `char-${char.id}`,
        title: char.name,
        category: 'Characters',
        subcategory: `${char.edition?.toUpperCase() || '5E'} • Level ${char.level || 1}`,
        description: `Level ${char.level || 1} ${char.race || ''} ${char.characterClass || ''} • HP ${char.hpCurrent ?? 10}/${char.hpMax ?? 10} • AC ${char.armorClass ?? 10}`,
        iconType: 'character',
        relevanceScore: 3,
        badge: `HP ${char.hpCurrent ?? 10}/${char.hpMax ?? 10}`,
        tags: [char.characterClass || '', char.race || '', char.edition || '5e', 'party', 'character'],
        metadata: char,
        actionData: { type: 'select_character', target: char.id, payload: char, label: 'Select Character' },
        secondaryAction: { type: 'navigate_tab', label: 'View Core Sheet', payload: { tab: '1' } }
      });

      // 2. Crawl Every Item in Character's Inventory
      if (Array.isArray(char.inventory)) {
        char.inventory.forEach((item: GearItem) => {
          const isWeapon = item.itemType === 'Weapon' || !!item.weaponStats;
          const isArmor = item.itemType === 'Armor' || !!item.armorAc;
          const statusTag = item.equipped ? 'Equipped' : (item.stored ? 'Stored in Bag' : 'Carried');
          const dmgDesc = item.weaponStats ? ` • ${item.weaponStats.damage} (${item.weaponStats.damageType || 'Damage'})` : '';
          const acDesc = item.armorAc ? ` • AC ${item.armorAc}` : '';

          addEntry({
            id: `char-inv-${char.id}-${item.id}`,
            title: item.name,
            category: 'Items',
            subcategory: `${char.name} (${statusTag})`,
            description: `${item.itemType || 'Gear'} • ${item.weight || 0} lbs${dmgDesc}${acDesc} • Owned by ${char.name}`,
            iconType: isWeapon ? 'sword' : isArmor ? 'shield' : 'item',
            relevanceScore: 2.5,
            badge: item.equipped ? 'Equipped' : undefined,
            tags: [char.name, item.itemType || 'item', item.equipped ? 'equipped' : 'inventory', 'gear'],
            metadata: { item, characterId: char.id, characterName: char.name },
            actionData: {
              type: 'navigate_tab',
              target: '3',
              payload: { characterId: char.id, itemId: item.id },
              label: 'Inspect in Inventory'
            },
            secondaryAction: isWeapon && item.weaponStats ? {
              type: 'dice_roll',
              label: `Roll Damage (${item.weaponStats.damage})`,
              payload: { formula: item.weaponStats.damage, name: `${item.name} Damage`, characterName: char.name }
            } : {
              type: 'equip_item',
              label: item.equipped ? 'Unequip' : 'Equip Item',
              payload: { characterId: char.id, itemId: item.id }
            }
          });
        });
      }

      // 3. Crawl Every Spell in Character's Spellbook
      if (Array.isArray(char.spells)) {
        char.spells.forEach((spell: Spell) => {
          const lvlLabel = spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`;
          addEntry({
            id: `char-spell-${char.id}-${spell.id || spell.name}`,
            title: spell.name,
            category: 'Spells',
            subcategory: `${char.name} • ${lvlLabel}`,
            description: `${lvlLabel} ${spell.school || 'Magic'} • ${spell.castingTime || '1 action'} • Range: ${spell.range || 'Self'} • In ${char.name}'s Spellbook`,
            iconType: 'spell',
            relevanceScore: 2.5,
            badge: spell.prepared ? 'Prepared' : lvlLabel,
            tags: [char.name, spell.school || 'spell', lvlLabel, 'spellbook'],
            metadata: { spell, characterId: char.id, characterName: char.name },
            actionData: {
              type: 'navigate_tab',
              target: '4',
              payload: { characterId: char.id, spellId: spell.id || spell.name },
              label: 'View Spellbook'
            },
            secondaryAction: {
              type: 'dice_roll',
              label: `Cast / Roll ${spell.name}`,
              payload: { formula: spell.level === 0 ? '1d20' : `${spell.level + 1}d6`, name: `Cast ${spell.name}`, characterName: char.name }
            }
          });
        });
      }

      // 4. Crawl Character Attacks / Actions
      if (Array.isArray(char.attacks)) {
        char.attacks.forEach((atk: Attack, idx: number) => {
          addEntry({
            id: `char-atk-${char.id}-${idx}`,
            title: `${char.name}: ${atk.name}`,
            category: 'Actions',
            subcategory: `Attack (${atk.attackBonus >= 0 ? `+${atk.attackBonus}` : atk.attackBonus})`,
            description: `${atk.damage || '1d8'} ${atk.damageType || 'Physical'} • Range: ${atk.range || 'Melee'} • ${char.name}`,
            iconType: 'sword',
            relevanceScore: 2.2,
            badge: `${atk.attackBonus >= 0 ? `+${atk.attackBonus}` : atk.attackBonus}`,
            tags: [char.name, 'attack', 'combat', 'action'],
            metadata: { attack: atk, characterId: char.id, characterName: char.name },
            actionData: {
              type: 'dice_roll',
              target: 'combat',
              payload: { formula: `1d20+${atk.attackBonus || 0}`, name: `${char.name}: ${atk.name} To Hit`, characterName: char.name },
              label: `Roll Attack (+${atk.attackBonus || 0})`
            },
            secondaryAction: {
              type: 'dice_roll',
              label: `Roll Damage (${atk.damage || '1d8'})`,
              payload: { formula: atk.damage || '1d8', name: `${char.name}: ${atk.name} Damage`, characterName: char.name }
            }
          });
        });
      }
    });

    // 5. SRD Spells (5e & 3.5e)
    [...PRESET_5E_SPELLS, ...PRESET_35E_SPELLS].forEach((spell) => {
      const lvl = spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`;
      addEntry({
        id: `srd-spell-${spell.name}`,
        title: spell.name,
        category: 'Spells',
        subcategory: `${lvl} ${spell.school || 'Magic'}`,
        description: `${lvl} ${spell.school} • ${spell.castingTime} • Range: ${spell.range} • ${spell.shortDescription || spell.description?.slice(0, 100) || ''}`,
        iconType: 'spell',
        relevanceScore: 1.5,
        badge: lvl,
        tags: [spell.school || '', lvl, 'srd', 'spell'],
        metadata: spell,
        actionData: { type: 'navigate_tab', target: '4', payload: { spell }, label: 'Open Spellbook' },
        secondaryAction: {
          type: 'dice_roll',
          label: `Roll Cast DC / Check`,
          payload: { formula: '1d20+5', name: `Cast ${spell.name}` }
        }
      });
    });

    // 6. SRD Items & Equipment
    PRESET_DND_ITEMS.forEach((item) => {
      addEntry({
        id: `srd-item-${item.name}`,
        title: item.name,
        category: 'Items',
        subcategory: item.category || 'Equipment',
        description: `${item.category || 'Gear'} • ${item.weight || 0} lbs • ${item.costGp ? `${item.costGp} gp` : '1 gp'} • ${item.notes || ''}`,
        iconType: item.category === 'Weapon' ? 'sword' : item.category === 'Armor' ? 'shield' : 'item',
        relevanceScore: 1.2,
        badge: item.costGp ? `${item.costGp} gp` : undefined,
        tags: [item.category || 'item', 'srd', 'equipment'],
        metadata: item,
        actionData: { type: 'navigate_tab', target: '3', payload: { item }, label: 'Open Inventory' }
      });
    });

    // 7. SRD Bulk Monsters & Bestiary
    OFFICIAL_BULK_MONSTERS.forEach((monster) => {
      const cr = monster.challengeRating || monster.subclass?.replace(/^CR\s*/i, '') || '1/2';
      addEntry({
        id: `srd-monster-${monster.name}`,
        title: monster.name,
        category: 'Monsters',
        subcategory: `CR ${cr} • ${monster.race || 'Beast'}`,
        description: `CR ${cr} • AC ${monster.armorClass} • HP ${monster.hpMax} • ${monster.alignment || 'Neutral'} • Speed ${monster.speed || 30}ft`,
        iconType: 'monster',
        relevanceScore: 1.8,
        badge: `CR ${cr}`,
        tags: [monster.race || 'monster', `CR ${cr}`, monster.alignment || '', 'bestiary', 'monster'],
        metadata: monster,
        actionData: { type: 'navigate_tab', target: 'dm', payload: { monster }, label: 'View in DM Hub' },
        secondaryAction: {
          type: 'dice_roll',
          label: `Roll Initiative (1d20)`,
          payload: { formula: '1d20+2', name: `${monster.name} Initiative` }
        }
      });
    });

    // 8. D&D Conditions
    DND_CONDITIONS.forEach((cond) => {
      addEntry({
        id: `cond-${cond.id}`,
        title: cond.name,
        category: 'Conditions',
        subcategory: 'Combat Condition',
        description: cond.summary,
        iconType: 'condition',
        relevanceScore: 1.6,
        badge: 'Condition',
        tags: ['condition', 'combat', 'status', cond.name.toLowerCase()],
        metadata: cond,
        actionData: { type: 'apply_condition', target: 'combat', payload: { condition: cond }, label: 'Apply Condition' },
        secondaryAction: { type: 'navigate_tab', label: 'View in Combat Tab', payload: { tab: '2' } }
      });
    });

    // 9. Custom User Compendium Entries
    try {
      const customCompendium = loadCustomCompendiumEntries();
      customCompendium.forEach((item) => {
        let cat: SearchCategory = 'Compendium';
        if (item.category === 'monsters') cat = 'Monsters';
        else if (item.category === 'spells') cat = 'Spells';
        else if (item.category === 'items') cat = 'Items';

        addEntry({
          id: `custom-comp-${item.id}`,
          title: item.name,
          category: cat,
          subcategory: `Custom ${item.category.toUpperCase()} • ${item.edition || '5e'}`,
          description: item.description || `Custom homebrew ${item.category} entry`,
          iconType: item.category === 'monsters' ? 'monster' : item.category === 'spells' ? 'spell' : 'item',
          relevanceScore: 2.8,
          badge: 'Homebrew',
          tags: ['custom', 'homebrew', item.category, item.edition || '5e'],
          metadata: item,
          actionData: { type: 'navigate_tab', target: 'compendium', payload: { compendiumItem: item }, label: 'Open in Compendium' }
        });
      });
    } catch (e) {
      console.warn('Failed to index custom compendium items:', e);
    }

    // 10. Campaign Lore, World Locations & Quests
    DEFAULT_WORLD_LOCATIONS.forEach((loc) => {
      addEntry({
        id: `loc-${loc.id}`,
        title: loc.name,
        category: 'Locations',
        subcategory: `${loc.type.toUpperCase()} • ${loc.dangerLevel || 'Safe'}`,
        description: `${loc.climate || 'Temperate'} • Controled by: ${loc.controllingFactionName || 'Local Authorities'} • ${loc.description}`,
        iconType: 'location',
        relevanceScore: 2.0,
        badge: loc.dangerLevel,
        tags: [...(loc.tags || []), loc.type, 'location', 'lore'],
        metadata: loc,
        actionData: { type: 'navigate_tab', target: 'notes', payload: { location: loc }, label: 'Open in Lore Vault' }
      });
    });

    const campaignEntities = [...SAMPLE_CAMPAIGN_ENTITIES, ...customEntities];
    campaignEntities.forEach((e) => {
      let cat: SearchCategory = 'Notes';
      if (e.type === 'location') cat = 'Locations';
      else if (e.type === 'quest') cat = 'Quests';
      else if (e.type === 'faction') cat = 'Factions';
      else if (e.type === 'npc') cat = 'NPCs';
      else if (e.type === 'monster') cat = 'Monsters';
      else if (e.type === 'item') cat = 'Items';

      addEntry({
        id: `campaign-${e.id}`,
        title: e.name,
        category: cat,
        subcategory: e.region || e.status || e.type.toUpperCase(),
        description: e.summary,
        iconType: e.type,
        relevanceScore: 2.2,
        badge: e.status,
        tags: [e.type, e.region || '', e.status || '', 'campaign', 'lore'],
        metadata: e,
        actionData: { type: 'navigate_tab', target: 'notes', payload: e, label: 'View Campaign Entity' }
      });
    });

    // 11. Procedural Ambient Soundscapes
    AMBIENT_TRACKS.forEach((track) => {
      addEntry({
        id: `audio-${track.id}`,
        title: `${track.name} (Soundscape)`,
        category: 'Audio',
        subcategory: `Ambient Audio • ${track.category.toUpperCase()}`,
        description: `${track.subtitle} — ${track.description}`,
        iconType: 'audio',
        relevanceScore: 1.8,
        badge: 'Ambient Synth',
        tags: [track.category, 'audio', 'soundscape', 'ambience', 'music'],
        metadata: track,
        actionData: { type: 'play_audio', target: track.id, payload: track, label: 'Play Soundscape' }
      });
    });

    // 12. Quick Navigation & Studio Commands
    const studioCommands: IndexedSearchResult[] = [
      {
        id: 'cmd-sheet-1',
        title: 'Go to Sheet 1: Core Stats & Attributes',
        category: 'Actions',
        subcategory: 'Navigation',
        description: 'View ability scores, modifiers, saving throws, skills, and hit point controls.',
        iconType: 'command',
        relevanceScore: 2.0,
        badge: 'Sheet 1',
        tags: ['core', 'sheet', 'stats', 'attributes', 'hp', 'navigation'],
        actionData: { type: 'navigate_tab', target: '1', label: 'Open Sheet 1' }
      },
      {
        id: 'cmd-sheet-2',
        title: 'Go to Sheet 2: Combat & Attacks',
        category: 'Actions',
        subcategory: 'Navigation',
        description: 'Manage active weapons, attack actions, armor class, initiative, and death saves.',
        iconType: 'command',
        relevanceScore: 2.0,
        badge: 'Sheet 2',
        tags: ['combat', 'attacks', 'weapons', 'armor', 'initiative', 'navigation'],
        actionData: { type: 'navigate_tab', target: '2', label: 'Open Sheet 2' }
      },
      {
        id: 'cmd-sheet-3',
        title: 'Go to Sheet 3: Equipment & Inventory',
        category: 'Actions',
        subcategory: 'Navigation',
        description: 'Track carried gear, encumbrance weight, attuned magic items, and currency.',
        iconType: 'command',
        relevanceScore: 2.0,
        badge: 'Sheet 3',
        tags: ['inventory', 'gear', 'items', 'gold', 'weight', 'encumbrance', 'navigation'],
        actionData: { type: 'navigate_tab', target: '3', label: 'Open Sheet 3' }
      },
      {
        id: 'cmd-sheet-4',
        title: 'Go to Sheet 4: Spells & Spellbook',
        category: 'Actions',
        subcategory: 'Navigation',
        description: 'Manage known spells, cantrips, spell slot meters, casting modifiers, and spell DCs.',
        iconType: 'command',
        relevanceScore: 2.0,
        badge: 'Sheet 4',
        tags: ['spells', 'spellbook', 'magic', 'slots', 'cantrips', 'navigation'],
        actionData: { type: 'navigate_tab', target: '4', label: 'Open Sheet 4' }
      },
      {
        id: 'cmd-sheet-5',
        title: 'Go to Sheet 5: Features & Backstory',
        category: 'Actions',
        subcategory: 'Navigation',
        description: 'Review class features, racial traits, feats, personality, bonds, and flaws.',
        iconType: 'command',
        relevanceScore: 2.0,
        badge: 'Sheet 5',
        tags: ['bio', 'backstory', 'traits', 'feats', 'features', 'navigation'],
        actionData: { type: 'navigate_tab', target: '5', label: 'Open Sheet 5' }
      },
      {
        id: 'cmd-sheet-dm',
        title: 'Go to DM Hub & Encounter Bestiary',
        category: 'Actions',
        subcategory: 'Navigation',
        description: 'Manage encounter combatants, turn order tracker, monster statblocks, and quick rolls.',
        iconType: 'command',
        relevanceScore: 2.0,
        badge: 'DM Hub',
        tags: ['dm', 'encounter', 'combat', 'monsters', 'turn order', 'initiative', 'navigation'],
        actionData: { type: 'navigate_tab', target: 'dm', label: 'Open DM Hub' }
      },
      {
        id: 'cmd-ai-forge',
        title: 'Launch Nexus AI Oracle & Entity Forge',
        category: 'Actions',
        subcategory: 'AI Assistant',
        description: 'Ask TRPG rules questions, generate NPCs, monsters, spells, and magic items directly.',
        iconType: 'command',
        relevanceScore: 3.0,
        badge: 'AI Forge',
        tags: ['ai', 'oracle', 'generator', 'forge', 'chat', 'gemini'],
        actionData: { type: 'open_modal', target: 'ai_assistant', label: 'Launch AI Forge' }
      },
      {
        id: 'cmd-developer-sdk',
        title: 'Open Developer SDK & Plugin Scaffolding Studio',
        category: 'Actions',
        subcategory: 'Developer Tools',
        description: 'Create custom TRPG rule system plugins, live sandbox test engines, and inspect performance.',
        iconType: 'command',
        relevanceScore: 2.5,
        badge: 'SDK Studio',
        tags: ['sdk', 'plugins', 'scaffolding', 'developer', 'code', 'builder'],
        actionData: { type: 'open_modal', target: 'developer_sdk', label: 'Open Developer SDK' }
      },
      {
        id: 'cmd-dice-roll-d20',
        title: 'Roll Standard d20 Dice Check (1d20)',
        category: 'Actions',
        subcategory: 'Dice Roller',
        description: 'Execute a quick single 20-sided die roll with instant visual result and audio chime.',
        iconType: 'dice',
        relevanceScore: 2.5,
        badge: '1d20',
        tags: ['roll', 'dice', 'd20', 'check'],
        actionData: { type: 'dice_roll', payload: { formula: '1d20', name: 'Standard d20 Check' }, label: 'Roll 1d20' }
      }
    ];

    studioCommands.forEach(addEntry);

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

    const words = cleanQuery.split(/\s+/).filter(Boolean);
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
      const tagsString = (item.tags || []).join(' ').toLowerCase();

      let score = 0;

      // Exact title match gets highest score
      if (titleLower === cleanQuery) {
        score += 150;
      } else if (titleLower.startsWith(cleanQuery)) {
        score += 70;
      } else if (titleLower.includes(cleanQuery)) {
        score += 35;
      }

      // Word-by-word matches
      let matchedWords = 0;
      words.forEach((w) => {
        let wordScore = 0;
        if (titleLower.includes(w)) {
          wordScore += 20;
          matchedWords++;
        }
        if (tagsString.includes(w)) {
          wordScore += 15;
          matchedWords++;
        }
        if (subLower.includes(w)) {
          wordScore += 10;
        }
        if (catLower.includes(w)) {
          wordScore += 6;
        }
        if (descLower.includes(w)) {
          wordScore += 4;
        }
        score += wordScore;
      });

      // Bonus if all search terms are present
      if (words.length > 1 && matchedWords >= words.length) {
        score += 30;
      }

      if (score > 0) {
        matches.push({ item, score: score * item.relevanceScore });
      }
    }

    matches.sort((a, b) => b.score - a.score);
    const results = matches.map((m) => m.item);

    // Limit cache size to 150 entries to optimize memory footprint
    if (this.cache.size > 150) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(cacheKey, results);
    return results;
  }

  public getIndexSize(): number {
    return this.primaryIndex.length;
  }
}

export const searchIndexer = new UnifiedSearchIndexer();

