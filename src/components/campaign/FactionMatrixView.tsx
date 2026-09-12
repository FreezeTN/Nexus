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
  Edit3,
  MapPin,
  Clock,
  HelpCircle,
  Skull,
  HeartHandshake,
  Swords,
  Layers,
  FileText,
  Building
} from 'lucide-react';
import {
  Faction,
  FactionCategory,
  FactionPerk,
  FactionReputationLog
} from '../../types/campaign';
import {
  loadCampaignFactions,
  saveCampaignFactions,
  generateAiFaction
} from '../../services/campaignService';

interface FactionMatrixViewProps {
  initialSelectedName?: string;
  onOpenKnowledgeGraph?: (entityName: string) => void;
  onNavigateToAtlasLocation?: (locationName: string) => void;
}

export function getStandingTier(score: number): {
  label: string;
  category: 'allied' | 'friendly' | 'neutral' | 'unfriendly' | 'hostile' | 'hated';
  color: string;
  bg: string;
  border: string;
  badge: string;
  meterPercent: number; // 0% to 100% for progress bar
} {
  // Map -100..+100 to 0..100%
  const meterPercent = Math.round(((score + 100) / 200) * 100);

  if (score >= 70) {
    return {
      label: 'Exalted (+70 to +100)',
      category: 'allied',
      color: 'text-amber-300',
      bg: 'bg-amber-500',
      border: 'border-amber-500',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
      meterPercent
    };
  }
  if (score >= 30) {
    return {
      label: 'Honored (+30 to +69)',
      category: 'friendly',
      color: 'text-emerald-300',
      bg: 'bg-emerald-500',
      border: 'border-emerald-500',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
      meterPercent
    };
  }
  if (score > 0) {
    return {
      label: 'Friendly (+1 to +29)',
      category: 'friendly',
      color: 'text-cyan-300',
      bg: 'bg-cyan-500',
      border: 'border-cyan-500',
      badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50',
      meterPercent
    };
  }
  if (score === 0) {
    return {
      label: 'Neutral (0)',
      category: 'neutral',
      color: 'text-stone-300',
      bg: 'bg-stone-500',
      border: 'border-stone-500',
      badge: 'bg-stone-500/20 text-stone-300 border-stone-500/50',
      meterPercent
    };
  }
  if (score >= -20) {
    return {
      label: 'Unfriendly (-1 to -20)',
      category: 'unfriendly',
      color: 'text-orange-300',
      bg: 'bg-orange-500',
      border: 'border-orange-500',
      badge: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
      meterPercent
    };
  }
  if (score >= -60) {
    return {
      label: 'Hostile (-21 to -60)',
      category: 'hostile',
      color: 'text-red-400',
      bg: 'bg-red-500',
      border: 'border-red-500',
      badge: 'bg-red-500/20 text-red-300 border-red-500/50',
      meterPercent
    };
  }
  return {
    label: 'Hated & Nemesis (-61 to -100)',
    category: 'hated',
    color: 'text-rose-500',
    bg: 'bg-rose-700',
    border: 'border-rose-700',
    badge: 'bg-rose-950 text-rose-300 border-rose-800',
    meterPercent
  };
}

const CATEGORY_LABELS: Record<FactionCategory, { label: string; badge: string }> = {
  guild: { label: 'Trade & Artisan Guild', badge: 'bg-amber-950/60 text-amber-300 border-amber-500/40' },
  syndicate: { label: 'Secret Syndicate', badge: 'bg-purple-950/60 text-purple-300 border-purple-500/40' },
  military: { label: 'Order & Crown Military', badge: 'bg-blue-950/60 text-blue-300 border-blue-500/40' },
  religious: { label: 'Divine Church / Cult', badge: 'bg-yellow-950/60 text-yellow-300 border-yellow-500/40' },
  political: { label: 'Noble Council / Lords', badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' },
  arcane: { label: 'Arcane College / Cabal', badge: 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40' },
  underworld: { label: 'Shadow Underworld', badge: 'bg-red-950/60 text-red-400 border-red-500/40' }
};

export const FactionMatrixView: React.FC<FactionMatrixViewProps> = ({
  initialSelectedName,
  onOpenKnowledgeGraph,
  onNavigateToAtlasLocation
}) => {
  const [factions, setFactions] = useState<Faction[]>(() => loadCampaignFactions());
  const [searchQuery, setSearchQuery] = useState('');
  const [standingFilter, setStandingFilter] = useState<'all' | 'allied' | 'neutral' | 'hostile'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedFactionId, setSelectedFactionId] = useState<string | null>(factions[0]?.id || null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [showNewFactionModal, setShowNewFactionModal] = useState(false);
  const [logReason, setLogReason] = useState('');

  // Auto select initial faction if passed
  React.useEffect(() => {
    if (initialSelectedName) {
      const match = factions.find(f => f.name.toLowerCase().includes(initialSelectedName.toLowerCase()));
      if (match) {
        setSelectedFactionId(match.id);
      }
    }
  }, [initialSelectedName, factions]);

  const handleSaveFactions = (newFactions: Faction[]) => {
    setFactions(newFactions);
    saveCampaignFactions(newFactions);
  };

  const handleAdjustStanding = (factionId: string, delta: number, customReason?: string) => {
    const target = factions.find(f => f.id === factionId);
    if (!target) return;

    const reasonText = customReason || logReason.trim() || (delta > 0 ? `Diplomatic favor / mission completion` : `Hostile skirmish / broken treaty`);

    const updated = factions.map(f => {
      if (f.id === factionId) {
        const newScore = Math.max(-100, Math.min(100, f.standing + delta));
        // Update unlocked perks
        const updatedPerks = (f.perks || []).map(p => ({
          ...p,
          unlocked: newScore >= p.standingRequired
        }));
        // Append to reputation history
        const newLog: FactionReputationLog = {
          id: `log-${Date.now()}`,
          date: new Date().toLocaleDateString(),
          delta,
          reason: reasonText
        };
        const updatedHistory = [newLog, ...(f.reputationHistory || [])];

        return { ...f, standing: newScore, perks: updatedPerks, reputationHistory: updatedHistory };
      }
      // Apply inverse penalty to rivals if positive delta
      if ((target.rivalFactionIds || []).includes(f.id) && delta > 0) {
        const rivalPenalty = Math.round(delta * -0.5);
        const newScore = Math.max(-100, Math.min(100, f.standing + rivalPenalty));
        const updatedPerks = (f.perks || []).map(p => ({
          ...p,
          unlocked: newScore >= p.standingRequired
        }));
        const rivalLog: FactionReputationLog = {
          id: `log-rival-${Date.now()}`,
          date: new Date().toLocaleDateString(),
          delta: rivalPenalty,
          reason: `Suspicion from alliance with ${target.name}`
        };
        return { ...f, standing: newScore, perks: updatedPerks, reputationHistory: [rivalLog, ...(f.reputationHistory || [])] };
      }
      return f;
    });

    handleSaveFactions(updated);
    setLogReason('');
  };

  const handleUpdateSelectedFaction = (field: keyof Faction, value: any) => {
    if (!selectedFactionId) return;
    const updated = factions.map(f => f.id === selectedFactionId ? { ...f, [field]: value } : f);
    handleSaveFactions(updated);
  };

  const handleDeleteFaction = (id: string) => {
    const updated = factions.filter(f => f.id !== id);
    handleSaveFactions(updated);
    if (selectedFactionId === id) {
      setSelectedFactionId(updated[0]?.id || null);
    }
  };

  const handleGenerateAiFaction = async () => {
    setIsGeneratingAi(true);
    try {
      const generated = await generateAiFaction({
        category: categoryFilter !== 'all' ? (categoryFilter as FactionCategory) : 'syndicate',
        theme: 'D&D 5e High Fantasy / Sword Coast'
      });
      const updated = [...factions, generated];
      handleSaveFactions(updated);
      setSelectedFactionId(generated.id);
    } catch (e) {
      console.warn('Faction AI generation error', e);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const selectedFaction = factions.find(f => f.id === selectedFactionId) || factions[0];

  const filteredFactions = factions.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.leaderName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.headquartersLocationName || '').toLowerCase().includes(searchQuery.toLowerCase());

    const tier = getStandingTier(f.standing);
    const matchStanding = standingFilter === 'all' ||
      (standingFilter === 'allied' && (tier.category === 'allied' || tier.category === 'friendly')) ||
      (standingFilter === 'neutral' && tier.category === 'neutral') ||
      (standingFilter === 'hostile' && (tier.category === 'unfriendly' || tier.category === 'hostile' || tier.category === 'hated'));

    const matchCategory = categoryFilter === 'all' || f.category === categoryFilter;

    return matchSearch && matchStanding && matchCategory;
  });

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        {/* Search & Category Filter */}
        <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search factions, leaders, headquarters..."
              className="w-full pl-9 pr-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-stone-950 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-300 focus:border-amber-500 focus:outline-none"
          >
            <option value="all">All Faction Types</option>
            {Object.entries(CATEGORY_LABELS).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
        </div>

        {/* Standing Category Tabs */}
        <div className="flex items-center gap-1.5 bg-stone-950 p-1 rounded-2xl border border-stone-800 text-xs">
          <button
            onClick={() => setStandingFilter('all')}
            className={`px-2.5 py-1 rounded-xl font-bold transition cursor-pointer ${
              standingFilter === 'all' ? 'bg-amber-500 text-stone-950 shadow' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            All ({factions.length})
          </button>
          <button
            onClick={() => setStandingFilter('allied')}
            className={`px-2.5 py-1 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 ${
              standingFilter === 'allied' ? 'bg-emerald-600 text-stone-950 shadow' : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <HeartHandshake className="w-3 h-3" />
            <span>Allied</span>
          </button>
          <button
            onClick={() => setStandingFilter('neutral')}
            className={`px-2.5 py-1 rounded-xl font-bold transition cursor-pointer ${
              standingFilter === 'neutral' ? 'bg-stone-700 text-stone-100 shadow' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Neutral
          </button>
          <button
            onClick={() => setStandingFilter('hostile')}
            className={`px-2.5 py-1 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 ${
              standingFilter === 'hostile' ? 'bg-red-600 text-white shadow' : 'text-red-400 hover:text-red-300'
            }`}
          >
            <Swords className="w-3 h-3" />
            <span>Hostile</span>
          </button>
        </div>

        {/* AI Generator Action */}
        <button
          onClick={handleGenerateAiFaction}
          disabled={isGeneratingAi}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
          title="Synthesize a new guild or syndicate with perks, rivals, and secret agendas"
        >
          <Sparkles className="w-3.5 h-3.5 text-stone-950" />
          <span>{isGeneratingAi ? 'Synthesizing...' : 'AI Faction'}</span>
        </button>
      </div>

      {/* Main Faction Matrix Grid & Dossier View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Left Column: Faction Cards List */}
        <div className="space-y-2.5 lg:col-span-1 max-h-[640px] overflow-y-auto pr-1">
          {filteredFactions.map((fac) => {
            const isSelected = selectedFaction?.id === fac.id;
            const tier = getStandingTier(fac.standing);
            const categoryConfig = CATEGORY_LABELS[fac.category] || CATEGORY_LABELS.guild;

            return (
              <div
                key={fac.id}
                onClick={() => setSelectedFactionId(fac.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                  isSelected
                    ? 'bg-stone-900 border-amber-500/80 shadow-xl ring-1 ring-amber-500/50'
                    : 'bg-stone-950/80 border-stone-800/80 hover:border-stone-700 hover:bg-stone-900/60'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-serif font-bold text-sm text-stone-200">
                      {fac.name}
                    </h4>
                    <span className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded-md border mt-0.5 ${categoryConfig.badge}`}>
                      {categoryConfig.label}
                    </span>
                  </div>

                  {/* Standing Score Pill */}
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border shrink-0 ${tier.badge}`}>
                    {fac.standing > 0 ? `+${fac.standing}` : fac.standing}
                  </span>
                </div>

                {/* Visual Reputation Meter Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-stone-400">Standing: <strong className={tier.color}>{tier.label.split(' ')[0]}</strong></span>
                    <span className="text-stone-500">{fac.standing}/100</span>
                  </div>
                  <div className="w-full h-2 bg-stone-900 rounded-full overflow-hidden border border-stone-800 flex relative">
                    {/* Neutral Zero Marker Indicator */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-stone-500 z-10" />
                    {/* Meter fill */}
                    <div
                      style={{ width: `${tier.meterPercent}%` }}
                      className={`h-full transition-all duration-300 ${
                        fac.standing > 0 ? 'bg-emerald-500' : fac.standing < 0 ? 'bg-red-500' : 'bg-stone-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Perks count & Leader preview */}
                <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1 border-t border-stone-800/60">
                  <span>Leader: <strong className="text-stone-300">{fac.leaderName || 'Unknown'}</strong></span>
                  <span className="font-mono text-amber-400">
                    {fac.perks.filter(p => p.unlocked).length}/{fac.perks.length} Perks Active
                  </span>
                </div>
              </div>
            );
          })}

          {filteredFactions.length === 0 && (
            <div className="p-8 text-center text-xs text-stone-500 border border-dashed border-stone-800 rounded-2xl">
              No factions match current filter.
            </div>
          )}
        </div>

        {/* Right Column: Selected Faction Detailed Dossier & Diplomacy Dashboard */}
        <div className="lg:col-span-2 bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-2xl space-y-5">
          {selectedFaction ? (
            <div className="space-y-5">
              {/* Top Banner: Name, Category, Motto, Alignment */}
              <div className="flex items-start justify-between pb-4 border-b border-stone-800 flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-serif font-bold text-xl text-amber-200">
                      {selectedFaction.name}
                    </h3>
                    <span className={`text-xs font-mono px-2.5 py-0.5 rounded-lg border ${CATEGORY_LABELS[selectedFaction.category]?.badge || 'bg-stone-800 text-stone-300'}`}>
                      {CATEGORY_LABELS[selectedFaction.category]?.label || selectedFaction.category}
                    </span>
                    {selectedFaction.alignment && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-950 text-stone-400 border border-stone-800">
                        {selectedFaction.alignment}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400 italic mt-1">
                    &quot;{selectedFaction.motto || 'Guiding the future of the realms.'}&quot;
                  </p>
                </div>

                {/* Reputation Adjuster Controls */}
                <div className="bg-stone-950 p-2.5 rounded-2xl border border-stone-800 flex flex-col items-center gap-1.5 shadow-inner">
                  <span className="text-[10px] font-mono uppercase text-stone-400">Adjust Standing</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAdjustStanding(selectedFaction.id, -10)}
                      className="px-2 py-1 bg-red-950/80 hover:bg-red-900 text-red-300 text-xs font-mono font-bold rounded-lg border border-red-500/40 cursor-pointer"
                      title="-10 Standing"
                    >
                      -10
                    </button>
                    <button
                      onClick={() => handleAdjustStanding(selectedFaction.id, -5)}
                      className="px-2 py-1 bg-orange-950/80 hover:bg-orange-900 text-orange-300 text-xs font-mono font-bold rounded-lg border border-orange-500/40 cursor-pointer"
                      title="-5 Standing"
                    >
                      -5
                    </button>

                    <span className={`px-3 py-0.5 text-sm font-mono font-bold ${getStandingTier(selectedFaction.standing).color}`}>
                      {selectedFaction.standing > 0 ? `+${selectedFaction.standing}` : selectedFaction.standing}
                    </span>

                    <button
                      onClick={() => handleAdjustStanding(selectedFaction.id, 5)}
                      className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-xs font-mono font-bold rounded-lg border border-emerald-500/40 cursor-pointer"
                      title="+5 Standing"
                    >
                      +5
                    </button>
                    <button
                      onClick={() => handleAdjustStanding(selectedFaction.id, 10)}
                      className="px-2 py-1 bg-amber-950/80 hover:bg-amber-900 text-amber-300 text-xs font-mono font-bold rounded-lg border border-amber-500/40 cursor-pointer"
                      title="+10 Standing"
                    >
                      +10
                    </button>
                  </div>
                </div>
              </div>

              {/* Visual Reputation Meter Gauge */}
              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-stone-200">Party Alliance Tier:</span>
                    <span className={`font-mono font-bold ${getStandingTier(selectedFaction.standing).color}`}>
                      {getStandingTier(selectedFaction.standing).label}
                    </span>
                  </div>
                  <span className="font-mono text-stone-400 text-xs">{selectedFaction.standing} / 100</span>
                </div>

                {/* Progress bar gauge */}
                <div className="w-full h-3 bg-stone-900 rounded-full overflow-hidden border border-stone-800 relative flex">
                  {/* Zero marker */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-stone-500 z-10" title="Neutral (0)" />
                  <div
                    style={{ width: `${getStandingTier(selectedFaction.standing).meterPercent}%` }}
                    className={`h-full transition-all duration-300 ${
                      selectedFaction.standing >= 30 ? 'bg-gradient-to-r from-emerald-600 to-amber-500' :
                      selectedFaction.standing > 0 ? 'bg-cyan-500' :
                      selectedFaction.standing === 0 ? 'bg-stone-600' :
                      'bg-gradient-to-r from-rose-700 to-red-500'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-stone-500 px-0.5">
                  <span className="text-red-400">Nemesis (-100)</span>
                  <span className="text-stone-400">Neutral (0)</span>
                  <span className="text-amber-400">Exalted (+100)</span>
                </div>
              </div>

              {/* Faction Lore & Headquarters Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-stone-950 border border-stone-800 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-stone-400 flex items-center justify-between">
                    <span>Headquarters</span>
                    {selectedFaction.headquartersLocationName && onNavigateToAtlasLocation && (
                      <button
                        onClick={() => onNavigateToAtlasLocation(selectedFaction.headquartersLocationName || '')}
                        className="text-amber-400 hover:text-amber-300 flex items-center gap-0.5 cursor-pointer"
                        title="View location on World Atlas"
                      >
                        <MapPin className="w-2.5 h-2.5" />
                        <span>Map</span>
                      </button>
                    )}
                  </span>
                  <strong className="text-stone-200 block truncate">{selectedFaction.headquartersLocationName || 'Unknown'}</strong>
                </div>

                <div className="bg-stone-950 border border-stone-800 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-stone-400 block">Leader / Guildmaster</span>
                  <strong className="text-stone-200 block truncate">{selectedFaction.leaderName || 'Unknown'}</strong>
                </div>

                <div className="bg-stone-950 border border-stone-800 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-stone-400 block">Rival Factions</span>
                  <span className="text-red-300 font-mono text-[11px] block truncate">
                    {selectedFaction.rivalFactionNames.join(', ') || 'None'}
                  </span>
                </div>
              </div>

              {/* Faction Lore Description */}
              <div className="bg-stone-950 border border-stone-800 rounded-xl p-3.5 text-xs text-stone-300 leading-relaxed space-y-1">
                <span className="text-[10px] font-mono uppercase text-stone-400 block">Faction Chronicle & Purpose</span>
                <p>{selectedFaction.description}</p>
              </div>

              {/* Faction Perks & Alliance Boons */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Faction Perks & Alliance Boons</span>
                  </span>
                  <span className="text-[10px] font-mono text-stone-400">
                    Unlocks automatically as standing reaches requirements
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(selectedFaction.perks || []).map((perk) => {
                    const isUnlocked = selectedFaction.standing >= perk.standingRequired;
                    return (
                      <div
                        key={perk.name}
                        className={`p-3 rounded-xl border transition-all text-xs space-y-1 ${
                          isUnlocked
                            ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md'
                            : 'bg-stone-950/60 border-stone-800/80 opacity-65'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-bold text-stone-200 flex items-center gap-1.5">
                            {isUnlocked ? (
                              <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-stone-500" />
                            )}
                            <span>{perk.name}</span>
                          </span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                            isUnlocked ? 'bg-emerald-900/60 text-emerald-300' : 'bg-stone-900 text-stone-500'
                          }`}>
                            Req: +{perk.standingRequired}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 leading-normal">
                          {perk.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Secret DM Agenda (DM Eyes Only) */}
              {selectedFaction.secretAgenda && (
                <div className="bg-purple-950/30 border border-purple-500/30 rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-300">
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-purple-400" />
                      <span>Secret Agenda & Shadow Motives</span>
                    </span>
                    <span className="text-[10px] font-mono uppercase text-purple-400/70">DM Confidential</span>
                  </div>
                  <p className="text-xs text-purple-200/90 leading-relaxed">
                    {selectedFaction.secretAgenda}
                  </p>
                </div>
              )}

              {/* Reputation History / Diplomacy Chronicle */}
              {(selectedFaction.reputationHistory || []).length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-mono uppercase text-stone-400 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-stone-400" />
                    <span>Recent Diplomatic Shifts & Incident Log</span>
                  </span>
                  <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                    {selectedFaction.reputationHistory?.slice(0, 5).map((log) => (
                      <div key={log.id} className="flex items-center justify-between text-[11px] bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1">
                        <span className="text-stone-300">{log.reason}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-stone-500">{log.date}</span>
                          <span className={`font-mono font-bold ${log.delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {log.delta > 0 ? `+${log.delta}` : log.delta}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Actions Bar */}
              <div className="pt-3 border-t border-stone-800 flex items-center justify-between flex-wrap gap-2">
                {onOpenKnowledgeGraph && (
                  <button
                    onClick={() => onOpenKnowledgeGraph(selectedFaction.name)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Knowledge Graph</span>
                  </button>
                )}

                <button
                  onClick={() => handleDeleteFaction(selectedFaction.id)}
                  className="p-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs transition cursor-pointer"
                  title="Delete Faction"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-stone-500 text-xs">
              Select a faction from the list to view full diplomatic standing and unlocked boons.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
