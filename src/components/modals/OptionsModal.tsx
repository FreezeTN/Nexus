import React, { useState, useEffect } from 'react';
import {
  Settings,
  Volume2,
  VolumeX,
  Volume1,
  X,
  Trash2,
  RefreshCw,
  Database,
  Sliders,
  Sparkles,
  Flame,
  Zap,
  Snowflake,
  FlaskConical,
  ShieldAlert,
  Sword,
  Dices,
  HeartPulse,
  TrendingUp,
  Skull,
  Radio,
  AlertTriangle,
  Check,
  Info,
  Smartphone,
  Upload,
  Download,
  UserCheck,
  ChevronRight
} from 'lucide-react';
import { CharacterData, RuleEdition } from '../../types';
import { UserProfile } from '../../lib/firebase';
import { convertCharacterEdition } from '../../utils/dndCalculations';
import { systemRegistry } from '../../systems';
import {
  isSoundEnabled,
  setSoundEnabled,
  getMasterVolume,
  setMasterVolume,
  playDiceSound,
  playHitSound,
  playMissSound,
  playFireSound,
  playIceColdSound,
  playLightningSound,
  playAcidPoisonSound,
  playHealSound,
  playSpellCastSound,
  playInitiativeTurnSound,
  playLevelUpSound,
  playDeathSound
} from '../../utils/soundEffects';

interface OptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: 'sound' | 'app' | 'character';
  currentUser?: UserProfile | null;
  activeCharacter?: CharacterData | null;
  onUpdateCharacter?: (char: CharacterData) => void;
  onSystemChange?: (edition: RuleEdition) => void;
  onExportJson?: () => void;
  onImportJson?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const OptionsModal: React.FC<OptionsModalProps> = ({
  isOpen,
  onClose,
  initialCategory = 'sound',
  currentUser,
  activeCharacter,
  onUpdateCharacter,
  onSystemChange,
  onExportJson,
  onImportJson
}) => {
  const [activeCategory, setActiveCategory] = useState<'sound' | 'app' | 'character'>(initialCategory);
  const [muted, setMuted] = useState<boolean>(!isSoundEnabled());
  const [volume, setVolumeState] = useState<number>(() => Math.round(getMasterVolume() * 100));
  const [lastPlayed, setLastPlayed] = useState<string | null>(null);

  // Clear cache state
  const [showClearCacheConfirm, setShowClearCacheConfirm] = useState(false);
  const [cacheClearedSuccess, setCacheClearedSuccess] = useState(false);
  const [storageStats, setStorageStats] = useState<{ count: number; sizeKB: string }>({ count: 0, sizeKB: '0.0' });

  useEffect(() => {
    if (isOpen) {
      setMuted(!isSoundEnabled());
      setVolumeState(Math.round(getMasterVolume() * 100));
      setActiveCategory(initialCategory);
      setShowClearCacheConfirm(false);
      setCacheClearedSuccess(false);
      calculateStorageStats();
    }
  }, [isOpen, initialCategory]);

  const calculateStorageStats = () => {
    try {
      let totalBytes = 0;
      const count = localStorage.length;
      for (let i = 0; i < count; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key) || '';
          totalBytes += (key.length + val.length) * 2;
        }
      }
      setStorageStats({
        count,
        sizeKB: (totalBytes / 1024).toFixed(1)
      });
    } catch (e) {
      setStorageStats({ count: 0, sizeKB: '0.0' });
    }
  };

  if (!isOpen) return null;

  const handleToggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    setSoundEnabled(!newMuted);
  };

  const handleVolumeChange = (newVolPct: number) => {
    setVolumeState(newVolPct);
    const floatVal = newVolPct / 100;
    setMasterVolume(floatVal);
    if (newVolPct > 0 && muted) {
      setMuted(false);
      setSoundEnabled(true);
    } else if (newVolPct === 0 && !muted) {
      setMuted(true);
      setSoundEnabled(false);
    }
  };

  const playTest = (name: string, fn: () => void) => {
    if (muted) {
      setMuted(false);
      setSoundEnabled(true);
    }
    setLastPlayed(name);
    fn();
    setTimeout(() => {
      setLastPlayed(null);
    }, 800);
  };

  const handleClearCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
      setCacheClearedSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (e) {
      console.error('Failed to clear cache:', e);
      alert('Cache cleared! Reloading application...');
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-stone-900 border border-amber-500/50 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 p-4 border-b border-amber-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-amber-400 font-serif font-bold text-lg">
            <Settings className="w-5 h-5 text-amber-400" />
            <span>Options</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Navigation Tabs */}
        <div className="bg-stone-950 px-4 pt-3 border-b border-stone-800 flex items-center gap-2">
          <button
            onClick={() => setActiveCategory('sound')}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-xl text-xs font-bold font-serif transition border-t border-x ${
              activeCategory === 'sound'
                ? 'bg-stone-900 text-amber-300 border-amber-500/50 shadow-sm'
                : 'bg-stone-950 text-stone-400 border-transparent hover:text-stone-200 hover:bg-stone-900/50'
            }`}
          >
            {muted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-amber-400" />
            )}
            <span>Sound</span>
          </button>

          <button
            onClick={() => setActiveCategory('app')}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-xl text-xs font-bold font-serif transition border-t border-x ${
              activeCategory === 'app'
                ? 'bg-stone-900 text-amber-300 border-amber-500/50 shadow-sm'
                : 'bg-stone-950 text-stone-400 border-transparent hover:text-stone-200 hover:bg-stone-900/50'
            }`}
          >
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span>App</span>
          </button>

          {currentUser && (
            <button
              onClick={() => setActiveCategory('character')}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-xl text-xs font-bold font-serif transition border-t border-x ${
                activeCategory === 'character'
                  ? 'bg-stone-900 text-amber-300 border-amber-500/50 shadow-sm'
                  : 'bg-stone-950 text-stone-400 border-transparent hover:text-stone-200 hover:bg-stone-900/50'
              }`}
            >
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>Character</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-6 overflow-y-auto">
          {/* CATEGORY 1: SOUND OPTIONS */}
          {activeCategory === 'sound' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Master Mute/Unmute Switch Banner */}
              <div
                className={`p-4 rounded-xl border transition flex items-center justify-between ${
                  muted
                    ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                    : 'bg-stone-950/80 border-amber-500/40 text-stone-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-xl border ${
                      muted
                        ? 'bg-rose-900/50 border-rose-700 text-rose-300'
                        : 'bg-amber-950/80 border-amber-600/60 text-amber-300'
                    }`}
                  >
                    {muted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="font-serif font-bold text-base flex items-center gap-2">
                      <span>Sound Effects</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                          muted
                            ? 'bg-rose-900/80 text-rose-200 border border-rose-700'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                        }`}
                      >
                        {muted ? 'Muted' : 'Enabled'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {muted
                        ? 'All audio effects, dice roll sounds, and spell cast cues are silenced.'
                        : 'Procedural audio effects active for rolls, attacks, spells, and events.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleToggleMute}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow ${
                    muted
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                  }`}
                >
                  {muted ? (
                    <>
                      <Volume2 className="w-4 h-4" />
                      <span>Unmute All</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-4 h-4" />
                      <span>Mute All</span>
                    </>
                  )}
                </button>
              </div>

              {/* Master Volume Slider */}
              <div className="bg-stone-950/60 p-4 rounded-xl border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-serif flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-amber-500" />
                    Master Volume Level
                  </span>
                  <span className="font-mono text-sm font-extrabold text-amber-300 bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
                    {muted ? '0%' : `${volume}%`}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <VolumeX className="w-4 h-4 text-stone-500 shrink-0" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={muted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-2 bg-stone-800 rounded-lg"
                  />
                  <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
                </div>

                {/* Volume Presets */}
                <div className="flex items-center justify-between gap-1 pt-1">
                  {[
                    { label: 'Mute', pct: 0 },
                    { label: '25%', pct: 25 },
                    { label: '50%', pct: 50 },
                    { label: '75%', pct: 75 },
                    { label: 'Max (100%)', pct: 100 }
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handleVolumeChange(preset.pct)}
                      className={`px-2 py-1 text-[11px] font-mono font-bold rounded-lg transition border ${
                        (!muted && volume === preset.pct) || (muted && preset.pct === 0)
                          ? 'bg-amber-500 text-stone-950 border-amber-400 shadow'
                          : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200 hover:bg-stone-800'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sound Preview / Test Panel */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-stone-400 font-serif flex items-center justify-between">
                  <span>Preview & Test Sound Effects</span>
                  <span className="text-[10px] text-stone-500 font-mono">Web Audio Synthesizer</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => playTest('dice', playDiceSound)}
                    className={`p-2.5 bg-stone-800/80 hover:bg-stone-700/90 border border-stone-700 rounded-xl text-left transition flex items-center gap-2 group ${
                      lastPlayed === 'dice' ? 'border-amber-400 bg-amber-950/60 ring-2 ring-amber-500/50' : ''
                    }`}
                  >
                    <Dices className="w-4 h-4 text-amber-400 shrink-0 group-hover:scale-110 transition" />
                    <div className="truncate">
                      <div className="text-xs font-bold text-stone-200 truncate">Dice Roll</div>
                      <div className="text-[10px] text-stone-400">Polyhedral clatter</div>
                    </div>
                  </button>

                  <button
                    onClick={() => playTest('hit', () => playHitSound(false))}
                    className={`p-2.5 bg-stone-800/80 hover:bg-stone-700/90 border border-stone-700 rounded-xl text-left transition flex items-center gap-2 group ${
                      lastPlayed === 'hit' ? 'border-amber-400 bg-amber-950/60 ring-2 ring-amber-500/50' : ''
                    }`}
                  >
                    <Sword className="w-4 h-4 text-amber-500 shrink-0 group-hover:scale-110 transition" />
                    <div className="truncate">
                      <div className="text-xs font-bold text-stone-200 truncate">Weapon Hit</div>
                      <div className="text-[10px] text-stone-400">Melee / Ranged</div>
                    </div>
                  </button>

                  <button
                    onClick={() => playTest('crit', () => playHitSound(true))}
                    className={`p-2.5 bg-stone-800/80 hover:bg-stone-700/90 border border-stone-700 rounded-xl text-left transition flex items-center gap-2 group ${
                      lastPlayed === 'crit' ? 'border-amber-400 bg-amber-950/60 ring-2 ring-amber-500/50' : ''
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-yellow-400 shrink-0 group-hover:scale-110 transition" />
                    <div className="truncate">
                      <div className="text-xs font-bold text-stone-200 truncate">Critical Hit</div>
                      <div className="text-[10px] text-stone-400">Chime victory chord</div>
                    </div>
                  </button>

                  <button
                    onClick={() => playTest('miss', playMissSound)}
                    className={`p-2.5 bg-stone-800/80 hover:bg-stone-700/90 border border-stone-700 rounded-xl text-left transition flex items-center gap-2 group ${
                      lastPlayed === 'miss' ? 'border-amber-400 bg-amber-950/60 ring-2 ring-amber-500/50' : ''
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 group-hover:scale-110 transition" />
                    <div className="truncate">
                      <div className="text-xs font-bold text-stone-200 truncate">Miss / Parry</div>
                      <div className="text-[10px] text-stone-400">Shield whoosh</div>
                    </div>
                  </button>

                  <button
                    onClick={() => playTest('fire', playFireSound)}
                    className={`p-2.5 bg-stone-800/80 hover:bg-stone-700/90 border border-stone-700 rounded-xl text-left transition flex items-center gap-2 group ${
                      lastPlayed === 'fire' ? 'border-amber-400 bg-amber-950/60 ring-2 ring-amber-500/50' : ''
                    }`}
                  >
                    <Flame className="w-4 h-4 text-orange-400 shrink-0 group-hover:scale-110 transition" />
                    <div className="truncate">
                      <div className="text-xs font-bold text-stone-200 truncate">Fire Effect</div>
                      <div className="text-[10px] text-stone-400">Flame roar & crackle</div>
                    </div>
                  </button>

                  <button
                    onClick={() => playTest('ice', playIceColdSound)}
                    className={`p-2.5 bg-stone-800/80 hover:bg-stone-700/90 border border-stone-700 rounded-xl text-left transition flex items-center gap-2 group ${
                      lastPlayed === 'ice' ? 'border-amber-400 bg-amber-950/60 ring-2 ring-amber-500/50' : ''
                    }`}
                  >
                    <Snowflake className="w-4 h-4 text-cyan-400 shrink-0 group-hover:scale-110 transition" />
                    <div className="truncate">
                      <div className="text-xs font-bold text-stone-200 truncate">Cold / Ice</div>
                      <div className="text-[10px] text-stone-400">Frost shimmer</div>
                    </div>
                  </button>

                  <button
                    onClick={() => playTest('lightning', playLightningSound)}
                    className={`p-2.5 bg-stone-800/80 hover:bg-stone-700/90 border border-stone-700 rounded-xl text-left transition flex items-center gap-2 group ${
                      lastPlayed === 'lightning' ? 'border-amber-400 bg-amber-950/60 ring-2 ring-amber-500/50' : ''
                    }`}
                  >
                    <Zap className="w-4 h-4 text-blue-400 shrink-0 group-hover:scale-110 transition" />
                    <div className="truncate">
                      <div className="text-xs font-bold text-stone-200 truncate">Lightning</div>
                      <div className="text-[10px] text-stone-400">Crackle & thunder</div>
                    </div>
                  </button>

                  <button
                    onClick={() => playTest('acid', playAcidPoisonSound)}
                    className={`p-2.5 bg-stone-800/80 hover:bg-stone-700/90 border border-stone-700 rounded-xl text-left transition flex items-center gap-2 group ${
                      lastPlayed === 'acid' ? 'border-amber-400 bg-amber-950/60 ring-2 ring-amber-500/50' : ''
                    }`}
                  >
                    <FlaskConical className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition" />
                    <div className="truncate">
                      <div className="text-xs font-bold text-stone-200 truncate">Acid / Poison</div>
                      <div className="text-[10px] text-stone-400">Sizzling bubble</div>
                    </div>
                  </button>

                  <button
                    onClick={() => playTest('heal', playHealSound)}
                    className={`p-2.5 bg-stone-800/80 hover:bg-stone-700/90 border border-stone-700 rounded-xl text-left transition flex items-center gap-2 group ${
                      lastPlayed === 'heal' ? 'border-amber-400 bg-amber-950/60 ring-2 ring-amber-500/50' : ''
                    }`}
                  >
                    <HeartPulse className="w-4 h-4 text-rose-400 shrink-0 group-hover:scale-110 transition" />
                    <div className="truncate">
                      <div className="text-xs font-bold text-stone-200 truncate">Healing Spell</div>
                      <div className="text-[10px] text-stone-400">Ascending arpeggio</div>
                    </div>
                  </button>

                  <button
                    onClick={() => playTest('spell', playSpellCastSound)}
                    className={`p-2.5 bg-stone-800/80 hover:bg-stone-700/90 border border-stone-700 rounded-xl text-left transition flex items-center gap-2 group ${
                      lastPlayed === 'spell' ? 'border-amber-400 bg-amber-950/60 ring-2 ring-amber-500/50' : ''
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-purple-400 shrink-0 group-hover:scale-110 transition" />
                    <div className="truncate">
                      <div className="text-xs font-bold text-stone-200 truncate">Spell Cast</div>
                      <div className="text-[10px] text-stone-400">Arcane sweep</div>
                    </div>
                  </button>

                  <button
                    onClick={() => playTest('level', playLevelUpSound)}
                    className={`p-2.5 bg-stone-800/80 hover:bg-stone-700/90 border border-stone-700 rounded-xl text-left transition flex items-center gap-2 group ${
                      lastPlayed === 'level' ? 'border-amber-400 bg-amber-950/60 ring-2 ring-amber-500/50' : ''
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition" />
                    <div className="truncate">
                      <div className="text-xs font-bold text-stone-200 truncate">Level Up</div>
                      <div className="text-[10px] text-stone-400">Victory fanfare</div>
                    </div>
                  </button>

                  <button
                    onClick={() => playTest('death', playDeathSound)}
                    className={`p-2.5 bg-stone-800/80 hover:bg-stone-700/90 border border-stone-700 rounded-xl text-left transition flex items-center gap-2 group ${
                      lastPlayed === 'death' ? 'border-amber-400 bg-amber-950/60 ring-2 ring-amber-500/50' : ''
                    }`}
                  >
                    <Skull className="w-4 h-4 text-stone-400 shrink-0 group-hover:scale-110 transition" />
                    <div className="truncate">
                      <div className="text-xs font-bold text-stone-200 truncate">Death Bell</div>
                      <div className="text-[10px] text-stone-400">Unconscious tone</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY 2: APP OPTIONS & CACHE CLEARING */}
          {activeCategory === 'app' && (
            <div className="space-y-5 animate-fadeIn">
              {/* App Cache & Local Storage Management Card */}
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
                  <div className="flex items-center gap-2.5 text-cyan-400 font-serif font-bold text-sm">
                    <Database className="w-4 h-4 text-cyan-400" />
                    <span>Application Cache & Storage</span>
                  </div>
                  <span className="text-[10px] font-mono text-stone-400 bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
                    {storageStats.sizeKB} KB ({storageStats.count} items)
                  </span>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed">
                  Clearing the application cache purges cached preferences, offline audio assets, and local temporary state. Use this if you experience UI rendering glitches or stale character sheet data.
                </p>

                {cacheClearedSuccess ? (
                  <div className="p-3 bg-emerald-950/90 border border-emerald-500/80 rounded-xl flex items-center gap-2 text-xs text-emerald-200 animate-fadeIn">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Cache successfully cleared! Reloading application...</span>
                  </div>
                ) : showClearCacheConfirm ? (
                  <div className="p-4 bg-rose-950/80 border border-rose-600/80 rounded-xl space-y-3 animate-fadeIn">
                    <div className="flex items-start gap-2.5 text-rose-200 text-xs">
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold text-rose-300 block mb-0.5">Are you sure you want to clear cache?</strong>
                        <span>This will reset local application settings and reload the page. Saved server characters will be re-synced upon login.</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => setShowClearCacheConfirm(false)}
                        className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold rounded-lg transition border border-stone-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleClearCache}
                        className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition shadow flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Yes, Clear Cache & Reload</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowClearCacheConfirm(true)}
                    className="w-full py-2.5 px-4 bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border border-rose-700/60 hover:border-rose-500 rounded-xl font-bold text-xs transition shadow flex items-center justify-center gap-2 group"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400 group-hover:scale-110 transition" />
                    <span>Clear Application Cache</span>
                  </button>
                )}
              </div>

              {/* App Diagnostics / Info Section */}
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-2">
                <div className="flex items-center gap-2 text-stone-300 text-xs font-bold font-serif mb-1">
                  <Info className="w-4 h-4 text-amber-400" />
                  <span>System Information</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-stone-400">
                  <div className="bg-stone-900 p-2 rounded border border-stone-800">
                    <span className="text-stone-500 block text-[10px]">APPLICATION</span>
                    <span className="text-stone-200 font-bold">TRPG Companion</span>
                  </div>
                  <div className="bg-stone-900 p-2 rounded border border-stone-800">
                    <span className="text-stone-500 block text-[10px]">VERSION</span>
                    <span className="text-amber-300 font-bold">v2.5.0-hydra</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY 3: CHARACTER MANAGEMENT (Import, Export & System Conversion) */}
          {activeCategory === 'character' && (
            <div className="space-y-5 animate-fadeIn">
              {!currentUser ? (
                <div className="bg-stone-950 p-6 rounded-xl border border-stone-800 text-center space-y-3">
                  <UserCheck className="w-8 h-8 text-stone-500 mx-auto" />
                  <div className="text-sm font-serif font-bold text-stone-300">Logged Out</div>
                  <p className="text-xs text-stone-400">
                    Please log in or select a user profile to access character backup, export, import, and ruleset conversion tools.
                  </p>
                </div>
              ) : (
                <>
                  {/* CHARACTER IMPORT (Available when logged in) */}
                  <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-800/80 pb-2.5">
                      <div className="flex items-center gap-2 text-amber-400 font-serif font-bold text-sm">
                        <Upload className="w-4 h-4 text-amber-400" />
                        <span>Import Character Sheet</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 font-bold">
                        JSON File
                      </span>
                    </div>
                    <p className="text-xs text-stone-300 leading-relaxed">
                      Load a previously exported <code className="text-amber-300 font-mono">.json</code> character backup file into your active profile.
                    </p>
                    <label
                      className="w-full py-2.5 px-4 bg-amber-950/60 hover:bg-amber-900/80 text-amber-200 border border-amber-600/60 hover:border-amber-400 rounded-xl font-bold text-xs transition shadow flex items-center justify-center gap-2 cursor-pointer group"
                    >
                      <Upload className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                      <span>Select & Import Character JSON File</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                          if (onImportJson) onImportJson(e);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* CHARACTER EXPORT & CONVERSION (Available when character is selected) */}
                  {!activeCharacter ? (
                    <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 text-center space-y-2">
                      <p className="text-xs text-stone-400">
                        💡 Select a character sheet from the top menu to enable <strong>Export</strong> and <strong>Ruleset Conversion</strong> options.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* EXPORT CHARACTER */}
                      <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
                        <div className="flex items-center justify-between border-b border-stone-800/80 pb-2.5">
                          <div className="flex items-center gap-2 text-cyan-400 font-serif font-bold text-sm">
                            <Download className="w-4 h-4 text-cyan-400" />
                            <span>Export {activeCharacter.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-amber-300 bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
                            Backup (.json)
                          </span>
                        </div>
                        <p className="text-xs text-stone-300 leading-relaxed">
                          Download a complete standalone backup file of <strong className="text-amber-300">{activeCharacter.name}</strong> including stats, inventory, spells, and backstory.
                        </p>
                        <button
                          onClick={onExportJson}
                          className="w-full py-2.5 px-4 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-200 border border-cyan-600/60 hover:border-cyan-400 rounded-xl font-bold text-xs transition shadow flex items-center justify-center gap-2 group cursor-pointer"
                        >
                          <Download className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
                          <span>Export {activeCharacter.name} JSON Backup</span>
                        </button>
                      </div>

                      {/* CONVERT RULESET */}
                      <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
                        <div className="flex items-center justify-between border-b border-stone-800/80 pb-2.5">
                          <div className="flex items-center gap-2 text-purple-400 font-serif font-bold text-sm">
                            <RefreshCw className="w-4 h-4 text-purple-400" />
                            <span>Convert {activeCharacter.name}'s TRPG Ruleset</span>
                          </div>
                          <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/60">
                            System Adaptation
                          </span>
                        </div>
                        <p className="text-xs text-stone-300 leading-relaxed">
                          Seamlessly adapt <strong className="text-amber-300">{activeCharacter.name}</strong> to your target TRPG mechanics while preserving gear, backstory, notes, and portrait data.
                        </p>

                        <div className="space-y-2 pt-1">
                          {systemRegistry.getAllSystems().map((sys) => {
                            const isCurrent = (activeCharacter.edition || '5e') === sys.id;

                            return (
                              <button
                                key={sys.id}
                                disabled={isCurrent}
                                onClick={() => {
                                  const updated = convertCharacterEdition(activeCharacter, sys.id);
                                  if (onUpdateCharacter) onUpdateCharacter(updated);
                                  if (onSystemChange) onSystemChange(sys.id);
                                }}
                                className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                                  isCurrent
                                    ? 'bg-stone-900 border-amber-500/50 text-amber-300'
                                    : 'bg-stone-900/60 hover:bg-stone-800/90 border-stone-800 hover:border-purple-500/60 text-stone-200 hover:text-white cursor-pointer'
                                }`}
                              >
                                <div>
                                  <div className="font-serif font-bold text-xs flex items-center gap-2">
                                    <span>{sys.icon} {sys.name} ({sys.shortName})</span>
                                    {isCurrent && (
                                      <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold px-1.5 py-0.2 rounded">
                                        CURRENT
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-stone-400 mt-0.5">{sys.description}</p>
                                </div>
                                {!isCurrent && <ChevronRight className="w-4 h-4 text-purple-400 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between">
          <span className="text-[11px] text-stone-500 font-mono">
            {activeCategory === 'sound'
              ? (muted ? '🔇 Sound disabled' : `🔊 Active (${volume}% volume)`)
              : `⚙️ App Options (${storageStats.sizeKB} KB Cache)`}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs transition shadow"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
