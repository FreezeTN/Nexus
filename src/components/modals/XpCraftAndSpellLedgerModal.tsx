import React, { useState } from 'react';
import { CharacterData } from '../../types';
import {
  calculate35eItemCraftingCost,
  calculate35eMinLevelXpBuffer,
  DND35E_XP_SPELLS,
  PresetXpSpell,
  deductGoldFromWealth,
  formatWealthDetailed
} from '../../utils/dndCalculations';
import {
  Sparkles,
  X,
  Coins,
  Scroll,
  Hammer,
  History,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Wand2,
  Shield,
  Clock
} from 'lucide-react';

interface XpCraftAndSpellLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
}

export const XpCraftAndSpellLedgerModal: React.FC<XpCraftAndSpellLedgerModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdateCharacter
}) => {
  if (!isOpen) return null;

  const xpBuffer = calculate35eMinLevelXpBuffer(character);
  const [activeTab, setActiveTab] = useState<'craft' | 'spells' | 'ledger'>('craft');

  // Crafting state
  const [craftType, setCraftType] = useState<'scroll' | 'potion' | 'wand' | 'wondrous' | 'arms_armor'>('scroll');
  const [craftSpellLevel, setCraftSpellLevel] = useState<number>(1);
  const [craftCasterLevel, setCraftCasterLevel] = useState<number>(Math.max(1, character.casterLevelOverride || character.level || 1));
  const [craftItemName, setCraftItemName] = useState<string>('Scroll of Fireball');
  const [craftBasePrice, setCraftBasePrice] = useState<number>(1000);

  // Spell state
  const [selectedSpellIndex, setSelectedSpellIndex] = useState<number>(0);
  const [customSpellXp, setCustomSpellXp] = useState<number>(500);

  const craftCalc = calculate35eItemCraftingCost(
    craftType,
    craftSpellLevel,
    craftCasterLevel,
    craftType === 'wondrous' || craftType === 'arms_armor' ? craftBasePrice : undefined
  );

  const selectedPresetSpell = DND35E_XP_SPELLS[selectedSpellIndex] || DND35E_XP_SPELLS[0];

  const handleCraftItem = () => {
    if (xpBuffer.expendableXp < craftCalc.xpCost) return;

    const deduction = deductGoldFromWealth(craftCalc.rawMaterialsGp, character.wealth);
    const nextGp = deduction.updatedWealth;
    const nextXp = Math.max(0, (character.experiencePoints || 0) - craftCalc.xpCost);

    const newItem = {
      id: `crafted-${Date.now()}`,
      name: craftItemName.trim() || `Crafted ${craftType}`,
      quantity: 1,
      weight: craftType === 'scroll' ? 0.1 : craftType === 'potion' ? 0.5 : 1,
      cost: `${craftCalc.basePriceGp} gp`,
      notes: `Crafted (Cost ${craftCalc.rawMaterialsGp} gp & ${craftCalc.xpCost} XP, ${craftCalc.craftingDays} days)`,
      equipped: false,
      stored: false,
      isMagic: true
    };

    const ledgerEntry = {
      id: `ledger-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      type: 'craft' as const,
      description: `Crafted ${newItem.name} (${craftCalc.craftingDays} days)`,
      xpAmount: -craftCalc.xpCost,
      goldCost: craftCalc.rawMaterialsGp
    };

    onUpdateCharacter({
      ...character,
      experiencePoints: nextXp,
      totalXpSpentOnCrafting: (character.totalXpSpentOnCrafting || 0) + craftCalc.xpCost,
      wealth: deduction.updatedWealth,
      inventory: [...(character.inventory || []), newItem],
      xpLedger: [ledgerEntry, ...(character.xpLedger || [])]
    });
  };

  const handleCastXpSpell = (spell: PresetXpSpell, customCost?: number) => {
    const cost = customCost !== undefined ? customCost : spell.xpCost;
    if (xpBuffer.expendableXp < cost) return;

    const nextXp = Math.max(0, (character.experiencePoints || 0) - cost);
    const ledgerEntry = {
      id: `ledger-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      type: 'spell' as const,
      description: `Cast ${spell.name} (XP component consumed)`,
      xpAmount: -cost,
      goldCost: spell.materialCostGp
    };

    onUpdateCharacter({
      ...character,
      experiencePoints: nextXp,
      totalXpSpentOnSpells: (character.totalXpSpentOnSpells || 0) + cost,
      xpLedger: [ledgerEntry, ...(character.xpLedger || [])]
    });
  };

  const handleClearLedger = () => {
    onUpdateCharacter({
      ...character,
      xpLedger: []
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950/80 via-stone-900 to-stone-900 p-4 border-b border-amber-900/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-100 flex items-center gap-2">
                XP-to-Craft & Spell XP Ledger
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-amber-950/80 border border-amber-800/60 text-amber-300 rounded-full font-bold">
                  D&D 3.5e
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Magic item creation costs (1/25th base price) & spell XP components
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Character XP Reserve Bar */}
        <div className="p-3.5 bg-stone-950/80 border-b border-stone-800 shrink-0 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div>
              <span className="text-stone-400">Current XP: </span>
              <span className="text-stone-100 font-bold">{xpBuffer.currentXp.toLocaleString()}</span>
              <span className="text-stone-500 text-[10px]"> (Level {character.level} Floor: {xpBuffer.levelMinXp.toLocaleString()} XP)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-stone-400">Expendable XP Buffer:</span>
              <span className={`font-bold px-2 py-0.5 rounded ${
                xpBuffer.expendableXp > 0 ? 'bg-amber-950 text-amber-300 border border-amber-800/50' : 'bg-red-950 text-red-300'
              }`}>
                {xpBuffer.expendableXp.toLocaleString()} XP
              </span>
            </div>
          </div>
          <div className="text-[10px] text-stone-500 font-mono">
            3.5e Rule: A character cannot spend XP that would lower their total experience below the minimum for their current level.
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 px-4 pt-2.5 border-b border-stone-800 bg-stone-950/40 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('craft')}
            className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'craft'
                ? 'border-amber-500 text-amber-300 bg-stone-800/60'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Hammer className="w-3.5 h-3.5" />
            <span>Magic Item Crafting</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('spells')}
            className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'spells'
                ? 'border-amber-500 text-amber-300 bg-stone-800/60'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>High-Level XP Spells</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'ledger'
                ? 'border-amber-500 text-amber-300 bg-stone-800/60'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>XP History Ledger ({character.xpLedger?.length || 0})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'craft' ? (
            /* Item Crafting Engine */
            <div className="space-y-4">
              {/* Type Select */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'scroll', label: 'Scroll', icon: Scroll },
                  { id: 'potion', label: 'Potion', icon: Sparkles },
                  { id: 'wand', label: 'Wand (50)', icon: Wand2 },
                  { id: 'wondrous', label: 'Wondrous', icon: Sparkles },
                  { id: 'arms_armor', label: 'Arms & Armor', icon: Shield }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = craftType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCraftType(item.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                        isSelected
                          ? 'bg-amber-950/80 border-amber-600/50 text-amber-200'
                          : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Item Parameters Form */}
              <div className="bg-stone-950/60 border border-stone-800 p-4 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-bold text-stone-300 uppercase tracking-wider block">
                      Item Name
                    </label>
                    <input
                      type="text"
                      value={craftItemName}
                      onChange={(e) => setCraftItemName(e.target.value)}
                      placeholder="e.g. Scroll of Haste, Wand of Magic Missile"
                      className="w-full bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-amber-500"
                    />
                  </div>

                  {craftType === 'wondrous' || craftType === 'arms_armor' ? (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-300 uppercase tracking-wider block">
                        Base Market Price (GP)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={craftBasePrice}
                        onChange={(e) => setCraftBasePrice(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded-lg px-3 py-2 font-mono outline-none focus:border-amber-500"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-stone-300 uppercase tracking-wider block">
                          Spell Level
                        </label>
                        <select
                          value={craftSpellLevel}
                          onChange={(e) => setCraftSpellLevel(parseInt(e.target.value, 10))}
                          className="w-full bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded-lg px-3 py-2 font-mono outline-none focus:border-amber-500"
                        >
                          <option value="0">Cantrip / 0 Level</option>
                          {Array.from({ length: craftType === 'potion' ? 3 : craftType === 'wand' ? 4 : 9 }).map((_, idx) => (
                            <option key={idx + 1} value={idx + 1}>
                              Level {idx + 1}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>

                {craftType !== 'wondrous' && craftType !== 'arms_armor' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-300 uppercase tracking-wider block">
                        Caster Level (CL)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={craftCasterLevel}
                        onChange={(e) => setCraftCasterLevel(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded-lg px-3 py-2 font-mono outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-300 uppercase tracking-wider block">
                        Formula Explanation
                      </label>
                      <div className="text-[11px] text-stone-400 font-mono bg-stone-900 p-2 rounded-lg border border-stone-800">
                        Base: {craftType === 'scroll' ? 'Level × CL × 25 gp' : craftType === 'potion' ? 'Level × CL × 50 gp' : 'Level × CL × 750 gp'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cost Summary & Craft Button */}
              <div className="bg-stone-950/80 border border-amber-900/40 p-4 rounded-xl space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-stone-900 p-2.5 rounded-lg border border-stone-800">
                    <span className="text-[10px] text-stone-400 uppercase font-mono block">Base Market Price</span>
                    <span className="text-sm font-mono font-bold text-stone-200">{craftCalc.basePriceGp.toLocaleString()} gp</span>
                  </div>
                  <div className="bg-stone-900 p-2.5 rounded-lg border border-stone-800">
                    <span className="text-[10px] text-stone-400 uppercase font-mono block">Raw Materials (50%)</span>
                    <span className="text-sm font-mono font-bold text-amber-400">{craftCalc.rawMaterialsGp.toLocaleString()} gp</span>
                  </div>
                  <div className="bg-stone-900 p-2.5 rounded-lg border border-stone-800">
                    <span className="text-[10px] text-stone-400 uppercase font-mono block">XP Cost (1/25th)</span>
                    <span className="text-sm font-mono font-bold text-purple-400">{craftCalc.xpCost.toLocaleString()} XP</span>
                  </div>
                  <div className="bg-stone-900 p-2.5 rounded-lg border border-stone-800">
                    <span className="text-[10px] text-stone-400 uppercase font-mono block">Crafting Time</span>
                    <span className="text-sm font-mono font-bold text-stone-200">{craftCalc.craftingDays} {craftCalc.craftingDays === 1 ? 'Day' : 'Days'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-stone-400 font-mono">
                    Purse: <span className="text-amber-400 font-bold">{formatWealthDetailed(character.wealth).displayText}</span> |
                    Expendable XP: <span className="text-purple-400 font-bold">{xpBuffer.expendableXp.toLocaleString()} XP</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCraftItem}
                    disabled={xpBuffer.expendableXp < craftCalc.xpCost}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:hover:bg-amber-600 text-stone-950 font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow"
                  >
                    <Hammer className="w-4 h-4" />
                    <span>Craft & Deduct {craftCalc.xpCost} XP</span>
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === 'spells' ? (
            /* High-Level Spells with XP Components */
            <div className="space-y-3">
              <div className="space-y-2">
                {DND35E_XP_SPELLS.map((spell, index) => {
                  const canAfford = xpBuffer.canAfford(spell.xpCost);
                  return (
                    <div
                      key={spell.name}
                      className="p-3 bg-stone-950/70 border border-stone-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-100">{spell.name}</span>
                          <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/40">
                            {spell.xpCost.toLocaleString()} XP
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            Level {spell.level} ({spell.school})
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400">{spell.description}</p>
                        {spell.materialCostGp && (
                          <span className="text-[10px] text-amber-400/90 font-mono block">
                            Material Component: {spell.materialCostGp} gp
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCastXpSpell(spell)}
                        disabled={!canAfford}
                        className="px-3 py-1.5 bg-purple-950/80 hover:bg-purple-900 disabled:opacity-40 border border-purple-600/40 text-purple-200 text-xs font-bold rounded-lg transition shrink-0 self-end sm:self-center"
                      >
                        Cast & Pay {spell.xpCost} XP
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* XP History Ledger */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                  Transaction History & Auditing
                </span>
                {character.xpLedger && character.xpLedger.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearLedger}
                    className="text-[11px] text-stone-500 hover:text-red-400 transition"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {(!character.xpLedger || character.xpLedger.length === 0) ? (
                <div className="text-center py-8 text-stone-500 text-xs bg-stone-950/30 rounded-xl border border-stone-800">
                  No XP expenditures logged yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {character.xpLedger.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-2.5 bg-stone-950/70 border border-stone-800 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-stone-200">{entry.description}</div>
                        <div className="text-[10px] text-stone-500 font-mono">
                          {entry.date} {entry.goldCost ? `• ${entry.goldCost} gp material cost` : ''}
                        </div>
                      </div>
                      <span className={`font-mono font-bold ${entry.xpAmount < 0 ? 'text-purple-400' : 'text-emerald-400'}`}>
                        {entry.xpAmount} XP
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-950 p-3 border-t border-stone-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-stone-400 font-mono">
            Spent on Spells: <span className="text-purple-400 font-bold">{character.totalXpSpentOnSpells || 0} XP</span> |
            Crafting: <span className="text-amber-400 font-bold">{character.totalXpSpentOnCrafting || 0} XP</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
