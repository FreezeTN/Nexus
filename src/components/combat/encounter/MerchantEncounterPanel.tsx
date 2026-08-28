import React, { useState } from 'react';
import { CharacterData, GearItem } from '../../../types';
import { MerchantEncounterState, CombatLogEntry } from './encounterTypes';
import {
  Store,
  Coins,
  Sparkles,
  Swords,
  Shield,
  RefreshCw,
  ShoppingBag,
  ArrowRightLeft,
  X,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Info,
  DollarSign,
  PackageCheck
} from 'lucide-react';
import { getAbilityModifier, formatModifier } from '../../../utils/dndCalculations';
import { playCoinSound } from '../../../utils/soundEffects';

interface MerchantEncounterPanelProps {
  merchant: MerchantEncounterState;
  character: CharacterData;
  onUpdateCharacter?: (updated: CharacterData) => void;
  onUpdateMerchant: (updated: MerchantEncounterState) => void;
  onPivotToCombat: () => void;
  onLeaveEncounter: () => void;
  onAddLogEntry: (category: CombatLogEntry['category'], message: string, actor?: string) => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
}

export const MerchantEncounterPanel: React.FC<MerchantEncounterPanelProps> = ({
  merchant,
  character,
  onUpdateCharacter,
  onUpdateMerchant,
  onPivotToCombat,
  onLeaveEncounter,
  onAddLogEntry,
  onRoll
}) => {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell' | 'details'>('buy');
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [haggleSkill, setHaggleSkill] = useState<'Persuasion' | 'Deception' | 'Intimidation'>('Persuasion');
  const [customHaggleRoll, setCustomHaggleRoll] = useState<string>('');
  const [tradeMessage, setTradeMessage] = useState<{ text: string; type: 'success' | 'warning' | 'info' } | null>(null);

  // Player wealth calculation (normalize to GP)
  const playerGold = character.wealth?.gp || 0;
  const playerSilver = character.wealth?.sp || 0;
  const playerCopper = character.wealth?.cp || 0;
  const playerPlatinum = character.wealth?.pp || 0;
  const playerElectrum = character.wealth?.ep || 0;

  // Effective price calculations based on haggleModifier
  // discount applied to merchant prices, or boost applied to sell prices
  const priceModifierFactor = Math.max(0.2, (100 + merchant.haggleModifier) / 100);

  const getEffectiveBuyCostGp = (baseCostGp: number) => {
    return Math.max(1, Math.round(baseCostGp * (merchant.vendorMargin / 100) * priceModifierFactor));
  };

  const getEffectiveSellValueGp = (baseCostGp: number) => {
    // Standard sell value is 50% base, adjusted by haggling
    const baseSell = Math.max(1, Math.floor(baseCostGp * 0.5));
    const factor = Math.max(0.5, (100 - merchant.haggleModifier) / 100);
    return Math.max(1, Math.round(baseSell * factor));
  };

  // Perform Haggling Skill Check
  const handlePerformHaggle = () => {
    const chaMod = getAbilityModifier(character.abilities?.CHA?.score ?? 10);
    const profBonus = Math.floor(2 + ((character.level || 1) - 1) / 4);
    
    // Check if character is proficient
    const isProficient = (character.skills || []).some(s => 
      (typeof s === 'string' ? s : s?.name || '').toLowerCase() === haggleSkill.toLowerCase()
    );

    const totalMod = chaMod + (isProficient ? profBonus : 0);
    const rolledD20 = Math.floor(Math.random() * 20) + 1;
    const totalCheck = rolledD20 + totalMod;

    if (onRoll) {
      onRoll(`Haggle Check (${haggleSkill}) vs DC ${merchant.haggleDc}`, 20, 1, totalMod, 'normal');
    }

    const isSuccess = totalCheck >= merchant.haggleDc;
    let newModifier = merchant.haggleModifier;
    let discountMsg = '';

    if (isSuccess) {
      if (rolledD20 === 20) {
        newModifier = -25; // 25% discount
        discountMsg = `🎉 CRITICAL SUCCESS! (Nat 20 + ${totalMod} = ${totalCheck} vs DC ${merchant.haggleDc}). ${merchant.merchantName} is thoroughly charmed and grants a huge 25% discount!`;
      } else {
        newModifier = -15; // 15% discount
        discountMsg = `✅ SUCCESS! (Rolled ${rolledD20} + ${totalMod} = ${totalCheck} vs DC ${merchant.haggleDc}). ${merchant.merchantName} agrees to a 15% price discount!`;
      }
    } else {
      if (rolledD20 === 1) {
        newModifier = 20; // 20% penalty
        discountMsg = `💀 CRITICAL FAILURE! (Nat 1 + ${totalMod} = ${totalCheck} vs DC ${merchant.haggleDc}). ${merchant.merchantName} is deeply offended and raises all prices by +20%!`;
      } else {
        newModifier = 10; // 10% penalty
        discountMsg = `❌ FAILURE! (Rolled ${rolledD20} + ${totalMod} = ${totalCheck} vs DC ${merchant.haggleDc}). ${merchant.merchantName} holds firm and adds a +10% nuisance markup!`;
      }
    }

    const updatedMerchant: MerchantEncounterState = {
      ...merchant,
      haggleModifier: newModifier,
      lastHaggleResult: {
        roll: rolledD20,
        modifier: totalMod,
        total: totalCheck,
        success: isSuccess,
        discountPercent: -newModifier,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    };

    onUpdateMerchant(updatedMerchant);
    setTradeMessage({ text: discountMsg, type: isSuccess ? 'success' : 'warning' });
    onAddLogEntry('trade', `🗣️ Haggling Check (${haggleSkill}): ${discountMsg}`, merchant.merchantName);
  };

  // Buy Item from Merchant
  const handleBuyItem = (item: GearItem) => {
    const costGp = getEffectiveBuyCostGp(item.costGp || 10);
    if (playerGold < costGp) {
      setTradeMessage({
        text: `⚠️ Not enough gold! You have ${playerGold} GP, but this item costs ${costGp} GP.`,
        type: 'warning'
      });
      return;
    }

    // Deduct player gold, add item to player inventory
    if (onUpdateCharacter) {
      const currentInv = character.inventory || [];
      const updatedInv = [...currentInv, { ...item, id: 'inv-' + Date.now() + '-' + Math.floor(Math.random() * 1000) }];
      const updatedWealth = {
        ...(character.wealth || { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 }),
        gp: playerGold - costGp
      };
      onUpdateCharacter({
        ...character,
        wealth: updatedWealth,
        inventory: updatedInv
      });
    }

    // Update merchant inventory (reduce qty or remove) and add gold till
    let updatedWares: GearItem[];
    if (item.quantity && item.quantity > 1) {
      updatedWares = merchant.inventory.map(w => w.id === item.id ? { ...w, quantity: w.quantity! - 1 } : w);
    } else {
      updatedWares = merchant.inventory.filter(w => w.id !== item.id);
    }

    const updatedMerchant: MerchantEncounterState = {
      ...merchant,
      goldGp: merchant.goldGp + costGp,
      inventory: updatedWares
    };
    onUpdateMerchant(updatedMerchant);
    playCoinSound();

    const logText = `🛍️ Bought "${item.name}" for ${costGp} GP. (Merchant Gold Till: ${updatedMerchant.goldGp} GP)`;
    setTradeMessage({ text: logText, type: 'success' });
    onAddLogEntry('trade', logText, character.name);
  };

  // Sell Item to Merchant
  const handleSellItem = (item: GearItem) => {
    const sellValueGp = getEffectiveSellValueGp(item.costGp || 10);
    if (merchant.goldGp < sellValueGp) {
      setTradeMessage({
        text: `⚠️ ${merchant.merchantName} only has ${merchant.goldGp} GP in their purse and cannot afford to buy your "${item.name}" for ${sellValueGp} GP!`,
        type: 'warning'
      });
      return;
    }

    // Remove from player inventory, add gold to player
    if (onUpdateCharacter) {
      const currentInv = character.inventory || [];
      let updatedInv: GearItem[];
      if (item.quantity && item.quantity > 1) {
        updatedInv = currentInv.map(w => w.id === item.id ? { ...w, quantity: w.quantity! - 1 } : w);
      } else {
        updatedInv = currentInv.filter(w => w.id !== item.id);
      }

      const updatedWealth = {
        ...(character.wealth || { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 }),
        gp: playerGold + sellValueGp
      };

      onUpdateCharacter({
        ...character,
        wealth: updatedWealth,
        inventory: updatedInv
      });
    }

    // Add item to merchant inventory, deduct gold from merchant
    const updatedMerchantWares = [...merchant.inventory, { ...item, id: 'ware-' + Date.now() }];
    const updatedMerchant: MerchantEncounterState = {
      ...merchant,
      goldGp: merchant.goldGp - sellValueGp,
      inventory: updatedMerchantWares
    };
    onUpdateMerchant(updatedMerchant);
    playCoinSound();

    const logText = `💰 Sold "${item.name}" to ${merchant.merchantName} for +${sellValueGp} GP. (Merchant Gold Remaining: ${updatedMerchant.goldGp} GP)`;
    setTradeMessage({ text: logText, type: 'success' });
    onAddLogEntry('trade', logText, character.name);
  };

  const filteredMerchantWares = merchant.inventory.filter(item => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Weapons') return item.itemType === 'Weapon' || !!item.weaponStats;
    if (selectedFilter === 'Armor') return item.itemType === 'Armor' || !!item.armorAc;
    if (selectedFilter === 'Potions/Magic') return !!item.isMagic || item.name.toLowerCase().includes('potion') || item.name.toLowerCase().includes('scroll') || item.name.toLowerCase().includes('elixir');
    return true;
  });

  const playerInventory = character.inventory || [];

  return (
    <div className="bg-stone-950 border border-amber-600/50 rounded-2xl p-4 md:p-5 shadow-2xl space-y-4 animate-fadeIn">
      {/* Header with Merchant Bio & Encounter Controls */}
      <div className="flex items-start justify-between gap-3 border-b border-stone-800 pb-4 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <div className="relative shrink-0">
            {merchant.portraitUrl ? (
              <img
                src={merchant.portraitUrl}
                alt={merchant.merchantName}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500 shadow-lg"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-900/60 to-stone-900 border-2 border-amber-500 flex flex-col items-center justify-center shadow-lg text-amber-400">
                <Store className="w-7 h-7" />
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-stone-950 text-[10px] font-mono font-extrabold px-1.5 py-0.2 rounded-full border border-stone-900 shadow">
              SHOP
            </span>
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif font-bold text-amber-200 text-lg md:text-xl">
                {merchant.merchantName}
              </h3>
              <span className="bg-amber-950/80 text-amber-300 border border-amber-600/60 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
                {merchant.archetype || 'Traveling Trader'}
              </span>
            </div>

            <p className="text-xs text-stone-300 italic">
              "{merchant.greeting || 'Greetings traveler, take a look at my wares!'}"
            </p>

            {/* Merchant Till & Purse */}
            <div className="flex items-center gap-3 text-xs font-mono pt-1">
              <span className="flex items-center gap-1 text-amber-300 bg-stone-900 border border-amber-600/40 px-2 py-0.5 rounded-lg font-bold">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Till: {merchant.goldGp} GP</span>
              </span>

              <span className="flex items-center gap-1 text-stone-300 bg-stone-900 border border-stone-800 px-2 py-0.5 rounded-lg">
                <Shield className="w-3.5 h-3.5 text-stone-400" />
                <span>AC {merchant.statblock?.armorClass || 13}</span>
              </span>

              <span className="flex items-center gap-1 text-stone-300 bg-stone-900 border border-stone-800 px-2 py-0.5 rounded-lg">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>HP {merchant.statblock?.hp || 40}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Draw Weapons / Leave Shop */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onPivotToCombat}
            className="flex items-center gap-1.5 bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-700/80 px-3 py-1.5 rounded-xl font-bold text-xs shadow transition hover:scale-102"
            title="Provoke merchant into combat (Draw weapons)"
          >
            <Swords className="w-4 h-4 text-rose-400" />
            <span>Provoke / Fight</span>
          </button>

          <button
            type="button"
            onClick={onLeaveEncounter}
            className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 px-3 py-1.5 rounded-xl font-bold text-xs shadow transition"
          >
            <X className="w-4 h-4 text-stone-400" />
            <span>Leave Bazaar</span>
          </button>
        </div>
      </div>

      {/* Haggling & Reputation Interactive Bar */}
      <div className="bg-gradient-to-r from-stone-900 via-amber-950/40 to-stone-900 border border-amber-600/40 p-3 rounded-xl flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-600 text-stone-950 rounded-xl font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="font-serif font-bold text-xs text-amber-200 flex items-center gap-2">
              <span>Bargain & Haggling</span>
              <span className="bg-stone-950 text-amber-300 font-mono text-[10px] px-2 py-0.5 rounded-full border border-amber-600/40">
                DC {merchant.haggleDc} Check
              </span>
              {merchant.haggleModifier !== 0 && (
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  merchant.haggleModifier < 0 ? 'bg-emerald-950 text-emerald-300 border border-emerald-500' : 'bg-rose-950 text-rose-300 border border-rose-500'
                }`}>
                  {merchant.haggleModifier < 0 ? `${Math.abs(merchant.haggleModifier)}% Discount Applied` : `+${merchant.haggleModifier}% Penalty Applied`}
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-400">
              Roll Charisma checks against merchant disposition to negotiate discounts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={haggleSkill}
            onChange={(e) => setHaggleSkill(e.target.value as any)}
            className="bg-stone-950 border border-amber-600/50 rounded-xl px-2.5 py-1 text-xs text-amber-200 font-bold focus:outline-none"
          >
            <option value="Persuasion">Persuasion (Diplomatic)</option>
            <option value="Deception">Deception (Fast-talk)</option>
            <option value="Intimidation">Intimidation (Threat)</option>
          </select>

          <button
            type="button"
            onClick={handlePerformHaggle}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Roll Haggle</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {tradeMessage && (
        <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 animate-fadeIn ${
          tradeMessage.type === 'success'
            ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-200'
            : tradeMessage.type === 'warning'
            ? 'bg-amber-950/60 border-amber-600/60 text-amber-200'
            : 'bg-stone-900 border-stone-700 text-stone-200'
        }`}>
          <div className="flex items-center gap-2">
            {tradeMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
            <span>{tradeMessage.text}</span>
          </div>
          <button onClick={() => setTradeMessage(null)} className="p-1 hover:bg-stone-800 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tabs: Buy Wares vs Sell Gear vs Merchant Details */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('buy')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'buy'
                ? 'bg-amber-600 text-stone-950 shadow font-extrabold'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Buy Wares ({merchant.inventory.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sell')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'sell'
                ? 'bg-amber-600 text-stone-950 shadow font-extrabold'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Sell Player Items ({playerInventory.length})</span>
          </button>
        </div>

        {/* Player Current Gold Display */}
        <div className="flex items-center gap-2 text-xs font-mono bg-stone-900 border border-amber-600/40 px-3 py-1 rounded-xl">
          <span className="text-stone-400 font-sans">Your Purse:</span>
          <span className="text-amber-300 font-bold">{playerGold} GP</span>
          <span className="text-stone-400">({playerSilver} SP, {playerCopper} CP)</span>
        </div>
      </div>

      {/* ================= TAB 1: BUY MERCHANDISE ================= */}
      {activeTab === 'buy' && (
        <div className="space-y-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {['All', 'Weapons', 'Armor', 'Potions/Magic'].map(filt => (
              <button
                key={filt}
                type="button"
                onClick={() => setSelectedFilter(filt)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  selectedFilter === filt
                    ? 'bg-stone-800 text-amber-300 border border-amber-500/50'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {filt}
              </button>
            ))}
          </div>

          {/* Wares List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[440px] overflow-y-auto pr-1">
            {filteredMerchantWares.length === 0 ? (
              <div className="col-span-2 text-center py-10 border border-dashed border-stone-800 rounded-xl text-stone-500">
                <PackageCheck className="w-8 h-8 mx-auto text-stone-600 mb-2 opacity-50" />
                <p className="text-xs">No wares remaining in this category!</p>
              </div>
            ) : (
              filteredMerchantWares.map(item => {
                const buyCost = getEffectiveBuyCostGp(item.costGp || 10);
                const canAfford = playerGold >= buyCost;

                return (
                  <div
                    key={item.id}
                    className="bg-stone-900/90 border border-stone-800 hover:border-amber-600/50 p-3 rounded-xl flex items-center justify-between gap-3 shadow transition"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-serif font-bold text-stone-100 text-xs truncate">
                          {item.name}
                        </h4>
                        {item.isMagic && (
                          <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-600/50 px-1.5 py-0.2 rounded-full font-mono">
                            Magic
                          </span>
                        )}
                        {item.quantity && item.quantity > 1 && (
                          <span className="text-[10px] bg-stone-800 text-stone-300 px-1.5 rounded-full font-mono">
                            x{item.quantity}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-stone-400 truncate">
                        {item.itemType || 'Equipment'} • {item.weight || 1} lbs
                        {item.armorAc ? ` • AC ${item.armorAc}` : ''}
                        {item.weaponStats?.damage ? ` • ${item.weaponStats.damage} ${item.weaponStats.damageType}` : ''}
                      </p>

                      {item.notes && (
                        <p className="text-[10px] text-amber-300/80 italic truncate">
                          {item.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-amber-300 block">
                          {buyCost} GP
                        </span>
                        {merchant.haggleModifier !== 0 && (
                          <span className="text-[10px] text-stone-500 line-through font-mono">
                            {Math.round((item.costGp || 10) * (merchant.vendorMargin / 100))} GP
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleBuyItem(item)}
                        disabled={!canAfford}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:hover:bg-amber-600 text-stone-950 font-extrabold text-xs rounded-xl shadow transition"
                      >
                        Buy
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: SELL PLAYER GEAR ================= */}
      {activeTab === 'sell' && (
        <div className="space-y-3">
          <div className="bg-stone-900/60 p-2.5 rounded-xl border border-stone-800 text-xs text-stone-300 flex items-center justify-between">
            <span>
              Sell your loot and gear to <strong>{merchant.merchantName}</strong>. Standard resale is ~50% value (adjusted by haggling).
            </span>
            <span className="font-mono text-amber-300 font-bold shrink-0">
              Merchant Budget: {merchant.goldGp} GP
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[440px] overflow-y-auto pr-1">
            {playerInventory.length === 0 ? (
              <div className="col-span-2 text-center py-10 border border-dashed border-stone-800 rounded-xl text-stone-500">
                <PackageCheck className="w-8 h-8 mx-auto text-stone-600 mb-2 opacity-50" />
                <p className="text-xs">Your inventory is empty!</p>
              </div>
            ) : (
              playerInventory.map(item => {
                const sellValue = getEffectiveSellValueGp(item.costGp || 10);
                const merchantCanAfford = merchant.goldGp >= sellValue;

                return (
                  <div
                    key={item.id}
                    className="bg-stone-900/90 border border-stone-800 hover:border-amber-600/50 p-3 rounded-xl flex items-center justify-between gap-3 shadow transition"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-serif font-bold text-stone-100 text-xs truncate">
                          {item.name}
                        </h4>
                        {item.equipped && (
                          <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/50 px-1.5 py-0.2 rounded-full font-mono">
                            Equipped
                          </span>
                        )}
                        {item.quantity && item.quantity > 1 && (
                          <span className="text-[10px] bg-stone-800 text-stone-300 px-1.5 rounded-full font-mono">
                            x{item.quantity}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-stone-400 truncate">
                        {item.itemType || 'Item'} • {item.weight || 1} lbs
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-emerald-400 block">
                          +{sellValue} GP
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSellItem(item)}
                        disabled={!merchantCanAfford}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl shadow transition"
                      >
                        Sell
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
