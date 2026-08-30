import React from 'react';
import { CharacterData } from '../../types';
import { ShadowrunMatrixRiggingPanel } from '../shadowrun/ShadowrunMatrixRiggingPanel';
import { WealthCurrencyPanel } from './sheet3/WealthCurrencyPanel';
import { MagicAttunementPanel } from './sheet3/MagicAttunementPanel';
import { EncumbranceCapacityPanel } from './sheet3/EncumbranceCapacityPanel';
import { InventoryListPanel } from './sheet3/InventoryListPanel';
import { useLayoutCustomization } from '../../utils/layoutCustomization';
import { EmptyLayoutState } from '../common/EmptyLayoutState';

interface Sheet3Props {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
  onRollDamage?: (label: string, expression: string) => void;
  onOpenGenerators?: (tab?: 'npc' | 'encounter' | 'treasure' | 'session' | 'rules' | 'dungeon') => void;
}

export const Sheet3GearWealth: React.FC<Sheet3Props> = ({
  character,
  onUpdateCharacter,
  onRoll,
  onRollDamage,
  onOpenGenerators
}) => {
  const { isVisible } = useLayoutCustomization();

  if (character.edition === 'shadowrun') {
    if (!isVisible('sr_matrix')) {
      return <EmptyLayoutState sheetName="Gear & Matrix" />;
    }
    return (
      <ShadowrunMatrixRiggingPanel
        character={character}
        onUpdateCharacter={onUpdateCharacter}
        onRollPool={(label, pool) => onRoll ? onRoll(label, 6, pool, 0, 'normal') : undefined}
      />
    );
  }

  const showWealth = isVisible('s3_wealthCurrency');
  const showAttunement = isVisible('s3_magicAttunement');
  const showEncumbrance = isVisible('s3_encumbrance');
  const showInventory = isVisible('s3_inventoryList');

  const hasAnyVisible = showWealth || showAttunement || showEncumbrance || showInventory;

  if (!hasAnyVisible) {
    return <EmptyLayoutState sheetName="Gear & Wealth" />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* SECTION 1: Wealth & Currency */}
      {showWealth && (
        <WealthCurrencyPanel
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          onOpenGenerators={onOpenGenerators}
        />
      )}

      {/* SECTION 2: Magic Item Attunement Slots */}
      {showAttunement && (
        <MagicAttunementPanel
          character={character}
          onUpdateCharacter={onUpdateCharacter}
        />
      )}

      {/* SECTION 3: Carrying Capacity & Encumbrance */}
      {showEncumbrance && (
        <EncumbranceCapacityPanel
          character={character}
        />
      )}

      {/* SECTION 4: Inventory Equipment List */}
      {showInventory && (
        <InventoryListPanel
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          onRollDamage={onRollDamage}
        />
      )}
    </div>
  );
};
