import { CharacterData, Party, EncounterEnvironment, GearItem } from '../../../types';
import { UserProfile, GameSession } from '../../../lib/firebase';

export type EncounterMode = 'combat' | 'merchant';

export interface MerchantEncounterState {
  merchantId: string;
  merchantName: string;
  archetype?: string;
  portraitUrl?: string;
  greeting?: string;
  personality?: string;
  haggleDc: number;
  haggleModifier: number; // e.g. -15% on success, +10% on fail, 0 default
  lastHaggleResult?: {
    roll: number;
    modifier: number;
    total: number;
    success: boolean;
    discountPercent: number;
    timestamp: string;
  };
  goldGp: number;
  vendorMargin: number; // base markup percentage e.g. 100
  inventory: GearItem[];
  statblock?: {
    armorClass: number;
    hp: number;
    initiativeBonus: number;
    attacks?: string;
  };
}

export interface ConcentrationPrompt {
  combatantId: string;
  combatantName: string;
  damageTaken: number;
  conSaveDc: number;
  spellName?: string;
  conMod: number;
}

export interface MassiveDamagePrompt {
  combatantId: string;
  combatantName: string;
  damageTaken: number;
  fortSaveDc: number; // 15
  fortMod: number;
}

export interface Combatant {
  id: string;
  name: string;
  initiative: number;
  armorClass: number;
  hpCurrent: number;
  hpMax: number;
  tempHp?: number;
  type: 'player' | 'ally' | 'enemy';
  isPlayerChar?: boolean;
  conditions?: string[];
  conditionDurations?: Record<string, number>; // Maps condition to remaining rounds (e.g. { 'Stunned': 1 })
  isConcentrating?: boolean;
  concentratingSpell?: { spellName: string; castRound: number; dc?: number };
  monsterXpReward?: number;
  isDefeated?: boolean;
  portraitUrl?: string;
  partyId?: string;
  isPartyMember?: boolean;
  controlledBy?: string;
  mapX?: number; // 0-indexed column on tactical battlemap
  mapY?: number; // 0-indexed row on tactical battlemap
  isOnMap?: boolean; // false if removed from map / in reserve benched
  tokenSize?: number; // 1 = 1x1 (Medium/Small), 2 = 2x2 (Large), 3 = 3x3 (Huge), 4 = 4x4 (Gargantuan)
  reachFeet?: number; // default 5ft
  elevationFeet?: number; // default 0ft
  speed?: number; // Base movement speed in feet (default 30ft)
  movementRemaining?: number; // Remaining movement feet in current turn
  hasDashed?: boolean; // Whether Dash action was used this turn
  mountedOnId?: string; // ID of the mount combatant this rider is riding
  isMount?: boolean; // Whether this combatant is designated as a mount/steed
}

export interface CombatLogEntry {
  id: string;
  timestamp: string;
  round: number;
  actor?: string;
  category: 'initiative' | 'turn' | 'attack' | 'damage' | 'heal' | 'condition' | 'ability' | 'note' | 'trade';
  message: string;
}

export interface EncounterTrackerProps {
  character: CharacterData;
  allCharacters?: CharacterData[];
  parties?: Party[];
  currentUser?: UserProfile | null;
  activeSession?: GameSession | null;
  activeSessionCode?: string | null;
  onOpenPartyManager?: () => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
  onUpdateCharacter?: (updated: CharacterData) => void;
  encounterState?: any;
  onOpenGenerators?: (tab?: 'npc' | 'encounter' | 'treasure' | 'session' | 'rules' | 'dungeon') => void;
  initialViewMode?: 'teams' | 'timeline' | 'battlemap';
  isStandaloneBattlemap?: boolean;
}

export interface SavedEncounterData {
  combatants: Combatant[];
  activeTurnIndex: number;
  roundNumber: number;
  combatLogs: CombatLogEntry[];
  encounterEnvironment?: EncounterEnvironment;
  encounterMode?: EncounterMode;
  activeMerchant?: MerchantEncounterState | null;
  battlemapTheme?: 'dungeon' | 'grass' | 'cave' | 'volcano' | 'snow' | 'ship' | 'void';
  battlemapColumns?: number;
  battlemapRows?: number;
  battlemapFeetPerSquare?: number;
  battlemapTerrain?: Record<string, string>;
  battlemapDoors?: Record<string, { isOpen: boolean; isLocked?: boolean }>;
  battlemapFogOfWar?: Record<string, boolean>;
  battlemapUseFogOfWar?: boolean;
}

