import React from 'react';
import { CharacterData, RuleEdition } from '../types';
import { getMonsterPortraitUrl, generateMonsterSvgPortrait } from '../data/monsterPortraits';
import { isCharacterDead, getEffectiveMaxHp } from '../utils/dndCalculations';
import {
  Shield,
  Plus,
  Layers,
  Cpu,
  BookOpen,
  Skull,
  ChevronRight,
  CheckCircle2,
  Folder,
  User,
  Store,
  ChevronDown,
  Lock,
  Crown,
  UserCheck
} from 'lucide-react';
import { HpOrb } from './HpOrb';
import { UserProfile, CharacterPresence } from '../lib/firebase';

interface MainMenuProps {
  characters: CharacterData[];
  activeCharacter: CharacterData;
  onSelectCharacter: (id: string) => void;
  onCreateNewCharacter: (category?: 'character' | 'monster' | 'vendor') => void;
  onEnterGame: () => void;
  onSystemChange?: (system: RuleEdition) => void;
  edition?: RuleEdition;
  currentUser?: UserProfile | null;
  presenceMap?: Record<string, CharacterPresence>;
  onOpenAuthModal?: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  characters,
  activeCharacter,
  onSelectCharacter,
  onCreateNewCharacter,
  onEnterGame,
  onSystemChange,
  edition,
  currentUser,
  presenceMap = {},
  onOpenAuthModal
}) => {
  const currentEdition = edition || activeCharacter.edition || '5e';
  const activeSystem = currentEdition === 'shadowrun'
    ? 'shadowrun'
    : currentEdition === 'pathfinder'
    ? 'pathfinder'
    : currentEdition === 'cthulhu'
    ? 'cthulhu'
    : 'dnd';

  const [selectedSystem, setSelectedSystem] = React.useState<'dnd' | 'shadowrun' | 'pathfinder' | 'cthulhu'>(activeSystem);
  const [selectedEdition, setSelectedEdition] = React.useState<RuleEdition>(currentEdition);
  const [activeFolderTab, setActiveFolderTab] = React.useState<'all' | 'characters' | 'monsters' | 'merchants'>('all');
  const [collapsedFolders, setCollapsedFolders] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    setSelectedSystem(activeSystem);
    setSelectedEdition(currentEdition);
  }, [activeCharacter.id, currentEdition, activeSystem]);

  const toggleFolderCollapse = (folderKey: string) => {
    setCollapsedFolders(prev => ({ ...prev, [folderKey]: !prev[folderKey] }));
  };

  const handleSelectSystemCard = (sys: 'dnd' | 'shadowrun' | 'pathfinder' | 'cthulhu') => {
    setSelectedSystem(sys);
    let targetEdition: RuleEdition = '5e';
    if (sys === 'shadowrun') targetEdition = 'shadowrun';
    else if (sys === 'pathfinder') targetEdition = 'pathfinder';
    else if (sys === 'cthulhu') targetEdition = 'cthulhu';
    else targetEdition = selectedEdition === '3.5e' ? '3.5e' : '5e';

    setSelectedEdition(targetEdition);
    if (onSystemChange) {
      onSystemChange(targetEdition);
    }
  };

  const handleSelectEdition = (ed: RuleEdition) => {
    setSelectedEdition(ed);
    if (onSystemChange) {
      onSystemChange(ed);
    }
  };

  const renderFolderSystemView = (
    systemChars: CharacterData[],
    systemTheme: {
      accentBorder: string;
      accentBg: string;
      accentText: string;
      primaryBtn: string;
      playBtnLabel: string;
    }
  ) => {
    const isPlayerRole = !currentUser || currentUser.role === 'Player';
    const currentUserId = currentUser?.uid || 'guest_player';

    const playerChars = systemChars.filter(c => !c.isMonster && !c.isVendor);
    const monsterChars = systemChars.filter(c => c.isMonster);
    const merchantChars = systemChars.filter(c => c.isVendor && !c.isMonster);

    const renderCard = (char: CharacterData) => {
      const isActive = char.id === activeCharacter.id;
      const sr = char.shadowrun;
      const isSR = char.edition === 'shadowrun';
      const displayPortrait = char.portraitUrl || (char.isMonster ? getMonsterPortraitUrl(char.name, char.id) : undefined);
      const isDead = isCharacterDead(char);
      const isUnconscious = !isDead && (char.hpCurrent !== undefined && char.hpCurrent <= 0);

      const presence = presenceMap[char.id];
      const activeUserId = presence?.activeUserId;
      const activeUserName = presence?.activeUserName || 'Player';
      const isLockedForPlayer = isPlayerRole && !!activeUserId && activeUserId !== currentUserId;
      const isDmActiveOnChar = !!presence?.dmActive && char.id !== activeCharacter.id;
      const dmUserName = presence?.dmUserName || 'DM';

      const handleCardClick = () => {
        if (isLockedForPlayer) {
          alert(`🔒 ${char.name} is currently active in another session by ${activeUserName}. Players cannot select active characters of other players.`);
          return;
        }
        onSelectCharacter(char.id);
      };

      return (
        <div
          key={char.id}
          onClick={handleCardClick}
          className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between space-y-3 group ${
            isLockedForPlayer
              ? 'bg-stone-950/60 border-red-900/40 opacity-80 cursor-not-allowed'
              : isDead
              ? 'bg-rose-950/20 border-rose-900/80 hover:border-rose-700 hover:bg-rose-950/40 shadow-rose-950/30 cursor-pointer'
              : isActive
              ? `${systemTheme.accentBg} ${systemTheme.accentBorder} shadow-lg ring-1 ring-amber-500/40 cursor-pointer`
              : 'bg-stone-950/80 border-stone-800 hover:border-stone-700 hover:bg-stone-950 cursor-pointer'
          }`}
        >
          <div className="flex items-center gap-3">
            {displayPortrait ? (
              <img
                src={displayPortrait}
                alt={char.name}
                className={`w-12 h-12 rounded-xl object-cover border shrink-0 shadow ${isDead ? 'border-rose-600/70 grayscale' : 'border-stone-700'}`}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.onerror = null;
                  img.src = generateMonsterSvgPortrait(char?.name);
                }}
              />
            ) : (
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 font-serif font-bold text-lg shadow ${isDead ? 'bg-rose-950 border-rose-800 text-rose-300' : 'bg-stone-900 border-stone-800 text-stone-300'}`}>
                {char.name.charAt(0)}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <h4 className={`font-serif font-bold text-base truncate transition ${isDead ? 'text-rose-300' : isActive ? systemTheme.accentText : 'text-stone-100 group-hover:text-amber-300'}`}>
                  {char.name}
                </h4>
                <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                  {isDmActiveOnChar && (
                    <span className="text-[9px] bg-purple-950/90 text-purple-200 border border-purple-500/80 font-bold px-1.5 py-0.5 rounded font-mono flex items-center gap-0.5 animate-pulse shadow" title={`DM ${dmUserName} is active`}>
                      <Crown className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                      DM ACTIVE
                    </span>
                  )}
                  {isLockedForPlayer && (
                    <span className="text-[9px] bg-red-950 text-red-200 border border-red-600/80 font-bold px-1.5 py-0.5 rounded font-mono flex items-center gap-0.5 shadow">
                      <Lock className="w-2.5 h-2.5 text-red-400" />
                      IN USE ({activeUserName})
                    </span>
                  )}
                  {isDead && (
                    <span className="text-[9px] bg-rose-950 text-rose-200 border border-rose-600/70 font-black px-1.5 py-0.5 rounded font-mono flex items-center gap-0.5 animate-pulse shadow">
                      <Skull className="w-2.5 h-2.5 text-rose-400" />
                      DEAD 💀
                    </span>
                  )}
                  {isUnconscious && (
                    <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-600/50 font-bold px-1.5 py-0.5 rounded font-mono flex items-center gap-0.5">
                      UNCONSCIOUS 💤
                    </span>
                  )}
                  {char.isMonster && (
                    <span className="text-[9px] bg-red-950 text-red-300 border border-red-600/50 font-bold px-1.5 py-0.5 rounded font-mono flex items-center gap-0.5">
                      <Skull className="w-2.5 h-2.5 text-red-400" />
                      MONSTER
                    </span>
                  )}
                  {char.isVendor && (
                    <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-600/50 font-bold px-1.5 py-0.5 rounded font-mono flex items-center gap-0.5">
                      <Store className="w-2.5 h-2.5 text-cyan-400" />
                      MERCHANT
                    </span>
                  )}
                  {isActive && (
                    <span className="text-[9px] bg-amber-500 text-stone-950 font-bold px-1.5 py-0.5 rounded font-mono">
                      ACTIVE
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-stone-400 truncate">
                {char.race} • {char.characterClass || (isSR ? 'Runner' : 'Hero')} {char.level ? `Lvl ${char.level}` : ''}
              </p>
            </div>
          </div>

          {isSR && sr && (
            <div className="grid grid-cols-3 gap-2 bg-stone-900/90 p-2 rounded-xl text-center text-xs font-mono border border-stone-800">
              <div>
                <span className="text-[9px] text-stone-500 block uppercase">Nuyen</span>
                <span className="font-bold text-amber-300">¥{(sr.nuyen ?? 25000).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[9px] text-stone-500 block uppercase">Karma</span>
                <span className="font-bold text-cyan-300">{sr.karmaCurrent ?? 10}</span>
              </div>
              <div>
                <span className="text-[9px] text-stone-500 block uppercase">Essence</span>
                <span className="font-bold text-emerald-300">
                  {sr.cyberware ? (6.0 - sr.cyberware.reduce((acc, c) => acc + c.essenceCost, 0)).toFixed(2) : '6.00'}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-stone-800 text-xs">
            <HpOrb hpCurrent={char.hpCurrent} hpMax={getEffectiveMaxHp(char)} size="sm" showLabel={true} />

            <button
              disabled={isLockedForPlayer}
              onClick={(e) => {
                e.stopPropagation();
                if (isLockedForPlayer) {
                  alert(`🔒 ${char.name} is currently active by ${activeUserName}.`);
                  return;
                }
                onSelectCharacter(char.id);
                onEnterGame();
              }}
              className={`px-3 py-1 ${
                isLockedForPlayer
                  ? 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                  : isDead
                  ? 'bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-600/60 shadow-rose-950'
                  : systemTheme.primaryBtn
              } rounded-lg font-bold text-[11px] transition flex items-center gap-1 shadow`}
            >
              <span>{isLockedForPlayer ? 'Locked 🔒' : isDead ? 'Play (Dead 💀)' : (isSR ? 'Enter Matrix' : systemTheme.playBtnLabel)}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      );
    };

    const allFolders = [
      {
        key: 'characters',
        categoryType: 'character' as const,
        title: 'Player Characters',
        description: 'Main player adventurers, heroes, and runners',
        icon: <User className="w-4 h-4 text-amber-400" />,
        badgeStyle: 'bg-amber-950 text-amber-300 border-amber-600/40',
        chars: playerChars,
        createBtnText: 'Character'
      },
      {
        key: 'monsters',
        categoryType: 'monster' as const,
        title: 'Monsters & Encounter Creatures',
        description: 'Hostile creatures, bosses, and encounter statblocks',
        icon: <Skull className="w-4 h-4 text-red-400" />,
        badgeStyle: 'bg-red-950 text-red-300 border-red-600/40',
        chars: monsterChars,
        createBtnText: 'Monster'
      },
      {
        key: 'merchants',
        categoryType: 'vendor' as const,
        title: 'Merchants & Shopkeepers',
        description: 'NPC vendors, shopkeepers, and price markup trade NPCs',
        icon: <Store className="w-4 h-4 text-cyan-400" />,
        badgeStyle: 'bg-cyan-950 text-cyan-300 border-cyan-600/40',
        chars: merchantChars,
        createBtnText: 'Merchant'
      }
    ];

    const foldersConfig = allFolders;

    const activeFolders = activeFolderTab === 'all'
      ? foldersConfig
      : foldersConfig.filter(f => f.key === activeFolderTab);

    if (!currentUser) {
      return (
        <div className="bg-stone-900/90 border border-amber-500/30 rounded-3xl p-8 text-center space-y-6 max-w-2xl mx-auto shadow-2xl my-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-serif font-bold text-2xl text-amber-200">
              Adventurer Account Required
            </h3>
            <p className="text-stone-300 text-sm max-w-lg mx-auto leading-relaxed">
              No characters or data are accessible while logged out. Please sign in or enter Guest Mode to select, view, or create characters.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            {onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <UserCheck className="w-5 h-5" /> Sign In / Account & Roles
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Category / Folder Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-stone-950/80 p-2 rounded-2xl border border-stone-800">
          <span className="text-xs font-serif font-bold text-stone-400 px-2 flex items-center gap-1">
            <Folder className="w-3.5 h-3.5 text-amber-500" /> Folders:
          </span>
          <button
            onClick={() => setActiveFolderTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
              activeFolderTab === 'all'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            📁 All Folders ({systemChars.length})
          </button>
          <button
            onClick={() => setActiveFolderTab('characters')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
              activeFolderTab === 'characters'
                ? 'bg-amber-600 text-stone-950 shadow-md'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            🧙 Characters ({playerChars.length})
          </button>
          <button
            onClick={() => setActiveFolderTab('monsters')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
              activeFolderTab === 'monsters'
                ? 'bg-red-600 text-stone-950 shadow-md'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            👹 Monsters ({monsterChars.length})
          </button>
          <button
            onClick={() => setActiveFolderTab('merchants')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
              activeFolderTab === 'merchants'
                ? 'bg-cyan-600 text-stone-950 shadow-md'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            🏪 Merchants ({merchantChars.length})
          </button>
        </div>

        {/* Folder Sections */}
        {activeFolders.map(folder => {
          const isCollapsed = collapsedFolders[folder.key];

          return (
            <div key={folder.key} className="bg-stone-950/90 border border-stone-800 rounded-2xl p-4 space-y-4">
              {/* Folder Header */}
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => toggleFolderCollapse(folder.key)}
                >
                  <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 group-hover:border-amber-500/50 transition">
                    {folder.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-serif font-bold text-stone-200 text-base group-hover:text-amber-300 transition">
                        {folder.title}
                      </h4>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${folder.badgeStyle}`}>
                        {folder.chars.length} {folder.chars.length === 1 ? 'Entry' : 'Entries'}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 mt-0.5">{folder.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onCreateNewCharacter(folder.categoryType)}
                    className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-amber-300 border border-stone-700 hover:border-amber-500/60 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add {folder.createBtnText}</span>
                  </button>

                  <button
                    onClick={() => toggleFolderCollapse(folder.key)}
                    className="p-1.5 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded-xl border border-stone-800 transition"
                    title={isCollapsed ? 'Expand Folder' : 'Collapse Folder'}
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Folder Items Grid */}
              {!isCollapsed && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {folder.chars.map(char => renderCard(char))}

                  {/* Create New Card in Folder */}
                  <button
                    onClick={() => onCreateNewCharacter(folder.categoryType)}
                    className="p-5 rounded-2xl border border-dashed border-stone-800 hover:border-amber-500/70 bg-stone-950/40 hover:bg-stone-950 transition flex flex-col items-center justify-center text-center space-y-2 group min-h-[120px]"
                  >
                    <div className="p-2.5 bg-stone-900 rounded-full border border-stone-800 group-hover:border-amber-500/50 text-amber-400 group-hover:scale-110 transition">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="font-serif font-bold text-xs text-stone-300 group-hover:text-amber-200">
                      Create New {folder.createBtnText}
                    </span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-950 border border-stone-800 text-amber-400 text-xs font-mono font-bold">
              <Layers className="w-3.5 h-3.5" /> Tabletop RPG Vault & Multi-System Campaign Suite
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-100">
              Welcome to the TRPG Master Hub
            </h2>
            <p className="text-sm text-stone-400 leading-relaxed">
              Select your active Tabletop RPG System ruleset below. Seamlessly switch between D&D 5e, D&D 3.5e, Shadowrun, Pathfinder 2e, and Call of Cthulhu, complete with system-tailored mechanics, UI color themes, and automatic category folder sorting.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            {currentUser ? (
              <>
                <button
                  onClick={() => onCreateNewCharacter('character')}
                  className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Character</span>
                </button>

                <button
                  onClick={onEnterGame}
                  className="px-5 py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-2xl transition flex items-center justify-center gap-2 font-bold cursor-pointer"
                >
                  <span>Open Active Sheet</span>
                  <ChevronRight className="w-5 h-5 text-amber-400" />
                </button>
              </>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Lock className="w-5 h-5" />
                <span>Sign In / Enter Guest Mode</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* System Selector Cards */}
      <div className="space-y-4">
        <h3 className="font-serif font-bold text-xl text-stone-200 flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-500" /> Choose TRPG Ruleset & Active System
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* System Card 1: D&D 5e / 3.5e */}
          <button
            onClick={() => handleSelectSystemCard('dnd')}
            className={`p-5 rounded-2xl border text-left transition flex flex-col justify-between space-y-4 relative overflow-hidden ${
              selectedSystem === 'dnd'
                ? 'bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/50 shadow-xl'
                : 'bg-stone-900 border-stone-800 hover:border-stone-700 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                <Shield className="w-6 h-6" />
              </div>
              {activeSystem === 'dnd' ? (
                <span className="text-[10px] bg-amber-400 text-stone-950 font-mono font-bold px-2 py-0.5 rounded border border-amber-300 uppercase flex items-center gap-1 shadow">
                  <CheckCircle2 className="w-3 h-3" /> ACTIVE
                </span>
              ) : (
                <span className="text-[10px] bg-amber-950/80 text-amber-300 font-mono font-bold px-2 py-0.5 rounded border border-amber-500/30 uppercase">
                  Fantasy Theme
                </span>
              )}
            </div>

            <div>
              <h3 className="font-serif font-bold text-lg text-amber-200">Dungeons & Dragons</h3>
              <p className="text-xs text-stone-400 mt-1">
                Supports 5th Edition (5e) and 3.5 Edition (3.5e) with full stats, AC breakdown & spell slots.
              </p>
            </div>

            <div className="text-[11px] font-mono text-amber-400 flex items-center justify-between pt-2 border-t border-stone-800">
              <span>5e & 3.5e Rulesets</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* System Card 2: Shadowrun */}
          <button
            onClick={() => handleSelectSystemCard('shadowrun')}
            className={`p-5 rounded-2xl border text-left transition flex flex-col justify-between space-y-4 relative overflow-hidden ${
              selectedSystem === 'shadowrun'
                ? 'bg-cyan-950/60 border-cyan-500 ring-2 ring-cyan-500/50 shadow-xl'
                : 'bg-stone-900 border-stone-800 hover:border-stone-700 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
                <Cpu className="w-6 h-6" />
              </div>
              {activeSystem === 'shadowrun' ? (
                <span className="text-[10px] bg-cyan-400 text-stone-950 font-mono font-bold px-2 py-0.5 rounded border border-cyan-300 uppercase flex items-center gap-1 shadow">
                  <CheckCircle2 className="w-3 h-3" /> ACTIVE
                </span>
              ) : (
                <span className="text-[10px] bg-cyan-950/80 text-cyan-300 font-mono font-bold px-2 py-0.5 rounded border border-cyan-500/30 uppercase">
                  Cyber Theme
                </span>
              )}
            </div>

            <div>
              <h3 className="font-serif font-bold text-lg text-cyan-200">Shadowrun</h3>
              <p className="text-xs text-stone-400 mt-1">
                Futuristic cyberpunk RPG featuring cyberware, decking, rigging, and Matrix operations.
              </p>
            </div>

            <div className="text-[11px] font-mono text-cyan-400 flex items-center justify-between pt-2 border-t border-stone-800">
              <span>Cyberpunk System</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* System Card 3: Pathfinder 2e */}
          <button
            onClick={() => handleSelectSystemCard('pathfinder')}
            className={`p-5 rounded-2xl border text-left transition flex flex-col justify-between space-y-4 relative overflow-hidden ${
              selectedSystem === 'pathfinder'
                ? 'bg-purple-950/60 border-purple-500 ring-2 ring-purple-500/50 shadow-xl'
                : 'bg-stone-900 border-stone-800 hover:border-stone-700 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
                <BookOpen className="w-6 h-6" />
              </div>
              {activeSystem === 'pathfinder' ? (
                <span className="text-[10px] bg-purple-400 text-stone-950 font-mono font-bold px-2 py-0.5 rounded border border-purple-300 uppercase flex items-center gap-1 shadow">
                  <CheckCircle2 className="w-3 h-3" /> ACTIVE
                </span>
              ) : (
                <span className="text-[10px] bg-purple-950/80 text-purple-300 font-mono font-bold px-2 py-0.5 rounded border border-purple-500/30 uppercase">
                  Arcane Theme
                </span>
              )}
            </div>

            <div>
              <h3 className="font-serif font-bold text-lg text-purple-200">Pathfinder 2e</h3>
              <p className="text-xs text-stone-400 mt-1">
                Tactical fantasy RPG powered by a versatile 3-action economy and rich character customization.
              </p>
            </div>

            <div className="text-[11px] font-mono text-purple-400 flex items-center justify-between pt-2 border-t border-stone-800">
              <span>Fantasy System</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* System Card 4: Call of Cthulhu */}
          <button
            onClick={() => handleSelectSystemCard('cthulhu')}
            className={`p-5 rounded-2xl border text-left transition flex flex-col justify-between space-y-4 relative overflow-hidden ${
              selectedSystem === 'cthulhu'
                ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/50 shadow-xl'
                : 'bg-stone-900 border-stone-800 hover:border-stone-700 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                <Skull className="w-6 h-6" />
              </div>
              {activeSystem === 'cthulhu' ? (
                <span className="text-[10px] bg-emerald-400 text-stone-950 font-mono font-bold px-2 py-0.5 rounded border border-emerald-300 uppercase flex items-center gap-1 shadow">
                  <CheckCircle2 className="w-3 h-3" /> ACTIVE
                </span>
              ) : (
                <span className="text-[10px] bg-emerald-950/80 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/30 uppercase">
                  Horror Theme
                </span>
              )}
            </div>

            <div>
              <h3 className="font-serif font-bold text-lg text-emerald-200">Call of Cthulhu</h3>
              <p className="text-xs text-stone-400 mt-1">
                Investigation and horror RPG featuring sanity tracking, percentile (d100) skill checks, and eldritch mystery.
              </p>
            </div>

            <div className="text-[11px] font-mono text-emerald-400 flex items-center justify-between pt-2 border-t border-stone-800">
              <span>Horror System</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>

      {/* D&D Panel */}
      {selectedSystem === 'dnd' && (
        <div className="bg-stone-900 border border-theme-accent rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
            <div>
              <h3 className="text-xl font-serif font-bold text-theme-text flex items-center gap-2">
                <Shield className="w-5 h-5 text-theme-accent" /> Dungeons & Dragons Roster
              </h3>
              <p className="text-xs text-stone-400">
                Switch between 5e and 3.5e ruleset editions below to change rule mechanics & color theme.
              </p>
            </div>

            {/* Edition Toggle */}
            <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
              <button
                onClick={() => handleSelectEdition('5e')}
                className={`px-4 py-1.5 rounded-lg text-xs font-serif font-bold transition ${
                  selectedEdition === '5e'
                    ? 'bg-theme-accent text-stone-950 shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                D&D 5th Edition (5e)
              </button>
              <button
                onClick={() => handleSelectEdition('3.5e')}
                className={`px-4 py-1.5 rounded-lg text-xs font-serif font-bold transition ${
                  selectedEdition === '3.5e'
                    ? 'bg-theme-accent text-stone-950 shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                D&D 3.5 Edition (3.5e)
              </button>
            </div>
          </div>

          {renderFolderSystemView(
            characters.filter(c => (c.edition || '5e') === selectedEdition),
            {
              accentBorder: 'border-amber-500',
              accentBg: 'bg-amber-950/40',
              accentText: 'text-amber-300',
              primaryBtn: 'bg-stone-800 hover:bg-amber-600 hover:text-stone-950 text-stone-200',
              playBtnLabel: 'Play'
            }
          )}
        </div>
      )}

      {/* Shadowrun Panel */}
      {selectedSystem === 'shadowrun' && (
        <div className="bg-stone-900 border border-cyan-500/60 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
            <div>
              <h3 className="text-xl font-serif font-bold text-cyan-200 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" /> Shadowrun Roster
              </h3>
              <p className="text-xs text-stone-400">
                Cyberware, Decking, Rigging, Matrix Overwatch, and Street Samurais.
              </p>
            </div>
          </div>

          {renderFolderSystemView(
            characters.filter(c => c.edition === 'shadowrun'),
            {
              accentBorder: 'border-cyan-400',
              accentBg: 'bg-cyan-950/50',
              accentText: 'text-cyan-300',
              primaryBtn: 'bg-cyan-600 hover:bg-cyan-500 text-stone-950',
              playBtnLabel: 'Enter Matrix'
            }
          )}
        </div>
      )}

      {/* Pathfinder 2e Panel */}
      {selectedSystem === 'pathfinder' && (
        <div className="bg-stone-900 border border-purple-500/60 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
            <div>
              <h3 className="text-xl font-serif font-bold text-purple-200 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-400" /> Pathfinder 2e Roster
              </h3>
              <p className="text-xs text-stone-400">
                3-Action Tactical Combat System, Feat Trees, and Royal Amethyst Theme.
              </p>
            </div>
          </div>

          {renderFolderSystemView(
            characters.filter(c => c.edition === 'pathfinder'),
            {
              accentBorder: 'border-purple-400',
              accentBg: 'bg-purple-950/50',
              accentText: 'text-purple-300',
              primaryBtn: 'bg-purple-600 hover:bg-purple-500 text-stone-950',
              playBtnLabel: 'Play'
            }
          )}
        </div>
      )}

      {/* Call of Cthulhu Panel */}
      {selectedSystem === 'cthulhu' && (
        <div className="bg-stone-900 border border-emerald-500/60 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
            <div>
              <h3 className="text-xl font-serif font-bold text-emerald-200 flex items-center gap-2">
                <Skull className="w-5 h-5 text-emerald-400" /> Call of Cthulhu Roster
              </h3>
              <p className="text-xs text-stone-400">
                Sanity Tracking, Eldritch Horrors, d100 Skill Percentiles.
              </p>
            </div>
          </div>

          {renderFolderSystemView(
            characters.filter(c => c.edition === 'cthulhu'),
            {
              accentBorder: 'border-emerald-400',
              accentBg: 'bg-emerald-950/50',
              accentText: 'text-emerald-300',
              primaryBtn: 'bg-emerald-600 hover:bg-emerald-500 text-stone-950',
              playBtnLabel: 'Investigate'
            }
          )}
        </div>
      )}
    </div>
  );
};
