import React from 'react';
import { CharacterData } from '../../types';
import { ShadowrunMatrixRiggingPanel } from '../shadowrun/ShadowrunMatrixRiggingPanel';
import { WealthCurrencyPanel } from './sheet3/WealthCurrencyPanel';
import { EncumbranceCapacityPanel } from './sheet3/EncumbranceCapacityPanel';
import { InventoryListPanel } from './sheet3/InventoryListPanel';

interface Sheet3Props {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRollDamage?: (label: string, expression: string) => void;
}

export const Sheet3GearWealth: React.FC<Sheet3Props> = ({
  character,
  onUpdateCharacter,
  onRollDamage
}) => {
  if (character.edition === 'shadowrun') {
    return (
      <ShadowrunMatrixRiggingPanel
        character={character}
        onUpdateCharacter={onUpdateCharacter}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* SECTION 1: Wealth & Currency */}
      <WealthCurrencyPanel
        character={character}
        onUpdateCharacter={onUpdateCharacter}
      />

      {/* SECTION 2: Carrying Capacity & Encumbrance */}
      <EncumbranceCapacityPanel
        character={character}
      />

      {/* SECTION 3: Inventory Equipment List */}
      <InventoryListPanel
        character={character}
        onUpdateCharacter={onUpdateCharacter}
        onRollDamage={onRollDamage}
      />
    </div>
  );
};
