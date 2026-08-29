import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
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
  RadioTower,
  Sliders,
  CheckCircle2
} from 'lucide-react';
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
  playLevelUpSound,
  playDeathSound
} from '../../../utils/soundEffects';
import { UserProfile, GameSession } from '../../../lib/firebase';

interface SoundOptionsTabProps {
  currentUser?: UserProfile | null;
  activeSession?: GameSession | null;
  onOpenUpgradeModal?: (reason?: string, tier?: 'hero' | 'guild') => void;
}

export const SoundOptionsTab: React.FC<SoundOptionsTabProps> = ({
  currentUser,
  activeSession
}) => {
  // SFX State
  const [sfxMuted, setSfxMuted] = useState<boolean>(!isSoundEnabled());
  const [sfxVolume, setSfxVolumeState] = useState<number>(() => Math.round(getMasterVolume() * 100));
  const [lastPlayedSfx, setLastPlayedSfx] = useState<string | null>(null);

  const handleToggleSfxMute = () => {
    const next = !sfxMuted;
    setSfxMuted(next);
    setSoundEnabled(!next);
  };

  const handleSfxVolumeChange = (newPct: number) => {
    setSfxVolumeState(newPct);
    setMasterVolume(newPct / 100);
    if (newPct > 0 && sfxMuted) {
      setSfxMuted(false);
      setSoundEnabled(true);
    } else if (newPct === 0 && !sfxMuted) {
      setSfxMuted(true);
      setSoundEnabled(false);
    }
  };

  const playTest = (name: string, fn: () => void) => {
    if (sfxMuted) {
      setSfxMuted(false);
      setSoundEnabled(true);
    }
    setLastPlayedSfx(name);
    fn();
    setTimeout(() => {
      setLastPlayedSfx(null);
    }, 700);
  };

  return (
    <div className="space-y-6 text-stone-200">
      {/* Active Campaign Ambience Info Notice */}
      {activeSession?.activeAmbience?.embedUrl && (
        <div className="bg-stone-950 p-4 rounded-2xl border border-amber-900/50 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-950 border border-amber-600/50 text-amber-400 rounded-xl">
              <RadioTower className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-serif font-bold text-amber-200 flex items-center gap-2">
                <span>Campaign Ambience Stream: </span>
                <span className="text-stone-300 font-sans font-normal">
                  {activeSession.activeAmbience.title || 'Live Stream'}
                </span>
                <span className="text-[10px] font-mono uppercase bg-stone-800 text-amber-400 px-1.5 py-0.5 rounded border border-stone-700">
                  {activeSession.activeAmbience.sourceType || 'Stream'}
                </span>
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Campaign music is managed directly from the <strong>DM Overview</strong> tab and syncs live across all connected party members.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MASTER TABLETOP SOUND EFFECTS (SFX) & SYNTHESIZERS                 */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-stone-950 p-4 sm:p-5 rounded-2xl border border-stone-800 space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-stone-900 border border-stone-700 text-amber-400 rounded-xl">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-200 text-sm">
                Tabletop Sound Effects (SFX)
              </h3>
              <p className="text-xs text-stone-400">
                Action triggers, critical hits, damage elements & polyhedral clatter
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleSfxMute}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              sfxMuted
                ? 'bg-rose-950/80 text-rose-300 border-rose-700/60 hover:bg-rose-900'
                : 'bg-stone-900 text-stone-300 border-stone-700 hover:bg-stone-800'
            }`}
          >
            {sfxMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            <span>{sfxMuted ? 'SFX Muted' : 'SFX Active'}</span>
          </button>
        </div>

        {/* Master SFX Volume Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-300 font-medium">Master SFX Volume</span>
            <span className="font-mono font-bold text-amber-300">{sfxMuted ? '0% (Muted)' : `${sfxVolume}%`}</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={sfxMuted ? 0 : sfxVolume}
            onChange={(e) => handleSfxVolumeChange(Number(e.target.value))}
            className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />

          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { label: 'Mute', pct: 0 },
              { label: '25%', pct: 25 },
              { label: '50%', pct: 50 },
              { label: '75%', pct: 75 },
              { label: 'Max (100%)', pct: 100 }
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleSfxVolumeChange(preset.pct)}
                className={`px-2 py-1 text-[11px] font-mono font-bold rounded-lg transition border cursor-pointer ${
                  (!sfxMuted && sfxVolume === preset.pct) || (sfxMuted && preset.pct === 0)
                    ? 'bg-amber-500 text-stone-950 border-amber-400 shadow'
                    : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200 hover:bg-stone-800'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sound FX Preview Grid */}
        <div className="space-y-2.5 pt-2">
          <div className="text-xs font-bold uppercase tracking-wider text-stone-400 font-serif flex items-center justify-between">
            <span>Preview & Test Sound Effects</span>
            <span className="text-[10px] text-stone-500 font-mono">Real-time Web Audio Synthesizer</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => playTest('dice', playDiceSound)}
              className={`p-2.5 bg-stone-900/90 hover:bg-stone-800 border border-stone-700/80 rounded-xl text-left transition flex items-center gap-2 group cursor-pointer ${
                lastPlayedSfx === 'dice' ? 'border-amber-400 bg-amber-950/60 ring-2 ring-amber-500/50' : ''
              }`}
            >
              <Dices className="w-4 h-4 text-amber-400 shrink-0 group-hover:scale-110 transition" />
              <div className="truncate">
                <div className="text-xs font-bold text-stone-200 truncate">Dice Roll</div>
                <div className="text-[10px] text-stone-400">Polyhedral clatter</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => playTest('hit', () => playHitSound(false))}
              className={`p-2.5 bg-stone-900/90 hover:bg-stone-800 border border-stone-700/80 rounded-xl text-left transition flex items-center gap-2 group cursor-pointer ${
                lastPlayedSfx === 'hit' ? 'border-amber-400 bg-amber-950/60 ring-2 ring-amber-500/50' : ''
              }`}
            >
              <Sword className="w-4 h-4 text-amber-500 shrink-0 group-hover:scale-110 transition" />
              <div className="truncate">
                <div className="text-xs font-bold text-stone-200 truncate">Weapon Hit</div>
                <div className="text-[10px] text-stone-400">Melee / Ranged</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => playTest('crit', () => playHitSound(true))}
              className={`p-2.5 bg-stone-900/90 hover:bg-stone-800 border border-stone-700/80 rounded-xl text-left transition flex items-center gap-2 group cursor-pointer ${
                lastPlayedSfx === 'crit' ? 'border-amber-400 bg-amber-950/60 ring-2 ring-amber-500/50' : ''
              }`}
            >
              <Sparkles className="w-4 h-4 text-yellow-400 shrink-0 group-hover:scale-110 transition" />
              <div className="truncate">
                <div className="text-xs font-bold text-stone-200 truncate">Critical Hit</div>
                <div className="text-[10px] text-stone-400">Victory chord</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => playTest('miss', playMissSound)}
              className={`p-2.5 bg-stone-900/90 hover:bg-stone-800 border border-stone-700/80 rounded-xl text-left transition flex items-center gap-2 group cursor-pointer ${
                lastPlayedSfx === 'miss' ? 'border-amber-400 bg-amber-950/60 ring-2 ring-amber-500/50' : ''
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 group-hover:scale-110 transition" />
              <div className="truncate">
                <div className="text-xs font-bold text-stone-200 truncate">Miss / Parry</div>
                <div className="text-[10px] text-stone-400">Shield whoosh</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => playTest('fire', playFireSound)}
              className={`p-2.5 bg-stone-900/90 hover:bg-stone-800 border border-stone-700/80 rounded-xl text-left transition flex items-center gap-2 group cursor-pointer ${
                lastPlayedSfx === 'fire' ? 'border-amber-400 bg-amber-950/60 ring-2 ring-amber-500/50' : ''
              }`}
            >
              <Flame className="w-4 h-4 text-orange-400 shrink-0 group-hover:scale-110 transition" />
              <div className="truncate">
                <div className="text-xs font-bold text-stone-200 truncate">Fire Effect</div>
                <div className="text-[10px] text-stone-400">Flame burst</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => playTest('ice', playIceColdSound)}
              className={`p-2.5 bg-stone-900/90 hover:bg-stone-800 border border-stone-700/80 rounded-xl text-left transition flex items-center gap-2 group cursor-pointer ${
                lastPlayedSfx === 'ice' ? 'border-amber-400 bg-amber-950/60 ring-2 ring-amber-500/50' : ''
              }`}
            >
              <Snowflake className="w-4 h-4 text-cyan-400 shrink-0 group-hover:scale-110 transition" />
              <div className="truncate">
                <div className="text-xs font-bold text-stone-200 truncate">Cold / Frost</div>
                <div className="text-[10px] text-stone-400">Glacial chime</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => playTest('lightning', playLightningSound)}
              className={`p-2.5 bg-stone-900/90 hover:bg-stone-800 border border-stone-700/80 rounded-xl text-left transition flex items-center gap-2 group cursor-pointer ${
                lastPlayedSfx === 'lightning' ? 'border-amber-400 bg-amber-950/60 ring-2 ring-amber-500/50' : ''
              }`}
            >
              <Zap className="w-4 h-4 text-blue-400 shrink-0 group-hover:scale-110 transition" />
              <div className="truncate">
                <div className="text-xs font-bold text-stone-200 truncate">Lightning</div>
                <div className="text-[10px] text-stone-400">Electric crackle</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => playTest('acid', playAcidPoisonSound)}
              className={`p-2.5 bg-stone-900/90 hover:bg-stone-800 border border-stone-700/80 rounded-xl text-left transition flex items-center gap-2 group cursor-pointer ${
                lastPlayedSfx === 'acid' ? 'border-amber-400 bg-amber-950/60 ring-2 ring-amber-500/50' : ''
              }`}
            >
              <FlaskConical className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition" />
              <div className="truncate">
                <div className="text-xs font-bold text-stone-200 truncate">Acid / Poison</div>
                <div className="text-[10px] text-stone-400">Sizzling bubble</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => playTest('heal', playHealSound)}
              className={`p-2.5 bg-stone-900/90 hover:bg-stone-800 border border-stone-700/80 rounded-xl text-left transition flex items-center gap-2 group cursor-pointer ${
                lastPlayedSfx === 'heal' ? 'border-amber-400 bg-amber-950/60 ring-2 ring-amber-500/50' : ''
              }`}
            >
              <HeartPulse className="w-4 h-4 text-rose-400 shrink-0 group-hover:scale-110 transition" />
              <div className="truncate">
                <div className="text-xs font-bold text-stone-200 truncate">Healing Spell</div>
                <div className="text-[10px] text-stone-400">Radiant arpeggio</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => playTest('spell', playSpellCastSound)}
              className={`p-2.5 bg-stone-900/90 hover:bg-stone-800 border border-stone-700/80 rounded-xl text-left transition flex items-center gap-2 group cursor-pointer ${
                lastPlayedSfx === 'spell' ? 'border-amber-400 bg-amber-950/60 ring-2 ring-amber-500/50' : ''
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0 group-hover:scale-110 transition" />
              <div className="truncate">
                <div className="text-xs font-bold text-stone-200 truncate">Spell Cast</div>
                <div className="text-[10px] text-stone-400">Arcane sweep</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => playTest('level', playLevelUpSound)}
              className={`p-2.5 bg-stone-900/90 hover:bg-stone-800 border border-stone-700/80 rounded-xl text-left transition flex items-center gap-2 group cursor-pointer ${
                lastPlayedSfx === 'level' ? 'border-amber-400 bg-amber-950/60 ring-2 ring-amber-500/50' : ''
              }`}
            >
              <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition" />
              <div className="truncate">
                <div className="text-xs font-bold text-stone-200 truncate">Level Up</div>
                <div className="text-[10px] text-stone-400">Fanfare</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => playTest('death', playDeathSound)}
              className={`p-2.5 bg-stone-900/90 hover:bg-stone-800 border border-stone-700/80 rounded-xl text-left transition flex items-center gap-2 group cursor-pointer ${
                lastPlayedSfx === 'death' ? 'border-amber-400 bg-amber-950/60 ring-2 ring-amber-500/50' : ''
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
    </div>
  );
};
