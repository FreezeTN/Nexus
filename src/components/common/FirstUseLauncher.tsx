import React from 'react';
import {
  Users,
  UserPlus,
  Crown,
  BookOpen,
  Sparkles,
  ChevronRight,
  Shield,
  Layers,
  SlidersHorizontal,
  X,
  Compass,
  ArrowRight,
  Tv,
  Radio,
  FileText
} from 'lucide-react';
import { useUiMode, WorkspaceRole, ComplexityLevel } from '../../context/UiModeContext';

interface FirstUseLauncherProps {
  onJoinCampaign?: () => void;
  onCreateCharacter?: () => void;
  onStartCampaignGm?: () => void;
  onExploreCompendium?: () => void;
  onOpenAiAssistant?: () => void;
  onSelectSystem?: () => void;
  onClose?: () => void;
}

export const FirstUseLauncher: React.FC<FirstUseLauncherProps> = ({
  onJoinCampaign,
  onCreateCharacter,
  onStartCampaignGm,
  onExploreCompendium,
  onOpenAiAssistant,
  onSelectSystem,
  onClose
}) => {
  const {
    workspaceRole,
    setWorkspaceRole,
    complexityLevel,
    setComplexityLevel,
    setShowFirstUseLauncher
  } = useUiMode();

  const handleDismiss = () => {
    setShowFirstUseLauncher(false);
    if (onClose) onClose();
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-stone-900/90 via-stone-950/90 to-stone-950 border border-amber-500/30 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
      {/* Decorative ambient background */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with dismiss */}
      <div className="relative flex items-start justify-between gap-4 pb-6 border-b border-stone-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 text-[11px] font-mono font-bold tracking-wide uppercase rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Welcome to Nexus TRPG
            </span>
            <span className="text-xs text-stone-400 font-sans">
              Tactical & Narrative Operating System
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100 tracking-tight">
            What do you want to do today?
          </h2>
          <p className="text-sm text-stone-400 mt-1 max-w-xl">
            Choose your immediate goal. Nexus adapts your interface dynamically so you only see what matters for your role.
          </p>
        </div>

        <button
          onClick={handleDismiss}
          className="p-2 text-stone-400 hover:text-stone-200 bg-stone-900/80 hover:bg-stone-800 rounded-xl border border-stone-800 transition cursor-pointer shrink-0"
          title="Dismiss Welcome Hub"
          aria-label="Dismiss Welcome Hub"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main 4 Intent Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        {/* Intent 1: Join Campaign */}
        <button
          type="button"
          onClick={() => {
            if (onJoinCampaign) onJoinCampaign();
            setWorkspaceRole('player');
          }}
          className="group text-left p-5 rounded-2xl bg-stone-900/70 hover:bg-stone-900 border border-stone-800 hover:border-cyan-500/60 transition-all duration-200 flex flex-col justify-between space-y-4 hover:shadow-lg hover:shadow-cyan-950/40 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono font-bold text-cyan-400/80 uppercase">Multiplayer</span>
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-stone-100 group-hover:text-cyan-200 transition-colors">
              Join Campaign
            </h3>
            <p className="text-xs text-stone-400 mt-1 leading-relaxed">
              Connect to a live multiplayer session via invite code or local session lobby.
            </p>
          </div>
          <div className="flex items-center text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
            <span>Connect to Table</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </button>

        {/* Intent 2: Create Character */}
        <button
          type="button"
          onClick={() => {
            if (onCreateCharacter) onCreateCharacter();
            setWorkspaceRole('player');
          }}
          className="group text-left p-5 rounded-2xl bg-stone-900/70 hover:bg-stone-900 border border-stone-800 hover:border-amber-500/60 transition-all duration-200 flex flex-col justify-between space-y-4 hover:shadow-lg hover:shadow-amber-950/40 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-500/30 text-amber-400 group-hover:scale-105 transition-transform">
              <UserPlus className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-400/80 uppercase">Character Sheet</span>
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-stone-100 group-hover:text-amber-200 transition-colors">
              Create Character
            </h3>
            <p className="text-xs text-stone-400 mt-1 leading-relaxed">
              Build a new hero or investigator across 5e, 3.5e, Pathfinder 2e, Shadowrun, or Cthulhu.
            </p>
          </div>
          <div className="flex items-center text-xs font-semibold text-amber-400 group-hover:translate-x-1 transition-transform">
            <span>Launch Builder</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </button>

        {/* Intent 3: Start Campaign / GM Hub */}
        <button
          type="button"
          onClick={() => {
            if (onStartCampaignGm) onStartCampaignGm();
            setWorkspaceRole('gm');
          }}
          className="group text-left p-5 rounded-2xl bg-stone-900/70 hover:bg-stone-900 border border-stone-800 hover:border-purple-500/60 transition-all duration-200 flex flex-col justify-between space-y-4 hover:shadow-lg hover:shadow-purple-950/40 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-purple-950/80 border border-purple-500/30 text-purple-400 group-hover:scale-105 transition-transform">
              <Crown className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono font-bold text-purple-400/80 uppercase">Game Master</span>
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-stone-100 group-hover:text-purple-200 transition-colors">
              Start as GM
            </h3>
            <p className="text-xs text-stone-400 mt-1 leading-relaxed">
              Open Campaign Knowledge Graph, encounter trackers, monster rosters & ambient sounds.
            </p>
          </div>
          <div className="flex items-center text-xs font-semibold text-purple-400 group-hover:translate-x-1 transition-transform">
            <span>Open GM Hub</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </button>

        {/* Intent 4: Explore Compendium & Rules */}
        <button
          type="button"
          onClick={() => {
            if (onExploreCompendium) onExploreCompendium();
          }}
          className="group text-left p-5 rounded-2xl bg-stone-900/70 hover:bg-stone-900 border border-stone-800 hover:border-emerald-500/60 transition-all duration-200 flex flex-col justify-between space-y-4 hover:shadow-lg hover:shadow-emerald-950/40 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 group-hover:scale-105 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400/80 uppercase">SRD & Lore</span>
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-stone-100 group-hover:text-emerald-200 transition-colors">
              Explore Compendium
            </h3>
            <p className="text-xs text-stone-400 mt-1 leading-relaxed">
              Browse thousands of spells, monsters, magic items, weapons, feats, and rule guides.
            </p>
          </div>
          <div className="flex items-center text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
            <span>Browse Library</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </button>
      </div>

      {/* Role Workspace & Progressive Disclosure Personalization Bar */}
      <div className="pt-4 border-t border-stone-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        {/* Workspace Mode Selection */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-stone-400 font-medium font-sans">Workspace View:</span>
          <div className="inline-flex p-1 bg-stone-950 rounded-xl border border-stone-800">
            <button
              onClick={() => setWorkspaceRole('player')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                workspaceRole === 'player'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              🛡️ Player (Character & Dice)
            </button>
            <button
              onClick={() => setWorkspaceRole('gm')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                workspaceRole === 'gm'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              👑 GM (World & Encounters)
            </button>
            <button
              onClick={() => setWorkspaceRole('unified')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                workspaceRole === 'unified'
                  ? 'bg-stone-800 text-stone-100 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              ⚡ Unified (All Views)
            </button>
          </div>
        </div>

        {/* Complexity Level / Progressive Disclosure */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-stone-400 font-medium font-sans">Complexity:</span>
          <div className="inline-flex p-1 bg-stone-950 rounded-xl border border-stone-800">
            <button
              onClick={() => setComplexityLevel('streamlined')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                complexityLevel === 'streamlined'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Hides developer scripting, raw JSON, and complex profilers for a clean tabletop focus"
            >
              ✨ Streamlined (Beginner-friendly)
            </button>
            <button
              onClick={() => setComplexityLevel('power')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                complexityLevel === 'power'
                  ? 'bg-stone-800 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Exposes plugins, SDK architecture, macro automation, and advanced profilers"
            >
              🛠️ Power-User (Full SDK & Profilers)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
