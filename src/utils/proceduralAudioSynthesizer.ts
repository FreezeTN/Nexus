/**
 * Procedural Web Audio API Soundscape & Tabletop SFX Synthesizer (Phase C)
 * Generates rich, realistic ambient environments and tactile tabletop sound effects
 * 100% locally and offline without requiring external network streams or media files.
 */

export type SoundscapePresetId =
  | 'campfire'
  | 'rain_thunder'
  | 'dungeon_depths'
  | 'astral_plane'
  | 'blizzard_wind'
  | 'arcane_sanctum'
  | 'clockwork_vault'
  | 'tavern_warmth';

export type SfxType =
  | 'dice_roll'
  | 'sword_clash'
  | 'magic_surge'
  | 'critical_hit'
  | 'monster_roar'
  | 'eerie_whisper'
  | 'shield_block';

export interface SoundscapePreset {
  id: SoundscapePresetId;
  name: string;
  category: 'Wilderness' | 'Atmospheric' | 'Mystical' | 'Encounter';
  description: string;
  icon: string;
  color: string;
}

export const SOUNDSCAPE_PRESETS: SoundscapePreset[] = [
  {
    id: 'campfire',
    name: 'Campfire & Night Crickets',
    category: 'Wilderness',
    description: 'Crackling embers, soothing night breeze, and gentle forest crickets.',
    icon: '🔥',
    color: 'from-amber-700 to-orange-950 text-amber-300 border-amber-600/60'
  },
  {
    id: 'rain_thunder',
    name: 'Torrential Rain & Distant Thunder',
    category: 'Wilderness',
    description: 'Steady rainfall patter with low rumbling sub-bass thunder booms.',
    icon: '⛈️',
    color: 'from-cyan-900 to-blue-950 text-cyan-300 border-cyan-600/60'
  },
  {
    id: 'dungeon_depths',
    name: 'Dungeon Depths & Echoing Drips',
    category: 'Atmospheric',
    description: 'Deep resonant cavern hum, stone reverberation, and cold water droplets.',
    icon: '🏰',
    color: 'from-stone-900 to-zinc-950 text-stone-300 border-stone-600/60'
  },
  {
    id: 'astral_plane',
    name: 'Astral Plane & Cosmic Drone',
    category: 'Mystical',
    description: 'Shimmering harmonics, slow ethereal pad phasing, and cosmic resonance.',
    icon: '🌌',
    color: 'from-purple-900 to-indigo-950 text-purple-300 border-purple-600/60'
  },
  {
    id: 'blizzard_wind',
    name: 'Howling Tundra Blizzard',
    category: 'Wilderness',
    description: 'Sub-zero wind sweeps with dynamic gust swells and freezing ambiance.',
    icon: '❄️',
    color: 'from-sky-950 to-blue-950 text-sky-300 border-sky-600/60'
  },
  {
    id: 'arcane_sanctum',
    name: 'Arcane Sanctum & Ley Lines',
    category: 'Mystical',
    description: 'Pulsing crystal energies, soothing sine overtones, and magical vibration.',
    icon: '🔮',
    color: 'from-violet-900 to-fuchsia-950 text-violet-300 border-violet-600/60'
  },
  {
    id: 'clockwork_vault',
    name: 'Clockwork Gearwork Vault',
    category: 'Atmospheric',
    description: 'Interlocking brass escapements, rhythmic pendulum ticks, and steam hiss.',
    icon: '⚙️',
    color: 'from-yellow-950 to-amber-950 text-amber-200 border-amber-600/60'
  },
  {
    id: 'tavern_warmth',
    name: 'Cozy Hearthside Tavern',
    category: 'Atmospheric',
    description: 'Muffled laughter ambiance, clinking flagons, and roaring stone hearth.',
    icon: '🍺',
    color: 'from-amber-900 to-stone-950 text-amber-300 border-amber-600/60'
  }
];

class ProceduralAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private currentPreset: SoundscapePresetId | null = null;
  private isPlaying: boolean = false;
  private activeNodes: Array<{ stop?: () => void; disconnect?: () => void }> = [];
  private intervalTimer: any = null;
  private masterVolume: number = 0.5;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.masterVolume;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getActivePreset(): SoundscapePresetId | null {
    return this.isPlaying ? this.currentPreset : null;
  }

  public stopSoundscape() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    this.activeNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (_) {}
    });
    this.activeNodes = [];
    this.isPlaying = false;
    this.currentPreset = null;
  }

  public startSoundscape(presetId: SoundscapePresetId) {
    this.stopSoundscape();
    const ctx = this.getContext();
    this.currentPreset = presetId;
    this.isPlaying = true;

    switch (presetId) {
      case 'campfire':
        this.buildCampfire(ctx);
        break;
      case 'rain_thunder':
        this.buildRainThunder(ctx);
        break;
      case 'dungeon_depths':
        this.buildDungeonDepths(ctx);
        break;
      case 'astral_plane':
        this.buildAstralPlane(ctx);
        break;
      case 'blizzard_wind':
        this.buildBlizzardWind(ctx);
        break;
      case 'arcane_sanctum':
        this.buildArcaneSanctum(ctx);
        break;
      case 'clockwork_vault':
        this.buildClockworkVault(ctx);
        break;
      case 'tavern_warmth':
        this.buildTavernHearth(ctx);
        break;
    }
  }

  // --- Noise Buffer Generator Utility ---
  private createNoiseBuffer(ctx: AudioContext, seconds: number = 4): AudioBuffer {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // 1. Campfire Ambiance (Crackles + low wind)
  private buildCampfire(ctx: AudioContext) {
    const noiseBuffer = this.createNoiseBuffer(ctx, 5);
    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;

    // Low rumble for warm draft
    const lowFilter = ctx.createBiquadFilter();
    lowFilter.type = 'lowpass';
    lowFilter.frequency.setValueAtTime(140, ctx.currentTime);

    const lowGain = ctx.createGain();
    lowGain.gain.setValueAtTime(0.25, ctx.currentTime);

    noiseNode.connect(lowFilter);
    lowFilter.connect(lowGain);
    if (this.masterGain) lowGain.connect(this.masterGain);
    noiseNode.start();
    this.activeNodes.push(noiseNode, lowGain);

    // Dynamic procedural ember pops and cracks
    this.intervalTimer = setInterval(() => {
      if (!this.isPlaying || !this.masterGain) return;
      if (Math.random() < 0.65) {
        const popOsc = ctx.createOscillator();
        const popGain = ctx.createGain();
        const popFilter = ctx.createBiquadFilter();

        popOsc.type = 'triangle';
        popOsc.frequency.setValueAtTime(400 + Math.random() * 900, ctx.currentTime);
        popOsc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.04);

        popFilter.type = 'bandpass';
        popFilter.frequency.setValueAtTime(1200 + Math.random() * 800, ctx.currentTime);

        const popVolume = 0.05 + Math.random() * 0.15;
        popGain.gain.setValueAtTime(popVolume, ctx.currentTime);
        popGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

        popOsc.connect(popFilter);
        popFilter.connect(popGain);
        popGain.connect(this.masterGain);

        popOsc.start();
        popOsc.stop(ctx.currentTime + 0.05);
      }
    }, 180);
  }

  // 2. Rain & Thunder
  private buildRainThunder(ctx: AudioContext) {
    const noiseBuffer = this.createNoiseBuffer(ctx, 4);
    const rainSource = ctx.createBufferSource();
    rainSource.buffer = noiseBuffer;
    rainSource.loop = true;

    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'bandpass';
    rainFilter.frequency.setValueAtTime(1100, ctx.currentTime);
    rainFilter.Q.setValueAtTime(0.8, ctx.currentTime);

    const rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(0.35, ctx.currentTime);

    rainSource.connect(rainFilter);
    rainFilter.connect(rainGain);
    if (this.masterGain) rainGain.connect(this.masterGain);
    rainSource.start();
    this.activeNodes.push(rainSource, rainGain);

    // Distant Thunder Booms
    this.intervalTimer = setInterval(() => {
      if (!this.isPlaying || !this.masterGain) return;
      if (Math.random() < 0.25) {
        const thunderNoise = ctx.createBufferSource();
        thunderNoise.buffer = noiseBuffer;
        const thunderFilter = ctx.createBiquadFilter();
        thunderFilter.type = 'lowpass';
        thunderFilter.frequency.setValueAtTime(80, ctx.currentTime);
        thunderFilter.frequency.linearRampToValueAtTime(140, ctx.currentTime + 0.8);
        thunderFilter.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 3.5);

        const thunderGain = ctx.createGain();
        thunderGain.gain.setValueAtTime(0.01, ctx.currentTime);
        thunderGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.6);
        thunderGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.8);

        thunderNoise.connect(thunderFilter);
        thunderFilter.connect(thunderGain);
        thunderGain.connect(this.masterGain);

        thunderNoise.start();
        thunderNoise.stop(ctx.currentTime + 4.0);
      }
    }, 4500);
  }

  // 3. Dungeon Depths
  private buildDungeonDepths(ctx: AudioContext) {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(55, ctx.currentTime); // Low A

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(56.2, ctx.currentTime); // Beating detune

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(110, ctx.currentTime);

    gain1.gain.setValueAtTime(0.18, ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain1);
    if (this.masterGain) gain1.connect(this.masterGain);

    osc1.start();
    osc2.start();
    this.activeNodes.push(osc1, osc2, gain1);

    // Water Drip echoes
    this.intervalTimer = setInterval(() => {
      if (!this.isPlaying || !this.masterGain) return;
      if (Math.random() < 0.4) {
        const dripOsc = ctx.createOscillator();
        const dripGain = ctx.createGain();
        dripOsc.type = 'sine';
        dripOsc.frequency.setValueAtTime(1200 + Math.random() * 600, ctx.currentTime);
        dripOsc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);

        dripGain.gain.setValueAtTime(0.06, ctx.currentTime);
        dripGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

        dripOsc.connect(dripGain);
        dripGain.connect(this.masterGain);
        dripOsc.start();
        dripOsc.stop(ctx.currentTime + 0.16);
      }
    }, 1200);
  }

  // 4. Astral Plane
  private buildAstralPlane(ctx: AudioContext) {
    const frequencies = [110, 165, 220, 277.18, 330]; // A major 9 chord
    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 1.5, ctx.currentTime);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.1 + idx * 0.05, ctx.currentTime);
      lfoGain.gain.setValueAtTime(0.04, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);

      osc.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);
      osc.start();
      lfo.start();
      this.activeNodes.push(osc, lfo, gain);
    });
  }

  // 5. Blizzard Wind
  private buildBlizzardWind(ctx: AudioContext) {
    const noiseBuffer = this.createNoiseBuffer(ctx, 6);
    const windSource = ctx.createBufferSource();
    windSource.buffer = noiseBuffer;
    windSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, ctx.currentTime);
    filter.Q.setValueAtTime(2.5, ctx.currentTime);

    // LFO wind sweep
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.2, ctx.currentTime);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(280, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, ctx.currentTime);

    windSource.connect(filter);
    filter.connect(gain);
    if (this.masterGain) gain.connect(this.masterGain);

    windSource.start();
    lfo.start();
    this.activeNodes.push(windSource, lfo, gain);
  }

  // 6. Arcane Sanctum
  private buildArcaneSanctum(ctx: AudioContext) {
    const rootOsc = ctx.createOscillator();
    const fifthOsc = ctx.createOscillator();
    const shimmerOsc = ctx.createOscillator();
    const gain = ctx.createGain();

    rootOsc.type = 'triangle';
    rootOsc.frequency.setValueAtTime(146.83, ctx.currentTime); // D3

    fifthOsc.type = 'sine';
    fifthOsc.frequency.setValueAtTime(220.0, ctx.currentTime); // A3

    shimmerOsc.type = 'sine';
    shimmerOsc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5

    gain.gain.setValueAtTime(0.12, ctx.currentTime);

    rootOsc.connect(gain);
    fifthOsc.connect(gain);
    shimmerOsc.connect(gain);
    if (this.masterGain) gain.connect(this.masterGain);

    rootOsc.start();
    fifthOsc.start();
    shimmerOsc.start();
    this.activeNodes.push(rootOsc, fifthOsc, shimmerOsc, gain);
  }

  // 7. Clockwork Vault
  private buildClockworkVault(ctx: AudioContext) {
    const humOsc = ctx.createOscillator();
    const humGain = ctx.createGain();
    humOsc.type = 'sawtooth';
    humOsc.frequency.setValueAtTime(65, ctx.currentTime);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(160, ctx.currentTime);

    humGain.gain.setValueAtTime(0.15, ctx.currentTime);
    humOsc.connect(filter);
    filter.connect(humGain);
    if (this.masterGain) humGain.connect(this.masterGain);
    humOsc.start();
    this.activeNodes.push(humOsc, humGain);

    // Clock ticks
    let tick = 0;
    this.intervalTimer = setInterval(() => {
      if (!this.isPlaying || !this.masterGain) return;
      tick++;
      const tickOsc = ctx.createOscillator();
      const tickGain = ctx.createGain();
      tickOsc.type = 'square';
      tickOsc.frequency.setValueAtTime(tick % 2 === 0 ? 880 : 660, ctx.currentTime);
      tickGain.gain.setValueAtTime(0.04, ctx.currentTime);
      tickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);

      tickOsc.connect(tickGain);
      tickGain.connect(this.masterGain);
      tickOsc.start();
      tickOsc.stop(ctx.currentTime + 0.03);
    }, 600);
  }

  // 8. Tavern Hearth
  private buildTavernHearth(ctx: AudioContext) {
    const noiseBuffer = this.createNoiseBuffer(ctx, 4);
    const chatter = ctx.createBufferSource();
    chatter.buffer = noiseBuffer;
    chatter.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, ctx.currentTime);
    filter.Q.setValueAtTime(1.2, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, ctx.currentTime);

    chatter.connect(filter);
    filter.connect(gain);
    if (this.masterGain) gain.connect(this.masterGain);
    chatter.start();
    this.activeNodes.push(chatter, gain);
  }

  // --- Dynamic Tabletop Sound Effects (SFX) ---
  public playSfx(sfx: SfxType) {
    const ctx = this.getContext();
    if (this.isMuted || !this.masterGain) return;

    switch (sfx) {
      case 'dice_roll': {
        for (let i = 0; i < 4; i++) {
          setTimeout(() => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300 + Math.random() * 400, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.04);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
            osc.connect(gain);
            gain.connect(this.masterGain!);
            osc.start();
            osc.stop(ctx.currentTime + 0.05);
          }, i * 45);
        }
        break;
      }
      case 'sword_clash': {
        const noise = ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(ctx, 0.5);
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2500, ctx.currentTime);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start();
        noise.stop(ctx.currentTime + 0.4);
        break;
      }
      case 'magic_surge': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
        break;
      }
      case 'critical_hit': {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          setTimeout(() => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc.connect(gain);
            gain.connect(this.masterGain!);
            osc.start();
            osc.stop(ctx.currentTime + 0.45);
          }, idx * 60);
        });
        break;
      }
      case 'monster_roar': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(90, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.75);
        break;
      }
      case 'shield_block': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
        break;
      }
      case 'eerie_whisper': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(420, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.55);
        break;
      }
    }
  }
}

export const proceduralAudio = new ProceduralAudioEngine();
