import React, { useState } from 'react';
import { CharacterData, AbilityName } from '../../types';
import { UserProfile, saveCharacterToCloud, GameSession } from '../../lib/firebase';
import {
  getAbilityModifier,
  formatModifier,
  getProficiencyBonus,
  getPassivePerception,
  getEffectiveMaxHp,
  isCharacterDead
} from '../../utils/dndCalculations';
import {
  Crown,
  Heart,
  Shield,
  Zap,
  Footprints,
  Award,
  Eye,
  Sparkles,
  Plus,
  Minus,
  Users,
  Search,
  Activity,
  Flame,
  AlertTriangle,
  RefreshCw,
  Skull,
  UserCheck,
  Check,
  X,
  ExternalLink,
  Swords,
  Coins,
  Scroll,
  HelpCircle,
  MapPin,
  Compass,
  Flag,
  ShieldCheck
} from 'lucide-react';

import { KnowledgeGraphCard, KnowledgeEntity } from '../common/KnowledgeGraphCard';
import { DmAmbienceBroadcastStudio } from './DmAmbienceBroadcastStudio';
import { SoundscapePanel } from '../audio/SoundscapePanel';

interface SheetDmOverviewProps {
  activeSession: GameSession;
  allCharacters: CharacterData[];
  currentUser: UserProfile | null;
  onUpdateCharacter: (updated: CharacterData) => void;
  onDetach?: () => void;
  onOpenUpgradeModal?: (reason?: string, tier?: 'hero' | 'guild') => void;
  onOpenGenerators?: (tab?: 'npc' | 'encounter' | 'treasure' | 'session' | 'rules' | 'dungeon') => void;
  onOpenCopilot?: () => void;
  onOpenCampaignLoreVault?: (tab?: any) => void;
}

const COMMON_CONDITIONS = [
  'Blinded',
  'Charmed',
  'Deafened',
  'Frightened',
  'Grappled',
  'Incapacitated',
  'Invisible',
  'Paralyzed',
  'Petrified',
  'Poisoned',
  'Prone',
  'Restrained',
  'Stunned',
  'Unconscious',
  'Dead'
];

export const SheetDmOverview: React.FC<SheetDmOverviewProps> = ({
  activeSession,
  allCharacters,
  currentUser,
  onUpdateCharacter,
  onDetach,
  onOpenUpgradeModal,
  onOpenGenerators,
  onOpenCopilot,
  onOpenCampaignLoreVault
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [quickAmountMap, setQuickAmountMap] = useState<Record<string, string>>({});
  const [conditionSelectMap, setConditionSelectMap] = useState<Record<string, string>>({});

  // Gather characters that belong to members of the active session
  const sessionMembers = activeSession.members || [];
  const memberCharacterIds = new Set(
    sessionMembers.map((m) => m.characterId).filter(Boolean) as string[]
  );

  // Filter characters in the session
  const sessionCharacters = allCharacters.filter((c) =>
    memberCharacterIds.has(c.id)
  );

  const filteredCharacters = sessionCharacters.filter((c) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.characterClass.toLowerCase().includes(query) ||
      c.race.toLowerCase().includes(query)
    );
  });

  const handleStatChange = (
    character: CharacterData,
    field: keyof CharacterData,
    value: any
  ) => {
    const updated = {
      ...character,
      [field]: value
    };
    onUpdateCharacter(updated);
    if (currentUser?.uid) {
      saveCharacterToCloud(currentUser.uid, updated);
    }
  };

  const handleHpChange = (character: CharacterData, delta: number) => {
    const currentHp = character.hpCurrent ?? 0;
    const maxHp = getEffectiveMaxHp(character);
    const newHp = Math.max(0, Math.min(maxHp, currentHp + delta));
    handleStatChange(character, 'hpCurrent', newHp);
  };

  const handleApplyDamageOrHeal = (
    character: CharacterData,
    type: 'damage' | 'heal'
  ) => {
    const rawVal = quickAmountMap[character.id] || '';
    const amount = parseInt(rawVal, 10);
    if (isNaN(amount) || amount <= 0) return;

    if (type === 'heal') {
      const currentHp = character.hpCurrent ?? 0;
      const maxHp = getEffectiveMaxHp(character);
      const newHp = Math.min(maxHp, currentHp + amount);
      handleStatChange(character, 'hpCurrent', newHp);
    } else {
      // Damage calculation with Temp HP buffer
      let remainingDamage = amount;
      let tempHp = character.hpTemp || 0;
      let currentHp = character.hpCurrent || 0;

      if (tempHp > 0) {
        if (tempHp >= remainingDamage) {
          tempHp -= remainingDamage;
          remainingDamage = 0;
        } else {
          remainingDamage -= tempHp;
          tempHp = 0;
        }
      }

      currentHp = Math.max(0, currentHp - remainingDamage);

      const updated = {
        ...character,
        hpTemp: tempHp,
        hpCurrent: currentHp
      };
      onUpdateCharacter(updated);
      if (currentUser?.uid) {
        saveCharacterToCloud(currentUser.uid, updated);
      }
    }

    setQuickAmountMap((prev) => ({ ...prev, [character.id]: '' }));
  };

  const handleToggleInspiration = (character: CharacterData) => {
    handleStatChange(character, 'inspiration', !character.inspiration);
  };

  const handleAddCondition = (character: CharacterData, condName: string) => {
    if (!condName) return;
    const currentConds = character.conditions || [];
    if (!currentConds.includes(condName)) {
      handleStatChange(character, 'conditions', [...currentConds, condName]);
    }
  };

  const handleRemoveCondition = (character: CharacterData, condName: string) => {
    const currentConds = character.conditions || [];
    handleStatChange(
      character,
      'conditions',
      currentConds.filter((c) => c !== condName)
    );
  };

  const handleGrantAllInspiration = () => {
    sessionCharacters.forEach((c) => {
      if (!c.inspiration) {
        handleStatChange(c, 'inspiration', true);
      }
    });
  };

  const handleClearAllInspiration = () => {
    sessionCharacters.forEach((c) => {
      if (c.inspiration) {
        handleStatChange(c, 'inspiration', false);
      }
    });
  };

  const handleHealParty10 = () => {
    sessionCharacters.forEach((c) => {
      const maxHp = getEffectiveMaxHp(c);
      const newHp = Math.min(maxHp, (c.hpCurrent || 0) + 10);
      handleStatChange(c, 'hpCurrent', newHp);
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-stone-950 via-purple-950/40 to-stone-950 border border-purple-800/50 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <h1 className="text-lg sm:text-xl font-serif font-bold text-amber-200 tracking-wide">
                DM Party Live Dashboard
              </h1>
              <span className="text-xs font-serif bg-purple-950 text-purple-300 border border-purple-700/60 px-2.5 py-0.5 rounded-full font-bold">
                Campaign: {activeSession.name}
              </span>
            </div>
            <p className="text-xs text-stone-400 max-w-2xl">
              Live monitor and instant stat overrides for all characters connected to campaign{' '}
              <strong className="text-amber-300 font-mono">{activeSession.name}</strong>. Changes made here broadcast live to players in real-time.
            </p>
          </div>

          {/* Quick Party Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleGrantAllInspiration}
              className="px-3 py-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/50 text-amber-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Grant Inspiration to all session characters"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Grant All Inspiration</span>
            </button>

            <button
              onClick={handleClearAllInspiration}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
              title="Clear Inspiration from all characters"
            >
              <X className="w-3.5 h-3.5 text-stone-400" />
              <span>Clear Inspiration</span>
            </button>

            <button
              onClick={handleHealParty10}
              className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Heal all session characters by +10 HP"
            >
              <Heart className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/30" />
              <span>Party +10 HP</span>
            </button>

            {onDetach && (
              <button
                onClick={onDetach}
                className="px-3 py-1.5 bg-purple-900/80 hover:bg-purple-800 border border-purple-500/50 text-purple-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                title="Pop out DM Overview into a separate window for secondary screen / monitor"
              >
                <ExternalLink className="w-3.5 h-3.5 text-purple-300" />
                <span>Pop Out to 2nd Screen</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="mt-4 pt-3 border-t border-purple-900/30 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter session party members by name or class..."
              className="w-full bg-stone-900/90 border border-stone-700 text-stone-200 pl-9 pr-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="text-xs font-mono text-stone-400 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            <span>
              Connected Party Characters: <strong className="text-amber-300">{sessionCharacters.length}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Tabletop In-Flow AI Generators Toolbar for DMs */}
      {onOpenGenerators && (
        <div className="bg-stone-950/90 border border-amber-500/30 rounded-2xl p-4 shadow-lg space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="font-serif font-bold text-sm text-stone-100">
                In-Flow Tabletop AI Generators (Phase B)
              </span>
              <span className="text-[10px] font-mono uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                Instant Oracle
              </span>
            </div>
            <span className="text-xs text-stone-400 hidden sm:inline">
              1-click tactical generators with direct sheet & combat imports
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            <button
              onClick={() => onOpenGenerators('encounter')}
              className="p-2.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 border border-purple-800/50 text-purple-200 text-xs font-semibold flex flex-col items-center gap-1.5 transition cursor-pointer group"
            >
              <Swords className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <span>⚔️ Encounter</span>
            </button>

            <button
              onClick={() => onOpenGenerators('npc')}
              className="p-2.5 rounded-xl bg-amber-950/50 hover:bg-amber-900/60 border border-amber-800/50 text-amber-200 text-xs font-semibold flex flex-col items-center gap-1.5 transition cursor-pointer group"
            >
              <Users className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>🧝 Quick NPC</span>
            </button>

            <button
              onClick={() => onOpenGenerators('treasure')}
              className="p-2.5 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/50 text-emerald-200 text-xs font-semibold flex flex-col items-center gap-1.5 transition cursor-pointer group"
            >
              <Coins className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>💎 Roll Hoard</span>
            </button>

            <button
              onClick={() => onOpenGenerators('session')}
              className="p-2.5 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-800/50 text-cyan-200 text-xs font-semibold flex flex-col items-center gap-1.5 transition cursor-pointer group"
            >
              <Scroll className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>📜 Recap / Log</span>
            </button>

            <button
              onClick={() => onOpenGenerators('rules')}
              className="p-2.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-700/50 text-amber-300 text-xs font-semibold flex flex-col items-center gap-1.5 transition cursor-pointer group"
            >
              <HelpCircle className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>🔮 Rule Arbiter</span>
            </button>

            <button
              onClick={() => onOpenGenerators('dungeon')}
              className="p-2.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/50 text-rose-200 text-xs font-semibold flex flex-col items-center gap-1.5 transition cursor-pointer group"
            >
              <MapPin className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
              <span>🗺️ Dungeon Room</span>
            </button>

            {onOpenCampaignLoreVault && (
              <>
                <button
                  onClick={() => onOpenCampaignLoreVault('atlas')}
                  className="p-2.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/70 border border-amber-500/60 text-amber-200 text-xs font-semibold flex flex-col items-center gap-1.5 transition cursor-pointer group shadow-sm"
                  title="Open Campaign World Atlas & Region Map"
                >
                  <Compass className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
                  <span>🌍 World Atlas</span>
                </button>

                <button
                  onClick={() => onOpenCampaignLoreVault('quests')}
                  className="p-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/60 text-emerald-200 text-xs font-semibold flex flex-col items-center gap-1.5 transition cursor-pointer group shadow-sm"
                  title="Open Quest Tracker & Objectives"
                >
                  <Flag className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>⚔️ Quests</span>
                </button>

                <button
                  onClick={() => onOpenCampaignLoreVault('factions')}
                  className="p-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/70 border border-purple-500/60 text-purple-200 text-xs font-semibold flex flex-col items-center gap-1.5 transition cursor-pointer group shadow-sm"
                  title="Open Faction Standing Matrix"
                >
                  <ShieldCheck className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span>🛡️ Factions</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Phase C: Live Session Procedural Audio Synthesizer */}
      <SoundscapePanel />

      {/* Campaign Ambience & Music Broadcast Studio */}
      <DmAmbienceBroadcastStudio
        activeSession={activeSession}
        currentUser={currentUser}
        onOpenUpgradeModal={onOpenUpgradeModal}
      />

      {/* Main Character Cards Grid */}
      {sessionCharacters.length === 0 ? (
        <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-8 text-center space-y-3">
          <Users className="w-10 h-10 text-stone-600 mx-auto" />
          <h2 className="text-base font-serif font-bold text-amber-200">No Characters Currently in Session</h2>
          <p className="text-xs text-stone-400 max-w-md mx-auto leading-relaxed">
            Players joining campaign <strong className="text-amber-300 font-serif">{activeSession.name}</strong> will automatically appear here once they assign their characters. You can also pre-add participant characters in the Session Lobby Modal.
          </p>
        </div>
      ) : filteredCharacters.length === 0 ? (
        <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-6 text-center text-stone-400 text-xs italic">
          No party members match filter "{searchQuery}".
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredCharacters.map((char) => {
            const memberInfo = sessionMembers.find((m) => m.characterId === char.id);
            const maxHp = getEffectiveMaxHp(char);
            const currentHp = char.hpCurrent ?? 0;
            const tempHp = char.hpTemp ?? 0;
            const hpPercent = Math.min(100, Math.max(0, Math.round((currentHp / maxHp) * 100)));
            const isDead = isCharacterDead(char);
            const profBonus = getProficiencyBonus(char.level);
            const passiveWis = getPassivePerception(char);

            return (
              <div
                key={char.id}
                className={`bg-stone-950/90 border rounded-2xl p-4 sm:p-5 space-y-4 shadow-md transition ${
                  isDead
                    ? 'border-rose-900/80 bg-rose-950/10'
                    : char.inspiration
                    ? 'border-amber-600/70 shadow-amber-900/10 ring-1 ring-amber-500/20'
                    : 'border-stone-800 hover:border-stone-700'
                }`}
              >
                {/* Character Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {char.portraitUrl ? (
                        <img
                          src={char.portraitUrl}
                          alt={char.name}
                          className="w-12 h-12 rounded-xl object-cover border border-stone-700"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-stone-900 border border-stone-700 flex items-center justify-center text-amber-400 font-serif font-bold text-lg">
                          {char.name.charAt(0)}
                        </div>
                      )}
                      {char.inspiration && (
                        <span
                          className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-stone-950 rounded-full flex items-center justify-center text-[10px] font-bold shadow animate-pulse"
                          title="Inspiration Active!"
                        >
                          ✨
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-serif font-bold text-amber-200">
                          {char.name}
                        </h2>
                        {isDead && (
                          <span className="text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-700/60 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                            <Skull className="w-3 h-3 text-rose-400" /> DEAD
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-400 flex flex-wrap items-center gap-x-2">
                        <span>Lvl {char.level} {char.characterClass}</span>
                        <span>•</span>
                        <span>{char.race}</span>
                        {char.subclass && (
                          <>
                            <span>•</span>
                            <span className="text-stone-300">{char.subclass}</span>
                          </>
                        )}
                      </div>
                      <div className="text-[11px] text-purple-400 font-mono mt-0.5">
                        Player: {memberInfo?.displayName || 'Session Participant'}
                      </div>
                    </div>
                  </div>

                  {/* Inspiration Toggle Button */}
                  <button
                    onClick={() => handleToggleInspiration(char)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                      char.inspiration
                        ? 'bg-amber-950 text-amber-200 border-amber-500 shadow-sm shadow-amber-500/20'
                        : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                    }`}
                    title="Toggle Inspiration for this player"
                  >
                    <Sparkles
                      className={`w-3.5 h-3.5 ${
                        char.inspiration ? 'text-amber-400' : 'text-stone-500'
                      }`}
                    />
                    <span>{char.inspiration ? 'Inspiration ON' : 'Grant Inspiration'}</span>
                  </button>
                </div>

                {/* HP Controls Section */}
                <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-stone-300 font-serif font-bold flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/30" /> Hit Points (HP)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-300 font-bold text-sm">
                        {currentHp} / {maxHp} HP
                      </span>
                      {tempHp > 0 && (
                        <span className="text-cyan-300 font-bold text-xs bg-cyan-950/80 border border-cyan-700/60 px-1.5 py-0.2 rounded">
                          +{tempHp} Temp
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Visual HP Bar */}
                  <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                    <div
                      className={`h-full transition-all duration-300 ${
                        hpPercent <= 25
                          ? 'bg-rose-600'
                          : hpPercent <= 50
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${hpPercent}%` }}
                    />
                  </div>

                  {/* Quick HP Adjustment Buttons & Inputs */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    {/* -5 / -1 / +1 / +5 Quick Adjustments */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleHpChange(char, -5)}
                        className="px-2 py-0.5 bg-stone-900 hover:bg-rose-950/80 border border-stone-700 text-rose-300 rounded font-mono text-xs font-bold transition cursor-pointer"
                        title="-5 HP"
                      >
                        -5
                      </button>
                      <button
                        onClick={() => handleHpChange(char, -1)}
                        className="px-2 py-0.5 bg-stone-900 hover:bg-rose-950/80 border border-stone-700 text-rose-300 rounded font-mono text-xs font-bold transition cursor-pointer"
                        title="-1 HP"
                      >
                        -1
                      </button>
                      <button
                        onClick={() => handleHpChange(char, 1)}
                        className="px-2 py-0.5 bg-stone-900 hover:bg-emerald-950/80 border border-stone-700 text-emerald-300 rounded font-mono text-xs font-bold transition cursor-pointer"
                        title="+1 HP"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => handleHpChange(char, 5)}
                        className="px-2 py-0.5 bg-stone-900 hover:bg-emerald-950/80 border border-stone-700 text-emerald-300 rounded font-mono text-xs font-bold transition cursor-pointer"
                        title="+5 HP"
                      >
                        +5
                      </button>
                    </div>

                    {/* Damage / Heal Custom Calculator Input */}
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        placeholder="Amt"
                        value={quickAmountMap[char.id] || ''}
                        onChange={(e) =>
                          setQuickAmountMap((prev) => ({
                            ...prev,
                            [char.id]: e.target.value
                          }))
                        }
                        className="w-14 bg-stone-950 border border-stone-700 text-stone-200 px-2 py-0.5 rounded text-xs font-mono text-center focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={() => handleApplyDamageOrHeal(char, 'damage')}
                        disabled={!quickAmountMap[char.id]}
                        className="px-2 py-0.5 bg-rose-950 hover:bg-rose-900 disabled:opacity-40 border border-rose-700 text-rose-200 rounded text-xs font-bold transition cursor-pointer"
                        title="Apply damage"
                      >
                        Dmg
                      </button>
                      <button
                        onClick={() => handleApplyDamageOrHeal(char, 'heal')}
                        disabled={!quickAmountMap[char.id]}
                        className="px-2 py-0.5 bg-emerald-950 hover:bg-emerald-900 disabled:opacity-40 border border-emerald-700 text-emerald-200 rounded text-xs font-bold transition cursor-pointer"
                        title="Apply heal"
                      >
                        Heal
                      </button>
                    </div>
                  </div>

                  {/* Editable Current & Max HP Direct Fields */}
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-stone-800 text-[11px] font-mono">
                    <div>
                      <span className="text-stone-500 block">Current HP</span>
                      <input
                        type="number"
                        value={char.hpCurrent ?? 0}
                        onChange={(e) =>
                          handleStatChange(
                            char,
                            'hpCurrent',
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-full bg-stone-950 border border-stone-800 rounded px-1.5 py-0.5 text-stone-200 font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <span className="text-stone-500 block">Max HP</span>
                      <input
                        type="number"
                        value={char.hpMax ?? 10}
                        onChange={(e) =>
                          handleStatChange(
                            char,
                            'hpMax',
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-full bg-stone-950 border border-stone-800 rounded px-1.5 py-0.5 text-stone-200 font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <span className="text-stone-500 block">Temp HP</span>
                      <input
                        type="number"
                        value={char.hpTemp ?? 0}
                        onChange={(e) =>
                          handleStatChange(
                            char,
                            'hpTemp',
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-full bg-stone-950 border border-stone-800 rounded px-1.5 py-0.5 text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Base Stats Grid (AC, Initiative, Speed, Prof Bonus, Passive Perception) */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {/* Armor Class */}
                  <div className="bg-stone-900/60 border border-stone-800 p-2 rounded-xl text-center space-y-1">
                    <span className="text-[10px] text-amber-400 font-serif font-bold uppercase block flex items-center justify-center gap-1">
                      <Shield className="w-3 h-3 text-amber-500" /> AC
                    </span>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() =>
                          handleStatChange(
                            char,
                            'armorClass',
                            Math.max(1, (char.armorClass || 10) - 1)
                          )
                        }
                        className="w-5 h-5 bg-stone-950 hover:bg-stone-800 border border-stone-700 text-stone-300 rounded font-bold text-xs flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-amber-200 text-sm w-6">
                        {char.armorClass || 10}
                      </span>
                      <button
                        onClick={() =>
                          handleStatChange(
                            char,
                            'armorClass',
                            (char.armorClass || 10) + 1
                          )
                        }
                        className="w-5 h-5 bg-stone-950 hover:bg-stone-800 border border-stone-700 text-stone-300 rounded font-bold text-xs flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Initiative Bonus */}
                  <div className="bg-stone-900/60 border border-stone-800 p-2 rounded-xl text-center space-y-1">
                    <span className="text-[10px] text-amber-400 font-serif font-bold uppercase block flex items-center justify-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" /> Initiative
                    </span>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() =>
                          handleStatChange(
                            char,
                            'initiativeBonus',
                            (char.initiativeBonus || 0) - 1
                          )
                        }
                        className="w-5 h-5 bg-stone-950 hover:bg-stone-800 border border-stone-700 text-stone-300 rounded font-bold text-xs flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-amber-200 text-sm w-7">
                        {formatModifier(char.initiativeBonus || 0)}
                      </span>
                      <button
                        onClick={() =>
                          handleStatChange(
                            char,
                            'initiativeBonus',
                            (char.initiativeBonus || 0) + 1
                          )
                        }
                        className="w-5 h-5 bg-stone-950 hover:bg-stone-800 border border-stone-700 text-stone-300 rounded font-bold text-xs flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Speed */}
                  <div className="bg-stone-900/60 border border-stone-800 p-2 rounded-xl text-center space-y-1">
                    <span className="text-[10px] text-amber-400 font-serif font-bold uppercase block flex items-center justify-center gap-1">
                      <Footprints className="w-3 h-3 text-amber-400" /> Speed
                    </span>
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="number"
                        step="5"
                        min="0"
                        value={char.speed || 30}
                        onChange={(e) =>
                          handleStatChange(
                            char,
                            'speed',
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-12 bg-stone-950 border border-stone-700 text-center font-mono font-bold text-amber-200 text-xs rounded p-0.5 focus:outline-none"
                      />
                      <span className="text-[10px] text-stone-500 font-mono">ft</span>
                    </div>
                  </div>

                  {/* Proficiency Bonus */}
                  <div className="bg-stone-900/60 border border-stone-800 p-2 rounded-xl text-center space-y-1">
                    <span className="text-[10px] text-amber-400 font-serif font-bold uppercase block flex items-center justify-center gap-1">
                      <Award className="w-3 h-3 text-amber-400" /> Prof Bonus
                    </span>
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-mono font-bold text-amber-200 text-sm">
                        +{profBonus}
                      </span>
                    </div>
                    <span className="text-[9px] text-stone-500 font-mono block">
                      Lvl {char.level}
                    </span>
                  </div>

                  {/* Passive Perception */}
                  <div className="bg-stone-900/60 border border-stone-800 p-2 rounded-xl text-center space-y-1 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-amber-400 font-serif font-bold uppercase block flex items-center justify-center gap-1">
                      <Eye className="w-3 h-3 text-blue-400" /> Passive WIS
                    </span>
                    <div className="font-mono font-bold text-blue-200 text-sm">
                      {passiveWis}
                    </div>
                    <span className="text-[9px] text-stone-500 font-mono block">
                      Perception
                    </span>
                  </div>
                </div>

                {/* Active Conditions Selector */}
                <div className="bg-stone-900/40 border border-stone-800/80 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-serif font-bold text-stone-300 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-amber-400" /> Active Conditions & Status
                    </span>

                    {/* Condition Add Selector */}
                    <select
                      value={conditionSelectMap[char.id] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          handleAddCondition(char, val);
                          setConditionSelectMap((prev) => ({ ...prev, [char.id]: '' }));
                        }
                      }}
                      className="bg-stone-950 border border-stone-700 text-stone-300 rounded text-xs px-2 py-0.5 focus:outline-none"
                    >
                      <option value="">+ Add Condition...</option>
                      {COMMON_CONDITIONS.map((cond) => (
                        <option
                          key={cond}
                          value={cond}
                          disabled={(char.conditions || []).includes(cond)}
                        >
                          {cond}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Active Condition Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 min-h-[28px]">
                    {(!char.conditions || char.conditions.length === 0) ? (
                      <span className="text-[11px] text-stone-500 italic">
                        No active status conditions
                      </span>
                    ) : (
                      char.conditions.map((cond) => (
                        <span
                          key={cond}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono font-semibold bg-stone-900 border border-amber-600/40 text-amber-200 shadow-sm"
                        >
                          <span>{cond}</span>
                          <button
                            onClick={() => handleRemoveCondition(char, cond)}
                            className="hover:text-rose-400 transition cursor-pointer"
                            title={`Remove ${cond}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Campaign Lore & Interconnected Knowledge Graph */}
      <div className="pt-6 border-t border-stone-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-base text-amber-200 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" /> Interconnected Knowledge Graph
            </h3>
            <p className="text-xs text-stone-400">Cross-linked campaign NPCs, factions, locations, and session references</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <KnowledgeGraphCard
            entity={{
              id: 'npc-gundren',
              name: 'Gundren Rockseeker (Dwarf Merchant)',
              type: 'npc',
              summary: 'Employer who hired party to escort supply wagon to Phandalin.',
              appearsInSessions: [
                { id: 's1', title: 'Session 1: Goblin Ambush' },
                { id: 's3', title: 'Session 3: Wave Echo Cave Trail' }
              ],
              memberOfFactions: [
                { id: 'f1', name: 'Rockseeker Mining Guild' }
              ],
              locatedAt: [
                { id: 'l1', name: 'Cragmaw Castle (Captured)' },
                { id: 'l2', name: 'Stonehill Inn' }
              ],
              allies: [
                { id: 'a1', name: 'Sildar Hallwinter' }
              ],
              enemies: [
                { id: 'e1', name: 'King Grol' },
                { id: 'e2', name: 'The Black Spider' }
              ],
              connectedQuests: [
                { id: 'q1', title: 'Find Gundren & Wave Echo Cave' }
              ],
              mentionedInNotes: [
                { id: 'n1', title: 'Cragmaw Hideout Map & Clues' }
              ]
            }}
          />

          <KnowledgeGraphCard
            entity={{
              id: 'npc-glasstaff',
              name: 'Iarno "Glasstaff" Albrek',
              type: 'npc',
              summary: 'Former Lords\' Alliance wizard turned leader of the Redbrand Ruffians.',
              appearsInSessions: [
                { id: 's2', title: 'Session 2: Redbrand Confrontation' }
              ],
              memberOfFactions: [
                { id: 'f2', name: 'Redbrand Ruffians' },
                { id: 'f3', name: 'Lords\' Alliance (Traitor)' }
              ],
              locatedAt: [
                { id: 'l3', name: 'Tresendar Manor Hideout' }
              ],
              enemies: [
                { id: 'e3', name: 'Sildar Hallwinter' },
                { id: 'e4', name: 'Phandalin Town Council' }
              ],
              connectedQuests: [
                { id: 'q2', title: 'Clear Tresendar Manor' }
              ],
              mentionedInNotes: [
                { id: 'n2', title: 'Intercepted Letter from Black Spider' }
              ]
            }}
          />
        </div>
      </div>
    </div>
  );
};
