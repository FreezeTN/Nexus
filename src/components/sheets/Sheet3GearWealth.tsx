import React, { useState } from 'react';
import { CharacterData, GearItem } from '../../types';
import { ShadowrunMatrixRiggingPanel } from '../shadowrun/ShadowrunMatrixRiggingPanel';
import { WealthCurrencyPanel } from './sheet3/WealthCurrencyPanel';
import { MagicAttunementPanel } from './sheet3/MagicAttunementPanel';
import { EncumbranceCapacityPanel } from './sheet3/EncumbranceCapacityPanel';
import { InventoryListPanel } from './sheet3/InventoryListPanel';
import { useLayoutCustomization } from '../../utils/layoutCustomization';
import { EmptyLayoutState } from '../common/EmptyLayoutState';
import { XpCraftAndSpellLedgerModal } from '../modals/XpCraftAndSpellLedgerModal';
import { CraftingWorkshop5eModal } from '../modals/CraftingWorkshop5eModal';
import { calculate35eMinLevelXpBuffer, isEncumbranceRuleActive, canCharacterCraftMagicItems, canCharacterCraft5e } from '../../utils/dndCalculations';
import { Hammer, Sparkles, Scroll, Coins, Shield, AlertTriangle } from 'lucide-react';

interface Sheet3Props {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onAddItemToInventory?: (item: GearItem, targetId?: string) => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
  onRollDamage?: (label: string, expression: string) => void;
  onOpenGenerators?: (tab?: 'npc' | 'encounter' | 'treasure' | 'session' | 'rules' | 'dungeon') => void;
  activeSession?: any;
}

export const Sheet3GearWealth: React.FC<Sheet3Props> = ({
  character,
  onUpdateCharacter,
  onAddItemToInventory,
  onRoll,
  onRollDamage,
  onOpenGenerators,
  activeSession
}) => {
  const { isVisible } = useLayoutCustomization();
  const isEncumbranceEnabled = isEncumbranceRuleActive(character, activeSession);

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

  const [showCraftingModal, setShowCraftingModal] = useState(false);
  const [showCraftingWorkshopOverride, setShowCraftingWorkshopOverride] = useState(false);
  const [showCrafting5eModal, setShowCrafting5eModal] = useState(false);
  const [showCrafting5eOverride, setShowCrafting5eOverride] = useState(false);
  const canCraft = canCharacterCraftMagicItems(character);
  const canCraft5e = canCharacterCraft5e(character);
  const xpBuffer = character.edition === '3.5e' ? calculate35eMinLevelXpBuffer(character) : null;

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

      {/* SECTION 2: Magic Item Attunement Slots (5e) OR Magic Item Crafting & XP Ledger (3.5e) */}
      {showAttunement && (
        character.edition === '3.5e' ? (
          (canCraft || showCraftingWorkshopOverride) ? (
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 md:p-5 shadow-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <Hammer className="w-5 h-5 text-amber-500" />
                  <div>
                    <h3 className="font-serif font-bold text-stone-100 text-base">
                      Magic Item Creation & Crafting Workshop (3.5e RAW)
                    </h3>
                    <p className="text-[11px] text-stone-400">
                      PHB p. 113 & DMG p. 282. Item creation consumes 1/25th base price in XP and 1/2 in raw materials.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCraftingModal(true)}
                  className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-md cursor-pointer"
                >
                  <Hammer className="w-4 h-4" />
                  <span>Open Crafting & Spell XP Ledger</span>
                </button>
              </div>

              {xpBuffer && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                  <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800">
                    <span className="text-stone-400 block text-[10px] uppercase">Total XP</span>
                    <span className="text-sm font-bold text-stone-200">
                      {(character.experiencePoints || 0).toLocaleString()} XP
                    </span>
                  </div>
                  <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800">
                    <span className="text-stone-400 block text-[10px] uppercase">Lvl {character.level || 1} Minimum Floor</span>
                    <span className="text-sm font-bold text-stone-400">
                      {xpBuffer.levelMinXp.toLocaleString()} XP
                    </span>
                    <span className="text-[9px] text-stone-500 block">XP threshold cannot drop below</span>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${
                    xpBuffer.expendableXp > 0
                      ? 'bg-amber-950/40 border-amber-600/50'
                      : 'bg-rose-950/40 border-rose-700/50'
                  }`}>
                    <span className="text-stone-400 block text-[10px] uppercase">Expendable XP Buffer</span>
                    <span className={`text-sm font-bold ${
                      xpBuffer.expendableXp > 0 ? 'text-amber-300' : 'text-rose-400'
                    }`}>
                      {xpBuffer.expendableXp.toLocaleString()} XP
                    </span>
                    <span className="text-[9px] text-stone-400 block">
                      {xpBuffer.expendableXp > 0 ? 'Available for Crafting/Spells' : 'Must level or gain XP to craft'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-stone-900/60 border border-stone-800/80 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-500">
                  <Hammer className="w-4 h-4 text-stone-400" />
                </div>
                <div>
                  <span className="font-serif font-bold text-stone-300 block text-xs">
                    Magic Item Creation & Crafting Workshop (3.5e RAW)
                  </span>
                  <span className="text-[11px] text-stone-500">
                    {character.name} does not currently possess Item Creation feats (Scribe Scroll, Brew Potion, Craft Wondrous Item, etc.).
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCraftingWorkshopOverride(true)}
                  className="px-3 py-1.5 bg-stone-950 hover:bg-stone-800 border border-stone-800 hover:border-amber-600/50 text-stone-300 text-xs font-mono rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <Hammer className="w-3.5 h-3.5 text-amber-500" />
                  <span>Open Workshop</span>
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="space-y-3">
            <MagicAttunementPanel
              character={character}
              onUpdateCharacter={onUpdateCharacter}
            />

            {/* 5e Downtime & Crafting Workshop Quick Panel */}
            {(canCraft5e || showCrafting5eOverride) ? (
              <div className="bg-stone-900/80 border border-amber-600/40 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-950 border border-amber-500/70 flex items-center justify-center text-amber-400 shrink-0">
                    <Hammer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-serif font-black text-amber-200 uppercase tracking-wider">
                      Downtime & Crafting Workshop (5e RAW)
                    </h3>
                    <p className="text-[11px] text-stone-400">
                      Brew Potions of Healing, Scribe Spell Scrolls, and Craft Magic Items (XGtE p. 128–134)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCrafting5eModal(true)}
                  className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-md cursor-pointer"
                >
                  <Hammer className="w-4 h-4" />
                  <span>Open Crafting Workshop</span>
                </button>
              </div>
            ) : (
              <div className="bg-stone-900/60 border border-stone-800/80 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-500">
                    <Hammer className="w-4 h-4 text-stone-400" />
                  </div>
                  <div>
                    <span className="font-serif font-bold text-stone-300 block text-xs">
                      Downtime & Crafting Workshop (5e RAW)
                    </span>
                    <span className="text-[11px] text-stone-500">
                      {character.name} does not currently have tool proficiencies or spellcasting recorded.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCrafting5eOverride(true)}
                  className="px-3 py-1.5 bg-stone-950 hover:bg-stone-800 border border-stone-800 hover:border-amber-600/50 text-stone-300 text-xs font-mono rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <Hammer className="w-3.5 h-3.5 text-amber-500" />
                  <span>Open Workshop</span>
                </button>
              </div>
            )}
          </div>
        )
      )}

      {/* 3.5e XP Crafting & Spell Ledger Modal */}
      {character.edition === '3.5e' && (
        <XpCraftAndSpellLedgerModal
          isOpen={showCraftingModal}
          onClose={() => setShowCraftingModal(false)}
          character={character}
          onUpdateCharacter={onUpdateCharacter}
        />
      )}

      {/* 5e Downtime & Crafting Workshop Modal */}
      {character.edition !== '3.5e' && (
        <CraftingWorkshop5eModal
          isOpen={showCrafting5eModal}
          onClose={() => setShowCrafting5eModal(false)}
          character={character}
          onUpdateCharacter={onUpdateCharacter}
        />
      )}

      {/* SECTION 3: Carrying Capacity & Encumbrance */}
      {showEncumbrance && isEncumbranceEnabled && (
        <EncumbranceCapacityPanel
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          activeSession={activeSession}
        />
      )}

      {/* SECTION 4: Inventory Equipment List */}
      {showInventory && (
        <InventoryListPanel
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          onAddItemToInventory={onAddItemToInventory}
          onRollDamage={onRollDamage}
        />
      )}
    </div>
  );
};
