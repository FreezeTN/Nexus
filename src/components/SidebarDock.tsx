import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  Library,
  Undo2,
  Redo2,
  Command,
  Network,
  Layers,
  Users,
  Radio,
  Settings,
  Laptop,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Bot,
  Dices,
  Compass,
  MapPin,
  Zap,
  Crown
} from 'lucide-react';
import { TabId } from './Navigation';
import { UserProfile, GameSession } from '../lib/firebase';
import { isSoundEnabled } from '../utils/diceAudio';
import { InstallAppModal } from './modals/InstallAppModal';
import { useLanguage } from '../i18n/LanguageContext';
import { useUiMode } from '../context/UiModeContext';

interface SidebarDockProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  edition?: string;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onOpenCommandPalette?: () => void;
  onOpenCampaignGraph?: () => void;
  onOpenAiAssistant?: () => void;
  onOpenExtensionManager?: () => void;
  onOpenSessionLobby?: () => void;
  onOpenVoiceModal?: () => void;
  onOpenAudioModal?: () => void;
  onOpenCopilot?: () => void;
  onOpenCampaignLoreVault?: (tab?: any) => void;
  currentUser?: UserProfile | null;
  activeSession?: GameSession | null;
  isPhysicalDiceMode?: boolean;
  onTogglePhysicalDiceMode?: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const SidebarDock: React.FC<SidebarDockProps> = ({
  activeTab,
  onTabChange,
  edition,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onOpenCommandPalette,
  onOpenCampaignGraph,
  onOpenAiAssistant,
  onOpenExtensionManager,
  onOpenSessionLobby,
  onOpenVoiceModal,
  onOpenAudioModal,
  onOpenCopilot,
  onOpenCampaignLoreVault,
  currentUser,
  activeSession,
  isPhysicalDiceMode = false,
  onTogglePhysicalDiceMode
}) => {
  const { t } = useLanguage();
  const { uiMode, toggleUiMode, isTableMode, toggleTableMode, workspaceRole, setWorkspaceRole } = useUiMode();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('penpaper_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('penpaper_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      setIsStandalone(Boolean(isStandaloneMode));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    checkStandalone();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleTriggerInstallPrompt = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const handleTriggerInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setDeferredPrompt(null);
          return;
        }
      } catch (e) {
        console.warn('Native prompt error, opening install modal:', e);
      }
    }
    setShowInstallModal(true);
  };

  const isHubActive = activeTab === 'menu';
  const isGuideActive = activeTab === 'sheet6';
  const isCompendiumActive = activeTab === 'sheet7';

  const isShadowrun = edition === 'shadowrun';
  const isPathfinder = edition === 'pathfinder';
  const isCthulhu = edition === 'cthulhu';

  const guideTitle = isShadowrun
    ? 'Shadowrun Guide'
    : isPathfinder
    ? 'Pathfinder Guide'
    : isCthulhu
    ? 'Cthulhu Guide'
    : t('nav.userGuide', 'User Guide');

  const guideSubtext = isShadowrun
    ? 'Shadowrun 5e Rules'
    : isPathfinder
    ? 'Pathfinder 2e SRD'
    : isCthulhu
    ? 'Call of Cthulhu 7e'
    : t('nav.userGuideSub', 'Manual & System Reference');

  const displayCampaignName = activeSession?.name
    ? activeSession.name.replace(/\s*-\s*Checkpoint.*$/i, '').replace(/\s+Checkpoint.*$/i, '').trim() || activeSession.name
    : 'Session Lobby';

  // COLLAPSED / PHASED OUT MODE
  if (isCollapsed) {
    return (
      <>
        <aside className="w-full lg:w-16 shrink-0 select-none transition-all duration-300 ease-in-out">
          <div className="bg-stone-950/90 border border-stone-800/90 backdrop-blur-md rounded-2xl shadow-2xl p-2 flex flex-col items-center space-y-2">
            {/* Phase In / Expand Toggle Button */}
            <button
              onClick={toggleCollapse}
              className="w-full py-2 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 transition cursor-pointer shadow-sm group flex items-center justify-center gap-2"
              title={`${t('nav.phaseIn', 'Phase In Menu')} / Expand`}
            >
              <PanelLeftOpen className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="lg:hidden text-xs font-bold font-serif">{t('nav.phaseIn', 'Phase In Menu')}</span>
            </button>

            {/* Group 1: Core Play & Rules */}
            <div className="w-full h-px bg-stone-800/80 my-0.5" />
            <div className="flex flex-row lg:flex-col items-center justify-center gap-1.5 w-full flex-wrap">
              {/* Hub Icon */}
              <button
                onClick={() => onTabChange('menu')}
                className={`p-2 rounded-xl border transition-all cursor-pointer group ${
                  isHubActive
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                    : 'bg-stone-900/80 hover:bg-stone-800 border-stone-800 text-stone-400 hover:text-amber-300'
                }`}
                title={`${t('nav.hub', 'Hub')} (${t('nav.hubSub', 'Systems & Roster')})`}
              >
                <Sparkles className="w-4 h-4" />
              </button>

              {/* GM Overview Icon in Collapsed View */}
              {workspaceRole === 'gm' && (
                <button
                  onClick={() => onTabChange('sheetDm')}
                  className={`p-2 rounded-xl border transition-all cursor-pointer group ${
                    activeTab === 'sheetDm'
                      ? 'bg-purple-950 border-purple-500 text-purple-200 shadow-md ring-1 ring-purple-400/50'
                      : 'bg-purple-950/40 hover:bg-purple-900/70 border-purple-900/60 text-purple-300 hover:text-purple-100'
                  }`}
                  title="DM Overview & Party Live Monitor"
                >
                  <Crown className="w-4 h-4 text-purple-400" />
                </button>
              )}

              {/* User Guide Icon */}
              <button
                onClick={() => onTabChange('sheet6')}
                className={`p-2 rounded-xl border transition-all cursor-pointer group ${
                  isGuideActive
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                    : 'bg-stone-900/80 hover:bg-stone-800 border-stone-800 text-stone-400 hover:text-amber-300'
                }`}
                title={guideTitle}
              >
                <BookOpen className="w-4 h-4" />
              </button>

              {/* Compendium Icon */}
              <button
                onClick={() => onTabChange('sheet7')}
                className={`p-2 rounded-xl border transition-all cursor-pointer group ${
                  isCompendiumActive
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                    : 'bg-stone-900/80 hover:bg-stone-800 border-stone-800 text-stone-400 hover:text-amber-300'
                }`}
                title={`${t('nav.compendium', 'Compendium')} (${t('nav.compendiumSub', 'Monsters, Spells & Items')})`}
              >
                <Library className="w-4 h-4" />
              </button>
            </div>

            {/* Group 2: AI & World */}
            <div className="w-full h-px bg-stone-800/80 my-0.5" />
            <div className="flex flex-row lg:flex-col items-center justify-center gap-1.5 w-full flex-wrap">
              {/* AI Assistant Oracle & Entity Forge */}
              {onOpenAiAssistant && (
                <button
                  onClick={onOpenAiAssistant}
                  className="p-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/60 text-purple-200 shadow-md shadow-purple-950/40 transition cursor-pointer"
                  title={t('nav.aiOracle', 'Nexus Oracle')}
                >
                  <Bot className="w-4 h-4 text-purple-300" />
                </button>
              )}

              {/* Live Session Co-Pilot HUD */}
              {onOpenCopilot && (
                <button
                  onClick={onOpenCopilot}
                  className="p-2 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-500/60 text-amber-300 shadow-md shadow-amber-950/40 transition cursor-pointer animate-pulse"
                  title="Live Session Co-Pilot HUD"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </button>
              )}

              {/* Campaign World Atlas & Lore Vault */}
              {onOpenCampaignLoreVault && (
                <button
                  onClick={() => onOpenCampaignLoreVault('atlas')}
                  className="p-2 rounded-xl bg-amber-950/90 hover:bg-amber-900 border border-amber-500/80 text-amber-300 shadow-md shadow-amber-950/50 transition cursor-pointer"
                  title="Campaign World Atlas & Questline Hub (Ctrl+M)"
                >
                  <Compass className="w-4 h-4 text-amber-400" />
                </button>
              )}

              {/* Campaign Graph */}
              {activeSession && onOpenCampaignGraph && (
                <button
                  onClick={onOpenCampaignGraph}
                  className="p-2 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-amber-400 transition cursor-pointer"
                  title={t('nav.campaignGraph', 'Campaign Graph')}
                >
                  <Network className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Group 3: Multiplayer & Table */}
            <div className="w-full h-px bg-stone-800/80 my-0.5" />
            <div className="flex flex-row lg:flex-col items-center justify-center gap-1.5 w-full flex-wrap">
              {/* Session Lobby */}
              {currentUser && onOpenSessionLobby && (
                <button
                  onClick={onOpenSessionLobby}
                  className={`p-2 rounded-xl border transition cursor-pointer ${
                    activeSession
                      ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-300 animate-pulse'
                      : 'bg-stone-900/80 hover:bg-stone-800 border-stone-800 text-amber-400'
                  }`}
                  title={activeSession ? `Campaign Session: ${displayCampaignName}` : 'Multiplayer Session Lobby'}
                >
                  <Users className="w-4 h-4" />
                </button>
              )}

              {/* Party Voice */}
              {onOpenVoiceModal && (
                <button
                  onClick={onOpenVoiceModal}
                  className="p-2 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-emerald-400 transition cursor-pointer"
                  title={t('nav.partyVoice', 'Party Voice')}
                >
                  <Radio className="w-4 h-4 animate-pulse" />
                </button>
              )}
            </div>

            {/* Group 4: Developer & Plugins */}
            {onOpenExtensionManager && (
              <>
                <div className="w-full h-px bg-stone-800/80 my-0.5" />
                <div className="flex flex-row lg:flex-col items-center justify-center gap-1.5 w-full flex-wrap">
                  <button
                    onClick={onOpenExtensionManager}
                    className="p-2 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-indigo-400 transition cursor-pointer"
                    title={t('nav.sdkPlugins', 'SDK / Plugins')}
                  >
                    <Layers className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            {/* Group 5: Settings & Preferences */}
            <div className="w-full h-px bg-stone-800/80 my-0.5" />
            <div className="flex flex-row lg:flex-col items-center justify-center gap-1.5 w-full flex-wrap">
              {/* Undo */}
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className={`p-2 rounded-xl border text-xs transition ${
                  canUndo
                    ? 'bg-stone-900 hover:bg-stone-800 text-amber-300 border-stone-800 hover:border-amber-600/40 cursor-pointer'
                    : 'bg-stone-900/40 text-stone-600 border-transparent cursor-not-allowed opacity-40'
                }`}
                title={`${t('nav.undo', 'Undo')} (Ctrl+Z)`}
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>

              {/* Redo */}
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className={`p-2 rounded-xl border text-xs transition ${
                  canRedo
                    ? 'bg-stone-900 hover:bg-stone-800 text-amber-300 border-stone-800 hover:border-amber-600/40 cursor-pointer'
                    : 'bg-stone-900/40 text-stone-600 border-transparent cursor-not-allowed opacity-40'
                }`}
                title={`${t('nav.redo', 'Redo')} (Ctrl+Y)`}
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>

              {/* Focus / Master Toggle */}
              <button
                type="button"
                onClick={toggleUiMode}
                className={`p-2 rounded-xl border text-xs transition cursor-pointer ${
                  uiMode === 'focus'
                    ? 'bg-stone-900 hover:bg-stone-800 border-amber-500/50 text-amber-300'
                    : 'bg-purple-950/80 hover:bg-purple-900 border-purple-500/50 text-purple-300'
                }`}
                title={uiMode === 'focus' ? 'Focus Mode (Clean Tabletop Action)' : 'Master Mode (Advanced DM Tools)'}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              </button>

              {/* Table Mode HUD */}
              <button
                type="button"
                onClick={toggleTableMode}
                className={`p-2 rounded-xl border text-xs transition cursor-pointer ${
                  isTableMode
                    ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-stone-900/80 hover:bg-stone-800 border-stone-800 text-amber-400 hover:border-amber-500/40'
                }`}
                title="Toggle Distraction-Free Table Mode HUD (Alt+T)"
              >
                <Dices className={`w-3.5 h-3.5 ${isTableMode ? 'text-stone-950' : 'text-amber-400'}`} />
              </button>

              {/* Physical Dice Toggle */}
              {onTogglePhysicalDiceMode && (
                <button
                  onClick={onTogglePhysicalDiceMode}
                  className={`p-2 rounded-xl border transition cursor-pointer ${
                    isPhysicalDiceMode
                      ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-stone-900/80 hover:bg-stone-800 border-stone-800 text-amber-400'
                  }`}
                  title={isPhysicalDiceMode ? `${t('nav.physicalDice', 'Physical Dice')} [ON]` : `${t('nav.physicalDice', 'Physical Dice')} [OFF]`}
                >
                  <Dices className={`w-4 h-4 ${isPhysicalDiceMode ? 'text-stone-950 animate-pulse' : 'text-amber-400'}`} />
                </button>
              )}

              {/* Command Palette */}
              {onOpenCommandPalette && (
                <button
                  onClick={onOpenCommandPalette}
                  className="p-2 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-amber-400 transition cursor-pointer"
                  title={`${t('nav.commandPalette', 'Command Palette')} (Ctrl+K)`}
                >
                  <Command className="w-4 h-4" />
                </button>
              )}

              {/* Options */}
              {onOpenAudioModal && (
                <button
                  onClick={onOpenAudioModal}
                  className={`p-2 rounded-xl border transition cursor-pointer ${
                    isSoundEnabled()
                      ? 'bg-stone-900/80 hover:bg-stone-800 border-stone-800 text-amber-400'
                      : 'bg-rose-950/60 border-rose-800/80 text-rose-300'
                  }`}
                  title={t('nav.options', 'Options')}
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}

              {/* Install PWA */}
              <button
                onClick={handleTriggerInstall}
                className={`p-2 rounded-xl border transition cursor-pointer ${
                  isStandalone
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-stone-900/80 hover:bg-stone-800 border-stone-800 text-amber-400'
                }`}
                title={isStandalone ? t('nav.appInstalled', 'App Installed') : t('nav.installApp', 'Install App')}
              >
                <Laptop className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        <InstallAppModal
          isOpen={showInstallModal}
          onClose={() => setShowInstallModal(false)}
          deferredPrompt={deferredPrompt}
          isStandalone={isStandalone}
          onTriggerInstallPrompt={handleTriggerInstallPrompt}
        />
      </>
    );
  }

  // EXPANDED MODE - CALM, SEMANTICALLY GROUPED SECTIONS
  return (
    <>
      <aside className="w-full lg:w-60 shrink-0 select-none transition-all duration-300 ease-in-out">
        <div className="bg-stone-950/90 border border-stone-800/90 backdrop-blur-md rounded-2xl shadow-2xl p-2.5 sm:p-3 space-y-3.5">

          {/* SECTION 1: CORE PLAY & RULES */}
          <div className="space-y-1.5">
            <div className="px-1 flex items-center justify-between text-[10px] font-bold text-stone-500 uppercase tracking-wider">
              <span>{t('nav.playAndRules', 'Campaign & Rules')}</span>
              <button
                onClick={toggleCollapse}
                className="p-1 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/50 text-stone-400 hover:text-amber-300 transition cursor-pointer shadow-sm group flex items-center gap-1 text-[10px] normal-case"
                title="Phase out / collapse vertical menu"
              >
                <PanelLeftClose className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-300" />
                <span className="hidden sm:inline text-[10px] text-stone-400 group-hover:text-amber-300 font-mono">{t('nav.phaseOut', 'Phase Out')}</span>
              </button>
            </div>

            {/* Hub */}
            <button
              onClick={() => onTabChange('menu')}
              className={`w-full flex items-center justify-between p-2 rounded-xl border transition-all duration-200 cursor-pointer text-left group ${
                isHubActive
                  ? 'bg-gradient-to-r from-amber-950/90 via-stone-900 to-amber-950/80 border-amber-500/80 text-amber-200 shadow-lg shadow-amber-950/50'
                  : 'bg-stone-900/80 hover:bg-stone-800/90 border-stone-800 hover:border-amber-600/40 text-stone-300 hover:text-amber-300'
              }`}
              title="System Selection, Roster Management & Campaign Hub"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-105 ${
                  isHubActive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-inner'
                    : 'bg-stone-800 text-stone-400 group-hover:bg-amber-950 group-hover:text-amber-400'
                }`}>
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="font-serif font-bold text-xs tracking-wide leading-tight block">{t('nav.hub', 'Hub')}</span>
                  <p className="text-[10px] text-stone-400 truncate">{t('nav.hubSub', 'Systems & Roster')}</p>
                </div>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                isHubActive ? 'text-amber-400 translate-x-0.5' : 'text-stone-600 group-hover:text-stone-400'
              }`} />
            </button>

            {/* DM Party Monitor & Live Overrides (Prominent in GM Mode) */}
            {workspaceRole === 'gm' && (
              <button
                onClick={() => onTabChange('sheetDm')}
                className={`w-full flex items-center justify-between p-2 rounded-xl border transition-all duration-200 cursor-pointer text-left group ${
                  activeTab === 'sheetDm'
                    ? 'bg-gradient-to-r from-purple-950/90 via-stone-900 to-purple-950/80 border-purple-500 text-purple-100 shadow-lg shadow-purple-950/50'
                    : 'bg-stone-900/80 hover:bg-stone-800 border-purple-900/50 hover:border-purple-500/60 text-purple-200 hover:text-purple-100'
                }`}
                title="DM Live Party Monitor & Stat Overrides"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-105 ${
                    activeTab === 'sheetDm'
                      ? 'bg-purple-500/30 text-purple-200 border border-purple-500/50 shadow-inner'
                      : 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
                  }`}>
                    <Crown className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-serif font-bold text-xs tracking-wide leading-tight block">DM Overview</span>
                      <span className="text-[9px] bg-purple-900/80 text-purple-200 px-1 py-0.2 rounded font-bold">LIVE</span>
                    </div>
                    <p className="text-[10px] text-purple-300/70 truncate">Party Monitor & Overrides</p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 shrink-0 text-purple-400" />
              </button>
            )}

            {/* User Guide */}
            <button
              onClick={() => onTabChange('sheet6')}
              className={`w-full flex items-center justify-between p-2 rounded-xl border transition-all duration-200 cursor-pointer text-left group ${
                isGuideActive
                  ? 'bg-gradient-to-r from-amber-950/90 via-stone-900 to-amber-950/80 border-amber-500/80 text-amber-200 shadow-lg shadow-amber-950/50'
                  : 'bg-stone-900/80 hover:bg-stone-800/90 border-stone-800 hover:border-amber-600/40 text-stone-300 hover:text-amber-300'
              }`}
              title="User Manual, TRPG System Guides & Release Changelog"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-105 ${
                  isGuideActive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-inner'
                    : 'bg-stone-800 text-stone-400 group-hover:bg-amber-950 group-hover:text-amber-400'
                }`}>
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="font-serif font-bold text-xs tracking-wide leading-tight block">{guideTitle}</span>
                  <p className="text-[10px] text-stone-400 truncate">{guideSubtext}</p>
                </div>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                isGuideActive ? 'text-amber-400 translate-x-0.5' : 'text-stone-600 group-hover:text-stone-400'
              }`} />
            </button>

            {/* Compendium */}
            <button
              onClick={() => onTabChange('sheet7')}
              className={`w-full flex items-center justify-between p-2 rounded-xl border transition-all duration-200 cursor-pointer text-left group ${
                isCompendiumActive
                  ? 'bg-gradient-to-r from-amber-950/90 via-stone-900 to-amber-950/80 border-amber-500/80 text-amber-200 shadow-lg shadow-amber-950/50'
                  : 'bg-stone-900/80 hover:bg-stone-800/90 border-stone-800 hover:border-amber-600/40 text-stone-300 hover:text-amber-300'
              }`}
              title="Dynamic SRD Library for Monsters, Spells, Items, Classes, Feats & Features"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-105 ${
                  isCompendiumActive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-inner'
                    : 'bg-stone-800 text-stone-400 group-hover:bg-amber-950 group-hover:text-amber-400'
                }`}>
                  <Library className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="font-serif font-bold text-xs tracking-wide leading-tight block">{t('nav.compendium', 'Compendium')}</span>
                  <p className="text-[10px] text-stone-400 truncate">{t('nav.compendiumSub', 'Monsters, Spells & Items')}</p>
                </div>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                isCompendiumActive ? 'text-amber-400 translate-x-0.5' : 'text-stone-600 group-hover:text-stone-400'
              }`} />
            </button>
          </div>

          {/* SECTION 2: AI & WORLD INTEL */}
          <div className="pt-2 border-t border-stone-800/70 space-y-1.5">
            <div className="px-1 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
              <span>{t('nav.aiAndWorld', 'AI & World')}</span>
            </div>

            {/* AI Assistant Oracle & Entity Forge */}
            {onOpenAiAssistant && (
              <button
                onClick={onOpenAiAssistant}
                className="w-full flex items-center justify-start px-2.5 py-1.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/70 border border-purple-500/40 hover:border-purple-400 text-purple-200 hover:text-purple-100 text-xs font-medium transition cursor-pointer group shadow-xs"
                title="Open Nexus Oracle & Generator Forge"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Bot className="w-3.5 h-3.5 text-purple-300 group-hover:scale-110 transition-transform shrink-0" />
                  <span className="truncate">{t('nav.aiOracle', 'Nexus Oracle')}</span>
                </div>
              </button>
            )}

            {/* Live Session Co-Pilot */}
            {onOpenCopilot && (
              <button
                onClick={onOpenCopilot}
                className="w-full flex items-center justify-start px-2.5 py-1.5 rounded-xl bg-amber-950/50 hover:bg-amber-900/70 border border-amber-500/50 hover:border-amber-400 text-amber-200 hover:text-amber-100 text-xs font-medium transition cursor-pointer group shadow-xs"
                title="Open Live Tabletop Session Co-Pilot HUD"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:scale-110 transition-transform shrink-0" />
                  <span className="truncate">Session Co-Pilot</span>
                </div>
              </button>
            )}

            {/* Campaign World Atlas & Questline Hub */}
            {onOpenCampaignLoreVault && (
              <button
                onClick={() => onOpenCampaignLoreVault('atlas')}
                className="w-full flex items-center justify-start px-2.5 py-1.5 rounded-xl bg-stone-900/80 hover:bg-stone-800/90 border border-stone-800 hover:border-amber-500/40 text-stone-200 hover:text-amber-200 text-xs font-medium transition cursor-pointer group"
                title="Open Campaign World Atlas, Quests & Faction Matrix (Ctrl+M)"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Compass className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-45 transition-transform duration-300 shrink-0" />
                  <span className="truncate">Atlas & Lore</span>
                </div>
              </button>
            )}

            {/* Campaign Knowledge Graph */}
            {activeSession && onOpenCampaignGraph && (
              <button
                onClick={onOpenCampaignGraph}
                className="w-full flex items-center justify-start px-2.5 py-1.5 rounded-xl bg-stone-900/80 hover:bg-stone-800/90 border border-stone-800 hover:border-amber-600/40 text-stone-200 hover:text-amber-300 text-xs font-medium transition cursor-pointer group"
                title="Open Campaign Relationship Graph"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Network className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                  <span className="truncate">{t('nav.campaignGraph', 'Campaign Graph')}</span>
                </div>
              </button>
            )}
          </div>

          {/* SECTION 3: MULTIPLAYER & TABLE */}
          <div className="pt-2 border-t border-stone-800/70 space-y-1.5">
            <div className="px-1 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
              <span>{t('nav.multiplayerAndTable', 'Multiplayer & Table')}</span>
            </div>

            {/* Multiplayer Session Lobby */}
            {currentUser && onOpenSessionLobby && (
              <button
                onClick={onOpenSessionLobby}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer border group ${
                  activeSession
                    ? 'bg-emerald-950/50 border-emerald-600/60 text-emerald-200 shadow-xs'
                    : 'bg-stone-900/80 hover:bg-stone-800/90 border-stone-800 hover:border-amber-600/40 text-stone-200 hover:text-amber-300'
                }`}
                title={activeSession ? `Campaign: ${displayCampaignName} (Click to open Room Menu)` : 'Open Multiplayer Campaign Session Lobby'}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Users className={`w-3.5 h-3.5 shrink-0 ${activeSession ? 'text-emerald-400' : 'text-amber-400'} group-hover:scale-110 transition-transform`} />
                  <span className="truncate">{displayCampaignName}</span>
                </div>
                {activeSession && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                )}
              </button>
            )}

            {/* WebRTC Party Voice Client */}
            {onOpenVoiceModal && (
              <button
                onClick={onOpenVoiceModal}
                className="w-full flex items-center justify-start px-2.5 py-1.5 rounded-xl bg-stone-900/80 hover:bg-stone-800/90 border border-stone-800 hover:border-emerald-500/40 text-stone-200 hover:text-emerald-300 text-xs font-medium transition cursor-pointer group"
                title="Open Party WebRTC Integrated Voice Client"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                  <span className="truncate">{t('nav.partyVoice', 'Party Voice')}</span>
                </div>
              </button>
            )}
          </div>

          {/* SECTION 4: DEVELOPER & PLUGINS */}
          {onOpenExtensionManager && (
            <div className="pt-2 border-t border-stone-800/70 space-y-1.5">
              <div className="px-1 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                <span>{t('nav.developerAndPlugins', 'Developer & Plugins')}</span>
              </div>

              <button
                onClick={onOpenExtensionManager}
                className="w-full flex items-center justify-start px-2.5 py-1.5 rounded-xl bg-stone-900/80 hover:bg-stone-800/90 border border-stone-800 hover:border-indigo-500/40 text-stone-200 hover:text-indigo-300 text-xs font-medium transition cursor-pointer group"
                title="Manage TRPG Plugins, SDK Extensions & Event Bus Stream"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Layers className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform shrink-0" />
                  <span className="truncate">{t('nav.sdkPlugins', 'SDK / Plugins')}</span>
                </div>
              </button>
            </div>
          )}

          {/* SECTION 5: SETTINGS & PREFERENCES */}
          <div className="pt-2 border-t border-stone-800/70 space-y-1.5">
            <div className="px-1 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
              <span>{t('nav.settingsAndOptions', 'Settings')}</span>
            </div>

            {/* Undo / Redo Mini Row (Always on top / first entry in settings) */}
            <div className="grid grid-cols-2 gap-1.5 bg-stone-900/60 p-1 rounded-xl border border-stone-800/80">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-xs font-medium transition ${
                  canUndo
                    ? 'bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-600/30 cursor-pointer shadow-xs'
                    : 'bg-stone-900/40 text-stone-600 border border-transparent cursor-not-allowed opacity-40'
                }`}
                title="Undo last change (Ctrl+Z)"
              >
                <Undo2 className="w-3 h-3" />
                <span className="text-[11px]">{t('nav.undo', 'Undo')}</span>
              </button>

              <button
                onClick={onRedo}
                disabled={!canRedo}
                className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-xs font-medium transition ${
                  canRedo
                    ? 'bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-600/30 cursor-pointer shadow-xs'
                    : 'bg-stone-900/40 text-stone-600 border border-transparent cursor-not-allowed opacity-40'
                }`}
                title="Redo change (Ctrl+Y)"
              >
                <Redo2 className="w-3 h-3" />
                <span className="text-[11px]">{t('nav.redo', 'Redo')}</span>
              </button>
            </div>

            {/* Focus Mode & Table Mode Controls */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={toggleUiMode}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  uiMode === 'focus'
                    ? 'bg-stone-900/90 hover:bg-stone-800 border-amber-500/50 text-amber-300 shadow-xs'
                    : 'bg-purple-950/80 hover:bg-purple-900 border-purple-500/50 text-purple-300 shadow-xs'
                }`}
                title="Toggle between Focus Mode (clean, fast tabletop action) and Master Mode (advanced overrides & DM tools)"
              >
                <span className="truncate">{uiMode === 'focus' ? '⚡ Focus' : '⚙️ Master'}</span>
              </button>

              <button
                type="button"
                onClick={toggleTableMode}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  isTableMode
                    ? 'bg-amber-500 text-stone-950 border-amber-400 font-black shadow-md shadow-amber-500/20'
                    : 'bg-stone-900/80 hover:bg-stone-800 border-stone-800 hover:border-amber-500/50 text-stone-200 hover:text-amber-300 shadow-xs'
                }`}
                title="Toggle Distraction-Free Table Mode HUD (Alt+T)"
              >
                <Dices className={`w-3.5 h-3.5 ${isTableMode ? 'text-stone-950' : 'text-amber-400'} shrink-0`} />
                <span className="truncate">Table Mode</span>
              </button>
            </div>

            {/* Workspace Role Switcher (Player / GM / Unified) */}
            <div className="grid grid-cols-3 gap-1 bg-stone-900/60 p-1 rounded-xl border border-stone-800/80 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setWorkspaceRole('player');
                  if (activeTab === 'sheetDm') onTabChange('sheet1');
                }}
                className={`py-1 px-1 rounded-lg font-medium transition text-center truncate cursor-pointer ${
                  workspaceRole === 'player'
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50 font-bold shadow-xs'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                }`}
                title="Player Workspace (Characters, dice, spells & inventory)"
              >
                🛡️ Player
              </button>
              <button
                type="button"
                onClick={() => {
                  setWorkspaceRole('gm');
                  if (activeTab !== 'menu') onTabChange('sheetDm');
                }}
                className={`py-1 px-1 rounded-lg font-medium transition text-center truncate cursor-pointer ${
                  workspaceRole === 'gm'
                    ? 'bg-purple-950/80 text-purple-300 border border-purple-500/50 font-bold shadow-xs'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                }`}
                title="Game Master Workspace (Encounters, party overview & DM tools)"
              >
                👑 GM
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceRole('unified')}
                className={`py-1 px-1 rounded-lg font-medium transition text-center truncate cursor-pointer ${
                  workspaceRole === 'unified'
                    ? 'bg-stone-800 text-stone-100 border border-stone-600 font-bold shadow-xs'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                }`}
                title="Unified Workspace (All character & campaign tabs)"
              >
                ⚡ Unified
              </button>
            </div>

            {/* Physical Tabletop Dice Mode */}
            {onTogglePhysicalDiceMode && (
              <button
                onClick={onTogglePhysicalDiceMode}
                className={`w-full flex items-center justify-start px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer border group ${
                  isPhysicalDiceMode
                    ? 'bg-amber-500/20 text-amber-200 border-amber-500/60 shadow-xs'
                    : 'bg-stone-900/80 hover:bg-stone-800/90 border-stone-800 hover:border-amber-600/40 text-stone-200 hover:text-amber-300'
                }`}
                title={isPhysicalDiceMode ? 'Physical Tabletop Mode Active: Click to switch to 3D digital rolling' : 'Switch to Physical Tabletop Dice Mode (Input real dice)'}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Dices className={`w-3.5 h-3.5 ${isPhysicalDiceMode ? 'text-amber-300 animate-pulse' : 'text-amber-400'} group-hover:rotate-12 transition-transform shrink-0`} />
                  <span className="truncate">{t('nav.physicalDice', 'Physical Dice')}</span>
                </div>
              </button>
            )}

            {/* Command Palette Ctrl+K */}
            {onOpenCommandPalette && (
              <button
                onClick={onOpenCommandPalette}
                className="w-full flex items-center justify-start px-2.5 py-1.5 rounded-xl bg-stone-900/80 hover:bg-stone-800/90 border border-stone-800 hover:border-amber-600/40 text-stone-200 hover:text-amber-300 text-xs font-medium transition cursor-pointer group"
                title="Open Global Command Palette (Ctrl+K or Cmd+K)"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Command className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                  <span className="truncate">{t('nav.commandPalette', 'Command Palette')}</span>
                </div>
              </button>
            )}

            {/* Options & App Settings */}
            {onOpenAudioModal && (
              <button
                onClick={onOpenAudioModal}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer border group ${
                  isSoundEnabled()
                    ? 'bg-stone-900/80 hover:bg-stone-800/90 border-stone-800 hover:border-amber-600/40 text-stone-200 hover:text-amber-300'
                    : 'bg-rose-950/60 border-rose-800/80 text-rose-300'
                }`}
                title="Options (Sound, Audio & App Settings)"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Settings className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-45 transition-transform duration-300 shrink-0" />
                  <span className="truncate">{t('nav.options', 'Options')}</span>
                </div>
              </button>
            )}

            {/* Install PWA App */}
            <button
              onClick={handleTriggerInstall}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer border group ${
                isStandalone
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : deferredPrompt
                  ? 'bg-amber-950/80 hover:bg-amber-900/90 border-amber-600/60 text-amber-100 animate-pulse'
                  : 'bg-stone-900/80 hover:bg-stone-800/90 border-stone-800 hover:border-amber-600/40 text-stone-200 hover:text-amber-300'
              }`}
              title={isStandalone ? 'App Installed (Running Standalone)' : 'Install App locally as PWA (Desktop or Mobile)'}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Laptop className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                <span className="truncate">{isStandalone ? t('nav.appInstalled', 'App Installed') : t('nav.installApp', 'Install App')}</span>
              </div>
            </button>
          </div>

        </div>
      </aside>

      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        deferredPrompt={deferredPrompt}
        isStandalone={isStandalone}
        onTriggerInstallPrompt={handleTriggerInstallPrompt}
      />
    </>
  );
};
