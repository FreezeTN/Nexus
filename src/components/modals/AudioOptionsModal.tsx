import React from 'react';
import { OptionsModal } from './OptionsModal';
import { CharacterData, RuleEdition } from '../../types';
import { UserProfile, GameSession } from '../../lib/firebase';

interface AudioOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: 'sound' | 'app' | 'layout' | 'character' | 'hotkeys' | 'subscription' | 'credits';
  currentUser?: UserProfile | null;
  activeSession?: GameSession | null;
  activeCharacter?: CharacterData | null;
  onUpdateCharacter?: (char: CharacterData) => void;
  onSystemChange?: (edition: RuleEdition) => void;
  onExportJson?: () => void;
  onImportJson?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenUpgradeModal?: () => void;
  onOpenAuthModal?: () => void;
  onOpenUniversalImporterStudio?: () => void;
}

export const AudioOptionsModal: React.FC<AudioOptionsModalProps> = (props) => {
  return <OptionsModal {...props} />;
};

export { OptionsModal };
export default AudioOptionsModal;
