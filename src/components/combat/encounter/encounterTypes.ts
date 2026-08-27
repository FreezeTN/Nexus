import { CharacterData, Party, EncounterEnvironment } from '../../../types';
import { UserProfile } from '../../../lib/firebase';

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
  category: 'initiative' | 'turn' | 'attack' | 'damage' | 'heal' | 'condition' | 'ability' | 'note';
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
}

export interface SavedEncounterData {
  combatants: Combatant[];
  activeTurnIndex: number;
  roundNumber: number;
  combatLogs: CombatLogEntry[];
  encounterEnvironment?: EncounterEnvironment;
}
