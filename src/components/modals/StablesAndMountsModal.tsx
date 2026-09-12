import React, { useState } from 'react';
import { CharacterData, OwnedMount } from '../../types';
import {
  OFFICIAL_MOUNT_PRESETS,
  OFFICIAL_TACK_PRESETS,
  MountPreset,
  TackPreset,
  purchaseMountForCharacter,
  bindActiveMount,
  calculateMountEffectiveAC,
  getBardingBonus
} from '../../data/mountData';
import { getTotalWealthInGold, deductGoldFromWealth, formatWealthDetailed } from '../../utils/dndCalculations';
import { playCoinSound } from '../../utils/soundEffects';
import {
  X,
  Shield,
  Heart,
  Plus,
  Trash2,
  Check,
  ShoppingBag,
  Info,
  ChevronRight,
  Edit2
} from 'lucide-react';

interface StablesAndMountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onUpdateCharacter: (character: CharacterData) => void;
  onAddLogEntry?: (type: string, message: string, speaker?: string) => void;
}

export const StablesAndMountsModal: React.FC<StablesAndMountsModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdateCharacter,
  onAddLogEntry
}) => {
  const [activeTab, setActiveTab] = useState<'stables' | 'shop'>('stables');
  const [vendorCategory, setVendorCategory] = useState<'mounts' | 'tack'>('mounts');
  const [selectedMountForPurchase, setSelectedMountForPurchase] = useState<MountPreset | null>(null);
  const [customMountName, setCustomMountName] = useState('');
  const [editingMountId, setEditingMountId] = useState<string | null>(null);
  const [tempEditName, setTempEditName] = useState('');
  const [transactionMessage, setTransactionMessage] = useState<{ text: string; type: 'success' | 'warning' } | null>(null);

  if (!isOpen) return null;

  const wealthInfo = formatWealthDetailed(character.wealth);
  const totalWealthGp = wealthInfo.totalGp;
  const currentGp = character.wealth?.gp || 0;
  const ownedMounts = Array.isArray(character.ownedMounts) ? character.ownedMounts : [];
  const activeMount = ownedMounts.find(m => m.id === character.activeMountId) ||
    (character.mountInfo ? {
      id: 'active-inline',
      name: character.mountInfo.name,
      type: 'Warhorse',
      costGp: 400,
      size: 'Large' as const,
      speed: character.mountInfo.speed || '50 ft.',
      ac: character.mountInfo.ac || 14,
      hp: character.mountInfo.hp || 30,
      hpMax: character.mountInfo.hpMax || 30,
      carryingCapacityLbs: { light: 300, medium: 600, heavy: 900 },
      isWarTrained: true,
      saddle: (character.mountInfo.saddle as any) || 'riding',
      barding: (character.mountInfo.barding as any) || 'none',
      notes: character.mountInfo.notes || 'Default active mount'
    } : null);

  const handleBuyMountConfirm = () => {
    if (!selectedMountForPurchase) return;

    const result = purchaseMountForCharacter(
      character,
      selectedMountForPurchase,
      customMountName
    );

    if (result.success) {
      onUpdateCharacter(result.updatedCharacter);
      playCoinSound();
      setTransactionMessage({ text: result.message, type: 'success' });
      if (onAddLogEntry) {
        onAddLogEntry('trade', result.message, character.name);
      }
      setSelectedMountForPurchase(null);
      setCustomMountName('');
      setActiveTab('stables');
    } else {
      setTransactionMessage({ text: result.message, type: 'warning' });
    }
  };

  const handleBuyTack = (tack: TackPreset) => {
    if (totalWealthGp < tack.costGp - 0.001) {
      setTransactionMessage({
        text: `⚠️ Not enough currency! You have ${wealthInfo.displayText} (${wealthInfo.breakdown}), but ${tack.name} costs ${tack.costGp} GP.`,
        type: 'warning'
      });
      return;
    }

    const deduction = deductGoldFromWealth(tack.costGp, character.wealth);
    if (!deduction.success) {
      setTransactionMessage({
        text: `⚠️ Not enough currency to cover ${tack.costGp} GP.`,
        type: 'warning'
      });
      return;
    }

    const newGearItem = {
      id: `gear-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: tack.name,
      quantity: 1,
      weight: tack.weightLbs,
      costGp: tack.costGp,
      equipped: false,
      stored: false,
      notes: tack.notes,
      itemType: tack.category === 'Barding' ? 'Armor' : 'Misc'
    };

    const updatedInv = [newGearItem, ...(character.inventory || [])];

    onUpdateCharacter({
      ...character,
      wealth: deduction.updatedWealth,
      inventory: updatedInv
    });

    playCoinSound();
    const msg = `🛍️ Purchased "${tack.name}" for ${tack.costGp} GP! Added to inventory.`;
    setTransactionMessage({ text: msg, type: 'success' });
    if (onAddLogEntry) {
      onAddLogEntry('trade', msg, character.name);
    }
  };

  const handleSetActiveMount = (mount: OwnedMount) => {
    const updated = bindActiveMount(character, mount.id);
    onUpdateCharacter(updated);
    setTransactionMessage({
      text: `🐎 Mounted up on "${mount.name}"! Set as active combat steed in Sheet 2.`,
      type: 'success'
    });
  };

  const handleDismount = () => {
    onUpdateCharacter({
      ...character,
      isMounted: false
    });
    setTransactionMessage({
      text: 'Dismounted from steed. Combat state set to on-foot.',
      type: 'success'
    });
  };

  const handleHealMount = (mount: OwnedMount) => {
    const updatedMounts = (character.ownedMounts || []).map(m => {
      if (m.id === mount.id) {
        return { ...m, hp: m.hpMax };
      }
      return m;
    });

    const isCurrentActive = character.activeMountId === mount.id;
    onUpdateCharacter({
      ...character,
      ownedMounts: updatedMounts,
      mountInfo: isCurrentActive && character.mountInfo ? {
        ...character.mountInfo,
        hp: mount.hpMax
      } : character.mountInfo
    });

    setTransactionMessage({
      text: `❤️ ${mount.name} rested and restored to full vitality (${mount.hpMax} HP).`,
      type: 'success'
    });
  };

  const handleUpdateMountConfig = (
    mountId: string,
    updates: Partial<OwnedMount>
  ) => {
    const updatedMounts = (character.ownedMounts || []).map(m => {
      if (m.id === mountId) {
        const next = { ...m, ...updates };
        next.ac = calculateMountEffectiveAC(next);
        return next;
      }
      return m;
    });

    const targetMount = updatedMounts.find(m => m.id === mountId);
    const isCurrentActive = character.activeMountId === mountId;

    onUpdateCharacter({
      ...character,
      ownedMounts: updatedMounts,
      mountInfo: isCurrentActive && targetMount && character.mountInfo ? {
        ...character.mountInfo,
        name: targetMount.name,
        ac: calculateMountEffectiveAC(targetMount),
        saddle: targetMount.saddle,
        barding: targetMount.barding
      } : character.mountInfo
    });
  };

  const handleSellMount = (mount: OwnedMount) => {
    const sellValue = Math.floor(mount.costGp / 2);
    const updatedMounts = (character.ownedMounts || []).filter(m => m.id !== mount.id);
    const nextActiveId = character.activeMountId === mount.id
      ? (updatedMounts[0]?.id || undefined)
      : character.activeMountId;

    const updatedWealth = {
      ...(character.wealth || { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 }),
      gp: (character.wealth?.gp || 0) + sellValue
    };

    onUpdateCharacter({
      ...character,
      wealth: updatedWealth,
      ownedMounts: updatedMounts,
      activeMountId: nextActiveId,
      isMounted: nextActiveId ? character.isMounted : false,
      mountInfo: nextActiveId ? character.mountInfo : undefined
    });

    playCoinSound();
    const msg = `Sold "${mount.name}" to the stablemaster for ${sellValue} GP.`;
    setTransactionMessage({ text: msg, type: 'success' });
    if (onAddLogEntry) {
      onAddLogEntry('trade', msg, character.name);
    }
  };

  const handleRenameMount = (mountId: string) => {
    if (!tempEditName.trim()) {
      setEditingMountId(null);
      return;
    }
    handleUpdateMountConfig(mountId, { name: tempEditName.trim() });
    setEditingMountId(null);
    setTempEditName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-stone-900 border border-amber-600/50 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-stone-900 p-4 border-b border-amber-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-500 flex items-center justify-center text-amber-400 text-xl">
              🐎
            </div>
            <div>
              <h2 className="text-lg font-serif font-black text-amber-200 flex items-center gap-2">
                Stables & Mount Vendor
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-700/50 font-bold">
                  SRD Official
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Purchase, stable, outfit, and command steeds, warhorses, tack, and barding
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Wealth Coinage readout */}
            <div className="bg-stone-950 border border-amber-900/60 px-3 py-1.5 rounded-xl flex flex-col items-end text-xs shadow-inner">
              <div className="flex items-center gap-1.5">
                <span className="text-stone-400">Purse:</span>
                <span className="font-mono font-bold text-amber-300">
                  {wealthInfo.displayText}
                </span>
              </div>
              <div className="text-[10px] font-mono text-amber-500/80">
                {wealthInfo.breakdown}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="bg-stone-950 px-4 py-2 border-b border-stone-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveTab('stables'); setTransactionMessage(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'stables'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-stone-400 hover:text-stone-200 bg-stone-900 border border-stone-800'
              }`}
            >
              <span>🏰 My Stables ({ownedMounts.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('shop'); setTransactionMessage(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'shop'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-stone-400 hover:text-stone-200 bg-stone-900 border border-stone-800'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
              <span>Mount & Tack Vendor</span>
            </button>
          </div>

          {activeTab === 'shop' && (
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={() => setVendorCategory('mounts')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                  vendorCategory === 'mounts'
                    ? 'bg-amber-700 text-white'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Steeds & Mounts
              </button>
              <button
                onClick={() => setVendorCategory('tack')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                  vendorCategory === 'tack'
                    ? 'bg-amber-700 text-white'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Tack, Saddles & Barding
              </button>
            </div>
          )}
        </div>

        {/* Feedback alert toast */}
        {transactionMessage && (
          <div className={`mx-4 mt-3 p-3 rounded-xl border text-xs font-medium flex items-center justify-between ${
            transactionMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
              : 'bg-amber-950/40 border-amber-700/50 text-amber-300'
          }`}>
            <span>{transactionMessage.text}</span>
            <button
              onClick={() => setTransactionMessage(null)}
              className="text-stone-400 hover:text-stone-200 text-xs ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-sm">
          {/* TAB 1: STABLES */}
          {activeTab === 'stables' && (
            <div className="space-y-4">
              {/* Active Mount Banner */}
              {activeMount ? (
                <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-amber-950/30 p-4 rounded-xl border border-amber-600/40 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-500/50 flex items-center justify-center text-xl">
                        🏇
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-100 text-base">{activeMount.name}</span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/50 font-bold">
                            {character.isMounted ? 'ACTIVE COMBAT STEED (MOUNTED)' : 'ACTIVE STEED (DISMOUNTED)'}
                          </span>
                          {activeMount.isWarTrained && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950/60 text-red-300 border border-red-800/40 font-bold">
                              War-Trained
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {activeMount.type} • Size {activeMount.size} • Speed {activeMount.speed}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {character.isMounted ? (
                        <button
                          onClick={handleDismount}
                          className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-semibold transition border border-stone-700 cursor-pointer"
                        >
                          Dismount
                        </button>
                      ) : (
                        <button
                          onClick={() => onUpdateCharacter({ ...character, isMounted: true })}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow cursor-pointer"
                        >
                          Mount Up
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Vitals & Tack row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-stone-800 text-xs">
                    <div className="bg-stone-900/80 p-2 rounded-lg border border-stone-800 flex items-center justify-between">
                      <span className="text-stone-400 flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-rose-400" /> HP:
                      </span>
                      <span className="font-mono font-bold text-emerald-400">
                        {activeMount.hp} / {activeMount.hpMax}
                      </span>
                    </div>

                    <div className="bg-stone-900/80 p-2 rounded-lg border border-stone-800 flex items-center justify-between">
                      <span className="text-stone-400 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-blue-400" /> Armor Class:
                      </span>
                      <span className="font-mono font-bold text-blue-300">
                        {activeMount.ac} AC
                      </span>
                    </div>

                    <div className="bg-stone-900/80 p-2 rounded-lg border border-stone-800 flex items-center justify-between">
                      <span className="text-stone-400">Saddle:</span>
                      <span className="font-semibold text-amber-200 capitalize">
                        {activeMount.saddle === 'military' ? 'Military (+2 Stay)' : (activeMount.saddle || 'Standard')}
                      </span>
                    </div>

                    <div className="bg-stone-900/80 p-2 rounded-lg border border-stone-800 flex items-center justify-between">
                      <span className="text-stone-400">Barding:</span>
                      <span className="font-semibold text-amber-200 capitalize">
                        {activeMount.barding && activeMount.barding !== 'none'
                          ? `${activeMount.barding.replace('_', ' ')} (+${getBardingBonus(activeMount.barding)})`
                          : 'None'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Owned Mounts List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-stone-200 text-xs uppercase tracking-wider flex items-center gap-2">
                    <span>Stabled Steeds</span>
                    <span className="text-stone-500 font-normal">({ownedMounts.length})</span>
                  </h3>

                  <button
                    onClick={() => setActiveTab('shop')}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Buy New Mount
                  </button>
                </div>

                {ownedMounts.length === 0 ? (
                  <div className="bg-stone-950 p-8 rounded-xl border border-stone-800 text-center space-y-3">
                    <div className="text-3xl">🐴</div>
                    <p className="text-stone-300 font-bold text-sm">Your Stables are Currently Empty</p>
                    <p className="text-stone-400 text-xs max-w-md mx-auto">
                      Visit the Mount & Tack Vendor to purchase official warhorses, ponies, riding dogs, or mules using your adventure gold.
                    </p>
                    <button
                      onClick={() => setActiveTab('shop')}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <ShoppingBag className="w-4 h-4" /> Browse Stables Catalog
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ownedMounts.map((mount) => {
                      const isCurrentActive = character.activeMountId === mount.id;
                      const isEditing = editingMountId === mount.id;

                      return (
                        <div
                          key={mount.id}
                          className={`p-3.5 rounded-xl border transition space-y-3 ${
                            isCurrentActive
                              ? 'bg-amber-950/20 border-amber-600/70 shadow-lg'
                              : 'bg-stone-950 border-stone-800 hover:border-stone-700'
                          }`}
                        >
                          {/* Mount Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <span className="text-2xl">
                                {mount.size === 'Huge' ? '🐘' : mount.type.includes('Dog') ? '🐕' : '🐎'}
                              </span>
                              <div>
                                {isEditing ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={tempEditName}
                                      onChange={(e) => setTempEditName(e.target.value)}
                                      className="bg-stone-800 border border-stone-700 rounded px-2 py-0.5 text-xs text-white"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => handleRenameMount(mount.id)}
                                      className="p-1 bg-amber-600 text-white rounded text-xs cursor-pointer"
                                    >
                                      <Check className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-stone-100 text-sm">{mount.name}</span>
                                    <button
                                      onClick={() => {
                                        setEditingMountId(mount.id);
                                        setTempEditName(mount.name);
                                      }}
                                      className="text-stone-500 hover:text-stone-300 p-0.5 cursor-pointer"
                                      title="Rename mount"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                                <div className="text-[11px] text-stone-400 flex items-center gap-2">
                                  <span>{mount.type}</span>
                                  <span>•</span>
                                  <span className="text-amber-400 font-mono">{mount.speed}</span>
                                  {mount.isWarTrained && (
                                    <span className="text-emerald-400 text-[10px] font-semibold">War-Trained</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              {isCurrentActive ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px] font-bold">
                                  Mounted
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleSetActiveMount(mount)}
                                  className="px-2.5 py-1 bg-stone-800 hover:bg-amber-600 hover:text-white text-stone-300 rounded-lg text-xs font-semibold transition border border-stone-700 cursor-pointer"
                                >
                                  Equip Steed
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-3 gap-1.5 text-xs font-mono bg-stone-900/60 p-2 rounded-lg border border-stone-800">
                            <div>
                              <span className="text-stone-500 block text-[10px]">HP</span>
                              <span className="text-emerald-400 font-bold">{mount.hp}/{mount.hpMax}</span>
                            </div>
                            <div>
                              <span className="text-stone-500 block text-[10px]">AC</span>
                              <span className="text-blue-300 font-bold">{calculateMountEffectiveAC(mount)}</span>
                            </div>
                            <div>
                              <span className="text-stone-500 block text-[10px]">Light Load</span>
                              <span className="text-stone-300">{mount.carryingCapacityLbs?.light || 150} lbs</span>
                            </div>
                          </div>

                          {/* Tack & Barding Configuration */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="block text-stone-500 text-[10px] font-semibold mb-0.5">Saddle</label>
                              <select
                                value={mount.saddle || 'riding'}
                                onChange={(e) => handleUpdateMountConfig(mount.id, { saddle: e.target.value as any })}
                                className="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-stone-200 text-xs"
                              >
                                <option value="none">None / Bareback</option>
                                <option value="riding">Riding Saddle</option>
                                <option value="military">Military Saddle (+2 Stay)</option>
                                <option value="pack">Pack Saddle</option>
                                <option value="exotic_military">Exotic Military (+2)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-stone-500 text-[10px] font-semibold mb-0.5">Barding Armor</label>
                              <select
                                value={mount.barding || 'none'}
                                onChange={(e) => handleUpdateMountConfig(mount.id, { barding: e.target.value as any })}
                                className="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-stone-200 text-xs"
                              >
                                <option value="none">None (+0 AC)</option>
                                <option value="padded">Padded (+1 AC)</option>
                                <option value="leather">Leather (+2 AC)</option>
                                <option value="studded_leather">Studded Leather (+3 AC)</option>
                                <option value="chain_shirt">Chain Shirt (+4 AC)</option>
                                <option value="scale_mail">Scale Mail (+4 AC)</option>
                                <option value="chainmail">Chainmail (+5 AC)</option>
                                <option value="banded_mail">Banded Mail (+6 AC)</option>
                                <option value="full_plate">Full Plate (+8 AC)</option>
                              </select>
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="flex items-center justify-between pt-2 border-t border-stone-800/60 text-xs">
                            <button
                              onClick={() => handleHealMount(mount)}
                              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
                              title="Rest and restore mount HP"
                            >
                              <Heart className="w-3 h-3" /> Rest / Heal
                            </button>

                            <button
                              onClick={() => handleSellMount(mount)}
                              className="text-stone-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition text-[11px]"
                              title={`Sell back to stables for ${Math.floor(mount.costGp / 2)} GP`}
                            >
                              <Trash2 className="w-3 h-3" /> Sell ({Math.floor(mount.costGp / 2)} GP)
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: VENDOR / SHOP */}
          {activeTab === 'shop' && (
            <div className="space-y-4">
              {vendorCategory === 'mounts' && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-950/30 border border-amber-700/40 rounded-xl text-xs text-amber-200 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p>
                      Official D&D 3.5e & 5e steeds and beasts of burden. Purchasing a mount automatically deducts gold from your character's wealth vault, adds the mount to your Stables, and allows immediate equipping for combat in Sheet 2.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {OFFICIAL_MOUNT_PRESETS.map((preset) => {
                      const canAfford = totalWealthGp >= preset.costGp - 0.001;

                      return (
                        <div
                          key={preset.id}
                          className="bg-stone-950 border border-stone-800 hover:border-stone-700 p-4 rounded-xl flex flex-col justify-between gap-3 transition"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-stone-100 text-sm">{preset.name}</span>
                                  {preset.isWarTrained ? (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950/80 text-red-300 border border-red-700 font-bold">
                                      War-Trained
                                    </span>
                                  ) : (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-800 text-stone-400">
                                      Travel Mount
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-stone-400 font-mono mt-0.5">
                                  Size {preset.size} • Speed {preset.speed} • AC {preset.ac} • {preset.hp} HP
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="font-mono font-black text-amber-400 text-sm">
                                  {preset.costGp.toLocaleString()} GP
                                </span>
                              </div>
                            </div>

                            {/* Combat attacks info */}
                            {preset.attacks.length > 0 && (
                              <div className="text-[11px] text-rose-300/80 font-mono bg-stone-900/60 p-1.5 rounded border border-stone-800">
                                ⚔️ {preset.attacks.map(a => `${a.name} (+${a.bonus}, ${a.damage})`).join('; ')}
                              </div>
                            )}

                            {/* Carrying Capacity chips */}
                            <div className="flex items-center gap-2 text-[10px] font-mono text-stone-400">
                              <span>Load: {preset.carryingCapacityLbs.light} / {preset.carryingCapacityLbs.medium} / {preset.carryingCapacityLbs.heavy} lbs</span>
                            </div>

                            <p className="text-[11px] text-stone-400 leading-relaxed">
                              {preset.description}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
                            <span className="text-[10px] text-stone-500">{preset.source}</span>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMountForPurchase(preset);
                                setCustomMountName('');
                              }}
                              disabled={!canAfford}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                canAfford
                                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md'
                                  : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                              }`}
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>{canAfford ? `Buy (${preset.costGp} GP)` : 'Need More GP'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {vendorCategory === 'tack' && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-950/30 border border-amber-700/40 rounded-xl text-xs text-amber-200 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p>
                      Official saddles, harnesses, barding, and stabling services. Military saddles grant a +2 bonus to stay seated in combat; barding bolsters mount Armor Class. Purchased tack items are added directly to your inventory.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {OFFICIAL_TACK_PRESETS.map((tack) => {
                      const canAfford = totalWealthGp >= tack.costGp - 0.001;

                      return (
                        <div
                          key={tack.id}
                          className="bg-stone-950 border border-stone-800 hover:border-stone-700 p-3.5 rounded-xl flex flex-col justify-between gap-2.5 transition"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-bold text-stone-100 text-xs sm:text-sm">
                                  {tack.name}
                                </div>
                                <div className="text-[11px] text-stone-400 font-mono">
                                  Category: {tack.category} • Weight: {tack.weightLbs} lbs
                                  {tack.acBonus && (
                                    <span className="text-blue-300 ml-1.5 font-bold">+{tack.acBonus} AC</span>
                                  )}
                                </div>
                              </div>

                              <span className="font-mono font-bold text-amber-400 text-xs sm:text-sm">
                                {tack.costDisplay || `${tack.costGp} GP`}
                              </span>
                            </div>

                            <p className="text-[11px] text-stone-400 leading-relaxed">
                              {tack.notes}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-stone-800 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleBuyTack(tack)}
                              disabled={!canAfford}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                canAfford
                                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow'
                                  : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                              }`}
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>{canAfford ? `Buy (${tack.costDisplay || `${tack.costGp} GP`})` : 'Need More GP'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-950 p-4 border-t border-stone-800 flex items-center justify-between text-xs">
          <div className="text-stone-400">
            {activeMount ? (
              <span className="flex items-center gap-1.5">
                Active Steed: <b className="text-amber-200">{activeMount.name}</b> ({activeMount.type})
              </span>
            ) : (
              <span>No active steed selected</span>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Close Stables
          </button>
        </div>
      </div>

      {/* CONFIRMATION / NAMING MODAL FOR PURCHASING MOUNT */}
      {selectedMountForPurchase && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-amber-500 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-bold text-amber-200 text-sm flex items-center gap-2">
                <span>🐎 Purchase {selectedMountForPurchase.name}</span>
              </h3>
              <button
                onClick={() => setSelectedMountForPurchase(null)}
                className="text-stone-400 hover:text-stone-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-stone-400">Mount Price:</span>
                  <span className="font-mono font-bold text-amber-400">{selectedMountForPurchase.costGp} GP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Total Purse Available:</span>
                  <span className="font-mono font-bold text-amber-300">{wealthInfo.displayText}</span>
                </div>
                <div className="flex justify-between text-[11px] text-stone-400">
                  <span>Coinage:</span>
                  <span className="font-mono">{wealthInfo.breakdown}</span>
                </div>
                <div className="flex justify-between border-t border-stone-800 pt-1">
                  <span className="text-stone-400">Remaining After:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    ~{Math.max(0, totalWealthGp - selectedMountForPurchase.costGp).toLocaleString(undefined, { minimumFractionDigits: (totalWealthGp - selectedMountForPurchase.costGp) % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 })} GP
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  Give Your Steed a Name (Optional):
                </label>
                <input
                  type="text"
                  value={customMountName}
                  onChange={(e) => setCustomMountName(e.target.value)}
                  placeholder={`e.g. Shadowfax, Roach, Thunder...`}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100 placeholder-stone-500 focus:border-amber-500 focus:outline-none"
                  autoFocus
                />
                <span className="text-[10px] text-stone-500 mt-1 block">
                  Defaults to "{selectedMountForPurchase.name}" if left empty.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                onClick={() => setSelectedMountForPurchase(null)}
                className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBuyMountConfirm}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirm Purchase ({selectedMountForPurchase.costGp} GP)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
