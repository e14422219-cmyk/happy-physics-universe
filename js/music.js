// Background music: a small synthesized tune per world (no audio files), plus a boss theme.
// Notes are scheduled slightly ahead with the Web Audio clock so playback stays steady.
import { store } from './store.js';

// Each world: tempo, root note (MIDI), scale, lead/bass sounds, a 32-step melody (scale degrees, null = rest)
// and an 8-step bass line (degrees). Degrees above the scale length climb into the next octave.
const THEMES = {
  bird: { bpm: 112, root: 67, scale: [0, 2, 4, 7, 9], lead: 'triangle', bass: 'sine', drums: false,
    melody: [0, null, 2, 3, 4, null, 3, 2, 1, null, 2, null, 0, null, null, null, 2, null, 3, 4, 5, null, 4, 3, 2, null, 1, null, 0, null, null, null],
    bassLine: [0, 0, 3, 3, 4, 4, 3, 3] },
  water: { bpm: 84, root: 62, scale: [0, 2, 3, 5, 7, 9, 10], lead: 'sine', bass: 'sine', drums: false,
    melody: [4, null, null, 3, 2, null, 0, null, 2, null, 3, null, 4, null, null, null, 5, null, 4, null, 3, null, 2, null, 1, null, 2, null, 0, null, null, null],
    bassLine: [0, 0, 5, 5, 3, 3, 4, 4] },
  magnet: { bpm: 100, root: 57, scale: [0, 2, 3, 5, 7, 8, 11], lead: 'square', bass: 'triangle', drums: false,
    melody: [0, 2, 4, null, 4, 3, 2, null, 6, null, 4, null, 2, null, null, null, 0, 2, 4, null, 5, 4, 3, null, 2, null, 1, null, 0, null, null, null],
    bassLine: [0, 0, 3, 3, 5, 5, 4, 4] },
  circuit: { bpm: 128, root: 60, scale: [0, 3, 5, 7, 10], lead: 'square', bass: 'sawtooth', drums: true,
    melody: [0, 0, 2, null, 3, null, 2, 0, 4, null, 3, null, 2, null, 0, null, 0, 0, 2, null, 3, null, 4, null, 5, null, 4, 3, 2, null, null, null],
    bassLine: [0, 0, 0, 0, 3, 3, 4, 4] },
  light: { bpm: 92, root: 64, scale: [0, 2, 4, 6, 7, 9, 11], lead: 'sine', bass: 'triangle', drums: false,
    melody: [4, null, 6, null, 7, null, null, null, 6, null, 4, null, 2, null, null, null, 3, null, 4, null, 6, null, 4, null, 2, null, 1, null, 0, null, null, null],
    bassLine: [0, 0, 3, 3, 5, 5, 4, 4] },
  energy: { bpm: 136, root: 62, scale: [0, 2, 4, 5, 7, 9, 11], lead: 'sawtooth', bass: 'square', drums: true,
    melody: [0, 2, 4, 2, 5, null, 4, null, 2, 4, 6, 4, 7, null, null, null, 7, 6, 4, 2, 5, null, 4, null, 2, null, 1, null, 0, null, null, null],
    bassLine: [0, 0, 4, 4, 5, 5, 3, 4] },
  boss: { bpm: 150, root: 52, scale: [0, 1, 3, 5, 7, 8, 10], lead: 'sawtooth', bass: 'square', drums: true,
    melody: [0, null, 0, 1, 0, null, 6, null, 5, null, 4, null, 3, 2, 1, null, 0, null, 0, 1, 2, null, 3, null, 4, 3, 2, null, 1, null, 0, null],
    bassLine: [0, 0, 0, 1, 0, 0, 5, 4] }
};

let ac = null, master = null, timer = 0, theme = null, step = 0, nextTime = 0, current = '';

const midiHz = m => 440 * Math.pow(2, (m - 69) / 12);
const noteOf = (t, deg, oct = 0) => {
  const n = t.scale.length;
  return t.root + t.scale[((deg % n) + n) % n] + 12 * (Math.floor(deg / n) + oct);
};

function ctx() {
  if (!ac) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ac = new C();
    master = ac.createGain();
    master.gain.value = .055;
    master.connect(ac.destination);
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

function voice(freq, at, dur, type, vol) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(vol, at + .015);
  g.gain.exponentialRampToValueAtTime(.0008, at + dur);
  o.connect(g).connect(master);
  o.start(at);
  o.stop(at + dur + .05);
}

function drum(kind, at) {
  if (kind === 'kick') {
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(140, at);
    o.frequency.exponentialRampToValueAtTime(40, at + .18);
    g.gain.setValueAtTime(1.1, at);
    g.gain.exponentialRampToValueAtTime(.001, at + .2);
    o.connect(g).connect(master);
    o.start(at); o.stop(at + .22);
  } else {
    const len = Math.floor(ac.sampleRate * .04), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 6000;
    g.gain.value = .35;
    s.buffer = buf;
    s.connect(f).connect(g).connect(master);
    s.start(at);
  }
}

function schedule() {
  if (!theme) return;
  const spb = 60 / theme.bpm / 2;   // eighth notes
  while (nextTime < ac.currentTime + .15) {
    const i = step % 32;
    const deg = theme.melody[i];
    if (deg != null) voice(midiHz(noteOf(theme, deg, 0)), nextTime, spb * 1.8, theme.lead, theme.lead === 'sine' ? .55 : .32);
    if (i % 4 === 0) {
      const b = theme.bassLine[(i / 4) % 8];
      voice(midiHz(noteOf(theme, b, -2)), nextTime, spb * 3.6, theme.bass, theme.bass === 'sine' ? .7 : .38);
      if (i % 8 === 0) voice(midiHz(noteOf(theme, b + 2, -1)), nextTime, spb * 7, 'sine', .18);   // soft pad
    }
    if (theme.drums) {
      if (i % 4 === 0) drum('kick', nextTime);
      if (i % 2 === 1) drum('hat', nextTime);
    }
    nextTime += spb;
    step++;
  }
}

export function musicOn() { return store.settings.sound && store.settings.music !== false; }

export function playMusic(name) {
  if (!THEMES[name]) return;
  current = name;
  if (!musicOn()) return stopMusic(true);
  if (theme === THEMES[name] && timer) return;
  if (!ctx()) return;
  theme = THEMES[name];
  step = 0;
  nextTime = ac.currentTime + .08;
  master.gain.cancelScheduledValues(ac.currentTime);
  master.gain.setValueAtTime(0, ac.currentTime);
  master.gain.linearRampToValueAtTime(.055, ac.currentTime + 1.2);
  clearInterval(timer);
  timer = setInterval(schedule, 40);
  schedule();
}

export function stopMusic(keepName = false) {
  clearInterval(timer);
  timer = 0;
  theme = null;
  if (!keepName) current = '';
  if (ac && master) {
    master.gain.cancelScheduledValues(ac.currentTime);
    master.gain.setValueAtTime(master.gain.value, ac.currentTime);
    master.gain.linearRampToValueAtTime(0, ac.currentTime + .3);
  }
}

// Called when the player toggles music or sound.
export function refreshMusic() {
  if (musicOn() && current) { const c = current; theme = null; playMusic(c); } else stopMusic(true);
}

document.addEventListener('visibilitychange', () => {
  if (!ac) return;
  if (document.hidden) ac.suspend?.(); else if (timer) ac.resume?.();
});
