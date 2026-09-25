import { RuleEdition, CharacterData, GearItem, Attack, Spell, AbilityName } from '../types';
import { PluginCompatibilityRequirement } from './semanticVersion';

export type RollModel =
  | { kind: 'd20'; modifier: number; formula: string; targetType: 'AC' | 'DC' }
  | { kind: 'dicePool'; diceCount: number; successTarget: number; glitchThreshold?: number }
  | { kind: 'percentile'; targetPercentage: number; hardTarget?: number; extremeTarget?: number };

export interface CharacterStatsSummary {
  maxHp: number;
  armorClass: number;
  initiativeBonus: number;
  speed: number;
  passivePerception: number;
  secondaryResourceLabel?: string;
  secondaryResourceVal?: number;
  secondaryResourceMax?: number;
}

export interface SystemCharacterEngine {
  getDefaultAbilities(): Record<AbilityName, { score: number; overrideBonus?: number }>;
  calculateStats(char: CharacterData): CharacterStatsSummary;
  getProficiencyBonus(level: number): number;
  getAbilityModifier(score: number): number;
}

export interface RollResultSummary {
  total: number;
  rolls: number[];
  formula: string;
  isSuccess?: boolean;
  isCriticalSuccess?: boolean;
  isCriticalFailure?: boolean;
  summaryText: string;
}

export interface SystemCombatEngine {
  getInitiativeFormula(char: CharacterData): string;
  getAttackBonus(itemOrAttack: GearItem | Attack, char: CharacterData): number;
  getDamageFormula(itemOrAttack: GearItem | Attack, char: CharacterData): string;
  getRollModel?(actionType: 'attack' | 'check' | 'save', itemOrAttack: GearItem | Attack | undefined, char: CharacterData): RollModel;
  resolveRollModel?(rollModel: RollModel): RollResultSummary;
  supportsSanityCheck?: boolean;
  supportsConditionMonitors?: boolean;
}

export interface SystemSpellEngine {
  isSpellcaster(char: CharacterData): boolean;
  getSpellSlotLabel(level: number): string;
  getSpellStatLabel(): string;
  canCastSpell?(spell: Spell, char: CharacterData): { allowed: boolean; reason?: string };
}

export interface SystemDataCatalog {
  classes: string[];
  races: string[];
  alignments?: string[];
  primaryAttributes: string[];
  damageTypes?: string[];
  defaultClassData?: Record<string, { hd: string; primaryStat: string }>;
}

export type PluginPermission =
  | 'character:read'
  | 'character:write'
  | 'inventory:modify'
  | 'dice:roll'
  | 'events:subscribe'
  | 'voice:integrate';

export interface PluginCapability {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface GameSystemPlugin {
  id: RuleEdition;
  name: string;
  shortName: string;
  description: string;
  badgeColor: string;
  icon: string;
  primaryResourceName: string;

  // Extension Metadata & Ecosystem Specs
  version?: string;
  author?: string;
  website?: string;
  license?: string;
  category?: 'fantasy' | 'cyberpunk' | 'horror' | 'tactical' | 'universal';
  supportedFeatures?: string[];
  thirdParty?: boolean;
  requires?: PluginCompatibilityRequirement;
  minPlatformVersion?: string;
  minSystemVersion?: string;
  capabilities?: PluginCapability[];
  permissions?: PluginPermission[];
  featureFlags?: Record<string, boolean>;
  dependencies?: Array<{ pluginId: string; name: string; required: boolean }>;
  optionalModules?: Array<{ id: string; name: string; description: string; enabledByDefault?: boolean }>;
  layoutFeatures?: any[];
  validateConfig?: (config: Record<string, any>) => { valid: boolean; errors?: string[] };

  characterEngine: SystemCharacterEngine;
  combatEngine: SystemCombatEngine;
  spellEngine: SystemSpellEngine;
  data: SystemDataCatalog;

  // Expanded Plugin Lifecycle & Extension Hooks
  lifecycleHooks?: PluginLifecycleHooks;
}

export interface PluginBattlemapEvent {
  type: 'tokenMove' | 'terrainChange' | 'doorToggle' | 'weatherChange' | 'roundAdvance' | 'aoePlaced';
  payload: any;
  timestamp: string;
}

export interface PluginReplayHookPayload {
  eventId: string;
  eventType: string;
  title: string;
  details?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface PluginAiContextContributor {
  key: string;
  priority?: number;
  generateSnippet(context: {
    party: CharacterData[];
    activeLocation?: string;
    activeQuest?: string;
    weather?: string;
    timeOfDay?: string;
  }): { title: string; promptSnippet: string } | null;
}

export interface PluginCampaignTimelineEvent {
  type: 'worldTick' | 'questStage' | 'factionMove' | 'weatherShift' | 'custom';
  timestampDay: number;
  title: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface PluginSessionLifecycleEvent {
  action: 'start' | 'end' | 'pause' | 'resume';
  sessionId: string;
  sessionNumber: number;
  sessionTitle: string;
  startingLocation?: string;
  timestamp: string;
  notes?: string;
}

export interface PluginLifecycleHooks {
  onSessionStart?(session: PluginSessionLifecycleEvent): void;
  onSessionEnd?(session: PluginSessionLifecycleEvent): void;
  onReplayEventRecorded?(event: PluginReplayHookPayload): void;
  onBattlemapEvent?(event: PluginBattlemapEvent): void;
  onCampaignTimelineEvent?(event: PluginCampaignTimelineEvent): void;
  aiContextContributors?: PluginAiContextContributor[];
}

