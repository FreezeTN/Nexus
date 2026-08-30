import { CharacterData, Party, EncounterEnvironment, GearItem } from '../../../types';
import { UserProfile } from '../../../lib/firebase';

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

export interface Combatant {
  id: string;
  name: string;
  initiative: number;
  armorClass: number;
  hpCurrent: number;
  hpMax: number;
  type: 'player' | 'ally' | 'enemy';
  isPlayerChar?: boolean;
  conditions?: string[];
  monsterXpReward?: number;
  isDefeated?: boolean;
  portraitUrl?: string;
  partyId?: string;
  isPartyMember?: boolean;
  controlledBy?: string;
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
  onOpenPartyManager?: () => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
  onUpdateCharacter?: (updated: CharacterData) => void;
  encounterState?: any;
  onOpenGenerators?: (tab?: 'npc' | 'encounter' | 'treasure' | 'session' | 'rules' | 'dungeon') => void;
}

export interface SavedEncounterData {
  combatants: Combatant[];
  activeTurnIndex: number;
  roundNumber: number;
  combatLogs: CombatLogEntry[];
  encounterEnvironment?: EncounterEnvironment;
  encounterMode?: EncounterMode;
  activeMerchant?: MerchantEncounterState | null;
}

