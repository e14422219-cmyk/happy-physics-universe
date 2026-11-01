// Energy Rider: Roller Coaster Challenge — Conservation of Mechanical Energy
import { T } from '../i18n.js';
import { W } from '../engine.js';
import { clamp, fmt, Particles, roundRect, label, starsByAttempt } from '../util.js';

const PPM = 20;            // 20 px = 1 m
const GROUND = 560;
const LOOP_SHIFT = 36;     // px between loop entry and exit
const BRAKE = 6;           // station brake deceleration (m/s²)

const hOf = y => (GROUND - y) / PPM;
const yOf = h => GROUND - h * PPM;

const LEVELS = [
  {
    name: { en: 'First Drop', ar: 'الهبوط الأول' }, g: 9.8, mu: 0, h0: 9, vmax: 16,
    pts: [[200, yOf(4.5)], [330, yOf(1)], [480, yOf(12)], [630, yOf(1)], [780, yOf(1)], [985, yOf(1)]],
    station: [790, 970],
    learn: {
      en: 'Without friction, mechanical energy is conserved: mgh₀ = ½mv² + mgh. The cart can only climb a hill lower than its starting height.',
      ar: 'بدون احتكاك تبقى الطاقة الميكانيكية محفوظة: mgh₀ = ½mv² + mgh. لا تستطيع العربة صعود تل أعلى من ارتفاع بدايتها.'
    }
  },
  {
    name: { en: 'Loop the Loop', ar: 'الحلقة الدائرية' }, g: 9.8, mu: 0, h0: 9, vmax: 15,
    pts: [[200, yOf(4.5)], [330, yOf(1)], [450, yOf(1), 4], [600, yOf(1)], [720, yOf(3)], [790, yOf(3)], [985, yOf(3)]],
    station: [800, 970],
    learn: {
      en: 'At the top of a loop of radius r the cart needs v² ≥ g r. From energy conservation this means starting at least 2.5 r above the bottom of the loop.',
      ar: 'عند قمة حلقة نصف قطرها r تحتاج العربة إلى v² ≥ g r. ومن حفظ الطاقة يعني ذلك أن تبدأ من ارتفاع لا يقل عن 2.5 r فوق قاع الحلقة.'
    }
  },
  {
    name: { en: 'Friction Hill', ar: 'تل الاحتكاك' }, g: 9.8, mu: .04, h0: 10, vmax: 14,
    pts: [[200, yOf(4.5)], [330, yOf(1)], [480, yOf(10)], [630, yOf(1)], [780, yOf(1)], [985, yOf(1)]],
    station: [790, 970],
    learn: {
      en: 'Friction converts mechanical energy into thermal energy. The total energy is still conserved: mgh₀ = KE + PE + E_thermal.',
      ar: 'يحوّل الاحتكاك جزءًا من الطاقة الميكانيكية إلى طاقة حرارية. لكن الطاقة الكلية تبقى محفوظة: mgh₀ = KE + PE + E_حرارية.'
    }
  },
  {
    name: { en: 'Mars Coaster', ar: 'أفعوانية المريخ' }, g: 3.71, mu: 0, h0: 8, vmax: 10, mass: true,
    pts: [[200, yOf(4.5)], [330, yOf(.5)], [480, yOf(11)], [630, yOf(.5)], [780, yOf(.5)], [985, yOf(.5)]],
    station: [790, 970],
    learn: {
      en: 'Mass cancels out: v = √(2g(h₀ − h)) does not depend on m. Gravity g matters for speed — on Mars the same height gives a slower ride.',
      ar: 'الكتلة تُختصر: v = √(2g(h₀ − h)) لا تعتمد على m. أما g فتؤثر في السرعة — على المريخ يعطي الارتفاع نفسه سرعة أقل.'
    }
  },
  {
    name: { en: 'Grand Coaster', ar: 'الأفعوانية الكبرى' }, g: 9.8, mu: .02, h0: 8, vmax: 13,
    pts: [[180, yOf(4.5)], [300, yOf(1)], [400, yOf(1), 3], [520, yOf(1)], [650, yOf(9)], [770, yOf(2)], [860, yOf(2)], [985, yOf(2)]],
    station: [870, 970],
    learn: {
      en: 'Real designers balance everything: enough energy for loops and hills, minus friction losses, but not so much that the train arrives too fast.',
      ar: 'المصممون الحقيقيون يوازنون كل شيء: طاقة كافية للحلقات والتلال مع خصم خسائر الاحتكاك، دون أن يصل القطار بسرعة كبيرة.'
    }
  }
];

const QUIZ = [
  {
    q: { en: 'A cart starts from rest at 10 m (no friction). Its speed at ground level is…', ar: 'عربة تبدأ من السكون على ارتفاع 10 م (بلا احتكاك). سرعتها عند سطح الأرض…' },
    options: [{ en: '≈ 14 m/s', ar: '≈ 14 م/ث' }, { en: '≈ 98 m/s', ar: '≈ 98 م/ث' }, { en: '≈ 10 m/s', ar: '≈ 10 م/ث' }],
    answer: 0,
    explain: { en: 'v = √(2gh) = √(2 × 9.8 × 10) ≈ 14 m/s.', ar: 'v = √(2gh) = √(2 × 9.8 × 10) ≈ 14 م/ث.' }
  },
  {
    q: { en: 'Minimum start height (above the loop bottom) for a loop of radius 4 m?', ar: 'أقل ارتفاع بداية (فوق قاع الحلقة) لحلقة نصف قطرها 4 م؟' },
    options: [{ en: '8 m', ar: '8 م' }, { en: '10 m', ar: '10 م' }, { en: '4 m', ar: '4 م' }],
    answer: 1,
    explain: { en: 'h ≥ 2.5 r = 2.5 × 4 = 10 m.', ar: 'h ≥ 2.5 r = 2.5 × 4 = 10 م.' }
  },
  {
    q: { en: 'With friction, the mechanical energy (KE + PE)…', ar: 'مع وجود الاحتكاك، الطاقة الميكانيكية (KE + PE)…' },
    options: [{ en: 'stays constant', ar: 'تبقى ثابتة' }, { en: 'decreases', ar: 'تتناقص' }, { en: 'increases', ar: 'تتزايد' }],
    answer: 1,
    explain: { en: 'Part of it becomes thermal energy; the total energy is still conserved.', ar: 'يتحول جزء منها إلى طاقة حرارية، وتبقى الطاقة الكلية محفوظة.' }
  },
  {
    q: { en: 'Doubling the mass of the cart (no friction) changes its speed at the bottom by…', ar: 'مضاعفة كتلة العربة (بلا احتكاك) تغيّر سرعتها في الأسفل بمقدار…' },
    options: [{ en: 'factor 2', ar: 'الضعف' }, { en: 'factor √2', ar: '√2 مرة' }, { en: 'nothing', ar: 'لا تتغير' }],
    answer: 2,
    explain: { en: 'mgh = ½mv² → m cancels.', ar: 'mgh = ½mv² ← تُختصر m.' }
  },
  {
    q: { en: 'At the highest point of its path, a cart has its maximum…', ar: 'عند أعلى نقطة في مسارها تكون للعربة أكبر قيمة من…' },
    options: [{ en: 'kinetic energy', ar: 'الطاقة الحركية' }, { en: 'potential energy', ar: 'طاقة الوضع' }, { en: 'speed', ar: 'السرعة' }],
    answer: 1,
    explain: { en: 'PE = mgh is largest where h is largest.', ar: 'PE = mgh تكون أكبر حيث يكون h أكبر.' }
  }
];

class EnergyGame {
  constructor(api, li) {
    this.api = api;
    this.lv = LEVELS[li];
    this.letterbox = '#ff9a8b';
    this.letterboxBottom = '#5aa64a';
    this.g = this.lv.g;
    this.mu = this.lv.mu;
    this.m = 500;
    this.h0 = this.lv.h0;
    this.runs = 0;
    this.state = 'edit';
    this.time = 0;
    this.fx = new Particles();
    this.build();
    this.reset();

    this.sH = api.slider({ label: T('Start height h₀', 'ارتفاع البداية h₀'), min: 3, max: 24, step: .5, value: this.h0, unit: 'm', onInput: v => this.setH0(v) });
    if (this.lv.mass) api.slider({ label: T('Cart mass m', 'كتلة العربة m'), min: 100, max: 2000, step: 100, value: this.m, unit: 'kg', digits: 0, onInput: v => { this.m = v; } });
    api.buttons([{ label: T('▶ GO!', '▶ انطلق!'), cls: 'mint', onClick: () => this.go() }, { label: T('↺ Back to start', '↺ للبداية'), cls: 'ghost', onClick: () => this.reset() }]);
    api.note(T(`g = ${this.g} m/s² • friction μ = ${this.mu} • station brakes handle up to ${this.lv.vmax} m/s`,
      `g = ${this.g} م/ث² • معامل الاحتكاك μ = ${this.mu} • فرامل المحطة تتحمل حتى ${this.lv.vmax} م/ث`));
    api.hint(T('Drag the yellow knob (or use the slider) to set the start height, then press GO.', 'اسحب المقبض الأصفر (أو المنزلق) لضبط ارتفاع البداية، ثم اضغط «انطلق».'));
  }

  setH0(v) {
    if (this.state === 'run') return;
    this.h0 = clamp(Math.round(v * 2) / 2, 3, 24);
    this.sH?.set(this.h0);
    this.build();
    this.reset();
  }

  // ---------- track ----------
  build() {
    const P = [[70, yOf(this.h0)], ...this.lv.pts].map(([x, y, loop]) => ({ x, y, loop }));
    const out = [];
    const cr = (a, b, c, d, t) => .5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || P[i + 1];
      const n = 24;
      for (let k = 0; k < n; k++) {
        const t = k / n;
        out.push({ x: cr(p0.x, p1.x, p2.x, p3.x, t), y: cr(p0.y, p1.y, p2.y, p3.y, t) });
      }
      if (p2.loop) {
        const R = p2.loop * PPM, cx = p2.x, cy = p2.y - R;
        const n2 = 90;
        for (let k = 0; k < n2; k++) {
          const phi = -Math.PI / 2 + 2 * Math.PI * k / n2;
          out.push({ x: cx + R * Math.cos(phi) + LOOP_SHIFT * k / n2, y: cy - R * Math.sin(phi), phi, R: p2.loop });
        }
        p2.x += LOOP_SHIFT;
      }
    }
    out.push({ x: P.at(-1).x, y: P.at(-1).y });
    let s = 0;
    out.forEach((p, i) => { if (i) s += Math.hypot(p.x - out[i - 1].x, p.y - out[i - 1].y); p.s = s; });
    this.track = out;
    this.total = s;
    const lastLoop = out.reduce((m, p, i) => p.phi !== undefined ? i : m, -1);
    this.stationS = out.find((p, i) => i > lastLoop && p.x >= this.lv.station[0]).s;
    this.hMin = Math.min(...out.map(p => hOf(p.y)));
  }

  at(s) {
    const tr = this.track;
    let lo = 0, hi = tr.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tr[m].s <= s) lo = m; else hi = m; }
    const a = tr[lo], b = tr[hi];
    const len = (b.s - a.s) || 1, t = clamp((s - a.s) / len, 0, 1);
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, sin: -(b.y - a.y) / len, cos: (b.x - a.x) / len, phi: a.phi, R: a.R, ang: Math.atan2(b.y - a.y, b.x - a.x) };
  }

  // ---------- control ----------
  reset() {
    this.state = 'edit';
    this.s = 0; this.v = 0; this.eth = 0; this.maxS = 0; this.stall = 0; this.inStation = false; this.vIn = 0; this.trail = [];
    this.vTop = null;
  }
  go() {
    if (this.state === 'done') return;
    this.reset();
    this.state = 'run';
    this.runs++;
    this.api.sfx('launch');
    this.api.hint('');
  }
  down(p) {
    if (this.state === 'run') return;
    const y = yOf(this.h0);
    if (Math.hypot(p.x - 70, p.y - y) < 40 || (p.x < 110 && p.y < GROUND)) this.dragH = true;
  }
  move(p) { if (this.dragH) this.setH0(hOf(p.y)); }
  up() { this.dragH = false; }
  key(e) {
    if (e.key === 'ArrowUp') { this.setH0(this.h0 + .5); return true; }
    if (e.key === 'ArrowDown') { this.setH0(this.h0 - .5); return true; }
    if (e.key === ' ' || e.key === 'Enter') { this.go(); return true; }
    return false;
  }

  fail(msg) {
    this.state = 'crash';
    this.api.sfx('bad');
    this.api.banner(msg, true, 3200);
    const p = this.at(this.s);
    this.fx.emit(p.x, p.y, 25, { color: ['#ff6b6b', '#ffd23f', '#555'], speed: 250, size: 5 });
    setTimeout(() => { if (this.state === 'crash') this.reset(); }, 2600);
  }

  // ---------- physics ----------
  update(dt) {
    this.time += dt;
    this.fx.update(dt);
    if (this.state === 'run') {
      const n = 12, h = dt / n;
      for (let i = 0; i < n && this.state === 'run'; i++) this.step(h);
    }
    this.updateVars();
  }

  step(h) {
    const g = this.g;
    const p = this.at(this.s);
    if (this.inStation) {
      this.v = Math.max(0, this.v - this.brake * h);
      this.s += this.v * PPM * h;
      if (this.v <= 0) this.finish();
      if (this.s >= this.total - 5) this.fail(T('The cart flew past the station!', 'تجاوزت العربة المحطة!'));
      return;
    }
    let a = -g * p.sin;
    if (this.mu && Math.abs(this.v) > 1e-3) a -= this.mu * g * Math.abs(p.cos) * Math.sign(this.v);
    else if (this.mu && Math.abs(a) < this.mu * g * Math.abs(p.cos)) a = 0;
    this.v += a * h;
    const ds = this.v * PPM * h;
    this.s += ds;
    this.eth += this.mu * this.m * g * Math.abs(p.cos) * Math.abs(ds) / PPM;
    if (this.s < 0) { this.s = 0; this.v = 0; }

    if (p.phi !== undefined) {
      const N = this.v * this.v / p.R - g * Math.sin(p.phi);
      if (Math.sin(p.phi) > .9) this.vTop = this.v;
      if (N < 0) {
        const need = 2.5 * p.R;
        return this.fail(T(`Fell from the loop! At the top you need v² ≥ g·r (start ≥ ${fmt(need, 1)} m above the loop bottom).`,
          `سقطت العربة من الحلقة! عند القمة تحتاج v² ≥ g·r (ابدأ من ${fmt(need, 1)} م على الأقل فوق قاع الحلقة).`));
      }
    }
    if (this.s > this.maxS + .5) { this.maxS = this.s; this.stall = 0; } else this.stall += h;
    if (this.stall > 3) {
      return this.fail(T('Not enough energy — the cart rolled back! Its kinetic energy ran out before the top of the hill.',
        'الطاقة غير كافية — رجعت العربة للخلف! نفدت طاقتها الحركية قبل قمة التل.'));
    }
    if (this.s >= this.stationS && this.v > 0) {
      this.vIn = this.v;
      if (this.v > this.lv.vmax) {
        return this.fail(T(`Too fast! Arrived at ${fmt(this.v, 1)} m/s but the brakes handle only ${this.lv.vmax} m/s. Start lower.`,
          `سريعة جدًا! وصلت بسرعة ${fmt(this.v, 1)} م/ث والفرامل تتحمل ${this.lv.vmax} م/ث فقط. ابدأ من ارتفاع أقل.`));
      }
      this.inStation = true;
      const lenM = (this.lv.station[1] - this.lv.station[0]) / PPM;
      this.brake = Math.max(BRAKE, this.v * this.v / (2 * .8 * lenM));
      this.api.sfx('ding');
    }
    if (Math.random() < .02) this.trail.push({ x: p.x, y: p.y });
  }

  finish() {
    if (this.state !== 'run') return;
    this.state = 'done';
    const p = this.at(this.s);
    this.fx.emit(p.x, p.y - 30, 40, { color: ['#ffd23f', '#2ed3a0', '#ff5d8f', '#4d7cff'], speed: 320, size: 5 });
    this.api.win(starsByAttempt(this.runs));
  }

  energies() {
    const p = this.at(this.s);
    const hh = hOf(p.y);
    const KE = .5 * this.m * this.v * this.v;
    const PE = this.m * this.g * hh;
    return { KE, PE, TH: this.eth, h: hh, E0: this.m * this.g * this.h0 };
  }

  updateVars() {
    const e = this.energies();
    this.api.setVars([
      { sym: 'h₀', name: T('start height', 'ارتفاع البداية'), value: fmt(this.h0, 1), unit: 'm' },
      { sym: 'h', name: T('current height', 'الارتفاع الحالي'), value: fmt(e.h, 1), unit: 'm' },
      { sym: 'v', name: T('speed', 'السرعة'), value: fmt(Math.abs(this.v), 2), unit: 'm/s', hl: true },
      { sym: 'KE', name: '½ m v²', value: fmt(e.KE / 1000, 1), unit: 'kJ' },
      { sym: 'PE', name: 'm g h', value: fmt(e.PE / 1000, 1), unit: 'kJ' },
      { sym: 'E_th', name: T('thermal (friction)', 'حرارية (احتكاك)'), value: fmt(e.TH / 1000, 1), unit: 'kJ' },
      { sym: 'E', name: T('total KE + PE + E_th', 'الكلية KE + PE + E_th'), value: fmt((e.KE + e.PE + e.TH) / 1000, 1), unit: 'kJ', hl: true },
      { sym: 'm', name: T('mass', 'الكتلة'), value: this.m, unit: 'kg' }
    ]);
  }

  // ---------- drawing ----------
  draw(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
    if (this.g < 5) { sky.addColorStop(0, '#d9733f'); sky.addColorStop(1, '#ffcf9e'); }
    else { sky.addColorStop(0, '#ff9a8b'); sky.addColorStop(1, '#ffe0a3'); }
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, 600);
    ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(820, 130, 40, 0, 7); ctx.fill();
    // ferris wheel silhouette
    ctx.strokeStyle = 'rgba(120,60,90,.25)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(640, 300, 120, 0, 7); ctx.stroke();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + this.time * .1; ctx.beginPath(); ctx.moveTo(640, 300); ctx.lineTo(640 + Math.cos(a) * 120, 300 + Math.sin(a) * 120); ctx.stroke(); }
    ctx.fillStyle = this.g < 5 ? '#b5532a' : '#6bbf59'; ctx.fillRect(0, GROUND, W, 40);
    ctx.fillStyle = this.g < 5 ? '#8f3d1c' : '#5aa64a'; ctx.fillRect(0, GROUND + 12, W, 40);

    // height ruler
    for (let h = 0; h <= 25; h += 5) {
      ctx.fillStyle = 'rgba(80,30,60,.5)'; ctx.fillRect(16, yOf(h) - 1, 12, 2);
      label(ctx, `${h}m`, 40, yOf(h), { size: 11, color: '#fff', stroke: 'rgba(80,30,60,.5)' });
    }

    this.drawTrack(ctx);
    this.drawStation(ctx);
    // start knob
    const sy = yOf(this.h0);
    ctx.fillStyle = '#7a3d2e'; ctx.fillRect(66, sy, 8, GROUND - sy);
    if (this.state !== 'run') {
      ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(70, sy - 20, 13, 0, 7); ctx.fill();
      ctx.strokeStyle = '#7a3d2e'; ctx.lineWidth = 3; ctx.stroke();
      label(ctx, '⇕', 70, sy - 20, { size: 14, color: '#7a3d2e', stroke: null });
      label(ctx, `h₀ = ${fmt(this.h0, 1)} m`, 135, sy - 22, { size: 15 });
    }
    this.drawCart(ctx);
    this.drawBars(ctx);
    this.fx.draw(ctx);
  }

  drawTrack(ctx) {
    const tr = this.track;
    ctx.strokeStyle = 'rgba(122,61,46,.6)'; ctx.lineWidth = 3;
    for (let i = 0; i < tr.length; i += 6) {
      const p = tr[i];
      if (p.phi !== undefined && Math.sin(p.phi) > -.95) continue;
      ctx.beginPath(); ctx.moveTo(p.x, p.y + 4); ctx.lineTo(p.x, GROUND); ctx.stroke();
    }
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (const [w, c] of [[10, '#8c1c2a'], [5, '#e63946']]) {
      ctx.strokeStyle = c; ctx.lineWidth = w;
      ctx.beginPath(); tr.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
    }
    // loop radius label
    const lp = tr.find(p => p.phi !== undefined && Math.abs(p.phi - Math.PI / 2) < .05);
    if (lp) label(ctx, `r = ${lp.R} m`, lp.x, lp.y + lp.R * PPM, { size: 13, color: '#fff' });
  }

  drawStation(ctx) {
    const [x1, x2] = this.lv.station;
    const p = this.track.find(q => q.x >= x1 && q.s >= this.stationS - 1);
    const y = p ? p.y : GROUND;
    ctx.fillStyle = 'rgba(46,211,160,.25)'; ctx.fillRect(x1, y - 70, x2 - x1, 66);
    ctx.fillStyle = '#2ed3a0'; ctx.fillRect(x1, y - 76, x2 - x1, 8);
    label(ctx, T(`STATION ≤ ${this.lv.vmax} m/s`, `المحطة ≤ ${this.lv.vmax} م/ث`), (x1 + x2) / 2, y - 92, { size: 14 });
  }

  drawCart(ctx) {
    const p = this.at(this.s);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.ang);
    ctx.translate(0, -12);
    ctx.fillStyle = '#ffd6a5'; ctx.strokeStyle = '#241a4f'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(-2, -22, 8, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#241a4f'; ctx.fillRect(-10, -33, 16, 5);
    ctx.beginPath(); ctx.arc(1, -23, 1.6, 0, 7); ctx.fill();
    ctx.fillStyle = '#00bb77'; roundRect(ctx, -20, -14, 40, 18, 6); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(-14, -10, 28, 3);
    ctx.fillStyle = '#241a4f';
    ctx.beginPath(); ctx.arc(-11, 6, 5, 0, 7); ctx.arc(11, 6, 5, 0, 7); ctx.fill();
    ctx.restore();
    if (this.state === 'run' || this.state === 'done') label(ctx, `${fmt(Math.abs(this.v), 1)} m/s`, p.x, p.y - 54, { size: 13, color: '#fff' });
  }

  drawBars(ctx) {
    const e = this.energies();
    const max = e.E0 || 1;
    const x = 820, y = 30, w = 165, h = 150;
    ctx.fillStyle = 'rgba(36,26,79,.7)'; roundRect(ctx, x, y, w, h, 14); ctx.fill();
    const bars = [['KE', e.KE, '#ff5d8f'], ['PE', e.PE, '#4d7cff'], ['E_th', e.TH, '#ff9f1c'], ['E', e.KE + e.PE + e.TH, '#2ed3a0']];
    bars.forEach(([n, v, c], i) => {
      const bx = x + 14 + i * 38, bh = clamp(v / max, 0, 1.05) * 100;
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(bx, y + 18, 26, 100);
      ctx.fillStyle = c; ctx.fillRect(bx, y + 118 - bh, 26, bh);
      label(ctx, n, bx + 13, y + 134, { size: 12, stroke: null });
    });
    label(ctx, T('Energy', 'الطاقة'), x + w / 2, y + 10, { size: 12, color: '#ffe066', stroke: null });
  }
}

export default {
  id: 'energy',
  levels: LEVELS,
  quiz: QUIZ,
  formulas: [
    { expr: 'KE = ½ m v²', label: { en: 'Kinetic energy', ar: 'الطاقة الحركية' } },
    { expr: 'PE = m g h', label: { en: 'Gravitational potential energy', ar: 'طاقة الوضع الجاذبية' } },
    { expr: 'KE₁ + PE₁ = KE₂ + PE₂', label: { en: 'Conservation of mechanical energy', ar: 'حفظ الطاقة الميكانيكية' } },
    { expr: 'v = √(2 g (h₀ − h))', label: { en: 'Speed from height', ar: 'السرعة من الارتفاع' } },
    { expr: 'v²_top ≥ g r  ⇒  h₀ ≥ 2.5 r', label: { en: 'Loop condition', ar: 'شرط الحلقة الدائرية' } },
    { expr: 'E_th = μ m g d', label: { en: 'Friction loss', ar: 'خسارة الاحتكاك' } }
  ],
  terms: [
    { en: 'Kinetic energy', ar: 'الطاقة الحركية' }, { en: 'Potential energy', ar: 'طاقة الوضع' },
    { en: 'Mechanical energy', ar: 'الطاقة الميكانيكية' }, { en: 'Conservation', ar: 'الحفظ' },
    { en: 'Friction', ar: 'الاحتكاك' }, { en: 'Thermal energy', ar: 'الطاقة الحرارية' }, { en: 'Joule (J)', ar: 'الجول' }
  ],
  tutorial: [
    { en: 'Drag the yellow knob on the start tower (or use the slider) to choose the start height h₀.', ar: 'اسحب المقبض الأصفر على برج البداية (أو المنزلق) لاختيار ارتفاع البداية h₀.' },
    { en: 'Press GO. The cart starts from rest, so its total energy is mgh₀.', ar: 'اضغط «انطلق». تبدأ العربة من السكون، فطاقتها الكلية mgh₀.' },
    { en: 'Watch the energy bars: potential energy turns into kinetic energy and back.', ar: 'راقب أعمدة الطاقة: طاقة الوضع تتحول إلى طاقة حركية والعكس.' },
    { en: 'Too low: the cart rolls back or falls from the loop. Too high: it arrives too fast for the station brakes.', ar: 'منخفض جدًا: ترجع العربة أو تسقط من الحلقة. مرتفع جدًا: تصل أسرع مما تتحمله فرامل المحطة.' },
    { en: 'Find the right height in the first run for 3 stars!', ar: 'جد الارتفاع الصحيح من أول محاولة لتحصل على 3 نجوم!' }
  ],
  create: (api, i) => new EnergyGame(api, i)
};
