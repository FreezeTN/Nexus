import React, { useState, useEffect } from 'react';
import {
  Keyboard,
  RotateCcw,
  Search,
  Check,
  AlertCircle,
  Sparkles,
  Command,
  Compass,
  Sliders,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { useHotkeys, HotkeyItem } from '../../../context/HotkeyContext';

export const HotkeysOptionsTab: React.FC = () => {
  const {
    hotkeys,
    updateHotkey,
    resetHotkey,
    resetAllHotkeys,
    formatHotkeyDisplay
  } = useHotkeys();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'navigation' | 'modes' | 'tools'>('all');
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Keyboard capture for recording new hotkeys
  useEffect(() => {
    if (!recordingId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Pressing Escape cancels recording
      if (e.key === 'Escape') {
        setRecordingId(null);
        setConflictWarning(null);
        return;
      }

      // Ignore modifier keys alone
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
        return;
      }

      const newKey = e.key.toLowerCase();
      const ctrlKey = e.ctrlKey || e.metaKey;
      const shiftKey = e.shiftKey;
      const altKey = e.altKey;

      // Check if there is an existing conflict with another hotkey
      const conflict = hotkeys.find(
        h =>
          h.id !== recordingId &&
          h.key.toLowerCase() === newKey &&
          !!h.ctrlKey === !!ctrlKey &&
          !!h.shiftKey === !!shiftKey &&
          !!h.altKey === !!altKey
      );

      if (conflict) {
        setConflictWarning(
          `Key combination already assigned to "${conflict.label}". Reassigning will override it.`
        );
      } else {
        setConflictWarning(null);
      }

      // Apply the new hotkey
      updateHotkey(recordingId, {
        key: newKey,
        ctrlKey,
        shiftKey,
        altKey
      });

      const currentItem = hotkeys.find(h => h.id === recordingId);
      setSuccessToast(`Updated shortcut for ${currentItem?.label || 'action'}`);
      setRecordingId(null);
      setTimeout(() => setSuccessToast(null), 2500);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [recordingId, hotkeys, updateHotkey]);

  // Filter hotkeys
  const filteredHotkeys = hotkeys.filter(item => {
    const matchesSearch =
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formatHotkeyDisplay(item).toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      activeCategoryFilter === 'all' || item.category === activeCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: HotkeyItem['category']) => {
    switch (category) {
      case 'navigation':
        return <Compass className="w-3.5 h-3.5 text-amber-400" />;
      case 'modes':
        return <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />;
      case 'tools':
        return <Command className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  const getCategoryName = (category: HotkeyItem['category']) => {
    switch (category) {
      case 'navigation':
        return 'Navigation & Tabs';
      case 'modes':
        return 'Game Modes & Rules';
      case 'tools':
        return 'Tools & Actions';
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-200 flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Conflict Warning */}
      {conflictWarning && (
        <div className="p-2.5 bg-amber-950/80 border border-amber-500/50 rounded-xl text-xs text-amber-200 flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{conflictWarning}</span>
        </div>
      )}

      {/* Header Controls: Search, Category Filters, Reset */}
      <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search hotkey actions or keys..."
              className="w-full bg-stone-900 border border-stone-700/80 rounded-xl pl-9 pr-8 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Reset All Button */}
          {showResetConfirm ? (
            <div className="flex items-center gap-1.5 bg-rose-950/70 border border-rose-600/50 p-1 rounded-xl">
              <span className="text-[11px] text-rose-300 px-2 font-bold">Reset all hotkeys?</span>
              <button
                onClick={() => {
                  resetAllHotkeys();
                  setShowResetConfirm(false);
                  setSuccessToast('All hotkeys reset to factory defaults');
                  setTimeout(() => setSuccessToast(null), 2500);
                }}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-400 hover:text-rose-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
              title="Reset all customized keybindings to original defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          )}
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {(
            [
              { id: 'all', label: 'All Hotkeys', count: hotkeys.length },
              { id: 'navigation', label: 'Navigation & Tabs', count: hotkeys.filter(h => h.category === 'navigation').length },
              { id: 'modes', label: 'Modes & Rules', count: hotkeys.filter(h => h.category === 'modes').length },
              { id: 'tools', label: 'Tools & Actions', count: hotkeys.filter(h => h.category === 'tools').length }
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategoryFilter(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeCategoryFilter === tab.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'bg-stone-900/60 text-stone-400 border border-stone-800 hover:text-stone-300 hover:bg-stone-900'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-stone-950/80 rounded-full border border-stone-800 text-stone-400">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Recording Prompt Banner */}
      {recordingId && (
        <div className="p-4 bg-gradient-to-r from-amber-950/90 via-stone-900 to-amber-950/90 border-2 border-amber-500 rounded-xl flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <Keyboard className="w-6 h-6 text-amber-400 shrink-0 animate-bounce" />
            <div>
              <div className="text-xs font-bold text-amber-200">
                Recording shortcut for:{' '}
                <span className="text-amber-400">
                  {hotkeys.find(h => h.id === recordingId)?.label}
                </span>
              </div>
              <div className="text-[11px] text-stone-300 mt-0.5">
                Press any key on your keyboard (or key combination). Press <kbd className="px-1.5 py-0.5 bg-stone-800 rounded text-stone-200 font-mono">Esc</kbd> to cancel.
              </div>
            </div>
          </div>
          <button
            onClick={() => setRecordingId(null)}
            className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Hotkeys List */}
      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 scrollbar-thin">
        {filteredHotkeys.length === 0 ? (
          <div className="p-8 text-center bg-stone-950 rounded-xl border border-stone-800 text-stone-500 text-xs">
            No hotkeys match your search query "{searchQuery}".
          </div>
        ) : (
          filteredHotkeys.map(item => {
            const isRecordingThis = recordingId === item.id;
            const isCustomized =
              item.key !== item.defaultKey ||
              !!item.ctrlKey !== !!item.defaultCtrl ||
              !!item.shiftKey !== !!item.defaultShift ||
              !!item.altKey !== !!item.defaultAlt;

            return (
              <div
                key={item.id}
                className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                  isRecordingThis
                    ? 'bg-amber-950/60 border-amber-500 shadow-md ring-1 ring-amber-500'
                    : 'bg-stone-950/70 border-stone-800/80 hover:border-stone-700 hover:bg-stone-950'
                }`}
              >
                {/* Info */}
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-stone-900 border border-stone-800">
                      {getCategoryIcon(item.category)}
                    </span>
                    <span className="text-xs font-bold text-stone-200 truncate">
                      {item.label}
                    </span>
                    {isCustomized && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded">
                        Customized
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-400 line-clamp-1 leading-snug">
                    {item.description}
                  </p>
                </div>

                {/* Key Badge & Action Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  {isRecordingThis ? (
                    <div className="px-3 py-1.5 bg-amber-500 text-stone-950 font-mono font-bold text-xs rounded-lg shadow animate-pulse">
                      Press key...
                    </div>
                  ) : (
                    <button
                      onClick={() => setRecordingId(item.id)}
                      className="group px-3 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-amber-500/60 rounded-xl text-xs font-mono font-bold text-amber-300 transition flex items-center gap-1.5 shadow cursor-pointer"
                      title="Click to re-assign this hotkey"
                    >
                      <Keyboard className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-400 transition" />
                      <kbd className="tracking-wide">
                        {formatHotkeyDisplay(item)}
                      </kbd>
                    </button>
                  )}

                  {/* Reset single hotkey button */}
                  {isCustomized && !isRecordingThis && (
                    <button
                      onClick={() => {
                        resetHotkey(item.id);
                        setSuccessToast(`Reset ${item.label} to default`);
                        setTimeout(() => setSuccessToast(null), 2000);
                      }}
                      className="p-1.5 text-stone-500 hover:text-stone-300 hover:bg-stone-800 rounded-lg transition cursor-pointer"
                      title="Reset to default keybinding"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pro-Tip Note */}
      <div className="p-3 bg-stone-950/80 rounded-xl border border-stone-800 flex items-start gap-2.5 text-stone-400 text-xs">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="text-stone-300 font-bold">Tabletop Speed Tip:</span> Hotkeys are automatically disabled while typing in text areas, chat inputs, or notes so you never accidentally switch tabs while editing.
        </div>
      </div>
    </div>
  );
};
