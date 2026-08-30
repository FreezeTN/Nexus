import React, { useState } from 'react';
import {
  Shield,
  Plus,
  Minus,
  Sparkles,
  Users,
  Award,
  AlertTriangle,
  Flame,
  Search,
  ExternalLink,
  Lock,
  Unlock,
  CheckCircle2,
  Trash2,
  Edit3
} from 'lucide-react';
import {
  Faction,
  FactionCategory,
  FactionPerk
} from '../../types/campaign';
import {
  loadCampaignFactions,
  saveCampaignFactions
} from '../../services/campaignService';

interface FactionMatrixViewProps {
  onOpenKnowledgeGraph?: (entityName: string) => void;
}

export function getStandingTier(score: number): {
  label: string;
  color: string;
  bg: string;
  badge: string;
} {
  if (score >= 70) {
    return {
      label: 'Exalted (+70 to +100)',
      color: 'text-amber-300',
      bg: 'bg-amber-500',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    };
  }
  if (score >= 30) {
    return {
      label: 'Honored (+30 to +69)',
      color: 'text-emerald-300',
      bg: 'bg-emerald-500',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    };
  }
  if (score > 0) {
    return {
      label: 'Friendly (+1 to +29)',
      color: 'text-cyan-300',
      bg: 'bg-cyan-500',
      badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
    };
  }
  if (score === 0) {
    return {
      label: 'Neutral (0)',
      color: 'text-stone-300',
      bg: 'bg-stone-500',
      badge: 'bg-stone-500/20 text-stone-300 border-stone-500/40'
    };
  }
  if (score >= -20) {
    return {
      label: 'Unfriendly (-1 to -20)',
      color: 'text-orange-300',
      bg: 'bg-orange-500',
      badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40'
    };
  }
  if (score >= -60) {
    return {
      label: 'Hostile (-21 to -60)',
      color: 'text-red-400',
      bg: 'bg-red-500',
      badge: 'bg-red-500/20 text-red-300 border-red-500/40'
    };
  }
  return {
    label: 'Hated (-61 to -100)',
    color: 'text-red-500',
    bg: 'bg-red-700',
    badge: 'bg-red-950 text-red-400 border-red-800'
  };
}

export const FactionMatrixView: React.FC<FactionMatrixViewProps> = ({
  onOpenKnowledgeGraph
}) => {
  const [factions, setFactions] = useState<Faction[]>(() => loadCampaignFactions());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFactionId, setSelectedFactionId] = useState<string | null>(factions[0]?.id || null);

  const handleSaveFactions = (newFactions: Faction[]) => {
    setFactions(newFactions);
    saveCampaignFactions(newFactions);
  };

  const handleAdjustStanding = (factionId: string, delta: number) => {
    const target = factions.find(f => f.id === factionId);
    if (!target) return;

    const updated = factions.map(f => {
      if (f.id === factionId) {
        const newScore = Math.max(-100, Math.min(100, f.standing + delta));
        // Update unlocked perks
        const updatedPerks = f.perks.map(p => ({
          ...p,
          unlocked: newScore >= p.standingRequired
        }));
        return { ...f, standing: newScore, perks: updatedPerks };
      }
      // Apply inverse penalty to rivals if positive delta
      if (target.rivalFactionIds.includes(f.id) && delta > 0) {
        const rivalPenalty = Math.round(delta * -0.5);
        const newScore = Math.max(-100, Math.min(100, f.standing + rivalPenalty));
        const updatedPerks = f.perks.map(p => ({
          ...p,
          unlocked: newScore >= p.standingRequired
        }));
        return { ...f, standing: newScore, perks: updatedPerks };
      }
      return f;
    });

    handleSaveFactions(updated);
  };

  const selectedFaction = factions.find(f => f.id === selectedFactionId) || factions[0];

  const filteredFactions = factions.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Top Search & Overview */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search factions, syndicates, guilds..."
            className="w-full pl-9 pr-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="text-xs text-stone-400 font-mono">
          Tracking <strong>{factions.length} Major Factions</strong>
        </div>
      </div>

      {/* Main Grid: Faction List vs Selected Faction Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Faction Roster */}
        <div className="space-y-2.5">
          {filteredFactions.map((fac) => {
            const isSelected = selectedFaction?.id === fac.id;
            const tier = getStandingTier(fac.standing);
            // Convert -100..100 to 0..100% for progress bar
            const barPercent = Math.round(((fac.standing + 100) / 200) * 100);

            return (
              <div
                key={fac.id}
                onClick={() => setSelectedFactionId(fac.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-stone-900 border-amber-500 shadow-lg shadow-amber-950/40'
                    : 'bg-stone-950/80 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center justify-between pb-1.5">
                  <h4 className="font-serif font-bold text-xs text-stone-200 truncate flex-1">
                    {fac.name}
                  </h4>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${tier.badge}`}>
                    {fac.standing > 0 ? `+${fac.standing}` : fac.standing}
                  </span>
                </div>

                {/* Standing Bar */}
                <div className="w-full bg-stone-900 rounded-full h-1.5 overflow-hidden border border-stone-800 my-1.5">
                  <div
                    className={`h-full transition-all duration-300 ${tier.bg}`}
                    style={{ width: `${barPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-stone-400">
                  <span>{tier.label.split('(')[0]}</span>
                  <span>{fac.category}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Faction Detail Panel */}
        {selectedFaction && (
          <div className="lg:col-span-2 bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-2xl space-y-5">
            {/* Header with Title and Standing Controls */}
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-stone-800">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-amber-200">
                      {selectedFaction.name}
                    </h3>
                    <p className="text-xs text-stone-400 italic">
                      &quot;{selectedFaction.motto || 'Guiding the future of the realms.'}&quot;
                    </p>
                  </div>
                </div>
              </div>

              {/* Standing Quick Adjuster */}
              <div className="flex items-center gap-1.5 bg-stone-950 border border-stone-800 rounded-xl p-1.5">
                <span className="text-[10px] font-mono uppercase text-stone-400 px-1">Reputation:</span>
                <button
                  onClick={() => handleAdjustStanding(selectedFaction.id, -10)}
                  className="px-2 py-1 bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 rounded-lg text-xs font-bold transition cursor-pointer"
                  title="-10 Standing"
                >
                  -10
                </button>
                <button
                  onClick={() => handleAdjustStanding(selectedFaction.id, -5)}
                  className="px-1.5 py-1 bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300 rounded-lg text-xs font-bold transition cursor-pointer"
                  title="-5 Standing"
                >
                  -5
                </button>
                <span className={`px-2 text-xs font-mono font-bold ${getStandingTier(selectedFaction.standing).color}`}>
                  {selectedFaction.standing > 0 ? `+${selectedFaction.standing}` : selectedFaction.standing}
                </span>
                <button
                  onClick={() => handleAdjustStanding(selectedFaction.id, 5)}
                  className="px-1.5 py-1 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-bold transition cursor-pointer"
                  title="+5 Standing"
                >
                  +5
                </button>
                <button
                  onClick={() => handleAdjustStanding(selectedFaction.id, 10)}
                  className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 rounded-lg text-xs font-bold transition cursor-pointer"
                  title="+10 Standing"
                >
                  +10
                </button>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-stone-300 leading-relaxed bg-stone-950/60 p-3 rounded-xl border border-stone-800">
              {selectedFaction.description}
            </p>

            {/* Metadata Pills: HQ, Leader, Rivals */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800">
                <span className="text-[10px] font-mono text-stone-400 block">Headquarters</span>
                <strong className="text-stone-200">{selectedFaction.headquartersLocationName || 'Unknown'}</strong>
              </div>
              <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800">
                <span className="text-[10px] font-mono text-stone-400 block">Leader</span>
                <strong className="text-stone-200">{selectedFaction.leaderName || 'Unknown'}</strong>
              </div>
              <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800">
                <span className="text-[10px] font-mono text-stone-400 block">Rival Factions</span>
                <strong className="text-red-300">
                  {selectedFaction.rivalFactionNames.join(', ') || 'None'}
                </strong>
              </div>
            </div>

            {/* Faction Perks Tier Unlocks */}
            <div className="space-y-2">
              <div className="font-serif font-bold text-xs text-amber-300 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Faction Perks & Alliance Boons</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedFaction.perks.map((perk) => {
                  const isUnlocked = selectedFaction.standing >= perk.standingRequired;
                  return (
                    <div
                      key={perk.tier}
                      className={`p-3 rounded-xl border transition-all ${
                        isUnlocked
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                          : 'bg-stone-950/60 border-stone-800/80 text-stone-500 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-1">
                        <span className="font-bold text-xs flex items-center gap-1.5">
                          {isUnlocked ? (
                            <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-stone-500" />
                          )}
                          <span>{perk.name}</span>
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-950 text-stone-400 border border-stone-800">
                          Req: +{perk.standingRequired}
                        </span>
                      </div>
                      <p className="text-[11px] leading-snug mt-1">
                        {perk.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Secret DM Agenda */}
            {selectedFaction.secretAgenda && (
              <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 text-xs space-y-1">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Secret Agenda & Campaign Plot</span>
                </span>
                <p className="text-amber-200/90 font-mono text-[11px] leading-relaxed">
                  {selectedFaction.secretAgenda}
                </p>
              </div>
            )}

            {/* Bottom Knowledge Graph Sync */}
            {onOpenKnowledgeGraph && (
              <div className="pt-2 border-t border-stone-800 flex justify-end">
                <button
                  onClick={() => onOpenKnowledgeGraph(selectedFaction.name)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>View in Campaign Graph</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
