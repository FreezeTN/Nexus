import React, { useState } from 'react';
import { useUiMode, WorkspaceRole, UiMode, ComplexityLevel } from '../../context/UiModeContext';
import { useSheetTheme, SHEET_THEMES } from '../../context/ThemeContext';
import { useLayoutCustomization } from '../../utils/layoutCustomization';
import {
  isSoundEnabled,
  setSoundEnabled,
  getMasterVolume,
  setMasterVolume,
  playDiceSound,
  playLevelUpSound
} from '../../utils/soundEffects';
import {
  Sparkles,
  Dices,
  Command,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Zap,
  Sliders,
  Palette,
  Volume2,
  VolumeX,
  Swords,
  Users,
  Shield,
  Heart,
  Moon,
  Keyboard,
  LayoutTemplate,
  Check,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';

const ACCENT_OPTIONS = [
  { name: 'Amber', value: '#f59e0b', colorClass: 'bg-amber-500' },
  { name: 'Emerald', value: '#10b981', colorClass: 'bg-emerald-500' },
  { name: 'Crimson', value: '#f43f5e', colorClass: 'bg-rose-500' },
  { name: 'Cyan', value: '#06b6d4', colorClass: 'bg-cyan-500' },
  { name: 'Violet', value: '#8b5cf6', colorClass: 'bg-purple-500' },
  { name: 'Orange', value: '#ea580c', colorClass: 'bg-orange-500' },
];

const TOUR_STEP_DEFINITIONS = [
  {
    id: 'persona',
    title: 'Role Persona & Interface Density',
    badge: '1 of 6 • Workspace Persona',
    icon: Users,
    iconColor: 'text-amber-400',
    tagline: 'Tailor your workspace whether you are running a single hero or commanding the whole tabletop campaign.'
  },
  {
    id: 'theme',
    title: 'Visual Atmosphere & Sheet Themes',
    badge: '2 of 6 • Theme & Atmosphere',
    icon: Palette,
    iconColor: 'text-rose-400',
    tagline: 'Curated ambient dark palettes and high-contrast parchment engineered for dim tabletop lighting.'
  },
  {
    id: 'vitals',
    title: 'Combat Vitals, HP & Rest Automation',
    badge: '3 of 6 • Core Mechanics',
    icon: Heart,
    iconColor: 'text-emerald-400',
    tagline: 'Say goodbye to eraser-worn paper. Automated HP buffer, rest calculations, and concentration tracking.'
  },
  {
    id: 'audio',
    title: 'Audio Synthesizer & Dice Rolling',
    badge: '4 of 6 • Sound & Dice',
    icon: Volume2,
    iconColor: 'text-cyan-400',
    tagline: 'Procedural Web Audio synthesizer for tactile dice clatter, critical fanfares, and tabletop dice options.'
  },
  {
    id: 'docks',
    title: 'HUD Docks & Universal Hotkeys',
    badge: '5 of 6 • Layout & Shortcuts',
    icon: Command,
    iconColor: 'text-purple-400',
    tagline: 'Configure persistent companion bars and navigate everything at lightning speed with keyboard mastery.'
  },
  {
    id: 'ready',
    title: 'Ready for Adventure!',
    badge: '6 of 6 • Personalized Setup',
    icon: Sparkles,
    iconColor: 'text-amber-400',
    tagline: 'Your custom workspace is configured and ready. Jump right into your campaign.'
  }
];

export const GuidedTourModal: React.FC = () => {
  const {
    isTourOpen,
    setIsTourOpen,
    uiMode,
    setUiMode,
    workspaceRole,
    setWorkspaceRole,
    complexityLevel,
    setComplexityLevel
  } = useUiMode();

  const { currentTheme, setTheme, accentColor, setAccentColor } = useSheetTheme();
  const { isVisible, setFeatureVisible } = useLayoutCustomization();

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  const [soundVolumePercent, setSoundVolumePercent] = useState<number>(() => Math.round(getMasterVolume() * 100));
  const [testedSound, setTestedSound] = useState<boolean>(false);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nexus_guided_tour_seen') === 'true';
    } catch {
      return false;
    }
  });

  if (!isTourOpen) return null;

  const currentDef = TOUR_STEP_DEFINITIONS[currentStep];
  const StepIcon = currentDef.icon;

  const handleNext = () => {
    try {
      playDiceSound();
    } catch {
      // ignore
    }
    if (currentStep < TOUR_STEP_DEFINITIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) {
      try {
        playDiceSound();
      } catch {}
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setSoundVolumePercent(newVol);
    setMasterVolume(newVol / 100);
  };

  const handleTestAudio = () => {
    setTestedSound(true);
    try {
      playDiceSound();
    } catch {}
    setTimeout(() => setTestedSound(false), 800);
  };

  const handleComplete = () => {
    try {
      if (dontShowAgain) {
        localStorage.setItem('nexus_guided_tour_seen', 'true');
      } else {
        localStorage.removeItem('nexus_guided_tour_seen');
      }
      playLevelUpSound();
    } catch {
      // ignore
    }
    setIsTourOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-stone-950 border border-amber-500/50 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Step Tracker */}
        <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-stone-950 px-5 sm:px-6 py-3.5 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shrink-0">
              <StepIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                {currentDef.badge}
              </div>
              <h2 className="font-serif font-bold text-base sm:text-lg text-amber-100 leading-tight">
                {currentDef.title}
              </h2>
            </div>
          </div>
          <button
            onClick={() => setIsTourOpen(false)}
            className="text-stone-400 hover:text-stone-200 p-1.5 rounded-lg hover:bg-stone-800 transition cursor-pointer shrink-0"
            title="Close Tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Stepper Navigation Bar */}
        <div className="bg-stone-900/60 px-5 sm:px-6 py-2 border-b border-stone-800/80 flex items-center justify-between overflow-x-auto gap-1 text-[11px] font-medium shrink-0 scrollbar-none">
          {TOUR_STEP_DEFINITIONS.map((def, idx) => (
            <button
              key={def.id}
              type="button"
              onClick={() => setCurrentStep(idx)}
              className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                idx === currentStep
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                  : idx < currentStep
                  ? 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
                  : 'text-stone-500 hover:text-stone-400 hover:bg-stone-800/30'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                idx === currentStep
                  ? 'bg-amber-500 text-stone-950'
                  : idx < currentStep
                  ? 'bg-emerald-800 text-emerald-100'
                  : 'bg-stone-800 text-stone-400'
              }`}>
                {idx < currentStep ? '✓' : idx + 1}
              </span>
              <span>{def.title.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-stone-300">
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-sans">
            {currentDef.tagline}
          </p>

          {/* STEP 0: PERSONA & DENSITY */}
          {currentStep === 0 && (
            <div className="space-y-4 animate-fadeIn">
              {/* Workspace Role */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold uppercase text-stone-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>Choose Your Playstyle Persona:</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setWorkspaceRole('player')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      workspaceRole === 'player'
                        ? 'bg-amber-950/60 border-amber-500 text-amber-200 ring-1 ring-amber-500'
                        : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5 text-amber-300">
                      <Swords className="w-3.5 h-3.5" />
                      <span>Player / Hero</span>
                    </div>
                    <div className="text-[11px] text-stone-400 mt-1 leading-snug">
                      Focus on your hero sheet, spell slots, inventory, actions, and combat roll calculators.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWorkspaceRole('gm')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      workspaceRole === 'gm'
                        ? 'bg-purple-950/60 border-purple-500 text-purple-200 ring-1 ring-purple-500'
                        : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5 text-purple-300">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Game Master (DM)</span>
                    </div>
                    <div className="text-[11px] text-stone-400 mt-1 leading-snug">
                      Party overview, encounter builders, monster bestiary, session log, and DM screen tools.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWorkspaceRole('unified')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      workspaceRole === 'unified'
                        ? 'bg-blue-950/60 border-blue-500 text-blue-200 ring-1 ring-blue-500'
                        : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5 text-blue-300">
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Unified All-in-One</span>
                    </div>
                    <div className="text-[11px] text-stone-400 mt-1 leading-snug">
                      Full access to both hero management and DM campaign tooling without restrictions.
                    </div>
                  </button>
                </div>
              </div>

              {/* Interface Density Mode */}
              <div className="space-y-2 pt-2 border-t border-stone-800/80">
                <label className="text-xs font-mono font-bold uppercase text-stone-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Choose Your Workspace Density:</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUiMode('focus')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      uiMode === 'focus'
                        ? 'bg-amber-950/70 border-amber-500 text-amber-200 ring-1 ring-amber-500'
                        : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5 text-amber-300">
                      <Zap className="w-3.5 h-3.5" />
                      <span>⚡ Focus Mode (Clean & Fast)</span>
                    </div>
                    <div className="text-[11px] text-stone-400 mt-1 leading-snug">
                      Distraction-free, high-contrast essentials engineered for fast paced live tabletop rolls.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUiMode('master')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      uiMode === 'master'
                        ? 'bg-purple-950/70 border-purple-500 text-purple-200 ring-1 ring-purple-500'
                        : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5 text-purple-300">
                      <Sliders className="w-3.5 h-3.5" />
                      <span>⚙️ Master Mode (Analytical Power)</span>
                    </div>
                    <div className="text-[11px] text-stone-400 mt-1 leading-snug">
                      Exposes calculation formulas, custom modifier overrides, and deep mechanics breakdown.
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: THEMES & PALETTES */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-xs text-stone-400">
                Select a visual atmosphere. Changes apply to the entire application instantly:
              </div>

              {/* Theme Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SHEET_THEMES.map(theme => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setTheme(theme.id)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      currentTheme.id === theme.id
                        ? 'bg-stone-900 border-amber-500 ring-1 ring-amber-500 text-amber-100 shadow-md'
                        : 'bg-stone-900/50 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-serif font-bold text-xs text-stone-200">
                          {theme.name}
                        </span>
                        <div className="flex items-center gap-1">
                          {theme.previewColors.map((color, cIdx) => (
                            <span
                              key={cIdx}
                              className="w-3 h-3 rounded-full border border-stone-700 shadow-xs"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-1 leading-snug">
                        {theme.description}
                      </p>
                    </div>
                    {currentTheme.id === theme.id && (
                      <div className="mt-2 text-[10px] font-mono text-amber-400 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Active Atmosphere</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Live Accent Color Customizer */}
              <div className="pt-2 border-t border-stone-800/80">
                <div className="text-xs font-mono font-bold text-stone-400 mb-2 flex items-center justify-between">
                  <span>Custom Accent Highlight:</span>
                  <span className="text-[11px] font-normal text-stone-500">{accentColor}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {ACCENT_OPTIONS.map(accent => (
                    <button
                      key={accent.value}
                      type="button"
                      onClick={() => setAccentColor(accent.value)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                        accentColor === accent.value
                          ? 'bg-stone-800 border-amber-500 text-amber-200 shadow-sm'
                          : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-300'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${accent.colorClass}`} />
                      <span>{accent.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: VITALS & REST AUTOMATION */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-stone-900/70 border border-stone-800 p-3.5 rounded-xl space-y-1.5">
                  <div className="font-bold text-xs text-rose-300 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-400" />
                    <span>Instant Hit Point Delta</span>
                  </div>
                  <p className="text-[11px] text-stone-400 leading-snug">
                    Enter positive or negative numbers in the HP field (or use quick +/- buttons). Temporary HP absorbs damage automatically before core hit points drop.
                  </p>
                </div>

                <div className="bg-stone-900/70 border border-stone-800 p-3.5 rounded-xl space-y-1.5">
                  <div className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-amber-400" />
                    <span>Top Header Rest Actions</span>
                  </div>
                  <p className="text-[11px] text-stone-400 leading-snug">
                    Short & Long Rest buttons are pinned in the top header. Short Rest spends Hit Dice for healing; Long Rest restores half Hit Dice, clears exhaustion, and recharges spell slots.
                  </p>
                </div>
              </div>

              {/* De-duplication notice */}
              <div className="bg-amber-950/30 border border-amber-600/30 p-3 rounded-xl flex items-start gap-2.5 text-xs text-amber-200/90">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <strong className="text-amber-200">Context-Aware Vitals:</strong> The top QuickStatsBar displays your HP while you browse inventory, spells, or bio. When you switch to the <strong>Combat Sheet</strong>, duplicate HP widgets gracefully hide to preserve your screen space for tactical defenses.
                </div>
              </div>

              <div className="space-y-2 bg-stone-900/50 border border-stone-800 p-3.5 rounded-xl">
                <div className="text-xs font-mono font-bold text-stone-300">Automated Mechanical Rules Built-In:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-stone-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Concentration CON save auto-prompts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>5e Death Saves tracking & stabilization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Inspiration Token toggle with advantage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Passive Perception, Investigation & Insight</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: AUDIO & ROLLING */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-stone-900/70 border border-stone-800 p-4 rounded-xl space-y-4">
                {/* Audio Synthesizer Master Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {soundOn ? (
                      <Volume2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-stone-500" />
                    )}
                    <div>
                      <div className="font-bold text-xs text-stone-200">Web Audio Synthesizer</div>
                      <div className="text-[11px] text-stone-400">
                        Procedural dice roll clatter, critical hit fanfare & leveling chimes
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleSound}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      soundOn
                        ? 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-500/50'
                        : 'bg-stone-800 hover:bg-stone-700 text-stone-400 border border-stone-700'
                    }`}
                  >
                    {soundOn ? 'Enabled' : 'Muted'}
                  </button>
                </div>

                {/* Volume Slider */}
                {soundOn && (
                  <div className="space-y-2 pt-2 border-t border-stone-800">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-stone-400">Master Sound Volume:</span>
                      <span className="text-amber-400 font-bold">{soundVolumePercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={soundVolumePercent}
                      onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                )}

                {/* Test Dice Sound Button */}
                <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
                  <span className="text-xs text-stone-400">Verify your speaker/headphone volume:</span>
                  <button
                    type="button"
                    onClick={handleTestAudio}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      testedSound
                        ? 'bg-amber-500 text-stone-950 scale-105'
                        : 'bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>{testedSound ? 'Rolling...' : '🔊 Test Dice Sound'}</span>
                  </button>
                </div>
              </div>

              {/* Physical Dice Tabletop Mode */}
              <div className="bg-stone-900/40 border border-stone-800 p-3.5 rounded-xl flex items-start gap-3">
                <Dices className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-stone-200">Roll Real Acrylic Dice at Your Physical Table?</div>
                  <p className="text-stone-400 leading-snug text-[11px]">
                    If you love physical dice, open the <strong>Physical Tabletop Dice</strong> modal (`Alt+D` or sidebar) to type your physical results and have the engine calculate all formulas, multipliers, and critical effects instantly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: HUD DOCKS & HOTKEYS */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-fadeIn">
              {/* Layout Docks Customization */}
              <div className="space-y-2">
                <div className="text-xs font-mono font-bold text-stone-400 uppercase">
                  Toggle Persistent Companion Bars:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFeatureVisible('ui_quickStatsBar', !isVisible('ui_quickStatsBar'))}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      isVisible('ui_quickStatsBar')
                        ? 'bg-amber-950/50 border-amber-500 text-amber-200'
                        : 'bg-stone-900/40 border-stone-800 text-stone-400 opacity-60'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>Quick Stats Bar</span>
                      <span className="text-[10px] font-mono">{isVisible('ui_quickStatsBar') ? 'ON' : 'OFF'}</span>
                    </div>
                    <div className="text-[10px] text-stone-400 mt-1">
                      Persistent top bar with AC, Speed, Initiative & Vitals.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeatureVisible('ui_floatingQuickDock', !isVisible('ui_floatingQuickDock'))}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      isVisible('ui_floatingQuickDock')
                        ? 'bg-amber-950/50 border-amber-500 text-amber-200'
                        : 'bg-stone-900/40 border-stone-800 text-stone-400 opacity-60'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>Floating Quick Dock</span>
                      <span className="text-[10px] font-mono">{isVisible('ui_floatingQuickDock') ? 'ON' : 'OFF'}</span>
                    </div>
                    <div className="text-[10px] text-stone-400 mt-1">
                      Bottom-right compact bar for rapid d20 rolls.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeatureVisible('ui_diceTray', !isVisible('ui_diceTray'))}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      isVisible('ui_diceTray')
                        ? 'bg-amber-950/50 border-amber-500 text-amber-200'
                        : 'bg-stone-900/40 border-stone-800 text-stone-400 opacity-60'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>Bottom Dice Tray</span>
                      <span className="text-[10px] font-mono">{isVisible('ui_diceTray') ? 'ON' : 'OFF'}</span>
                    </div>
                    <div className="text-[10px] text-stone-400 mt-1">
                      Expandable polyhedral dice roller (d4 to d100).
                    </div>
                  </button>
                </div>
              </div>

              {/* Power Keyboard Shortcuts */}
              <div className="bg-stone-900/70 border border-stone-800 p-4 rounded-xl space-y-2">
                <div className="text-xs font-mono font-bold text-stone-300 flex items-center gap-1.5">
                  <Keyboard className="w-4 h-4 text-cyan-400" />
                  <span>Essential Tabletop Hotkeys:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between bg-stone-950/60 p-2 rounded-lg border border-stone-800/80">
                    <span className="text-stone-300">Command Palette</span>
                    <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-700 rounded text-[10px] font-mono font-bold text-amber-300">
                      Ctrl+K / Cmd+K
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between bg-stone-950/60 p-2 rounded-lg border border-stone-800/80">
                    <span className="text-stone-300">Table Mode HUD</span>
                    <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-700 rounded text-[10px] font-mono font-bold text-amber-300">
                      Alt+T
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between bg-stone-950/60 p-2 rounded-lg border border-stone-800/80">
                    <span className="text-stone-300">Switch Sheet Tabs</span>
                    <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-700 rounded text-[10px] font-mono font-bold text-amber-300">
                      1 – 7
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between bg-stone-950/60 p-2 rounded-lg border border-stone-800/80">
                    <span className="text-stone-300">Cycle TRPG System Rules</span>
                    <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-700 rounded text-[10px] font-mono font-bold text-amber-300">
                      T
                    </kbd>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: READY & SUMMARY */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-stone-900/80 border border-stone-800 p-4 rounded-xl space-y-3">
                <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                  Configured Playstyle Summary:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800">
                    <div className="text-[10px] text-stone-500 uppercase font-mono">Role</div>
                    <div className="font-bold text-stone-200 capitalize">{workspaceRole}</div>
                  </div>

                  <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800">
                    <div className="text-[10px] text-stone-500 uppercase font-mono">Density</div>
                    <div className="font-bold text-stone-200 capitalize">{uiMode} Mode</div>
                  </div>

                  <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800">
                    <div className="text-[10px] text-stone-500 uppercase font-mono">Theme</div>
                    <div className="font-bold text-stone-200 truncate">{currentTheme.name}</div>
                  </div>

                  <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800">
                    <div className="text-[10px] text-stone-500 uppercase font-mono">Audio</div>
                    <div className="font-bold text-stone-200">
                      {soundOn ? `${soundVolumePercent}%` : 'Muted'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tour Auto-Launch Checkbox */}
              <label className="flex items-center gap-2.5 text-xs text-stone-300 cursor-pointer select-none bg-stone-900/40 p-3 rounded-xl border border-stone-800 hover:border-stone-700 transition">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 accent-amber-500"
                />
                <span>Do not launch this tour automatically on startup</span>
              </label>

              <div className="text-[11px] text-stone-400 italic">
                Tip: You can re-open this interactive tour at any time from the top header bar (Tour button) or via Command Palette (`Ctrl+K` → "Take Guided Tour").
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="bg-stone-900/90 px-5 sm:px-6 py-3.5 border-t border-stone-800 flex items-center justify-between shrink-0">
          {/* Step Indicators */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEP_DEFINITIONS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentStep(i)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  i === currentStep
                    ? 'w-6 bg-amber-400'
                    : 'w-2 bg-stone-700 hover:bg-stone-500'
                }`}
                title={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-xl border border-stone-700 text-stone-400 hover:text-stone-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold px-4 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition cursor-pointer"
            >
              <span>{currentStep === TOUR_STEP_DEFINITIONS.length - 1 ? 'Enter Tabletop Workspace' : 'Next'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
