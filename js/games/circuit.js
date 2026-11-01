// Circuit Quest: Light the City — Electrical Circuits and Ohm's Law
import { T } from '../i18n.js';
import { W } from '../engine.js';
import { clamp, fmt, Particles, roundRect, label, starsByAttempt } from '../util.js';
import { drawRobot } from '../art.js';

const R_WIRE = 0.01;
const R_INT = 0.5;              // battery internal resistance
const BULB_R = 10;
const P_DIM = 1.2, P_BURN = 5;  // bulb works between these powers (W)

// Nodal analysis: batteries become Norton sources (V/r in parallel with r).
export function solve(n, edges) {
  const G = Array.from({ length: n }, () => new Array(n).fill(0));
  const I = new Array(n).fill(0);
  const stamp = (a, b, g) => { G[a][a] += g; G[b][b] += g; G[a][b] -= g; G[b][a] -= g; };
  for (const e of edges) {
    if (e.type === 'bat') { stamp(e.a, e.b, 1 / R_INT); I[e.b] += e.value / R_INT; I[e.a] -= e.value / R_INT; }
    else stamp(e.a, e.b, 1 / resistance(e));
  }
  for (let i = 0; i < n; i++) G[i][i] += 1e-9;
  // drop ground row/column (node 0) and solve by Gaussian elimination
  const m = n - 1;
  const A = G.slice(1).map((row, i) => [...row.slice(1), I[i + 1]]);
  for (let c = 0; c < m; c++) {
    let p = c;
    for (let r = c + 1; r < m; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    for (let r = 0; r < m; r++) {
      if (r === c || !A[r][c]) continue;
      const f = A[r][c] / A[c][c];
      for (let k = c; k <= m; k++) A[r][k] -= f * A[c][k];
    }
  }
  const V = [0, ...A.map((row, i) => row[m] / row[i])];
  return edges.map(e => {
    const dv = V[e.b] - V[e.a];
    if (e.type === 'bat') { const i = (e.value - dv) / R_INT; return { v: dv, i, p: dv * i }; }
    const i = (V[e.a] - V[e.b]) / resistance(e);
    return { v: -dv, i, p: dv * dv / resistance(e) };
  });
}

function resistance(e) {
  if (e.type === 'wire') return R_WIRE;
  if (e.type === 'bulb') return BULB_R;
  return e.value;
}

// Levels: nodes [x, y]; edges {a, b, type, value} (battery: + terminal at b); slot: true = player fills it.
const LEVELS = [
  {
    name: { en: 'Close the Loop', ar: 'أغلق الدائرة' },
    nodes: [[200, 430], [200, 170], [620, 170], [620, 430]],
    edges: [
      { a: 0, b: 1, type: 'bat', value: 6 },
      { a: 1, b: 2, type: 'bulb' },
      { a: 2, b: 3, slot: true },
      { a: 3, b: 0, type: 'wire' }
    ],
    items: [{ type: 'wire' }],
    learn: {
      en: 'Current flows only around a closed loop. An open gap anywhere in a series circuit stops the current everywhere.',
      ar: 'يسري التيار فقط في مسار مغلق. أي فجوة مفتوحة في دائرة التوالي توقف التيار في كل مكان.'
    }
  },
  {
    name: { en: "Ohm's Law", ar: 'قانون أوم' },
    nodes: [[200, 430], [200, 170], [620, 170], [620, 430]],
    edges: [
      { a: 0, b: 1, type: 'bat', value: 12 },
      { a: 1, b: 2, slot: true },
      { a: 2, b: 3, type: 'bulb' },
      { a: 3, b: 0, type: 'wire' }
    ],
    items: [{ type: 'res', value: 2 }, { type: 'res', value: 10 }, { type: 'res', value: 50 }],
    learn: {
      en: "Ohm's law I = V/R: a larger series resistance reduces the current. Too little resistance burns the bulb, too much leaves it dim.",
      ar: 'قانون أوم I = V/R: زيادة المقاومة على التوالي تقلل التيار. مقاومة صغيرة جدًا تحرق المصباح، وكبيرة جدًا تجعله خافتًا.'
    }
  },
  {
    name: { en: 'Parallel Power', ar: 'قوة التوازي' },
    nodes: [[150, 450], [150, 150], [420, 150], [700, 150], [700, 450], [420, 450]],
    edges: [
      { a: 0, b: 1, type: 'bat', value: 6 },
      { a: 1, b: 2, slot: true },
      { a: 2, b: 5, slot: true },
      { a: 2, b: 3, type: 'wire' },
      { a: 3, b: 4, slot: true },
      { a: 4, b: 5, type: 'wire' },
      { a: 5, b: 0, type: 'wire' }
    ],
    items: [{ type: 'bulb' }, { type: 'bulb' }, { type: 'wire' }],
    learn: {
      en: 'In parallel, every branch gets the full battery voltage, so both bulbs shine brightly. In series they share the voltage and glow dimly.',
      ar: 'في التوازي يحصل كل فرع على جهد البطارية كاملًا فيضيء المصباحان بقوة. أما على التوالي فيتقاسمان الجهد ويضيئان بخفوت.'
    }
  },
  {
    name: { en: 'Light the Street', ar: 'أضئ الشارع' },
    nodes: [[130, 450], [130, 150], [330, 150], [520, 150], [710, 150], [710, 450], [520, 450], [330, 450]],
    edges: [
      { a: 0, b: 1, type: 'bat', value: 10 },
      { a: 1, b: 2, slot: true },
      { a: 2, b: 7, type: 'bulb' },
      { a: 2, b: 3, type: 'wire' },
      { a: 3, b: 6, type: 'bulb' },
      { a: 3, b: 4, type: 'wire' },
      { a: 4, b: 5, type: 'bulb' },
      { a: 5, b: 6, type: 'wire' },
      { a: 6, b: 7, type: 'wire' },
      { a: 7, b: 0, type: 'wire' }
    ],
    items: [{ type: 'wire' }, { type: 'res', value: 1 }, { type: 'res', value: 8 }],
    learn: {
      en: 'Three equal bulbs in parallel have an equivalent resistance of R/3. A small series resistor shares the voltage and protects them: R_eq = R₁ + R_parallel.',
      ar: 'ثلاثة مصابيح متساوية على التوازي مقاومتها المكافئة R/3. مقاومة صغيرة على التوالي تقاسمها الجهد وتحميها: R_eq = R₁ + R_توازي.'
    }
  },
  {
    name: { en: 'Battery Stack', ar: 'تكديس البطاريات' },
    nodes: [[150, 470], [150, 310], [150, 150], [430, 150], [700, 150], [700, 470], [430, 470]],
    edges: [
      { a: 0, b: 1, slot: true, bat: true },
      { a: 1, b: 2, slot: true, bat: true },
      { a: 2, b: 3, type: 'bulb' },
      { a: 3, b: 4, type: 'wire' },
      { a: 4, b: 5, type: 'bulb' },
      { a: 3, b: 6, slot: true },
      { a: 6, b: 5, type: 'wire' },
      { a: 5, b: 0, type: 'wire' }
    ],
    items: [{ type: 'bat', value: 6 }, { type: 'bat', value: 6 }, { type: 'wire' }, { type: 'res', value: 100 }],
    learn: {
      en: 'Batteries in series add their voltages (6 V + 6 V = 12 V). But a plain wire in parallel with a bulb is a short circuit: the current bypasses the bulb.',
      ar: 'البطاريات على التوالي تُجمع جهودها (6 + 6 = 12 فولت). أما السلك العادي الموصول على التوازي مع مصباح فهو قصر في الدائرة: يتجاوز التيار المصباح.'
    }
  }
];

const QUIZ = [
  {
    q: { en: 'Why did the bulb light only after the gap was closed?', ar: 'لماذا أضاء المصباح فقط بعد إغلاق الفجوة؟' },
    options: [{ en: 'Current needs a closed path', ar: 'التيار يحتاج مسارًا مغلقًا' }, { en: 'Wires store energy', ar: 'الأسلاك تخزن الطاقة' }, { en: 'The battery was empty', ar: 'البطارية كانت فارغة' }],
    answer: 0,
    explain: { en: 'Charges must be able to return to the battery.', ar: 'يجب أن تتمكن الشحنات من العودة إلى البطارية.' }
  },
  {
    q: { en: 'V = 12 V and R = 4 Ω. The current is…', ar: 'V = 12 فولت وR = 4 أوم. التيار يساوي…' },
    options: [{ en: '48 A', ar: '48 أمبير' }, { en: '3 A', ar: '3 أمبير' }, { en: '0.33 A', ar: '0.33 أمبير' }],
    answer: 1,
    explain: { en: 'I = V / R = 12 / 4 = 3 A.', ar: 'I = V / R = 12 / 4 = 3 أمبير.' }
  },
  {
    q: { en: 'Two 10 Ω bulbs in parallel have an equivalent resistance of…', ar: 'مصباحان 10 أوم على التوازي مقاومتهما المكافئة…' },
    options: [{ en: '20 Ω', ar: '20 أوم' }, { en: '10 Ω', ar: '10 أوم' }, { en: '5 Ω', ar: '5 أوم' }],
    answer: 2,
    explain: { en: '1/R = 1/10 + 1/10 → R = 5 Ω.', ar: '1/R = 1/10 + 1/10 ← R = 5 أوم.' }
  },
  {
    q: { en: 'Adding a resistor in series with a group of bulbs makes the total current…', ar: 'إضافة مقاومة على التوالي مع مجموعة مصابيح تجعل التيار الكلي…' },
    options: [{ en: 'larger', ar: 'أكبر' }, { en: 'smaller', ar: 'أصغر' }, { en: 'the same', ar: 'كما هو' }],
    answer: 1,
    explain: { en: 'R_eq increases, so I = V/R_eq decreases.', ar: 'تزداد R_eq فيقل I = V/R_eq.' }
  },
  {
    q: { en: 'What happens to a bulb that is short-circuited by a wire?', ar: 'ماذا يحدث لمصباح قُصرت دائرته بسلك؟' },
    options: [{ en: 'It glows brighter', ar: 'يضيء أكثر' }, { en: 'It goes dark', ar: 'ينطفئ' }, { en: 'Nothing changes', ar: 'لا شيء يتغير' }],
    answer: 1,
    explain: { en: 'Almost all the current takes the zero-resistance wire path.', ar: 'يسلك معظم التيار مسار السلك عديم المقاومة.' }
  }
];

class CircuitGame {
  constructor(api, li) {
    this.api = api;
    this.lv = LEVELS[li];
    this.letterbox = '#141d3d';
    this.nodes = this.lv.nodes.map(([x, y]) => ({ x, y }));
    this.edges = this.lv.edges.map(e => ({ ...e, placed: null }));
    this.items = this.lv.items.map((it, i) => ({ ...it, id: i, used: false }));
    this.sel = null;
    this.dragItem = null;
    this.power = false;
    this.result = null;
    this.attempts = 0;
    this.time = 0;
    this.phase = 0;
    this.fx = new Particles();
    this.done = false;

    api.buttons([
      { label: T('⚡ Power ON', '⚡ تشغيل'), cls: 'mint', onClick: () => this.togglePower() },
      { label: T('Clear', 'مسح'), cls: 'ghost', onClick: () => this.clear() }
    ]);
    api.note(T(`A bulb (${BULB_R} Ω) shines when its power is between ${P_DIM} W and ${P_BURN} W. Below: dim. Above: it burns!`,
      `يضيء المصباح (${BULB_R} أوم) عندما تكون قدرته بين ${P_DIM} و${P_BURN} واط. أقل: خافت. أكثر: يحترق!`));
    api.hint(T('Pick a part from the tray, then tap a dashed slot. Press Power when ready.', 'اختر قطعة من الصندوق ثم اضغط على خانة منقطة. اضغط «تشغيل» عندما تجهز.'));
  }

  get active() {
    return this.edges.map(e => {
      if (!e.slot) return e;
      if (!e.placed) return null;
      return { ...e, type: e.placed.type, value: e.placed.value };
    }).filter(Boolean);
  }

  // ---------- geometry ----------
  mid(e) { const a = this.nodes[e.a], b = this.nodes[e.b]; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, ang: Math.atan2(b.y - a.y, b.x - a.x) }; }
  trayPos(i) { const n = this.items.length; return { x: 500 - (n - 1) * 60 + i * 120, y: 548 }; }
  slotAt(p) { return this.edges.find(e => e.slot && Math.hypot(p.x - this.mid(e).x, p.y - this.mid(e).y) < 40); }
  itemAt(p) { return this.items.find((it, i) => !it.used && Math.abs(p.x - this.trayPos(i).x) < 52 && Math.abs(p.y - this.trayPos(i).y) < 38); }

  // ---------- input ----------
  down(p) {
    if (this.done) return;
    const it = this.itemAt(p);
    if (it) { this.dragItem = { it, x: p.x, y: p.y, moved: false, sx: p.x, sy: p.y }; return; }
    const s = this.slotAt(p);
    if (s) {
      if (this.power) this.powerOff();
      if (s.placed) { s.placed.used = false; s.placed = null; this.api.sfx('click'); }
      else if (this.sel) this.place(this.sel, s);
    }
  }
  move(p) {
    if (!this.dragItem) return;
    this.dragItem.x = p.x; this.dragItem.y = p.y;
    if (Math.hypot(p.x - this.dragItem.sx, p.y - this.dragItem.sy) > 10) this.dragItem.moved = true;
  }
  up(p) {
    const d = this.dragItem;
    this.dragItem = null;
    if (!d) return;
    if (!d.moved) { this.sel = this.sel === d.it ? null : d.it; this.api.sfx('click'); return; }
    const s = this.slotAt(p);
    if (s) this.place(d.it, s);
  }
  key(e) {
    if (e.key === ' ' || e.key === 'Enter') { this.togglePower(); return true; }
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= this.items.length) { const it = this.items[n - 1]; if (!it.used) this.sel = it; return true; }
    return false;
  }

  place(it, slot) {
    if (slot.bat && it.type !== 'bat' && it.type !== 'wire') { this.api.banner(T('That slot needs a battery or a wire', 'هذه الخانة تحتاج بطارية أو سلكًا'), true); return; }
    if (this.power) this.powerOff();
    if (slot.placed) slot.placed.used = false;
    slot.placed = it;
    slot.pop = 0;
    it.used = true;
    this.sel = null;
    this.api.sfx('click');
  }

  clear() {
    this.powerOff();
    for (const e of this.edges) if (e.placed) { e.placed.used = false; e.placed = null; }
  }

  togglePower() {
    if (this.done) return;
    if (this.power) return this.powerOff();
    this.power = true;
    this.attempts++;
    const act = this.active;
    const res = solve(this.nodes.length, act);
    this.res = new Map(act.map((e, i) => [e, res[i]]));
    this.solvedEdges = act;
    this.api.sfx('zap');
    const bulbs = act.map((e, i) => ({ e, r: res[i] })).filter(x => x.e.type === 'bulb');
    const batI = act.map((e, i) => ({ e, r: res[i] })).filter(x => x.e.type === 'bat').reduce((m, x) => Math.max(m, Math.abs(x.r.i)), 0);
    const st = bulbs.map(b => b.r.p > P_BURN ? 'burnt' : b.r.p < .05 ? 'dark' : b.r.p < P_DIM ? 'dim' : 'ok');
    this.status = new Map(bulbs.map((b, i) => [b.e, st[i]]));
    for (const b of bulbs) if (this.status.get(b.e) === 'burnt') { const m = this.mid(b.e); this.fx.emit(m.x, m.y, 25, { color: ['#ffe66d', '#ff6b6b', '#777'], speed: 220, size: 5 }); this.api.sfx('break'); }

    if (batI > 6) {
      this.api.banner(T('Short circuit! Huge current from the battery.', 'قصر في الدائرة! تيار هائل من البطارية.'), true, 2200);
      this.api.sfx('bad');
    } else if (st.every(s => s === 'ok')) {
      this.done = true;
      this.api.win(starsByAttempt(this.attempts));
    } else {
      const msg = st.includes('burnt') ? T('A bulb burnt out — too much current! Add resistance.', 'احترق مصباح — التيار كبير جدًا! أضف مقاومة.')
        : st.includes('dark') ? T('A bulb gets no current — open gap or short circuit?', 'مصباح لا يصله تيار — فجوة مفتوحة أم قصر في الدائرة؟')
          : T('Bulbs are too dim — not enough voltage across them.', 'المصابيح خافتة جدًا — الجهد عليها غير كافٍ.');
      this.api.banner(msg, true, 2600);
      this.api.sfx('bad');
    }
  }

  powerOff() { this.power = false; this.res = null; this.status = null; }

  // ---------- update ----------
  update(dt) {
    this.time += dt;
    this.phase += dt;
    this.fx.update(dt);
    for (const e of this.edges) if (e.pop !== undefined && e.pop < 1) e.pop = Math.min(1, e.pop + dt * 4);
    this.updateVars();
  }

  updateVars() {
    const rows = [];
    const act = this.power && this.res ? this.solvedEdges : this.active;
    const bats = act.filter(e => e.type === 'bat');
    const Vbat = bats.reduce((a, e) => a + e.value, 0);
    rows.push({ sym: 'ε', name: T('battery emf (total)', 'القوة الدافعة للبطارية'), value: fmt(Vbat, 1), unit: 'V' });
    if (this.power && this.res) {
      const br = bats.map(e => this.res.get(e));
      const I = br.length ? Math.abs(br[0].i) : 0;
      const Vt = br.reduce((a, r) => a + r.v, 0);
      rows.push(
        { sym: 'I', name: T('battery current', 'تيار البطارية'), value: fmt(I, 3), unit: 'A', hl: true },
        { sym: 'V', name: T('terminal voltage', 'الجهد الطرفي'), value: fmt(Vt, 2), unit: 'V' },
        { sym: 'R_eq', name: T('equivalent resistance V/I', 'المقاومة المكافئة V/I'), value: I > 1e-6 ? fmt(Vt / I, 2) : '∞', unit: 'Ω', hl: true }
      );
      act.filter(e => e.type === 'bulb').forEach((e, i) => {
        const r = this.res.get(e);
        rows.push({ sym: `💡${i + 1}`, name: `${fmt(Math.abs(r.v), 2)} V • ${fmt(Math.abs(r.i), 3)} A`, value: fmt(r.p, 2), unit: 'W', hl: this.status.get(e) !== 'ok' });
      });
    } else {
      rows.push({ sym: 'R', name: T('bulb resistance', 'مقاومة المصباح'), value: BULB_R, unit: 'Ω' });
      rows.push({ sym: 'r', name: T('battery internal resistance', 'المقاومة الداخلية'), value: R_INT, unit: 'Ω' });
      rows.push({ sym: '⏻', name: T('power', 'التشغيل'), value: T('OFF', 'مطفأ') });
    }
    this.api.setVars(rows);
  }

  // ---------- drawing ----------
  draw(ctx) {
    ctx.fillStyle = '#141d3d'; ctx.fillRect(0, 0, W, 600);
    // city skyline
    const ok = this.status ? [...this.status.values()].filter(s => s === 'ok').length : 0;
    const total = this.edges.filter(e => e.type === 'bulb' || e.placed?.type === 'bulb').length || 1;
    const lit = ok / total;
    ctx.fillStyle = '#1d2b53';
    const bld = [[790, 210, 70], [860, 150, 60], [920, 240, 80], [775, 330, 40]];
    for (const [x, y, w] of bld) ctx.fillRect(x, y, w, 600 - y);
    let k = 0;
    for (const [x, y, w] of bld) for (let yy = y + 14; yy < 500; yy += 30) for (let xx = x + 10; xx < x + w - 14; xx += 22) {
      ctx.fillStyle = (k++ % 7) / 7 < lit ? '#ffd23f' : '#2a3a6a';
      ctx.fillRect(xx, yy, 12, 14);
    }
    ctx.fillStyle = '#fff6c9'; ctx.beginPath(); ctx.arc(900, 70, 26, 0, 7); ctx.fill();
    ctx.fillStyle = '#141d3d'; ctx.beginPath(); ctx.arc(912, 62, 24, 0, 7); ctx.fill();
    drawRobot(ctx, 900, 590, 1.1, lit);

    // board
    ctx.fillStyle = '#1b2650'; roundRect(ctx, 60, 90, 720, 410, 24); ctx.fill();
    ctx.strokeStyle = '#26346a'; ctx.lineWidth = 1;
    for (let x = 80; x < 780; x += 30) { ctx.beginPath(); ctx.moveTo(x, 100); ctx.lineTo(x, 490); ctx.stroke(); }

    for (const e of this.edges) this.drawEdge(ctx, e);
    for (const n of this.nodes) { ctx.fillStyle = '#e0e7ff'; ctx.beginPath(); ctx.arc(n.x, n.y, 6, 0, 7); ctx.fill(); }
    this.drawTray(ctx);
    if (this.dragItem?.moved) this.drawPart(ctx, this.dragItem.it, this.dragItem.x, this.dragItem.y, 0, .9);
    this.fx.draw(ctx);
    label(ctx, this.power ? T('⚡ POWER ON', '⚡ التيار يعمل') : T('power off', 'التيار مطفأ'), 160, 60, { size: 18, color: this.power ? '#2ed3a0' : '#8a95bd' });
  }

  drawEdge(ctx, e) {
    const a = this.nodes[e.a], b = this.nodes[e.b], m = this.mid(e);
    const comp = e.slot ? e.placed : e;
    const r = this.power && this.res && comp ? this.res.get(this.solvedEdges.find(x => x.a === e.a && x.b === e.b)) : null;
    ctx.strokeStyle = '#c9d3ff'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    const half = 32;
    const ex = Math.cos(m.ang) * half, ey = Math.sin(m.ang) * half;
    if (comp && comp.type === 'wire') {
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(m.x - ex, m.y - ey); ctx.moveTo(m.x + ex, m.y + ey); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    // flowing charge (conventional current)
    if (r && Math.abs(r.i) > .005 && comp) {
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const speed = clamp(Math.abs(r.i), .05, 3) * 60 * Math.sign(r.i);
      ctx.fillStyle = '#ffe66d';
      for (let d = ((this.phase * speed) % 26 + 26) % 26; d < len; d += 26) {
        const t = d / len;
        ctx.beginPath(); ctx.arc(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 3, 0, 7); ctx.fill();
      }
    }
    if (e.slot && !e.placed) {
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = this.sel || this.dragItem ? '#ffe066' : '#8a95bd';
      ctx.lineWidth = 2.5;
      roundRect(ctx, m.x - 34, m.y - 26, 68, 52, 10); ctx.stroke();
      ctx.setLineDash([]);
      label(ctx, e.bat ? '🔋?' : '?', m.x, m.y, { size: 20, color: '#c9d3ff', stroke: null });
      return;
    }
    if (comp && comp.type !== 'wire') {
      // freshly placed parts pop in with a small overshoot
      const k = e.pop ?? 1, s = k >= 1 ? 1 : 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2);
      ctx.save(); ctx.translate(m.x, m.y); ctx.scale(s, s); ctx.translate(-m.x, -m.y);
      this.drawPart(ctx, comp, m.x, m.y, m.ang, 1, r, e);
      ctx.restore();
    }
    if (e.slot && e.placed?.type === 'wire') { ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(m.x, m.y, 8, 0, 7); ctx.stroke(); }
    if (r && comp.type !== 'wire') {
      const ox = Math.abs(Math.sin(m.ang)) > .5 ? 58 : 0, oy = ox ? 0 : -42;
      label(ctx, `${fmt(Math.abs(r.v), 1)}V  ${fmt(Math.abs(r.i), 2)}A`, m.x + ox, m.y + oy, { size: 12, color: '#bff5e1' });
    }
  }

  drawPart(ctx, it, x, y, ang = 0, alpha = 1, r = null, e = null) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    if (it.type === 'bulb') {
      const st = e && this.status ? this.status.get(this.solvedEdges.find(s => s.a === e.a && s.b === e.b)) : null;
      const p = r ? r.p : 0;
      const glow = st === 'burnt' ? 0 : clamp(p / 3.5, 0, 1);
      if (glow > .03) {
        const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 70);
        g.addColorStop(0, `rgba(255,224,102,${.85 * glow})`); g.addColorStop(1, 'rgba(255,224,102,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 70, 0, 7); ctx.fill();
      }
      ctx.fillStyle = st === 'burnt' ? '#4a4a55' : glow > .03 ? `rgb(255,${210 + 45 * glow},${120 + 80 * glow})` : '#e8ecff';
      ctx.beginPath(); ctx.arc(0, 0, 22, 0, 7); ctx.fill();
      ctx.strokeStyle = '#241a4f'; ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = st === 'burnt' ? '#222' : '#a0612a';
      ctx.beginPath(); ctx.moveTo(-10, 8); ctx.lineTo(-5, -6); ctx.lineTo(0, 6); ctx.lineTo(5, -6); ctx.lineTo(10, 8); ctx.stroke();
      if (st && st !== 'ok') label(ctx, st === 'burnt' ? '💥' : st === 'dim' ? '😴' : '✖', 18, -20, { size: 16, stroke: null });
      if (st === 'ok') label(ctx, '✔', 18, -20, { size: 16, color: '#2ed3a0' });
    } else {
      ctx.rotate(ang);
      if (it.type === 'res') {
        ctx.fillStyle = '#1b2650'; ctx.fillRect(-32, -14, 64, 28);
        ctx.strokeStyle = '#ff8fa3'; ctx.lineWidth = 3.5; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-32, 0);
        for (let i = 0; i < 6; i++) ctx.lineTo(-24 + i * 10, i % 2 ? 10 : -10);
        ctx.lineTo(32, 0); ctx.stroke();
        ctx.rotate(-ang);
        label(ctx, `${it.value} Ω`, Math.abs(Math.sin(ang)) > .5 ? -40 : 0, Math.abs(Math.sin(ang)) > .5 ? 0 : 26, { size: 14, color: '#ffd1dc' });
      } else if (it.type === 'bat') {
        ctx.fillStyle = '#1b2650'; ctx.fillRect(-14, -26, 28, 52);
        ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(6, -22); ctx.lineTo(6, 22); ctx.stroke();
        ctx.lineWidth = 7;
        ctx.beginPath(); ctx.moveTo(-6, -12); ctx.lineTo(-6, 12); ctx.stroke();
        ctx.rotate(-ang);
        const vert = Math.abs(Math.sin(ang)) > .5;
        label(ctx, `${it.value} V`, vert ? -46 : 0, vert ? 0 : 34, { size: 14, color: '#ffe066' });
        label(ctx, '+', vert ? 18 : 16, vert ? -14 : -18, { size: 14, color: '#ffe066', stroke: null });
      } else if (it.type === 'wire') {
        ctx.strokeStyle = '#c9d3ff'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(30, 0); ctx.stroke();
        ctx.fillStyle = '#c9d3ff'; ctx.beginPath(); ctx.arc(-30, 0, 5, 0, 7); ctx.arc(30, 0, 5, 0, 7); ctx.fill();
      }
    }
    ctx.restore();
  }

  drawTray(ctx) {
    ctx.fillStyle = 'rgba(255,255,255,.08)'; roundRect(ctx, 140, 510, 720, 80, 18); ctx.fill();
    this.items.forEach((it, i) => {
      const p = this.trayPos(i);
      if (it.used || this.dragItem?.it === it && this.dragItem.moved) {
        ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 2;
        roundRect(ctx, p.x - 50, p.y - 34, 100, 68, 12); ctx.stroke(); ctx.setLineDash([]);
        return;
      }
      ctx.fillStyle = this.sel === it ? '#3c4f9a' : '#26346a';
      roundRect(ctx, p.x - 50, p.y - 34, 100, 68, 12); ctx.fill();
      if (this.sel === it) { ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 3; ctx.stroke(); }
      this.drawPart(ctx, it, p.x, p.y - 4, 0, 1);
      label(ctx, String(i + 1), p.x - 38, p.y - 22, { size: 11, color: '#8a95bd', stroke: null });
      if (it.type === 'bulb' || it.type === 'wire') label(ctx, it.type === 'bulb' ? `${BULB_R} Ω` : T('wire', 'سلك'), p.x, p.y + 24, { size: 12, color: '#c9d3ff', stroke: null });
    });
  }
}

export default {
  id: 'circuit',
  levels: LEVELS,
  quiz: QUIZ,
  formulas: [
    { expr: 'V = I R', label: { en: "Ohm's law", ar: 'قانون أوم' } },
    { expr: 'R_s = R₁ + R₂ + …', label: { en: 'Series resistors', ar: 'المقاومات على التوالي' } },
    { expr: '1/R_p = 1/R₁ + 1/R₂ + …', label: { en: 'Parallel resistors', ar: 'المقاومات على التوازي' } },
    { expr: 'P = V I = I² R', label: { en: 'Electric power', ar: 'القدرة الكهربائية' } },
    { expr: 'V = ε − I r', label: { en: 'Terminal voltage', ar: 'الجهد الطرفي للبطارية' } }
  ],
  terms: [
    { en: 'Current', ar: 'التيار الكهربائي' }, { en: 'Voltage', ar: 'فرق الجهد' }, { en: 'Resistance', ar: 'المقاومة' },
    { en: 'Series', ar: 'التوالي' }, { en: 'Parallel', ar: 'التوازي' }, { en: 'Short circuit', ar: 'قصر الدائرة' },
    { en: 'Closed circuit', ar: 'دائرة مغلقة' }, { en: 'Ohm (Ω)', ar: 'الأوم' }
  ],
  tutorial: [
    { en: 'Pick a part from the tray at the bottom (tap or drag it, keys 1–4).', ar: 'اختر قطعة من الصندوق في الأسفل (اضغط أو اسحب، المفاتيح 1–4).' },
    { en: 'Drop it on a dashed slot. Tap a placed part to take it back.', ar: 'ضعها على خانة منقطة. اضغط على قطعة موضوعة لإرجاعها.' },
    { en: 'Press ⚡ Power (or Space). The solver calculates every voltage and current with Ohm\'s law.', ar: 'اضغط ⚡ تشغيل (أو المسافة). يحسب البرنامج كل جهد وتيار بقانون أوم.' },
    { en: 'Every bulb must shine: not dim, not burnt. Read the V, I and P values to understand why.', ar: 'يجب أن يضيء كل مصباح: لا خافت ولا محترق. اقرأ قيم V وI وP لتفهم السبب.' },
    { en: 'Succeed on the first power-on for 3 stars!', ar: 'انجح من أول تشغيل لتحصل على 3 نجوم!' }
  ],
  create: (api, i) => new CircuitGame(api, i)
};
