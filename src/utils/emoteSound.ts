type SoundFn = (ctx: AudioContext) => void;

function tone(
  ctx: AudioContext,
  freq: number,
  type: OscillatorType,
  startTime: number,
  duration: number,
  volume = 0.25,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}

const SOUND_MAP: Record<string, SoundFn> = {
  // 😂  two quick ascending beeps
  '😂': (ctx) => {
    tone(ctx, 660, 'sine', ctx.currentTime, 0.15, 0.25);
    tone(ctx, 880, 'sine', ctx.currentTime + 0.18, 0.15, 0.25);
  },

  // 😤  low buzzy descending growl
  '😤': (ctx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  },

  // 🤔  rise then fall (questioning)
  '🤔': (ctx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(330, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(500, ctx.currentTime + 0.2);
    osc.frequency.linearRampToValueAtTime(380, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  },

  // 😎  smooth descending triangle
  '😎': (ctx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  },

  // 💀  ominous low two-note drop
  '💀': (ctx) => {
    tone(ctx, 220, 'sine', ctx.currentTime, 0.5, 0.2);
    tone(ctx, 165, 'sine', ctx.currentTime + 0.1, 0.45, 0.15);
  },

  // 🔥  filtered noise burst
  '🔥': (ctx) => {
    const sampleRate = ctx.sampleRate;
    const frames = Math.floor(sampleRate * 0.3);
    const buffer = ctx.createBuffer(1, frames, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 0.8;
    const gain = ctx.createGain();
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    source.start();
    source.stop(ctx.currentTime + 0.35);
  },

  // 👑  triumphant ascending arpeggio (C–E–G)
  '👑': (ctx) => {
    tone(ctx, 523, 'triangle', ctx.currentTime,        0.25, 0.3);
    tone(ctx, 659, 'triangle', ctx.currentTime + 0.13, 0.25, 0.3);
    tone(ctx, 784, 'triangle', ctx.currentTime + 0.26, 0.35, 0.3);
  },

  // 💸  cha-ching: high tick then lower tone
  '💸': (ctx) => {
    tone(ctx, 1400, 'sine', ctx.currentTime,       0.07, 0.3);
    tone(ctx, 900,  'sine', ctx.currentTime + 0.1, 0.18, 0.25);
  },

  // 🎰  rapid ascending blips
  '🎰': (ctx) => {
    [392, 494, 587, 698, 880].forEach((freq, i) => {
      tone(ctx, freq, 'square', ctx.currentTime + i * 0.07, 0.09, 0.15);
    });
  },

  // 🤡  wobbly vibrato slide down
  '🤡': (ctx) => {
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const gain = ctx.createGain();
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    lfo.frequency.value = 9;
    lfoGain.gain.value = 35;
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    lfo.start();
    osc.start();
    lfo.stop(ctx.currentTime + 0.55);
    osc.stop(ctx.currentTime + 0.55);
  },
};

export function playEmoteSound(emoji: string): void {
  try {
    const ctx = new AudioContext();
    const fn = SOUND_MAP[emoji];
    if (fn) fn(ctx);
    setTimeout(() => ctx.close(), 2000);
  } catch {
    // audio unavailable — fail silently
  }
}
