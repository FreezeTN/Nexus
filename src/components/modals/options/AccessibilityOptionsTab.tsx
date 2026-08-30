import React, { useState } from 'react';
import {
  Eye,
  Type,
  Activity,
  Sparkles,
  Volume2,
  VolumeX,
  Zap,
  Check,
  CheckCircle2,
  RotateCcw,
  Sliders,
  Shield,
  HelpCircle
} from 'lucide-react';
import { useAccessibility, HighContrastMode, FontSizeScale } from '../../../context/AccessibilityContext';

export const AccessibilityOptionsTab: React.FC = () => {
  const { settings, updateSetting, resetAccessibility, announceLiveMessage } = useAccessibility();
  const [testAnnounced, setTestAnnounced] = useState(false);

  const contrastOptions: { id: HighContrastMode; label: string; desc: string }[] = [
    { id: 'off', label: 'Standard', desc: 'Default tabletop atmospheric dark mode' },
    { id: 'increased', label: 'Increased Contrast', desc: 'Boosted border definitions and brighter muted labels' },
    { id: 'maximum', label: 'Maximum (WCAG AAA)', desc: 'Pure high-contrast black/white palette with stark outlines' },
  ];

  const fontScaleOptions: { id: FontSizeScale; label: string; desc: string }[] = [
    { id: 'standard', label: '100% (Standard)', desc: 'Default density for laptops and desktop monitors' },
    { id: 'large', label: '110% (Large)', desc: 'Enlarged body text and combat stat blocks' },
    { id: 'extra-large', label: '125% (Extra Large)', desc: 'Maximized readability for accessibility & TV displays' },
  ];

  const handleTestAnnouncement = () => {
    setTestAnnounced(true);
    setTimeout(() => setTestAnnounced(false), 3000);
    announceLiveMessage('Nexus Accessibility test message: Screen reader broadcast and auditory announcements are active.', 'assertive');
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance('Nexus Accessibility test: Screen reader broadcast is active.');
        utterance.lang = 'en-US';
        utterance.rate = 0.95;
        utterance.pitch = 0.9; // Lower pitch for clear masculine timbre

        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          // Prioritize known American English male voices across Chromium, Safari, Edge, Firefox
          const americanMaleVoice = voices.find(v => {
            const lang = v.lang.replace('_', '-').toLowerCase();
            const name = v.name.toLowerCase();
            const isUs = lang === 'en-us' || lang.startsWith('en-us') || lang === 'en';
            const isMale = (
              name.includes('david') ||
              name.includes('guy') ||
              name.includes('alex') ||
              name.includes('mark') ||
              name.includes('george') ||
              name.includes('daniel') ||
              name.includes('fred') ||
              name.includes('natural') ||
              name.includes('male') ||
              name.includes('us english') ||
              name.includes('google us english')
            ) && !name.includes('female') && !name.includes('zira') && !name.includes('samantha') && !name.includes('victoria') && !name.includes('karen');
            return isUs && isMale;
          }) || voices.find(v => {
            const lang = v.lang.replace('_', '-').toLowerCase();
            return lang === 'en-us' || lang.startsWith('en-us');
          });

          if (americanMaleVoice) {
            utterance.voice = americanMaleVoice;
          }
        }

        window.speechSynthesis.speak(utterance);
      } catch {
        // Fallback silently if speech synthesis is blocked
      }
    }
  };

  return (
    <div className="space-y-6 text-stone-200" id="a11y-options-panel">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-3">
        <div>
          <h3 className="text-lg font-bold font-serif text-amber-200 flex items-center gap-2">
            <Eye className="w-5 h-5 text-amber-400" />
            Accessibility & Visual Ergonomics
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Configure WCAG 2.1 AA/AAA contrast, typography scaling, screen reader announcements, and motor assistance.
          </p>
        </div>
        <button
          onClick={resetAccessibility}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded-lg border border-stone-800 transition cursor-pointer"
          title="Reset all accessibility settings to default"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* 1. High Contrast Modes */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          High Contrast & Luminance Mode
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {contrastOptions.map((opt) => {
            const isSelected = settings.highContrast === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => updateSetting('highContrast', opt.id)}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-amber-400 bg-amber-950/30 ring-2 ring-amber-500/30'
                    : 'border-stone-800 bg-stone-900/60 hover:border-stone-700 hover:bg-stone-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-stone-100">{opt.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Font Scaling & Dyslexia Friendly */}
      <div className="space-y-3 pt-2 border-t border-stone-800/80">
        <label className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-2">
          <Type className="w-4 h-4 text-amber-400" />
          Typography & Text Scaling
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {fontScaleOptions.map((opt) => {
            const isSelected = settings.fontSizeScale === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => updateSetting('fontSizeScale', opt.id)}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-amber-400 bg-amber-950/30 ring-2 ring-amber-500/30'
                    : 'border-stone-800 bg-stone-900/60 hover:border-stone-700 hover:bg-stone-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-stone-100">{opt.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Dyslexia font toggle */}
        <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-stone-900/60 border border-stone-800 hover:border-stone-700 transition">
          <div>
            <span className="font-bold text-sm text-stone-200 block">Dyslexia-Optimized Typography</span>
            <span className="text-xs text-stone-400">
              Enables weighted letter bases and enhanced character tracking for improved readability.
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.dyslexicFont}
            onClick={() => updateSetting('dyslexicFont', !settings.dyslexicFont)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
              settings.dyslexicFont ? 'bg-amber-600 justify-end' : 'bg-stone-700 justify-start'
            }`}
          >
            <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition"></div>
          </button>
        </div>
      </div>

      {/* 3. Motion & Focus Aids */}
      <div className="space-y-3 pt-2 border-t border-stone-800/80">
        <label className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          Motion & Keyboard Focus Assistance
        </label>

        {/* Reduced Motion Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-stone-900/60 border border-stone-800 hover:border-stone-700 transition">
          <div>
            <span className="font-bold text-sm text-stone-200 block">Reduce Motion & Screen Transitions</span>
            <span className="text-xs text-stone-400">
              Disables 3D physics roll rotations, layout transitions, and pulsating animations for vestibular comfort.
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.reducedMotion}
            onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
              settings.reducedMotion ? 'bg-amber-600 justify-end' : 'bg-stone-700 justify-start'
            }`}
          >
            <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition"></div>
          </button>
        </div>

        {/* Enhanced Focus Rings */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-stone-900/60 border border-stone-800 hover:border-stone-700 transition">
          <div>
            <span className="font-bold text-sm text-stone-200 block">High-Visibility Keyboard Focus Rings</span>
            <span className="text-xs text-stone-400">
              Renders glowing high-contrast outlines around active interactive controls during Tab navigation.
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.focusRingsEnhanced}
            onClick={() => updateSetting('focusRingsEnhanced', !settings.focusRingsEnhanced)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
              settings.focusRingsEnhanced ? 'bg-amber-600 justify-end' : 'bg-stone-700 justify-start'
            }`}
          >
            <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition"></div>
          </button>
        </div>

        {/* Screen Reader Optimization Live Test */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-stone-900/60 border border-stone-800 hover:border-stone-700 transition">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-stone-200 block">ARIA Live Speech Region</span>
              {testAnnounced && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/80 border border-emerald-500/50 px-2 py-0.5 rounded-full animate-pulse">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Broadcasted & Spoken!
                </span>
              )}
            </div>
            <span className="text-xs text-stone-400">
              Broadcasts dynamic dice roll outcomes, combat turns, and status alerts directly to screen readers and text-to-speech.
            </span>
          </div>
          <button
            type="button"
            onClick={handleTestAnnouncement}
            className={`px-3 py-1.5 text-xs font-bold font-mono rounded-lg border transition cursor-pointer shrink-0 ${
              testAnnounced
                ? 'bg-emerald-900 text-emerald-200 border-emerald-500 shadow-md shadow-emerald-950/50'
                : 'bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border-cyan-700/60'
            }`}
          >
            {testAnnounced ? '✓ Broadcasted' : 'Test ARIA Announce'}
          </button>
        </div>
      </div>
    </div>
  );
};
