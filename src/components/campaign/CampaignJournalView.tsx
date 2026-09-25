import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Trash2,
  Calendar,
  MapPin,
  Swords,
  Coins,
  Gem,
  Award,
  Users,
  Compass,
  FileText,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { CampaignJournalEntry } from '../../types/campaign';
import {
  loadCampaignJournal,
  saveCampaignJournal,
  addCampaignJournalEntry
} from '../../services/campaignService';

interface CampaignJournalViewProps {
  initialSearch?: string;
  onNavigateToAtlasLocation?: (locationName: string) => void;
}

export const CampaignJournalView: React.FC<CampaignJournalViewProps> = ({
  initialSearch = '',
  onNavigateToAtlasLocation
}) => {
  const [entries, setEntries] = useState<CampaignJournalEntry[]>(() => loadCampaignJournal());
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // New entry form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<CampaignJournalEntry['category']>('exploration');
  const [newLocationName, setNewLocationName] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newParticipants, setNewParticipants] = useState('');

  // Reload when storage changes or when component updates
  const refreshJournal = () => {
    setEntries(loadCampaignJournal());
  };

  useEffect(() => {
    refreshJournal();
  }, []);

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addCampaignJournalEntry({
      title: newTitle.trim(),
      category: newCategory,
      locationName: newLocationName.trim() || undefined,
      summary: newSummary.trim() || 'No summary recorded.',
      notes: newNotes.trim() || undefined,
      participants: newParticipants.split(',').map(p => p.trim()).filter(Boolean)
    });

    setNewTitle('');
    setNewLocationName('');
    setNewSummary('');
    setNewNotes('');
    setNewParticipants('');
    setShowAddForm(false);
    refreshJournal();
  };

  const handleDeleteEntry = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    saveCampaignJournal(updated);
  };

  const filteredEntries = entries.filter(entry => {
    const matchesCategory = categoryFilter === 'all' || entry.category === categoryFilter;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCategory;

    const matchesSearch =
      entry.title.toLowerCase().includes(q) ||
      entry.summary.toLowerCase().includes(q) ||
      (entry.locationName && entry.locationName.toLowerCase().includes(q)) ||
      (entry.notes && entry.notes.toLowerCase().includes(q)) ||
      (entry.enemiesVanquished && entry.enemiesVanquished.some(enemy => enemy.name.toLowerCase().includes(q))) ||
      (entry.lootHarvested && entry.lootHarvested.some(loot => loot.name.toLowerCase().includes(q)));

    return matchesCategory && matchesSearch;
  });

  const getCategoryBadge = (category: CampaignJournalEntry['category']) => {
    switch (category) {
      case 'encounter':
        return { label: 'Tactical Encounter', bg: 'bg-rose-950/80 text-rose-300 border-rose-500/40', icon: Swords };
      case 'quest':
        return { label: 'Quest Chronicle', bg: 'bg-amber-950/80 text-amber-300 border-amber-500/40', icon: Award };
      case 'lore':
        return { label: 'Campaign Lore', bg: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40', icon: Sparkles };
      case 'downtime':
        return { label: 'Downtime & Rest', bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40', icon: Users };
      case 'exploration':
      default:
        return { label: 'Overland Exploration', bg: 'bg-teal-950/80 text-teal-300 border-teal-500/40', icon: Compass };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-amber-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <span>Campaign Chronicles & Encounter Logs</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            A permanent chronological record of tactical battles, overland exploits, quest milestones, and harvested spoils.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chronicles, foes, loot..."
              className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500/60"
            />
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Cancel' : 'New Entry'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: 'All Chronicles' },
          { id: 'encounter', label: '⚔️ Encounters' },
          { id: 'quest', label: '📜 Quests' },
          { id: 'exploration', label: '🧭 Exploration' },
          { id: 'lore', label: '✨ Lore & Secrets' },
          { id: 'downtime', label: '🏕️ Downtime' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCategoryFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer whitespace-nowrap ${
              categoryFilter === tab.id
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
                : 'bg-stone-900/60 text-stone-400 hover:text-stone-200 border border-stone-800/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Create New Entry Accordion */}
      {showAddForm && (
        <form
          onSubmit={handleCreateEntry}
          className="bg-stone-900 border border-amber-500/40 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <h3 className="text-sm font-serif font-bold text-amber-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Record New Campaign Chronicle Entry</span>
            </h3>
            <span className="text-[11px] text-stone-400">Manual Log</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-mono text-stone-400 uppercase">Chronicle Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Cleansing the Sunken Crypt of Nerull"
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-stone-400 uppercase">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="encounter">⚔️ Tactical Encounter</option>
                <option value="exploration">🧭 Exploration</option>
                <option value="quest">📜 Quest Milestone</option>
                <option value="lore">✨ Campaign Lore</option>
                <option value="downtime">🏕️ Downtime & Rest</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-stone-400 uppercase">Location / Landmark</label>
              <input
                type="text"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                placeholder="e.g. Undermountain: Level 1"
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-stone-400 uppercase">Participants (comma separated)</label>
              <input
                type="text"
                value={newParticipants}
                onChange={(e) => setNewParticipants(e.target.value)}
                placeholder="e.g. Thorin, Lyra, Valeros"
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono text-stone-400 uppercase">Summary Narrative</label>
            <textarea
              rows={3}
              required
              value={newSummary}
              onChange={(e) => setNewSummary(e.target.value)}
              placeholder="What transpired? Key combat actions, clues uncovered, NPC dialogues..."
              className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono text-stone-400 uppercase">DM Notes & Follow-up Hooks (Optional)</label>
            <input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="e.g. Found a bloody insignia hinting at the Cult of the Dragon..."
              className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Save to Chronicle</span>
            </button>
          </div>
        </form>
      )}

      {/* Entries Timeline List */}
      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <div className="bg-stone-900/60 border border-stone-800/80 rounded-2xl p-12 text-center space-y-3">
            <BookOpen className="w-10 h-10 mx-auto text-stone-600" />
            <h3 className="text-sm font-serif font-bold text-stone-300">No Journal Entries Found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {searchQuery
                ? `No entries match "${searchQuery}". Try changing your filter or search terms.`
                : 'Win tactical encounters or log your campaign travels to automatically record heroic tales in this chronicle.'}
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const badge = getCategoryBadge(entry.category);
            const Icon = badge.icon;

            return (
              <div
                key={entry.id}
                className="bg-stone-900/90 border border-stone-800 hover:border-amber-500/30 rounded-2xl p-5 shadow-lg transition space-y-3.5 relative group"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${badge.bg}`}>
                        <Icon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>

                      {entry.locationName && (
                        <button
                          type="button"
                          onClick={() => onNavigateToAtlasLocation?.(entry.locationName!)}
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-500/30 flex items-center gap-1 cursor-pointer transition"
                          title="View location in World Atlas"
                        >
                          <MapPin className="w-2.5 h-2.5" />
                          <span>{entry.locationName}</span>
                        </button>
                      )}

                      <span className="text-[11px] font-mono text-stone-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{entry.timestamp}</span>
                      </span>
                    </div>

                    <h3 className="text-base font-serif font-bold text-amber-100 mt-1">
                      {entry.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="p-1.5 rounded-lg text-stone-600 hover:text-red-400 hover:bg-red-950/30 transition cursor-pointer"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Narrative Summary */}
                <p className="text-xs text-stone-300 leading-relaxed bg-stone-950/50 rounded-xl p-3 border border-stone-800/80">
                  {entry.summary}
                </p>

                {/* Combat / Encounter Specific Spoils & Stats */}
                {(entry.enemiesVanquished?.length || entry.totalXpAwarded || entry.lootHarvested?.length || entry.currencyFound) && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                    {/* Vanquished Foes */}
                    {entry.enemiesVanquished && entry.enemiesVanquished.length > 0 && (
                      <div className="bg-rose-950/30 border border-rose-500/20 rounded-xl p-2.5 space-y-1.5">
                        <div className="text-[10px] font-mono uppercase text-rose-300 flex items-center gap-1 font-bold">
                          <Swords className="w-3 h-3 text-rose-400" />
                          <span>Defeated Foes</span>
                        </div>
                        <div className="space-y-1">
                          {entry.enemiesVanquished.map((enemy, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[11px] text-stone-200">
                              <span>{enemy.count > 1 ? `${enemy.count}x ` : ''}{enemy.name}</span>
                              <span className="font-mono text-amber-400 text-[10px]">+{enemy.xpReward} XP</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* XP & Currency */}
                    {(entry.totalXpAwarded !== undefined || entry.currencyFound) && (
                      <div className="bg-amber-950/30 border border-amber-500/20 rounded-xl p-2.5 space-y-1.5">
                        <div className="text-[10px] font-mono uppercase text-amber-300 flex items-center gap-1 font-bold">
                          <Award className="w-3 h-3 text-amber-400" />
                          <span>Rewards & Gold</span>
                        </div>
                        {entry.totalXpAwarded !== undefined && (
                          <div className="text-[11px] text-amber-200 font-bold">
                            Total XP: <span className="font-mono text-amber-400">+{entry.totalXpAwarded.toLocaleString()} XP</span>
                          </div>
                        )}
                        {entry.currencyFound && (
                          <div className="flex flex-wrap gap-1.5 text-[10px] font-mono mt-0.5">
                            {Boolean(entry.currencyFound.pp) && <span className="text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-500/30">{entry.currencyFound.pp} pp</span>}
                            {Boolean(entry.currencyFound.gp) && <span className="text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">{entry.currencyFound.gp} gp</span>}
                            {Boolean(entry.currencyFound.sp) && <span className="text-stone-300 bg-stone-800 px-1.5 py-0.5 rounded border border-stone-600/30">{entry.currencyFound.sp} sp</span>}
                            {Boolean(entry.currencyFound.cp) && <span className="text-orange-300 bg-orange-950/60 px-1.5 py-0.5 rounded border border-orange-500/30">{entry.currencyFound.cp} cp</span>}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Loot Harvested */}
                    {entry.lootHarvested && entry.lootHarvested.length > 0 && (
                      <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-2.5 space-y-1.5">
                        <div className="text-[10px] font-mono uppercase text-emerald-300 flex items-center gap-1 font-bold">
                          <Gem className="w-3 h-3 text-emerald-400" />
                          <span>Spoils & Relics</span>
                        </div>
                        <div className="space-y-1">
                          {entry.lootHarvested.map((loot, idx) => (
                            <div key={idx} className="text-[11px] text-stone-200 truncate" title={loot.notes || loot.name}>
                              • {loot.quantity > 1 ? `${loot.quantity}x ` : ''}<span className="text-emerald-300 font-medium">{loot.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Participants or Notes footer */}
                <div className="flex items-center justify-between gap-3 text-[11px] text-stone-400 pt-1 flex-wrap">
                  {entry.participants && entry.participants.length > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-stone-500" />
                      <span>Party: {entry.participants.join(', ')}</span>
                    </div>
                  ) : <div />}

                  {entry.notes && (
                    <div className="text-stone-400 italic">
                      Note: {entry.notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
