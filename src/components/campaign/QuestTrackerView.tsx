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
  Bot,
  Gift,
  CheckSquare,
  Square,
  Package,
  ArrowRight,
  Zap,
  HelpCircle,
  UserCheck
} from 'lucide-react';
import {
  CampaignQuest,
  QuestCategory,
  QuestStatus,
  QuestStage
} from '../../types/campaign';
import { CharacterData, Party } from '../../types';
import { UserProfile } from '../../lib/firebase';
import {
  loadCampaignQuests,
  saveCampaignQuests,
  generateAiCampaignQuest
} from '../../services/campaignService';

interface QuestTrackerViewProps {
  activeCharacter?: CharacterData | null;
  characters?: CharacterData[];
  parties?: Party[];
  currentUser?: UserProfile | null;
  onUpdateCharacter?: (char: CharacterData) => void;
  onAddItemToInventory?: (item: any, targetId?: string) => void;
  onOpenKnowledgeGraph?: (entityName: string) => void;
  onOpenGenerators?: (tab?: 'npc' | 'encounter' | 'treasure' | 'session' | 'rules' | 'dungeon') => void;
  onNavigateToAtlasLocation?: (locationName: string) => void;
  onNavigateToFaction?: (factionName: string) => void;
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
  activeCharacter,
  characters = [],
  parties = [],
  currentUser,
  onUpdateCharacter,
  onAddItemToInventory,
  onOpenKnowledgeGraph,
  onOpenGenerators,
  onNavigateToAtlasLocation,
  onNavigateToFaction
}) => {
  const [quests, setQuests] = useState<CampaignQuest[]>(() => loadCampaignQuests());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [expandedQuestId, setExpandedQuestId] = useState<string | null>(quests[0]?.id || null);
  const [showNewQuestForm, setShowNewQuestForm] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [distributionNotification, setDistributionNotification] = useState<string | null>(null);

  // New Milestone input state per quest
  const [newStageText, setNewStageText] = useState('');
  const [newStageOptional, setNewStageOptional] = useState(false);
  const [newStageXp, setNewStageXp] = useState('');

  // New Quest Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<QuestCategory>('side');
  const [newSummary, setNewSummary] = useState('');
  const [newGiver, setNewGiver] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newFaction, setNewFaction] = useState('');
  const [newLevel, setNewLevel] = useState('Level 3 - 5');
  const [newXp, setNewXp] = useState('1500');
  const [newGold, setNewGold] = useState('500');
  const [newItems, setNewItems] = useState('');

  // Item allocation target state
  const [selectedTargetCharId, setSelectedTargetCharId] = useState<string>(activeCharacter?.id || characters[0]?.id || '');

  const showToast = (msg: string) => {
    setDistributionNotification(msg);
    setTimeout(() => setDistributionNotification(null), 4000);
  };

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
      const newStatus = allRequiredCompleted ? ('completed' as QuestStatus) : q.status === 'completed' ? 'active' : q.status;
      return {
        ...q,
        stages: newStages,
        status: newStatus
      };
    });
    handleSaveQuests(updated);
  };

  const handleAddStage = (questId: string) => {
    if (!newStageText.trim()) return;
    const stageXpNum = parseInt(newStageXp, 10) || 0;
    const newStage: QuestStage = {
      id: `stage-${Date.now()}`,
      text: newStageText.trim(),
      completed: false,
      optional: newStageOptional,
      xpReward: stageXpNum > 0 ? stageXpNum : undefined
    };

    const updated = quests.map(q => {
      if (q.id !== questId) return q;
      return {
        ...q,
        stages: [...q.stages, newStage]
      };
    });

    handleSaveQuests(updated);
    setNewStageText('');
    setNewStageOptional(false);
    setNewStageXp('');
  };

  const handleDeleteStage = (questId: string, stageId: string) => {
    const updated = quests.map(q => {
      if (q.id !== questId) return q;
      return {
        ...q,
        stages: q.stages.filter(s => s.id !== stageId)
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
    if (expandedQuestId === questId) setExpandedQuestId(updated[0]?.id || null);
  };

  const handleAddCustomQuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const quest: CampaignQuest = {
      id: `quest-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      status: 'active',
      summary: newSummary.trim() || 'A new adventure quest accepted by the party.',
      giverName: newGiver.trim() || 'Guild Patron',
      giverLocationName: newLocation.trim() || 'Regional Hub',
      giverFactionId: newFaction.trim() ? `fac-${newFaction.toLowerCase().replace(/\s+/g, '-')}` : undefined,
      recommendedLevel: newLevel,
      stages: [
        { id: `st-${Date.now()}-1`, text: 'Investigate the initial lead or rumor', completed: false },
        { id: `st-${Date.now()}-2`, text: 'Overcome the primary encounter / challenge', completed: false },
        { id: `st-${Date.now()}-3`, text: 'Claim the objective and return for reward payout', completed: false }
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
    setNewGiver('');
    setNewLocation('');
  };

  const handleGenerateAi = async () => {
    setIsGeneratingAi(true);
    try {
      const generated = await generateAiCampaignQuest({
        theme: 'D&D 5e / High Fantasy Sword Coast',
        category: categoryFilter !== 'all' ? categoryFilter : 'side',
        partyLevel: activeCharacter ? `Level ${activeCharacter.level}` : 'Level 4'
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

  // XP Distribution
  const handleAwardXpToActiveCharacter = (quest: CampaignQuest) => {
    const xpAmount = quest.rewards.xp || 0;
    if (xpAmount <= 0) return;

    if (activeCharacter && onUpdateCharacter) {
      const updatedChar: CharacterData = {
        ...activeCharacter,
        experiencePoints: (activeCharacter.experiencePoints || 0) + xpAmount
      };
      onUpdateCharacter(updatedChar);
      showToast(`⭐ Awarded +${xpAmount.toLocaleString()} XP to ${activeCharacter.name}!`);
    } else {
      showToast(`⭐ Gained +${xpAmount.toLocaleString()} XP (No active character selected to receive XP directly).`);
    }
  };

  const handleDistributeXpToParty = (quest: CampaignQuest) => {
    const totalXp = quest.rewards.xp || 0;
    if (totalXp <= 0) return;

    const targetList = characters.length > 0 ? characters : activeCharacter ? [activeCharacter] : [];
    if (targetList.length === 0) {
      showToast(`⭐ Awarded +${totalXp.toLocaleString()} XP to the party.`);
      return;
    }

    const share = Math.round(totalXp / targetList.length);
    targetList.forEach(char => {
      if (onUpdateCharacter) {
        const updated: CharacterData = {
          ...char,
          experiencePoints: (char.experiencePoints || 0) + share
        };
        onUpdateCharacter(updated);
      }
    });

    showToast(`⚔️ Distributed +${totalXp.toLocaleString()} XP equally among ${targetList.length} party members (+${share.toLocaleString()} XP each)!`);
  };

  // Gold Distribution
  const handleAwardGoldToActiveCharacter = (quest: CampaignQuest) => {
    const goldAmount = quest.rewards.gold || 0;
    if (goldAmount <= 0) return;

    if (activeCharacter && onUpdateCharacter) {
      const currentWealth = activeCharacter.wealth || { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
      const updatedChar: CharacterData = {
        ...activeCharacter,
        wealth: {
          ...currentWealth,
          gp: (currentWealth.gp || 0) + goldAmount
        }
      };
      onUpdateCharacter(updatedChar);
      showToast(`💰 Granted +${goldAmount.toLocaleString()} GP to ${activeCharacter.name}!`);
    } else {
      showToast(`💰 Claimed +${goldAmount.toLocaleString()} GP.`);
    }
  };

  const handleDistributeGoldToParty = (quest: CampaignQuest) => {
    const totalGold = quest.rewards.gold || 0;
    if (totalGold <= 0) return;

    const targetList = characters.length > 0 ? characters : activeCharacter ? [activeCharacter] : [];
    if (targetList.length === 0) {
      showToast(`💰 Claimed +${totalGold.toLocaleString()} GP for the party treasury.`);
      return;
    }

    const share = Math.round(totalGold / targetList.length);
    targetList.forEach(char => {
      if (onUpdateCharacter) {
        const currentWealth = char.wealth || { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
        const updated: CharacterData = {
          ...char,
          wealth: {
            ...currentWealth,
            gp: (currentWealth.gp || 0) + share
          }
        };
        onUpdateCharacter(updated);
      }
    });

    showToast(`💰 Split +${totalGold.toLocaleString()} GP across ${targetList.length} party members (+${share.toLocaleString()} GP each)!`);
  };

  // Item Allocation
  const handleAllocateItemToCharacter = (itemName: string) => {
    const targetChar = characters.find(c => c.id === selectedTargetCharId) || activeCharacter;
    const targetName = targetChar ? targetChar.name : 'Active Character';

    if (onAddItemToInventory) {
      onAddItemToInventory({
        id: `item-reward-${Date.now()}`,
        name: itemName,
        quantity: 1,
        weight: 1,
        description: 'Awarded upon completion of a campaign quest milestone.',
        equipped: false
      }, targetChar?.id);
      showToast(`🎁 Added "${itemName}" directly to ${targetName}'s inventory!`);
    } else if (targetChar && onUpdateCharacter) {
      const updatedInv = [
        ...(targetChar.inventory || []),
        {
          id: `item-reward-${Date.now()}`,
          name: itemName,
          quantity: 1,
          weight: 1,
          description: 'Awarded upon completion of a campaign quest milestone.',
          equipped: false
        }
      ];
      onUpdateCharacter({ ...targetChar, inventory: updatedInv });
      showToast(`🎁 Added "${itemName}" to ${targetName}'s inventory!`);
    } else {
      showToast(`🎁 Allocated "${itemName}" to the party inventory.`);
    }
  };

  const filteredQuests = quests.filter(q => {
    const matchSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.giverName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.giverLocationName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.rewards.items || []).some(i => i.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchCategory = categoryFilter === 'all' || q.category === categoryFilter;
    const matchStatus = statusFilter === 'all' || q.status === statusFilter;

    return matchSearch && matchCategory && matchStatus;
  });

  const selectedQuest = quests.find(q => q.id === expandedQuestId) || filteredQuests[0] || quests[0];

  return (
    <div className="space-y-4">
      {/* Toast Banner for Distribution Actions */}
      {distributionNotification && (
        <div className="bg-amber-950 border border-amber-500/80 text-amber-200 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-2xl flex items-center justify-between animate-fade-in">
          <span className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>{distributionNotification}</span>
          </span>
          <button
            onClick={() => setDistributionNotification(null)}
            className="text-amber-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Search, Category & Action Toolbar */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        {/* Search & Category Filter */}
        <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search quest title, objectives, patron, rewards..."
              className="w-full pl-9 pr-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-stone-950 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-300 focus:border-amber-500 focus:outline-none"
          >
            <option value="all">All Quest Lines</option>
            <option value="main">Main Story Arcs</option>
            <option value="side">Side Quests</option>
            <option value="personal">Character Arcs</option>
            <option value="faction">Faction Assignments</option>
            <option value="bounty">Monster Bounties</option>
            <option value="rumor">Rumors & Leads</option>
          </select>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-stone-950 p-1 rounded-2xl border border-stone-800 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-xl font-bold transition cursor-pointer ${
              statusFilter === 'all' ? 'bg-amber-500 text-stone-950 shadow' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            All ({quests.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-2.5 py-1 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 ${
              statusFilter === 'active' ? 'bg-cyan-600 text-white shadow' : 'text-cyan-400 hover:text-cyan-300'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Active</span>
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-2.5 py-1 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 ${
              statusFilter === 'completed' ? 'bg-emerald-600 text-white shadow' : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Completed</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewQuestForm(!showNewQuestForm)}
            className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Quest</span>
          </button>

          <button
            onClick={handleGenerateAi}
            disabled={isGeneratingAi}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
            title="Synthesize a new questline with milestones, rewards, and XP distribution"
          >
            <Sparkles className="w-3.5 h-3.5 text-stone-950" />
            <span>{isGeneratingAi ? 'Synthesizing...' : 'AI Quest'}</span>
          </button>
        </div>
      </div>

      {/* New Custom Quest Modal / Drawer */}
      {showNewQuestForm && (
        <form onSubmit={handleAddCustomQuest} className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-2xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <h4 className="font-serif font-bold text-sm text-amber-300 flex items-center gap-2">
              <Scroll className="w-4 h-4" />
              <span>Create New Campaign Quest</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowNewQuestForm(false)}
              className="text-stone-400 hover:text-stone-200 text-xs"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-stone-400 font-mono text-[10px] uppercase mb-1">Quest Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Cleansing the Sunken Spire"
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-stone-400 font-mono text-[10px] uppercase mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as QuestCategory)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200"
              >
                <option value="main">Main Story Arc</option>
                <option value="side">Side Quest</option>
                <option value="personal">Character Arc</option>
                <option value="faction">Faction Assignment</option>
                <option value="bounty">Monster Bounty</option>
                <option value="rumor">Rumor Hook</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-stone-400 font-mono text-[10px] uppercase mb-1">Quest Giver / Patron</label>
              <input
                type="text"
                value={newGiver}
                onChange={(e) => setNewGiver(e.target.value)}
                placeholder="e.g. Lady Remallia Haventree"
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200"
              />
            </div>

            <div>
              <label className="block text-stone-400 font-mono text-[10px] uppercase mb-1">Location Hub</label>
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="e.g. Waterdeep Dock Ward"
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200"
              />
            </div>

            <div>
              <label className="block text-stone-400 font-mono text-[10px] uppercase mb-1">Recommended Level</label>
              <input
                type="text"
                value={newLevel}
                onChange={(e) => setNewLevel(e.target.value)}
                placeholder="e.g. Level 4 - 6"
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-400 font-mono text-[10px] uppercase mb-1">Quest Summary & Stakes</label>
            <textarea
              value={newSummary}
              onChange={(e) => setNewSummary(e.target.value)}
              rows={2}
              placeholder="What must the party accomplish, who is imperiled, and what complications exist?"
              className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-xs text-stone-200"
            />
          </div>

          {/* Reward configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-stone-950 p-3 rounded-xl border border-stone-800">
            <div>
              <label className="block text-stone-400 font-mono text-[10px] uppercase mb-1">XP Reward</label>
              <input
                type="number"
                value={newXp}
                onChange={(e) => setNewXp(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 rounded-lg p-1.5 text-xs text-amber-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-stone-400 font-mono text-[10px] uppercase mb-1">Gold Reward (GP)</label>
              <input
                type="number"
                value={newGold}
                onChange={(e) => setNewGold(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 rounded-lg p-1.5 text-xs text-yellow-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-stone-400 font-mono text-[10px] uppercase mb-1">Item Rewards (comma separated)</label>
              <input
                type="text"
                value={newItems}
                onChange={(e) => setNewItems(e.target.value)}
                placeholder="e.g. Cloak of Elvenkind, Potion of Healing"
                className="w-full bg-stone-900 border border-stone-800 rounded-lg p-1.5 text-xs text-stone-200"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowNewQuestForm(false)}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs shadow-md"
            >
              Create Quest
            </button>
          </div>
        </form>
      )}

      {/* Main Grid: Quest List + Milestone Tracker & Loot Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Left Column: Quests List */}
        <div className="space-y-2.5 lg:col-span-1 max-h-[660px] overflow-y-auto pr-1">
          {filteredQuests.map((quest) => {
            const isSelected = selectedQuest?.id === quest.id;
            const catConfig = CATEGORY_CONFIG[quest.category] || CATEGORY_CONFIG.side;
            const completedMilestones = quest.stages.filter(s => s.completed).length;
            const totalMilestones = quest.stages.length;
            const progressPercent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

            return (
              <div
                key={quest.id}
                onClick={() => setExpandedQuestId(quest.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                  isSelected
                    ? 'bg-stone-900 border-amber-500/80 shadow-xl ring-1 ring-amber-500/50'
                    : 'bg-stone-950/80 border-stone-800/80 hover:border-stone-700 hover:bg-stone-900/60'
                }`}
              >
                {/* Quest Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-serif font-bold text-sm text-stone-200">
                      {quest.title}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${catConfig.badge}`}>
                        {catConfig.label}
                      </span>
                      {quest.recommendedLevel && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-900 text-stone-400 border border-stone-800">
                          {quest.recommendedLevel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase border shrink-0 ${
                    quest.status === 'completed'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-600/50'
                      : quest.status === 'failed'
                      ? 'bg-red-950 text-red-400 border-red-800'
                      : 'bg-cyan-950 text-cyan-300 border-cyan-600/50'
                  }`}>
                    {quest.status}
                  </span>
                </div>

                {/* Milestone Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-stone-400">
                    <span>Milestones: {completedMilestones}/{totalMilestones}</span>
                    <span className="font-bold text-amber-400">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                    <div
                      style={{ width: `${progressPercent}%` }}
                      className={`h-full transition-all duration-300 ${
                        progressPercent === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-600 to-amber-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Rewards Preview */}
                <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 pt-1 border-t border-stone-800/60">
                  <span className="text-amber-300">⭐ {quest.rewards.xp || 0} XP</span>
                  <span className="text-yellow-400">💰 {quest.rewards.gold || 0} GP</span>
                  <span>🎁 {(quest.rewards.items || []).length} Items</span>
                </div>
              </div>
            );
          })}

          {filteredQuests.length === 0 && (
            <div className="p-8 text-center text-xs text-stone-500 border border-dashed border-stone-800 rounded-2xl">
              No quests match the current filter.
            </div>
          )}
        </div>

        {/* Right Column: Active Quest Milestone Log, Loot Allocation & XP Distribution */}
        <div className="lg:col-span-2 bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-2xl space-y-5">
          {selectedQuest ? (
            <div className="space-y-5">
              {/* Top Banner: Title, Status toggle, Giver, Location, Level */}
              <div className="flex items-start justify-between pb-4 border-b border-stone-800 flex-wrap gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-serif font-bold text-xl text-amber-200">
                      {selectedQuest.title}
                    </h3>
                    <span className={`text-xs font-mono px-2.5 py-0.5 rounded-lg border ${CATEGORY_CONFIG[selectedQuest.category]?.badge}`}>
                      {CATEGORY_CONFIG[selectedQuest.category]?.label}
                    </span>
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed mt-2">
                    {selectedQuest.summary}
                  </p>
                </div>

                {/* Status Switcher Button */}
                <div className="flex items-center gap-1.5 bg-stone-950 p-1.5 rounded-2xl border border-stone-800">
                  <button
                    onClick={() => handleUpdateStatus(selectedQuest.id, 'active')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedQuest.status === 'active' ? 'bg-cyan-600 text-white' : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedQuest.id, 'completed')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedQuest.status === 'completed' ? 'bg-emerald-600 text-white' : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Completed
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedQuest.id, 'failed')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedQuest.status === 'failed' ? 'bg-red-600 text-white' : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Failed
                  </button>
                </div>
              </div>

              {/* Quest Patron, Location & Faction Links */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-stone-950 border border-stone-800 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-stone-400 block">Quest Patron / Giver</span>
                  <strong className="text-stone-200 block truncate">{selectedQuest.giverName || 'Unknown'}</strong>
                </div>

                <div className="bg-stone-950 border border-stone-800 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-stone-400 flex items-center justify-between">
                    <span>Location Hub</span>
                    {selectedQuest.giverLocationName && onNavigateToAtlasLocation && (
                      <button
                        onClick={() => onNavigateToAtlasLocation(selectedQuest.giverLocationName || '')}
                        className="text-amber-400 hover:text-amber-300 flex items-center gap-0.5 cursor-pointer"
                        title="View on World Atlas"
                      >
                        <MapPin className="w-2.5 h-2.5" />
                        <span>Map</span>
                      </button>
                    )}
                  </span>
                  <strong className="text-stone-200 block truncate">{selectedQuest.giverLocationName || 'Unknown'}</strong>
                </div>

                <div className="bg-stone-950 border border-stone-800 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-stone-400 flex items-center justify-between">
                    <span>Associated Faction</span>
                    {selectedQuest.giverFactionId && onNavigateToFaction && (
                      <button
                        onClick={() => onNavigateToFaction(selectedQuest.giverFactionId?.replace('fac-', '') || '')}
                        className="text-amber-400 hover:text-amber-300 flex items-center gap-0.5 cursor-pointer"
                        title="View in Faction Matrix"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        <span>Matrix</span>
                      </button>
                    )}
                  </span>
                  <strong className="text-stone-200 block truncate">{selectedQuest.giverFactionId || 'None'}</strong>
                </div>
              </div>

              {/* STEP-BY-STEP QUEST MILESTONES SECTION */}
              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-amber-400" />
                    <span>Step-by-Step Quest Milestones ({selectedQuest.stages.filter(s => s.completed).length}/{selectedQuest.stages.length})</span>
                  </span>
                  <span className="text-[10px] font-mono text-stone-400">
                    Check off objectives as the party advances
                  </span>
                </div>

                {/* Milestone Progress Bar */}
                <div className="w-full h-2 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                  <div
                    style={{
                      width: `${selectedQuest.stages.length > 0 ? (selectedQuest.stages.filter(s => s.completed).length / selectedQuest.stages.length) * 100 : 0}%`
                    }}
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300"
                  />
                </div>

                {/* Milestones Checklist */}
                <div className="space-y-2">
                  {selectedQuest.stages.map((stage, idx) => (
                    <div
                      key={stage.id}
                      className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 text-xs ${
                        stage.completed
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                          : 'bg-stone-900/70 border-stone-800 text-stone-200'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 flex-1">
                        <button
                          type="button"
                          onClick={() => handleToggleStage(selectedQuest.id, stage.id)}
                          className="mt-0.5 cursor-pointer shrink-0"
                          title="Toggle Milestone Completion"
                        >
                          {stage.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Circle className="w-4 h-4 text-stone-500 hover:text-stone-300" />
                          )}
                        </button>

                        <div className="space-y-0.5 flex-1">
                          <div className={`leading-relaxed ${stage.completed ? 'line-through text-stone-400' : 'text-stone-200'}`}>
                            <span className="font-mono text-[10px] text-amber-400/80 mr-1.5 font-bold">#{idx + 1}</span>
                            {stage.text}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-stone-400">
                            {stage.optional && (
                              <span className="text-amber-400 italic">(Optional Bonus Milestone)</span>
                            )}
                            {stage.xpReward && (
                              <span className="text-amber-300 font-bold">+{stage.xpReward} XP</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteStage(selectedQuest.id, stage.id)}
                        className="text-stone-600 hover:text-red-400 p-1 cursor-pointer"
                        title="Delete Milestone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Milestone Sub-form */}
                <div className="pt-2 border-t border-stone-800/80 flex items-center gap-2 flex-wrap text-xs">
                  <input
                    type="text"
                    value={newStageText}
                    onChange={(e) => setNewStageText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddStage(selectedQuest.id); } }}
                    placeholder="Add step-by-step milestone objective..."
                    className="flex-1 min-w-[200px] bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    value={newStageXp}
                    onChange={(e) => setNewStageXp(e.target.value)}
                    placeholder="XP (Opt)"
                    className="w-20 bg-stone-900 border border-stone-800 rounded-xl px-2 py-1.5 text-xs text-amber-300 font-mono"
                  />
                  <label className="flex items-center gap-1.5 text-[11px] text-stone-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newStageOptional}
                      onChange={(e) => setNewStageOptional(e.target.checked)}
                      className="rounded bg-stone-900 border-stone-700 text-amber-500"
                    />
                    <span>Optional</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddStage(selectedQuest.id)}
                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl font-bold cursor-pointer"
                  >
                    + Add Step
                  </button>
                </div>
              </div>

              {/* LOOT ALLOCATION & XP AUTO-DISTRIBUTION SECTION */}
              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Quest Loot Allocation & Party Distribution</span>
                  </span>
                  <span className="text-[10px] font-mono text-stone-400">
                    Auto-distribute XP & Gold to character sheets
                  </span>
                </div>

                {/* Target Character / Party Member Selector for Loot Assignment */}
                {characters.length > 0 && (
                  <div className="bg-stone-900 border border-stone-800 rounded-xl p-2.5 flex items-center justify-between text-xs flex-wrap gap-2">
                    <span className="text-[11px] text-stone-400 font-mono flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Target Receiver for Loot:</span>
                    </span>
                    <select
                      value={selectedTargetCharId}
                      onChange={(e) => setSelectedTargetCharId(e.target.value)}
                      className="bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1 text-xs text-amber-200 font-bold"
                    >
                      {characters.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} (Lvl {c.level} {c.characterClass})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Rewards Grid: XP & Gold Allocation Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* XP Distribution Box */}
                  <div className="bg-stone-900 border border-amber-500/30 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span>Experience Points: +{selectedQuest.rewards.xp?.toLocaleString() || 0} XP</span>
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAwardXpToActiveCharacter(selectedQuest)}
                        className="w-full px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg transition text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Award All XP to {activeCharacter ? activeCharacter.name : 'Active Character'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDistributeXpToParty(selectedQuest)}
                        className="w-full px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-lg transition text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-stone-700"
                        title="Divides XP equally among all party members"
                      >
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        <span>Split XP Evenly Across Party</span>
                      </button>
                    </div>
                  </div>

                  {/* Gold & Coinage Box */}
                  <div className="bg-stone-900 border border-yellow-500/30 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-yellow-300 flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-yellow-400" />
                        <span>Gold Reward: +{selectedQuest.rewards.gold?.toLocaleString() || 0} GP</span>
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAwardGoldToActiveCharacter(selectedQuest)}
                        className="w-full px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-bold rounded-lg transition text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>Award GP to {activeCharacter ? activeCharacter.name : 'Active Character'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDistributeGoldToParty(selectedQuest)}
                        className="w-full px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-lg transition text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-stone-700"
                        title="Splits gold equally across party sheets"
                      >
                        <Users className="w-3.5 h-3.5 text-yellow-400" />
                        <span>Split GP Evenly Across Party</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Item Rewards & Inventory Allocation */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase text-stone-400 block">
                    Magic Items & Quest Loot Rewards ({(selectedQuest.rewards.items || []).length})
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(selectedQuest.rewards.items || []).map((item) => (
                      <div
                        key={item}
                        className="bg-stone-900 border border-stone-800 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="font-serif font-bold text-stone-200 flex items-center gap-1.5 truncate">
                          <Package className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">{item}</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => handleAllocateItemToCharacter(item)}
                          className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg text-[11px] shrink-0 cursor-pointer shadow flex items-center gap-1"
                          title="Add directly to character's inventory"
                        >
                          <Gift className="w-3 h-3" />
                          <span>Send to Bag</span>
                        </button>
                      </div>
                    ))}

                    {(selectedQuest.rewards.items || []).length === 0 && (
                      <div className="p-3 text-center text-xs text-stone-500 bg-stone-900/50 rounded-xl border border-dashed border-stone-800 col-span-2">
                        No custom item rewards specified for this quest.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Secret DM Notes (DM Confidential) */}
              {selectedQuest.secretDmNotes && (
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      <span>Secret DM Lore & Plot Twists</span>
                    </span>
                    <span className="text-[10px] font-mono uppercase text-amber-400/80">DM Only</span>
                  </div>
                  <p className="text-xs text-amber-100/90 leading-relaxed">
                    {selectedQuest.secretDmNotes}
                  </p>
                </div>
              )}

              {/* Bottom Actions Bar */}
              <div className="pt-3 border-t border-stone-800 flex items-center justify-between flex-wrap gap-2">
                {onOpenKnowledgeGraph && (
                  <button
                    onClick={() => onOpenKnowledgeGraph(selectedQuest.title)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Knowledge Graph</span>
                  </button>
                )}

                <button
                  onClick={() => handleDeleteQuest(selectedQuest.id)}
                  className="p-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs transition cursor-pointer"
                  title="Delete Quest"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-stone-500 text-xs">
              Select a quest to view step-by-step milestone tracking, loot allocation, and XP auto-distribution.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
