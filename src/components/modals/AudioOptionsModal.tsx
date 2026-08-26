import React from 'react';
import { OptionsModal } from './OptionsModal';
import { CharacterData, RuleEdition } from '../../types';
import { UserProfile } from '../../lib/firebase';

interface AudioOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: 'sound' | 'app' | 'layout' | 'character' | 'credits';
  currentUser?: UserProfile | null;
  activeCharacter?: CharacterData | null;
  onUpdateCharacter?: (char: CharacterData) => void;
  onSystemChange?: (edition: RuleEdition) => void;
  onExportJson?: () => void;
  onImportJson?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const AudioOptionsModal: React.FC<AudioOptionsModalProps> = (props) => {
  return <OptionsModal {...props} />;
};

export { OptionsModal };
export default AudioOptionsModal;
