import React, { useState } from 'react';
import { CharacterData, GearItem } from '../../types';
import { deductGoldFromWealth, getTotalWealthInGold } from '../../utils/dndCalculations';
import { X, Hammer, FlaskConical, Scroll, Sparkles, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

interface CraftingWorkshop5eModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onUpdateCharacter: (character: CharacterData) => void;
}

type CraftingCategory = 'potions' | 'scrolls' | 'magic_items' | 'mundane';

interface CraftingPreset {
  id: string;
  name: string;
  costGp: number;
  timeDisplay: string;
  minLevel?: number;
  itemType: GearItem['itemType'];
  description: string;
  toolReq: string;
}

const HEALING_POTION_PRESETS: CraftingPreset[] = [
  {
    id: 'potion_healing',
    name: 'Potion of Healing',
    costGp: 25,
    timeDisplay: '1 day (8 hours)',
    itemType: 'Potion',
    description: 'Regains 2d4 + 2 Hit Points. Standard magical draught.',
    toolReq: 'Herbalism Kit'
  },
  {
    id: 'potion_greater_healing',
    name: 'Potion of Greater Healing',
    costGp: 100,
    timeDisplay: '1 workweek (5 days)',
    itemType: 'Potion',
    description: 'Regains 4d4 + 4 Hit Points.',
    toolReq: 'Herbalism Kit'
  },
  {
    id: 'potion_superior_healing',
    name: 'Potion of Superior Healing',
    costGp: 1000,
    timeDisplay: '3 workweeks (15 days)',
    minLevel: 6,
    itemType: 'Potion',
    description: 'Regains 8d4 + 8 Hit Points.',
    toolReq: 'Herbalism Kit'
  },
  {
    id: 'potion_supreme_healing',
    name: 'Potion of Supreme Healing',
    costGp: 10000,
    timeDisplay: '4 workweeks (20 days)',
    minLevel: 11,
    itemType: 'Potion',
    description: 'Regains 10d4 + 20 Hit Points.',
    toolReq: 'Herbalism Kit'
  }
];

const SCROLL_PRESETS: CraftingPreset[] = [
  {
    id: 'scroll_cantrip',
    name: 'Spell Scroll (Cantrip)',
    costGp: 15,
    timeDisplay: '1 day',
    itemType: 'Scroll',
    description: 'Contains a Cantrip ready to cast. Save DC 13, Attack +5.',
    toolReq: "Calligrapher's Supplies / Arcana"
  },
  {
    id: 'scroll_1st',
    name: 'Spell Scroll (1st Level)',
    costGp: 25,
    timeDisplay: '1 day',
    itemType: 'Scroll',
    description: 'Contains a 1st-level spell ready to cast. Save DC 13, Attack +5.',
    toolReq: "Calligrapher's Supplies / Arcana"
  },
  {
    id: 'scroll_2nd',
    name: 'Spell Scroll (2nd Level)',
    costGp: 250,
    timeDisplay: '3 days',
    minLevel: 3,
    itemType: 'Scroll',
    description: 'Contains a 2nd-level spell ready to cast. Save DC 13, Attack +5.',
    toolReq: "Calligrapher's Supplies / Arcana"
  },
  {
    id: 'scroll_3rd',
    name: 'Spell Scroll (3rd Level)',
    costGp: 500,
    timeDisplay: '1 workweek (5 days)',
    minLevel: 5,
    itemType: 'Scroll',
    description: 'Contains a 3rd-level spell ready to cast. Save DC 15, Attack +7.',
    toolReq: "Calligrapher's Supplies / Arcana"
  },
  {
    id: 'scroll_4th',
    name: 'Spell Scroll (4th Level)',
    costGp: 2500,
    timeDisplay: '2 workweeks (10 days)',
    minLevel: 7,
    itemType: 'Scroll',
    description: 'Contains a 4th-level spell ready to cast. Save DC 15, Attack +7.',
    toolReq: "Calligrapher's Supplies / Arcana"
  },
  {
    id: 'scroll_5th',
    name: 'Spell Scroll (5th Level)',
    costGp: 5000,
    timeDisplay: '4 workweeks (20 days)',
    minLevel: 9,
    itemType: 'Scroll',
    description: 'Contains a 5th-level spell ready to cast. Save DC 17, Attack +9.',
    toolReq: "Calligrapher's Supplies / Arcana"
  }
];

const MAGIC_ITEM_RARITY_PRESETS: CraftingPreset[] = [
  {
    id: 'magic_common',
    name: 'Common Magic Item (Formula)',
    costGp: 50,
    timeDisplay: '1 workweek (5 days)',
    minLevel: 1,
    itemType: 'Wondrous Item',
    description: 'E.g., Clockwork Amulet, Cloak of Billowing, Potion of Climbing.',
    toolReq: 'Appropriate Tool / Formula'
  },
  {
    id: 'magic_uncommon',
    name: 'Uncommon Magic Item (Formula)',
    costGp: 200,
    timeDisplay: '2 workweeks (10 days)',
    minLevel: 3,
    itemType: 'Wondrous Item',
    description: 'E.g., Bag of Holding, Weapon +1, Boots of Elvenkind, Cloak of Protection.',
    toolReq: 'Appropriate Tool / Formula'
  },
  {
    id: 'magic_rare',
    name: 'Rare Magic Item (Formula)',
    costGp: 2000,
    timeDisplay: '10 workweeks (50 days)',
    minLevel: 6,
    itemType: 'Wondrous Item',
    description: 'E.g., Cloak of the Bat, Flame Tongue, Ring of Protection, Weapon +2.',
    toolReq: 'Appropriate Tool / Exotic Ingredient'
  },
  {
    id: 'magic_very_rare',
    name: 'Very Rare Magic Item (Formula)',
    costGp: 20000,
    timeDisplay: '25 workweeks (125 days)',
    minLevel: 11,
    itemType: 'Wondrous Item',
    description: 'E.g., Animated Shield, Frost Brand, Manual of Gainful Exercise.',
    toolReq: 'Appropriate Tool / CR 13+ Monster Material'
  },
  {
    id: 'magic_legendary',
    name: 'Legendary Magic Item (Formula)',
    costGp: 100000,
    timeDisplay: '50 workweeks (250 days)',
    minLevel: 17,
    itemType: 'Wondrous Item',
    description: 'E.g., Holy Avenger, Luck Blade, Ring of Three Wishes.',
    toolReq: 'Appropriate Tool / CR 19+ Monster Material'
  }
];

export const CraftingWorkshop5eModal: React.FC<CraftingWorkshop5eModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdateCharacter
}) => {
  if (!isOpen) return null;

  const [category, setCategory] = useState<CraftingCategory>('potions');
  const [selectedPreset, setSelectedPreset] = useState<CraftingPreset>(HEALING_POTION_PRESETS[0]);
  const [customItemName, setCustomItemName] = useState('');
  const [customCostGp, setCustomCostGp] = useState<number>(25);
  const [customTime, setCustomTime] = useState('1 day');
  const [customDescription, setCustomDescription] = useState('');
  const [autoDeductGold, setAutoDeductGold] = useState(true);
  const [addToInventory, setAddToInventory] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const availableGold = getTotalWealthInGold(character);
  const charLevel = character.level || 1;

  const handleSelectPreset = (preset: CraftingPreset) => {
    setSelectedPreset(preset);
    setCustomItemName(preset.name);
    setCustomCostGp(preset.costGp);
    setCustomTime(preset.timeDisplay);
    setCustomDescription(preset.description);
    setStatusMessage(null);
  };

  const handleCompleteCrafting = () => {
    const finalName = customItemName.trim() || selectedPreset.name;
    const finalCost = Math.max(0, customCostGp);

    // Gold check if auto-deducting
    let updatedWealth = character.wealth;
    if (autoDeductGold && finalCost > 0) {
      const deduction = deductGoldFromWealth(finalCost, character.wealth);
      if (!deduction.success) {
        setStatusMessage({
          text: `Insufficient wealth! Crafting requires ${finalCost.toLocaleString()} GP, but you only have ${availableGold.toLocaleString()} GP available.`,
          type: 'error'
        });
        return;
      }
      updatedWealth = deduction.updatedWealth;
    }

    // Add to inventory
    let updatedInventory = character.inventory || [];
    if (addToInventory) {
      const newItem: GearItem = {
        id: `crafted_${Date.now()}`,
        name: finalName,
        quantity: 1,
        weight: selectedPreset.itemType === 'Scroll' ? 0.1 : selectedPreset.itemType === 'Potion' ? 0.5 : 1,
        costGp: finalCost,
        itemType: selectedPreset.itemType,
        notes: `${customDescription || selectedPreset.description} (Crafted in downtime: ${customTime})`,
        equipped: false
      };
      updatedInventory = [...updatedInventory, newItem];
    }

    onUpdateCharacter({
      ...character,
      wealth: updatedWealth,
      inventory: updatedInventory
    });

    setStatusMessage({
      text: `Successfully crafted "${finalName}"!${autoDeductGold ? ` Deducted ${finalCost} GP.` : ''}${addToInventory ? ' Item placed in your Inventory.' : ''}`,
      type: 'success'
    });
  };

  const currentPresets =
    category === 'potions'
      ? HEALING_POTION_PRESETS
      : category === 'scrolls'
      ? SCROLL_PRESETS
      : category === 'magic_items'
      ? MAGIC_ITEM_RARITY_PRESETS
      : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-stone-900 border border-amber-600/50 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-stone-900 p-4 border-b border-amber-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-500/80 flex items-center justify-center text-amber-400">
              <Hammer className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-black text-amber-200">
                5e Downtime & Crafting Workshop
              </h2>
              <p className="text-xs text-stone-400">
                Xanathar's Guide to Everything (XGE p. 128–134) & PHB Crafting Rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wealth Bar */}
        <div className="bg-stone-950 px-5 py-2.5 border-b border-stone-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-stone-400">Character Purse:</span>
            <span className="font-bold text-amber-400">{availableGold.toLocaleString()} GP Total</span>
          </div>
          <div className="text-[11px] text-stone-400">
            Character Level: <strong className="text-stone-200">{charLevel}</strong>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-stone-800 bg-stone-950/60 p-1.5 gap-1.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setCategory('potions');
              handleSelectPreset(HEALING_POTION_PRESETS[0]);
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              category === 'potions'
                ? 'bg-amber-600 text-stone-950 font-bold shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Healing Potions</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCategory('scrolls');
              handleSelectPreset(SCROLL_PRESETS[0]);
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              category === 'scrolls'
                ? 'bg-amber-600 text-stone-950 font-bold shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <Scroll className="w-3.5 h-3.5" />
            <span>Scribe Scrolls</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCategory('magic_items');
              handleSelectPreset(MAGIC_ITEM_RARITY_PRESETS[0]);
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              category === 'magic_items'
                ? 'bg-amber-600 text-stone-950 font-bold shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Magic Items</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCategory('mundane');
              setSelectedPreset({
                id: 'mundane_custom',
                name: 'Custom Mundane Gear',
                costGp: 10,
                timeDisplay: '2 days (5 gp/day)',
                itemType: 'Gear',
                description: 'Mundane armor, weapon, or gear. Materials cost is ½ market value.',
                toolReq: "Artisan's Tools"
              });
              setCustomItemName('Plate Armor (Mundane Craft)');
              setCustomCostGp(750);
              setCustomTime('150 days (5 gp / day)');
              setCustomDescription('Crafted using Smith\'s Tools over downtime.');
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              category === 'mundane'
                ? 'bg-amber-600 text-stone-950 font-bold shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Mundane Equipment</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm flex-1">
          {/* Preset Buttons */}
          {category !== 'mundane' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-300 block uppercase font-mono">
                Select Formula / Recipe:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentPresets.map((preset) => {
                  const isSelected = selectedPreset.id === preset.id;
                  const levelLocked = (preset.minLevel || 1) > charLevel;

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-amber-950/60 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-xs text-stone-200 truncate">{preset.name}</span>
                        <span className="font-mono text-[11px] text-amber-400 font-bold ml-1 shrink-0">
                          {preset.costGp.toLocaleString()} GP
                        </span>
                      </div>
                      <div className="flex items-center justify-between w-full text-[10px] mt-1 font-mono text-stone-500">
                        <span>⏳ {preset.timeDisplay}</span>
                        {preset.minLevel && (
                          <span className={levelLocked ? 'text-rose-400 font-bold' : 'text-stone-400'}>
                            Min Lvl {preset.minLevel}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Details & Customize Form */}
          <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-3">
            <span className="text-xs font-bold text-stone-300 block uppercase font-mono">
              Crafting Configuration
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-stone-400 font-medium block mb-1">Item Name</label>
                <input
                  type="text"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-stone-400 font-medium block mb-1">
                  Gold Pieces (GP) Required
                </label>
                <input
                  type="number"
                  min="0"
                  value={customCostGp}
                  onChange={(e) => setCustomCostGp(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono font-bold focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-stone-400 font-medium block mb-1">Downtime Required</label>
                <input
                  type="text"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-300 font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-stone-400 font-medium block mb-1">Required Tool / Proficiency</label>
                <div className="w-full bg-stone-900/60 border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-400 font-mono">
                  {selectedPreset.toolReq}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-stone-400 font-medium block mb-1">Item Effect / Description</label>
              <textarea
                rows={2}
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-300 focus:ring-1 focus:ring-amber-500 focus:outline-none resize-none"
              />
            </div>

            {/* Checkbox Options */}
            <div className="pt-2 border-t border-stone-800 space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoDeductGold}
                  onChange={(e) => setAutoDeductGold(e.target.checked)}
                  className="rounded accent-amber-500"
                />
                <span className="text-stone-300">
                  Deduct <strong className="text-amber-400">{customCostGp.toLocaleString()} GP</strong> automatically from character wealth
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addToInventory}
                  onChange={(e) => setAddToInventory(e.target.checked)}
                  className="rounded accent-amber-500"
                />
                <span className="text-stone-300">
                  Add finished item directly to character inventory
                </span>
              </label>
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                  : 'bg-red-950/80 border-red-500 text-red-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between">
          <div className="text-xs font-mono text-stone-400">
            <span>Cost: </span>
            <strong className="text-amber-400">{customCostGp.toLocaleString()} GP</strong>
            <span className="mx-1.5">•</span>
            <span>Time: </span>
            <strong className="text-stone-200">{customTime}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCompleteCrafting}
              className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold rounded-xl shadow-lg transition flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <Hammer className="w-3.5 h-3.5" />
              <span>Complete Crafting</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
