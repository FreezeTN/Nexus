import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Volume1,
  Sparkles,
  Swords,
  Shield,
  Zap,
  Flame,
  Radio,
  Dices,
  Play,
  Square,
  Sliders,
  Skull
} from 'lucide-react';
import {
  proceduralAudio,
  SOUNDSCAPE_PRESETS,
  SoundscapePresetId,
  SfxType
} from '../../utils/proceduralAudioSynthesizer';

interface SoundscapePanelProps {
  compact?: boolean;
}

export const SoundscapePanel: React.FC<SoundscapePanelProps> = ({ compact = false }) => {
  const [activePreset, setActivePreset] = useState<SoundscapePresetId | null>(proceduralAudio.getActivePreset());
  const [volume, setVolume] = useState<number>(proceduralAudio.getVolume());
  const [isMuted, setIsMuted] = useState<boolean>(proceduralAudio.getIsMuted());

  useEffect(() => {
    const checkState = () => {
      setActivePreset(proceduralAudio.getActivePreset());
      setIsMuted(proceduralAudio.getIsMuted());
    };
    const interval = setInterval(checkState, 800);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSoundscape = (id: SoundscapePresetId) => {
    if (activePreset === id) {
      proceduralAudio.stopSoundscape();
      setActivePreset(null);
    } else {
      proceduralAudio.startSoundscape(id);
      setActivePreset(id);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    proceduralAudio.setVolume(val);
    if (isMuted && val > 0) {
      setIsMuted(false);
    }
  };

  const handleToggleMute = () => {
    const muted = proceduralAudio.toggleMute();
    setIsMuted(muted);
  };

  const handlePlaySfx = (sfx: SfxType) => {
    proceduralAudio.playSfx(sfx);
  };

  if (compact) {
    return (
      <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleMute}
            className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 transition cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
          </button>
          <span className="font-serif font-bold text-stone-300 truncate">
            {activePreset ? SOUNDSCAPE_PRESETS.find(p => p.id === activePreset)?.name : 'Procedural Soundscapes (Offline)'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {activePreset && (
            <button
              onClick={() => {
                proceduralAudio.stopSoundscape();
                setActivePreset(null);
              }}
              className="px-2 py-0.5 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-700/50 text-rose-300 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
            >
              <Square className="w-2.5 h-2.5 fill-current" />
              Stop
            </button>
          )}

          <div className="flex items-center gap-1">
            {SOUNDSCAPE_PRESETS.slice(0, 3).map((p) => (
              <button
                key={p.id}
                onClick={() => handleToggleSoundscape(p.id)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition cursor-pointer border ${
                  activePreset === p.id
                    ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold shadow'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
                }`}
                title={p.description}
              >
                {p.icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-900/95 border border-stone-800/90 rounded-2xl p-4 shadow-xl space-y-4">
      {/* Header & Master Volume */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-600/40 text-amber-400">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-serif font-bold text-amber-200 flex items-center gap-2">
              <span>Procedural Soundscape Synthesizer</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                100% Offline
              </span>
            </h3>
            <p className="text-[11px] text-stone-400">
              Synthesized environmental audio layers generated in real-time via Web Audio API.
            </p>
          </div>
        </div>

        {/* Volume Slider & Mute */}
        <div className="flex items-center gap-3 bg-stone-950/80 px-3 py-1.5 rounded-xl border border-stone-800">
          <button
            onClick={handleToggleMute}
            className="text-stone-400 hover:text-amber-300 transition cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 accent-amber-500 cursor-pointer h-1.5 bg-stone-800 rounded-lg appearance-none"
            title={`Volume: ${Math.round(volume * 100)}%`}
          />
          <span className="text-[10px] font-mono text-stone-400 w-7 text-right">
            {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
          </span>
        </div>
      </div>

      {/* Soundscape Presets Grid */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-serif font-bold text-stone-300">Ambient Soundscape Environments</span>
          {activePreset && (
            <button
              onClick={() => {
                proceduralAudio.stopSoundscape();
                setActivePreset(null);
              }}
              className="text-[11px] text-rose-400 hover:text-rose-300 font-mono font-bold flex items-center gap-1 cursor-pointer"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop Active Ambience</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {SOUNDSCAPE_PRESETS.map((preset) => {
            const isSelected = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleToggleSoundscape(preset.id)}
                className={`p-3 rounded-xl border text-left transition relative overflow-hidden group cursor-pointer ${
                  isSelected
                    ? `bg-gradient-to-br ${preset.color} ring-2 ring-amber-400/80 shadow-lg`
                    : 'bg-stone-950/70 border-stone-800 hover:border-stone-700 hover:bg-stone-900/80 text-stone-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-lg">{preset.icon}</span>
                  {isSelected ? (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                  ) : (
                    <Play className="w-3.5 h-3.5 text-stone-600 group-hover:text-stone-400" />
                  )}
                </div>
                <div className="font-serif font-bold text-xs leading-tight mb-1 truncate">
                  {preset.name}
                </div>
                <div className="text-[10px] text-stone-400 line-clamp-2 leading-relaxed opacity-80">
                  {preset.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tactile SFX Soundboard */}
      <div className="pt-2 border-t border-stone-800">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-serif font-bold text-stone-300">Tactile Tabletop Sound Effects (SFX)</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          <button
            onClick={() => handlePlaySfx('dice_roll')}
            className="p-2 rounded-xl bg-stone-950/80 hover:bg-amber-950/50 border border-stone-800 hover:border-amber-600/50 text-stone-300 hover:text-amber-200 transition flex flex-col items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
          >
            <Dices className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-serif font-medium">Dice Clatter</span>
          </button>

          <button
            onClick={() => handlePlaySfx('sword_clash')}
            className="p-2 rounded-xl bg-stone-950/80 hover:bg-rose-950/50 border border-stone-800 hover:border-rose-600/50 text-stone-300 hover:text-rose-200 transition flex flex-col items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
          >
            <Swords className="w-4 h-4 text-rose-400" />
            <span className="text-[10px] font-serif font-medium">Sword Strike</span>
          </button>

          <button
            onClick={() => handlePlaySfx('magic_surge')}
            className="p-2 rounded-xl bg-stone-950/80 hover:bg-purple-950/50 border border-stone-800 hover:border-purple-600/50 text-stone-300 hover:text-purple-200 transition flex flex-col items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
          >
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="text-[10px] font-serif font-medium">Magic Surge</span>
          </button>

          <button
            onClick={() => handlePlaySfx('critical_hit')}
            className="p-2 rounded-xl bg-stone-950/80 hover:bg-emerald-950/50 border border-stone-800 hover:border-emerald-600/50 text-stone-300 hover:text-emerald-200 transition flex flex-col items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-serif font-medium">Crit Fanfare</span>
          </button>

          <button
            onClick={() => handlePlaySfx('shield_block')}
            className="p-2 rounded-xl bg-stone-950/80 hover:bg-cyan-950/50 border border-stone-800 hover:border-cyan-600/50 text-stone-300 hover:text-cyan-200 transition flex flex-col items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
          >
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-serif font-medium">Shield Block</span>
          </button>

          <button
            onClick={() => handlePlaySfx('monster_roar')}
            className="p-2 rounded-xl bg-stone-950/80 hover:bg-red-950/50 border border-stone-800 hover:border-red-600/50 text-stone-300 hover:text-red-200 transition flex flex-col items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
          >
            <Skull className="w-4 h-4 text-red-400" />
            <span className="text-[10px] font-serif font-medium">Monster Roar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
