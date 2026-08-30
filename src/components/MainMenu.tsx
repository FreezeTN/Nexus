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
  UserCheck,
  SlidersHorizontal,
  Bot,
  Sparkles,
  Search,
  X,
  Compass,
  LayoutGrid,
  Zap,
  Sliders
} from 'lucide-react';
import { HpOrb } from './HpOrb';
import { UserProfile, CharacterPresence } from '../lib/firebase';
import { useLanguage } from '../i18n/LanguageContext';
import { useUiMode } from '../context/UiModeContext';
import { FirstUseLauncher } from './common/FirstUseLauncher';

interface MainMenuProps {
  characters: CharacterData[];
  activeCharacter?: CharacterData | null;
  onSelectCharacter: (id: string) => void;
  onCreateNewCharacter: (category?: 'character' | 'monster' | 'vendor') => void;
  onEnterGame: () => void;
  onSystemChange?: (system: RuleEdition) => void;
  edition?: RuleEdition;
  currentUser?: UserProfile | null;
  presenceMap?: Record<string, CharacterPresence>;
  onOpenAuthModal?: () => void;
  enabledSystems?: RuleEdition[];
  onOpenSystemSelector?: () => void;
  onOpenAudioModal?: () => void;
  onOpenAiAssistant?: () => void;
  onOpenSessionLobby?: () => void;
  onOpenCampaignGraph?: () => void;
  onExploreCompendium?: () => void;
  onOpenDeveloperSdk?: () => void;
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
  onOpenAuthModal,
  enabledSystems = ['5e', '3.5e', 'shadowrun', 'pathfinder', 'cthulhu'],
  onOpenSystemSelector,
  onOpenAudioModal,
  onOpenAiAssistant,
  onOpenSessionLobby,
  onOpenCampaignGraph,
  onExploreCompendium,
  onOpenDeveloperSdk
}) => {
  const { t } = useLanguage();
  const {
    workspaceRole,
    setWorkspaceRole,
    complexityLevel,
    setComplexityLevel,
    isStreamlined,
    showFirstUseLauncher,
    setShowFirstUseLauncher
  } = useUiMode();
  const currentEdition = edition || activeCharacter?.edition || '5e';
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
  const [folderSearchQueries, setFolderSearchQueries] = React.useState<Record<string, string>>({});

  const handleFolderSearchChange = (folderKey: string, query: string) => {
    setFolderSearchQueries(prev => ({ ...prev, [folderKey]: query }));
  };

  React.useEffect(() => {
    let ed = currentEdition;
    if (enabledSystems && enabledSystems.length > 0 && !enabledSystems.includes(ed)) {
      ed = enabledSystems[0];
    }
    if (activeSystem === 'dnd' && !enabledSystems.includes('5e') && enabledSystems.includes('3.5e')) {
      ed = '3.5e';
    }
    setSelectedEdition(ed);
    const sys = ed === 'shadowrun' ? 'shadowrun' : ed === 'pathfinder' ? 'pathfinder' : ed === 'cthulhu' ? 'cthulhu' : 'dnd';
    setSelectedSystem(sys);
  }, [activeCharacter?.id, currentEdition, activeSystem, enabledSystems]);

  const toggleFolderCollapse = (folderKey: string) => {
    setCollapsedFolders(prev => ({ ...prev, [folderKey]: !prev[folderKey] }));
  };

  const handleSelectSystemCard = (sys: 'dnd' | 'shadowrun' | 'pathfinder' | 'cthulhu') => {
    setSelectedSystem(sys);
    let targetEdition: RuleEdition = '5e';
    if (sys === 'shadowrun') targetEdition = 'shadowrun';
    else if (sys === 'pathfinder') targetEdition = 'pathfinder';
    else if (sys === 'cthulhu') targetEdition = 'cthulhu';
    else {
      if (!enabledSystems.includes('5e') && enabledSystems.includes('3.5e')) {
        targetEdition = '3.5e';
      } else if (selectedEdition === '3.5e' && enabledSystems.includes('3.5e')) {
        targetEdition = '3.5e';
      } else {
        targetEdition = '5e';
      }
    }

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
      const isActive = activeCharacter ? char.id === activeCharacter.id : false;
      const sr = char.shadowrun;
      const isSR = char.edition === 'shadowrun';
      const displayPortrait = char.portraitUrl || (char.isMonster ? getMonsterPortraitUrl(char.name, char.id) : undefined);
      const isDead = isCharacterDead(char);
      const isUnconscious = !isDead && (char.hpCurrent !== undefined && char.hpCurrent <= 0);

      const presence = presenceMap[char.id];
      const activeUserId = presence?.activeUserId;
      const activeUserName = presence?.activeUserName || 'Player';
      const activeUserRole = presence?.activeUserRole;
      const dmUserId = presence?.dmUserId;

      // Character is locked ONLY when another PLAYER (not a DM) is active on it
      const isLockedForPlayer = isPlayerRole && 
        !!activeUserId && 
        activeUserId !== 'guest_player' &&
        activeUserId !== currentUserId && 
        activeUserId !== dmUserId && 
        activeUserRole !== 'DM';
      const isDmActiveOnChar = !!presence?.dmActive && char.id !== activeCharacter?.id;
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
                {char.race} • {char.isMonster ? `${char.characterClass || 'Monster'} (CR ${char.challengeRating || (char.subclass ? char.subclass.replace(/^CR\s*/i, '') : char.level || '1')})` : `${char.characterClass || (isSR ? 'Runner' : 'Hero')} ${char.level ? `Lvl ${char.level}` : ''}`}
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
        title: t('mainMenu.playerCharacters', 'Player Characters'),
        description: t('mainMenu.playerCharactersSub', 'Main player adventurers, heroes, and runners'),
        icon: <User className="w-4 h-4 text-amber-400" />,
        badgeStyle: 'bg-amber-950 text-amber-300 border-amber-600/40',
        chars: playerChars,
        createBtnText: t('common.character', 'Character')
      },
      {
        key: 'monsters',
        categoryType: 'monster' as const,
        title: t('mainMenu.monsters', 'Monsters & Encounter Creatures'),
        description: t('mainMenu.monstersSub', 'Hostile creatures, bosses, and encounter statblocks'),
        icon: <Skull className="w-4 h-4 text-red-400" />,
        badgeStyle: 'bg-red-950 text-red-300 border-red-600/40',
        chars: monsterChars,
        createBtnText: t('common.monster', 'Monster')
      },
      {
        key: 'merchants',
        categoryType: 'vendor' as const,
        title: t('mainMenu.merchants', 'Merchants & Shopkeepers'),
        description: t('mainMenu.merchantsSub', 'NPC vendors, shopkeepers, and price markup trade NPCs'),
        icon: <Store className="w-4 h-4 text-cyan-400" />,
        badgeStyle: 'bg-cyan-950 text-cyan-300 border-cyan-600/40',
        chars: merchantChars,
        createBtnText: t('common.merchant', 'Merchant')
      }
    ];

    const foldersConfig = isPlayerRole
      ? allFolders.filter(f => f.key === 'characters')
      : allFolders;

    const activeFolders = (activeFolderTab === 'all' || (isPlayerRole && (activeFolderTab === 'monsters' || activeFolderTab === 'merchants')))
      ? foldersConfig
      : foldersConfig.filter(f => f.key === activeFolderTab);

    return (
      <div className="space-y-6">
        {!currentUser && (
          <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-amber-200 text-sm">{t('mainMenu.guestMode', 'Guest Adventurer Mode')}</h4>
                <p className="text-stone-300 text-xs">{t('mainMenu.guestModeSub', 'Playing locally. Sign in to sync your characters across devices & access DM multiplayer sessions.')}</p>
              </div>
            </div>
            {onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shrink-0 shadow cursor-pointer"
              >
                <UserCheck className="w-4 h-4" /> {t('mainMenu.signInAccount', 'Sign In / Account')}
              </button>
            )}
          </div>
        )}

        {/* Category / Folder Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-stone-950/80 p-2 rounded-2xl border border-stone-800">
          <span className="text-xs font-serif font-bold text-stone-400 px-2 flex items-center gap-1">
            <Folder className="w-3.5 h-3.5 text-amber-500" /> {t('mainMenu.folders', 'Folders')}:
          </span>
          <button
            onClick={() => setActiveFolderTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
              activeFolderTab === 'all'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            📁 {t('mainMenu.allFolders', 'All Folders')} ({isPlayerRole ? playerChars.length : systemChars.length})
          </button>
          <button
            onClick={() => setActiveFolderTab('characters')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
              activeFolderTab === 'characters'
                ? 'bg-amber-600 text-stone-950 shadow-md'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            🧙 {t('mainMenu.characters', 'Characters')} ({playerChars.length})
          </button>
          {!isPlayerRole && (
            <>
              <button
                onClick={() => setActiveFolderTab('monsters')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  activeFolderTab === 'monsters'
                    ? 'bg-red-600 text-stone-950 shadow-md'
                    : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
                }`}
              >
                👹 {t('mainMenu.monstersFolder', 'Monsters')} ({monsterChars.length})
              </button>
              <button
                onClick={() => setActiveFolderTab('merchants')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  activeFolderTab === 'merchants'
                    ? 'bg-cyan-600 text-stone-950 shadow-md'
                    : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
                }`}
              >
                🏪 {t('mainMenu.merchantsFolder', 'Merchants')} ({merchantChars.length})
              </button>
            </>
          )}
        </div>

        {/* Folder Sections */}
        {activeFolders.map(folder => {
          const isCollapsed = collapsedFolders[folder.key];
          const query = (folderSearchQueries[folder.key] || '').trim().toLowerCase();

          const filteredChars = query
            ? folder.chars.filter(char => {
                const name = (char.name || '').toLowerCase();
                const race = (char.race || '').toLowerCase();
                const cls = (char.characterClass || '').toLowerCase();
                const sub = (char.subclass || '').toLowerCase();
                const cr = (char.challengeRating || '').toLowerCase();
                const align = (char.alignment || '').toLowerCase();
                const bg = (char.background || '').toLowerCase();

                if (
                  name.includes(query) ||
                  race.includes(query) ||
                  cls.includes(query) ||
                  sub.includes(query) ||
                  cr.includes(query) ||
                  align.includes(query) ||
                  bg.includes(query)
                ) {
                  return true;
                }

                const crClean = cr ? `cr ${cr}`.trim().toLowerCase() : '';
                const crNoSpace = cr ? `cr${cr}`.trim().toLowerCase() : '';
                if (crClean.includes(query) || crNoSpace.includes(query)) {
                  return true;
                }

                if (char.attacks?.some(a => a.name?.toLowerCase().includes(query) || a.damageType?.toLowerCase().includes(query))) {
                  return true;
                }

                if (char.feats?.some(f => f.name?.toLowerCase().includes(query) || f.description?.toLowerCase().includes(query))) {
                  return true;
                }

                if (char.spells?.some(s => s.name?.toLowerCase().includes(query) || s.school?.toLowerCase().includes(query))) {
                  return true;
                }

                return false;
              })
            : folder.chars;

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
                        {query
                          ? `${filteredChars.length} of ${folder.chars.length} Entries`
                          : `${folder.chars.length} ${folder.chars.length === 1 ? 'Entry' : 'Entries'}`}
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

              {/* Search Bar for Folder when expanded */}
              {!isCollapsed && (
                <div className="flex items-center gap-2 pt-0.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={folderSearchQueries[folder.key] || ''}
                      onChange={(e) => handleFolderSearchChange(folder.key, e.target.value)}
                      placeholder={
                        folder.key === 'monsters'
                          ? 'Search monsters by name, type, or CR (e.g. Dragon, CR 19, Fiend, HP)...'
                          : folder.key === 'merchants'
                          ? 'Search merchants by name, shop type, or race...'
                          : 'Search characters by name, class, or race...'
                      }
                      className="w-full pl-9 pr-8 py-2 bg-stone-900/90 border border-stone-800 focus:border-amber-500/60 rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40 transition font-sans"
                    />
                    {folderSearchQueries[folder.key] && (
                      <button
                        onClick={() => handleFolderSearchChange(folder.key, '')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-500 hover:text-stone-300 transition rounded-md"
                        title="Clear Search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {folderSearchQueries[folder.key] && (
                    <div className="text-[11px] font-mono text-stone-400 shrink-0 bg-stone-900 border border-stone-800 px-2.5 py-1.5 rounded-xl">
                      <strong className="text-amber-400">{filteredChars.length}</strong> of {folder.chars.length}
                    </div>
                  )}
                </div>
              )}

              {/* Folder Items Grid */}
              {!isCollapsed && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredChars.map(char => renderCard(char))}

                  {/* Empty state when search returns 0 matches */}
                  {query && filteredChars.length === 0 && (
                    <div className="col-span-full py-8 text-center bg-stone-900/40 border border-dashed border-stone-800 rounded-2xl space-y-2">
                      <p className="text-xs text-stone-400 font-sans">
                        No {folder.title.toLowerCase()} matching "<span className="text-amber-300 font-bold">{folderSearchQueries[folder.key]}</span>"
                      </p>
                      <button
                        onClick={() => handleFolderSearchChange(folder.key, '')}
                        className="text-xs text-amber-400 hover:text-amber-300 font-mono font-bold underline cursor-pointer"
                      >
                        Clear Search
                      </button>
                    </div>
                  )}

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
      {/* First-Use Intent Launcher / Welcome Hub (Phase A) */}
      {showFirstUseLauncher ? (
        <FirstUseLauncher
          onJoinCampaign={onOpenSessionLobby}
          onCreateCharacter={() => onCreateNewCharacter('character')}
          onStartCampaignGm={onOpenCampaignGraph || onEnterGame}
          onExploreCompendium={onExploreCompendium}
          onOpenAiAssistant={onOpenAiAssistant}
          onSelectSystem={onOpenSystemSelector}
          onClose={() => setShowFirstUseLauncher(false)}
        />
      ) : (
        /* Minimized Fast Intent Launcher Bar */
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-stone-900/60 border border-stone-800 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-serif font-bold text-stone-200 block">
                Quick Tabletop Launchpad
              </span>
              <span className="text-[11px] text-stone-400">
                Active Workspace: <strong className="text-amber-300 capitalize">{workspaceRole}</strong> | Mode: <strong className="text-cyan-300 capitalize">{complexityLevel}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowFirstUseLauncher(true)}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Open Welcome Hub</span>
            </button>
          </div>
        </div>
      )}

      {/* System Selector Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h3 className="font-serif font-bold text-xl text-stone-200 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-500" /> Choose TRPG Ruleset & Active System
          </h3>
          <div className="flex items-center gap-2">
            {onOpenAiAssistant && (
              <button
                type="button"
                onClick={onOpenAiAssistant}
                className="text-xs text-purple-300 hover:text-purple-100 font-bold flex items-center gap-1.5 bg-purple-950/70 border border-purple-500/60 hover:border-purple-400 px-3 py-1.5 rounded-xl transition cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Nexus Oracle</span>
              </button>
            )}
            {onOpenSystemSelector && (
              <button
                type="button"
                onClick={onOpenSystemSelector}
                className="text-xs text-amber-400 hover:text-amber-300 font-mono font-bold flex items-center gap-1.5 bg-stone-900 border border-stone-800 hover:border-amber-500/40 px-3 py-1.5 rounded-xl transition cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Change Active Systems ({enabledSystems.length}/5)</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* System Card 1: D&D 5e */}
          {enabledSystems.includes('5e') && (
            <button
              type="button"
              onClick={() => handleSelectEdition('5e')}
              className={`p-5 rounded-2xl border text-left transition flex flex-col justify-between space-y-4 relative overflow-hidden ${
                selectedSystem === 'dnd' && selectedEdition === '5e'
                  ? 'bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/50 shadow-xl'
                  : 'bg-stone-900 border-stone-800 hover:border-stone-700 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-xl border bg-amber-500/10 border-amber-500/30 text-amber-400">
                  <Shield className="w-6 h-6" />
                </div>
                {activeSystem === 'dnd' && currentEdition === '5e' ? (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase flex items-center gap-1 shadow bg-amber-400 text-stone-950 border-amber-300">
                    <CheckCircle2 className="w-3 h-3" /> ACTIVE
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase bg-amber-950/80 text-amber-300 border-amber-500/30">
                    Fantasy Theme
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-serif font-bold text-lg text-amber-200">
                  D&D 5th Edition
                </h3>
                <p className="text-xs text-stone-400 mt-1">
                  Modern 5e ruleset with proficiency scaling, Advantage/Disadvantage, and spell slots.
                </p>
              </div>

              <div className="text-[11px] font-mono flex items-center justify-between pt-2 border-t border-stone-800 text-amber-400">
                <span>5e Ruleset</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          )}

          {/* System Card 2: D&D 3.5e */}
          {enabledSystems.includes('3.5e') && (
            <button
              type="button"
              onClick={() => handleSelectEdition('3.5e')}
              className={`p-5 rounded-2xl border text-left transition flex flex-col justify-between space-y-4 relative overflow-hidden ${
                selectedSystem === 'dnd' && selectedEdition === '3.5e'
                  ? 'bg-rose-950/60 border-rose-500 ring-2 ring-rose-500/50 shadow-xl'
                  : 'bg-stone-900 border-stone-800 hover:border-stone-700 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-xl border bg-rose-500/10 border-rose-500/30 text-rose-400">
                  <Shield className="w-6 h-6" />
                </div>
                {activeSystem === 'dnd' && currentEdition === '3.5e' ? (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase flex items-center gap-1 shadow bg-rose-500 text-stone-950 border-rose-300">
                    <CheckCircle2 className="w-3 h-3" /> ACTIVE
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase bg-rose-950/80 text-rose-300 border-rose-500/30">
                    Classic d20 Theme
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-serif font-bold text-lg text-rose-200">
                  D&D 3.5 Edition
                </h3>
                <p className="text-xs text-stone-400 mt-1">
                  Classic 3.5e d20 ruleset with Fortitude/Reflex/Will saves, skill points & tactical combat stats.
                </p>
              </div>

              <div className="text-[11px] font-mono flex items-center justify-between pt-2 border-t border-stone-800 text-rose-400">
                <span>3.5e Ruleset</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          )}

          {/* System Card 2: Shadowrun */}
          {enabledSystems.includes('shadowrun') && (
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
          )}

          {/* System Card 3: Pathfinder 2e */}
          {enabledSystems.includes('pathfinder') && (
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
          )}

          {/* System Card 4: Call of Cthulhu */}
          {enabledSystems.includes('cthulhu') && (
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
        )}
      </div>
    </div>

      {/* D&D Panel */}
      {selectedSystem === 'dnd' && (
        <div className={`bg-stone-900 border rounded-3xl p-6 shadow-xl space-y-6 ${
          selectedEdition === '3.5e' ? 'border-rose-500/60' : 'border-amber-500/60'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
            <div>
              <h3 className={`text-xl font-serif font-bold flex items-center gap-2 ${
                selectedEdition === '3.5e' ? 'text-rose-200' : 'text-amber-200'
              }`}>
                <Shield className={`w-5 h-5 ${selectedEdition === '3.5e' ? 'text-rose-400' : 'text-amber-400'}`} />
                {selectedEdition === '3.5e' ? 'Dungeons & Dragons 3.5e Roster' : 'Dungeons & Dragons 5e Roster'}
              </h3>
              <p className="text-xs text-stone-400">
                {enabledSystems.includes('5e') && enabledSystems.includes('3.5e')
                  ? 'Switch between 5e and 3.5e ruleset editions below to change rule mechanics & color theme.'
                  : selectedEdition === '3.5e'
                  ? 'Classic 3.5 Edition d20 ruleset with Fortitude/Reflex/Will saves, skill points & tactical combat stats.'
                  : 'Modern 5th Edition d20 ruleset with proficiency scaling and spell slots.'}
              </p>
            </div>

            {/* Edition Toggle */}
            <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
              {enabledSystems.includes('5e') && (
                <button
                  onClick={() => handleSelectEdition('5e')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-serif font-bold transition ${
                    selectedEdition === '5e'
                      ? 'bg-amber-500 text-stone-950 shadow-md'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  D&D 5th Edition (5e)
                </button>
              )}
              {enabledSystems.includes('3.5e') && (
                <button
                  onClick={() => handleSelectEdition('3.5e')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-serif font-bold transition ${
                    selectedEdition === '3.5e'
                      ? 'bg-rose-500 text-stone-950 shadow-md'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  D&D 3.5 Edition (3.5e)
                </button>
              )}
            </div>
          </div>

          {renderFolderSystemView(
            characters.filter(c => (c.edition || '5e') === selectedEdition),
            selectedEdition === '3.5e'
              ? {
                  accentBorder: 'border-rose-500',
                  accentBg: 'bg-rose-950/40',
                  accentText: 'text-rose-300',
                  primaryBtn: 'bg-stone-800 hover:bg-rose-600 hover:text-stone-950 text-stone-200',
                  playBtnLabel: 'Play'
                }
              : {
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
