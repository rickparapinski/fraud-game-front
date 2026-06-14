// Tiny retro WebAudio bleeps — UI sound effects only.
// Background music stays in AudioController; these are independent one-shots.
let ctx = null;

const ensureCtx = () => {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
};

// square-wave bleep, very Win95
export const bleep = (freq = 880, dur = 0.06, vol = 0.04, type = "square") => {
  try {
    const c = ensureCtx();
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g).connect(c.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.stop(c.currentTime + dur + 0.02);
  } catch {
    /* audio not available */
  }
};

export const sfx = {
  click: () => bleep(660, 0.05),
  type: () => bleep(440, 0.03, 0.02),
  alert: () => {
    bleep(220, 0.12, 0.05, "sawtooth");
    setTimeout(() => bleep(180, 0.15, 0.05, "sawtooth"), 120);
  },
  good: () => {
    bleep(660, 0.07);
    setTimeout(() => bleep(990, 0.1), 80);
  },
  night: () => {
    bleep(520, 0.1, 0.03, "triangle");
    setTimeout(() => bleep(390, 0.14, 0.03, "triangle"), 110);
    setTimeout(() => bleep(260, 0.2, 0.03, "triangle"), 240);
  },
  day: () => {
    bleep(390, 0.1, 0.03, "triangle");
    setTimeout(() => bleep(520, 0.1, 0.03, "triangle"), 110);
    setTimeout(() => bleep(660, 0.16, 0.03, "triangle"), 240);
  },
};
