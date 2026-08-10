import React from 'react';
import { CharacterData } from '../../types';
import { ShadowrunMatrixRiggingPanel } from '../shadowrun/ShadowrunMatrixRiggingPanel';
import { WealthCurrencyPanel } from './sheet3/WealthCurrencyPanel';
import { MagicAttunementPanel } from './sheet3/MagicAttunementPanel';
import { EncumbranceCapacityPanel } from './sheet3/EncumbranceCapacityPanel';
import { InventoryListPanel } from './sheet3/InventoryListPanel';

interface Sheet3Props {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
  onRollDamage?: (label: string, expression: string) => void;
}

export const Sheet3GearWealth: React.FC<Sheet3Props> = ({
  character,
  onUpdateCharacter,
  onRoll,
  onRollDamage
}) => {
  if (character.edition === 'shadowrun') {
    return (
      <ShadowrunMatrixRiggingPanel
        character={character}
        onUpdateCharacter={onUpdateCharacter}
        onRollPool={(label, pool) => onRoll ? onRoll(label, 6, pool, 0, 'normal') : undefined}
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

      {/* SECTION 2: Magic Item Attunement Slots */}
      <MagicAttunementPanel
        character={character}
        onUpdateCharacter={onUpdateCharacter}
      />

      {/* SECTION 3: Carrying Capacity & Encumbrance */}
      <EncumbranceCapacityPanel
        character={character}
      />

      {/* SECTION 4: Inventory Equipment List */}
      <InventoryListPanel
        character={character}
        onUpdateCharacter={onUpdateCharacter}
        onRollDamage={onRollDamage}
      />
    </div>
  );
};
