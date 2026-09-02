import { CharacterData, RuleEdition } from '../types';

export type EventType =
  | 'CharacterCreated'
  | 'CharacterUpdated'
  | 'CharacterLevelUp'
  | 'QuestCompleted'
  | 'NPCUpdated'
  | 'CombatStarted'
  | 'ItemAdded'
  | 'ItemRemoved'
  | 'SpellLearned'
  | 'SessionStarted'
  | 'WorldChanged'
  | 'SystemPluginToggled'
  | 'DiceRolled'
  | 'VoiceSpeakerChanged'
  | 'ApplyDamageOrHeal'
  | 'ConcentrationCheckRequested'
  | 'CompendiumUpdated';

export interface EventPayloadMap {
  CompendiumUpdated: { id?: string; name?: string };
  CharacterCreated: { character: CharacterData };
  CharacterUpdated: { character: CharacterData };
  CharacterLevelUp: { characterId: string; characterName: string; oldLevel: number; newLevel: number };
  QuestCompleted: { questId: string; questTitle: string; xpReward?: number };
  NPCUpdated: { npcId: string; name: string; role?: string };
  CombatStarted: { encounterName?: string; participantsCount: number };
  ItemAdded: { characterId: string; itemName: string; quantity?: number };
  ItemRemoved: { characterId: string; itemName: string; quantity?: number };
  SpellLearned: { characterId: string; spellName: string; level?: number };
  SessionStarted: { sessionId: string; sessionTitle: string };
  WorldChanged: { worldId: string; worldName: string };
  SystemPluginToggled: { pluginId: RuleEdition | string; enabled: boolean; version?: string; updated?: boolean; uninstalled?: boolean };
  DiceRolled: { formula: string; total: number; isNat20?: boolean; isNat1?: boolean; rollerName?: string; label?: string };
  VoiceSpeakerChanged: { uid: string; displayName: string; characterName?: string; isSpeaking: boolean };
  ApplyDamageOrHeal: {
    targetCombatantId?: string;
    targetName?: string;
    amount: number; // positive = heal, negative = damage
    damageType?: string;
    sourceLabel?: string;
    isCrit?: boolean;
    isHalfDamage?: boolean;
  };
  ConcentrationCheckRequested: {
    combatantId: string;
    combatantName: string;
    damageTaken: number;
    conSaveDc: number;
    spellName?: string;
  };
}

export interface LoggedEvent<K extends EventType = EventType> {
  id: string;
  type: K;
  timestamp: Date;
  payload: EventPayloadMap[K];
}

export type EventCallback<K extends EventType> = (payload: EventPayloadMap[K], log: LoggedEvent<K>) => void;
