import React from 'react';
import { useSubscription } from '../../context/SubscriptionContext';
import { UpgradeModal } from './UpgradeModal';

interface GlobalUpgradeModalProps {
  onOpenAuthModal?: () => void;
}

export const GlobalUpgradeModal: React.FC<GlobalUpgradeModalProps> = ({
  onOpenAuthModal
}) => {
  const {
    isUpgradeModalOpen,
    closeUpgradeModal,
    upgradeReason,
    upgradeRequiredTier
  } = useSubscription();

  return (
    <UpgradeModal
      isOpen={isUpgradeModalOpen}
      onClose={closeUpgradeModal}
      onOpenAuthModal={onOpenAuthModal}
      defaultTier={upgradeRequiredTier}
      reason={upgradeReason || undefined}
    />
  );
};
