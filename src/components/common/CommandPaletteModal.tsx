import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  Sparkles, 
  UserPlus, 
  Dices, 
  BookOpen, 
  ShieldAlert, 
  Settings, 
  Volume2, 
  Swords, 
  Command, 
  X,
  Layers,
  ChevronRight
} from 'lucide-react';
import { CharacterData, RuleEdition } from '../../types';
import { systemRegistry } from '../../systems';
import { eventBus } from '../../events/eventBus';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: CharacterData[];
  activeCharacter: CharacterData;
  onSelectCharacter: (char: CharacterData) => void;
  onOpenNewCharacter: () => void;
  onOpenOptions: () => void;
  onOpenAudio: () => void;
  onOpenExtensionManager: () => void;
  onNavigateTab: (tabId: any) => void;
  onRollDice?: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: 'Actions' | 'Characters' | 'Systems' | 'Navigation';
  description?: string;
  icon: React.ReactNode;
  action: () => void;
}

export function CommandPaletteModal({
  isOpen,
  onClose,
  characters,
  activeCharacter,
  onSelectCharacter,
  onOpenNewCharacter,
  onOpenOptions,
  onOpenAudio,
  onOpenExtensionManager,
  onNavigateTab,
  onRollDice
}: CommandPaletteModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const allCommands = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [
      {
        id: 'action-new-char',
        title: 'Create New Character',
        category: 'Actions',
        description: 'Launch character generator with system templates',
        icon: <UserPlus className="w-4 h-4 text-amber-400" />,
        action: () => {
          onClose();
          onOpenNewCharacter();
        }
      },
      {
        id: 'action-roll-dice',
        title: 'Roll Custom Dice',
        category: 'Actions',
        description: 'Open dice tray and rolling engine',
        icon: <Dices className="w-4 h-4 text-emerald-400" />,
        action: () => {
          onClose();
          if (onRollDice) onRollDice();
        }
      },
      {
        id: 'action-extensions',
        title: 'Plugin & Extension Manager',
        category: 'Actions',
        description: 'Manage active TRPG rules engines & extensions',
        icon: <Layers className="w-4 h-4 text-indigo-400" />,
        action: () => {
          onClose();
          onOpenExtensionManager();
        }
      },
      {
        id: 'action-options',
        title: 'System Settings & Options',
        category: 'Actions',
        description: 'Manage Cloud save, theme, sound, and system rules',
        icon: <Settings className="w-4 h-4 text-stone-400" />,
        action: () => {
          onClose();
          onOpenOptions();
        }
      },
      {
        id: 'action-audio',
        title: 'Ambient Audio & Sound FX',
        category: 'Actions',
        description: 'Configure tavern ambiance, battle tracks, and spell SFX',
        icon: <Volume2 className="w-4 h-4 text-cyan-400" />,
        action: () => {
          onClose();
          onOpenAudio();
        }
      },
      {
        id: 'nav-stats',
        title: 'Open Stats & Features Sheet',
        category: 'Navigation',
        description: 'View abilities, skills, and background features',
        icon: <Sparkles className="w-4 h-4 text-amber-400" />,
        action: () => {
          onClose();
          onNavigateTab('stats');
        }
      },
      {
        id: 'nav-combat',
        title: 'Open Combat & Actions',
        category: 'Navigation',
        description: 'Weapons, AC breakdown, HP, conditions & turns',
        icon: <Swords className="w-4 h-4 text-rose-400" />,
        action: () => {
          onClose();
          onNavigateTab('combat');
        }
      },
      {
        id: 'nav-spells',
        title: 'Open Spellbook',
        category: 'Navigation',
        description: 'Spell slots, prepared spells & casting modifiers',
        icon: <BookOpen className="w-4 h-4 text-purple-400" />,
        action: () => {
          onClose();
          onNavigateTab('spells');
        }
      },
      {
        id: 'nav-dm',
        title: 'Open DM Overview & Combat Matrix',
        category: 'Navigation',
        description: 'Track all PCs, initiative order, passive stats & monster library',
        icon: <ShieldAlert className="w-4 h-4 text-red-400" />,
        action: () => {
          onClose();
          onNavigateTab('dm');
        }
      }
    ];

    // Add character commands
    characters.forEach((char) => {
      const isCurrent = char.id === activeCharacter?.id;
      list.push({
        id: `char-${char.id}`,
        title: `Switch to ${char.name}`,
        category: 'Characters',
        description: `Level ${char.level || 1} ${char.race || ''} ${char.characterClass || ''} (${char.edition || '5e'})`,
        icon: <span className="text-sm">{isCurrent ? '⭐' : '👤'}</span>,
        action: () => {
          onClose();
          onSelectCharacter(char);
          eventBus.emit('CharacterUpdated', { character: char });
        }
      });
    });

    // Add system plugins
    systemRegistry.getAllSystems().forEach((sys) => {
      list.push({
        id: `sys-${sys.id}`,
        title: `TRPG Plugin: ${sys.name}`,
        category: 'Systems',
        description: `${sys.description}`,
        icon: <span className="text-sm">{sys.icon}</span>,
        action: () => {
          onClose();
          onOpenOptions();
        }
      });
    });

    return list;
  }, [characters, activeCharacter, onClose, onSelectCharacter, onOpenNewCharacter, onOpenOptions, onOpenAudio, onOpenExtensionManager, onNavigateTab, onRollDice]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allCommands;
    const q = query.toLowerCase();
    return allCommands.filter(
      cmd =>
        cmd.title.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q) ||
        (cmd.description && cmd.description.toLowerCase().includes(q))
    );
  }, [allCommands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-stone-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-stone-900 border border-amber-600/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div className="p-4 border-b border-stone-800 flex items-center gap-3 bg-stone-950/80">
          <Search className="w-5 h-5 text-amber-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, character, action or system... (e.g. Roll, Create, DM)"
            className="w-full bg-transparent text-stone-100 placeholder-stone-500 text-sm font-sans focus:outline-none"
          />
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-800 text-[10px] font-mono text-stone-400 border border-stone-700">
              <Command className="w-3 h-3" /> K
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Command Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-stone-500 text-xs font-serif">
              No matching commands or actions found for "{query}".
            </div>
          ) : (
            filtered.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full px-3 py-2.5 rounded-xl text-left transition flex items-center justify-between group ${
                    isSelected
                      ? 'bg-amber-600/20 border border-amber-500/50 text-stone-100'
                      : 'text-stone-300 hover:bg-stone-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-amber-500/30' : 'bg-stone-800'}`}>
                      {item.icon}
                    </div>
                    <div>
                      <div className="font-serif font-bold text-xs flex items-center gap-2">
                        <span>{item.title}</span>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-stone-800 text-stone-400 font-mono border border-stone-700">
                          {item.category}
                        </span>
                      </div>
                      {item.description && (
                        <div className="text-[11px] text-stone-400 mt-0.5 line-clamp-1 font-sans">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <ChevronRight className={`w-4 h-4 transition ${isSelected ? 'text-amber-400 translate-x-0.5' : 'text-stone-600 opacity-0 group-hover:opacity-100'}`} />
                </button>
              );
            })
          )}
        </div>

        {/* Command Palette Footer */}
        <div className="p-2.5 bg-stone-950 border-t border-stone-800 text-[10px] text-stone-500 flex items-center justify-between font-mono px-4">
          <div className="flex items-center gap-3">
            <span><strong className="text-stone-400">↑↓</strong> Navigate</span>
            <span><strong className="text-stone-400">↵</strong> Select</span>
            <span><strong className="text-stone-400">ESC</strong> Close</span>
          </div>
          <div className="text-amber-500/80 font-serif">Pen & Paper Platform SDK</div>
        </div>
      </div>
    </div>
  );
}
