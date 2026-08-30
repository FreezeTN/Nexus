/**
 * Four-Tier State Architecture Contracts
 * 
 * Hierarchy:
 * Server State -> Domain State -> UI State -> Transient State
 * 
 * 1. Server State: Durable cloud persistence, remote database mirrors, realtime session rooms, and auth sessions.
 * 2. Domain State: Core tabletop RPG entity models, calculated stat trees, inventory rules, and game engines.
 * 3. UI State: View navigation, modal dialog coordinators, theme preferences, form drafts, and search/filter queries.
 * 4. Transient State: Ephemeral frame-by-frame data (3D dice animations, WebRTC audio levels, tooltips, sound effects).
 */

import { GameSession, UserProfile } from '../lib/firebase';
import { CharacterData, RuleEdition } from '../types';

// ==========================================
// TIER 1: SERVER STATE
// ==========================================

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export interface ServerStateMeta {
  readonly lastSyncedAt: string | null;
  readonly syncStatus: SyncStatus;
  readonly isOnline: boolean;
  readonly pendingWritesCount: number;
  readonly error: string | null;
}

export interface ServerState {
  readonly auth: {
    readonly user: UserProfile | null;
    readonly isAuthenticated: boolean;
    readonly isAuthLoading: boolean;
  };
  readonly session: {
    readonly activeSession: GameSession | null;
    readonly sessionCode: string | null;
    readonly isHost: boolean;
    readonly memberCount: number;
  };
  readonly remoteMeta: ServerStateMeta;
}

// ==========================================
// TIER 2: DOMAIN STATE
// ==========================================

export interface CharacterDomainEntity extends CharacterData {
  readonly _domainCalculated?: {
    readonly effectiveArmorClass: number;
    readonly passivePerception: number;
    readonly spellSaveDc: number;
    readonly totalCarriedWeight: number;
    readonly encumbranceTier: 'unencumbered' | 'encumbered' | 'heavily_encumbered';
    readonly activeConditionPenalties: Record<string, number>;
  };
}

export interface DomainState {
  readonly activeRuleSystem: RuleEdition;
  readonly activeCharacterId: string | null;
  readonly characters: ReadonlyArray<CharacterDomainEntity>;
  readonly combatInitiativeOrder: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly initiative: number;
    readonly hpCurrent: number;
    readonly hpMax: number;
    readonly isPlayer: boolean;
    readonly conditions: ReadonlyArray<string>;
  }>;
}

// ==========================================
// TIER 3: UI STATE
// ==========================================

export type ActiveTabId =
  | 'sheet1' // Stats & Features
  | 'sheet2' // Combat & Tracker
  | 'sheet3' // Gear & Wealth
  | 'sheet4' // Spells & Magic
  | 'sheet5' // Description & Notes
  | 'sheet6' // User Guide
  | 'sheet7' // Compendium
  | 'sheetDm' // DM Overview
  | 'menu';

export interface UIModalState {
  readonly isNewCharacterOpen: boolean;
  readonly isLevelUpWizardOpen: boolean;
  readonly isAuthModalOpen: boolean;
  readonly isSessionLobbyOpen: boolean;
  readonly isPartyManagerOpen: boolean;
  readonly isSystemSelectorOpen: boolean;
  readonly isAudioOptionsOpen: boolean;
  readonly isPhysicalDiceOpen: boolean;
  readonly isCampaignGraphOpen: boolean;
  readonly isUserManualOpen: boolean;
  readonly isDeveloperSdkOpen: boolean;
  readonly isAiAssistantOpen: boolean;
  readonly isUpgradeModalOpen: boolean;
}

export interface UIState {
  readonly activeTab: ActiveTabId;
  readonly isDetachedWindow: boolean;
  readonly activeThemeId: string;
  readonly modals: UIModalState;
  readonly searchQuery: string;
  readonly activeFilterTag: string | null;
}

// ==========================================
// TIER 4: TRANSIENT STATE
// ==========================================

export interface DicePhysicsTransientState {
  readonly isRolling: boolean;
  readonly activeRollFormula: string | null;
  readonly lastRollTotal: number | null;
  readonly isCriticalSuccess: boolean;
  readonly isCriticalFailure: boolean;
  readonly diceAnimationStep: number;
}

export interface AudioTransientState {
  readonly activeSpeakingPeers: ReadonlySet<string>;
  readonly localMicLevel: number;
  readonly currentAmbienceVolume: number;
  readonly isAudioMuted: boolean;
}

export interface EphemeralToast {
  readonly id: string;
  readonly title: string;
  readonly message: string;
  readonly type: 'info' | 'success' | 'warning' | 'error';
  readonly durationMs: number;
}

export interface TransientState {
  readonly dice: DicePhysicsTransientState;
  readonly audio: AudioTransientState;
  readonly activeToasts: ReadonlyArray<EphemeralToast>;
  readonly hoveredElementId: string | null;
}

// ==========================================
// UNIFIED STATE CLASSIFIER CONTRACT
// ==========================================

export type StateTier = 'server' | 'domain' | 'ui' | 'transient';

export interface StateTierDescriptor {
  readonly tier: StateTier;
  readonly description: string;
  readonly isPersistent: boolean;
  readonly syncTarget: 'firestore' | 'indexeddb_localstorage' | 'memory_react_context' | 'request_animation_frame';
}
