import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Swords,
  Coins,
  Gem,
  Award,
  CheckCircle2,
  BookOpen,
  MapPin,
  X,
  Sparkles,
  Users,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  PackageCheck
} from 'lucide-react';
import { CharacterData, Party, GearItem } from '../../../types';
import { Combatant, SavedEncounterData } from './encounterTypes';
import { addCampaignJournalEntry } from '../../../services/campaignService';
import { PRESET_DND_ITEMS } from '../../../data/presetItems';

interface CombatVictoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  combatants: Combatant[];
  allies: Combatant[];
  enemies: Combatant[];
  roundNumber: number;
  linkedAtlasLocation?: SavedEncounterData['linkedAtlasLocation'];
  activeCharacter: CharacterData;
  allCharacters?: CharacterData[];
  parties?: Party[];
  onApplyXp?: (amount: number) => void;
  onUpdateCharacter?: (char: CharacterData) => void;
  onOpenCampaignLoreVault?: (tab?: 'atlas' | 'quests' | 'factions' | 'travel' | 'journal') => void;
}

export const CombatVictoryModal: React.FC<CombatVictoryModalProps> = ({
  isOpen,
  onClose,
  combatants,
  allies,
  enemies,
  roundNumber,
  linkedAtlasLocation,
  activeCharacter,
  allCharacters = [],
  parties = [],
  onApplyXp,
  onUpdateCharacter,
  onOpenCampaignLoreVault
}) => {
  if (!isOpen) return null;

  // Identify defeated foes
  const defeatedEnemies = useMemo(() => {
    const list = enemies.filter(c => c.hpCurrent <= 0 || c.isDefeated);
    return list.length > 0 ? list : enemies;
  }, [enemies]);

  // Aggregate foes by name
  const enemyGroups = useMemo(() => {
    const map = new Map<string, { name: string; count: number; totalXp: number; portraitUrl?: string }>();
    defeatedEnemies.forEach(e => {
      const xp = e.monsterXpReward || 450;
      if (!map.has(e.name)) {
        map.set(e.name, {
          name: e.name,
          count: 1,
          totalXp: xp,
          portraitUrl: e.portraitUrl
        });
      } else {
        const item = map.get(e.name)!;
        item.count += 1;
        item.totalXp += xp;
      }
    });
    return Array.from(map.values());
  }, [defeatedEnemies]);

  // Total XP
  const totalXp = useMemo(() => {
    return defeatedEnemies.reduce((sum, e) => sum + (e.monsterXpReward || 450), 0);
  }, [defeatedEnemies]);

  // Calculate or parse spoils (Gold & Items)
  const initialSpoils = useMemo(() => {
    let gp = 0;
    let sp = 0;
    let cp = 0;
    const items: Array<{ name: string; quantity: number; notes?: string; rarity?: string }> = [];

    // Parse from location treasure notes if available
    if (linkedAtlasLocation?.treasureNotes) {
      const notes = linkedAtlasLocation.treasureNotes;
      const gpMatch = notes.match(/(\d+)\s*(?:gp|gold)/i);
      const spMatch = notes.match(/(\d+)\s*(?:sp|silver)/i);
      const cpMatch = notes.match(/(\d+)\s*(?:cp|copper)/i);

      if (gpMatch) gp = parseInt(gpMatch[1], 10);
      if (spMatch) sp = parseInt(spMatch[1], 10);
      if (cpMatch) cp = parseInt(cpMatch[1], 10);

      // Split remaining comma-separated items
      const parts = notes.split(',').map(s => s.trim()).filter(Boolean);
      parts.forEach(part => {
        if (!part.match(/^\d+\s*(?:gp|sp|cp|gold|silver|copper)/i)) {
          items.push({
            name: part,
            quantity: 1,
            rarity: 'Relic / Lore Spoils',
            notes: `Recovered from ${linkedAtlasLocation.name}`
          });
        }
      });
    }

    // Default procedural loot if nothing parsed or zero gold
    if (gp === 0 && items.length === 0) {
      // Base gold on enemies count & round number
      gp = Math.max(50, defeatedEnemies.length * 75);
      sp = Math.floor(Math.random() * 40) + 10;

      // Suggest 1-2 thematic preset items
      if (defeatedEnemies.length > 0) {
        items.push({
          name: 'Potion of Healing',
          quantity: 2,
          rarity: 'Common',
          notes: 'Regains 2d4 + 2 hit points when consumed.'
        });
        items.push({
          name: 'Polished Bloodstone Gem (50 gp)',
          quantity: 1,
          rarity: 'Valuable',
          notes: 'Precious gemstone harvested from the vanquished.'
        });
      }
    }

    return { currency: { gp, sp, cp }, items };
  }, [linkedAtlasLocation, defeatedEnemies]);

  // Interactive local states
  const [xpDistributed, setXpDistributed] = useState<boolean>(false);
  const [xpDistributionType, setXpDistributionType] = useState<'solo' | 'party' | null>(null);
  const [lootClaimed, setLootClaimed] = useState<boolean>(false);
  const [loggedToJournal, setLoggedToJournal] = useState<boolean>(false);

  // Active party members
  const partyCharacters = useMemo(() => {
    if (allCharacters.length <= 1) return [activeCharacter];
    // Find party that active character belongs to
    const party = parties.find(p => p.characterIds.includes(activeCharacter.id));
    if (party) {
      return allCharacters.filter(c => party.characterIds.includes(c.id));
    }
    return [activeCharacter];
  }, [activeCharacter, allCharacters, parties]);

  // Handle XP distribution
  const handleAwardXp = (mode: 'solo' | 'party') => {
    if (xpDistributed) return;

    if (mode === 'solo') {
      if (onApplyXp) {
        onApplyXp(totalXp);
      } else if (onUpdateCharacter) {
        const currentXp = activeCharacter.experiencePoints || 0;
        onUpdateCharacter({
          ...activeCharacter,
          experiencePoints: currentXp + totalXp
        });
      }
    } else {
      const share = Math.floor(totalXp / Math.max(1, partyCharacters.length));
      if (onApplyXp && partyCharacters.length === 1) {
        onApplyXp(share);
      } else if (onUpdateCharacter) {
        // Award share to active character
        const currentXp = activeCharacter.experiencePoints || 0;
        onUpdateCharacter({
          ...activeCharacter,
          experiencePoints: currentXp + share
        });
      }
    }

    setXpDistributed(true);
    setXpDistributionType(mode);
  };

  // Handle Claiming Gold & Items into Active Character
  const handleClaimLoot = () => {
    if (lootClaimed || !onUpdateCharacter) return;

    const currentGold = activeCharacter.wealth?.gp || 0;
    const currentSp = activeCharacter.wealth?.sp || 0;
    const currentCp = activeCharacter.wealth?.cp || 0;
    const currentEp = activeCharacter.wealth?.ep || 0;
    const currentPp = activeCharacter.wealth?.pp || 0;

    const newGp = currentGold + initialSpoils.currency.gp;
    const newSp = currentSp + initialSpoils.currency.sp;
    const newCp = currentCp + initialSpoils.currency.cp;

    // Convert items into character gear
    const newGear: GearItem[] = initialSpoils.items.map(item => {
      // Find preset template for stats if exists
      const preset = PRESET_DND_ITEMS.find(p => p.name.toLowerCase() === item.name.toLowerCase());
      return {
        id: `gear-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: item.name,
        quantity: item.quantity || 1,
        weight: preset?.weight || 1,
        costGp: preset?.costGp || 10,
        equipped: false,
        notes: item.notes || preset?.notes || 'Harvested from encounter victory spoils.'
      };
    });

    const updatedInventory = [...(activeCharacter.inventory || []), ...newGear];

    onUpdateCharacter({
      ...activeCharacter,
      wealth: {
        cp: newCp,
        sp: newSp,
        ep: currentEp,
        gp: newGp,
        pp: currentPp
      },
      inventory: updatedInventory
    });

    setLootClaimed(true);
  };

  // Auto-log to Campaign Journal
  const handleLogToJournal = () => {
    if (loggedToJournal) return;

    const participants = allies
      .filter(a => a.type === 'player' || a.isPlayerChar)
      .map(a => a.name);

    if (participants.length === 0) {
      participants.push(activeCharacter.name);
    }

    const enemySummary = enemyGroups
      .map(g => `${g.count > 1 ? `${g.count}x ` : ''}${g.name}`)
      .join(', ');

    const locationName = linkedAtlasLocation?.name || 'Tactical Battleground';

    addCampaignJournalEntry({
      title: `Victory at ${locationName}`,
      category: 'encounter',
      locationId: linkedAtlasLocation?.id,
      locationName: linkedAtlasLocation?.name,
      summary: `The adventurers achieved a resounding victory against ${enemySummary} after ${roundNumber} tactical round${roundNumber === 1 ? '' : 's'}. All hostiles were vanquished or subdued.`,
      enemiesVanquished: enemyGroups.map(g => ({
        name: g.name,
        count: g.count,
        xpReward: g.totalXp
      })),
      totalXpAwarded: totalXp,
      lootHarvested: initialSpoils.items.map(i => ({
        name: i.name,
        quantity: i.quantity,
        notes: i.notes
      })),
      currencyFound: {
        gp: initialSpoils.currency.gp,
        sp: initialSpoils.currency.sp,
        cp: initialSpoils.currency.cp
      },
      participants,
      notes: linkedAtlasLocation?.dungeonBossName
        ? `Lair Boss: ${linkedAtlasLocation.dungeonBossName} slain.`
        : undefined
    });

    setLoggedToJournal(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-amber-500/50 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Glow accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-rose-500" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between gap-3 bg-stone-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-stone-950 shadow-lg shadow-amber-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-serif font-bold text-amber-100">
                  Encounter Victory & Spoils of War
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {roundNumber} Combat {roundNumber === 1 ? 'Round' : 'Rounds'}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                All hostiles defeated. Distribute experience, claim harvested treasure, and record this feat in the Campaign Chronicles.
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Linked World Atlas Location Badge */}
          {linkedAtlasLocation && (
            <div className="bg-gradient-to-r from-amber-950/50 via-stone-900 to-stone-950 border border-amber-500/40 rounded-xl p-3.5 flex items-center justify-between flex-wrap gap-3 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-serif font-bold text-amber-200 flex items-center gap-2">
                    <span>{linkedAtlasLocation.name}</span>
                    {linkedAtlasLocation.dangerLevel && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-950/80 text-rose-300 border border-rose-500/40">
                        {linkedAtlasLocation.dangerLevel}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-stone-400 flex items-center gap-3 mt-0.5">
                    {linkedAtlasLocation.climate && <span>Climate: {linkedAtlasLocation.climate}</span>}
                    {linkedAtlasLocation.dungeonBossName && (
                      <span className="text-rose-400 font-medium">Boss: {linkedAtlasLocation.dungeonBossName}</span>
                    )}
                  </div>
                </div>
              </div>

              {onOpenCampaignLoreVault && (
                <button
                  onClick={() => {
                    onOpenCampaignLoreVault('atlas');
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium border border-stone-700 transition flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3 text-amber-400" />
                  <span>Inspect on Atlas</span>
                </button>
              )}
            </div>
          )}

          {/* Section 1: Defeated Foes & XP Awarding */}
          <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-rose-300 font-bold">
                  Defeated Foes & Experience Pool
                </h3>
              </div>
              <div className="text-xs font-mono font-bold text-amber-400">
                Total XP: <span className="text-sm">+{totalXp.toLocaleString()} XP</span>
              </div>
            </div>

            {/* Foes list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {enemyGroups.map((foe, idx) => (
                <div
                  key={idx}
                  className="bg-stone-900 border border-stone-800/80 rounded-lg p-2.5 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {foe.portraitUrl ? (
                      <img src={foe.portraitUrl} alt={foe.name} className="w-7 h-7 rounded-full object-cover border border-stone-700 shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-400 flex items-center justify-center text-xs font-bold shrink-0">
                        {foe.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-stone-200 truncate">
                        {foe.count > 1 ? `${foe.count}x ` : ''}{foe.name}
                      </div>
                      <div className="text-[10px] text-stone-400">Vanquished</div>
                    </div>
                  </div>
                  <span className="font-mono text-amber-400 text-xs font-bold whitespace-nowrap">
                    +{foe.totalXp} XP
                  </span>
                </div>
              ))}
            </div>

            {/* XP Claim Controls */}
            <div className="pt-2 border-t border-stone-800 flex items-center justify-between flex-wrap gap-2">
              {xpDistributed ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    {xpDistributionType === 'solo'
                      ? `Awarded +${totalXp.toLocaleString()} XP to ${activeCharacter.name}`
                      : `Split +${totalXp.toLocaleString()} XP across ${partyCharacters.length} heroes (+${Math.floor(totalXp / Math.max(1, partyCharacters.length)).toLocaleString()} XP each)`}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  <button
                    onClick={() => handleAwardXp('solo')}
                    className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Award All to {activeCharacter.name} (+{totalXp.toLocaleString()} XP)</span>
                  </button>

                  {partyCharacters.length > 1 && (
                    <button
                      onClick={() => handleAwardXp('party')}
                      className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Split Across Party ({Math.floor(totalXp / partyCharacters.length)} XP each)</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Currency & Loot Drops */}
          <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-amber-300 font-bold">
                  Spoils & Loot Drops
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                {Boolean(initialSpoils.currency.gp) && (
                  <span className="text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30 font-bold">
                    {initialSpoils.currency.gp} GP
                  </span>
                )}
                {Boolean(initialSpoils.currency.sp) && (
                  <span className="text-stone-300 bg-stone-800 px-2 py-0.5 rounded border border-stone-600/40">
                    {initialSpoils.currency.sp} SP
                  </span>
                )}
                {Boolean(initialSpoils.currency.cp) && (
                  <span className="text-orange-300 bg-orange-950/60 px-2 py-0.5 rounded border border-orange-500/30">
                    {initialSpoils.currency.cp} CP
                  </span>
                )}
              </div>
            </div>

            {/* Dropped items */}
            {initialSpoils.items.length > 0 ? (
              <div className="space-y-1.5">
                {initialSpoils.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-stone-900 border border-stone-800/80 rounded-lg p-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Gem className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-bold text-stone-200 truncate">
                          {item.quantity > 1 ? `${item.quantity}x ` : ''}{item.name}
                        </div>
                        {item.notes && <div className="text-[10px] text-stone-400 truncate">{item.notes}</div>}
                      </div>
                    </div>
                    {item.rarity && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 shrink-0">
                        {item.rarity}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-stone-500 italic py-2">No special physical relics discovered.</div>
            )}

            {/* Claim Loot Button */}
            <div className="pt-2 border-t border-stone-800 flex justify-end">
              {lootClaimed ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                  <PackageCheck className="w-4 h-4 text-emerald-400" />
                  <span>Gold & Relics Added to {activeCharacter.name}&apos;s Inventory</span>
                </div>
              ) : (
                <button
                  onClick={handleClaimLoot}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow shadow-emerald-950/50"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Claim All Gold & Relics to Inventory</span>
                </button>
              )}
            </div>
          </div>

          {/* Section 3: Campaign Chronicle Logging */}
          <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="space-y-0.5 text-center sm:text-left">
              <div className="text-xs font-serif font-bold text-amber-200 flex items-center justify-center sm:justify-start gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Campaign Lore Vault Chronicle</span>
              </div>
              <p className="text-[11px] text-stone-400">
                Log this encounter, vanquished foes, and acquired spoils into the campaign chronicle for posterity.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {loggedToJournal ? (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-950/50 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Logged to Chronicle</span>
                  </span>
                  {onOpenCampaignLoreVault && (
                    <button
                      onClick={() => {
                        onOpenCampaignLoreVault('journal');
                        onClose();
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 text-xs font-medium transition cursor-pointer flex items-center gap-1"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>View Journal</span>
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleLogToJournal}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow shadow-indigo-950/40"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Log to Campaign Journal</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-stone-800 bg-stone-950/70 flex items-center justify-between gap-3">
          <span className="text-[11px] text-stone-400">
            {lootClaimed && xpDistributed ? '✨ All rewards collected & recorded!' : 'Review and claim spoils before closing.'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition cursor-pointer"
          >
            Close & Continue Adventure
          </button>
        </div>
      </div>
    </div>
  );
};
