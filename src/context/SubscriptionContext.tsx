import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { UserProfile, updateUserSubscriptionTier } from '../lib/firebase';
import { 
  SubscriptionTier, 
  TierPerks, 
  TIER_CONFIGS, 
  isDeveloperUser, 
  getEffectiveUserTier,
  PAYPAL_RECIPIENT_EMAIL
} from '../lib/subscription';

interface SubscriptionContextType {
  currentUser: UserProfile | null;
  tier: SubscriptionTier;
  tierConfig: TierPerks;
  isDeveloper: boolean;
  isHero: boolean;
  isGuild: boolean;
  isLifetime: boolean;
  characterLimit: number;
  rollLogLimit: number;
  canCreateCharacter: (currentCount: number) => boolean;
  hasCosmeticDice: boolean;
  hasCustomThemes: boolean;
  hasPdfExport: boolean;
  hasCampaignGraphPro: boolean;
  hasDmLivePartyHud: boolean;
  hasPriorityAi: boolean;
  // Upgrade Modal Triggers
  isUpgradeModalOpen: boolean;
  upgradeReason: string | null;
  upgradeRequiredTier: 'hero' | 'guild';
  openUpgradeModal: (reason?: string, requiredTier?: 'hero' | 'guild') => void;
  closeUpgradeModal: () => void;
  // Upgrade Actions
  upgradeToTier: (
    newTier: SubscriptionTier, 
    details?: { paypalTxId?: string; paypalEmail?: string; isLifetime?: boolean; tierExpiresAt?: string }
  ) => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
  currentUser: UserProfile | null;
  onUserUpdate?: (updatedUser: UserProfile) => void;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({
  children,
  currentUser,
  onUserUpdate
}) => {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<string | null>(null);
  const [upgradeRequiredTier, setUpgradeRequiredTier] = useState<'hero' | 'guild'>('hero');

  // Compute effective tier taking into account developer bypass
  const isDev = isDeveloperUser(currentUser);
  const effectiveTier: SubscriptionTier = isDev ? 'developer' : getEffectiveUserTier(currentUser);
  const tierConfig = TIER_CONFIGS[effectiveTier] || TIER_CONFIGS.free;

  const isHero = effectiveTier === 'hero' || effectiveTier === 'guild' || effectiveTier === 'developer';
  const isGuild = effectiveTier === 'guild' || effectiveTier === 'developer';
  const isLifetime = isDev || !!currentUser?.isLifetime;

  const canCreateCharacter = (currentCount: number): boolean => {
    if (tierConfig.characterLimit === -1) return true;
    return currentCount < tierConfig.characterLimit;
  };

  const openUpgradeModal = (reason?: string, requiredTier: 'hero' | 'guild' = 'hero') => {
    // Developers never need to upgrade
    if (isDev) return;
    setUpgradeReason(reason || 'Upgrade to unlock full unlimited Nexus TRPG potential');
    setUpgradeRequiredTier(requiredTier);
    setIsUpgradeModalOpen(true);
  };

  const closeUpgradeModal = () => {
    setIsUpgradeModalOpen(false);
    setUpgradeReason(null);
  };

  const upgradeToTier = async (
    newTier: SubscriptionTier,
    details?: { paypalTxId?: string; paypalEmail?: string; isLifetime?: boolean; tierExpiresAt?: string }
  ) => {
    if (!currentUser) return;
    
    // Save to Firestore
    await updateUserSubscriptionTier(currentUser.uid, newTier, details);

    // Update local state
    const updated: UserProfile = {
      ...currentUser,
      tier: newTier,
      paypalTxId: details?.paypalTxId || currentUser.paypalTxId,
      paypalEmail: details?.paypalEmail || currentUser.paypalEmail,
      isLifetime: details?.isLifetime !== undefined ? details.isLifetime : currentUser.isLifetime,
      tierExpiresAt: details?.tierExpiresAt || currentUser.tierExpiresAt
    };

    if (onUserUpdate) {
      onUserUpdate(updated);
    }
  };

  const contextValue = useMemo(() => ({
    currentUser,
    tier: effectiveTier,
    tierConfig,
    isDeveloper: isDev,
    isHero,
    isGuild,
    isLifetime,
    characterLimit: tierConfig.characterLimit,
    rollLogLimit: tierConfig.rollLogLimit,
    canCreateCharacter,
    hasCosmeticDice: tierConfig.hasCosmeticDice,
    hasCustomThemes: tierConfig.hasCustomThemes,
    hasPdfExport: tierConfig.hasPdfExport,
    hasCampaignGraphPro: tierConfig.hasCampaignGraphPro,
    hasDmLivePartyHud: tierConfig.hasDmLivePartyHud,
    hasPriorityAi: tierConfig.hasPriorityAi,
    isUpgradeModalOpen,
    upgradeReason,
    upgradeRequiredTier,
    openUpgradeModal,
    closeUpgradeModal,
    upgradeToTier
  }), [currentUser, effectiveTier, tierConfig, isDev, isHero, isGuild, isLifetime, isUpgradeModalOpen, upgradeReason, upgradeRequiredTier]);

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
