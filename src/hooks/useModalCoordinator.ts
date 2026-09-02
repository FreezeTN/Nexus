import { useState, useEffect } from 'react';
import { SubscriptionTier, isDeveloperUser, isTesterUser, isSubscriptionBypassed, getEffectiveUserTier, TIER_CONFIGS } from '../lib/subscription';
import { UserProfile } from '../lib/firebase';
import { CharacterData } from '../types';

interface UseModalCoordinatorProps {
  currentUser: UserProfile | null;
  characters: CharacterData[];
  hasConfiguredSystems: boolean;
  onNavigateTab?: (tab: any) => void;
}

export function useModalCoordinator({
  currentUser,
  characters,
  hasConfiguredSystems,
  onNavigateTab
}: UseModalCoordinatorProps) {
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showTRPGSelectorModal, setShowTRPGSelectorModal] = useState<boolean>(!hasConfiguredSystems);
  const [showAudioModal, setShowAudioModal] = useState<boolean>(false);
  const [showCommandPalette, setShowCommandPalette] = useState<boolean>(false);
  const [showExtensionManager, setShowExtensionManager] = useState<boolean>(false);
  const [showDeveloperSdk, setShowDeveloperSdk] = useState<boolean>(false);
  const [showUserManualModal, setShowUserManualModal] = useState<boolean>(false);
  const [showCampaignGraphModal, setShowCampaignGraphModal] = useState<boolean>(false);
  const [showAiAssistantModal, setShowAiAssistantModal] = useState<boolean>(false);
  const [initialGraphEntityName, setInitialGraphEntityName] = useState<string | undefined>(undefined);
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
  const [showLevelUpWizard, setShowLevelUpWizard] = useState<boolean>(false);
  const [showNewCharacterModal, setShowNewCharacterModal] = useState<boolean>(false);
  const [showPartyModal, setShowPartyModal] = useState<boolean>(false);
  const [showUniversalImporterStudio, setShowUniversalImporterStudio] = useState<boolean>(false);
  const [newCharCategory, setNewCharCategory] = useState<'character' | 'monster' | 'vendor'>('character');

  // Upgrade / Supporter Modal State
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [upgradeModalReason, setUpgradeModalReason] = useState<string | undefined>(undefined);
  const [upgradeModalRequiredTier, setUpgradeModalRequiredTier] = useState<SubscriptionTier | undefined>(undefined);

  const handleOpenUpgradeModal = (reason?: string, requiredTier?: SubscriptionTier) => {
    setUpgradeModalReason(reason);
    setUpgradeModalRequiredTier(requiredTier);
    setShowUpgradeModal(true);
  };

  const handleOpenNewCharacterModal = (category: 'character' | 'monster' | 'vendor' = 'character') => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    // Check tier character limit (Developer and Tester bypass all limits)
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

    setNewCharCategory(category);
    setShowNewCharacterModal(true);
  };

  // Global listener for opening AI Assistant
  useEffect(() => {
    const handleOpenAi = () => {
      setShowAiAssistantModal(true);
    };
    window.addEventListener('penpaper_open_ai_assistant', handleOpenAi);
    return () => window.removeEventListener('penpaper_open_ai_assistant', handleOpenAi);
  }, []);

  // Global listener for custom campaign graph view events
  useEffect(() => {
    const handleOpenGraph = (e: Event) => {
      const customEvent = e as CustomEvent;
      const entityName = customEvent.detail?.entityName || customEvent.detail;
      setInitialGraphEntityName(typeof entityName === 'string' ? entityName : undefined);
      setShowCampaignGraphModal(true);
    };
    window.addEventListener('penpaper_open_campaign_graph', handleOpenGraph);
    return () => window.removeEventListener('penpaper_open_campaign_graph', handleOpenGraph);
  }, []);

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
    showAuthModal,
    setShowAuthModal,
    showTRPGSelectorModal,
    setShowTRPGSelectorModal,
    showAudioModal,
    setShowAudioModal,
    showCommandPalette,
    setShowCommandPalette,
    showExtensionManager,
    setShowExtensionManager,
    showDeveloperSdk,
    setShowDeveloperSdk,
    showUserManualModal,
    setShowUserManualModal,
    showCampaignGraphModal,
    setShowCampaignGraphModal,
    showAiAssistantModal,
    setShowAiAssistantModal,
    initialGraphEntityName,
    setInitialGraphEntityName,
    showVoiceModal,
    setShowVoiceModal,
    showLevelUpWizard,
    setShowLevelUpWizard,
    showNewCharacterModal,
    setShowNewCharacterModal,
    showPartyModal,
    setShowPartyModal,
    showUniversalImporterStudio,
    setShowUniversalImporterStudio,
    newCharCategory,
    setNewCharCategory,
    showUpgradeModal,
    setShowUpgradeModal,
    upgradeModalReason,
    upgradeModalRequiredTier,
    handleOpenUpgradeModal,
    handleOpenNewCharacterModal
  };
}
