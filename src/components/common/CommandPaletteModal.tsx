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
  Code,
  ChevronRight,
  Package,
  Scroll,
  Skull,
  MapPin,
  FileText,
  Users,
  Network,
  Bot,
  Radio,
  Compass,
  Flag,
  ShieldCheck
} from 'lucide-react';
import { CharacterData } from '../../types';
import { systemRegistry } from '../../systems';
import { eventBus } from '../../events/eventBus';
import { searchIndexer } from '../../utils/searchIndexer';
import { useLanguage } from '../../i18n/LanguageContext';
import { useUiMode } from '../../context/UiModeContext';

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
  onOpenDeveloperSdk?: () => void;
  onOpenCampaignGraph?: () => void;
  onOpenAiAssistant?: () => void;
  onOpenGenerators?: (tab?: 'npc' | 'encounter' | 'treasure' | 'session' | 'rules' | 'dungeon') => void;
  onOpenCopilot?: () => void;
  onOpenCampaignLoreVault?: (tab?: any) => void;
  onNavigateTab: (tabId: any) => void;
  onRollDice?: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: 'Actions' | 'Characters' | 'Spells' | 'Items' | 'Monsters' | 'Conditions' | 'Quests' | 'NPCs' | 'Notes' | 'Locations' | 'Systems' | 'Navigation';
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
  onOpenDeveloperSdk,
  onOpenCampaignGraph,
  onOpenAiAssistant,
  onOpenGenerators,
  onOpenCopilot,
  onOpenCampaignLoreVault,
  onNavigateTab,
  onRollDice
}: CommandPaletteModalProps) {
  const { t } = useLanguage();
  const { isTableMode, toggleTableMode } = useUiMode();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedCategory('All');
      setSelectedIndex(0);
      searchIndexer.initializeIndex(characters);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, characters]);

  const allCommands = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [
      {
        id: 'action-table-mode',
        title: isTableMode ? 'Exit Table Mode (Return to Full Workspace)' : 'Launch Table Mode / Focused Play HUD (Alt+T)',
        category: 'Actions',
        description: 'Distraction-free tabletop play HUD with vital HP controls, attack rolls, spell slots & live scratchpad',
        icon: <Dices className="w-4 h-4 text-amber-400" />,
        action: () => {
          onClose();
          toggleTableMode();
        }
      },
      {
        id: 'action-ai-oracle',
        title: 'Nexus AI Oracle & Forge (Rules, Chat & Generator)',
        category: 'Actions',
        description: 'Ask rules questions, get app guidance, or forge monsters, items, spells, and graph nodes',
        icon: <Bot className="w-4 h-4 text-purple-400" />,
        action: () => {
          onClose();
          if (onOpenAiAssistant) onOpenAiAssistant();
        }
      },
      {
        id: 'action-generator-npc',
        title: 'AI Generator: NPCs & Key Contacts',
        category: 'Actions',
        description: 'Generate rich NPCs with personality traits, voices, secrets, stat blocks & quests',
        icon: <Users className="w-4 h-4 text-amber-400" />,
        action: () => {
          onClose();
          if (onOpenGenerators) onOpenGenerators('npc');
        }
      },
      {
        id: 'action-generator-encounter',
        title: 'AI Generator: Balanced Combat Encounters',
        category: 'Actions',
        description: 'Build tactical encounter packs with CR scaling, terrain hazards & combat AI',
        icon: <Swords className="w-4 h-4 text-rose-400" />,
        action: () => {
          onClose();
          if (onOpenGenerators) onOpenGenerators('encounter');
        }
      },
      {
        id: 'action-generator-treasure',
        title: 'AI Generator: Treasure Hoards & Magic Loot',
        category: 'Actions',
        description: 'Roll thematic treasure hoards, appraised art objects, gemstones & magic items',
        icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
        action: () => {
          onClose();
          if (onOpenGenerators) onOpenGenerators('treasure');
        }
      },
      {
        id: 'action-generator-dungeon',
        title: 'AI Generator: Dungeon Hazards, Rooms & Traps',
        category: 'Actions',
        description: 'Generate atmospheric dungeon rooms, puzzles, lethal traps & environmental hazards',
        icon: <MapPin className="w-4 h-4 text-amber-500" />,
        action: () => {
          onClose();
          if (onOpenGenerators) onOpenGenerators('dungeon');
        }
      },
      {
        id: 'action-generator-session',
        title: 'AI Generator: Session Chronicle & Story Recap',
        category: 'Actions',
        description: 'Synthesize bulleted session notes into narrative chronicles & quest log recaps',
        icon: <FileText className="w-4 h-4 text-cyan-400" />,
        action: () => {
          onClose();
          if (onOpenGenerators) onOpenGenerators('session');
        }
      },
      {
        id: 'action-generator-rules',
        title: 'AI Generator: Instant TRPG Rules Adjudicator',
        category: 'Actions',
        description: 'Lookup official rules rulings (RAW vs RAI), edge-cases & fair DM adjudications',
        icon: <BookOpen className="w-4 h-4 text-indigo-400" />,
        action: () => {
          onClose();
          if (onOpenGenerators) onOpenGenerators('rules');
        }
      },
      {
        id: 'action-live-copilot',
        title: 'Live Session Co-Pilot HUD',
        category: 'Actions',
        description: 'Instant sensory room intros, cinematic finisher narrations, stunt rulings & concentration DC calculator',
        icon: <Sparkles className="w-4 h-4 text-amber-300" />,
        action: () => {
          onClose();
          if (onOpenCopilot) onOpenCopilot();
        }
      },
      {
        id: 'action-soundscapes',
        title: 'Procedural Soundscape Synthesizer (Web Audio API)',
        category: 'Actions',
        description: 'Campfires, rainstorms, dungeons, astral drones & tactile tabletop sound effects',
        icon: <Radio className="w-4 h-4 text-cyan-400" />,
        action: () => {
          onClose();
          if (onOpenCopilot) onOpenCopilot();
        }
      },
      {
        id: 'action-campaign-lore-vault',
        title: 'Open Campaign World Atlas & Lore Vault',
        category: 'Actions',
        description: 'World atlas map, questline tracker, faction standing matrix & travel logistics (Ctrl+M)',
        icon: <Compass className="w-4 h-4 text-amber-400" />,
        action: () => {
          onClose();
          if (onOpenCampaignLoreVault) onOpenCampaignLoreVault('atlas');
        }
      },
      {
        id: 'action-campaign-quests',
        title: 'Open Questline & Objective Tracker',
        category: 'Actions',
        description: 'Track active, completed, and failed quests with AI generator and rewards',
        icon: <Flag className="w-4 h-4 text-emerald-400" />,
        action: () => {
          onClose();
          if (onOpenCampaignLoreVault) onOpenCampaignLoreVault('quests');
        }
      },
      {
        id: 'action-campaign-factions',
        title: 'Open Faction Standing & Influence Matrix',
        category: 'Actions',
        description: 'Manage faction relations, reputation tiers, perks, and secret motives',
        icon: <ShieldCheck className="w-4 h-4 text-purple-400" />,
        action: () => {
          onClose();
          if (onOpenCampaignLoreVault) onOpenCampaignLoreVault('factions');
        }
      },
      {
        id: 'action-campaign-travel',
        title: 'Open Wilderness Travel & Logistics Calculator',
        category: 'Actions',
        description: 'Terrain speed, ration/water supplies, foraging checks, and hazard events',
        icon: <Compass className="w-4 h-4 text-cyan-400" />,
        action: () => {
          onClose();
          if (onOpenCampaignLoreVault) onOpenCampaignLoreVault('travel');
        }
      },
      {
        id: 'action-campaign-graph',
        title: 'Open Interactive Campaign Knowledge Graph',
        category: 'Actions',
        description: 'Obsidian-style visual network of monsters, locations, factions, and quests',
        icon: <Network className="w-4 h-4 text-amber-400" />,
        action: () => {
          onClose();
          if (onOpenCampaignGraph) onOpenCampaignGraph();
        }
      },
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
        description: 'Open Nexus dice tray & rolling physics engine',
        icon: <Dices className="w-4 h-4 text-emerald-400" />,
        action: () => {
          onClose();
          if (onRollDice) onRollDice();
        }
      },
      {
        id: 'action-extensions',
        title: 'Nexus Extension Manager',
        category: 'Actions',
        description: 'Manage active Nexus TRPG rules engines & extensions',
        icon: <Layers className="w-4 h-4 text-indigo-400" />,
        action: () => {
          onClose();
          onOpenExtensionManager();
        }
      },
      {
        id: 'action-developer-sdk',
        title: 'Nexus Developer SDK & Architecture Center',
        category: 'Actions',
        description: 'Explore Nexus Engine Specs, Plugin Packaging, Event Bus & Telemetry',
        icon: <Code className="w-4 h-4 text-purple-400" />,
        action: () => {
          onClose();
          if (onOpenDeveloperSdk) onOpenDeveloperSdk();
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

    // Add Sample Campaign Quests
    const SAMPLE_QUESTS = [
      { id: 'q1', title: 'The Lost Mine of Phandelver', status: 'Active', location: 'Phandalin' },
      { id: 'q2', title: 'Rescue the Blacksmith Sildar', status: 'Completed', location: 'Cragmaw Hideout' },
      { id: 'q3', title: 'Investigate the Redbrand Hideout', status: 'Active', location: 'Tresendar Manor' }
    ];
    SAMPLE_QUESTS.forEach((quest) => {
      list.push({
        id: `quest-${quest.id}`,
        title: `Quest: ${quest.title}`,
        category: 'Quests',
        description: `Status: ${quest.status} • Location: ${quest.location}`,
        icon: <Scroll className="w-4 h-4 text-purple-400" />,
        action: () => {
          onClose();
          onNavigateTab('notes');
        }
      });
    });

    // Add Sample Campaign NPCs & Factions
    const SAMPLE_NPCS = [
      { id: 'npc1', name: 'Gundren Rockseeker', role: 'Dwarf Merchant', faction: 'Rockseeker Brothers' },
      { id: 'npc2', name: 'Elmar Barthen', role: 'Provisions Merchant', faction: 'Barthen\'s Provisions' },
      { id: 'npc3', name: 'Iarno "Glasstaff" Albrek', role: 'Mage & Redbrand Leader', faction: 'Redbrand Ruffians' }
    ];
    SAMPLE_NPCS.forEach((npc) => {
      list.push({
        id: `npc-${npc.id}`,
        title: `NPC: ${npc.name}`,
        category: 'NPCs',
        description: `${npc.role} • ${npc.faction}`,
        icon: <Users className="w-4 h-4 text-cyan-400" />,
        action: () => {
          onClose();
          onNavigateTab('dm');
        }
      });
    });

    // Add Sample World Locations
    const SAMPLE_LOCATIONS = [
      { id: 'loc1', name: 'Town of Phandalin', region: 'Sword Coast' },
      { id: 'loc2', name: 'Stonehill Inn', region: 'Phandalin Square' },
      { id: 'loc3', name: 'Wave Echo Cave', region: 'Sword Mountains' }
    ];
    SAMPLE_LOCATIONS.forEach((loc) => {
      list.push({
        id: `loc-${loc.id}`,
        title: `Location: ${loc.name}`,
        category: 'Locations',
        description: `Region: ${loc.region}`,
        icon: <MapPin className="w-4 h-4 text-emerald-400" />,
        action: () => {
          onClose();
          onNavigateTab('dm');
        }
      });
    });

    return list;
  }, [characters, activeCharacter, onClose, onSelectCharacter, onOpenNewCharacter, onOpenOptions, onOpenAudio, onOpenExtensionManager, onNavigateTab, onRollDice]);

  const filtered = useMemo(() => {
    if (selectedCategory !== 'All' || query.trim()) {
      const indexedResults = searchIndexer.search(query, selectedCategory);
      if (indexedResults.length > 0) {
        return indexedResults.map((r) => {
          let icon = <FileText className="w-4 h-4 text-stone-400" />;
          if (r.category === 'Monsters') icon = <Skull className="w-4 h-4 text-rose-400" />;
          else if (r.category === 'Spells') icon = <Scroll className="w-4 h-4 text-purple-400" />;
          else if (r.category === 'Items') icon = <Package className="w-4 h-4 text-emerald-400" />;
          else if (r.category === 'Quests') icon = <Scroll className="w-4 h-4 text-purple-400" />;
          else if (r.category === 'Locations') icon = <MapPin className="w-4 h-4 text-emerald-400" />;
          else if (r.category === 'Factions') icon = <ShieldAlert className="w-4 h-4 text-indigo-400" />;
          else if (r.category === 'NPCs') icon = <Users className="w-4 h-4 text-cyan-400" />;
          else if (r.category === 'Characters') icon = <span className="text-sm">👤</span>;

          return {
            id: r.id,
            title: r.title,
            category: r.category as any,
            description: r.description,
            icon,
            action: () => {
              onClose();
              if (r.actionData.type === 'navigate_tab' && r.actionData.target) {
                onNavigateTab(r.actionData.target);
              } else if (r.actionData.type === 'select_character' && r.actionData.payload) {
                onSelectCharacter(r.actionData.payload);
              }
            }
          };
        });
      }
    }

    // Default fallback to allCommands
    const q = query.toLowerCase().trim();
    return allCommands.filter(
      cmd =>
        (selectedCategory === 'All' || cmd.category === selectedCategory) &&
        (!q ||
          cmd.title.toLowerCase().includes(q) ||
          cmd.category.toLowerCase().includes(q) ||
          (cmd.description && cmd.description.toLowerCase().includes(q)))
    );
  }, [allCommands, query, selectedCategory, onClose, onNavigateTab, onSelectCharacter]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, selectedCategory]);

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
        <div className="p-4 border-b border-stone-800 flex flex-col gap-2.5 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-amber-500 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('command.placeholder', 'Search anything: dragon, fireball, sword, phandalin, roll, DM...')}
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

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scrollbar-none pt-1">
            {['All', 'Monsters', 'Spells', 'Items', 'Quests', 'Locations', 'Factions', 'NPCs', 'Actions', 'Characters'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-serif font-bold transition whitespace-nowrap shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-amber-600 text-stone-950 shadow ring-1 ring-amber-400'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/80'
                }`}
              >
                {cat}
              </button>
            ))}
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
