import React, { useState, useEffect } from 'react';
import { 
  Pin, 
  X, 
  Plus, 
  Layout, 
  Swords, 
  FileText, 
  Scroll, 
  Dices, 
  ShieldAlert, 
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { CharacterData } from '../../types';

export type WorkspaceWidgetId = 'initiative' | 'notes' | 'quests' | 'dice' | 'vitals';

interface WorkspaceWidget {
  id: WorkspaceWidgetId;
  title: string;
  icon: React.ReactNode;
  category: string;
}

const ALL_WIDGETS: WorkspaceWidget[] = [
  { id: 'vitals', title: 'Character Vitals & HP', icon: <Sparkles className="w-4 h-4 text-amber-400" />, category: 'Core Stats' },
  { id: 'initiative', title: 'Party Initiative Tracker', icon: <Swords className="w-4 h-4 text-rose-400" />, category: 'Combat' },
  { id: 'notes', title: 'Quick Scratchpad & Notes', icon: <FileText className="w-4 h-4 text-cyan-400" />, category: 'Journal' },
  { id: 'quests', title: 'Active Quest Monitor', icon: <Scroll className="w-4 h-4 text-purple-400" />, category: 'Campaign' },
  { id: 'dice', title: 'Quick Dice Tray', icon: <Dices className="w-4 h-4 text-emerald-400" />, category: 'Tools' }
];

const STORAGE_KEY_PINNED_WIDGETS = 'penpaper_pinned_widgets_v1';

interface WorkspaceCustomizerProps {
  character: CharacterData;
  onNavigateTab: (tab: string) => void;
  onRollDice?: (formula: string) => void;
}

export function WorkspaceCustomizer({ character, onNavigateTab, onRollDice }: WorkspaceCustomizerProps) {
  const [pinnedWidgetIds, setPinnedWidgetIds] = useState<WorkspaceWidgetId[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PINNED_WIDGETS);
      return saved ? JSON.parse(saved) : ['vitals', 'initiative', 'notes'];
    } catch {
      return ['vitals', 'initiative', 'notes'];
    }
  });

  const [isExpanded, setIsExpanded] = useState(true);
  const [quickNoteText, setQuickNoteText] = useState(() => {
    return localStorage.getItem(`penpaper_quick_notes_${character.id}`) || '';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PINNED_WIDGETS, JSON.stringify(pinnedWidgetIds));
  }, [pinnedWidgetIds]);

  useEffect(() => {
    localStorage.setItem(`penpaper_quick_notes_${character.id}`, quickNoteText);
  }, [quickNoteText, character.id]);

  const togglePin = (id: WorkspaceWidgetId) => {
    if (pinnedWidgetIds.includes(id)) {
      setPinnedWidgetIds(pinnedWidgetIds.filter(w => w !== id));
    } else {
      setPinnedWidgetIds([...pinnedWidgetIds, id]);
    }
  };

  return (
    <div className="bg-stone-900/90 border border-amber-600/30 rounded-2xl p-4 shadow-xl mb-6">
      {/* Workspace Bar Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Layout className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-sm text-amber-100 flex items-center gap-2">
              <span>Pinned Workspace Dashboard</span>
              <span className="text-[10px] bg-stone-800 text-stone-400 font-mono px-2 py-0.5 rounded-full border border-stone-700">
                {pinnedWidgetIds.length} Pinned
              </span>
            </h3>
            <p className="text-[11px] text-stone-400">Custom layout pinned widgets for active session navigation</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Pin Selector Menu */}
          <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
            {ALL_WIDGETS.map((w) => {
              const isPinned = pinnedWidgetIds.includes(w.id);
              return (
                <button
                  key={w.id}
                  onClick={() => togglePin(w.id)}
                  title={`${isPinned ? 'Unpin' : 'Pin'} ${w.title}`}
                  className={`p-1.5 rounded-lg text-xs transition flex items-center gap-1 ${
                    isPinned ? 'bg-amber-600 text-stone-950 font-bold' : 'text-stone-400 hover:bg-stone-800'
                  }`}
                >
                  <Pin className={`w-3 h-3 ${isPinned ? 'fill-stone-950' : ''}`} />
                  <span className="hidden sm:inline text-[10px]">{w.title.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-stone-800 text-stone-400 hover:text-stone-200 transition"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Workspace Widgets Grid */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
          {pinnedWidgetIds.includes('vitals') && (
            <div className="p-3.5 bg-stone-950 border border-stone-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-serif font-bold text-amber-300">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Vitals & Speed
                </span>
                <button onClick={() => togglePin('vitals')} className="text-stone-500 hover:text-stone-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-stone-900 rounded-lg border border-stone-800">
                  <div className="text-[10px] text-stone-400 font-mono uppercase">HP</div>
                  <div className="font-bold text-emerald-400">{character.hpCurrent} / {character.hpMax}</div>
                </div>
                <div className="p-2 bg-stone-900 rounded-lg border border-stone-800">
                  <div className="text-[10px] text-stone-400 font-mono uppercase">AC</div>
                  <div className="font-bold text-amber-300">{character.armorClass}</div>
                </div>
                <div className="p-2 bg-stone-900 rounded-lg border border-stone-800">
                  <div className="text-[10px] text-stone-400 font-mono uppercase">Speed</div>
                  <div className="font-bold text-cyan-300">{character.speed} ft</div>
                </div>
              </div>
            </div>
          )}

          {pinnedWidgetIds.includes('initiative') && (
            <div className="p-3.5 bg-stone-950 border border-stone-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-serif font-bold text-rose-300">
                <span className="flex items-center gap-1.5">
                  <Swords className="w-3.5 h-3.5 text-rose-400" /> Initiative Quick Action
                </span>
                <button onClick={() => togglePin('initiative')} className="text-stone-500 hover:text-stone-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-stone-400 font-sans">Mod: +{character.initiativeBonus}</span>
                <button
                  onClick={() => onNavigateTab('combat')}
                  className="px-3 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-serif font-bold transition"
                >
                  Open Turn Order →
                </button>
              </div>
            </div>
          )}

          {pinnedWidgetIds.includes('notes') && (
            <div className="p-3.5 bg-stone-950 border border-stone-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-serif font-bold text-cyan-300">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" /> Quick Scratchpad
                </span>
                <button onClick={() => togglePin('notes')} className="text-stone-500 hover:text-stone-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                value={quickNoteText}
                onChange={(e) => setQuickNoteText(e.target.value)}
                placeholder="Type quick session notes, loot, NPC clues..."
                rows={2}
                className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-cyan-500/50 resize-none font-sans"
              />
            </div>
          )}

          {pinnedWidgetIds.includes('quests') && (
            <div className="p-3.5 bg-stone-950 border border-stone-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-serif font-bold text-purple-300">
                <span className="flex items-center gap-1.5">
                  <Scroll className="w-3.5 h-3.5 text-purple-400" /> Campaign Quest Monitor
                </span>
                <button onClick={() => togglePin('quests')} className="text-stone-500 hover:text-stone-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-stone-400 line-clamp-2">
                Active Campaign Objective: Investigate the ancient ruins of Phandalin.
              </p>
            </div>
          )}

          {pinnedWidgetIds.includes('dice') && (
            <div className="p-3.5 bg-stone-950 border border-stone-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-serif font-bold text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <Dices className="w-3.5 h-3.5 text-emerald-400" /> Quick Dice Tray
                </span>
                <button onClick={() => togglePin('dice')} className="text-stone-500 hover:text-stone-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                {['d20', 'd12', 'd10', 'd8', 'd6', 'd4'].map((d) => (
                  <button
                    key={d}
                    onClick={() => onRollDice && onRollDice(`1${d}`)}
                    className="px-2 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 rounded text-xs font-mono transition"
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
