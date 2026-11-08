// Rescue the King: Water Kingdom — Fluid Pressure and Buoyancy
import { T, L } from '../i18n.js';
import { W } from '../engine.js';
import { clamp, fmt, Particles, roundRect, label, starsByAttempt } from '../util.js';
import { drawKing } from '../art.js';

const PPM = 100;          // 100 px = 1 m
const G = 9.8;
const HOLE = 18;          // effective opening of a fully open valve (px) for Torricelli flow

// Real liquids. visc scales the flow through a valve: thick liquids (honey, glycerin) pour slowly.
const LIQ = {
  mercury: { rho: 13600, visc: 1, color: '#9aa4b5', top: '#eef2f7', name: { en: 'Mercury', ar: 'زئبق' } },
  honey: { rho: 1420, visc: .2, color: '#e39b12', top: '#ffd66b', name: { en: 'Honey', ar: 'عسل' } },
  glycerin: { rho: 1260, visc: .35, color: '#9fd8cf', top: '#e8fffb', name: { en: 'Glycerin', ar: 'جلسرين' } },
  salt: { rho: 1200, visc: 1, color: '#1971c2', top: '#74c0fc', name: { en: 'Salt water', ar: 'ماء مالح' } },
  water: { rho: 1000, visc: 1, color: '#2ec4f1', top: '#a5ecff', name: { en: 'Water', ar: 'ماء' } },
  oil: { rho: 920, visc: .6, color: '#f2c31b', top: '#fff0a8', name: { en: 'Cooking oil', ar: 'زيت طبخ' } },
  kerosene: { rho: 800, visc: .9, color: '#ef8fb0', top: '#ffd1e0', name: { en: 'Kerosene', ar: 'كيروسين' } }
};
const ORDER = Object.keys(LIQ).sort((a, b) => LIQ[b].rho - LIQ[a].rho);   // densest at the bottom

class Tank {
  constructor(d) {
    Object.assign(this, d);
    this.vol = { ...(d.vol || {}) };                  // px² of each liquid
    for (const k in this.vol) this.vol[k] *= this.w;  // levels given in px → volumes
  }
  get bottom() { return this.y + this.h; }
  layers() { return ORDER.filter(k => (this.vol[k] || 0) > .5).map(k => ({ liq: k, h: this.vol[k] / this.w })); }
  level() { return this.layers().reduce((a, l) => a + l.h, 0); }
  total() { return Object.values(this.vol).reduce((a, v) => a + v, 0); }
  surfaceY() { return this.bottom - this.level(); }
  // gauge pressure (Pa) at world height y: P = Σ ρ·g·h of the layers above it
  pressureAt(y) {
    const z = this.bottom - y;
    let P = 0, base = 0;
    for (const l of this.layers()) {
      const top = base + l.h;
      P += LIQ[l.liq].rho * G * Math.max(0, top - Math.max(base, z)) / PPM;
      base = top;
    }
    return P;
  }
  liquidAt(z) {
    let base = 0;
    for (const l of this.layers()) { if (z < base + l.h) return l.liq; base += l.h; }
    return null;
  }
  // Σ ρ·thickness of liquid between heights a..b (for buoyancy)
  massBetween(a, b) {
    let m = 0, base = 0;
    for (const l of this.layers()) {
      const top = base + l.h;
      m += LIQ[l.liq].rho * Math.max(0, Math.min(b, top) - Math.max(a, base));
      base = top;
    }
    return m;
  }
}

const LEVELS = [
  {
    name: { en: 'Royal Bath', ar: 'الحمّام الملكي' }, par: 1,
    tanks: [
      { id: 'A', x: 240, y: 50, w: 200, h: 170, vol: { water: 160 } },
      { id: 'B', x: 470, y: 60, w: 160, h: 140, vol: { honey: 110 } },
      { id: 'K', x: 250, y: 300, w: 300, h: 250, raft: { rho: 600 }, door: { sill: 445 } }
    ],
    valves: [
      { kind: 'bottom', tank: 'A', to: 'K', x: 330, dir: -1 },
      { kind: 'bottom', tank: 'B', to: 'K', x: 520, dir: 1 }
    ],
    learn: {
      en: 'Wood (600 kg/m³) is less dense than water and honey, so the raft floats. Honey is denser but much thicker (viscous), so it pours slowly.',
      ar: 'الخشب (600 كجم/م³) أقل كثافة من الماء والعسل لذلك يطفو الطوف. العسل أكثف لكنه لزج جدًا فيسيل ببطء.'
    }
  },
  {
    name: { en: 'Connected Vessels', ar: 'الأواني المستطرقة' }, par: 1,
    tanks: [
      { id: 'A', x: 120, y: 120, w: 160, h: 430, vol: { water: 380 } },
      { id: 'K', x: 296, y: 250, w: 260, h: 300, raft: { rho: 600 }, door: { sill: 404 } }
    ],
    valves: [
      { kind: 'side', a: 'A', b: 'K', y: 536 },
      { kind: 'bottom', tank: 'A', to: null, x: 200, dir: -1 }
    ],
    learn: {
      en: 'In connected vessels a liquid flows until the pressure at the same depth is equal on both sides, so the water surfaces end at the same height.',
      ar: 'في الأواني المستطرقة يتدفق السائل حتى يتساوى الضغط عند العمق نفسه في الجهتين، لذلك تستقر أسطح الماء عند الارتفاع نفسه.'
    }
  },
  {
    name: { en: 'Pressure Lock', ar: 'قفل الضغط' }, par: 1,
    tanks: [
      { id: 'O', x: 150, y: 50, w: 180, h: 150, vol: { kerosene: 140 } },
      { id: 'Hg', x: 350, y: 90, w: 100, h: 100, vol: { mercury: 30 } },
      { id: 'Wt', x: 470, y: 50, w: 180, h: 150, vol: { water: 140 } },
      { id: 'K', x: 260, y: 300, w: 260, h: 250, raft: { rho: 500 }, door: { sill: 448 }, lock: 9 }
    ],
    valves: [
      { kind: 'bottom', tank: 'O', to: 'K', x: 300, dir: -1 },
      { kind: 'bottom', tank: 'Hg', to: 'K', x: 400, dir: 1 },
      { kind: 'bottom', tank: 'Wt', to: 'K', x: 495, dir: 1 }
    ],
    learn: {
      en: 'Pressure in a liquid is P = ρgh. Kerosene gives less pressure than water at the same depth, while a thin layer of mercury (13 600 kg/m³) gives a lot.',
      ar: 'الضغط داخل السائل P = ρgh. الكيروسين يعطي ضغطًا أقل من الماء عند العمق نفسه، بينما طبقة رقيقة من الزئبق (13600 كجم/م³) تعطي ضغطًا كبيرًا.'
    }
  },
  {
    name: { en: 'Float or Sink?', ar: 'يطفو أم يغرق؟' }, par: 1,
    tanks: [
      { id: 'O', x: 100, y: 40, w: 230, h: 170, vol: { kerosene: 160 } },
      { id: 'S', x: 600, y: 40, w: 230, h: 170, vol: { salt: 160 } },
      { id: 'K', x: 300, y: 280, w: 320, h: 270, raft: { rho: 900, gold: true }, door: { sill: 440 } }
    ],
    valves: [
      { kind: 'bottom', tank: 'O', to: 'K', x: 315, dir: -1 },
      { kind: 'bottom', tank: 'S', to: 'K', x: 610, dir: 1 }
    ],
    learn: {
      en: "Archimedes' principle: an object floats when its average density is less than the liquid's. The heavy raft (900 kg/m³) sinks in kerosene (800) but floats in salt water (1200).",
      ar: 'مبدأ أرخميدس: يطفو الجسم إذا كانت كثافته المتوسطة أقل من كثافة السائل. الطوف الثقيل (900 كجم/م³) يغرق في الكيروسين (800) ويطفو في الماء المالح (1200).'
    }
  },
  {
    name: { en: 'The Salt Sea', ar: 'البحر المالح' }, par: 2,
    tanks: [
      { id: 'Wt', x: 270, y: 40, w: 200, h: 140, vol: { water: 130 } },
      { id: 'Ke', x: 600, y: 60, w: 170, h: 130, vol: { kerosene: 90 } },
      { id: 'S', x: 250, y: 220, w: 260, h: 330, vol: { salt: 240 } },
      { id: 'K', x: 526, y: 280, w: 260, h: 270, raft: { rho: 1050, gold: true }, door: { sill: 400 } }
    ],
    valves: [
      { kind: 'bottom', tank: 'Ke', to: 'K', x: 700, dir: 1 },
      { kind: 'side', a: 'S', b: 'K', y: 536 },
      { kind: 'bottom', tank: 'Wt', to: 'S', x: 380, dir: -1 },
      { kind: 'bottom', tank: 'K', to: null, x: 740, dir: 1 }
    ],
    learn: {
      en: 'Liquids arrange themselves by density. Fresh water floating on the salt water adds pressure ρgh at the bottom, pushing salt water through the gate and lifting the heavy raft.',
      ar: 'تترتب السوائل حسب كثافتها. الماء العذب الطافي فوق الماء المالح يضيف ضغطًا ρgh عند القاع، فيدفع الماء المالح عبر البوابة ويرفع الطوف الثقيل.'
    }
  }
];

const QUIZ = [
  {
    q: { en: 'Why does honey pour out more slowly than water?', ar: 'لماذا يسيل العسل أبطأ من الماء؟' },
    options: [{ en: 'It is less dense', ar: 'لأنه أقل كثافة' }, { en: 'It is more viscous (thicker)', ar: 'لأنه أكثر لزوجة' }, { en: 'It has no weight', ar: 'لأنه بلا وزن' }],
    answer: 1,
    explain: { en: 'Viscosity is internal friction in a liquid; it slows the flow even though honey is denser than water.', ar: 'اللزوجة احتكاك داخلي في السائل تبطئ التدفق، مع أن العسل أكثف من الماء.' }
  },
  {
    q: { en: 'Two connected tanks hold the same liquid. At rest, their surfaces are…', ar: 'حوضان متصلان بهما السائل نفسه. عند السكون تكون أسطحهما…' },
    options: [{ en: 'at the same height', ar: 'عند الارتفاع نفسه' }, { en: 'higher in the wider tank', ar: 'أعلى في الحوض الأعرض' }, { en: 'higher in the narrow tank', ar: 'أعلى في الحوض الأضيق' }],
    answer: 0,
    explain: { en: 'Pressure depends on depth, not on the tank width.', ar: 'الضغط يعتمد على العمق وليس على عرض الحوض.' }
  },
  {
    q: { en: 'What is the pressure 1 m under the surface of water? (ρ = 1000 kg/m³, g = 9.8 m/s²)', ar: 'ما الضغط على عمق 1 م تحت سطح الماء؟ (ρ = 1000 كجم/م³، g = 9.8 م/ث²)' },
    options: [{ en: '980 Pa', ar: '980 باسكال' }, { en: '9800 Pa', ar: '9800 باسكال' }, { en: '98 000 Pa', ar: '98000 باسكال' }],
    answer: 1,
    explain: { en: 'P = ρgh = 1000 × 9.8 × 1 = 9800 Pa ≈ 9.8 kPa.', ar: 'P = ρgh = 1000 × 9.8 × 1 = 9800 باسكال ≈ 9.8 كيلوباسكال.' }
  },
  {
    q: { en: 'The buoyant force equals…', ar: 'قوة الطفو تساوي…' },
    options: [{ en: 'the weight of the displaced liquid', ar: 'وزن السائل المُزاح' }, { en: 'the weight of the object always', ar: 'وزن الجسم دائمًا' }, { en: 'the volume of the tank', ar: 'حجم الحوض' }],
    answer: 0,
    explain: { en: 'F_b = ρ_fluid · V_submerged · g (Archimedes).', ar: 'F_b = ρ_سائل · V_مغمور · g (أرخميدس).' }
  },
  {
    q: { en: 'Kerosene (800 kg/m³) is poured on salt water (1200 kg/m³). Where does it go?', ar: 'سُكب كيروسين (800 كجم/م³) على ماء مالح (1200 كجم/م³). أين يستقر؟' },
    options: [{ en: 'To the bottom', ar: 'في القاع' }, { en: 'It floats on top', ar: 'يطفو في الأعلى' }, { en: 'It mixes evenly', ar: 'يمتزج بالتساوي' }],
    answer: 1,
    explain: { en: 'The less dense liquid floats on the denser one (and they do not mix).', ar: 'السائل الأقل كثافة يطفو فوق الأكثف (ولا يمتزجان).' }
  }
];

class WaterGame {
  constructor(api, li) {
    this.api = api;
    this.lv = LEVELS[li];
    this.letterbox = '#3b2f63';
    this.tanks = this.lv.tanks.map(d => new Tank(d));
    this.byId = Object.fromEntries(this.tanks.map(t => [t.id, t]));
    this.K = this.tanks.find(t => t.raft);
    this.K.raft.d = 30; this.K.raft.w = 100;
    this.K.raft.z = 0;
    this.valves = this.lv.valves.map((v, i) => ({ ...v, n: i + 1, open: 0, used: false, q: 0 }));
    this.selected = this.K;
    this.fx = new Particles();
    this.time = 0;
    this.calm = 0;
    this.state = 'play';
    this.king = { walk: 0 };
    this.hover = null;

    this.valves.forEach(v => {
      v.slider = api.slider({
        label: T(`Valve ${v.n}: ${this.valveName(v)}`, `المحبس ${v.n}: ${this.valveName(v)}`),
        min: 0, max: 100, step: 5, value: 0, unit: '%', digits: 0,
        onInput: x => this.setOpen(v, x / 100)
      });
    });
    api.buttons([{ label: T('Close all valves', 'أغلق كل المحابس'), cls: 'ghost', onClick: () => this.valves.forEach(v => this.setOpen(v, 0)) }]);
    const liqs = [...new Set(this.tanks.flatMap(t => Object.keys(t.vol)))];
    api.note(T('Densities: ', 'الكثافات: ') + liqs.map(k => `${L(LIQ[k].name)} ${LIQ[k].rho}`).join(' • ') + ' kg/m³ • ' +
      T(`Raft + king: ${this.K.raft.rho}`, `الطوف والملك: ${this.K.raft.rho}`));
    api.hint(T('Tap a valve wheel to open or close it, or drag it up/down to open it partly.', 'اضغط على عجلة المحبس لفتحه أو إغلاقه، أو اسحبها لأعلى/لأسفل لتفتحه جزئيًا.'));
  }

  valveName(v) {
    if (v.kind === 'side') return T('gate between tanks', 'بوابة بين الحوضين');
    const t = this.byId[v.tank];
    const liq = Object.keys(t.vol)[0];
    if (!v.to) return T('drain', 'تصريف');
    return t === this.K ? T('drain', 'تصريف') : L(LIQ[liq].name);
  }

  setOpen(v, x) {
    if (this.state !== 'play') return;
    const was = v.open;
    v.open = clamp(x, 0, 1);
    if (v.open > 0 && !v.used) v.used = true;
    v.slider?.set(Math.round(v.open * 100));
    if (was === 0 && v.open > 0) this.api.sfx('water');
    this.calm = 0;
  }

  // ---------- input ----------
  valvePos(v) {
    if (v.kind === 'bottom') { const t = this.byId[v.tank]; return { x: v.x + v.dir * 36, y: t.bottom + 16 }; }
    const A = this.byId[v.a], B = this.byId[v.b];
    return { x: (A.x + A.w + B.x) / 2, y: v.y - 40 };
  }
  valveAt(p) { return this.valves.find(v => { const q = this.valvePos(v); return Math.hypot(p.x - q.x, p.y - q.y) < 28; }); }
  down(p) {
    if (this.state !== 'play') return;
    const v = this.valveAt(p);
    if (v) { this.drag = { v, sy: p.y, o0: v.open, moved: false }; return; }
    const t = this.tanks.find(t => p.x > t.x && p.x < t.x + t.w && p.y > t.y && p.y < t.bottom);
    if (t) { this.selected = t; this.api.sfx('click'); }
  }
  move(p) {
    this.hover = this.valveAt(p);
    const d = this.drag;
    if (!d) return;
    if (Math.abs(p.y - d.sy) > 6) d.moved = true;
    if (d.moved) this.setOpen(d.v, d.o0 + (d.sy - p.y) / 90);
  }
  up() {
    const d = this.drag;
    this.drag = null;
    if (d && !d.moved) { this.setOpen(d.v, d.v.open > 0 ? 0 : 1); this.api.sfx('pin'); }
  }
  key(e) {
    const v = this.valves.find(x => x.n === parseInt(e.key, 10));
    if (v && this.state === 'play') { this.setOpen(v, v.open > 0 ? 0 : 1); return true; }
    return false;
  }

  // ---------- simulation ----------
  update(dt) {
    this.time += dt;
    this.fx.update(dt);
    for (const v of this.valves) v.wheel = (v.wheel || 0) + ((v.open * Math.PI * 1.5) - (v.wheel || 0)) * Math.min(1, dt * 10);
    if (this.state === 'play' || this.state === 'exit') {
      const steps = 4;
      let flow = 0;
      for (let i = 0; i < steps; i++) flow += this.flowStep(dt / steps);
      this.overflow();
      this.updateRaft(dt);
      if (this.state === 'play') this.checkGoal(dt, flow / steps);
    }
    if (this.state === 'exit') {
      this.king.walk += dt;
      if (this.king.walk > 1.4 && !this.won) {
        this.won = true;
        let s = starsByAttempt(this.api.attempt);
        if (this.valves.filter(v => v.used).length > this.lv.par) s = Math.max(1, s - 1);
        this.api.win(s);
      }
    }
    this.updateVars();
  }

  flowStep(dt) {
    let total = 0;
    for (const v of this.valves) {
      v.q = 0;
      if (v.open <= 0) continue;
      if (v.kind === 'bottom') {
        const t = this.byId[v.tank];
        const liq = t.layers()[0]?.liq;
        if (!liq) continue;
        const P = t.pressureAt(t.bottom);
        const speed = Math.sqrt(2 * P / LIQ[liq].rho);                                  // Torricelli
        const dV = Math.min(HOLE * v.open * LIQ[liq].visc * speed * PPM * dt, t.vol[liq]);
        t.vol[liq] -= dV;
        if (v.to) this.byId[v.to].vol[liq] = (this.byId[v.to].vol[liq] || 0) + dV;
        v.q = dV / dt; v.liq = liq; v.v = speed;
        total += v.q;
      } else {
        const A = this.byId[v.a], B = this.byId[v.b];
        const dP = A.pressureAt(v.y) - B.pressureAt(v.y);
        v.dP = dP;
        if (Math.abs(dP) < 1) continue;
        const [src, dst] = dP > 0 ? [A, B] : [B, A];
        const liq = src.liquidAt(src.bottom - v.y);
        if (!liq) continue;
        const rho = LIQ[liq].rho;
        const speed = Math.sqrt(2 * Math.abs(dP) / rho);
        const eq = (Math.abs(dP) / (rho * G)) * PPM / (1 / A.w + 1 / B.w);
        const dV = Math.min(HOLE * v.open * LIQ[liq].visc * speed * PPM * dt, eq * .5, src.vol[liq]);
        src.vol[liq] -= dV;
        dst.vol[liq] = (dst.vol[liq] || 0) + dV;
        v.q = dV / dt * Math.sign(dP); v.liq = liq; v.v = speed;
        total += Math.abs(v.q);
      }
    }
    return total;
  }

  overflow() {
    for (const t of this.tanks) {
      let extra = (t.level() - t.h) * t.w;
      for (let i = ORDER.length - 1; i >= 0 && extra > 0; i--) {
        const k = ORDER[i], take = Math.min(extra, t.vol[k] || 0);
        if (take > 0) { t.vol[k] -= take; extra -= take; this.fx.emit(t.x + t.w, t.y, 1, { color: LIQ[k].color, speed: 80, size: 4 }); }
      }
    }
  }

  raftTarget() {
    const K = this.K, r = K.raft;
    const need = r.rho * r.d;
    if (K.massBetween(0, r.d) < need) return { z: 0, floating: false };
    let a = 0, b = Math.max(0, K.level());
    for (let i = 0; i < 30; i++) {
      const m = (a + b) / 2;
      if (K.massBetween(m, m + r.d) >= need) a = m; else b = m;
    }
    return { z: a, floating: true };
  }

  updateRaft(dt) {
    const r = this.K.raft;
    const tgt = this.raftTarget();
    r.floating = tgt.floating;
    r.z += (tgt.z - r.z) * Math.min(1, dt * 5);
  }

  checkGoal(dt, flow) {
    const K = this.K, r = K.raft;
    const raftTop = K.bottom - r.z - r.d;
    if (K.surfaceY() < raftTop - 4 && Math.abs(this.raftTarget().z - r.z) < 3) {
      const top = K.layers().at(-1)?.liq || 'water';
      return this.fail(r.floating
        ? T(`The ${L(LIQ[top].name).toLowerCase()} (${LIQ[top].rho} kg/m³) floats above the raft and covers the king! The raft floats only in a denser liquid below it.`,
          `طبقة ${L(LIQ[top].name)} (${LIQ[top].rho} كجم/م³) طفت فوق الطوف وغمرت الملك! الطوف يطفو فقط في سائل أكثف منه تحته.`)
        : T(`The raft (${r.rho} kg/m³) is denser than ${L(LIQ[top].name).toLowerCase()} (${LIQ[top].rho} kg/m³), so it sank and the king got wet! Choose a denser liquid.`,
          `الطوف (${r.rho} كجم/م³) أكثف من ${L(LIQ[top].name)} (${LIQ[top].rho} كجم/م³) فغرق وتبلّل الملك! اختر سائلًا أكثف.`));
    }
    const P = K.pressureAt(K.bottom) / 1000;
    const unlocked = !K.lock || P >= K.lock;
    if (r.floating && raftTop <= K.door.sill + 4 && unlocked) {
      this.state = 'exit';
      this.valves.forEach(v => { v.open = 0; v.slider?.set(0); });
      this.api.sfx('ding');
      this.api.banner(T('The king is free!', 'تحرر الملك!'));
      return;
    }
    if (flow < 40) this.calm += dt; else this.calm = 0;
    const sources = this.tanks.filter(t => t !== this.K && this.valves.some(v => v.tank === t.id || v.a === t.id));
    const nothingLeft = this.valves.every(v => v.open >= .99) || sources.every(t => t.total() < 5);
    if (nothingLeft && this.calm > 1.5) {
      if (!unlocked) this.fail(T(`The pressure lock needs ${K.lock} kPa at the bottom but only got ${fmt(P, 1)} kPa. P = ρgh: a denser liquid gives more pressure.`,
        `قفل الضغط يحتاج ${K.lock} كيلوباسكال عند القاع لكنه حصل على ${fmt(P, 1)} فقط. P = ρgh: السائل الأكثف يعطي ضغطًا أكبر.`));
      else this.fail(T('Not enough liquid reached the king to float him up to the door. Watch out for drains!', 'لم يصل سائل كافٍ لرفع الملك إلى الباب. احذر من فتحات التصريف!'));
    }
  }

  fail(msg) {
    this.state = 'lost';
    this.api.lose(msg);
  }

  updateVars() {
    const t = this.selected;
    const bottomLiq = t.layers()[0]?.liq;
    const P = t.pressureAt(t.bottom);
    const rows = [
      { sym: '#', name: T('selected tank', 'الحوض المحدد'), value: t === this.K ? '👑' : t.id },
      { sym: 'h', name: T('liquid depth', 'عمق السائل'), value: fmt(t.level() / PPM, 2), unit: 'm' },
      { sym: 'ρ', name: T('density (bottom)', 'الكثافة (القاع)'), value: bottomLiq ? LIQ[bottomLiq].rho : '—', unit: 'kg/m³' },
      { sym: 'P', name: T('pressure at bottom', 'الضغط عند القاع'), value: fmt(P / 1000, 2), unit: 'kPa', hl: true }
    ];
    for (const v of this.valves) {
      if (!(v.open > 0)) continue;
      rows.push({ sym: `🔧${v.n}`, name: v.v ? `${Math.round(v.open * 100)}% • v = √(2P/ρ) = ${fmt(v.v, 2)} m/s` : `${Math.round(v.open * 100)}%`, value: fmt(Math.abs(v.q) / (PPM * PPM) * 1000, 1), unit: 'L/s' });
    }
    const r = this.K.raft;
    const Vm = (r.w / PPM) * (r.d / PPM) * 1;                     // raft: 1 m × 0.3 m × 1 m
    const sub = this.K.massBetween(r.z, r.z + r.d) / PPM;
    const Fb = sub * (r.w / PPM) * G;
    rows.push(
      { sym: 'ρᵣ', name: T('raft + king density', 'كثافة الطوف والملك'), value: r.rho, unit: 'kg/m³' },
      { sym: 'W', name: T('weight mg', 'الوزن mg'), value: fmt(r.rho * Vm * G, 0), unit: 'N' },
      { sym: 'F_b', name: T('buoyant force', 'قوة الطفو'), value: fmt(Fb, 0), unit: 'N', hl: true },
      { sym: '⇅', name: T('raft state', 'حالة الطوف'), value: r.floating ? T('floating', 'يطفو') : T('resting on floor', 'على القاع') }
    );
    if (this.K.lock) rows.push({ sym: '🔒', name: T('lock needs', 'القفل يحتاج'), value: `${fmt(this.K.pressureAt(this.K.bottom) / 1000, 1)} / ${this.K.lock}`, unit: 'kPa', hl: true });
    this.api.setVars(rows);
  }

  // ---------- drawing ----------
  draw(ctx) {
    ctx.fillStyle = '#3b2f63'; ctx.fillRect(0, 0, W, 600);
    ctx.fillStyle = '#45386f';
    for (let row = 0; row < 16; row++) for (let c = 0; c < 14; c++) {
      roundRect(ctx, c * 76 + (row % 2) * 38 - 30, row * 40 + 2, 72, 36, 5); ctx.fill();
    }
    ctx.fillStyle = '#2a2148'; ctx.fillRect(0, 565, W, 35);
    for (const x of [60, 940]) this.drawTorch(ctx, x, 120);

    for (const v of this.valves) this.drawStream(ctx, v);
    for (const t of this.tanks) this.drawTank(ctx, t);
    this.drawDoor(ctx);
    this.drawRaft(ctx);
    for (const t of this.tanks) this.drawGauge(ctx, t);
    for (const v of this.valves) this.drawValve(ctx, v);
    this.fx.draw(ctx);
  }

  drawTorch(ctx, x, y) {
    ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x - 5, y, 10, 40);
    const f = Math.sin(this.time * 12 + x) * 3;
    const g = ctx.createRadialGradient(x, y - 8, 2, x, y - 8, 60);
    g.addColorStop(0, 'rgba(255,200,80,.5)'); g.addColorStop(1, 'rgba(255,200,80,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - 8, 60, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffb347';
    ctx.beginPath(); ctx.moveTo(x - 9, y); ctx.quadraticCurveTo(x, y - 30 - f, x + 9, y); ctx.fill();
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.quadraticCurveTo(x, y - 16 - f, x + 4, y); ctx.fill();
  }

  drawTank(ctx, t) {
    ctx.fillStyle = 'rgba(200,225,255,.12)';
    ctx.fillRect(t.x, t.y, t.w, t.h);
    let base = t.bottom;
    const layers = t.layers();
    layers.forEach((l, i) => {
      const top = base - l.h;
      const c = LIQ[l.liq];
      ctx.fillStyle = c.color;
      ctx.globalAlpha = l.liq === 'mercury' ? 1 : .88;
      ctx.beginPath();
      ctx.moveTo(t.x, base);
      const wave = c.visc < .5 ? .6 : 2.5;   // thick liquids barely ripple
      if (i === layers.length - 1) {
        for (let x = 0; x <= t.w; x += 10) ctx.lineTo(t.x + x, top + Math.sin(this.time * 3 * c.visc + x * .08) * Math.min(wave, l.h / 4));
      } else { ctx.lineTo(t.x, top); ctx.lineTo(t.x + t.w, top); }
      ctx.lineTo(t.x + t.w, base);
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = c.top; ctx.fillRect(t.x, top, t.w, 2);
      if (l.liq === 'mercury') { ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(t.x + 8, top + 2, t.w - 16, Math.min(3, l.h / 3)); }
      // liquid name and density inside the layer
      if (l.h >= 22) {
        label(ctx, `${L(c.name)} ${c.rho}`, t.x + t.w / 2, base - l.h / 2, { size: Math.min(16, 10 + l.h / 6), color: '#fff', stroke: 'rgba(20,10,60,.55)' });
      }
      base = top;
    });
    ctx.strokeStyle = this.selected === t ? '#ffe066' : '#e8e0ff';
    ctx.lineWidth = 7; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(t.x - 3, t.y); ctx.lineTo(t.x - 3, t.bottom + 3); ctx.lineTo(t.x + t.w + 3, t.bottom + 3); ctx.lineTo(t.x + t.w + 3, t.y); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(t.x + 6, t.y + 6, 6, t.h - 12);
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    for (let d = 50; d < t.h; d += 50) ctx.fillRect(t.x + t.w - 10, t.bottom - d, 8, 2);
    if (layers.length === 0) label(ctx, T('empty', 'فارغ'), t.x + t.w / 2, t.y + t.h / 2, { size: 16, color: 'rgba(255,255,255,.5)', stroke: null });
  }

  // Big pressure readout on every tank: gauge dial + "P = … kPa" and the liquid depth.
  drawGauge(ctx, t) {
    const P = t.pressureAt(t.bottom) / 1000;
    const x = t.x + 26, y = t.y + 26, r = 20;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.strokeStyle = '#241a4f'; ctx.lineWidth = 2; ctx.stroke();
    const a = Math.PI * .75 + clamp(P / 30, 0, 1) * Math.PI * 1.5;
    ctx.strokeStyle = '#e63946'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * (r - 4), y + Math.sin(a) * (r - 4)); ctx.stroke();
    if (t.lock) {
      const la = Math.PI * .75 + clamp(t.lock / 30, 0, 1) * Math.PI * 1.5;
      ctx.strokeStyle = '#2ed3a0'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(x, y, r - 2, la - .08, la + .08); ctx.stroke();
    }
    // readout box centred above the tank so neighbouring tanks never overlap it
    const text = `P = ${fmt(P, 1)} kPa`, sub = `h = ${fmt(t.level() / PPM, 2)} m`;
    // above the tank unless a valve sits there, then inside its top edge
    let bx = t.x + t.w / 2, by = Math.max(24, t.y - 26);
    const blocked = this.valves.some(v => { const q = this.valvePos(v); return Math.abs(q.x - bx) < 90 && Math.abs(q.y - by) < 60; });
    if (blocked) { bx = t.x + t.w / 2 + 20; by = t.y + 28; }
    ctx.fillStyle = 'rgba(20,10,60,.8)';
    roundRect(ctx, bx - 64, by - 22, 128, 44, 10); ctx.fill();
    label(ctx, text, bx, by - 9, { size: 18, color: '#ffe066', stroke: null });
    label(ctx, sub, bx, by + 12, { size: 15, color: '#cfe9ff', stroke: null });
  }

  drawStream(ctx, v) {
    if (!v.q || Math.abs(v.q) < 1) return;
    const c = LIQ[v.liq];
    if (v.kind === 'bottom') {
      const t = this.byId[v.tank];
      const to = v.to ? this.byId[v.to] : null;
      const y0 = t.bottom + 6, y1 = to ? to.surfaceY() : 620;
      const w = clamp(v.q / 700, 2, 16);
      ctx.fillStyle = c.color;
      ctx.globalAlpha = .9;
      ctx.beginPath();
      ctx.moveTo(v.x - w / 2, y0); ctx.lineTo(v.x + w / 2, y0);
      ctx.lineTo(v.x + w / 2.6, y1); ctx.lineTo(v.x - w / 2.6, y1); ctx.fill();
      ctx.globalAlpha = 1;
      if (Math.random() < .5 * c.visc) this.fx.emit(v.x, y1, 1, { color: c.top, speed: 120, size: 3, dir: -Math.PI / 2, spread: 2, life: .4 });
    } else {
      const A = this.byId[v.a], B = this.byId[v.b];
      const x0 = A.x + A.w, x1 = B.x;
      ctx.fillStyle = c.color;
      ctx.fillRect(x0 - 2, v.y - 9, x1 - x0 + 4, 18);
    }
  }

  drawValve(ctx, v) {
    const p = this.valvePos(v);
    // pipe from the opening to the valve
    ctx.fillStyle = '#cfc4f3';
    if (v.kind === 'bottom') {
      const t = this.byId[v.tank];
      ctx.fillRect(v.x - 12, t.bottom + 2, 24, 22);
      ctx.fillRect(Math.min(v.x, p.x), p.y - 5, Math.abs(p.x - v.x), 10);
    } else {
      const A = this.byId[v.a], B = this.byId[v.b];
      ctx.fillRect(A.x + A.w, v.y - 12, B.x - A.x - A.w, 24);
      ctx.fillRect(p.x - 4, p.y, 8, v.y - 12 - p.y);
    }
    // hand wheel: red when closed, green when open; spokes turn with the opening
    const open = v.open > 0;
    ctx.save();
    ctx.translate(p.x, p.y);
    if (this.hover === v) { ctx.fillStyle = 'rgba(255,224,102,.3)'; ctx.beginPath(); ctx.arc(0, 0, 26, 0, 7); ctx.fill(); }
    ctx.rotate(v.wheel || 0);
    ctx.strokeStyle = open ? '#2ed3a0' : '#e63946';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(0, 0, 16, 0, 7); ctx.stroke();
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(16, 0); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = '#241a4f'; ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, 7); ctx.fill();
    // opening readout
    let lx = p.x, ly = v.kind === 'bottom' ? p.y + 32 : p.y - 32;
    if (ly > 580) { lx = p.x + v.dir * 58; ly = p.y; }   // no room below: put it beside the wheel
    ctx.fillStyle = 'rgba(20,10,60,.8)';
    roundRect(ctx, lx - 34, ly - 14, 68, 28, 9); ctx.fill();
    label(ctx, `${v.n} · ${Math.round(v.open * 100)}%`, lx, ly, { size: 16, color: open ? '#9ff5d8' : '#ffb3b3', stroke: null });
  }

  drawDoor(ctx) {
    const K = this.K, d = K.door;
    const x = K.x + K.w + 3, y = d.sill;
    ctx.fillStyle = '#2a2148';
    ctx.fillRect(x - 4, y - 70, 70, 70);
    ctx.fillStyle = '#7a4a1e';
    roundRect(ctx, x + 6, y - 62, 44, 62, 20); ctx.fill();
    ctx.fillStyle = '#ffc93c'; ctx.beginPath(); ctx.arc(x + 42, y - 30, 3, 0, 7); ctx.fill();
    ctx.fillStyle = '#8d93a8'; ctx.fillRect(x - 4, y, 120, 10);
    if (K.lock) {
      const P = K.pressureAt(K.bottom) / 1000, open = P >= K.lock;
      label(ctx, open ? '🔓' : '🔒', x + 28, y - 84, { size: 24, stroke: null });
      label(ctx, `P ≥ ${K.lock} kPa`, x + 28, y - 112, { size: 18, color: open ? '#2ed3a0' : '#ffb3b3' });
    }
    label(ctx, '🚩', x + 96, y - 18, { size: 22, stroke: null });
  }

  drawRaft(ctx) {
    const K = this.K, r = K.raft;
    const cx = K.x + K.w / 2;
    const top = K.bottom - r.z - r.d + (r.floating ? Math.sin(this.time * 2.2) * 1.8 : 0);
    ctx.fillStyle = r.gold ? '#d4a017' : '#b5763a';
    roundRect(ctx, cx - r.w / 2, top, r.w, r.d, 6); ctx.fill();
    ctx.strokeStyle = r.gold ? '#8a6500' : '#7a4a1e'; ctx.lineWidth = 2;
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(cx - r.w / 2 + i * r.w / 4, top + 3); ctx.lineTo(cx - r.w / 2 + i * r.w / 4, top + r.d - 3); ctx.stroke(); }
    label(ctx, `ρ = ${r.rho}`, cx, top + r.d / 2, { size: 15, color: '#fff', stroke: 'rgba(0,0,0,.45)' });
    let kx = cx, ky = top;
    if (this.state === 'exit') {
      const t = clamp(this.king.walk / 1.2, 0, 1);
      kx = cx + (K.x + K.w + 80 - cx) * t;
      ky = top + (K.door.sill - top) * Math.min(1, t * 2);
    }
    const bob = this.state === 'exit' ? Math.abs(Math.sin(this.king.walk * 12)) * -4 : 0;
    drawKing(ctx, kx, ky + bob, 1, this.state === 'lost' ? 'sad' : 'happy');
  }
}

export default {
  id: 'water',
  levels: LEVELS,
  quiz: QUIZ,
  formulas: [
    { expr: 'P = ρ g h', label: { en: 'Pressure at depth h', ar: 'الضغط عند العمق h' } },
    { expr: 'P = ρ₁ g h₁ + ρ₂ g h₂', label: { en: 'Layered liquids', ar: 'سوائل في طبقات' } },
    { expr: 'F_b = ρ_f V_sub g', label: { en: "Archimedes' buoyant force", ar: 'قوة الطفو (أرخميدس)' } },
    { expr: 'ρ_obj < ρ_f  ⇒  floats', label: { en: 'Floating condition', ar: 'شرط الطفو' } },
    { expr: 'v = √(2 g h)', label: { en: "Torricelli's outflow speed", ar: 'سرعة التدفق (تورشيلّي)' } },
    { expr: 'Q = A · v', label: { en: 'Flow rate through a valve', ar: 'معدل التدفق عبر المحبس' } },
    { expr: 'P_A = P_B (same depth)', label: { en: 'Connected vessels', ar: 'الأواني المستطرقة' } }
  ],
  terms: [
    { en: 'Pressure', ar: 'الضغط' }, { en: 'Density', ar: 'الكثافة' }, { en: 'Buoyant force', ar: 'قوة الطفو' },
    { en: "Archimedes' principle", ar: 'مبدأ أرخميدس' }, { en: 'Connected vessels', ar: 'الأواني المستطرقة' },
    { en: 'Viscosity', ar: 'اللزوجة' }, { en: 'Flow rate', ar: 'معدل التدفق' }, { en: 'Pascal (Pa)', ar: 'الباسكال' }
  ],
  tutorial: [
    { en: 'Every pipe has a valve wheel. Tap it to open or close it, or drag it up/down (or use its slider) to open it partly.', ar: 'لكل أنبوب عجلة محبس. اضغط عليها لفتحها أو إغلاقها، أو اسحبها لأعلى/لأسفل (أو استخدم المنزلق) لتفتحها جزئيًا.' },
    { en: 'The king stands on a raft. If the raft floats, rising liquid lifts him to the door.', ar: 'يقف الملك على طوف. إذا طفا الطوف فإن السائل المرتفع يرفعه نحو الباب.' },
    { en: 'Each liquid has a real density ρ. Denser liquids sink below lighter ones and push harder: P = ρgh. Thick liquids like honey pour slowly.', ar: 'لكل سائل كثافة حقيقية ρ. السوائل الأكثف تستقر أسفل الأخف وتضغط أكثر: P = ρgh. والسوائل اللزجة مثل العسل تسيل ببطء.' },
    { en: 'Tap any tank to read its depth and the pressure at its bottom in the lab panel.', ar: 'اضغط على أي حوض لتقرأ عمقه والضغط عند قاعه في لوحة المختبر.' },
    { en: 'Watch out for drains and for lighter liquids that float over the raft. Using only the needed valves gives more stars.', ar: 'احذر من فتحات التصريف ومن السوائل الأخف التي تطفو فوق الطوف. استخدام المحابس اللازمة فقط يعطي نجومًا أكثر.' }
  ],
  create: (api, i) => new WaterGame(api, i)
};
