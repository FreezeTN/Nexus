import React, { useEffect, useCallback } from 'react';
import { SubscriptionTier, isDeveloperUser, isSubscriptionBypassed, getEffectiveUserTier, TIER_CONFIGS } from '../lib/subscription';
import { UserProfile, getLocalCampaignSaves, extractCampaignNameFromSave } from '../lib/firebase';
import { CharacterData, RuleEdition, Party } from '../types';
import { useModal } from '../modals/ModalContext';
import { GeneratorTab } from '../components/modals/TabletopGeneratorsModal';
import { CampaignTabId } from '../components/modals/CampaignLoreVaultModal';

interface UseModalCoordinatorProps {
  currentUser: UserProfile | null;
  characters: CharacterData[];
  hasConfiguredSystems: boolean;
  activeCharacter?: CharacterData | null;
  currentSystemTheme: RuleEdition;
  enabledSystems: RuleEdition[];
  parties: Party[];
  activeSession?: any;
  activeSessionCode?: string;
  presenceMap: Record<string, any>;
  onNavigateTab?: (tab: any) => void;
  onUpdateCharacter: (char: CharacterData) => void;
  onCreateCharacter: (char: CharacterData) => void;
  onSelectCharacter: (id: string, force?: boolean) => void;
  onSetParties: (parties: Party[]) => void;
  onSetSessionCode: (code: string) => void;
  onSaveTRPGSystems: (systems: RuleEdition[]) => void;
  onToggleSystem: (sysId: RuleEdition) => void;
  onExportJson?: () => void;
  onImportJson?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadCampaignSave?: (saveData: any) => void;
  onAddItemToInventory: (item: any, targetId?: string) => void;
  onAddSpellToSpellbook: (spell: any, targetId?: string) => void;
  onPopulateCombatEncounter?: (enc: any) => void;
  onAppendSessionNotes?: (notes: string) => void;
  onLoadBattlemapLayout?: (layout: any) => void;
  onRoll: (label: string, dice: number, count?: number, modifier?: number, mode?: any) => any;
  onUserChange: (user: UserProfile | null) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function useModalCoordinator({
  currentUser,
  characters,
  hasConfiguredSystems,
  activeCharacter,
  currentSystemTheme,
  enabledSystems,
  parties,
  activeSession,
  activeSessionCode,
  presenceMap,
  onNavigateTab,
  onUpdateCharacter,
  onCreateCharacter,
  onSelectCharacter,
  onSetParties,
  onSetSessionCode,
  onSaveTRPGSystems,
  onToggleSystem,
  onExportJson,
  onImportJson,
  onLoadCampaignSave,
  onAddItemToInventory,
  onAddSpellToSpellbook,
  onPopulateCombatEncounter,
  onAppendSessionNotes,
  onLoadBattlemapLayout,
  onRoll,
  onUserChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}: UseModalCoordinatorProps) {
  const { openModal, closeModal, isModalOpen } = useModal();

  const handleOpenUpgradeModal = useCallback((reason?: string, requiredTier?: SubscriptionTier) => {
    openModal('upgrade', {
      defaultTier: requiredTier,
      reason
    });
  }, [openModal]);

  const handleOpenAuthModal = useCallback(() => {
    openModal('auth', {
      currentUser,
      onUserChange
    });
  }, [openModal, currentUser, onUserChange]);

  const handleOpenNewCharacterModal = useCallback((category: 'character' | 'monster' | 'vendor' = 'character', targetEdition?: RuleEdition) => {
    if (!currentUser) {
      handleOpenAuthModal();
      return;
    }

    const isBypassed = isSubscriptionBypassed(currentUser);
    const tier = isBypassed ? (isDeveloperUser(currentUser) ? 'developer' : 'tester') : getEffectiveUserTier(currentUser);
    const tierConfig = TIER_CONFIGS[tier] || TIER_CONFIGS.free;

    if (!isBypassed && tierConfig.characterLimit !== -1 && characters.length >= tierConfig.characterLimit) {
      handleOpenUpgradeModal(
        `You have reached the maximum character limit (${tierConfig.characterLimit} slots) for your current ${tierConfig.name} tier. Upgrade to Hero for Unlimited Character Slots!`,
        'hero'
      );
      return;
    }

    const campaignSet = new Set<string>();
    characters.forEach(c => {
      if (c.campaignName && c.campaignName.trim()) campaignSet.add(c.campaignName.trim());
    });
    parties.forEach(p => {
      if (p.name && p.name.trim()) campaignSet.add(p.name.trim());
    });
    if (activeSession?.name && typeof activeSession.name === 'string' && activeSession.name.trim()) {
      campaignSet.add(activeSession.name.trim());
    }
    try {
      getLocalCampaignSaves().forEach(s => {
        const cName = extractCampaignNameFromSave(s);
        if (cName && cName.trim() && cName !== 'Campaign Session') {
          campaignSet.add(cName.trim());
        }
      });
    } catch (e) {}

    const existingCampaigns = Array.from(campaignSet).sort();

    openModal('new-character', {
      onCreate: onCreateCharacter,
      initialEdition: targetEdition || currentSystemTheme,
      initialIsMonster: category === 'monster',
      initialIsVendor: category === 'vendor',
      enabledSystems,
      existingCampaigns,
      initialCampaignName: ''
    });
  }, [currentUser, characters, parties, activeSession, handleOpenAuthModal, handleOpenUpgradeModal, openModal, onCreateCharacter, currentSystemTheme, enabledSystems]);

  const handleOpenTRPGSelector = useCallback((isInitialSetup = false) => {
    openModal('trpg-selector', {
      enabledSystems,
      onSaveSystems: onSaveTRPGSystems,
      isInitialSetup
    });
  }, [openModal, enabledSystems, onSaveTRPGSystems]);

  const handleOpenPartyModal = useCallback(() => {
    openModal('party-manager', {
      parties,
      allCharacters: characters,
      activeCharacterId: activeCharacter?.id || '',
      onUpdateParties: onSetParties,
      onSelectCharacter: (charId) => {
        onSelectCharacter(charId);
        closeModal('party-manager');
      },
      currentUser,
      presenceMap,
      onUpdateCharacter
    });
  }, [openModal, parties, characters, activeCharacter?.id, onSetParties, onSelectCharacter, closeModal, currentUser, presenceMap, onUpdateCharacter]);

  const handleOpenSessionModal = useCallback(() => {
    openModal('session-lobby', {
      currentUser,
      activeSession,
      activeSessionCode,
      activeCharacter,
      allCharacters: characters,
      presenceMap,
      onSessionChange: onSetSessionCode,
      onSelectCharacter: (id) => onSelectCharacter(id),
      onOpenAuthModal: handleOpenAuthModal,
      onLoadCampaignSave
    });
  }, [openModal, currentUser, activeSession, activeSessionCode, activeCharacter, characters, presenceMap, onSetSessionCode, onSelectCharacter, handleOpenAuthModal, onLoadCampaignSave]);

  const handleOpenUniversalImporter = useCallback(() => {
    openModal('universal-importer', {
      activeCharacter,
      characters,
      edition: currentSystemTheme,
      onImportCharacter: (char, mode) => {
        if (mode === 'overwrite' && activeCharacter) {
          onUpdateCharacter({ ...char, id: activeCharacter.id });
        } else {
          onCreateCharacter(char);
        }
      },
      onImportMultipleCharacters: (chars) => {
        chars.forEach(c => onCreateCharacter(c));
      }
    });
  }, [openModal, activeCharacter, characters, currentSystemTheme, onUpdateCharacter, onCreateCharacter]);

  const handleOpenAudioModal = useCallback(() => {
    openModal('audio-options', {
      currentUser,
      activeSession,
      activeCharacter,
      onUpdateCharacter,
      onExportJson,
      onImportJson,
      onOpenAuthModal: handleOpenAuthModal,
      onOpenUniversalImporterStudio: handleOpenUniversalImporter,
      onUndo,
      onRedo,
      canUndo,
      canRedo
    });
  }, [openModal, currentUser, activeSession, activeCharacter, onUpdateCharacter, onExportJson, onImportJson, handleOpenAuthModal, handleOpenUniversalImporter, onUndo, onRedo, canUndo, canRedo]);

  const handleOpenExtensionManager = useCallback(() => {
    openModal('extension-manager', {
      enabledSystems,
      onToggleSystem,
      onOpenDeveloperSdk: () => openModal('developer-sdk', {})
    });
  }, [openModal, enabledSystems, onToggleSystem]);

  const handleOpenDeveloperSdk = useCallback(() => {
    openModal('developer-sdk', {});
  }, [openModal]);

  const handleOpenDiagnosticConsole = useCallback(() => {
    openModal('diagnostic-console', {});
  }, [openModal]);

  const handleOpenUserManual = useCallback(() => {
    openModal('user-manual', {});
  }, [openModal]);

  const handleOpenCampaignGraph = useCallback((entityName?: string) => {
    openModal('campaign-graph', {
      initialEntityName: entityName,
      onNavigateTab
    });
  }, [openModal, onNavigateTab]);

  const handleOpenAiAssistant = useCallback(() => {
    openModal('ai-assistant', {
      activeCharacter,
      characters,
      ruleEdition: currentSystemTheme,
      onAddCharacter: onCreateCharacter,
      onAddItemToInventory,
      onAddSpellToSpellbook,
      onNavigateTab,
      onSelectCharacter,
      onLoadBattlemapLayout
    });
  }, [openModal, activeCharacter, characters, currentSystemTheme, onCreateCharacter, onAddItemToInventory, onAddSpellToSpellbook, onNavigateTab, onSelectCharacter, onLoadBattlemapLayout]);

  const handleOpenGenerators = useCallback((tab: GeneratorTab = 'npc') => {
    openModal('tabletop-generators', {
      initialTab: tab,
      activeCharacter,
      ruleEdition: currentSystemTheme,
      onAddCharacter: onCreateCharacter,
      onAddItemToInventory: (item) => onAddItemToInventory(item),
      onAddSpellToSpellbook: (spell) => onAddSpellToSpellbook(spell),
      onPopulateCombatEncounter,
      onAppendSessionNotes
    });
  }, [openModal, activeCharacter, currentSystemTheme, onCreateCharacter, onAddItemToInventory, onAddSpellToSpellbook, onPopulateCombatEncounter, onAppendSessionNotes]);

  const handleOpenCampaignLoreVault = useCallback((tab: CampaignTabId = 'atlas') => {
    openModal('campaign-lore-vault', {
      initialTab: tab,
      activeCharacter,
      characters,
      parties,
      currentUser,
      onUpdateCharacter,
      onAddItemToInventory,
      onOpenKnowledgeGraph: (entityName) => handleOpenCampaignGraph(entityName),
      onOpenGenerators: handleOpenGenerators
    });
  }, [openModal, activeCharacter, characters, parties, currentUser, onUpdateCharacter, onAddItemToInventory, handleOpenCampaignGraph, handleOpenGenerators]);

  const handleOpenLevelUpWizard = useCallback(() => {
    if (!activeCharacter) return;
    openModal('level-up-wizard', {
      character: activeCharacter,
      onUpdateCharacter,
      onRoll
    });
  }, [activeCharacter, openModal, onUpdateCharacter, onRoll]);

  // Initial prompt for TRPG system setup if needed
  useEffect(() => {
    if (!hasConfiguredSystems) {
      handleOpenTRPGSelector(true);
    }
  }, [hasConfiguredSystems, handleOpenTRPGSelector]);

  // Global listener for opening AI Assistant
  useEffect(() => {
    const handleOpenAi = () => handleOpenAiAssistant();
    window.addEventListener('penpaper_open_ai_assistant', handleOpenAi);
    return () => window.removeEventListener('penpaper_open_ai_assistant', handleOpenAi);
  }, [handleOpenAiAssistant]);

  // Global listener for custom campaign graph view events
  useEffect(() => {
    const handleOpenGraph = (e: Event) => {
      const customEvent = e as CustomEvent;
      const entityName = customEvent.detail?.entityName || customEvent.detail;
      handleOpenCampaignGraph(typeof entityName === 'string' ? entityName : undefined);
    };
    window.addEventListener('penpaper_open_campaign_graph', handleOpenGraph);
    return () => window.removeEventListener('penpaper_open_campaign_graph', handleOpenGraph);
  }, [handleOpenCampaignGraph]);

  // Global listener for custom navigation events
  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const targetTab = customEvent.detail;
      if (targetTab && onNavigateTab) {
        onNavigateTab(targetTab);
      }
    };
    window.addEventListener('penpaper_navigate_tab', handleNavigate);
    return () => window.removeEventListener('penpaper_navigate_tab', handleNavigate);
  }, [onNavigateTab]);

  return {
    handleOpenUpgradeModal,
    handleOpenAuthModal,
    handleOpenNewCharacterModal,
    handleOpenTRPGSelector,
    handleOpenPartyModal,
    handleOpenSessionModal,
    handleOpenUniversalImporter,
    handleOpenAudioModal,
    handleOpenExtensionManager,
    handleOpenDeveloperSdk,
    handleOpenDiagnosticConsole,
    handleOpenUserManual,
    handleOpenCampaignGraph,
    handleOpenAiAssistant,
    handleOpenGenerators,
    handleOpenCampaignLoreVault,
    handleOpenLevelUpWizard,
    closeModal,
    isModalOpen
  };
}
