import React, { useState, useMemo } from 'react';
import {
  Store,
  Coins,
  Sparkles,
  ShoppingBag,
  ArrowRightLeft,
  Swords,
  Shield,
  Dices,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  X,
  Plus,
  Package,
  Heart,
  ChevronRight,
  Flame,
  Zap,
  Scroll,
  Tag
} from 'lucide-react';
import { CharacterData, GearItem, Wealth } from '../../../types';
import { MerchantEncounterState, Combatant } from './encounterTypes';
import { formatModifier, getAbilityModifier } from '../../../utils/dndCalculations';

interface MerchantEncounterViewProps {
  activeMerchant: MerchantEncounterState;
  character: CharacterData;
  allCharacters?: CharacterData[];
  onUpdateMerchant: (updated: MerchantEncounterState) => void;
  onUpdateCharacter?: (updated: CharacterData) => void;
  onSwitchToCombat: () => void;
  onLeaveEncounter: () => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
  onAddLogEntry?: (category: 'trade' | 'note' | 'ability' | 'turn', message: string, actor?: string) => void;
}

export const MerchantEncounterView: React.FC<MerchantEncounterViewProps> = ({
  activeMerchant,
  character,
  allCharacters = [],
  onUpdateMerchant,
  onUpdateCharacter,
  onSwitchToCombat,
  onLeaveEncounter,
  onRoll,
  onAddLogEntry
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [tradeMessage, setTradeMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isHaggling, setIsHaggling] = useState<boolean>(false);
  const [customHaggleSkill, setCustomHaggleSkill] = useState<'persuasion' | 'deception' | 'intimidation'>('persuasion');
  const [selectedPartyCharId, setSelectedPartyCharId] = useState<string>(character.id);

  // Determine active trading character (either currently active character or a selected party member)
  const tradingCharacter = useMemo(() => {
    if (selectedPartyCharId === character.id) return character;
    const found = allCharacters.find(c => c.id === selectedPartyCharId);
    return found || character;
  }, [selectedPartyCharId, character, allCharacters]);

  // Calculate total gold equivalent for the trading character
  const playerTotalGpEquivalent = useMemo(() => {
    const w = tradingCharacter.wealth || { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
    return (
      (w.cp || 0) * 0.01 +
      (w.sp || 0) * 0.1 +
      (w.ep || 0) * 0.5 +
      (w.gp || 0) * 1.0 +
      (w.pp || 0) * 10.0
    );
  }, [tradingCharacter.wealth]);

  // Effective price multiplier (base margin + haggle modifier)
  const effectiveMarginMultiplier = useMemo(() => {
    const baseMargin = (activeMerchant.vendorMargin || 100) / 100;
    const haggleAdjustment = (activeMerchant.haggleModifier || 0) / 100;
    return Math.max(0.4, baseMargin + haggleAdjustment);
  }, [activeMerchant.vendorMargin, activeMerchant.haggleModifier]);

  // Effective sell back multiplier (typically 50% base, adjusted by haggle)
  const effectiveSellMultiplier = useMemo(() => {
    const baseSell = 0.5;
    const haggleAdjustment = -(activeMerchant.haggleModifier || 0) / 200; // -15% buy discount = +7.5% sell bonus
    return Math.max(0.2, Math.min(0.9, baseSell + haggleAdjustment));
  }, [activeMerchant.haggleModifier]);

  // Calculate item buy price in GP
  const getItemBuyPrice = (item: GearItem): number => {
    const rawCost = typeof item.costGp === 'number' && item.costGp > 0 ? item.costGp : 10;
    const finalPrice = Math.max(0.1, Math.round(rawCost * effectiveMarginMultiplier * 10) / 10);
    return finalPrice;
  };

  // Calculate item sell price in GP
  const getItemSellPrice = (item: GearItem): number => {
    const rawCost = typeof item.costGp === 'number' && item.costGp > 0 ? item.costGp : 5;
    const finalPrice = Math.max(0.1, Math.round(rawCost * effectiveSellMultiplier * 10) / 10);
    return finalPrice;
  };

  // Filter merchant wares
  const filteredWares = useMemo(() => {
    return activeMerchant.inventory.filter(item => {
      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'weapon') return item.itemType === 'Weapon';
      if (selectedCategory === 'armor') return item.itemType === 'Armor';
      if (selectedCategory === 'magic') return item.isMagic;
      if (selectedCategory === 'consumables') return item.itemType === 'Misc' || item.name.toLowerCase().includes('potion') || item.name.toLowerCase().includes('scroll');
      return true;
    });
  }, [activeMerchant.inventory, selectedCategory]);

  // Filter player inventory for selling
  const playerItems = useMemo(() => {
    return (tradingCharacter.inventory || []).filter(item => {
      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'weapon') return item.itemType === 'Weapon';
      if (selectedCategory === 'armor') return item.itemType === 'Armor';
      if (selectedCategory === 'magic') return item.isMagic;
      return true;
    });
  }, [tradingCharacter.inventory, selectedCategory]);

  // Helper to deduct gold from player and add to merchant
  const deductGoldFromPlayer = (amountGp: number, currentWealth: Wealth): Wealth => {
    let remainingToPay = amountGp;
    let gp = currentWealth.gp || 0;
    let pp = currentWealth.pp || 0;
    let sp = currentWealth.sp || 0;
    let cp = currentWealth.cp || 0;

    // Prefer GP
    if (gp >= remainingToPay) {
      gp -= remainingToPay;
      return { ...currentWealth, gp };
    } else {
      remainingToPay -= gp;
      gp = 0;
    }

    // Try Platinum (1 PP = 10 GP)
    if (pp > 0) {
      const ppNeeded = Math.ceil(remainingToPay / 10);
      if (pp >= ppNeeded) {
        pp -= ppNeeded;
        const changeGp = ppNeeded * 10 - remainingToPay;
        gp += changeGp;
        return { ...currentWealth, gp, pp };
      } else {
        remainingToPay -= pp * 10;
        pp = 0;
      }
    }

    // Try Silver (10 SP = 1 GP)
    const spEquivalent = remainingToPay * 10;
    if (sp >= spEquivalent) {
      sp -= spEquivalent;
      return { ...currentWealth, gp, pp, sp };
    } else {
      remainingToPay -= sp / 10;
      sp = 0;
    }

    // Try Copper (100 CP = 1 GP)
    const cpEquivalent = remainingToPay * 100;
    if (cp >= cpEquivalent) {
      cp -= cpEquivalent;
      return { ...currentWealth, gp, pp, sp, cp };
    }

    return { ...currentWealth, gp: Math.max(0, gp - amountGp) };
  };

  // Helper to add gold to player
  const addGoldToPlayer = (amountGp: number, currentWealth: Wealth): Wealth => {
    return {
      ...currentWealth,
      gp: (currentWealth.gp || 0) + Math.floor(amountGp),
      sp: (currentWealth.sp || 0) + Math.round((amountGp % 1) * 10)
    };
  };

  // BUY ITEM ACTION
  const handlePurchaseItem = (itemToBuy: GearItem) => {
    const cost = getItemBuyPrice(itemToBuy);

    if (playerTotalGpEquivalent < cost) {
      setTradeMessage({
        type: 'error',
        text: `Insufficient gold! You need ${cost} GP, but only have ${playerTotalGpEquivalent.toFixed(1)} GP equivalent.`
      });
      return;
    }

    // 1. Deduct cost from player, give item to player
    const updatedWealth = deductGoldFromPlayer(cost, tradingCharacter.wealth || { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 });
    
    // Check if player already has this item (stackable) or add new
    let updatedPlayerInventory = [...(tradingCharacter.inventory || [])];
    const existingIndex = updatedPlayerInventory.findIndex(
      i => i.name.toLowerCase() === itemToBuy.name.toLowerCase() && !i.isMagic && i.itemType === 'Misc'
    );

    if (existingIndex >= 0) {
      updatedPlayerInventory[existingIndex] = {
        ...updatedPlayerInventory[existingIndex],
        quantity: (updatedPlayerInventory[existingIndex].quantity || 1) + 1
      };
    } else {
      updatedPlayerInventory.push({
        ...itemToBuy,
        id: `item-bought-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        quantity: 1,
        equipped: false
      });
    }

    const updatedChar: CharacterData = {
      ...tradingCharacter,
      wealth: updatedWealth,
      inventory: updatedPlayerInventory
    };

    if (onUpdateCharacter) {
      onUpdateCharacter(updatedChar);
    }

    // 2. Decrement merchant stock and deposit gold into merchant till
    const updatedMerchantInventory = activeMerchant.inventory
      .map(item => {
        if (item.id === itemToBuy.id) {
          const qty = (item.quantity || 1) - 1;
          return qty > 0 ? { ...item, quantity: qty } : null;
        }
        return item;
      })
      .filter((item): item is GearItem => item !== null);

    const updatedMerchant: MerchantEncounterState = {
      ...activeMerchant,
      goldGp: (activeMerchant.goldGp || 0) + cost,
      inventory: updatedMerchantInventory
    };

    onUpdateMerchant(updatedMerchant);

    setTradeMessage({
      type: 'success',
      text: `Purchased "${itemToBuy.name}" for ${cost} GP! Transferred to ${tradingCharacter.name}'s inventory.`
    });

    if (onAddLogEntry) {
      onAddLogEntry('trade', `🛒 ${tradingCharacter.name} purchased ${itemToBuy.name} from ${activeMerchant.merchantName} for ${cost} GP.`, tradingCharacter.name);
    }
  };

  // SELL ITEM ACTION
  const handleSellItem = (itemToSell: GearItem) => {
    const offerPrice = getItemSellPrice(itemToSell);

    if (activeMerchant.goldGp < offerPrice) {
      setTradeMessage({
        type: 'error',
        text: `${activeMerchant.merchantName} doesn't have enough gold in their till to buy that! (Merchant has ${activeMerchant.goldGp.toFixed(1)} GP, item offer is ${offerPrice} GP).`
      });
      return;
    }

    // 1. Remove 1 count or item from player, give player gold
    let updatedPlayerInventory = [...(tradingCharacter.inventory || [])];
    const itemIndex = updatedPlayerInventory.findIndex(i => i.id === itemToSell.id);

    if (itemIndex >= 0) {
      if ((updatedPlayerInventory[itemIndex].quantity || 1) > 1) {
        updatedPlayerInventory[itemIndex] = {
          ...updatedPlayerInventory[itemIndex],
          quantity: (updatedPlayerInventory[itemIndex].quantity || 1) - 1
        };
      } else {
        updatedPlayerInventory.splice(itemIndex, 1);
      }
    }

    const updatedWealth = addGoldToPlayer(offerPrice, tradingCharacter.wealth || { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 });

    const updatedChar: CharacterData = {
      ...tradingCharacter,
      wealth: updatedWealth,
      inventory: updatedPlayerInventory
    };

    if (onUpdateCharacter) {
      onUpdateCharacter(updatedChar);
    }

    // 2. Add item to merchant wares and deduct merchant gold
    let updatedMerchantInventory = [...activeMerchant.inventory];
    const existingIndex = updatedMerchantInventory.findIndex(
      i => i.name.toLowerCase() === itemToSell.name.toLowerCase()
    );

    if (existingIndex >= 0) {
      updatedMerchantInventory[existingIndex] = {
        ...updatedMerchantInventory[existingIndex],
        quantity: (updatedMerchantInventory[existingIndex].quantity || 1) + 1
      };
    } else {
      updatedMerchantInventory.push({
        ...itemToSell,
        id: `merchant-resell-${Date.now()}`,
        quantity: 1,
        equipped: false
      });
    }

    const updatedMerchant: MerchantEncounterState = {
      ...activeMerchant,
      goldGp: Math.max(0, (activeMerchant.goldGp || 0) - offerPrice),
      inventory: updatedMerchantInventory
    };

    onUpdateMerchant(updatedMerchant);

    setTradeMessage({
      type: 'success',
      text: `Sold "${itemToSell.name}" for ${offerPrice} GP! Deposited to ${tradingCharacter.name}'s purse.`
    });

    if (onAddLogEntry) {
      onAddLogEntry('trade', `💰 ${tradingCharacter.name} sold ${itemToSell.name} to ${activeMerchant.merchantName} for ${offerPrice} GP.`, tradingCharacter.name);
    }
  };

  // HAGGLE & BARTER ROLL
  const handlePerformHaggle = () => {
    setIsHaggling(true);
    
    // Calculate character modifier
    const chaMod = getAbilityModifier(tradingCharacter.abilities?.CHA?.score || 10);
    // Add proficiency bonus if trained
    const profBonus = Math.floor(2 + ((tradingCharacter.level || 1) - 1) / 4);
    const hasProf = (tradingCharacter.skills || []).some(
      s => (typeof s === 'string' ? s : s?.name || '').toLowerCase() === customHaggleSkill.toLowerCase()
    );
    const totalMod = chaMod + (hasProf ? profBonus : 0);

    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + totalMod;
    const dc = activeMerchant.haggleDc || 13;
    const isSuccess = total >= dc;

    const discountPercent = isSuccess ? -15 : +10;

    const haggleResult = {
      roll: d20,
      modifier: totalMod,
      total,
      success: isSuccess,
      discountPercent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMerchant: MerchantEncounterState = {
      ...activeMerchant,
      haggleModifier: discountPercent,
      lastHaggleResult: haggleResult
    };

    onUpdateMerchant(updatedMerchant);

    if (onRoll) {
      onRoll(`Haggle (${customHaggleSkill.toUpperCase()}) vs DC ${dc}`, 20, 1, totalMod, 'normal');
    }

    if (onAddLogEntry) {
      onAddLogEntry(
        'trade',
        `🎲 ${tradingCharacter.name} rolled ${customHaggleSkill.toUpperCase()}: [${d20} + ${totalMod} = ${total}] vs Merchant DC ${dc}. Result: ${
          isSuccess ? 'SUCCESS! 15% Discount on wares.' : 'FAILURE! Merchant stood firm (+10% markup).'
        }`,
        tradingCharacter.name
      );
    }

    setTradeMessage({
      type: isSuccess ? 'success' : 'info',
      text: isSuccess
        ? `Haggle Success! (Rolled ${total} vs DC ${dc}). ${activeMerchant.merchantName} is impressed and granted a 15% discount!`
        : `Haggle Failed (Rolled ${total} vs DC ${dc}). ${activeMerchant.merchantName} took offense to your lowball and added a 10% markup.`
    });

    setIsHaggling(false);
  };

  return (
    <div className="bg-stone-900 border border-amber-900/50 rounded-2xl p-4 md:p-6 shadow-2xl space-y-6 animate-fadeIn">
      {/* Top Banner: Merchant Identity & Quick Actions */}
      <div className="flex items-start justify-between flex-wrap gap-4 border-b border-stone-800 pb-5">
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative shrink-0">
            {activeMerchant.portraitUrl ? (
              <img
                src={activeMerchant.portraitUrl}
                alt={activeMerchant.merchantName}
                referrerPolicy="no-referrer"
                className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border-2 border-amber-500 shadow-xl"
              />
            ) : (
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-amber-950 border-2 border-amber-600 flex items-center justify-center text-amber-300 shadow-xl">
                <Store className="w-8 h-8" />
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-stone-950 p-1 rounded-lg shadow font-mono text-xs">
              🏪
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl md:text-2xl font-serif font-bold text-amber-200 tracking-wide">
                {activeMerchant.merchantName}
              </h2>
              {activeMerchant.archetype && (
                <span className="bg-amber-950/80 text-amber-300 border border-amber-600/40 text-xs px-2.5 py-0.5 rounded-full font-serif font-bold">
                  {activeMerchant.archetype}
                </span>
              )}
            </div>

            {activeMerchant.greeting && (
              <p className="text-xs italic text-stone-300 font-serif mt-1 max-w-2xl bg-stone-950/60 border-l-2 border-amber-500 pl-2.5 py-1 rounded-r-lg">
                &ldquo;{activeMerchant.greeting}&rdquo;
              </p>
            )}

            <div className="flex items-center gap-3 mt-2 text-xs text-stone-400 flex-wrap">
              <span className="flex items-center gap-1 text-amber-400 font-mono font-bold bg-stone-950 px-2 py-0.5 rounded-md border border-stone-800">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Shop Till: {activeMerchant.goldGp.toLocaleString()} GP</span>
              </span>
              <span className="bg-stone-950 px-2 py-0.5 rounded-md border border-stone-800 font-mono">
                Wares: {activeMerchant.inventory.length} items
              </span>
              <span className="bg-stone-950 px-2 py-0.5 rounded-md border border-stone-800 font-mono text-stone-300">
                Margin: {Math.round(effectiveMarginMultiplier * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Top Encounter Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onSwitchToCombat}
            className="flex items-center gap-1.5 bg-gradient-to-r from-rose-900 to-amber-900 hover:from-rose-800 hover:to-amber-800 text-rose-100 border border-rose-600/60 px-3.5 py-2 rounded-xl font-bold text-xs shadow-lg transition"
            title="Attack the merchant or bodyguards! Transitions encounter to Combat Tracker."
          >
            <Swords className="w-4 h-4 text-rose-400" />
            <span>⚔️ Aggro / Attack Merchant</span>
          </button>

          <button
            type="button"
            onClick={onLeaveEncounter}
            className="flex items-center gap-1 bg-stone-950 hover:bg-stone-800 text-stone-300 border border-stone-700 px-3 py-2 rounded-xl font-bold text-xs transition shadow"
            title="Conclude trade and pack up the bazaar"
          >
            <X className="w-4 h-4 text-stone-400" />
            <span>Leave Bazaar</span>
          </button>
        </div>
      </div>

      {/* Trade Notification Message */}
      {tradeMessage && (
        <div
          className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold animate-fadeIn ${
            tradeMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200'
              : tradeMessage.type === 'error'
              ? 'bg-rose-950/80 border-rose-600 text-rose-200'
              : 'bg-amber-950/80 border-amber-600 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {tradeMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {tradeMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {tradeMessage.type === 'info' && <Info className="w-4 h-4 text-amber-400 shrink-0" />}
            <span>{tradeMessage.text}</span>
          </div>
          <button onClick={() => setTradeMessage(null)} className="p-1 hover:opacity-80">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Interactive Haggling & Active Customer Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-stone-950 p-4 rounded-xl border border-stone-800">
        {/* Customer Purse & Character Switcher */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-stone-400 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>Active Customer / Buyer:</span>
            </label>
            <span className="text-[11px] font-mono text-amber-300 font-bold">
              💰 Purse: {playerTotalGpEquivalent.toFixed(1)} GP
            </span>
          </div>

          <div className="flex items-center gap-2">
            {allCharacters && allCharacters.length > 1 ? (
              <select
                value={selectedPartyCharId}
                onChange={e => setSelectedPartyCharId(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2 text-stone-100 font-semibold text-xs focus:outline-none focus:border-amber-500"
              >
                {allCharacters.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.characterClass} Lv.{c.level}) — {((c.wealth?.gp || 0) + (c.wealth?.pp || 0) * 10).toFixed(0)} GP
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex-1 bg-stone-900 border border-stone-800 p-2 rounded-xl text-xs font-bold text-stone-200">
                {tradingCharacter.name} ({tradingCharacter.characterClass || 'Adventurer'})
              </div>
            )}
          </div>

          {/* Detailed Wealth Breakdown */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-stone-400 bg-stone-900/80 px-2.5 py-1.5 rounded-lg border border-stone-800/80">
            <span className="text-amber-200 font-bold">{tradingCharacter.wealth?.gp || 0} GP</span>
            <span>•</span>
            <span className="text-stone-300">{tradingCharacter.wealth?.sp || 0} SP</span>
            <span>•</span>
            <span className="text-amber-600">{tradingCharacter.wealth?.cp || 0} CP</span>
            <span>•</span>
            <span className="text-cyan-300 font-bold">{tradingCharacter.wealth?.pp || 0} PP</span>
          </div>
        </div>

        {/* Haggling & Barter Roll System */}
        <div className="space-y-2 border-t md:border-t-0 md:border-l border-stone-800 pt-3 md:pt-0 md:pl-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Haggle & Barter (DC {activeMerchant.haggleDc || 13})</span>
            </span>
            {activeMerchant.haggleModifier !== 0 && (
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  activeMerchant.haggleModifier < 0
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                    : 'bg-rose-950 text-rose-300 border border-rose-600'
                }`}
              >
                {activeMerchant.haggleModifier < 0
                  ? `${Math.abs(activeMerchant.haggleModifier)}% Discount Active`
                  : `+${activeMerchant.haggleModifier}% Surcharge Active`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={customHaggleSkill}
              onChange={e => setCustomHaggleSkill(e.target.value as any)}
              className="bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded-xl p-2 font-semibold focus:outline-none focus:border-amber-500"
            >
              <option value="persuasion">🗣️ Persuasion (Charisma)</option>
              <option value="deception">🎭 Deception (Bluff / Fake Worth)</option>
              <option value="intimidation">💢 Intimidation (Hard Bargain)</option>
            </select>

            <button
              type="button"
              onClick={handlePerformHaggle}
              disabled={isHaggling}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-extrabold text-xs py-2 px-3 rounded-xl transition shadow shadow-amber-900/30 disabled:opacity-50"
            >
              <Dices className="w-4 h-4 text-stone-950" />
              <span>Roll Haggle d20</span>
            </button>
          </div>

          {activeMerchant.lastHaggleResult && (
            <p className="text-[11px] text-stone-400 font-mono">
              Last Roll: [{activeMerchant.lastHaggleResult.roll} + {activeMerchant.lastHaggleResult.modifier} ={' '}
              <strong
                className={
                  activeMerchant.lastHaggleResult.success ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'
                }
              >
                {activeMerchant.lastHaggleResult.total}
              </strong>
              ] at {activeMerchant.lastHaggleResult.timestamp}
            </p>
          )}
        </div>
      </div>

      {/* Trade Mode Selector (Buy from Merchant vs Sell from Inventory) */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-stone-800 pb-3">
        <div className="flex items-center bg-stone-950 p-1 rounded-xl border border-stone-800">
          <button
            type="button"
            onClick={() => setActiveTab('buy')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition ${
              activeTab === 'buy'
                ? 'bg-amber-600 text-stone-950 shadow-md font-extrabold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Buy Wares ({activeMerchant.inventory.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sell')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition ${
              activeTab === 'sell'
                ? 'bg-amber-600 text-stone-950 shadow-md font-extrabold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Sell Gear ({tradingCharacter.inventory?.length || 0})</span>
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`text-xs px-2.5 py-1 rounded-lg font-bold transition border ${
              selectedCategory === 'all'
                ? 'bg-amber-950 text-amber-200 border-amber-600'
                : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('weapon')}
            className={`text-xs px-2.5 py-1 rounded-lg font-bold transition border ${
              selectedCategory === 'weapon'
                ? 'bg-amber-950 text-amber-200 border-amber-600'
                : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
            }`}
          >
            ⚔️ Weapons
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('armor')}
            className={`text-xs px-2.5 py-1 rounded-lg font-bold transition border ${
              selectedCategory === 'armor'
                ? 'bg-amber-950 text-amber-200 border-amber-600'
                : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
            }`}
          >
            🛡️ Armor & Shields
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('magic')}
            className={`text-xs px-2.5 py-1 rounded-lg font-bold transition border ${
              selectedCategory === 'magic'
                ? 'bg-amber-950 text-amber-200 border-amber-600'
                : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
            }`}
          >
            ✨ Magic Items
          </button>
        </div>
      </div>

      {/* ================= VIEW 1: BUYING FROM MERCHANT ================= */}
      {activeTab === 'buy' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span>
              Showing {filteredWares.length} item{filteredWares.length === 1 ? '' : 's'} available in{' '}
              {activeMerchant.merchantName}&apos;s shop catalog:
            </span>
            <span className="font-mono text-amber-400 font-bold">
              Current Markup: {Math.round(effectiveMarginMultiplier * 100)}%
            </span>
          </div>

          {filteredWares.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-stone-800 rounded-2xl bg-stone-950/40 text-stone-500 space-y-2">
              <Package className="w-10 h-10 mx-auto text-stone-600" />
              <p className="font-serif text-sm">No wares available matching this category filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredWares.map(item => {
                const buyPrice = getItemBuyPrice(item);
                const canAfford = playerTotalGpEquivalent >= buyPrice;

                return (
                  <div
                    key={item.id}
                    className="bg-stone-950 border border-stone-800 hover:border-amber-600/60 rounded-xl p-3.5 flex flex-col justify-between gap-3 transition shadow-md hover:shadow-amber-950/20 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-serif font-bold text-stone-100 text-sm group-hover:text-amber-200 transition flex items-center gap-1.5">
                            {item.isMagic && <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                            <span>{item.name}</span>
                          </h4>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5 text-[10px] font-mono text-stone-400">
                            <span className="bg-stone-900 px-1.5 py-0.2 rounded border border-stone-800">
                              {item.itemType || 'Misc'}
                            </span>
                            {item.weight && <span>{item.weight} lbs</span>}
                            <span className="text-amber-400 font-bold">Stock: {item.quantity || 1}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-sm font-mono font-extrabold text-amber-300 flex items-center justify-end gap-1">
                            <Coins className="w-3.5 h-3.5 text-amber-400" />
                            <span>{buyPrice} GP</span>
                          </div>
                          {item.costGp && item.costGp !== buyPrice && (
                            <span className="text-[10px] text-stone-500 line-through font-mono">
                              Base: {item.costGp} GP
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stat Badges for Armor, Weapons, Damage Reduction */}
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono">
                        {item.armorAc && (
                          <span className="bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.5 rounded font-bold">
                            🛡️ {item.armorAc} AC
                          </span>
                        )}
                        {item.acBonus && (
                          <span className="bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded font-bold">
                            +{item.acBonus} AC
                          </span>
                        )}
                        {item.damageReduction && (
                          <span className="bg-amber-950 text-amber-300 border border-amber-700 px-1.5 py-0.5 rounded font-bold">
                            🛡️ DR {item.damageReduction}
                          </span>
                        )}
                        {item.weaponStats?.damage && (
                          <span className="bg-rose-950 text-rose-300 border border-rose-800 px-1.5 py-0.5 rounded font-bold">
                            ⚔️ {item.weaponStats.damage} {item.weaponStats.damageType || ''}
                          </span>
                        )}
                      </div>

                      {/* Notes / Descriptions */}
                      {item.notes && <p className="text-xs text-stone-400 leading-relaxed">{item.notes}</p>}
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePurchaseItem(item)}
                      disabled={!canAfford}
                      className={`w-full py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition shadow ${
                        canAfford
                          ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 cursor-pointer'
                          : 'bg-stone-900 text-stone-500 border border-stone-800 cursor-not-allowed'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{canAfford ? `Purchase for ${buyPrice} GP` : `Can't Afford (${buyPrice} GP)`}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= VIEW 2: SELLING TO MERCHANT ================= */}
      {activeTab === 'sell' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span>
              Select an item from <strong>{tradingCharacter.name}</strong>&apos;s inventory to sell to{' '}
              {activeMerchant.merchantName}:
            </span>
            <span className="font-mono text-emerald-400 font-bold">
              Offer Rate: {Math.round(effectiveSellMultiplier * 100)}% of item value
            </span>
          </div>

          {playerItems.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-stone-800 rounded-2xl bg-stone-950/40 text-stone-500 space-y-2">
              <ShoppingBag className="w-10 h-10 mx-auto text-stone-600" />
              <p className="font-serif text-sm">No sellable gear found in character inventory.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {playerItems.map(item => {
                const sellPrice = getItemSellPrice(item);
                const merchantCanAfford = activeMerchant.goldGp >= sellPrice;

                return (
                  <div
                    key={item.id}
                    className="bg-stone-950 border border-stone-800 hover:border-emerald-600/60 rounded-xl p-3.5 flex flex-col justify-between gap-3 transition shadow-md group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-serif font-bold text-stone-100 text-sm group-hover:text-emerald-200 transition flex items-center gap-1.5">
                            {item.isMagic && <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                            <span>{item.name}</span>
                          </h4>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5 text-[10px] font-mono text-stone-400">
                            <span className="bg-stone-900 px-1.5 py-0.2 rounded border border-stone-800">
                              {item.itemType || 'Misc'}
                            </span>
                            {item.equipped && (
                              <span className="bg-amber-950 text-amber-300 px-1.5 py-0.2 rounded border border-amber-700">
                                Equipped
                              </span>
                            )}
                            <span className="text-stone-300 font-bold">Qty: {item.quantity || 1}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-sm font-mono font-extrabold text-emerald-400 flex items-center justify-end gap-1">
                            <Coins className="w-3.5 h-3.5 text-emerald-400" />
                            <span>+{sellPrice} GP</span>
                          </div>
                          {item.costGp && (
                            <span className="text-[10px] text-stone-500 font-mono">
                              Est. Value: {item.costGp} GP
                            </span>
                          )}
                        </div>
                      </div>

                      {item.notes && <p className="text-xs text-stone-400 leading-relaxed">{item.notes}</p>}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSellItem(item)}
                      disabled={!merchantCanAfford}
                      className={`w-full py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition shadow ${
                        merchantCanAfford
                          ? 'bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer'
                          : 'bg-stone-900 text-stone-500 border border-stone-800 cursor-not-allowed'
                      }`}
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>
                        {merchantCanAfford
                          ? `Sell to Merchant (+${sellPrice} GP)`
                          : `Merchant Out of Funds (${activeMerchant.goldGp.toFixed(0)} GP left)`}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
