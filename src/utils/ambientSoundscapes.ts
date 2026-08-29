// Procedural Ambient Soundscape Engine powered by Web Audio API
// Generates continuous, zero-dependency atmospheric soundscapes for tabletop campaigns

export interface AmbientTrack {
  id: string;
  name: string;
  subtitle: string;
  category: 'cozy' | 'explore' | 'mystic' | 'danger';
  requiredTier: 'free' | 'hero' | 'guild';
  icon: string; // lucide icon identifier
  description: string;
  color: string;
}

export const AMBIENT_TRACKS: AmbientTrack[] = [
  {
    id: 'tavern',
    name: 'Tavern Hearth',
    subtitle: 'Warm fire, chatter murmurs & cozy alehouse',
    category: 'cozy',
    requiredTier: 'free',
    icon: 'Flame',
    description: 'A welcoming refuge with crackling hearthwood embers, warm low murmurs, and rustic comfort.',
    color: 'amber'
  },
  {
    id: 'dungeon',
    name: 'Subterranean Depths',
    subtitle: 'Dark cavern drone, distant echo & stone drips',
    category: 'explore',
    requiredTier: 'hero',
    icon: 'Compass',
    description: 'Eerie low reverberations, deep cavern winds, and echoing water droplets in forgotten catacombs.',
    color: 'stone'
  },
  {
    id: 'storm',
    name: 'Tempest & Downpour',
    subtitle: 'Heavy rainwash, howling gale & distant thunder',
    category: 'explore',
    requiredTier: 'hero',
    icon: 'CloudRain',
    description: 'A relentless thunderstorm with sweeping wind gusts and deep sub-bass rolling thunder.',
    color: 'cyan'
  },
  {
    id: 'forest',
    name: 'Enchanted Forest Night',
    subtitle: 'Canopy breeze, nocturnal crickets & night chimes',
    category: 'mystic',
    requiredTier: 'hero',
    icon: 'Trees',
    description: 'A mystical woodland illuminated by moonlight, gentle canopy rustles, and soothing nocturnal life.',
    color: 'emerald'
  },
  {
    id: 'campfire',
    name: 'Wilderness Bivouac',
    subtitle: 'Open starfield breeze & lively snapping sparks',
    category: 'cozy',
    requiredTier: 'hero',
    icon: 'Tent',
    description: 'Rest under open skies beside a lively campsite fire with crisp wood pops and nighttime quiet.',
    color: 'orange'
  },
  {
    id: 'astral',
    name: 'Astral Sanctum',
    subtitle: 'Meditative singing bowls & celestial shimmer',
    category: 'mystic',
    requiredTier: 'hero',
    icon: 'Sparkles',
    description: 'Harmonic singing bowl chords, ethereal cosmic shimmer, and meditative resonant frequencies.',
    color: 'purple'
  },
  {
    id: 'combat',
    name: 'War Drums & Tension',
    subtitle: 'Pounding heartbeat rhythm & ominous war drone',
    category: 'danger',
    requiredTier: 'hero',
    icon: 'Swords',
    description: 'A high-stakes combat pulse with rhythmic low-frequency war toms and sharp tension sweeps.',
    color: 'rose'
  }
];

export interface ActiveAmbienceState {
  trackId: string;
  isPlaying: boolean;
  intensity?: 'calm' | 'medium' | 'high';
  presetName?: string;
  changedBy?: string;
  updatedAt?: string;
}

// Global Audio Engine Context
let audioCtx: AudioContext | null = null;
let masterAmbienceGain: GainNode | null = null;
let currentTrackId: string | null = null;
let isEnginePlaying = false;
let personalVolume = 0.65;
let currentIntensity: 'calm' | 'medium' | 'high' = 'medium';

// Active nodes cleaner
let activeIntervals: number[] = [];
let activeSources: { stop: () => void }[] = [];

// Local Storage Keys
const STORAGE_KEY_TRACK = 'dnd_ambient_track_id';
const STORAGE_KEY_PLAYING = 'dnd_ambient_is_playing';
const STORAGE_KEY_VOL = 'dnd_ambient_personal_volume';
const STORAGE_KEY_SYNC = 'dnd_ambient_sync_enabled';

// Listeners
type AmbienceListener = (state: {
  trackId: string;
  isPlaying: boolean;
  intensity: 'calm' | 'medium' | 'high';
  personalVolume: number;
}) => void;
const listeners = new Set<AmbienceListener>();

function notifyListeners() {
  const state = {
    trackId: currentTrackId || 'tavern',
    isPlaying: isEnginePlaying,
    intensity: currentIntensity,
    personalVolume
  };
  listeners.forEach((fn) => {
    try {
      fn(state);
    } catch (e) {
      console.warn('Ambience listener error:', e);
    }
  });
}

export function subscribeToAmbienceState(listener: AmbienceListener): () => void {
  listeners.add(listener);
  // Initial fire
  listener({
    trackId: currentTrackId || 'tavern',
    isPlaying: isEnginePlaying,
    intensity: currentIntensity,
    personalVolume
  });
  return () => {
    listeners.delete(listener);
  };
}

function getAudioContext(): AudioContext | null {
  try {
    const windowAudio = window as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const AudioContextClass = windowAudio.AudioContext || windowAudio.webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (!masterAmbienceGain) {
      masterAmbienceGain = audioCtx.createGain();
      masterAmbienceGain.connect(audioCtx.destination);
      masterAmbienceGain.gain.setValueAtTime(personalVolume, audioCtx.currentTime);
    }
    return audioCtx;
  } catch (e) {
    console.warn('Could not initialize Web Audio for Ambience:', e);
    return null;
  }
}

/**
 * Stop and clean up all currently running sound nodes
 */
export function stopCurrentSoundscape(fadeTime = 0.5) {
  // Clear periodic intervals
  activeIntervals.forEach((id) => window.clearInterval(id));
  activeIntervals = [];

  // Gracefully stop audio sources
  if (masterAmbienceGain && audioCtx) {
    const now = audioCtx.currentTime;
    masterAmbienceGain.gain.setValueAtTime(masterAmbienceGain.gain.value, now);
    masterAmbienceGain.gain.exponentialRampToValueAtTime(0.0001, now + fadeTime);
  }

  setTimeout(() => {
    activeSources.forEach((s) => {
      try {
        s.stop();
      } catch (e) {}
    });
    activeSources = [];
  }, fadeTime * 1000 + 50);

  isEnginePlaying = false;
  notifyListeners();
}

/**
 * Noise buffer generator helper
 */
function createNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const bufferSize = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0.0;

  // Generate pink/brown mixed natural noise
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    lastOut = (lastOut + 0.02 * white) / 1.02;
    data[i] = lastOut * 3.5;
  }
  return buffer;
}

// -------------------------------------------------------------
// SOUNDSCAPE GENERATORS (Pure Web Audio API procedural synthesis)
// -------------------------------------------------------------

/**
 * 1. TAVERN HEARTH SOUNDSCAPE
 */
function startTavernHearth(ctx: AudioContext, master: GainNode, intensity: string) {
  const mult = intensity === 'high' ? 1.3 : intensity === 'calm' ? 0.7 : 1.0;

  // Layer 1: Fireplace low rumble
  const noiseBuf = createNoiseBuffer(ctx, 4);
  const roar = ctx.createBufferSource();
  roar.buffer = noiseBuf;
  roar.loop = true;

  const roarFilter = ctx.createBiquadFilter();
  roarFilter.type = 'lowpass';
  roarFilter.frequency.value = 280;

  const roarGain = ctx.createGain();
  roarGain.gain.value = 0.28 * mult;

  roar.connect(roarFilter);
  roarFilter.connect(roarGain);
  roarGain.connect(master);
  roar.start();
  activeSources.push(roar);

  // Layer 2: Warm room acoustic hum
  const humOsc = ctx.createOscillator();
  humOsc.type = 'triangle';
  humOsc.frequency.value = 110; // A2

  const humGain = ctx.createGain();
  humGain.gain.value = 0.04 * mult;

  humOsc.connect(humGain);
  humGain.connect(master);
  humOsc.start();
  activeSources.push(humOsc);

  // Layer 3: Dynamic fire crackle & pops (Periodic randomized triggers)
  const crackleInterval = window.setInterval(() => {
    if (!isEnginePlaying) return;
    try {
      const now = ctx.currentTime;
      const popCount = Math.floor(Math.random() * 3) + 1;

      for (let p = 0; p < popCount; p++) {
        const popTime = now + Math.random() * 0.4;
        const popBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.015), ctx.sampleRate);
        const data = popBuf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

        const pop = ctx.createBufferSource();
        pop.buffer = popBuf;

        const popFilter = ctx.createBiquadFilter();
        popFilter.type = 'highpass';
        popFilter.frequency.value = 3000 + Math.random() * 2500;

        const popGain = ctx.createGain();
        popGain.gain.setValueAtTime(0.12 * mult, popTime);
        popGain.gain.exponentialRampToValueAtTime(0.001, popTime + 0.015);

        pop.connect(popFilter);
        popFilter.connect(popGain);
        popGain.connect(master);
        pop.start(popTime);
        pop.stop(popTime + 0.02);
      }
    } catch (e) {}
  }, 400);
  activeIntervals.push(crackleInterval);

  // Layer 4: Distant gentle glass/tankard clinks
  const clinkInterval = window.setInterval(() => {
    if (!isEnginePlaying || Math.random() > 0.4) return;
    try {
      const now = ctx.currentTime;
      const clink = ctx.createOscillator();
      clink.type = 'sine';
      clink.frequency.value = 2400 + Math.random() * 1200;

      const clinkGain = ctx.createGain();
      clinkGain.gain.setValueAtTime(0.03 * mult, now);
      clinkGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      clink.connect(clinkGain);
      clinkGain.connect(master);
      clink.start(now);
      clink.stop(now + 0.15);
    } catch (e) {}
  }, 3500);
  activeIntervals.push(clinkInterval);
}

/**
 * 2. DUNGEON DEPTHS SOUNDSCAPE
 */
function startDungeonDepths(ctx: AudioContext, master: GainNode, intensity: string) {
  const mult = intensity === 'high' ? 1.3 : intensity === 'calm' ? 0.7 : 1.0;

  // Layer 1: Sub-bass dark cavern drone (65 Hz + 98 Hz with slow beat frequency)
  const drone1 = ctx.createOscillator();
  drone1.type = 'sawtooth';
  drone1.frequency.value = 65.4; // C2

  const drone1Filter = ctx.createBiquadFilter();
  drone1Filter.type = 'lowpass';
  drone1Filter.frequency.value = 130;

  const drone1Gain = ctx.createGain();
  drone1Gain.gain.value = 0.16 * mult;

  drone1.connect(drone1Filter);
  drone1Filter.connect(drone1Gain);
  drone1Gain.connect(master);
  drone1.start();
  activeSources.push(drone1);

  // Layer 2: Hollow air movement (Swept bandpass noise)
  const airBuf = createNoiseBuffer(ctx, 5);
  const air = ctx.createBufferSource();
  air.buffer = airBuf;
  air.loop = true;

  const airFilter = ctx.createBiquadFilter();
  airFilter.type = 'bandpass';
  airFilter.frequency.value = 320;
  airFilter.Q.value = 3.0;

  // LFO to slowly sweep cavern wind
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.12; // 8 second cycle
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 150;
  lfo.connect(lfoGain);
  lfoGain.connect(airFilter.frequency);
  lfo.start();
  activeSources.push(lfo);

  const airGain = ctx.createGain();
  airGain.gain.value = 0.2 * mult;

  air.connect(airFilter);
  airFilter.connect(airGain);
  airGain.connect(master);
  air.start();
  activeSources.push(air);

  // Layer 3: Echoing water drips
  const dripInterval = window.setInterval(() => {
    if (!isEnginePlaying) return;
    try {
      const now = ctx.currentTime;
      const dripFreq = 1200 + Math.random() * 800;
      
      const drip = ctx.createOscillator();
      drip.type = 'sine';
      drip.frequency.setValueAtTime(dripFreq, now);
      drip.frequency.exponentialRampToValueAtTime(dripFreq * 1.5, now + 0.04);
      drip.frequency.exponentialRampToValueAtTime(dripFreq * 0.8, now + 0.1);

      const dripGain = ctx.createGain();
      dripGain.gain.setValueAtTime(0.08 * mult, now);
      dripGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      drip.connect(dripGain);
      dripGain.connect(master);
      drip.start(now);
      drip.stop(now + 0.3);
    } catch (e) {}
  }, 2200);
  activeIntervals.push(dripInterval);
}

/**
 * 3. TEMPEST & RAIN SOUNDSCAPE
 */
function startTempestRain(ctx: AudioContext, master: GainNode, intensity: string) {
  const mult = intensity === 'high' ? 1.4 : intensity === 'calm' ? 0.6 : 1.0;

  // Layer 1: Continuous rain wash (Filtered noise)
  const rainBuf = createNoiseBuffer(ctx, 4);
  const rain = ctx.createBufferSource();
  rain.buffer = rainBuf;
  rain.loop = true;

  const rainFilter = ctx.createBiquadFilter();
  rainFilter.type = 'lowpass';
  rainFilter.frequency.value = 1400;

  const rainGain = ctx.createGain();
  rainGain.gain.value = 0.35 * mult;

  rain.connect(rainFilter);
  rainFilter.connect(rainGain);
  rainGain.connect(master);
  rain.start();
  activeSources.push(rain);

  // Layer 2: Howling wind gusts
  const windBuf = createNoiseBuffer(ctx, 6);
  const wind = ctx.createBufferSource();
  wind.buffer = windBuf;
  wind.loop = true;

  const windFilter = ctx.createBiquadFilter();
  windFilter.type = 'bandpass';
  windFilter.frequency.value = 450;
  windFilter.Q.value = 2.5;

  const windLfo = ctx.createOscillator();
  windLfo.frequency.value = 0.15;
  const windLfoGain = ctx.createGain();
  windLfoGain.gain.value = 280;
  windLfo.connect(windLfoGain);
  windLfoGain.connect(windFilter.frequency);
  windLfo.start();
  activeSources.push(windLfo);

  const windGain = ctx.createGain();
  windGain.gain.value = 0.22 * mult;

  wind.connect(windFilter);
  windFilter.connect(windGain);
  windGain.connect(master);
  wind.start();
  activeSources.push(wind);

  // Layer 3: Rolling distant thunder
  const thunderInterval = window.setInterval(() => {
    if (!isEnginePlaying || Math.random() > 0.6) return;
    try {
      const now = ctx.currentTime;
      const th = ctx.createOscillator();
      th.type = 'sawtooth';
      th.frequency.setValueAtTime(80, now);
      th.frequency.exponentialRampToValueAtTime(25, now + 1.2);

      const thFilter = ctx.createBiquadFilter();
      thFilter.type = 'lowpass';
      thFilter.frequency.value = 140;

      const thGain = ctx.createGain();
      thGain.gain.setValueAtTime(0.01, now);
      thGain.gain.linearRampToValueAtTime(0.28 * mult, now + 0.15);
      thGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

      th.connect(thFilter);
      thFilter.connect(thGain);
      thGain.connect(master);
      th.start(now);
      th.stop(now + 1.5);
    } catch (e) {}
  }, 7000);
  activeIntervals.push(thunderInterval);
}

/**
 * 4. ENCHANTED FOREST NIGHT SOUNDSCAPE
 */
function startForestNight(ctx: AudioContext, master: GainNode, intensity: string) {
  const mult = intensity === 'high' ? 1.2 : intensity === 'calm' ? 0.7 : 1.0;

  // Layer 1: Canopy breeze (Soft pink noise)
  const breezeBuf = createNoiseBuffer(ctx, 4);
  const breeze = ctx.createBufferSource();
  breeze.buffer = breezeBuf;
  breeze.loop = true;

  const breezeFilter = ctx.createBiquadFilter();
  breezeFilter.type = 'bandpass';
  breezeFilter.frequency.value = 650;
  breezeFilter.Q.value = 1.2;

  const breezeGain = ctx.createGain();
  breezeGain.gain.value = 0.15 * mult;

  breeze.connect(breezeFilter);
  breezeFilter.connect(breezeGain);
  breezeGain.connect(master);
  breeze.start();
  activeSources.push(breeze);

  // Layer 2: Crickets pulse
  const cricketInterval = window.setInterval(() => {
    if (!isEnginePlaying) return;
    try {
      const now = ctx.currentTime;
      const chirps = 3;
      for (let c = 0; c < chirps; c++) {
        const cTime = now + c * 0.06;
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = 4600 + Math.random() * 400;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.025 * mult, cTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, cTime + 0.04);

        osc.connect(gain);
        gain.connect(master);
        osc.start(cTime);
        osc.stop(cTime + 0.05);
      }
    } catch (e) {}
  }, 1400);
  activeIntervals.push(cricketInterval);

  // Layer 3: Mystical soft harmonic night chime
  const chimeInterval = window.setInterval(() => {
    if (!isEnginePlaying || Math.random() > 0.5) return;
    try {
      const now = ctx.currentTime;
      const freqs = [880, 1174.66, 1318.51, 1760]; // A5, D6, E6, A6
      const f = freqs[Math.floor(Math.random() * freqs.length)];

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.02 * mult, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 1.3);
    } catch (e) {}
  }, 4500);
  activeIntervals.push(chimeInterval);
}

/**
 * 5. WILDERNESS CAMPFIRE SOUNDSCAPE
 */
function startCampfire(ctx: AudioContext, master: GainNode, intensity: string) {
  const mult = intensity === 'high' ? 1.3 : intensity === 'calm' ? 0.7 : 1.0;

  // Layer 1: Open wilderness wind
  const windBuf = createNoiseBuffer(ctx, 4);
  const wind = ctx.createBufferSource();
  wind.buffer = windBuf;
  wind.loop = true;

  const windFilter = ctx.createBiquadFilter();
  windFilter.type = 'lowpass';
  windFilter.frequency.value = 350;

  const windGain = ctx.createGain();
  windGain.gain.value = 0.18 * mult;

  wind.connect(windFilter);
  windFilter.connect(windGain);
  windGain.connect(master);
  wind.start();
  activeSources.push(wind);

  // Layer 2: Campfire snapping logs
  const crackleInterval = window.setInterval(() => {
    if (!isEnginePlaying) return;
    try {
      const now = ctx.currentTime;
      const popBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.02), ctx.sampleRate);
      const data = popBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

      const pop = ctx.createBufferSource();
      pop.buffer = popBuf;

      const popFilter = ctx.createBiquadFilter();
      popFilter.type = 'bandpass';
      popFilter.frequency.value = 2800 + Math.random() * 2200;
      popFilter.Q.value = 4.0;

      const popGain = ctx.createGain();
      popGain.gain.setValueAtTime(0.14 * mult, now);
      popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      pop.connect(popFilter);
      popFilter.connect(popGain);
      popGain.connect(master);
      pop.start(now);
      pop.stop(now + 0.03);
    } catch (e) {}
  }, 250);
  activeIntervals.push(crackleInterval);
}

/**
 * 6. ASTRAL SANCTUM SOUNDSCAPE
 */
function startAstralSanctum(ctx: AudioContext, master: GainNode, intensity: string) {
  const mult = intensity === 'high' ? 1.3 : intensity === 'calm' ? 0.7 : 1.0;

  // Layer 1: Meditative harmonic singing bowl drone (Chords in D minor: D3, F3, A3, C4)
  const chordFreqs = [146.83, 174.61, 220.00, 261.63];
  chordFreqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    // Slow vibrato shimmer
    const vib = ctx.createOscillator();
    vib.frequency.value = 0.2 + idx * 0.05;
    const vibGain = ctx.createGain();
    vibGain.gain.value = 1.2;
    vib.connect(vibGain);
    vibGain.connect(osc.frequency);
    vib.start();
    activeSources.push(vib);

    const gain = ctx.createGain();
    gain.gain.value = 0.06 * mult;

    osc.connect(gain);
    gain.connect(master);
    osc.start();
    activeSources.push(osc);
  });

  // Layer 2: Ethereal celestial chimes
  const bowlInterval = window.setInterval(() => {
    if (!isEnginePlaying) return;
    try {
      const now = ctx.currentTime;
      const chFreqs = [587.33, 880.00, 1046.50, 1174.66]; // D5, A5, C6, D6
      const freq = chFreqs[Math.floor(Math.random() * chFreqs.length)];

      const bowl = ctx.createOscillator();
      bowl.type = 'sine';
      bowl.frequency.value = freq;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.06 * mult, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);

      bowl.connect(gain);
      gain.connect(master);
      bowl.start(now);
      bowl.stop(now + 3.8);
    } catch (e) {}
  }, 4000);
  activeIntervals.push(bowlInterval);
}

/**
 * 7. WAR DRUMS & COMBAT TENSION SOUNDSCAPE
 */
function startWarDrums(ctx: AudioContext, master: GainNode, intensity: string) {
  const mult = intensity === 'high' ? 1.4 : intensity === 'calm' ? 0.7 : 1.0;

  // Layer 1: Low menacing brass/sawtooth tension drone
  const brass = ctx.createOscillator();
  brass.type = 'sawtooth';
  brass.frequency.value = 55; // A1

  const brassFilter = ctx.createBiquadFilter();
  brassFilter.type = 'lowpass';
  brassFilter.frequency.value = 160;

  const brassGain = ctx.createGain();
  brassGain.gain.value = 0.18 * mult;

  brass.connect(brassFilter);
  brassFilter.connect(brassGain);
  brassGain.connect(master);
  brass.start();
  activeSources.push(brass);

  // Layer 2: Rhythmic heartbeat war drum (100 BPM = 600ms period)
  let drumBeat = 0;
  const drumInterval = window.setInterval(() => {
    if (!isEnginePlaying) return;
    try {
      const now = ctx.currentTime;
      const isStrong = drumBeat % 4 === 0;
      drumBeat++;

      // Sub-kick punch
      const kick = ctx.createOscillator();
      kick.type = 'sine';
      kick.frequency.setValueAtTime(isStrong ? 110 : 85, now);
      kick.frequency.exponentialRampToValueAtTime(28, now + (isStrong ? 0.35 : 0.22));

      const kickGain = ctx.createGain();
      kickGain.gain.setValueAtTime(isStrong ? 0.42 * mult : 0.25 * mult, now);
      kickGain.gain.exponentialRampToValueAtTime(0.0001, now + (isStrong ? 0.38 : 0.25));

      kick.connect(kickGain);
      kickGain.connect(master);
      kick.start(now);
      kick.stop(now + 0.4);

      // Snare / metal armor rattle on strong beats
      if (isStrong) {
        const rattleBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.08), ctx.sampleRate);
        const rData = rattleBuf.getChannelData(0);
        for (let i = 0; i < rData.length; i++) rData[i] = Math.random() * 2 - 1;

        const rattle = ctx.createBufferSource();
        rattle.buffer = rattleBuf;

        const rFilter = ctx.createBiquadFilter();
        rFilter.type = 'bandpass';
        rFilter.frequency.value = 1800;

        const rGain = ctx.createGain();
        rGain.gain.setValueAtTime(0.12 * mult, now);
        rGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

        rattle.connect(rFilter);
        rFilter.connect(rGain);
        rGain.connect(master);
        rattle.start(now);
        rattle.stop(now + 0.1);
      }
    } catch (e) {}
  }, 600);
  activeIntervals.push(drumInterval);
}

// -------------------------------------------------------------
// PUBLIC CONTROL API
// -------------------------------------------------------------

/**
 * Play a specific ambient track with optional intensity
 */
export function playAmbientTrack(trackId: string, intensity: 'calm' | 'medium' | 'high' = 'medium') {
  const ctx = getAudioContext();
  if (!ctx || !masterAmbienceGain) return;

  // Stop any currently running soundscape
  stopCurrentSoundscape(0.3);

  currentTrackId = trackId;
  currentIntensity = intensity;
  isEnginePlaying = true;

  // Persist locally
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_TRACK, trackId);
    localStorage.setItem(STORAGE_KEY_PLAYING, 'true');
  }

  // Smooth fade-in
  const now = ctx.currentTime;
  masterAmbienceGain.gain.cancelScheduledValues(now);
  masterAmbienceGain.gain.setValueAtTime(0.0001, now);
  masterAmbienceGain.gain.linearRampToValueAtTime(personalVolume, now + 0.8);

  // Dispatch corresponding generator
  switch (trackId) {
    case 'tavern':
      startTavernHearth(ctx, masterAmbienceGain, intensity);
      break;
    case 'dungeon':
      startDungeonDepths(ctx, masterAmbienceGain, intensity);
      break;
    case 'storm':
      startTempestRain(ctx, masterAmbienceGain, intensity);
      break;
    case 'forest':
      startForestNight(ctx, masterAmbienceGain, intensity);
      break;
    case 'campfire':
      startCampfire(ctx, masterAmbienceGain, intensity);
      break;
    case 'astral':
      startAstralSanctum(ctx, masterAmbienceGain, intensity);
      break;
    case 'combat':
      startWarDrums(ctx, masterAmbienceGain, intensity);
      break;
    default:
      startTavernHearth(ctx, masterAmbienceGain, intensity);
      break;
  }

  notifyListeners();
}

/**
 * Toggle Ambient audio Play/Pause
 */
export function toggleAmbientPlayback(): boolean {
  if (isEnginePlaying) {
    stopCurrentSoundscape(0.4);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_PLAYING, 'false');
    }
    return false;
  } else {
    const track = currentTrackId || (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_TRACK) : null) || 'tavern';
    playAmbientTrack(track, currentIntensity);
    return true;
  }
}

/**
 * Set personal user volume for ambient music (0.0 to 1.0)
 */
export function setAmbiencePersonalVolume(vol: number) {
  const clamped = Math.max(0, Math.min(1, vol));
  personalVolume = clamped;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_VOL, clamped.toString());
  }
  if (masterAmbienceGain && audioCtx && isEnginePlaying) {
    masterAmbienceGain.gain.setTargetAtTime(clamped, audioCtx.currentTime, 0.1);
  }
  notifyListeners();
}

export function getAmbiencePersonalVolume(): number {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEY_VOL);
    if (raw !== null) {
      const v = parseFloat(raw);
      if (!isNaN(v)) return v;
    }
  }
  return personalVolume;
}

export function getCurrentAmbientTrackId(): string {
  if (!currentTrackId && typeof window !== 'undefined') {
    return localStorage.getItem(STORAGE_KEY_TRACK) || 'tavern';
  }
  return currentTrackId || 'tavern';
}

export function isAmbiencePlaying(): boolean {
  return isEnginePlaying;
}

export function getAmbienceIntensity(): 'calm' | 'medium' | 'high' {
  return currentIntensity;
}

export function setAmbienceIntensity(intensity: 'calm' | 'medium' | 'high') {
  currentIntensity = intensity;
  if (isEnginePlaying && currentTrackId) {
    playAmbientTrack(currentTrackId, intensity);
  } else {
    notifyListeners();
  }
}

// Campaign DM Synchronization Hook
export async function syncCampaignAmbienceState(
  sessionCode: string,
  state: ActiveAmbienceState,
  isDm: boolean
): Promise<void> {
  if (!sessionCode || !isDm) return;
  try {
    const { updateSessionAmbience } = await import('../lib/firebase');
    await updateSessionAmbience(sessionCode, {
      trackId: state.trackId,
      isPlaying: state.isPlaying,
      intensity: state.intensity || 'medium',
      presetName: state.presetName,
      changedBy: state.changedBy,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Could not sync ambient state to campaign session in Firestore:', err);
  }
}
