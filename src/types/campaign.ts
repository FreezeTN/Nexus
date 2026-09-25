export type LocationType = 
  | 'city' 
  | 'castle' 
  | 'dungeon' 
  | 'tavern' 
  | 'wilderness' 
  | 'shrine' 
  | 'ruins' 
  | 'anomaly' 
  | 'port'
  | 'boss_lair'
  | 'safehouse'
  | 'monument';

export type MapPresetSkin = 
  | 'faerun' 
  | 'sword_coast' 
  | 'underdark' 
  | 'cyberpunk' 
  | 'ravenloft' 
  | 'arkham' 
  | 'archipelago' 
  | 'custom';

export interface DungeonDetails {
  floors?: number;
  bossName?: string;
  bossCr?: string;
  hazards?: string[];
  roomCount?: number;
  treasureNotes?: string;
  trapDetails?: string;
}

export interface WorldLocation {
  id: string;
  name: string;
  type: LocationType;
  x: number; // 0 - 100 percentage on canvas
  y: number; // 0 - 100 percentage on canvas
  mapSkin?: MapPresetSkin;
  dangerLevel: 'Safe' | 'Tier 1 (CR 1-4)' | 'Tier 2 (CR 5-10)' | 'Tier 3 (CR 11-16)' | 'Tier 4 (CR 17-20+)' | 'Deadly';
  climate: string; // e.g. "Temperate Forest", "Subterranean", "Arctic Waste", "Neon Metropole"
  controllingFactionId?: string;
  controllingFactionName?: string;
  description: string;
  secretDmNotes?: string;
  linkedNpcNames: string[];
  shopsAndServices?: string[];
  isDiscovered: boolean;
  tags: string[];
  customImageUrl?: string;
  markerColor?: string;
  markerIcon?: string;
  customLoreNotes?: string;
  dungeonDetails?: DungeonDetails;
  linkedBattlemapLayoutId?: string; // ID of linked tactical battlemap layout (e.g. preset_sunken_crypt)
  suggestedMonsterNames?: string[]; // e.g. ['Goblin', 'Skeleton', 'Bugbear']
}

export type QuestCategory = 'main' | 'side' | 'personal' | 'faction' | 'bounty' | 'rumor';
export type QuestStatus = 'active' | 'completed' | 'failed' | 'rumor';

export interface QuestStage {
  id: string;
  text: string;
  completed: boolean;
  optional?: boolean;
  xpReward?: number;
  goldReward?: number;
  itemReward?: string;
}

export interface QuestReward {
  xp?: number;
  gold?: number;
  items?: string[];
  reputation?: Array<{
    factionId: string;
    factionName: string;
    amount: number; // e.g. +15 or -10
  }>;
  notes?: string;
}

export interface CampaignQuest {
  id: string;
  title: string;
  category: QuestCategory;
  status: QuestStatus;
  summary: string;
  giverName?: string;
  giverLocationId?: string;
  giverLocationName?: string;
  giverFactionId?: string;
  recommendedLevel?: string;
  stages: QuestStage[];
  rewards: QuestReward;
  secretDmNotes?: string;
  connectedCharacterNames?: string[];
  createdAt: string;
  deadlineInGameDays?: number;
}

export type FactionCategory = 'guild' | 'syndicate' | 'military' | 'religious' | 'political' | 'arcane' | 'underworld';

export interface FactionPerk {
  tier: number; // 1 to 4
  name: string;
  description: string;
  standingRequired: number; // e.g. 30 for Honored
  unlocked: boolean;
}

export interface FactionReputationLog {
  id: string;
  date: string;
  delta: number;
  reason: string;
}

export interface Faction {
  id: string;
  name: string;
  category: FactionCategory;
  standing: number; // -100 to +100
  headquartersLocationName?: string;
  leaderName?: string;
  motto?: string;
  description: string;
  alignment?: string;
  perks: FactionPerk[];
  rivalFactionIds: string[];
  rivalFactionNames: string[];
  secretAgenda?: string;
  notes?: string;
  reputationHistory?: FactionReputationLog[];
}

export type TravelPace = 'slow' | 'normal' | 'fast';
export type TravelMode = 'foot' | 'draft_horse' | 'warhorse' | 'carriage' | 'sailing_ship' | 'airship' | 'teleport';

export interface TravelCalculationParams {
  distanceMiles: number;
  mode: TravelMode;
  pace: TravelPace;
  difficultTerrain?: boolean;
  weatherHazard?: boolean;
}

export interface TravelCalculationResult {
  hoursTotal: number;
  daysTotal: number;
  milesPerDay: number;
  rationsPerPerson: number;
  waterGallonsPerPerson: number;
  passivePerceptionModifier: number;
  stealthAllowed: boolean;
  exhaustionRisk: boolean;
  encounterCheckRolls: number;
  description: string;
}

export interface CampaignJournalEntry {
  id: string;
  timestamp: string; // ISO date or display string
  title: string;
  category: 'encounter' | 'exploration' | 'quest' | 'lore' | 'downtime';
  locationId?: string;
  locationName?: string;
  summary: string;
  enemiesVanquished?: Array<{ name: string; count: number; xpReward: number }>;
  totalXpAwarded?: number;
  lootHarvested?: Array<{ name: string; quantity: number; rarity?: string; notes?: string }>;
  currencyFound?: { cp?: number; sp?: number; ep?: number; gp?: number; pp?: number };
  participants?: string[];
  notes?: string;
}

export type WorldSeason = 'spring' | 'summer' | 'autumn' | 'winter';
export type TimeOfDay = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'night' | 'midnight';

export interface WorldCalendarState {
  currentDay: number;
  currentYear: number;
  season: WorldSeason;
  timeOfDay: TimeOfDay;
  weather: string;
  weatherDescription: string;
  temperatureFahrenheit: number;
  activeMoonPhase?: 'New Moon' | 'Waxing Crescent' | 'First Quarter' | 'Waxing Gibbous' | 'Full Moon' | 'Waning Gibbous' | 'Last Quarter' | 'Waning Crescent';
  ambientHazardActive?: boolean;
}

export interface WorldGazetteItem {
  id: string;
  headline: string;
  category: 'faction' | 'weather' | 'quest' | 'rumor' | 'economy';
  body: string;
  urgency: 'low' | 'moderate' | 'high' | 'critical';
  affectedLocationId?: string;
  affectedFactionId?: string;
  timestampDay: number;
}

export interface WorldTickResult {
  daysAdvanced: number;
  newCalendar: WorldCalendarState;
  gazette: WorldGazetteItem[];
  factionShifts: Array<{ factionId: string; factionName: string; changeText: string; tensionDelta: number }>;
  questUpdates: Array<{ questId: string; questTitle: string; changeText: string; deadlineWarning?: boolean }>;
  npcRumors: Array<{ npcName: string; locationName?: string; rumor: string }>;
}

