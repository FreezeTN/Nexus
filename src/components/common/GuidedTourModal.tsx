import React, { useState } from 'react';
import { useUiMode } from '../../context/UiModeContext';
import {
  Sparkles,
  Dices,
  Command,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Zap,
  Sliders
} from 'lucide-react';
import { playDiceSound } from '../../utils/soundEffects';

const TOUR_STEPS = [
  {
    title: 'Welcome to your Tabletop Workspace',
    badge: 'Quick Orientation (1 of 3)',
    icon: Sparkles,
    iconColor: 'text-amber-400',
    description:
      'Designed with modern productivity principles to give you instant readability and fast-paced tabletop play without clutter.',
    highlights: [
      '⚡ Focus Mode: Keeps your active sheet clean, high-contrast, and fast.',
      '⚙️ Master Mode: Unlocks custom formula overrides, companion stats, and DM tools.',
      '🎲 Click any stat, modifier, or save to trigger rolls with advantage or disadvantage.'
    ]
  },
  {
    title: 'Interactive Vitals & Rest Automation',
    badge: 'Core Gameplay (2 of 3)',
    icon: Dices,
    iconColor: 'text-emerald-400',
    description:
      'Manage Hit Points, Inspiration, Concentration, and Rests with automatic 5e mechanical checks.',
    highlights: [
      'Click the HP badge to apply damage, healing, or temporary HP in one keypress.',
      'Short & Long Rest calculations automatically refill spell slots and Hit Dice.',
      'Active Concentration automatically triggers CON saves when taking damage.'
    ]
  },
  {
    title: 'Command Palette & Keyboard Mastery',
    badge: 'Power Shortcuts (3 of 3)',
    icon: Command,
    iconColor: 'text-cyan-400',
    description:
      'Navigate everything at lightning speed without ever reaching for your mouse.',
    highlights: [
      'Press Ctrl+K (or Cmd+K) anywhere to open the Universal Command Palette.',
      'Press 1–7 to instantly jump between Sheet Tabs (Stats, Combat, Gear, Spells, Notes, Guide, Compendium).',
      'Press T to cycle between your enabled TRPG systems (D&D 5e, 3.5e, Pathfinder 2e, Shadowrun, Call of Cthulhu).'
    ]
  }
];

export const GuidedTourModal: React.FC = () => {
  const { isTourOpen, setIsTourOpen, setUiMode, uiMode } = useUiMode();
  const [currentStep, setCurrentStep] = useState(0);

  if (!isTourOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;

  const handleNext = () => {
    try {
      playDiceSound();
    } catch {
      // ignore
    }
    if (currentStep < TOUR_STEPS.length - 1) {
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

  const handleComplete = () => {
    setIsTourOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-stone-950 border border-amber-500/50 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-stone-950 px-6 py-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <StepIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                {step.badge}
              </span>
              <h2 className="font-serif font-bold text-lg text-amber-100">{step.title}</h2>
            </div>
          </div>
          <button
            onClick={() => setIsTourOpen(false)}
            className="text-stone-400 hover:text-stone-200 p-1.5 rounded-lg hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-stone-300 leading-relaxed font-sans">
            {step.description}
          </p>

          <div className="space-y-2 bg-stone-900/70 border border-stone-800 p-4 rounded-xl">
            {step.highlights.map((highlight, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-stone-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{highlight}</span>
              </div>
            ))}
          </div>

          {/* Mode Selector Preference on first step */}
          {currentStep === 0 && (
            <div className="pt-2">
              <div className="text-xs text-stone-400 mb-2 font-mono">Choose your starting interface density:</div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUiMode('focus')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    uiMode === 'focus'
                      ? 'bg-amber-950/70 border-amber-500 text-amber-200 ring-1 ring-amber-500'
                      : 'bg-stone-900/60 border-stone-800 text-stone-400'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1.5 text-amber-300">
                    <Zap className="w-3.5 h-3.5" />
                    <span>⚡ Focus Mode</span>
                  </div>
                  <div className="text-[11px] text-stone-400 mt-1">
                    Clean, uncluttered, optimized for tabletop action.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setUiMode('master')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    uiMode === 'master'
                      ? 'bg-purple-950/70 border-purple-500 text-purple-200 ring-1 ring-purple-500'
                      : 'bg-stone-900/60 border-stone-800 text-stone-400'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1.5 text-purple-300">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>⚙️ Master Mode</span>
                  </div>
                  <div className="text-[11px] text-stone-400 mt-1">
                    Full analytical calculations, custom overrides & DM tools.
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="bg-stone-900/90 px-6 py-4 border-t border-stone-800 flex items-center justify-between">
          {/* Step indicators */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === currentStep
                    ? 'w-6 bg-amber-400'
                    : 'w-2 bg-stone-700'
                }`}
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
              <span>{currentStep === TOUR_STEPS.length - 1 ? 'Start Playing' : 'Next'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
