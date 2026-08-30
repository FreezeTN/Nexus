import { GoogleGenAI } from '@google/genai';
import {
  WorldLocation,
  CampaignQuest,
  Faction,
  TravelCalculationParams,
  TravelCalculationResult,
  MapPresetSkin
} from '../types/campaign';
import { CampaignEntity } from '../utils/searchIndexer';

// Storage Keys
const STORAGE_LOCATIONS_KEY = 'nexus_campaign_world_locations_v1';
const STORAGE_QUESTS_KEY = 'nexus_campaign_quests_v1';
const STORAGE_FACTIONS_KEY = 'nexus_campaign_factions_v1';

// Default World Locations
export const DEFAULT_WORLD_LOCATIONS: WorldLocation[] = [
  {
    id: 'loc-waterdeep',
    name: 'Waterdeep, Crown of the North',
    type: 'city',
    x: 32,
    y: 28,
    mapSkin: 'sword_coast',
    dangerLevel: 'Safe',
    climate: 'Temperate Coastal',
    controllingFactionName: "Lord's Alliance",
    description: 'The sprawling City of Splendors, a bustling metropolis with labyrinthine wards, noble villas, and the gaping maw of Undermountain beneath.',
    secretDmNotes: 'Masked Lords are currently investigating a subterranean cult smuggling dragon gold into the Dock Ward.',
    linkedNpcNames: ['Laeral Silverhand', 'Mirt the Moneylender', 'Durnan'],
    shopsAndServices: ['The Yawning Portal Tavern', 'Blackstaff Tower Arcanum', 'Virgin Square Marketplace'],
    isDiscovered: true,
    tags: ['Metropolis', 'Port', 'Arcane Hub', 'Trade Capital']
  },
  {
    id: 'loc-yawning-portal',
    name: 'The Yawning Portal Tavern',
    type: 'tavern',
    x: 34,
    y: 30,
    mapSkin: 'sword_coast',
    dangerLevel: 'Safe',
    climate: 'Urban Interior',
    controllingFactionName: 'The Harpers',
    description: 'Famous taproom featuring a 40-foot wide dry well descending straight down into the deadly dungeon of Undermountain.',
    secretDmNotes: 'Durnan keeps a +3 Greatsword under the counter and a secret passage into Harper safehouses.',
    linkedNpcNames: ['Durnan', 'Volothamp Geddarm', 'Yagra Stonefist'],
    shopsAndServices: ['Dungeon Entry Crane (1 gp)', 'Hearty Dwarven Stout', 'Adventurer Rumor Board'],
    isDiscovered: true,
    tags: ['Tavern', 'Hub', 'Dungeon Entrance']
  },
  {
    id: 'loc-undermountain-dungeon',
    name: 'Undermountain: The Dungeon Level',
    type: 'dungeon',
    x: 35,
    y: 35,
    mapSkin: 'underdark',
    dangerLevel: 'Tier 2 (CR 5-10)',
    climate: 'Subterranean Stone Halls',
    controllingFactionName: 'Halaster Blackcloak',
    description: 'A multi-level subterranean megadungeon created by the Mad Mage Halaster, filled with magical traps, lost relics, and vicious aberrant beasts.',
    secretDmNotes: 'The magic mirrors on Level 1 connect to teleportation nodes in the Shadowfell.',
    linkedNpcNames: ['Halaster Blackcloak', 'Shunn Shurreth'],
    shopsAndServices: ['Goblin Black Market (Floor 2)'],
    isDiscovered: true,
    tags: ['Megadungeon', 'Traps', 'Boss Arena', 'Relics']
  },
  {
    id: 'loc-candlekeep',
    name: 'Candlekeep Library Fortress',
    type: 'castle',
    x: 28,
    y: 65,
    mapSkin: 'sword_coast',
    dangerLevel: 'Safe',
    climate: 'Windswept Sea Cliffs',
    controllingFactionName: 'Avowed Scholars',
    description: 'A towering coastal citadel of ancient lore containing the greatest collection of magical tomes, prophecies, and historical chronicles in the realm.',
    secretDmNotes: 'Beneath the catacombs rests an imprisoned Netherese elder brain sealed in enchanted silver.',
    linkedNpcNames: ['First Reader Bookwyrm', 'Miirym the Sentinel Dragon'],
    shopsAndServices: ['Scroll Transcribing Scriptorium', 'Rare Spell Research'],
    isDiscovered: true,
    tags: ['Library', 'Fortress', 'Arcane Sanctuary']
  },
  {
    id: 'loc-innsmouth-bay',
    name: 'Shadow Over Innsmouth Reef',
    type: 'port',
    x: 75,
    y: 70,
    mapSkin: 'arkham',
    dangerLevel: 'Tier 3 (CR 11-16)',
    climate: 'Foggy Damp Coastal Marsh',
    controllingFactionName: 'Esoteric Order of Dagon',
    description: 'A decaying seaside fishing port shrouded in unnatural sea fog, where hybrid townsfolk chant under dark moonless skies.',
    secretDmNotes: 'Deep Ones emerge at midnight during low tide through Devil Reef caves.',
    linkedNpcNames: ['Zadok Allen', 'Captain Obed Marsh'],
    shopsAndServices: ['Decrepit Fish Market', 'Smuggler Warehouses'],
    isDiscovered: false,
    tags: ['Eldritch', 'Cult', 'Harbor', 'Investigation']
  },
  {
    id: 'loc-neo-seattle-sprawl',
    name: 'Sector 7 Neon Underbelly',
    type: 'city',
    x: 60,
    y: 20,
    mapSkin: 'cyberpunk',
    dangerLevel: 'Tier 2 (CR 5-10)',
    climate: 'Acid Rain & Neon Smog',
    controllingFactionName: 'Renraku MegaCorp',
    description: 'Towering chrome arcologies cast perpetual shadows over rain-slicked alleys filled with chrome-cybered street samurai, deckers, and fixers.',
    secretDmNotes: 'A rogue AI named Deus is currently siphoning grid power through abandoned subway tracks.',
    linkedNpcNames: ['Fixer Jax', 'Chrome Doc Vance', 'NullPointer'],
    shopsAndServices: ['Black Market Cyber Clinic', 'Deck & Drone Armory', 'Noodle Bar'],
    isDiscovered: true,
    tags: ['Cyberpunk', 'High-Tech', 'Shadowrun', 'Black Market']
  }
];

// Default Factions
export const DEFAULT_FACTIONS: Faction[] = [
  {
    id: 'fac-harpers',
    name: 'The Harpers',
    category: 'syndicate',
    standing: 35, // Honored
    headquartersLocationName: 'Waterdeep / Secret Safehouses',
    leaderName: 'High Harper Remallia Haventree',
    motto: 'Freedom, equality, and the quiet preservation of historical truth.',
    description: 'A secretive order of bards, rangers, and mages dedicated to gathering intelligence and preventing tyrants from gaining unchecked magical hegemony.',
    alignment: 'Chaotic Good',
    perks: [
      { tier: 1, name: 'Safehouse Refuge', description: 'Free lodging, disguise kits, and healing herbalism in any major city.', standingRequired: 15, unlocked: true },
      { tier: 2, name: 'Harper Information Network', description: 'Advantage on Investigation and History checks regarding local conspiracies.', standingRequired: 30, unlocked: true },
      { tier: 3, name: 'Silver Raven Message Relay', description: 'Summon an illusory silver raven to dispatch instant magical messages to Harper agents.', standingRequired: 60, unlocked: false },
      { tier: 4, name: 'Archmage Patronage', description: 'Access to high-level spell scrolls and Harper teleportation circles.', standingRequired: 85, unlocked: false }
    ],
    rivalFactionIds: ['fac-zhentarim'],
    rivalFactionNames: ['The Zhentarim (Black Network)'],
    secretAgenda: 'Uncovering the subterranean smuggling rings funding necromantic insurgencies.',
    notes: 'Party provided critical intel on a rogue Zhentarim spy in the Yawning Portal.'
  },
  {
    id: 'fac-zhentarim',
    name: 'The Zhentarim (Black Network)',
    category: 'underworld',
    standing: -25, // Hostile
    headquartersLocationName: 'Darkhold Citadel / Dock Ward Warehouses',
    leaderName: 'Pereghost / Davil Starsong',
    motto: 'Wealth is power, and power commands destiny.',
    description: 'A shadowy mercantile syndicate and mercenary army that seeks monopolistic control of trade routes, mercenaries, and high-value contraband.',
    alignment: 'Lawful Evil / Neutral',
    perks: [
      { tier: 1, name: 'Fence & Smuggler Access', description: 'Sell stolen and exotic contraband with no questions asked at 85% value.', standingRequired: 15, unlocked: false },
      { tier: 2, name: 'Mercenary Reinforcements', description: 'Hire veteran thug bodyguards at 50% discount.', standingRequired: 30, unlocked: false },
      { tier: 3, name: 'Poisoners Guild Cache', description: 'Acquire rare lethal and paralytic toxins not found in normal shops.', standingRequired: 60, unlocked: false },
      { tier: 4, name: 'Darkhold Black Bank', description: 'Borrow up to 25,000 gp with low collateral and ironclad protection.', standingRequired: 85, unlocked: false }
    ],
    rivalFactionIds: ['fac-harpers', 'fac-lords-alliance'],
    rivalFactionNames: ['The Harpers', "The Lord's Alliance"],
    secretAgenda: 'Seizing control of the subterranean dragon vaults beneath Waterdeep.',
    notes: 'Party disrupted their caravan shipment of illegal smoke powder.'
  },
  {
    id: 'fac-lords-alliance',
    name: "The Lord's Alliance",
    category: 'political',
    standing: 20, // Friendly
    headquartersLocationName: 'Waterdeep Palace of Justice',
    leaderName: 'Open Lord Laeral Silverhand',
    motto: 'Order, mutual defense, and prosperity across the free realms.',
    description: 'A coalition of allied northern cities and rulers banded together to maintain peace, trade security, and judicial stability against monstrous incursions.',
    alignment: 'Lawful Neutral',
    perks: [
      { tier: 1, name: 'City Guard Immunity', description: 'Minor civic infractions and public duels are excused by watch captains.', standingRequired: 15, unlocked: true },
      { tier: 2, name: 'Official Bounty Hunter Writ', description: 'Collect official 25% bonus gold on all registered monster and bandit bounties.', standingRequired: 30, unlocked: false },
      { tier: 3, name: 'Military Armory Discount', description: 'Purchase masterwork and plate armor at 30% reduction from royal blacksmiths.', standingRequired: 60, unlocked: false },
      { tier: 4, name: 'Baronial Knighthood', description: 'Granted landed nobility, a fortified manor tower, and command of 20 sworn guards.', standingRequired: 85, unlocked: false }
    ],
    rivalFactionIds: ['fac-zhentarim'],
    rivalFactionNames: ['The Zhentarim (Black Network)'],
    secretAgenda: 'Stabilizing trade tariffs and neutralizing insurgent warlords in the frontier.'
  }
];

// Default Quests
export const DEFAULT_QUESTS: CampaignQuest[] = [
  {
    id: 'quest-vault-dragons',
    title: 'The Lost Vault of Five Hundred Thousand Dragons',
    category: 'main',
    status: 'active',
    summary: 'A secret cache of half a million embezzled gold coins is sealed in an extradimensional vault. The party must locate the Stone of Golorr to reveal the keys and vault entrance before rival syndicates claim it.',
    giverName: 'Volothamp Geddarm',
    giverLocationName: 'The Yawning Portal Tavern',
    giverFactionId: 'fac-harpers',
    recommendedLevel: 'Level 3 - 5',
    stages: [
      { id: 'st-1', text: 'Investigate the fireball explosion in Trollskull Alley', completed: true },
      { id: 'st-2', text: 'Track the nimblewright construct to the Temple of Gond', completed: true },
      { id: 'st-3', text: 'Recover the Stone of Golorr from the Gralhund Villa heist', completed: false },
      { id: 'st-4', text: 'Attune to the Stone and learn the 3 magical vault keys', completed: false, optional: true },
      { id: 'st-5', text: 'Infiltrate the Vault beneath the city and defeat the golden dragon guardian Aurinax', completed: false }
    ],
    rewards: {
      xp: 4500,
      gold: 10000,
      items: ['Cloak of Elvenkind', 'Ring of Feather Falling', 'Tome of Ancient Netherese Lore'],
      reputation: [
        { factionId: 'fac-harpers', factionName: 'The Harpers', amount: 25 },
        { factionId: 'fac-lords-alliance', factionName: "The Lord's Alliance", amount: 20 },
        { factionId: 'fac-zhentarim', factionName: 'The Zhentarim', amount: -20 }
      ],
      notes: 'Party will gain the deed to Trollskull Manor as a permanent base of operations.'
    },
    secretDmNotes: 'The Stone of Golorr is secretly an aboleth in petrified form communicating telepathically.',
    connectedCharacterNames: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'quest-undermountain-missing-apprentice',
    title: "Rescue the Mad Mage's Prodigy",
    category: 'side',
    status: 'active',
    summary: 'An archmage of Blackstaff Tower went missing on the second floor of Undermountain while studying an ancient dwarven runestone.',
    giverName: 'Durnan',
    giverLocationName: 'The Yawning Portal Tavern',
    recommendedLevel: 'Level 4',
    stages: [
      { id: 'st-u1', text: 'Pay the entry fee and descend down the Yawning Portal dry well', completed: true },
      { id: 'st-u2', text: 'Bypass the Goblin Market on Floor 2 without alerting the bugbear guards', completed: false },
      { id: 'st-u3', text: 'Recover the runic spellbook from the abandoned rust monster den', completed: false },
      { id: 'st-u4', text: 'Escort apprentice Ellyn safely back to the surface', completed: false }
    ],
    rewards: {
      xp: 1800,
      gold: 750,
      items: ['Wand of Magic Missiles (7 charges)', 'Potion of Greater Healing (x2)']
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'quest-bounty-manticore',
    title: 'Bounty: The Ironfang Manticore of High Forest',
    category: 'bounty',
    status: 'active',
    summary: 'A fierce manticore with metallic spiked quills has been preying on merchant caravans along the Trade Way.',
    giverName: "Lord's Alliance Bailiff",
    giverLocationName: 'Waterdeep Palace of Justice',
    giverFactionId: 'fac-lords-alliance',
    recommendedLevel: 'Level 3',
    stages: [
      { id: 'st-b1', text: 'Scout the rocky ridge near the River Dessarin for track signs', completed: true },
      { id: 'st-b2', text: 'Slay the Ironfang Manticore and claim its tail quill trophies', completed: false },
      { id: 'st-b3', text: 'Deliver the bounty trophy to the city watch for reward payout', completed: false }
    ],
    rewards: {
      xp: 1100,
      gold: 500,
      items: ['Manticore Spiked Quill Arrows (x6, +1d6 piercing)']
    },
    createdAt: new Date().toISOString()
  }
];

// Helper to load / save locations
export function loadCampaignLocations(): WorldLocation[] {
  try {
    const raw = localStorage.getItem(STORAGE_LOCATIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load world locations from localStorage', e);
  }
  return DEFAULT_WORLD_LOCATIONS;
}

export function saveCampaignLocations(locations: WorldLocation[]): void {
  try {
    localStorage.setItem(STORAGE_LOCATIONS_KEY, JSON.stringify(locations));
    syncLocationsToCampaignGraph(locations);
  } catch (e) {
    console.warn('Failed to save world locations to localStorage', e);
  }
}

// Helper to load / save quests
export function loadCampaignQuests(): CampaignQuest[] {
  try {
    const raw = localStorage.getItem(STORAGE_QUESTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load campaign quests from localStorage', e);
  }
  return DEFAULT_QUESTS;
}

export function saveCampaignQuests(quests: CampaignQuest[]): void {
  try {
    localStorage.setItem(STORAGE_QUESTS_KEY, JSON.stringify(quests));
    syncQuestsToCampaignGraph(quests);
  } catch (e) {
    console.warn('Failed to save campaign quests to localStorage', e);
  }
}

// Helper to load / save factions
export function loadCampaignFactions(): Faction[] {
  try {
    const raw = localStorage.getItem(STORAGE_FACTIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load campaign factions from localStorage', e);
  }
  return DEFAULT_FACTIONS;
}

export function saveCampaignFactions(factions: Faction[]): void {
  try {
    localStorage.setItem(STORAGE_FACTIONS_KEY, JSON.stringify(factions));
    syncFactionsToCampaignGraph(factions);
  } catch (e) {
    console.warn('Failed to save campaign factions to localStorage', e);
  }
}

// Bi-directional Synchronization with Campaign Knowledge Graph
function syncLocationsToCampaignGraph(locations: WorldLocation[]): void {
  try {
    const saved = localStorage.getItem('penpaper_campaign_graph_nodes');
    let graphNodes: CampaignEntity[] = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(graphNodes)) graphNodes = [];

    // Update or add location entities
    locations.forEach(loc => {
      const existingIdx = graphNodes.findIndex(n => n.id === loc.id || (n.type === 'location' && n.name.toLowerCase() === loc.name.toLowerCase()));
      const connections = (loc.linkedNpcNames || []).map((npc, i) => ({
        targetId: `npc-link-${i}`,
        targetName: npc,
        relationship: 'Inhabitant',
        targetType: 'npc'
      }));
      const entity: CampaignEntity = {
        id: loc.id,
        name: loc.name,
        type: 'location',
        summary: `${loc.description} [${loc.dangerLevel || 'Normal'}]`,
        region: loc.climate || 'Temperate',
        status: loc.dangerLevel,
        faction: loc.controllingFactionName,
        tags: loc.tags,
        connections
      };
      if (existingIdx >= 0) {
        graphNodes[existingIdx] = { ...graphNodes[existingIdx], ...entity };
      } else {
        graphNodes.push(entity);
      }
    });

    localStorage.setItem('penpaper_campaign_graph_nodes', JSON.stringify(graphNodes));
  } catch (e) {
    console.warn('Sync locations to graph error', e);
  }
}

function syncQuestsToCampaignGraph(quests: CampaignQuest[]): void {
  try {
    const saved = localStorage.getItem('penpaper_campaign_graph_nodes');
    let graphNodes: CampaignEntity[] = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(graphNodes)) graphNodes = [];

    quests.forEach(quest => {
      const existingIdx = graphNodes.findIndex(n => n.id === quest.id || (n.type === 'quest' && n.name.toLowerCase() === quest.title.toLowerCase()));
      const connections = [
        quest.giverName ? { targetId: 'giver', targetName: quest.giverName, relationship: 'Quest Giver', targetType: 'npc' } : null,
        quest.giverLocationName ? { targetId: 'giver-loc', targetName: quest.giverLocationName, relationship: 'Origin Location', targetType: 'location' } : null,
        ...(quest.rewards.items || []).map((item, idx) => ({
          targetId: `reward-${idx}`,
          targetName: item,
          relationship: 'Reward',
          targetType: 'item'
        }))
      ].filter(Boolean) as CampaignEntity['connections'];

      const entity: CampaignEntity = {
        id: quest.id,
        name: quest.title,
        type: 'quest',
        summary: quest.summary,
        status: quest.status,
        tags: [quest.category, `Lvl ${quest.recommendedLevel}`],
        connections
      };
      if (existingIdx >= 0) {
        graphNodes[existingIdx] = { ...graphNodes[existingIdx], ...entity };
      } else {
        graphNodes.push(entity);
      }
    });

    localStorage.setItem('penpaper_campaign_graph_nodes', JSON.stringify(graphNodes));
  } catch (e) {
    console.warn('Sync quests to graph error', e);
  }
}

function syncFactionsToCampaignGraph(factions: Faction[]): void {
  try {
    const saved = localStorage.getItem('penpaper_campaign_graph_nodes');
    let graphNodes: CampaignEntity[] = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(graphNodes)) graphNodes = [];

    factions.forEach(fac => {
      const existingIdx = graphNodes.findIndex(n => n.id === fac.id || (n.type === 'faction' && n.name.toLowerCase() === fac.name.toLowerCase()));
      const connections = [
        fac.headquartersLocationName ? { targetId: 'hq', targetName: fac.headquartersLocationName, relationship: 'Headquarters', targetType: 'location' } : null,
        fac.leaderName ? { targetId: 'leader', targetName: fac.leaderName, relationship: 'Leader', targetType: 'npc' } : null,
        ...(fac.rivalFactionNames || []).map((rival, idx) => ({
          targetId: `rival-${idx}`,
          targetName: rival,
          relationship: 'Rivalry',
          targetType: 'faction'
        }))
      ].filter(Boolean) as CampaignEntity['connections'];

      const entity: CampaignEntity = {
        id: fac.id,
        name: fac.name,
        type: 'faction',
        summary: `${fac.description} (Standing: ${fac.standing > 0 ? '+' : ''}${fac.standing})`,
        faction: fac.name,
        status: fac.standing > 20 ? 'Friendly' : fac.standing < -20 ? 'Hostile' : 'Neutral',
        tags: fac.motto ? [fac.motto] : undefined,
        connections
      };
      if (existingIdx >= 0) {
        graphNodes[existingIdx] = { ...graphNodes[existingIdx], ...entity };
      } else {
        graphNodes.push(entity);
      }
    });

    localStorage.setItem('penpaper_campaign_graph_nodes', JSON.stringify(graphNodes));
  } catch (e) {
    console.warn('Sync factions to graph error', e);
  }
}

// TRPG Overland Travel Calculator based on DMG / Rules
export function calculateOverlandTravel(params: TravelCalculationParams): TravelCalculationResult {
  const { distanceMiles, mode, pace, difficultTerrain, weatherHazard } = params;

  let baseMilesPerDay = 24; // Standard walking pace: 8 hours @ 3 mph = 24 miles

  switch (mode) {
    case 'foot':
      baseMilesPerDay = 24;
      break;
    case 'draft_horse':
      baseMilesPerDay = 24; // Draft horse with cart
      break;
    case 'warhorse':
      baseMilesPerDay = 30; // Fast gallop / riding horse
      break;
    case 'carriage':
      baseMilesPerDay = 20;
      break;
    case 'sailing_ship':
      baseMilesPerDay = 48; // Continuous sailing day and night
      break;
    case 'airship':
      baseMilesPerDay = 80;
      break;
    case 'teleport':
      return {
        hoursTotal: 0.1,
        daysTotal: 0.01,
        milesPerDay: 99999,
        rationsPerPerson: 0,
        waterGallonsPerPerson: 0,
        passivePerceptionModifier: 0,
        stealthAllowed: false,
        exhaustionRisk: false,
        encounterCheckRolls: 0,
        description: 'Instant instantaneous magical transit via teleportation circle or portal.'
      };
  }

  // Apply pace modifiers
  let paceMultiplier = 1.0;
  let passivePerceptionMod = 0;
  let stealthAllowed = false;

  if (pace === 'fast') {
    paceMultiplier = 1.33; // ~30-32 miles / day
    passivePerceptionMod = -5; // Penalty to passive perception
    stealthAllowed = false;
  } else if (pace === 'slow') {
    paceMultiplier = 0.75; // ~18 miles / day
    passivePerceptionMod = 0;
    stealthAllowed = true; // Able to move stealthily
  }

  // Terrain & Weather modifiers
  let terrainMultiplier = 1.0;
  if (difficultTerrain) {
    terrainMultiplier *= 0.5; // Half speed in swamps/mountains
  }
  if (weatherHazard) {
    terrainMultiplier *= 0.75; // Torrential storm or blizzard penalty
  }

  const effectiveMilesPerDay = Math.max(2, Math.round(baseMilesPerDay * paceMultiplier * terrainMultiplier));
  const daysTotal = Math.max(0.1, +(distanceMiles / effectiveMilesPerDay).toFixed(1));
  const hoursTotal = Math.round(daysTotal * 8);

  const rationsPerPerson = Math.ceil(daysTotal);
  const waterGallonsPerPerson = Math.ceil(daysTotal * (weatherHazard ? 2 : 1));
  const exhaustionRisk = pace === 'fast' && daysTotal >= 3;
  const encounterCheckRolls = Math.max(1, Math.round(daysTotal * (weatherHazard ? 3 : 2)));

  let desc = `Journey of ${distanceMiles} miles traveling ${pace} pace by ${mode.replace('_', ' ')}. Estimated duration: ${daysTotal} day(s) (${hoursTotal} travel hours).`;
  if (difficultTerrain) desc += ' Travel slowed by rugged/mountainous terrain.';
  if (exhaustionRisk) desc += ' Daily DC 10 Constitution saving throws recommended to prevent exhaustion.';

  return {
    hoursTotal,
    daysTotal,
    milesPerDay: effectiveMilesPerDay,
    rationsPerPerson,
    waterGallonsPerPerson,
    passivePerceptionModifier: passivePerceptionMod,
    stealthAllowed,
    exhaustionRisk,
    encounterCheckRolls,
    description: desc
  };
}

// AI Generation for Worldbuilding Quests & Rumors using Gemini API with intelligent fallback
export async function generateAiCampaignQuest(params: {
  theme: string;
  category: string;
  partyLevel: string;
  locationName?: string;
  factionName?: string;
}): Promise<CampaignQuest> {
  const apiKey = process.env.GEMINI_API_KEY || (typeof window !== 'undefined' ? (window as any).GEMINI_API_KEY : '');

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Generate a compelling, rich tabletop RPG quest formatted strictly as JSON.
Theme / System: ${params.theme}
Category: ${params.category}
Recommended Party Level: ${params.partyLevel}
Location: ${params.locationName || 'A prominent regional city or dungeon'}
Faction Involved: ${params.factionName || 'Local adventurers guild or mysterious patron'}

Return ONLY valid JSON matching this schema:
{
  "title": "Quest Title",
  "category": "main" | "side" | "personal" | "faction" | "bounty" | "rumor",
  "summary": "2-3 sentences explaining the hook, stakes, and narrative mystery",
  "giverName": "NPC Name and Title",
  "giverLocationName": "Starting tavern, castle, or district",
  "recommendedLevel": "e.g. Level 4-6",
  "stages": [
    { "text": "Objective step 1", "optional": false },
    { "text": "Objective step 2", "optional": false },
    { "text": "Objective step 3", "optional": false },
    { "text": "Optional branching bonus objective", "optional": true }
  ],
  "rewards": {
    "xp": 2500,
    "gold": 800,
    "items": ["Item Name 1", "Item Name 2"],
    "notes": "Narrative consequence or faction perk"
  },
  "secretDmNotes": "Secret plot twist or hidden enemy vulnerability for the DM only"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt
      });

      const rawText = response.text || '';
      const cleanedJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedJson);

      return {
        id: `quest-${Date.now()}`,
        title: parsed.title || 'The Unsolved Enigma',
        category: (parsed.category as any) || 'side',
        status: 'active',
        summary: parsed.summary || 'A mysterious occurrence requires brave adventurers.',
        giverName: parsed.giverName || 'Mysterious Patron',
        giverLocationName: parsed.giverLocationName || params.locationName || 'Local Tavern',
        recommendedLevel: parsed.recommendedLevel || params.partyLevel,
        stages: (parsed.stages || []).map((s: any, idx: number) => ({
          id: `st-gen-${Date.now()}-${idx}`,
          text: s.text || `Objective ${idx + 1}`,
          completed: false,
          optional: !!s.optional
        })),
        rewards: {
          xp: parsed.rewards?.xp || 1500,
          gold: parsed.rewards?.gold || 500,
          items: parsed.rewards?.items || ['Health Potion of Quality'],
          notes: parsed.rewards?.notes
        },
        secretDmNotes: parsed.secretDmNotes,
        createdAt: new Date().toISOString()
      };
    } catch (e) {
      console.warn('Gemini quest generation fallback to procedural generator', e);
    }
  }

  // Offline procedural fallback
  const hooks = [
    {
      title: 'The Shadow of the Blood Moon Obelisk',
      summary: 'An ancient obsidian monolith in the Whispering Woods has begun pulsing with crimson light, driving local wildlife into a frenzied feral rage.',
      giver: 'Elder Rowan the Hermit',
      loc: params.locationName || 'Whispering Woods Grove',
      stages: [
        'Consult with the circle of druids regarding the monolith astronomical alignment',
        'Infiltrate the beast-infested cavern beneath the roots of the Weeping Willow',
        'Extract the Corrupted Star Core without succumbing to necrotic radiation',
        '(Optional) Cleanse the ancient leyline to restore natural wildlife harmony'
      ],
      xp: 2200,
      gold: 650,
      items: ['Staff of the Moonlit Grove', 'Potion of Invisibility'],
      secret: 'The obelisk is an anchor for an extradimensional astral dreadnought attempting to pierce the material plane.'
    },
    {
      title: 'Heist of the Gilded Chimera Relic',
      summary: 'A corrupt merchant lord has acquired a stolen celestial artifact and locked it inside an enchanted vault protected by clockwork automatons.',
      giver: 'Shadowbroker Vesper',
      loc: params.locationName || 'Upper Promenade District',
      stages: [
        'Steal the blue security keycard from the head of manor security at the masquerade',
        'Disable the arcane alarm runes in the wine cellar without raising the alarm',
        'Pick the three-dial celestial lock of the vault safe',
        '(Optional) Frame a rival mercenary company by leaving their calling sign'
      ],
      xp: 3000,
      gold: 1200,
      items: ['Ring of Mind Shielding', 'Chime of Opening'],
      secret: 'The merchant lord is actually an undercover dragon polymorphed into human guise.'
    }
  ];

  const pick = hooks[Math.floor(Math.random() * hooks.length)];
  return {
    id: `quest-${Date.now()}`,
    title: pick.title,
    category: (params.category as any) || 'side',
    status: 'active',
    summary: pick.summary,
    giverName: pick.giver,
    giverLocationName: pick.loc,
    recommendedLevel: params.partyLevel,
    stages: pick.stages.map((st, idx) => ({
      id: `st-off-${Date.now()}-${idx}`,
      text: st,
      completed: false,
      optional: st.startsWith('(Optional)')
    })),
    rewards: {
      xp: pick.xp,
      gold: pick.gold,
      items: pick.items
    },
    secretDmNotes: pick.secret,
    createdAt: new Date().toISOString()
  };
}

// AI Generation for World Locations
export async function generateAiLocation(params: {
  theme: string;
  type: string;
  dangerLevel: string;
}): Promise<WorldLocation> {
  const apiKey = process.env.GEMINI_API_KEY || (typeof window !== 'undefined' ? (window as any).GEMINI_API_KEY : '');

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Generate a rich, atmospheric TRPG World Map location formatted strictly as JSON.
Setting/Theme: ${params.theme}
Location Type: ${params.type}
Danger Level: ${params.dangerLevel}

Return ONLY valid JSON matching this schema:
{
  "name": "Evocative Location Name",
  "type": "city" | "castle" | "dungeon" | "tavern" | "wilderness" | "shrine" | "ruins" | "anomaly" | "port",
  "climate": "e.g. Volcanic Basalt Crags, Subterranean Bioluminescent, Mist-shrouded Swamp",
  "controllingFactionName": "Faction Name",
  "description": "3-4 sentences of vivid sensory lore and environment details",
  "secretDmNotes": "A hidden mystery, dungeon secret, or danger for DM only",
  "linkedNpcNames": ["NPC 1", "NPC 2"],
  "shopsAndServices": ["Service 1", "Service 2"],
  "tags": ["Tag1", "Tag2", "Tag3"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt
      });

      const rawText = response.text || '';
      const cleanedJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedJson);

      return {
        id: `loc-gen-${Date.now()}`,
        name: parsed.name || 'Forgotten Landmark',
        type: (parsed.type as any) || 'ruins',
        x: Math.floor(20 + Math.random() * 60),
        y: Math.floor(20 + Math.random() * 60),
        dangerLevel: (params.dangerLevel as any) || 'Tier 2 (CR 5-10)',
        climate: parsed.climate || 'Temperate Wilds',
        controllingFactionName: parsed.controllingFactionName,
        description: parsed.description || 'A mysterious location waiting to be charted.',
        secretDmNotes: parsed.secretDmNotes,
        linkedNpcNames: parsed.linkedNpcNames || [],
        shopsAndServices: parsed.shopsAndServices || [],
        isDiscovered: true,
        tags: parsed.tags || ['Exploration', 'Mystery']
      };
    } catch (e) {
      console.warn('Gemini location generation fallback', e);
    }
  }

  // Fallback
  return {
    id: `loc-gen-${Date.now()}`,
    name: 'The Sunken Spire of Val-Kareth',
    type: 'ruins',
    x: Math.floor(25 + Math.random() * 50),
    y: Math.floor(25 + Math.random() * 50),
    dangerLevel: 'Tier 3 (CR 11-16)',
    climate: 'Flooded Subterranean Caverns',
    controllingFactionName: 'Drowned Cult of the Abyss',
    description: 'A colossal pre-calamity tower submerged half-deep in a subterranean lake, glistening with eerie cerulean luminescence.',
    secretDmNotes: 'The central bell chamber holds a submerged planar portal to the Elemental Plane of Water.',
    linkedNpcNames: ['High Priestess Thalassa', 'The Golem Archivist'],
    shopsAndServices: ['Underwater Herb Foraging', 'Planar Water Well'],
    isDiscovered: true,
    tags: ['Ruins', 'Planar Portal', 'Water Hazard', 'Ancient Lore']
  };
}

// Generate Tavern Rumors & Notice Board Postings
export async function generateTavernRumors(locationName: string): Promise<Array<{ text: string; isTrue: boolean; source: string }>> {
  return [
    {
      text: `Caravans crossing the northern pass report hearing ghostly war horns echoing through the fog at twilight.`,
      isTrue: true,
      source: 'Wounded Merchant in the taproom'
    },
    {
      text: `The city magistrate is secretly being blackmailed by a guild of doppelgangers posing as royal tax collectors.`,
      isTrue: true,
      source: 'Intoxicated City Guard'
    },
    {
      text: `Drinking the water from the old cathedral fountain grants permanent immunity to dragonfire.`,
      isTrue: false,
      source: 'Local Street Urchin'
    },
    {
      text: `A deep subterranean vault was accidentally breached during sewer repairs beneath the copper district.`,
      isTrue: true,
      source: 'Sewer Worker Apprentice'
    }
  ];
}
