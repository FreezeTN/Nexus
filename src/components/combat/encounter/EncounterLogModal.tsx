import React, { useState } from 'react';
import { ScrollText, Search, Download, FileText, Check, MessageSquarePlus, X } from 'lucide-react';
import { CombatLogEntry } from './encounterTypes';

interface EncounterLogModalProps {
  combatLogs: CombatLogEntry[];
  roundNumber: number;
  activeCombatantName?: string;
  characterName: string;
  onClose: () => void;
  onAddLogEntry: (category: CombatLogEntry['category'], message: string, actor?: string) => void;
  onClearLogs: () => void;
}

export const EncounterLogModal: React.FC<EncounterLogModalProps> = ({
  combatLogs,
  roundNumber,
  activeCombatantName,
  characterName,
  onClose,
  onAddLogEntry,
  onClearLogs
}) => {
  const [logFilterCategory, setLogFilterCategory] = useState<string>('all');
  const [logSearchText, setLogSearchText] = useState('');
  const [customNoteInput, setCustomNoteInput] = useState('');
  const [copiedLog, setCopiedLog] = useState(false);

  const filteredLogs = combatLogs.filter(log => {
    const matchesCategory = logFilterCategory === 'all' || log.category === logFilterCategory;
    const search = logSearchText.toLowerCase();
    const matchesSearch = !search ||
      log.message.toLowerCase().includes(search) ||
      (log.actor && log.actor.toLowerCase().includes(search));
    return matchesCategory && matchesSearch;
  });

  const handleCopyLogsText = () => {
    const text = combatLogs
      .map(l => `[${l.timestamp}] [Round ${l.round}] [${l.category.toUpperCase()}] ${l.actor ? `${l.actor}: ` : ''}${l.message}`)
      .reverse()
      .join('\n');

    navigator.clipboard.writeText(text);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  const handleExportLogsFile = () => {
    const text = combatLogs
      .map(l => `[${l.timestamp}] [Round ${l.round}] [${l.category.toUpperCase()}] ${l.actor ? `${l.actor}: ` : ''}${l.message}`)
      .reverse()
      .join('\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Encounter_Combat_Log_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddCustomNote = () => {
    if (!customNoteInput.trim()) return;
    onAddLogEntry('note', customNoteInput.trim(), activeCombatantName || characterName);
    setCustomNoteInput('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-serif font-bold text-stone-100">Encounter Combat Log History</h2>
            <span className="bg-amber-950 text-amber-300 border border-amber-600/40 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
              {combatLogs.length} Entries
            </span>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-950 p-2.5 rounded-xl border border-stone-800">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <div className="relative min-w-[140px] flex-1">
              <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search combat events..."
                value={logSearchText}
                onChange={(e) => setLogSearchText(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg pl-8 pr-2 py-1 text-xs text-stone-100"
              />
            </div>
            <select
              value={logFilterCategory}
              onChange={(e) => setLogFilterCategory(e.target.value)}
              className="bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-bold"
            >
              <option value="all">All Categories</option>
              <option value="initiative">Initiative</option>
              <option value="turn">Turn Actions</option>
              <option value="attack">Attacks</option>
              <option value="damage">Damage</option>
              <option value="heal">Heals & Milestones</option>
              <option value="ability">Abilities / Features</option>
              <option value="condition">Conditions</option>
              <option value="note">DM Notes</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleCopyLogsText}
              className="flex items-center gap-1 text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 px-2.5 py-1 rounded-lg font-bold transition"
            >
              {copiedLog ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileText className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copiedLog ? 'Copied!' : 'Copy Log'}</span>
            </button>
            <button
              onClick={handleExportLogsFile}
              className="flex items-center gap-1 text-xs bg-amber-600 hover:bg-amber-500 text-stone-950 px-2.5 py-1 rounded-lg font-bold transition shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .txt</span>
            </button>
          </div>
        </div>

        {/* Custom Note Entry */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add DM note or event summary to combat log..."
            value={customNoteInput}
            onChange={(e) => setCustomNoteInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustomNote()}
            className="flex-1 bg-stone-950 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-stone-100"
          />
          <button
            onClick={handleAddCustomNote}
            className="flex items-center gap-1 bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-600/30 px-3 py-1.5 rounded-xl text-xs font-bold transition"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span>Add Note</span>
          </button>
        </div>

        {/* Logs Feed */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-10 text-stone-500 text-xs italic">
              No log entries match the current filter criteria.
            </div>
          ) : (
            filteredLogs.map(log => (
              <div
                key={log.id}
                className="bg-stone-950/70 border border-stone-800/80 rounded-xl p-2.5 text-xs space-y-1 hover:border-stone-700 transition"
              >
                <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono border-b border-stone-800/50 pb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-amber-400 font-bold">R{log.round}</span>
                    <span className="text-stone-400">• {log.timestamp}</span>
                    {log.actor && <span className="text-amber-200/90 font-semibold">• {log.actor}</span>}
                  </span>
                  <span className="uppercase text-stone-500 tracking-wider font-bold">{log.category}</span>
                </div>
                <div className="text-stone-200 whitespace-pre-wrap font-sans text-xs leading-relaxed pl-1">
                  {log.message}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm('Clear all combat logs for this encounter?')) {
                onClearLogs();
              }
            }}
            className="text-xs text-rose-400 hover:text-rose-300 font-bold"
          >
            Clear Log History
          </button>
          <button
            onClick={onClose}
            className="bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs px-4 py-2 rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
