/**
 * Ambient sound engine — Web Audio API.
 * Each channel is a procedurally generated layer with its own GainNode.
 * Sliders bind to channel.setVolume(0..1) for real-time control.
 */

export type ChannelId =
  | "rain"
  | "thunder"
  | "wind"
  | "ocean"
  | "forest"
  | "crickets"
  | "fireplace"
  | "cafe"
  | "train"
  | "city"
  | "vinyl"
  | "chimes";

interface Channel {
  gain: GainNode;
  nodes: AudioNode[];
  cleanup?: () => void;
  audioEl?: HTMLAudioElement;
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let masterFX: { hp: BiquadFilterNode; lp: BiquadFilterNode; reverbBlock: GainNode } | null = null;
let masterReverb: ConvolverNode | null = null;
export let analyser: AnalyserNode | null = null;
const channels = new Map<ChannelId, Channel>();
let isGlobalPaused = true;

function impulseResponse(duration: number, decay: number) {
  const c = getCtx();
  const len = c.sampleRate * duration;
  const imp = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = imp.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return imp;
}

export function getCtx() {
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;

    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 20;

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 20000;

    masterReverb = ctx.createConvolver();
    masterReverb.buffer = impulseResponse(2.5, 3.5);
    const reverbBlock = ctx.createGain();
    reverbBlock.gain.value = 0;

    master.connect(hp).connect(lp);

    const outGain = ctx.createGain();
    outGain.gain.value = 1.0;

    analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.8;

    lp.connect(outGain);
    lp.connect(masterReverb).connect(reverbBlock).connect(outGain);

    outGain.connect(analyser);
    analyser.connect(ctx.destination);

    masterFX = { hp, lp, reverbBlock };
  }
  return ctx!;
}

/** Pre-generated noise buffers (cached) */
let whiteBuf: AudioBuffer | null = null;
let pinkBuf: AudioBuffer | null = null;
let brownBuf: AudioBuffer | null = null;

function getWhite() {
  if (whiteBuf) return whiteBuf;
  const c = getCtx();
  const len = c.sampleRate * 4;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  whiteBuf = buf;
  return buf;
}
function getPink() {
  if (pinkBuf) return pinkBuf;
  const c = getCtx();
  const len = c.sampleRate * 4;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  let b0 = 0,
    b1 = 0,
    b2 = 0,
    b3 = 0,
    b4 = 0,
    b5 = 0,
    b6 = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856;
    b4 = 0.55 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.016898;
    d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
  pinkBuf = buf;
  return buf;
}
function getBrown() {
  if (brownBuf) return brownBuf;
  const c = getCtx();
  const len = c.sampleRate * 4;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.02 * w) / 1.02;
    d[i] = last * 3.5;
  }
  brownBuf = buf;
  return buf;
}

function noiseSource(buf: AudioBuffer) {
  const c = getCtx();
  const s = c.createBufferSource();
  s.buffer = buf;
  s.loop = true;
  s.start();
  return s;
}

/* —— Channel builders —— */

function makeRain(): Channel {
  const c = getCtx();
  const src = noiseSource(getWhite());
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 800;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 6500;
  const gain = c.createGain();
  gain.gain.value = 0;
  src.connect(hp).connect(lp).connect(gain).connect(master!);
  return { gain, nodes: [src, hp, lp], cleanup: () => src.stop() };
}

function makeWind(): Channel {
  const c = getCtx();
  const src = noiseSource(getBrown());
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 500;
  bp.Q.value = 0.8;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 1200;
  const gain = c.createGain();
  gain.gain.value = 0;
  // LFO for swelling
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.15;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 300;
  lfo.connect(lfoGain).connect(bp.frequency);
  lfo.start();
  src.connect(bp).connect(lp).connect(gain).connect(master!);
  return {
    gain,
    nodes: [src, bp, lp, lfo],
    cleanup: () => {
      src.stop();
      lfo.stop();
    },
  };
}

function makeOcean(): Channel {
  const c = getCtx();
  const src = noiseSource(getBrown());
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 800;
  const gain = c.createGain();
  gain.gain.value = 0;
  const swell = c.createGain();
  swell.gain.value = 0.5;
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.12;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 0.45;
  lfo.connect(lfoGain).connect(swell.gain);
  lfo.start();
  src.connect(lp).connect(swell).connect(gain).connect(master!);
  return {
    gain,
    nodes: [src, lp, swell, lfo],
    cleanup: () => {
      src.stop();
      lfo.stop();
    },
  };
}

function makeThunder(): Channel {
  const c = getCtx();
  const src = noiseSource(getBrown());
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 140;
  const env = c.createGain();
  env.gain.value = 0;
  const gain = c.createGain();
  gain.gain.value = 0;
  src.connect(lp).connect(env).connect(gain).connect(master!);
  let timer: number;
  const trigger = () => {
    if (isGlobalPaused) {
      timer = window.setTimeout(trigger, 1000);
      return;
    }
    const now = c.currentTime;
    env.gain.cancelScheduledValues(now);
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(2.5, now + 0.4);
    env.gain.exponentialRampToValueAtTime(0.001, now + 4 + Math.random() * 3);
    timer = window.setTimeout(trigger, 8000 + Math.random() * 14000);
  };
  timer = window.setTimeout(trigger, 4000);
  return {
    gain,
    nodes: [src, lp, env],
    cleanup: () => {
      src.stop();
      clearTimeout(timer);
    },
  };
}

function makeFireplace(): Channel {
  const c = getCtx();
  const src = noiseSource(getBrown());
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 600;
  const gain = c.createGain();
  gain.gain.value = 0;
  src.connect(lp).connect(gain).connect(master!);
  // crackles
  let timer: number;
  const crackle = () => {
    if (isGlobalPaused) {
      timer = window.setTimeout(crackle, 200);
      return;
    }
    const now = c.currentTime;
    const burst = c.createBufferSource();
    burst.buffer = getWhite();
    const bg = c.createGain();
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2500 + Math.random() * 1500;
    burst.connect(bp).connect(bg).connect(gain);
    bg.gain.setValueAtTime(0.6 + Math.random() * 0.6, now);
    bg.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    burst.start(now);
    burst.stop(now + 0.1);
    timer = window.setTimeout(crackle, 80 + Math.random() * 350);
  };
  timer = window.setTimeout(crackle, 200);
  return {
    gain,
    nodes: [src, lp],
    cleanup: () => {
      src.stop();
      clearTimeout(timer);
    },
  };
}

function makeCafe(): Channel {
  const c = getCtx();
  const src = noiseSource(getPink());
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 450;
  bp.Q.value = 0.6;
  const gain = c.createGain();
  gain.gain.value = 0;
  // mumble LFO modulation
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.7;
  const lfoG = c.createGain();
  lfoG.gain.value = 200;
  lfo.connect(lfoG).connect(bp.frequency);
  lfo.start();
  src.connect(bp).connect(gain).connect(master!);

  // Jabbering / hum of human voices
  let timer: number;
  const jabber = () => {
    if (isGlobalPaused) {
      timer = window.setTimeout(jabber, 300);
      return;
    }
    const now = c.currentTime;
    const b = c.createBufferSource();
    b.buffer = getBrown();
    const g = c.createGain();
    const bp2 = c.createBiquadFilter();
    bp2.type = "bandpass";
    bp2.frequency.value = 400 + Math.random() * 800;
    bp2.Q.value = 2.5;
    b.connect(bp2).connect(g).connect(gain);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.4 + Math.random() * 0.3, now + 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + Math.random() * 0.8);
    b.start(now);
    b.stop(now + 1.5);
    timer = window.setTimeout(jabber, 150 + Math.random() * 600);
  };
  timer = window.setTimeout(jabber, 300);

  return {
    gain,
    nodes: [src, bp, lfo],
    cleanup: () => {
      src.stop();
      lfo.stop();
      clearTimeout(timer);
    },
  };
}

function makeTrain(): Channel {
  const c = getCtx();
  const src = noiseSource(getBrown());
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 220;
  const gain = c.createGain();
  gain.gain.value = 0;
  // slow distance swell
  const swell = c.createGain();
  swell.gain.value = 0.5;
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.05;
  const lfoG = c.createGain();
  lfoG.gain.value = 0.45;
  lfo.connect(lfoG).connect(swell.gain);
  lfo.start();
  // rhythmic clack
  const osc = c.createOscillator();
  osc.frequency.value = 60;
  osc.type = "square";
  const oscG = c.createGain();
  oscG.gain.value = 0;
  const trem = c.createOscillator();
  trem.frequency.value = 2.2;
  const tremG = c.createGain();
  tremG.gain.value = 0.15;
  trem.connect(tremG).connect(oscG.gain);
  trem.start();
  osc.connect(oscG).connect(gain);
  osc.start();
  src.connect(lp).connect(swell).connect(gain).connect(master!);
  return {
    gain,
    nodes: [src, lp, swell, lfo, osc, trem],
    cleanup: () => {
      src.stop();
      lfo.stop();
      osc.stop();
      trem.stop();
    },
  };
}

function makeCity(): Channel {
  const c = getCtx();
  const src = noiseSource(getPink());
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 1800;
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 120;
  const gain = c.createGain();
  gain.gain.value = 0;
  src.connect(hp).connect(lp).connect(gain).connect(master!);

  let timer: number;
  const honk = () => {
    if (isGlobalPaused) {
      timer = window.setTimeout(honk, 1000);
      return;
    }
    const now = c.currentTime;
    const o = c.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = 300 + Math.random() * 200;
    const fHp = c.createBiquadFilter();
    fHp.type = "highpass";
    fHp.frequency.value = 400;
    const fLp = c.createBiquadFilter();
    fLp.type = "lowpass";
    fLp.frequency.value = 2000;
    const g = c.createGain();
    o.connect(fHp).connect(fLp).connect(g).connect(gain);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.04, now + 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + Math.random());
    o.start(now);
    o.stop(now + 2);
    timer = window.setTimeout(honk, 3000 + Math.random() * 8000);
  };
  timer = window.setTimeout(honk, 2000);

  let timer2: number;
  const swoosh = () => {
    if (isGlobalPaused) {
      timer2 = window.setTimeout(swoosh, 1000);
      return;
    }
    const now = c.currentTime;
    const n = c.createBufferSource();
    n.buffer = getPink();
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.setValueAtTime(1200 + Math.random() * 800, now);
    f.frequency.linearRampToValueAtTime(400, now + 1.5);
    const g = c.createGain();
    n.connect(f).connect(g).connect(gain);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.3, now + 0.5);
    g.gain.linearRampToValueAtTime(0, now + 1.5);
    n.start(now);
    n.stop(now + 1.5);
    timer2 = window.setTimeout(swoosh, 2000 + Math.random() * 5000);
  };
  timer2 = window.setTimeout(swoosh, 1000);

  return {
    gain,
    nodes: [src, lp, hp],
    cleanup: () => {
      src.stop();
      clearTimeout(timer);
      clearTimeout(timer2);
    },
  };
}

function makeVinyl(): Channel {
  const c = getCtx();
  const src = noiseSource(getPink());
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1500;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 8000;
  const gain = c.createGain();
  gain.gain.value = 0;
  src.connect(hp).connect(lp).connect(gain).connect(master!);
  // pops
  let timer: number;
  const pop = () => {
    if (isGlobalPaused) {
      timer = window.setTimeout(pop, 500);
      return;
    }
    const now = c.currentTime;
    const b = c.createBufferSource();
    b.buffer = getWhite();
    const g = c.createGain();
    b.connect(g).connect(gain);
    g.gain.setValueAtTime(1.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    b.start(now);
    b.stop(now + 0.03);
    timer = window.setTimeout(pop, 200 + Math.random() * 600);
  };
  timer = window.setTimeout(pop, 500);
  return {
    gain,
    nodes: [src, hp, lp],
    cleanup: () => {
      src.stop();
      clearTimeout(timer);
    },
  };
}

function makeCrickets(): Channel {
  const c = getCtx();
  const gain = c.createGain();
  gain.gain.value = 0;
  gain.connect(master!);
  // chirp generator
  let timer: number;
  const chirp = () => {
    if (isGlobalPaused) {
      timer = window.setTimeout(chirp, 500);
      return;
    }
    const now = c.currentTime;
    const osc = c.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = 4500 + Math.random() * 600;
    const trem = c.createOscillator();
    trem.frequency.value = 38;
    const tremG = c.createGain();
    tremG.gain.value = 0.6;
    const env = c.createGain();
    env.gain.value = 0;
    trem.connect(tremG).connect(env.gain);
    osc.connect(env).connect(gain);
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.15, now + 0.05);
    env.gain.setValueAtTime(0.15, now + 0.3);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.start(now);
    trem.start(now);
    osc.stop(now + 0.55);
    trem.stop(now + 0.55);
    timer = window.setTimeout(chirp, 400 + Math.random() * 800);
  };
  timer = window.setTimeout(chirp, 300);
  return { gain, nodes: [], cleanup: () => clearTimeout(timer) };
}

function makeForest(): Channel {
  const c = getCtx();
  const src = noiseSource(getPink());
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 2000;
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 200;
  const gain = c.createGain();
  gain.gain.value = 0;
  src.connect(hp).connect(lp).connect(gain).connect(master!);
  // occasional bird chirps
  let timer: number;
  const bird = () => {
    if (isGlobalPaused) {
      timer = window.setTimeout(bird, 1000);
      return;
    }
    const now = c.currentTime;
    const o = c.createOscillator();
    o.type = "sine";
    const g = c.createGain();
    g.gain.value = 0;
    o.connect(g).connect(gain);
    const base = 1800 + Math.random() * 1600;
    o.frequency.setValueAtTime(base, now);
    o.frequency.linearRampToValueAtTime(base + 600, now + 0.12);
    o.frequency.linearRampToValueAtTime(base, now + 0.24);
    g.gain.linearRampToValueAtTime(0.18, now + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    o.start(now);
    o.stop(now + 0.3);
    timer = window.setTimeout(bird, 1500 + Math.random() * 4000);
  };
  timer = window.setTimeout(bird, 800);
  return {
    gain,
    nodes: [src, lp, hp],
    cleanup: () => {
      src.stop();
      clearTimeout(timer);
    },
  };
}

function makeChimes(): Channel {
  const c = getCtx();
  const gain = c.createGain();
  gain.gain.value = 0;
  const reverb = c.createDelay();
  reverb.delayTime.value = 0.18;
  const fb = c.createGain();
  fb.gain.value = 0.45;
  reverb.connect(fb).connect(reverb);
  gain.connect(reverb).connect(master!);
  gain.connect(master!);
  const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1318.5];
  let timer: number;
  const ring = () => {
    if (isGlobalPaused) {
      timer = window.setTimeout(ring, 1500);
      return;
    }
    const now = c.currentTime;
    const f = scale[Math.floor(Math.random() * scale.length)];
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    const o2 = c.createOscillator();
    o2.type = "sine";
    o2.frequency.value = f * 2.01;
    const g = c.createGain();
    g.gain.value = 0;
    o.connect(g);
    o2.connect(g);
    g.connect(gain);
    g.gain.linearRampToValueAtTime(0.25, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + 3.2);
    o.start(now);
    o2.start(now);
    o.stop(now + 3.3);
    o2.stop(now + 3.3);
    timer = window.setTimeout(ring, 2500 + Math.random() * 5000);
  };
  timer = window.setTimeout(ring, 1000);
  return { gain, nodes: [reverb, fb], cleanup: () => clearTimeout(timer) };
}

function makeUrlChannel(url: string): Channel {
  const c = getCtx();
  const audio = new Audio(url);
  audio.crossOrigin = "anonymous";
  audio.loop = true;
  audio.volume = 1;
  const src = c.createMediaElementSource(audio);
  const gain = c.createGain();
  gain.gain.value = 0;
  src.connect(gain).connect(master!);
  if (c.state === "running") {
    audio.play().catch(() => {});
  }
  return {
    gain,
    nodes: [src],
    audioEl: audio,
    cleanup: () => {
      audio.pause();
      audio.src = "";
    },
  };
}

const builders: Record<ChannelId, () => Channel> = {
  rain: () => makeUrlChannel("https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg"),
  wind: () => makeUrlChannel("https://actions.google.com/sounds/v1/weather/wind.ogg"),
  ocean: () =>
    makeUrlChannel("https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg"),
  thunder: () => makeUrlChannel("https://actions.google.com/sounds/v1/weather/thunder_crack.ogg"),
  fireplace: () => makeUrlChannel("https://actions.google.com/sounds/v1/ambiences/fire.ogg"),
  cafe: () => makeUrlChannel("https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg"),
  train: () =>
    makeUrlChannel("https://actions.google.com/sounds/v1/transportation/subway_nyc_in_motion.ogg"),
  city: () =>
    makeUrlChannel("https://actions.google.com/sounds/v1/transportation/city_traffic.ogg"),
  vinyl: makeVinyl,
  crickets: () => makeUrlChannel("https://actions.google.com/sounds/v1/ambiences/july_night.ogg"),
  forest: () =>
    makeUrlChannel("https://actions.google.com/sounds/v1/weather/forest_wind_summer.ogg"),
  chimes: makeChimes,
};

export async function ensureStarted() {
  const c = getCtx();
  if (c.state === "suspended") {
    await c.resume();
    channels.forEach((ch) => {
      if (ch.audioEl) ch.audioEl.play().catch(() => {});
    });
  }
}

export function setChannelVolume(id: ChannelId, vol: number) {
  const c = getCtx();
  let ch = channels.get(id);
  if (!ch) {
    ch = builders[id]();
    channels.set(id, ch);
  }
  const target = Math.max(0, Math.min(1, vol)) * 1.0; // remove 0.7 safety cap for file-based ones
  ch.gain.gain.cancelScheduledValues(c.currentTime);
  ch.gain.gain.linearRampToValueAtTime(target, c.currentTime + 0.15);
}

let __masterVol = 1;
let __radioVol = 0;

export function setMasterVolume(vol: number) {
  if (!master) return;
  __masterVol = Math.max(0, Math.min(1, vol));
  if (radioAudio) {
    radioAudio.volume = Math.max(0, Math.min(1, __masterVol * __radioVol));
  }
  const c = getCtx();
  master.gain.cancelScheduledValues(c.currentTime);
  master.gain.linearRampToValueAtTime(__masterVol, c.currentTime + 0.1);
}

export async function setPaused(paused: boolean) {
  isGlobalPaused = paused;
  const c = getCtx();
  if (paused) {
    if (c.state === "running") {
      await c.suspend();
    }
    channels.forEach((ch) => {
      if (ch.audioEl) ch.audioEl.pause();
    });
    if (radioAudio) radioAudio.pause();
  } else {
    if (c.state !== "running") {
      await c.resume();
    }
    channels.forEach((ch) => {
      if (ch.audioEl) ch.audioEl.play().catch(() => {});
    });
    if (radioAudio) radioAudio.play().catch((e) => console.error("Radio play error setPaused:", e));
  }
}

export function isRunning() {
  return ctx?.state === "running";
}

// ------ Radio & Effects ------
let radioAudio: HTMLAudioElement | null = null;
let radioNode: MediaElementAudioSourceNode | null = null;
let radioFilters: { hp: BiquadFilterNode; lp: BiquadFilterNode; reverbBlock: GainNode } | null =
  null;
let radioReverb: ConvolverNode | null = null;
let radioGain: GainNode | null = null;

let retroNoiseNode: AudioBufferSourceNode | null = null;
let retroNoiseGain: GainNode | null = null;
let retroHumNode: OscillatorNode | null = null;
let retroHumGain: GainNode | null = null;

export function updateRetroSimulation(active: boolean, effect: string, masterVol: number = 1.0) {
  const c = getCtx();
  const now = c.currentTime;

  // 1. First, apply master FX (filter + reverb) on ALL system Web Audio (Rain, Forest, Cafe...)
  if (masterFX) {
    const { hp, lp, reverbBlock } = masterFX;
    hp.frequency.cancelScheduledValues(now);
    lp.frequency.cancelScheduledValues(now);
    reverbBlock.gain.cancelScheduledValues(now);

    switch (effect) {
      case "NORMAL":
        hp.frequency.setValueAtTime(20, now);
        lp.frequency.setValueAtTime(20000, now);
        reverbBlock.gain.setValueAtTime(0, now);
        break;
      case "DISTANT":
        hp.frequency.setValueAtTime(450, now);
        lp.frequency.setValueAtTime(1400, now);
        reverbBlock.gain.setValueAtTime(0.55, now);
        break;
      case "TV":
        hp.frequency.setValueAtTime(550, now);
        lp.frequency.setValueAtTime(2800, now);
        reverbBlock.gain.setValueAtTime(0.12, now);
        break;
      case "MUFFLED":
        hp.frequency.setValueAtTime(40, now);
        lp.frequency.setValueAtTime(380, now);
        reverbBlock.gain.setValueAtTime(0.05, now);
        break;
      case "REVERB":
        hp.frequency.setValueAtTime(100, now);
        lp.frequency.setValueAtTime(7500, now);
        reverbBlock.gain.setValueAtTime(0.85, now);
        break;
      case "STATIC":
        hp.frequency.setValueAtTime(750, now);
        lp.frequency.setValueAtTime(3800, now);
        reverbBlock.gain.setValueAtTime(0.15, now);
        break;
    }
  }

  // 2. Clean up existing retro background generation layers
  if (retroNoiseNode) {
    try {
      retroNoiseNode.stop();
    } catch (e) {
      // Ignore if already stopped
    }
    retroNoiseNode = null;
  }
  if (retroNoiseGain) {
    retroNoiseGain.disconnect();
    retroNoiseGain = null;
  }
  if (retroHumNode) {
    try {
      retroHumNode.stop();
    } catch (e) {
      // Ignore if already stopped
    }
    retroHumNode = null;
  }
  if (retroHumGain) {
    retroHumGain.disconnect();
    retroHumGain = null;
  }

  // If not playing or effect is normal, simulation has been cleared, we exit safely
  if (!active || effect === "NORMAL") return;

  // 3. Create real-time physical noise elements to blend with cross-origin audio streams
  retroNoiseGain = c.createGain();
  retroNoiseGain.gain.setValueAtTime(0, now);
  retroNoiseGain.connect(c.destination); // Direct output bypasses masterFX filters so it has crisp physical feeling

  retroHumGain = c.createGain();
  retroHumGain.gain.setValueAtTime(0, now);
  retroHumGain.connect(c.destination);

  let noiseVol = 0;
  let humVol = 0;
  let humFreq = 60; // 60Hz transformer hum

  switch (effect) {
    case "DISTANT":
      noiseVol = 0.03 * masterVol;
      humVol = 0.008 * masterVol;
      humFreq = 120;
      break;
    case "TV":
      noiseVol = 0.06 * masterVol;
      humVol = 0.015 * masterVol;
      humFreq = 15600; // Retro CRT flyback transformer coil-whine
      break;
    case "MUFFLED":
      noiseVol = 0.02 * masterVol;
      humVol = 0.012 * masterVol;
      humFreq = 50; // Deep 50Hz hum
      break;
    case "STATIC":
      noiseVol = 0.18 * masterVol; // Thick radio static
      humVol = 0.03 * masterVol;
      humFreq = 80;
      break;
    case "REVERB":
      noiseVol = 0.008 * masterVol;
      break;
  }

  if (noiseVol > 0) {
    const isStatic = effect === "STATIC";
    const src = c.createBufferSource();
    src.buffer = isStatic ? getWhite() : getPink();

    const noiseFilt = c.createBiquadFilter();
    noiseFilt.type = isStatic ? "bandpass" : "lowpass";
    noiseFilt.frequency.setValueAtTime(isStatic ? 1100 : 750, now);

    src.connect(noiseFilt).connect(retroNoiseGain);
    src.loop = true;
    src.start(now);
    retroNoiseNode = src;

    retroNoiseGain.gain.linearRampToValueAtTime(noiseVol, now + 0.25);
  }

  if (humVol > 0) {
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(humFreq, now);

    osc.connect(retroHumGain);
    osc.start(now);
    retroHumNode = osc;

    retroHumGain.gain.linearRampToValueAtTime(humVol, now + 0.25);
  }
}

export function initRadio() {
  if (radioAudio) return;
  // Skipping Web Audio connection to bypass CORS restrictions
  radioAudio = new Audio();
  radioAudio.preload = "none";
}

export function setRadioSource(url: string) {
  if (radioAudio && radioAudio.src !== url) {
    radioAudio.src = url;
    if (!isGlobalPaused) {
      radioAudio.play().catch((e) => console.error("Radio play error:", e));
    }
  }
}

export function playRadio() {
  if (radioAudio && !isGlobalPaused) {
    radioAudio.play().catch((e) => console.error("Radio play error:", e));
  }
}

export function pauseRadio() {
  if (radioAudio) {
    radioAudio.pause();
  }
}

export function setRadioEffect(effect: string) {
  if (!radioFilters) return;
  const { hp, lp, reverbBlock } = radioFilters;
  const c = getCtx();
  const now = c.currentTime;

  hp.frequency.cancelScheduledValues(now);
  lp.frequency.cancelScheduledValues(now);
  reverbBlock.gain.cancelScheduledValues(now);

  switch (effect) {
    case "NORMAL":
      hp.frequency.setValueAtTime(20, now);
      lp.frequency.setValueAtTime(20000, now);
      reverbBlock.gain.setValueAtTime(0, now);
      break;
    case "DISTANT":
      hp.frequency.setValueAtTime(400, now);
      lp.frequency.setValueAtTime(1500, now);
      reverbBlock.gain.setValueAtTime(0.5, now);
      break;
    case "TV":
      hp.frequency.setValueAtTime(600, now);
      lp.frequency.setValueAtTime(3000, now);
      reverbBlock.gain.setValueAtTime(0.1, now);
      break;
    case "MUFFLED":
      hp.frequency.setValueAtTime(50, now);
      lp.frequency.setValueAtTime(400, now);
      reverbBlock.gain.setValueAtTime(0, now);
      break;
    case "REVERB":
      hp.frequency.setValueAtTime(80, now);
      lp.frequency.setValueAtTime(8000, now);
      reverbBlock.gain.setValueAtTime(0.8, now);
      break;
    case "STATIC":
      // We simulate static by cutting extreme lows, boosting mids, and minimal reverb
      hp.frequency.setValueAtTime(800, now);
      lp.frequency.setValueAtTime(4000, now);
      reverbBlock.gain.setValueAtTime(0.1, now);
      break;
  }
}

export function setRadioVolume(vol: number) {
  __radioVol = Math.max(0, Math.min(1.5, vol));
  console.log("Setting radio volume to", vol, "computed:", __masterVol * __radioVol * 0.7);
  if (radioAudio) {
    radioAudio.volume = Math.max(0, Math.min(1, __masterVol * __radioVol * 0.7)); // Scale down slightly to match balance
  }
}
