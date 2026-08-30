export type LocationType = 
  | 'city' 
  | 'castle' 
  | 'dungeon' 
  | 'tavern' 
  | 'wilderness' 
  | 'shrine' 
  | 'ruins' 
  | 'anomaly' 
  | 'port';

export type MapPresetSkin = 
  | 'faerun' 
  | 'sword_coast' 
  | 'underdark' 
  | 'cyberpunk' 
  | 'ravenloft' 
  | 'arkham' 
  | 'archipelago' 
  | 'custom';

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
}

export type QuestCategory = 'main' | 'side' | 'personal' | 'faction' | 'bounty' | 'rumor';
export type QuestStatus = 'active' | 'completed' | 'failed' | 'rumor';

export interface QuestStage {
  id: string;
  text: string;
  completed: boolean;
  optional?: boolean;
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
