import React, { useState } from 'react';
import {
  Scroll,
  Plus,
  Search,
  CheckCircle2,
  Circle,
  XCircle,
  Clock,
  Sparkles,
  Award,
  Coins,
  Shield,
  Trash2,
  Edit3,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MapPin,
  Users,
  Flame,
  Bot
} from 'lucide-react';
import {
  CampaignQuest,
  QuestCategory,
  QuestStatus,
  QuestStage
} from '../../types/campaign';
import {
  loadCampaignQuests,
  saveCampaignQuests,
  generateAiCampaignQuest
} from '../../services/campaignService';

interface QuestTrackerViewProps {
  onOpenKnowledgeGraph?: (entityName: string) => void;
  onOpenGenerators?: (tab?: 'npc' | 'encounter' | 'treasure' | 'session' | 'rules' | 'dungeon') => void;
}

const CATEGORY_CONFIG: Record<QuestCategory, { label: string; badge: string }> = {
  main: { label: 'Main Story Arc', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  side: { label: 'Side Quest', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
  personal: { label: 'Character Arc', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  faction: { label: 'Faction Assignment', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
  bounty: { label: 'Monster / Outlaw Bounty', badge: 'bg-red-500/20 text-red-300 border-red-500/40' },
  rumor: { label: 'Unverified Rumor / Hook', badge: 'bg-stone-500/20 text-stone-300 border-stone-500/40' }
};

export const QuestTrackerView: React.FC<QuestTrackerViewProps> = ({
  onOpenKnowledgeGraph,
  onOpenGenerators
}) => {
  const [quests, setQuests] = useState<CampaignQuest[]>(() => loadCampaignQuests());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [expandedQuestId, setExpandedQuestId] = useState<string | null>(quests[0]?.id || null);
  const [showNewQuestForm, setShowNewQuestForm] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // New Quest Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<QuestCategory>('side');
  const [newSummary, setNewSummary] = useState('');
  const [newGiver, setNewGiver] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newLevel, setNewLevel] = useState('Level 3 - 5');
  const [newXp, setNewXp] = useState('1500');
  const [newGold, setNewGold] = useState('500');
  const [newItems, setNewItems] = useState('');

  const handleSaveQuests = (newQuests: CampaignQuest[]) => {
    setQuests(newQuests);
    saveCampaignQuests(newQuests);
  };

  const handleToggleStage = (questId: string, stageId: string) => {
    const updated = quests.map(q => {
      if (q.id !== questId) return q;
      const newStages = q.stages.map(s => s.id === stageId ? { ...s, completed: !s.completed } : s);
      // If all non-optional stages are completed, auto-mark completed
      const allRequiredCompleted = newStages.filter(s => !s.optional).every(s => s.completed);
      return {
        ...q,
        stages: newStages,
        status: allRequiredCompleted ? ('completed' as QuestStatus) : q.status === 'completed' ? 'active' : q.status
      };
    });
    handleSaveQuests(updated);
  };

  const handleUpdateStatus = (questId: string, newStatus: QuestStatus) => {
    const updated = quests.map(q => q.id === questId ? { ...q, status: newStatus } : q);
    handleSaveQuests(updated);
  };

  const handleDeleteQuest = (questId: string) => {
    const updated = quests.filter(q => q.id !== questId);
    handleSaveQuests(updated);
    if (expandedQuestId === questId) setExpandedQuestId(null);
  };

  const handleAddCustomQuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const quest: CampaignQuest = {
      id: `quest-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      status: 'active',
      summary: newSummary.trim() || 'A new quest has been accepted by the party.',
      giverName: newGiver.trim() || 'Guildmaster',
      giverLocationName: newLocation.trim() || 'City Hub',
      recommendedLevel: newLevel,
      stages: [
        { id: `st-${Date.now()}-1`, text: 'Investigate the initial lead or rumor', completed: false },
        { id: `st-${Date.now()}-2`, text: 'Confront the challenge and secure the objective', completed: false }
      ],
      rewards: {
        xp: parseInt(newXp, 10) || 1000,
        gold: parseInt(newGold, 10) || 250,
        items: newItems.split(',').map(s => s.trim()).filter(Boolean)
      },
      createdAt: new Date().toISOString()
    };

    const updated = [quest, ...quests];
    handleSaveQuests(updated);
    setExpandedQuestId(quest.id);
    setShowNewQuestForm(false);
    setNewTitle('');
    setNewSummary('');
  };

  const handleGenerateAi = async () => {
    setIsGeneratingAi(true);
    try {
      const generated = await generateAiCampaignQuest({
        theme: 'D&D 5e / High Fantasy',
        category: categoryFilter !== 'all' ? categoryFilter : 'side',
        partyLevel: 'Level 4'
      });
      const updated = [generated, ...quests];
      handleSaveQuests(updated);
      setExpandedQuestId(generated.id);
    } catch (e) {
      console.warn('Quest AI generator error', e);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const filteredQuests = quests.filter(q => {
    const matchSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.giverName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = categoryFilter === 'all' || q.category === categoryFilter;
    const matchStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search active quests, objectives, quest givers..."
            className="w-full pl-9 pr-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-stone-950 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-300 focus:border-amber-500 focus:outline-none"
          >
            <option value="all">All Quest Types</option>
            <option value="main">Main Story Arcs</option>
            <option value="side">Side Quests</option>
            <option value="personal">Character Arcs</option>
            <option value="faction">Faction Missions</option>
            <option value="bounty">Bounties</option>
            <option value="rumor">Rumors & Hooks</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-stone-950 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-amber-300 font-bold focus:border-amber-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Quests</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed / Abandoned</option>
          </select>

          {/* AI Generator Button */}
          <button
            onClick={handleGenerateAi}
            disabled={isGeneratingAi}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
            title="Generate balanced questline with rewards and plot twists"
          >
            <Sparkles className="w-3.5 h-3.5 text-stone-950" />
            <span>{isGeneratingAi ? 'Synthesizing...' : 'AI Quest'}</span>
          </button>

          {/* Add Manual Quest Button */}
          <button
            onClick={() => setShowNewQuestForm(!showNewQuestForm)}
            className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Quest</span>
          </button>
        </div>
      </div>

      {/* Manual New Quest Modal / Form Drawer */}
      {showNewQuestForm && (
        <form onSubmit={handleAddCustomQuest} className="bg-stone-900 border border-amber-500/50 rounded-2xl p-4 shadow-2xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <h4 className="font-serif font-bold text-sm text-amber-300 flex items-center gap-2">
              <Scroll className="w-4 h-4 text-amber-400" />
              <span>Draft New Campaign Quest</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowNewQuestForm(false)}
              className="text-stone-400 hover:text-stone-200 text-xs"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="md:col-span-2">
              <label className="block text-stone-400 mb-1">Quest Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. The Siege of Ironfang Keep"
                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-stone-100 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-stone-400 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as QuestCategory)}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-stone-200"
              >
                <option value="main">Main Story Arc</option>
                <option value="side">Side Quest</option>
                <option value="personal">Character Arc</option>
                <option value="faction">Faction Mission</option>
                <option value="bounty">Bounty</option>
                <option value="rumor">Rumor / Hook</option>
              </select>
            </div>
          </div>

          <div className="text-xs">
            <label className="block text-stone-400 mb-1">Premise & Narrative Summary</label>
            <textarea
              value={newSummary}
              onChange={(e) => setNewSummary(e.target.value)}
              rows={2}
              placeholder="Background, stakes, mystery..."
              className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-stone-200 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div>
              <label className="block text-stone-400 mb-1">Quest Giver</label>
              <input
                type="text"
                value={newGiver}
                onChange={(e) => setNewGiver(e.target.value)}
                placeholder="e.g. Captain Vance"
                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-1.5 text-stone-200"
              />
            </div>
            <div>
              <label className="block text-stone-400 mb-1">Location</label>
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="e.g. Waterdeep"
                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-1.5 text-stone-200"
              />
            </div>
            <div>
              <label className="block text-stone-400 mb-1">Reward XP</label>
              <input
                type="number"
                value={newXp}
                onChange={(e) => setNewXp(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-1.5 text-amber-300 font-bold"
              />
            </div>
            <div>
              <label className="block text-stone-400 mb-1">Reward Gold</label>
              <input
                type="number"
                value={newGold}
                onChange={(e) => setNewGold(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-1.5 text-yellow-300 font-bold"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition cursor-pointer shadow-md"
            >
              Create Quest
            </button>
          </div>
        </form>
      )}

      {/* Quest Roster List */}
      <div className="space-y-3">
        {filteredQuests.length === 0 ? (
          <div className="py-16 text-center bg-stone-900/60 border border-stone-800 rounded-2xl p-6">
            <Scroll className="w-12 h-12 mx-auto text-amber-500/40 mb-2" />
            <div className="text-sm font-serif font-bold text-stone-300">No Quests Found</div>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              No quests match the selected filters. Use the &quot;AI Quest&quot; generator or create a custom quest arc.
            </p>
          </div>
        ) : (
          filteredQuests.map((quest) => {
            const isExpanded = expandedQuestId === quest.id;
            const catConfig = CATEGORY_CONFIG[quest.category] || CATEGORY_CONFIG.side;
            const completedCount = quest.stages.filter(s => s.completed).length;
            const totalStages = quest.stages.length;
            const progressPercent = totalStages > 0 ? Math.round((completedCount / totalStages) * 100) : 0;

            return (
              <div
                key={quest.id}
                className={`border rounded-2xl transition-all overflow-hidden ${
                  quest.status === 'completed'
                    ? 'bg-emerald-950/20 border-emerald-500/40 opacity-85'
                    : quest.status === 'failed'
                    ? 'bg-red-950/20 border-red-500/40 opacity-75'
                    : 'bg-stone-900/90 border-stone-800 shadow-xl'
                }`}
              >
                {/* Header Banner */}
                <div
                  onClick={() => setExpandedQuestId(isExpanded ? null : quest.id)}
                  className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-stone-800/50 transition select-none"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-xl border ${catConfig.badge}`}>
                      <Scroll className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-serif font-bold text-sm text-stone-100 truncate">
                          {quest.title}
                        </h4>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${catConfig.badge}`}>
                          {catConfig.label}
                        </span>
                        {quest.recommendedLevel && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-950 text-stone-400 border border-stone-800">
                            {quest.recommendedLevel}
                          </span>
                        )}
                      </div>

                      {/* Summary Subtitle */}
                      <p className="text-xs text-stone-400 line-clamp-1 mt-0.5">
                        {quest.summary}
                      </p>
                    </div>
                  </div>

                  {/* Right Progress & Status Badges */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Stage Progress Pill */}
                    <div className="hidden sm:flex items-center gap-2 text-xs font-mono">
                      <div className="w-20 bg-stone-950 border border-stone-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            quest.status === 'completed'
                              ? 'bg-emerald-400'
                              : 'bg-amber-400'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <span className="text-stone-400">{completedCount}/{totalStages}</span>
                    </div>

                    {/* Status Select */}
                    <select
                      value={quest.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleUpdateStatus(quest.id, e.target.value as QuestStatus)}
                      className={`text-xs font-bold font-mono px-2.5 py-1 rounded-xl border cursor-pointer ${
                        quest.status === 'completed'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                          : quest.status === 'failed'
                          ? 'bg-red-950/80 text-red-300 border-red-500/50'
                          : 'bg-stone-950 text-amber-300 border-stone-700'
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                    </select>

                    {isExpanded ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-stone-800/80 space-y-4 text-xs mt-2">
                    {/* Full Summary */}
                    <p className="text-stone-300 leading-relaxed bg-stone-950/60 p-3 rounded-xl border border-stone-800">
                      {quest.summary}
                    </p>

                    {/* Metadata Badges: Giver & Location */}
                    <div className="flex flex-wrap gap-2 text-stone-400">
                      {quest.giverName && (
                        <span className="flex items-center gap-1.5 bg-stone-950 px-2.5 py-1 rounded-lg border border-stone-800">
                          <Users className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Giver: <strong className="text-stone-200">{quest.giverName}</strong></span>
                        </span>
                      )}
                      {quest.giverLocationName && (
                        <span className="flex items-center gap-1.5 bg-stone-950 px-2.5 py-1 rounded-lg border border-stone-800">
                          <MapPin className="w-3.5 h-3.5 text-amber-400" />
                          <span>Location: <strong className="text-stone-200">{quest.giverLocationName}</strong></span>
                        </span>
                      )}
                    </div>

                    {/* Objectives Checklist */}
                    <div className="space-y-2">
                      <div className="font-serif font-bold text-xs text-stone-200 flex items-center justify-between">
                        <span>Quest Stages & Objectives</span>
                        <span className="text-[10px] font-mono text-stone-400">{progressPercent}% complete</span>
                      </div>
                      <div className="space-y-1.5 bg-stone-950/80 p-3 rounded-xl border border-stone-800">
                        {quest.stages.map((stage) => (
                          <div
                            key={stage.id}
                            onClick={() => handleToggleStage(quest.id, stage.id)}
                            className="flex items-start gap-2.5 p-1.5 rounded-lg hover:bg-stone-900 cursor-pointer transition select-none"
                          >
                            {stage.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                            ) : (
                              <Circle className="w-4 h-4 text-stone-600 flex-shrink-0 mt-0.5 hover:text-amber-400" />
                            )}
                            <span className={`text-xs ${stage.completed ? 'line-through text-stone-500' : 'text-stone-200'}`}>
                              {stage.text} {stage.optional && <span className="text-[10px] text-amber-400 font-mono italic">(Bonus)</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rewards Vault */}
                    <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 space-y-2">
                      <div className="font-serif font-bold text-xs text-amber-300 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-400" />
                        <span>Rewards Vault & Standing</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        {quest.rewards.xp && (
                          <span className="text-amber-200 font-bold flex items-center gap-1 bg-amber-950/60 px-2 py-1 rounded border border-amber-500/30">
                            ✨ +{quest.rewards.xp.toLocaleString()} XP
                          </span>
                        )}
                        {quest.rewards.gold && (
                          <span className="text-yellow-300 font-bold flex items-center gap-1 bg-amber-950/60 px-2 py-1 rounded border border-yellow-500/30">
                            🪙 {quest.rewards.gold.toLocaleString()} gp
                          </span>
                        )}
                        {(quest.rewards.items || []).map((item, idx) => (
                          <span key={idx} className="text-purple-300 font-mono bg-purple-950/60 px-2 py-1 rounded border border-purple-500/30">
                            🎁 {item}
                          </span>
                        ))}
                      </div>
                      {quest.rewards.notes && (
                        <p className="text-[11px] text-stone-400 italic">
                          {quest.rewards.notes}
                        </p>
                      )}
                    </div>

                    {/* Secret DM Notes */}
                    {quest.secretDmNotes && (
                      <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-3 text-xs space-y-1">
                        <div className="font-bold text-red-300 flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-red-400" />
                          <span>Secret DM Plot Twists</span>
                        </div>
                        <p className="text-red-200/90 leading-relaxed font-mono text-[11px]">
                          {quest.secretDmNotes}
                        </p>
                      </div>
                    )}

                    {/* Actions Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-stone-800">
                      <div className="flex items-center gap-2">
                        {onOpenKnowledgeGraph && (
                          <button
                            onClick={() => onOpenKnowledgeGraph(quest.title)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-indigo-400" />
                            <span>Knowledge Graph</span>
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteQuest(quest.id)}
                        className="px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
