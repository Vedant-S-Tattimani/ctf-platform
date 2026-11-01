/**
 * Web Audio API synthesizer matching diallo.digital micro-haptics
 * Creates crisp mechanical relay clicks and subtle cyber atmosphere
 * without downloading any external audio assets.
 */

let audioCtx: AudioContext | null = null;
let ambientOsc: OscillatorNode | null = null;
let ambientGain: GainNode | null = null;
let isAudioEnabled = true; // Enabled by default for intro cord & clicks

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Mechanical relay / switch click sound (used on button hovers, clicks, cord pull)
 */
export function playClickSound(tone: 'low' | 'high' | 'snap' | 'cord' = 'snap') {
  const ctx = getContext();
  if (!ctx) return;

  try {
    if (tone === 'cord') {
      // Dual-layer visceral mechanical pull-switch snap!
      const t = ctx.currentTime;
      
      // Layer 1: High metallic click snap
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(1400, t);
      osc1.frequency.exponentialRampToValueAtTime(120, t + 0.08);
      gain1.gain.setValueAtTime(0.35, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(t);
      osc1.stop(t + 0.1);

      // Layer 2: Deep hollow enclosure thud
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(160, t + 0.01);
      osc2.frequency.exponentialRampToValueAtTime(45, t + 0.15);
      gain2.gain.setValueAtTime(0.28, t + 0.01);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(t + 0.01);
      osc2.stop(t + 0.17);
      return;
    }

    if (!isAudioEnabled) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = tone === 'snap' ? 'triangle' : 'sine';
    const freq = tone === 'high' ? 880 : tone === 'low' ? 220 : 540;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch {
    // ignore audio policy restrictions
  }
}

/**
 * Toggle ambient background cyber drone
 */
export function toggleAmbientAudio(): boolean {
  const ctx = getContext();
  if (!ctx) return false;

  isAudioEnabled = !isAudioEnabled;

  if (isAudioEnabled) {
    try {
      ambientOsc = ctx.createOscillator();
      ambientGain = ctx.createGain();

      ambientOsc.type = 'sine';
      ambientOsc.frequency.setValueAtTime(55, ctx.currentTime); // 55Hz subtle sub-drone

      ambientGain.gain.setValueAtTime(0.001, ctx.currentTime);
      ambientGain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 1.5);

      ambientOsc.connect(ambientGain);
      ambientGain.connect(ctx.destination);
      ambientOsc.start();
    } catch {
      // Audio autoplay restrictions
    }
  } else {
    if (ambientGain && ctx) {
      ambientGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      setTimeout(() => {
        try {
          ambientOsc?.stop();
          ambientOsc?.disconnect();
        } catch {
          // ignore
        }
      }, 550);
    }
  }

  return isAudioEnabled;
}

export function isAudioActive(): boolean {
  return isAudioEnabled;
}
