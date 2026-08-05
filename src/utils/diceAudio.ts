// Web Audio API procedural audio synthesizer for authentic dice rolls
let audioCtx: AudioContext | null = null;
let soundEnabled = true;

export function setDiceSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('dnd_dice_sound_enabled', enabled ? 'true' : 'false');
  }
}

export function isDiceSoundEnabled(): boolean {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('dnd_dice_sound_enabled');
    if (stored !== null) return stored === 'true';
  }
  return soundEnabled;
}

export function playDiceSound() {
  if (!isDiceSoundEnabled()) return;

  try {
    const windowAudio = window as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const AudioContextClass = windowAudio.AudioContext || windowAudio.webkitAudioContext;
    if (!AudioContextClass || typeof AudioContextClass !== 'function') return;

    if (!audioCtx) {
      try {
        audioCtx = new AudioContextClass();
      } catch (e) {
        console.warn('Could not instantiate AudioContext:', e);
        return;
      }
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    // Generate 4 to 6 randomized tumbling impacts over ~0.45 seconds
    const numTumbles = Math.floor(Math.random() * 3) + 4;
    let delay = 0;

    for (let i = 0; i < numTumbles; i++) {
      const isFinal = i === numTumbles - 1;
      const impactTime = now + delay;

      // Noise buffer for impact click
      const bufferSize = Math.floor(audioCtx.sampleRate * 0.04); // 40ms noise burst
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) {
        data[j] = Math.random() * 2 - 1;
      }

      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;

      // Bandpass filter to simulate plastic/wood resonant dice clatter
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = isFinal ? 1100 + Math.random() * 300 : 1500 + Math.random() * 900;
      filter.Q.value = 3.5;

      // Gain envelope
      const gain = audioCtx.createGain();
      const volume = isFinal ? 0.32 : 0.12 + Math.random() * 0.15;
      gain.gain.setValueAtTime(volume, impactTime);
      gain.gain.exponentialRampToValueAtTime(0.001, impactTime + (isFinal ? 0.07 : 0.035));

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      noise.start(impactTime);
      noise.stop(impactTime + 0.08);

      // Spacing gets slightly wider as tumbling slows down
      delay += 0.05 + Math.random() * 0.05 + (i * 0.012);
    }
  } catch (e) {
    console.warn('Dice audio synthesis error:', e);
  }
}
