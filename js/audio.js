// Tiny synthesized sound effects (no audio files needed).
import { store } from './store.js';

let ctx = null;

function ac() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, { type = 'sine', vol = .15, slide = 0, delay = 0 } = {}) {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(.001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0);
  o.stop(t0 + dur + .02);
}

function noise(dur, vol = .2) {
  const a = ac();
  if (!a) return;
  const buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = a.createBufferSource();
  const g = a.createGain();
  g.gain.value = vol;
  s.buffer = buf;
  s.connect(g).connect(a.destination);
  s.start();
}

const SFX = {
  click: () => tone(660, .06, { type: 'triangle', vol: .08 }),
  launch: () => tone(300, .35, { type: 'sawtooth', vol: .07, slide: 500 }),
  hit: () => { noise(.15, .15); tone(140, .15, { type: 'square', vol: .06 }); },
  pop: () => tone(520, .14, { type: 'triangle', vol: .12, slide: 600 }),
  break: () => noise(.25, .2),
  water: () => { noise(.4, .05); tone(200, .3, { vol: .04, slide: -80 }); },
  pin: () => tone(900, .1, { type: 'triangle', vol: .1, slide: -400 }),
  zap: () => tone(120, .2, { type: 'sawtooth', vol: .07, slide: 300 }),
  ding: () => { tone(880, .15, { type: 'triangle', vol: .1 }); tone(1320, .2, { type: 'triangle', vol: .08, delay: .08 }); },
  bad: () => { tone(220, .2, { type: 'square', vol: .07 }); tone(160, .3, { type: 'square', vol: .07, delay: .12 }); },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .25, { type: 'triangle', vol: .1, delay: i * .1 })),
  lose: () => [392, 330, 262].forEach((f, i) => tone(f, .3, { type: 'triangle', vol: .09, delay: i * .14 })),
  star: () => tone(1200, .12, { type: 'sine', vol: .1, slide: 400 })
};

export function sfx(name) {
  if (!store.settings.sound) return;
  try { SFX[name]?.(); } catch { /* audio not available */ }
}
