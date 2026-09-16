import React from 'react';
import { CharacterData, RuleEdition, Party } from '../types';
import { UserProfile, GameSession } from '../lib/firebase';
import { SubscriptionTier } from '../lib/subscription';
import { GeneratorTab } from '../components/modals/TabletopGeneratorsModal';
import { CampaignTabId } from '../components/modals/CampaignLoreVaultModal';

export type ModalId =
  | 'auth'
  | 'trpg-selector'
  | 'party-manager'
  | 'session-lobby'
  | 'audio-options'
  | 'universal-importer'
  | 'extension-manager'
  | 'developer-sdk'
  | 'diagnostic-console'
  | 'user-manual'
  | 'campaign-graph'
  | 'ai-assistant'
  | 'tabletop-generators'
  | 'campaign-lore-vault'
  | 'upgrade'
  | 'new-character'
  | 'level-up-wizard'
  | 'legal-licensing';

export interface ModalPropsMap {
  auth: {
    currentUser?: UserProfile | null;
    onUserChange?: (user: UserProfile | null) => void;
  };
  'trpg-selector': {
    enabledSystems: RuleEdition[];
    onSaveSystems: (systems: RuleEdition[]) => void;
    isInitialSetup?: boolean;
  };
  'party-manager': {
    parties: Party[];
    allCharacters: CharacterData[];
    activeCharacterId: string;
    onUpdateParties: (parties: Party[]) => void;
    onSelectCharacter: (charId: string) => void;
    currentUser?: UserProfile | null;
    presenceMap?: Record<string, any>;
    onUpdateCharacter?: (char: CharacterData) => void;
  };
  'session-lobby': {
    currentUser: UserProfile | null;
    activeSession?: GameSession | null;
    activeSessionCode?: string;
    activeCharacter?: CharacterData | null;
    allCharacters: CharacterData[];
    presenceMap?: Record<string, any>;
    onSessionChange?: (code: string) => void;
    onSelectCharacter?: (id: string) => void;
    onOpenAuthModal?: () => void;
    onLoadCampaignSave?: (saveData: any) => void;
  };
  'audio-options': {
    currentUser?: UserProfile | null;
    activeSession?: GameSession | null;
    activeCharacter?: CharacterData | null;
    onUpdateCharacter?: (char: CharacterData) => void;
    onSystemChange?: (edition: RuleEdition) => void;
    onExportJson?: () => void;
    onImportJson?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onOpenAuthModal?: () => void;
    onOpenUniversalImporterStudio?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
  };
  'universal-importer': {
    activeCharacter?: CharacterData | null;
    characters: CharacterData[];
    edition: RuleEdition;
    onImportCharacter: (char: any, mode: 'new' | 'overwrite') => void;
    onImportMultipleCharacters?: (chars: any[]) => void;
  };
  'extension-manager': {
    enabledSystems: RuleEdition[];
    onToggleSystem: (sysId: RuleEdition) => void;
    onOpenDeveloperSdk?: () => void;
  };
  'developer-sdk': Record<string, never>;
  'diagnostic-console': Record<string, never>;
  'user-manual': Record<string, never>;
  'campaign-graph': {
    initialEntityName?: string;
    onNavigateTab?: (tab: any) => void;
  };
  'ai-assistant': {
    activeCharacter?: CharacterData | null;
    characters: CharacterData[];
    ruleEdition: RuleEdition;
    onAddCharacter?: (char: any) => void;
    onAddItemToInventory?: (item: any, targetId?: string) => void;
    onAddSpellToSpellbook?: (spell: any, targetId?: string) => void;
    onNavigateTab?: (tab: any) => void;
    onSelectCharacter?: (id: string) => void;
  };
  'tabletop-generators': {
    initialTab?: GeneratorTab;
    activeCharacter?: CharacterData | null;
    ruleEdition: RuleEdition;
    onAddCharacter?: (char: any) => void;
    onAddItemToInventory?: (item: any) => void;
    onAddSpellToSpellbook?: (spell: any) => void;
    onPopulateCombatEncounter?: (enc: any) => void;
    onAppendSessionNotes?: (notes: string) => void;
  };
  'campaign-lore-vault': {
    initialTab?: CampaignTabId;
    activeCharacter?: CharacterData | null;
    characters?: CharacterData[];
    parties?: Party[];
    currentUser?: UserProfile | null;
    onUpdateCharacter?: (char: CharacterData) => void;
    onAddItemToInventory?: (item: any, targetId?: string) => void;
    onOpenKnowledgeGraph?: (entityName?: string) => void;
    onOpenGenerators?: (tab?: GeneratorTab) => void;
  };
  upgrade: {
    defaultTier?: SubscriptionTier;
    reason?: string;
  };
  'new-character': {
    onCreate: (char: CharacterData) => void;
    initialEdition?: RuleEdition;
    initialIsMonster?: boolean;
    initialIsVendor?: boolean;
    enabledSystems?: RuleEdition[];
    existingCampaigns?: string[];
    initialCampaignName?: string;
  };
  'level-up-wizard': {
    character: CharacterData;
    onUpdateCharacter: (char: CharacterData) => void;
    onRoll: (label: string, dice: number, count?: number, modifier?: number, mode?: any) => any;
  };
  'legal-licensing': {
    defaultTab?: 'attribution' | 'cc-by' | 'ogl';
  };
}

export interface ActiveModalInstance<K extends ModalId = ModalId> {
  id: K;
  props: ModalPropsMap[K];
  zIndex?: number;
}
