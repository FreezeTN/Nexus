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
  ChevronRight
} from 'lucide-react';
import { TabId } from './Navigation';
import { UserProfile, GameSession } from '../lib/firebase';
import { isSoundEnabled } from '../utils/diceAudio';

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
  onOpenExtensionManager?: () => void;
  onOpenSessionLobby?: () => void;
  onOpenVoiceModal?: () => void;
  onOpenAudioModal?: () => void;
  currentUser?: UserProfile | null;
  activeSession?: GameSession | null;
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
  onOpenExtensionManager,
  onOpenSessionLobby,
  onOpenVoiceModal,
  onOpenAudioModal,
  currentUser,
  activeSession
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

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

  const handleTriggerInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert('To install as an app on Desktop or Mobile, open your browser menu (e.g. Chrome/Safari) and select "Install App" or "Add to Home Screen".');
    }
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
    : 'User Guide';

  const guideSubtext = isShadowrun
    ? 'Shadowrun 5e Rules'
    : isPathfinder
    ? 'Pathfinder 2e SRD'
    : isCthulhu
    ? 'Call of Cthulhu 7e'
    : 'Manual & System Reference';

  return (
    <aside className="w-full lg:w-60 shrink-0 select-none">
      <div className="bg-stone-950/90 border border-stone-800/90 backdrop-blur-md rounded-2xl shadow-2xl p-2.5 sm:p-3 space-y-3">
        {/* TOP: NAVIGATION & SYSTEM GUIDES (Hub, User Guide, Compendium) */}
        <div className="space-y-1.5">
          <div className="px-1 flex items-center justify-between text-[11px] font-bold text-stone-400 uppercase tracking-wider">
            <span>Navigation & Rules</span>
          </div>

          {/* Hub */}
          <button
            onClick={() => onTabChange('menu')}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 cursor-pointer text-left group ${
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
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="font-serif font-bold text-sm tracking-wide leading-tight block">Hub</span>
                <p className="text-[10px] text-stone-400 truncate mt-0.5">Systems & Roster</p>
              </div>
            </div>
            <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${
              isHubActive ? 'text-amber-400 translate-x-0.5' : 'text-stone-600 group-hover:text-stone-400'
            }`} />
          </button>

          {/* User Guide */}
          <button
            onClick={() => onTabChange('sheet6')}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 cursor-pointer text-left group ${
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
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="font-serif font-bold text-sm tracking-wide leading-tight block">{guideTitle}</span>
                <p className="text-[10px] text-stone-400 truncate mt-0.5">{guideSubtext}</p>
              </div>
            </div>
            <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${
              isGuideActive ? 'text-amber-400 translate-x-0.5' : 'text-stone-600 group-hover:text-stone-400'
            }`} />
          </button>

          {/* Compendium */}
          <button
            onClick={() => onTabChange('sheet7')}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 cursor-pointer text-left group ${
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
                <Library className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="font-serif font-bold text-sm tracking-wide leading-tight block">Compendium</span>
                <p className="text-[10px] text-stone-400 truncate mt-0.5">Monsters, Spells & Items</p>
              </div>
            </div>
            <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${
              isCompendiumActive ? 'text-amber-400 translate-x-0.5' : 'text-stone-600 group-hover:text-stone-400'
            }`} />
          </button>
        </div>

        <div className="h-px bg-stone-800/80 my-1" />

        {/* TOOLBAR ACTIONS HEADER */}
        <div className="px-1 flex items-center justify-between text-[11px] font-bold text-stone-400 uppercase tracking-wider">
          <span>Quick Controls</span>
          <span className="text-[10px] font-mono text-stone-600">v3.9.0</span>
        </div>

        {/* VERTICAL BUTTON STACK */}
        <div className="grid grid-cols-1 gap-1.5">
          {/* Undo / Redo Row */}
          <div className="grid grid-cols-2 gap-1.5 bg-stone-900/60 p-1 rounded-xl border border-stone-800/80">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition ${
                canUndo
                  ? 'bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-600/30 cursor-pointer shadow-sm'
                  : 'bg-stone-900/40 text-stone-600 border border-transparent cursor-not-allowed opacity-40'
              }`}
              title="Undo last change (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>

            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition ${
                canRedo
                  ? 'bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-600/30 cursor-pointer shadow-sm'
                  : 'bg-stone-900/40 text-stone-600 border border-transparent cursor-not-allowed opacity-40'
              }`}
              title="Redo change (Ctrl+Y or Cmd+Shift+Z)"
            >
              <Redo2 className="w-3.5 h-3.5" />
              <span>Redo</span>
            </button>
          </div>

          {/* Command Palette Ctrl+K */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-stone-900/80 hover:bg-stone-800/90 border border-stone-800 hover:border-amber-600/40 text-stone-200 hover:text-amber-300 text-xs font-bold transition cursor-pointer group"
              title="Open Global Command Palette (Ctrl+K or Cmd+K)"
            >
              <div className="flex items-center gap-2.5">
                <Command className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>Command Palette</span>
              </div>
            </button>
          )}

          {/* Campaign Knowledge Graph */}
          {onOpenCampaignGraph && (
            <button
              onClick={onOpenCampaignGraph}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-stone-900/80 hover:bg-stone-800/90 border border-stone-800 hover:border-amber-600/40 text-stone-200 hover:text-amber-300 text-xs font-bold transition cursor-pointer group"
              title="Open Obsidian-Style RPG Campaign Knowledge Graph Network"
            >
              <div className="flex items-center gap-2.5">
                <Network className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>Campaign Graph</span>
              </div>
            </button>
          )}

          {/* TRPG Extensions & Plugins SDK */}
          {onOpenExtensionManager && (
            <button
              onClick={onOpenExtensionManager}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-stone-900/80 hover:bg-stone-800/90 border border-stone-800 hover:border-indigo-500/40 text-stone-200 hover:text-indigo-300 text-xs font-bold transition cursor-pointer group"
              title="Manage TRPG Plugins, SDK Extensions & Event Bus Stream"
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span>SDK / Plugins</span>
              </div>
            </button>
          )}

          {/* Multiplayer Session Lobby */}
          {currentUser && onOpenSessionLobby && (
            <button
              onClick={onOpenSessionLobby}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border group ${
                activeSession
                  ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-200 shadow-md animate-pulse'
                  : 'bg-stone-900/80 hover:bg-stone-800/90 border-stone-800 hover:border-amber-600/40 text-stone-200 hover:text-amber-300'
              }`}
              title="Open Multiplayer Campaign Session Lobby & 6-Digit Room Code"
            >
              <div className="flex items-center gap-2.5">
                <Users className={`w-4 h-4 ${activeSession ? 'text-emerald-400' : 'text-amber-400'} group-hover:scale-110 transition-transform`} />
                <span>{activeSession ? `Room: ${activeSession.code}` : 'Session Lobby'}</span>
              </div>
              {activeSession && (
                <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700/80 rounded text-[10px] font-mono">
                  {activeSession.members?.length || 1} Live
                </span>
              )}
            </button>
          )}

          {/* WebRTC Party Voice Client */}
          {onOpenVoiceModal && (
            <button
              onClick={onOpenVoiceModal}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-stone-900/80 hover:bg-stone-800/90 border border-stone-800 hover:border-emerald-500/40 text-stone-200 hover:text-emerald-300 text-xs font-bold transition cursor-pointer group"
              title="Open Party WebRTC Integrated Voice Client"
            >
              <div className="flex items-center gap-2.5">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse group-hover:scale-110 transition-transform" />
                <span>Party Voice</span>
              </div>
            </button>
          )}

          {/* Options & App Settings */}
          {onOpenAudioModal && (
            <button
              onClick={onOpenAudioModal}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border group ${
                isSoundEnabled()
                  ? 'bg-stone-900/80 hover:bg-stone-800/90 border-stone-800 hover:border-amber-600/40 text-stone-200 hover:text-amber-300'
                  : 'bg-rose-950/60 border-rose-800/80 text-rose-300'
              }`}
              title="Options (Sound, Audio & App Settings)"
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
                <span>Options</span>
              </div>
            </button>
          )}

          {/* Install PWA App */}
          <button
            onClick={handleTriggerInstall}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border group ${
              isStandalone
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : deferredPrompt
                ? 'bg-amber-950/80 hover:bg-amber-900/90 border-amber-600/60 text-amber-100 animate-pulse'
                : 'bg-stone-900/80 hover:bg-stone-800/90 border-stone-800 hover:border-amber-600/40 text-stone-200 hover:text-amber-300'
            }`}
            title={isStandalone ? 'App Installed (Running Standalone)' : 'Install App locally as PWA (Desktop or Mobile)'}
          >
            <div className="flex items-center gap-2.5">
              <Laptop className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>{isStandalone ? 'App Installed' : 'Install App'}</span>
            </div>
          </button>
        </div>
      </div>
    </aside>
  );
};
