// Rescue the King: Water Kingdom — Fluid Pressure and Buoyancy
import { T, L } from '../i18n.js';
import { W } from '../engine.js';
import { clamp, fmt, Particles, roundRect, label, closestOnSegment, starsByAttempt } from '../util.js';
import { drawKing } from '../art.js';

const PPM = 100;          // 100 px = 1 m
const G = 9.8;
const HOLE = 18;          // effective opening width (px) for Torricelli flow

const LIQ = {
  lava: { rho: 3100, color: '#ff5a1f', top: '#ffb347', name: { en: 'Lava', ar: 'حمم' } },
  salt: { rho: 1200, color: '#1971c2', top: '#74c0fc', name: { en: 'Salt water', ar: 'ماء مالح' } },
  water: { rho: 1000, color: '#2ec4f1', top: '#a5ecff', name: { en: 'Water', ar: 'ماء' } },
  oil: { rho: 800, color: '#f2b705', top: '#ffe08a', name: { en: 'Oil', ar: 'زيت' } }
};
const ORDER = ['lava', 'salt', 'water', 'oil'];     // densest at the bottom

class Tank {
  constructor(d) {
    Object.assign(this, d);
    this.vol = { ...(d.vol || {}) };                  // px² of each liquid
    for (const k in this.vol) this.vol[k] *= this.w;  // levels given in px → volumes
    this.stone = 0;
  }
  get bottom() { return this.y + this.h; }
  layers() { return ORDER.filter(k => (this.vol[k] || 0) > .5).map(k => ({ liq: k, h: this.vol[k] / this.w })); }
  level() { return this.layers().reduce((a, l) => a + l.h, this.stone); }
  surfaceY() { return this.bottom - this.level(); }
  // gauge pressure (Pa) at world height y
  pressureAt(y) {
    const z = this.bottom - y;
    let P = 0, base = this.stone;
    for (const l of this.layers()) {
      const top = base + l.h;
      P += LIQ[l.liq].rho * G * Math.max(0, top - Math.max(base, z)) / PPM;
      base = top;
    }
    return P;
  }
  // which liquid sits at height z above the floor
  liquidAt(z) {
    if (z < this.stone) return 'stone';
    let base = this.stone;
    for (const l of this.layers()) { if (z < base + l.h) return l.liq; base += l.h; }
    return null;
  }
  // mass per unit area of liquid between heights a..b (for buoyancy)
  massBetween(a, b) {
    let m = 0, base = this.stone;
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
      { id: 'L', x: 470, y: 60, w: 160, h: 140, vol: { lava: 110 } },
      { id: 'K', x: 250, y: 300, w: 300, h: 250, raft: { rho: 500 }, door: { sill: 445 } }
    ],
    pins: [
      { kind: 'bottom', tank: 'A', to: 'K', x: 330, dir: -1 },
      { kind: 'bottom', tank: 'L', to: 'K', x: 520, dir: 1 }
    ],
    learn: {
      en: 'Wood is less dense than water, so the raft floats. As water fills the tank, the buoyant force lifts the raft and the king with it.',
      ar: 'الخشب أقل كثافة من الماء لذلك يطفو الطوف. عندما يمتلئ الحوض بالماء ترفع قوة الطفو الطوف والملك معه.'
    }
  },
  {
    name: { en: 'Connected Vessels', ar: 'الأواني المستطرقة' }, par: 1,
    tanks: [
      { id: 'A', x: 120, y: 120, w: 160, h: 430, vol: { water: 380 } },
      { id: 'K', x: 296, y: 250, w: 260, h: 300, raft: { rho: 500 }, door: { sill: 404 } }
    ],
    pins: [
      { kind: 'side', a: 'A', b: 'K', y: 536 },
      { kind: 'bottom', tank: 'A', to: null, x: 200, dir: -1 }
    ],
    learn: {
      en: 'In connected vessels a liquid flows until the pressure at the same depth is equal on both sides — so the water surfaces end at the same height.',
      ar: 'في الأواني المستطرقة يتدفق السائل حتى يتساوى الضغط عند العمق نفسه في الجهتين — لذلك تستقر أسطح الماء عند الارتفاع نفسه.'
    }
  },
  {
    name: { en: 'Pressure Lock', ar: 'قفل الضغط' }, par: 1,
    tanks: [
      { id: 'O', x: 150, y: 50, w: 180, h: 150, vol: { oil: 140 } },
      { id: 'Wt', x: 470, y: 50, w: 180, h: 150, vol: { water: 140 } },
      { id: 'K', x: 260, y: 300, w: 260, h: 250, raft: { rho: 500 }, door: { sill: 448 }, lock: 9 }
    ],
    pins: [
      { kind: 'bottom', tank: 'O', to: 'K', x: 300, dir: -1 },
      { kind: 'bottom', tank: 'Wt', to: 'K', x: 495, dir: 1 }
    ],
    learn: {
      en: 'Pressure in a liquid is P = ρgh. Oil and water at the same depth give different pressures because oil has a smaller density ρ.',
      ar: 'الضغط داخل السائل P = ρgh. الزيت والماء عند العمق نفسه يعطيان ضغطين مختلفين لأن كثافة الزيت ρ أصغر.'
    }
  },
  {
    name: { en: 'Float or Sink?', ar: 'يطفو أم يغرق؟' }, par: 1,
    tanks: [
      { id: 'O', x: 100, y: 40, w: 230, h: 170, vol: { oil: 160 } },
      { id: 'S', x: 600, y: 40, w: 230, h: 170, vol: { salt: 160 } },
      { id: 'K', x: 300, y: 280, w: 320, h: 270, raft: { rho: 900, gold: true }, door: { sill: 440 } }
    ],
    pins: [
      { kind: 'bottom', tank: 'O', to: 'K', x: 315, dir: -1 },
      { kind: 'bottom', tank: 'S', to: 'K', x: 610, dir: 1 }
    ],
    learn: {
      en: "Archimedes' principle: an object floats when its average density is less than the liquid's. The heavy raft (900 kg/m³) sinks in oil (800) but floats in salt water (1200).",
      ar: 'مبدأ أرخميدس: يطفو الجسم إذا كانت كثافته المتوسطة أقل من كثافة السائل. الطوف الثقيل (900 كجم/م³) يغرق في الزيت (800) ويطفو في الماء المالح (1200).'
    }
  },
  {
    name: { en: 'The Salt Sea', ar: 'البحر المالح' }, par: 2,
    tanks: [
      { id: 'Wt', x: 270, y: 40, w: 200, h: 140, vol: { water: 130 } },
      { id: 'Lv', x: 600, y: 60, w: 170, h: 130, vol: { lava: 90 } },
      { id: 'S', x: 250, y: 220, w: 260, h: 330, vol: { salt: 240 } },
      { id: 'K', x: 526, y: 280, w: 260, h: 270, raft: { rho: 1050, gold: true }, door: { sill: 400 } }
    ],
    pins: [
      { kind: 'bottom', tank: 'Lv', to: 'K', x: 700, dir: 1 },
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
    q: { en: 'Why does the wooden raft float?', ar: 'لماذا يطفو الطوف الخشبي؟' },
    options: [{ en: 'Wood is denser than water', ar: 'الخشب أكثف من الماء' }, { en: 'Wood is less dense than water', ar: 'الخشب أقل كثافة من الماء' }, { en: 'Water has no weight', ar: 'الماء ليس له وزن' }],
    answer: 1,
    explain: { en: 'Its weight is balanced by the buoyant force before it is fully submerged.', ar: 'يتوازن وزنه مع قوة الطفو قبل أن يُغمر بالكامل.' }
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
    q: { en: 'Oil (800 kg/m³) is poured on salt water (1200 kg/m³). Where does the oil go?', ar: 'سُكب زيت (800 كجم/م³) على ماء مالح (1200 كجم/م³). أين يستقر الزيت؟' },
    options: [{ en: 'To the bottom', ar: 'في القاع' }, { en: 'It floats on top', ar: 'يطفو في الأعلى' }, { en: 'It mixes evenly', ar: 'يمتزج بالتساوي' }],
    answer: 1,
    explain: { en: 'The less dense liquid floats on the denser one.', ar: 'السائل الأقل كثافة يطفو فوق الأكثف.' }
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
    this.pins = this.lv.pins.map((p, i) => ({ ...p, n: i + 1, pulled: false, anim: 0, q: 0 }));
    this.pulled = 0;
    this.selected = this.K;
    this.fx = new Particles();
    this.time = 0;
    this.calm = 0;
    this.state = 'play';
    this.king = { x: 0, walk: 0 };
    this.hover = null;

    api.note(T('Tap a pin to pull it (keys 1–4). Tap a tank to measure it.', 'اضغط على المسمار لسحبه (المفاتيح 1–4). اضغط على حوض لقياسه.'));
    const liqs = [...new Set(this.tanks.flatMap(t => Object.keys(t.vol)))];
    api.note(T('Densities: ', 'الكثافات: ') + liqs.map(k => `${L(LIQ[k].name)} ${LIQ[k].rho}`).join(' • ') + ' kg/m³ • ' +
      T(`Raft + king: ${this.K.raft.rho}`, `الطوف والملك: ${this.K.raft.rho}`));
    api.hint(T('Pull the pins in the right order to float the king up to the door!', 'اسحب المسامير بالترتيب الصحيح لترفع الملك إلى الباب!'));
  }

  // ---------- input ----------
  pinAt(p) {
    for (const pin of this.pins) {
      if (pin.pulled) continue;
      const g = this.pinGeom(pin);
      if (Math.hypot(p.x - g.ring.x, p.y - g.ring.y) < 24) return pin;
      if (closestOnSegment(p.x, p.y, g.a.x, g.a.y, g.b.x, g.b.y).d < 14) return pin;
    }
    return null;
  }
  down(p) {
    if (this.state !== 'play') return;
    const pin = this.pinAt(p);
    if (pin) return this.pull(pin);
    const t = this.tanks.find(t => p.x > t.x && p.x < t.x + t.w && p.y > t.y && p.y < t.bottom);
    if (t) { this.selected = t; this.api.sfx('click'); }
  }
  move(p) { this.hover = this.pinAt(p); }
  key(e) {
    const n = parseInt(e.key, 10);
    const pin = this.pins.find(p => p.n === n && !p.pulled);
    if (pin && this.state === 'play') { this.pull(pin); return true; }
    return false;
  }
  pull(pin) {
    pin.pulled = true;
    this.pulled++;
    this.calm = 0;
    this.api.sfx('pin');
    setTimeout(() => this.api.sfx('water'), 250);
  }

  pinGeom(pin) {
    if (pin.kind === 'bottom') {
      const t = this.byId[pin.tank];
      const y = t.bottom + 14, off = pin.anim * 90 * pin.dir;
      const a = { x: pin.x - 22 * pin.dir + off, y }, b = { x: pin.x + 60 * pin.dir + off, y };
      return { a, b, ring: { x: b.x + 12 * pin.dir, y } };
    }
    const A = this.byId[pin.a], B = this.byId[pin.b];
    const x = (A.x + A.w + B.x) / 2, off = pin.anim * 90;
    const a = { x, y: pin.y + 16 - off }, b = { x, y: pin.y - 60 - off };
    return { a, b, ring: { x, y: b.y - 12 } };
  }

  // ---------- simulation ----------
  update(dt) {
    this.time += dt;
    this.fx.update(dt);
    for (const pin of this.pins) if (pin.pulled && pin.anim < 1) pin.anim = Math.min(1, pin.anim + dt * 3);
    if (this.state === 'play' || this.state === 'exit') {
      const steps = 4;
      let flow = 0;
      for (let i = 0; i < steps; i++) flow += this.flowStep(dt / steps);
      this.react(dt);
      this.overflow();
      this.updateRaft(dt);
      if (this.state === 'play') this.checkGoal(dt, flow / steps);
    }
    if (this.state === 'exit') {
      this.king.walk += dt;
      if (this.king.walk > 1.4 && !this.won) {
        this.won = true;
        let s = starsByAttempt(this.api.attempt);
        if (this.pulled > this.lv.par) s = Math.max(1, s - 1);
        this.api.win(s);
      }
    }
    this.updateVars();
  }

  flowStep(dt) {
    let total = 0;
    for (const pin of this.pins) {
      pin.q = 0;
      if (!pin.pulled || pin.anim < .5) continue;
      if (pin.kind === 'bottom') {
        const t = this.byId[pin.tank];
        if (t.stone > .5) continue;
        const liq = t.layers()[0]?.liq;
        if (!liq) continue;
        const P = t.pressureAt(t.bottom);
        const v = Math.sqrt(2 * P / LIQ[liq].rho);                     // Torricelli
        const dV = Math.min(HOLE * v * PPM * dt, t.vol[liq]);
        t.vol[liq] -= dV;
        if (pin.to) this.byId[pin.to].vol[liq] = (this.byId[pin.to].vol[liq] || 0) + dV;
        if (liq === 'lava' && this.byId[pin.to] === this.K) this.lavaHit = true;
        pin.q = dV / dt; pin.liq = liq; pin.v = v;
        total += pin.q;
      } else {
        const A = this.byId[pin.a], B = this.byId[pin.b];
        const PA = A.pressureAt(pin.y), PB = B.pressureAt(pin.y);
        const dP = PA - PB;
        if (Math.abs(dP) < 1) { pin.dP = dP; continue; }
        const [src, dst] = dP > 0 ? [A, B] : [B, A];
        const liq = src.liquidAt(src.bottom - pin.y);
        if (!liq || liq === 'stone') continue;
        const rho = LIQ[liq].rho;
        const v = Math.sqrt(2 * Math.abs(dP) / rho);
        const eq = (Math.abs(dP) / (rho * G)) * PPM / (1 / A.w + 1 / B.w);
        const dV = Math.min(HOLE * v * PPM * dt, eq * .5, src.vol[liq]);
        src.vol[liq] -= dV;
        dst.vol[liq] = (dst.vol[liq] || 0) + dV;
        if (liq === 'lava' && dst === this.K) this.lavaHit = true;
        pin.q = dV / dt * Math.sign(dP); pin.liq = liq; pin.v = v; pin.dP = dP;
        total += Math.abs(pin.q);
      }
    }
    return total;
  }

  react(dt) {
    for (const t of this.tanks) {
      const lava = t.vol.lava || 0, wet = (t.vol.water || 0) + (t.vol.salt || 0);
      if (lava > .5 && wet > .5) {
        const m = Math.min(lava, wet, 9000 * dt);
        t.vol.lava -= m;
        const fromW = Math.min(t.vol.water || 0, m);
        if (fromW) t.vol.water -= fromW;
        if (m - fromW > 0) t.vol.salt -= m - fromW;
        t.stone += m / t.w;
        if (Math.random() < .5) this.fx.emit(t.x + Math.random() * t.w, t.bottom - t.stone, 2, { color: '#eef', speed: 60, gravity: -120, size: 7, life: 1 });
        if (Math.random() < .05) this.api.sfx('break');
      }
    }
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
    const lo = K.stone;
    if (K.massBetween(lo, lo + r.d) < need) return { z: lo, floating: false };
    let a = lo, b = Math.max(lo, K.level());
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
    if (this.lavaHit) return this.fail(T('Lava reached the king! Never let lava fall into his tank.', 'وصلت الحمم إلى الملك! لا تدع الحمم تسقط في حوضه أبدًا.'));
    const raftTop = K.bottom - r.z - r.d;
    const liquidTop = K.surfaceY();
    if (!r.floating && liquidTop < raftTop - 6) {
      const liq = K.layers().at(-1)?.liq || 'water';
      return this.fail(T(`The raft (${r.rho} kg/m³) is denser than the liquid below it, so it sank and the king got wet! Choose a denser liquid.`,
        `الطوف (${r.rho} كجم/م³) أكثف من السائل تحته فغرق وتبلّل الملك! اختر سائلًا أكثف.`), liq);
    }
    const P = K.pressureAt(K.bottom) / 1000;
    const unlocked = !K.lock || P >= K.lock;
    if (r.floating && raftTop <= K.door.sill + 4 && unlocked) {
      this.state = 'exit';
      this.api.sfx('ding');
      this.api.banner(T('The king is free!', 'تحرر الملك!'));
      return;
    }
    const left = this.pins.some(p => !p.pulled);
    if (flow < 40) this.calm += dt; else this.calm = 0;
    if (!left && this.calm > 1.5) {
      if (!unlocked) this.fail(T(`The pressure lock needs ${K.lock} kPa at the bottom but only got ${fmt(P, 1)} kPa. P = ρgh — a denser liquid gives more pressure.`,
        `قفل الضغط يحتاج ${K.lock} كيلوباسكال عند القاع لكنه حصل على ${fmt(P, 1)} فقط. P = ρgh — السائل الأكثف يعطي ضغطًا أكبر.`));
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
      { sym: 'h', name: T('liquid depth', 'عمق السائل'), value: fmt((t.level() - t.stone) / PPM, 2), unit: 'm' },
      { sym: 'ρ', name: T('density (bottom)', 'الكثافة (القاع)'), value: bottomLiq ? LIQ[bottomLiq].rho : '—', unit: 'kg/m³' },
      { sym: 'P', name: T('pressure at bottom', 'الضغط عند القاع'), value: fmt(P / 1000, 2), unit: 'kPa', hl: true }
    ];
    const active = this.pins.find(p => p.q && Math.abs(p.q) > 1);
    if (active) rows.push({ sym: 'v', name: T('outflow speed √(2P/ρ)', 'سرعة التدفق √(2P/ρ)'), value: fmt(active.v, 2), unit: 'm/s' });
    const r = this.K.raft;
    const Vm = (r.w / PPM) * (r.d / PPM) * 1;                     // raft: 1 m × 0.3 m × 1 m
    const sub = this.K.massBetween(r.z, r.z + r.d) / PPM;           // Σ ρ·depth (kg/m²)
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
    // castle wall
    ctx.fillStyle = '#3b2f63'; ctx.fillRect(0, 0, W, 600);
    ctx.fillStyle = '#45386f';
    for (let row = 0; row < 16; row++) for (let c = 0; c < 14; c++) {
      roundRect(ctx, c * 76 + (row % 2) * 38 - 30, row * 40 + 2, 72, 36, 5); ctx.fill();
    }
    ctx.fillStyle = '#2a2148'; ctx.fillRect(0, 565, W, 35);
    for (const x of [60, 940]) this.drawTorch(ctx, x, 120);

    for (const pin of this.pins) this.drawStream(ctx, pin);
    for (const t of this.tanks) this.drawTank(ctx, t);
    this.drawDoor(ctx);
    this.drawRaft(ctx);
    for (const pin of this.pins) this.drawPin(ctx, pin);
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
    // glass back
    ctx.fillStyle = 'rgba(200,225,255,.12)';
    ctx.fillRect(t.x, t.y, t.w, t.h);
    // liquid layers
    let base = t.bottom;
    if (t.stone > 0) {
      ctx.fillStyle = '#3a3a48'; ctx.fillRect(t.x, base - t.stone, t.w, t.stone);
      ctx.fillStyle = '#55556a';
      for (let x = t.x + 8; x < t.x + t.w - 8; x += 22) { ctx.beginPath(); ctx.arc(x, base - t.stone / 2, Math.min(8, t.stone / 2), 0, 7); ctx.fill(); }
      base -= t.stone;
    }
    const layers = t.layers();
    layers.forEach((l, i) => {
      const top = base - l.h;
      const c = LIQ[l.liq];
      ctx.fillStyle = c.color;
      ctx.globalAlpha = l.liq === 'lava' ? 1 : .85;
      ctx.beginPath();
      ctx.moveTo(t.x, base);
      if (i === layers.length - 1) {
        for (let x = 0; x <= t.w; x += 10) ctx.lineTo(t.x + x, top + Math.sin(this.time * 3 + x * .08) * Math.min(2.5, l.h / 4));
      } else { ctx.lineTo(t.x, top); ctx.lineTo(t.x + t.w, top); }
      ctx.lineTo(t.x + t.w, base);
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = c.top; ctx.fillRect(t.x, top, t.w, 2);
      if (l.liq === 'lava') {
        ctx.fillStyle = '#ffd23f';
        for (let k = 0; k < 4; k++) { const bx = t.x + ((k * 53 + this.time * 20) % t.w); ctx.beginPath(); ctx.arc(bx, base - (l.h * ((k * .3 + this.time * .4) % 1)), 3, 0, 7); ctx.fill(); }
      }
      base = top;
    });
    // walls
    ctx.strokeStyle = this.selected === t ? '#ffe066' : '#e8e0ff';
    ctx.lineWidth = 7; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(t.x - 3, t.y); ctx.lineTo(t.x - 3, t.bottom + 3); ctx.lineTo(t.x + t.w + 3, t.bottom + 3); ctx.lineTo(t.x + t.w + 3, t.y); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(t.x + 6, t.y + 6, 6, t.h - 12);
    // depth ruler + gauge
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    for (let d = 50; d < t.h; d += 50) ctx.fillRect(t.x + t.w - 10, t.bottom - d, 8, 2);
    this.drawGauge(ctx, t);
    if (t !== this.K && t.vol && layers.length === 0 && t.stone === 0) label(ctx, T('empty', 'فارغ'), t.x + t.w / 2, t.y + t.h / 2, { size: 14, color: 'rgba(255,255,255,.5)', stroke: null });
  }

  drawGauge(ctx, t) {
    const P = t.pressureAt(t.bottom) / 1000;
    const x = t.x + 26, y = t.y + 26, r = 18;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.strokeStyle = '#241a4f'; ctx.lineWidth = 2; ctx.stroke();
    const a = Math.PI * .75 + clamp(P / 30, 0, 1) * Math.PI * 1.5;
    ctx.strokeStyle = '#e63946'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * (r - 4), y + Math.sin(a) * (r - 4)); ctx.stroke();
    if (t.lock) {
      const la = Math.PI * .75 + clamp(t.lock / 30, 0, 1) * Math.PI * 1.5;
      ctx.strokeStyle = '#2ed3a0'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(x, y, r - 2, la - .08, la + .08); ctx.stroke();
    }
    label(ctx, `${fmt(P, 1)} kPa`, x + r + 34, y, { size: 13 });
  }

  drawStream(ctx, pin) {
    if (!pin.q || Math.abs(pin.q) < 1) return;
    const c = LIQ[pin.liq];
    if (pin.kind === 'bottom') {
      const t = this.byId[pin.tank];
      const to = pin.to ? this.byId[pin.to] : null;
      const y0 = t.bottom + 6, y1 = to ? to.surfaceY() : 620;
      const w = clamp(pin.q / 700, 3, 16);
      ctx.fillStyle = c.color;
      ctx.globalAlpha = .9;
      ctx.beginPath();
      ctx.moveTo(pin.x - w / 2, y0); ctx.lineTo(pin.x + w / 2, y0);
      ctx.lineTo(pin.x + w / 2.6, y1); ctx.lineTo(pin.x - w / 2.6, y1); ctx.fill();
      ctx.globalAlpha = 1;
      if (Math.random() < .5) this.fx.emit(pin.x, y1, 1, { color: c.top, speed: 120, size: 3, dir: -Math.PI / 2, spread: 2, life: .4 });
    } else {
      const A = this.byId[pin.a], B = this.byId[pin.b];
      const x0 = A.x + A.w, x1 = B.x;
      ctx.fillStyle = c.color;
      ctx.fillRect(x0 - 2, pin.y - 9, x1 - x0 + 4, 18);
      const dir = Math.sign(pin.q);
      ctx.fillStyle = '#fff';
      const ph = (this.time * 2) % 1;
      ctx.beginPath(); const ax = x0 + (x1 - x0) * ph;
      ctx.moveTo(ax + 4 * dir, pin.y); ctx.lineTo(ax - 3 * dir, pin.y - 4); ctx.lineTo(ax - 3 * dir, pin.y + 4); ctx.fill();
    }
  }

  drawPin(ctx, pin) {
    if (pin.anim >= 1) return;
    const g = this.pinGeom(pin);
    // nozzle / channel
    if (pin.kind === 'bottom') {
      const t = this.byId[pin.tank];
      ctx.fillStyle = '#cfc4f3';
      ctx.fillRect(pin.x - 14, t.bottom + 2, 28, 22);
    } else {
      const A = this.byId[pin.a], B = this.byId[pin.b];
      ctx.fillStyle = '#cfc4f3';
      ctx.fillRect(A.x + A.w, pin.y - 12, B.x - A.x - A.w, 24);
    }
    ctx.globalAlpha = 1 - pin.anim;
    const hot = this.hover === pin;
    ctx.strokeStyle = hot ? '#fff3b0' : '#ffc93c';
    ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(g.a.x, g.a.y); ctx.lineTo(g.b.x, g.b.y); ctx.stroke();
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(g.ring.x, g.ring.y, 11, 0, 7); ctx.stroke();
    label(ctx, String(pin.n), g.ring.x, g.ring.y, { size: 13, color: '#fff' });
    ctx.globalAlpha = 1;
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
      label(ctx, open ? '🔓' : '🔒', x + 28, y - 80, { size: 22, stroke: null });
      label(ctx, `≥ ${K.lock} kPa`, x + 28, y - 104, { size: 13, color: open ? '#2ed3a0' : '#ffb3b3' });
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
    label(ctx, `${r.rho}`, cx, top + r.d / 2, { size: 11, color: '#fff', stroke: 'rgba(0,0,0,.4)' });
    // king
    let kx = cx, ky = top, mood = 'happy';
    if (this.state === 'exit') {
      const t = clamp(this.king.walk / 1.2, 0, 1);
      kx = cx + (K.x + K.w + 80 - cx) * t;
      ky = top + (K.door.sill - top) * Math.min(1, t * 2);
    }
    if (this.state === 'lost') mood = 'sad';
    const bob = this.state === 'exit' ? Math.abs(Math.sin(this.king.walk * 12)) * -4 : 0;
    drawKing(ctx, kx, ky + bob, 1, mood);
  }
}

export default {
  id: 'water',
  levels: LEVELS,
  quiz: QUIZ,
  formulas: [
    { expr: 'P = ρ g h', label: { en: 'Pressure at depth h', ar: 'الضغط عند العمق h' } },
    { expr: 'P = P₀ + ρ g h', label: { en: 'Absolute pressure', ar: 'الضغط المطلق' } },
    { expr: 'F_b = ρ_f V_sub g', label: { en: "Archimedes' buoyant force", ar: 'قوة الطفو (أرخميدس)' } },
    { expr: 'ρ_obj < ρ_f  ⇒  floats', label: { en: 'Floating condition', ar: 'شرط الطفو' } },
    { expr: 'v = √(2 g h)', label: { en: "Torricelli's outflow speed", ar: 'سرعة التدفق (تورشيلّي)' } },
    { expr: 'P_A = P_B (same depth)', label: { en: 'Connected vessels', ar: 'الأواني المستطرقة' } }
  ],
  terms: [
    { en: 'Pressure', ar: 'الضغط' }, { en: 'Density', ar: 'الكثافة' }, { en: 'Buoyant force', ar: 'قوة الطفو' },
    { en: "Archimedes' principle", ar: 'مبدأ أرخميدس' }, { en: 'Connected vessels', ar: 'الأواني المستطرقة' },
    { en: 'Pascal (Pa)', ar: 'الباسكال' }, { en: 'Fluid', ar: 'المائع' }
  ],
  tutorial: [
    { en: 'Tap a golden pin (or press its number key) to pull it. Liquid flows through the opening.', ar: 'اضغط على المسمار الذهبي (أو رقمه في لوحة المفاتيح) لسحبه. سيتدفق السائل عبر الفتحة.' },
    { en: 'The king stands on a raft. If the raft floats, rising liquid lifts him to the door.', ar: 'يقف الملك على طوف. إذا طفا الطوف فإن السائل المرتفع يرفعه نحو الباب.' },
    { en: 'Every liquid has a density ρ (written on the panel). Denser liquids sink below lighter ones and push harder: P = ρgh.', ar: 'لكل سائل كثافة ρ (مكتوبة في اللوحة). السوائل الأكثف تستقر أسفل الأخف وتضغط أكثر: P = ρgh.' },
    { en: 'Tap any tank to read its depth and the pressure at its bottom in the lab panel.', ar: 'اضغط على أي حوض لتقرأ عمقه والضغط عند قاعه في لوحة المختبر.' },
    { en: 'Avoid traps: lava, drains and the wrong liquid! Pulling only the needed pins gives more stars.', ar: 'تجنب الفخاخ: الحمم وفتحات التصريف والسائل الخطأ! سحب المسامير اللازمة فقط يعطي نجومًا أكثر.' }
  ],
  create: (api, i) => new WaterGame(api, i)
};
