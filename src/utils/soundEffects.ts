// Web Audio API procedural audio synthesizer for immersive D&D audio effects
let audioCtx: AudioContext | null = null;
let masterGainNode: GainNode | null = null;
let soundEnabled = true;
let soundVolume = 0.8;

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('dnd_sound_enabled', enabled ? 'true' : 'false');
    localStorage.setItem('dnd_dice_sound_enabled', enabled ? 'true' : 'false');
  }
}

export function isSoundEnabled(): boolean {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('dnd_sound_enabled') || localStorage.getItem('dnd_dice_sound_enabled');
    if (stored !== null) return stored === 'true';
  }
  return soundEnabled;
}

export function getMasterVolume(): number {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('dnd_sound_volume');
    if (stored !== null) {
      const parsed = parseFloat(stored);
      if (!isNaN(parsed)) return parsed;
    }
  }
  return soundVolume;
}

export function setMasterVolume(vol: number) {
  const clamped = Math.max(0, Math.min(1, vol));
  soundVolume = clamped;
  if (typeof window !== 'undefined') {
    localStorage.setItem('dnd_sound_volume', clamped.toString());
  }
  if (masterGainNode) {
    masterGainNode.gain.value = clamped;
  }
}

// Re-export for backward compatibility
export const setDiceSoundEnabled = setSoundEnabled;
export const isDiceSoundEnabled = isSoundEnabled;

function getAudioSetup(): { ctx: AudioContext; masterGain: GainNode } | null {
  if (!isSoundEnabled() || getMasterVolume() <= 0) return null;
  try {
    const windowAudio = window as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const AudioContextClass = windowAudio.AudioContext || windowAudio.webkitAudioContext;
    if (!AudioContextClass || typeof AudioContextClass !== 'function') return null;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (!masterGainNode) {
      masterGainNode = audioCtx.createGain();
      masterGainNode.connect(audioCtx.destination);
    }
    masterGainNode.gain.value = getMasterVolume();
    return { ctx: audioCtx, masterGain: masterGainNode };
  } catch (e) {
    console.warn('Could not instantiate AudioContext:', e);
    return null;
  }
}

/**
 * Procedural Dice Rolling Clatter Sound
 */
export function playDiceSound() {
  const audio = getAudioSetup();
  if (!audio) return;
  const { ctx, masterGain } = audio;

  try {
    const now = ctx.currentTime;
    const numTumbles = Math.floor(Math.random() * 3) + 4;
    let delay = 0;

    for (let i = 0; i < numTumbles; i++) {
      const isFinal = i === numTumbles - 1;
      const impactTime = now + delay;

      const bufferSize = Math.floor(ctx.sampleRate * 0.04);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) {
        data[j] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = isFinal ? 1100 + Math.random() * 300 : 1500 + Math.random() * 900;
      filter.Q.value = 3.5;

      const gain = ctx.createGain();
      const volume = isFinal ? 0.32 : 0.12 + Math.random() * 0.15;
      gain.gain.setValueAtTime(volume, impactTime);
      gain.gain.exponentialRampToValueAtTime(0.001, impactTime + (isFinal ? 0.07 : 0.035));

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      noise.start(impactTime);
      noise.stop(impactTime + 0.08);

      delay += 0.05 + Math.random() * 0.05 + (i * 0.012);
    }
  } catch (e) {
    console.warn('playDiceSound error:', e);
  }
}

/**
 * Melee / Ranged Attack Hit Impact Sound
 */
export function playHitSound(isCrit = false) {
  const audio = getAudioSetup();
  if (!audio) return;
  const { ctx, masterGain } = audio;

  try {
    const now = ctx.currentTime;

    // Sub-punch low frequency thump
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isCrit ? 160 : 120, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + (isCrit ? 0.25 : 0.15));

    oscGain.gain.setValueAtTime(isCrit ? 0.5 : 0.35, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + (isCrit ? 0.25 : 0.15));

    osc.connect(oscGain);
    oscGain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.3);

    // Sharp metallic impact burst
    const bufferSize = Math.floor(ctx.sampleRate * (isCrit ? 0.12 : 0.07));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = isCrit ? 1800 : 2200;
    filter.Q.value = 2.0;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(isCrit ? 0.4 : 0.25, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + (isCrit ? 0.12 : 0.07));

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(masterGain);

    noise.start(now);
    noise.stop(now + 0.15);

    // If Critical Hit: Play triumphant ringing chime chord!
    if (isCrit) {
      const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      frequencies.forEach((freq, idx) => {
        const chime = ctx.createOscillator();
        const chimeGain = ctx.createGain();
        chime.type = 'sine';
        chime.frequency.setValueAtTime(freq, now + idx * 0.03);

        const startTime = now + idx * 0.03;
        chimeGain.gain.setValueAtTime(0.18, startTime);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

        chime.connect(chimeGain);
        chimeGain.connect(masterGain);
        chime.start(startTime);
        chime.stop(startTime + 0.55);
      });
    }
  } catch (e) {
    console.warn('playHitSound error:', e);
  }
}

/**
 * Attack Miss / Shield Block / Parry Sound
 */
export function playMissSound() {
  const audio = getAudioSetup();
  if (!audio) return;
  const { ctx, masterGain } = audio;

  try {
    const now = ctx.currentTime;

    // Whoosh noise filter sweep
    const bufferSize = Math.floor(ctx.sampleRate * 0.18);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
    filter.frequency.exponentialRampToValueAtTime(250, now + 0.18);
    filter.Q.value = 1.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    noise.start(now);
    noise.stop(now + 0.2);
  } catch (e) {
    console.warn('playMissSound error:', e);
  }
}

/**
 * Fire / Burning Elemental Sound
 */
export function playFireSound() {
  const audio = getAudioSetup();
  if (!audio) return;
  const { ctx, masterGain } = audio;

  try {
    const now = ctx.currentTime;

    // Fire roar rumble
    const bufferSize = Math.floor(ctx.sampleRate * 0.4);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const roar = ctx.createBufferSource();
    roar.buffer = buffer;

    const roarFilter = ctx.createBiquadFilter();
    roarFilter.type = 'lowpass';
    roarFilter.frequency.setValueAtTime(250, now);
    roarFilter.frequency.linearRampToValueAtTime(600, now + 0.15);
    roarFilter.frequency.exponentialRampToValueAtTime(150, now + 0.4);

    const roarGain = ctx.createGain();
    roarGain.gain.setValueAtTime(0.25, now);
    roarGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    roar.connect(roarFilter);
    roarFilter.connect(roarGain);
    roarGain.connect(masterGain);

    roar.start(now);
    roar.stop(now + 0.42);

    // Fire crackle micro-bursts
    const numCrackles = 6;
    for (let i = 0; i < numCrackles; i++) {
      const crackleTime = now + 0.02 + Math.random() * 0.32;
      const crackleSize = Math.floor(ctx.sampleRate * 0.012);
      const crackleBuf = ctx.createBuffer(1, crackleSize, ctx.sampleRate);
      const cData = crackleBuf.getChannelData(0);
      for (let j = 0; j < crackleSize; j++) {
        cData[j] = Math.random() * 2 - 1;
      }

      const spark = ctx.createBufferSource();
      spark.buffer = crackleBuf;

      const sparkFilter = ctx.createBiquadFilter();
      sparkFilter.type = 'highpass';
      sparkFilter.frequency.value = 3500 + Math.random() * 2500;

      const sparkGain = ctx.createGain();
      sparkGain.gain.setValueAtTime(0.12 + Math.random() * 0.1, crackleTime);
      sparkGain.gain.exponentialRampToValueAtTime(0.001, crackleTime + 0.012);

      spark.connect(sparkFilter);
      sparkFilter.connect(sparkGain);
      sparkGain.connect(masterGain);

      spark.start(crackleTime);
      spark.stop(crackleTime + 0.015);
    }
  } catch (e) {
    console.warn('playFireSound error:', e);
  }
}

/**
 * Cold / Ice Shimmer Freeze Sound
 */
export function playIceColdSound() {
  const audio = getAudioSetup();
  if (!audio) return;
  const { ctx, masterGain } = audio;

  try {
    const now = ctx.currentTime;
    const freqs = [1760, 2637, 3520];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.04);

      const startTime = now + idx * 0.04;
      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(startTime);
      osc.stop(startTime + 0.38);
    });
  } catch (e) {
    console.warn('playIceColdSound error:', e);
  }
}

/**
 * Lightning Crackle & Thunder Sound
 */
export function playLightningSound() {
  const audio = getAudioSetup();
  if (!audio) return;
  const { ctx, masterGain } = audio;

  try {
    const now = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 0.05);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const snap = ctx.createBufferSource();
    snap.buffer = buffer;
    const snapFilter = ctx.createBiquadFilter();
    snapFilter.type = 'highpass';
    snapFilter.frequency.value = 4000;

    const snapGain = ctx.createGain();
    snapGain.gain.setValueAtTime(0.4, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    snap.connect(snapFilter);
    snapFilter.connect(snapGain);
    snapGain.connect(masterGain);
    snap.start(now);
    snap.stop(now + 0.06);

    const thunder = ctx.createOscillator();
    const thunderGain = ctx.createGain();
    thunder.type = 'sawtooth';
    thunder.frequency.setValueAtTime(110, now + 0.03);
    thunder.frequency.exponentialRampToValueAtTime(25, now + 0.4);

    const thunderFilter = ctx.createBiquadFilter();
    thunderFilter.type = 'lowpass';
    thunderFilter.frequency.value = 160;

    thunderGain.gain.setValueAtTime(0.3, now + 0.03);
    thunderGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    thunder.connect(thunderFilter);
    thunderFilter.connect(thunderGain);
    thunderGain.connect(masterGain);
    thunder.start(now + 0.03);
    thunder.stop(now + 0.45);
  } catch (e) {
    console.warn('playLightningSound error:', e);
  }
}

/**
 * Acid / Poison Sizzling Bubble Sound
 */
export function playAcidPoisonSound() {
  const audio = getAudioSetup();
  if (!audio) return;
  const { ctx, masterGain } = audio;

  try {
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(580, now + 0.1);
    osc.frequency.linearRampToValueAtTime(220, now + 0.25);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.3);
  } catch (e) {
    console.warn('playAcidPoisonSound error:', e);
  }
}

/**
 * Generic / Elemental Damage Applied Sound
 */
export function playDamageAppliedSound(damageType?: string) {
  const lower = (damageType || '').toLowerCase();

  if (lower.includes('fire')) {
    playFireSound();
    return;
  }
  if (lower.includes('cold') || lower.includes('ice') || lower.includes('frost')) {
    playIceColdSound();
    return;
  }
  if (lower.includes('lightning') || lower.includes('thunder') || lower.includes('electric')) {
    playLightningSound();
    return;
  }
  if (lower.includes('acid') || lower.includes('poison')) {
    playAcidPoisonSound();
    return;
  }

  // Default Physical Damage Punch Impact
  playHitSound(false);
}

/**
 * Healing Spell / Potion Sound
 */
export function playHealSound() {
  const audio = getAudioSetup();
  if (!audio) return;
  const { ctx, masterGain } = audio;

  try {
    const now = ctx.currentTime;
    const chord = [261.63, 329.63, 392.00, 523.25, 659.25];
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      const startTime = now + idx * 0.05;
      gain.gain.setValueAtTime(0.01, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
  } catch (e) {
    console.warn('playHealSound error:', e);
  }
}

/**
 * Arcane Spellcasting Shimmer Sound
 */
export function playSpellCastSound() {
  const audio = getAudioSetup();
  if (!audio) return;
  const { ctx, masterGain } = audio;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.25);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.32);
  } catch (e) {
    console.warn('playSpellCastSound error:', e);
  }
}

/**
 * Turn Start / Initiative Alert Horn
 */
export function playInitiativeTurnSound() {
  const audio = getAudioSetup();
  if (!audio) return;
  const { ctx, masterGain } = audio;

  try {
    const now = ctx.currentTime;
    const freqs = [293.66, 440.00];
    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.16, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.4);
    });
  } catch (e) {
    console.warn('playInitiativeTurnSound error:', e);
  }
}

/**
 * Level Up Fanfare Victory Sound
 */
export function playLevelUpSound() {
  const audio = getAudioSetup();
  if (!audio) return;
  const { ctx, masterGain } = audio;

  try {
    const now = ctx.currentTime;
    const notes = [
      { f: 261.63, t: 0 },
      { f: 329.63, t: 0.12 },
      { f: 392.00, t: 0.24 },
      { f: 523.25, t: 0.36 }
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now + note.t);

      const startTime = now + note.t;
      const duration = note.t === 0.36 ? 0.6 : 0.15;

      gain.gain.setValueAtTime(0.01, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    });
  } catch (e) {
    console.warn('playLevelUpSound error:', e);
  }
}

/**
 * Death / Unconscious Solemn Tone
 */
export function playDeathSound() {
  const audio = getAudioSetup();
  if (!audio) return;
  const { ctx, masterGain } = audio;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130.81, now);
    osc.frequency.exponentialRampToValueAtTime(65.41, now + 0.6);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, now);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + 0.7);
  } catch (e) {
    console.warn('playDeathSound error:', e);
  }
}
