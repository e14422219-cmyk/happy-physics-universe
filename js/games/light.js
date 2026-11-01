// Light Maze: Laser Escape — Reflection and Refraction
import { T, L } from '../i18n.js';
import { W, H } from '../engine.js';
import { clamp, fmt, deg, rad, Particles, roundRect, label } from '../util.js';
import { drawCrystal } from '../art.js';

const MATERIALS = {
  water: { n: 1.33, name: { en: 'Water', ar: 'ماء' } },
  glass: { n: 1.5, name: { en: 'Glass', ar: 'زجاج' } },
  diamond: { n: 2.42, name: { en: 'Diamond', ar: 'ألماس' } }
};

const LEVELS = [
  {
    name: { en: 'First Reflection', ar: 'الانعكاس الأول' }, par: 3,
    laser: { x: 70, y: 450, a: 0 },
    els: [{ type: 'mirror', x: 500, y: 450, len: 100, a: 90, sol: 135, rot: true }],
    walls: [],
    targets: [{ x: 500, y: 110 }],
    learn: {
      en: 'Law of reflection: the angle of incidence equals the angle of reflection, both measured from the normal (the line perpendicular to the mirror).',
      ar: 'قانون الانعكاس: زاوية السقوط تساوي زاوية الانعكاس، وكلتاهما تقاسان من العمود المقام على سطح المرآة.'
    }
  },
  {
    name: { en: 'Periscope', ar: 'البيريسكوب' }, par: 8,
    laser: { x: 70, y: 500, a: 0 },
    els: [
      { type: 'mirror', x: 300, y: 500, len: 90, a: 90, sol: 135, rot: true },
      { type: 'mirror', x: 300, y: 130, len: 90, a: 90, sol: 135, rot: true }
    ],
    walls: [{ x: 480, y: 220, w: 34, h: 380 }],
    targets: [{ x: 860, y: 130 }],
    learn: {
      en: 'Two mirrors at 45° turn the beam twice by 90°. This is how a periscope lets you see over a wall.',
      ar: 'مرآتان بزاوية 45° تديران الشعاع مرتين بمقدار 90°. هكذا يتيح البيريسكوب الرؤية من فوق الجدار.'
    }
  },
  {
    name: { en: 'Choose the Glass', ar: 'اختر الزجاج' }, par: 2,
    laser: { x: 70, y: 190, a: 0 },
    els: [{ type: 'glass', shape: 'rect', x: 480, y: 300, w: 260, h: 520, a: 60, mat: 'water', solMat: 'glass', mats: ['water', 'glass', 'diamond'] }],
    walls: [],
    targets: [{ auto: true, x: 900, r: 12 }],
    learn: {
      en: "Snell's law n₁ sinθ₁ = n₂ sinθ₂: a larger refractive index bends light more toward the normal, so each material shifts the beam by a different amount.",
      ar: 'قانون سنل n₁ sinθ₁ = n₂ sinθ₂: معامل الانكسار الأكبر يكسر الضوء أكثر نحو العمود، لذلك تُزيح كل مادة الشعاع بمقدار مختلف.'
    }
  },
  {
    name: { en: 'Total Internal Reflection', ar: 'الانعكاس الكلي الداخلي' }, par: 4,
    laser: { x: 70, y: 230, a: 0 },
    els: [{ type: 'glass', shape: 'tri', x: 500, y: 250, size: 170, a: 315, sol: 0, rot: true, mat: 'water', solMat: 'glass', mats: ['water', 'glass', 'diamond'] }],
    walls: [],
    targets: [{ auto: true, y: 540 }],
    learn: {
      en: 'When light inside a dense medium hits the surface at an angle larger than the critical angle (sinθc = n₂/n₁), it is totally reflected. Glass (θc ≈ 41.8°) does this at 45°, water (θc ≈ 48.8°) does not.',
      ar: 'عندما يسقط الضوء داخل وسط كثيف على السطح بزاوية أكبر من الزاوية الحرجة (sinθc = n₂/n₁) ينعكس كليًا. الزجاج (θc ≈ 41.8°) يفعل ذلك عند 45° أما الماء (θc ≈ 48.8°) فلا.'
    }
  },
  {
    name: { en: 'Laser Escape', ar: 'هروب الليزر' }, par: 8,
    laser: { x: 70, y: 90, a: 0 },
    els: [
      { type: 'mirror', x: 260, y: 90, len: 80, a: 0, sol: 45, rot: true },
      { type: 'mirror', x: 260, y: 480, len: 80, a: 0, sol: 45, rot: true },
      { type: 'glass', shape: 'rect', x: 620, y: 480, w: 130, h: 90, a: 0, sol: 30, rot: true, mat: 'glass' }
    ],
    walls: [{ x: 400, y: 0, w: 34, h: 380 }, { x: 560, y: 300, w: 200, h: 26 }],
    targets: [{ auto: true, y: 300 }, { auto: true, x: 910 }],
    learn: {
      en: 'Light can be steered with mirrors and shifted sideways by a tilted glass block. A parallel-sided block shifts the beam without changing its final direction.',
      ar: 'يمكن توجيه الضوء بالمرايا وإزاحته جانبيًا بقطعة زجاج مائلة. القطعة ذات الوجهين المتوازيين تُزيح الشعاع دون أن تغيّر اتجاهه النهائي.'
    }
  }
];

const QUIZ = [
  {
    q: { en: 'A ray hits a mirror at 30° from the normal. The reflected ray leaves at…', ar: 'شعاع يسقط على مرآة بزاوية 30° مع العمود. ينعكس بزاوية…' },
    options: [{ en: '60° from the normal', ar: '60° مع العمود' }, { en: '30° from the normal', ar: '30° مع العمود' }, { en: '90°', ar: '90°' }],
    answer: 1,
    explain: { en: 'Angle of incidence = angle of reflection.', ar: 'زاوية السقوط = زاوية الانعكاس.' }
  },
  {
    q: { en: 'To turn a beam by 90°, a flat mirror should make an angle with the beam of…', ar: 'لتدوير شعاع بزاوية 90° يجب أن تصنع المرآة مع الشعاع زاوية…' },
    options: [{ en: '45°', ar: '45°' }, { en: '90°', ar: '90°' }, { en: '30°', ar: '30°' }],
    answer: 0,
    explain: { en: 'The beam turns by twice the mirror angle: 2 × 45° = 90°.', ar: 'يدور الشعاع بضعف زاوية المرآة: 2 × 45° = 90°.' }
  },
  {
    q: { en: 'Light passes from air into glass (n = 1.5). It bends…', ar: 'ينتقل الضوء من الهواء إلى الزجاج (n = 1.5). فإنه ينكسر…' },
    options: [{ en: 'toward the normal', ar: 'مقتربًا من العمود' }, { en: 'away from the normal', ar: 'مبتعدًا عن العمود' }, { en: 'not at all', ar: 'لا ينكسر' }],
    answer: 0,
    explain: { en: 'Entering a denser medium (larger n) slows light and bends it toward the normal.', ar: 'عند دخول وسط أكثف (n أكبر) تقل سرعة الضوء فينكسر مقتربًا من العمود.' }
  },
  {
    q: { en: 'Total internal reflection can happen when light goes from…', ar: 'يحدث الانعكاس الكلي الداخلي عندما ينتقل الضوء من…' },
    options: [{ en: 'air to glass', ar: 'الهواء إلى الزجاج' }, { en: 'glass to air', ar: 'الزجاج إلى الهواء' }, { en: 'any medium to any medium', ar: 'أي وسط إلى أي وسط' }],
    answer: 1,
    explain: { en: 'It needs a denser to a less dense medium and an angle above the critical angle.', ar: 'يحتاج انتقالًا من وسط أكثف إلى أقل كثافة وزاوية أكبر من الزاوية الحرجة.' }
  },
  {
    q: { en: 'The refractive index n = c / v. In diamond (n = 2.42), light travels…', ar: 'معامل الانكسار n = c / v. في الألماس (n = 2.42) ينتقل الضوء…' },
    options: [{ en: 'faster than in air', ar: 'أسرع منه في الهواء' }, { en: 'about 2.42 times slower than in vacuum', ar: 'أبطأ بنحو 2.42 مرة منه في الفراغ' }, { en: 'at the same speed', ar: 'بالسرعة نفسها' }],
    answer: 1,
    explain: { en: 'v = c / n ≈ 1.24 × 10⁸ m/s in diamond.', ar: 'v = c / n ≈ 1.24 × 10⁸ م/ث في الألماس.' }
  }
];

// ---------- geometry ----------
function raySeg(px, py, dx, dy, ax, ay, bx, by) {
  const ex = bx - ax, ey = by - ay;
  const den = dx * ey - dy * ex;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((ax - px) * ey - (ay - py) * ex) / den;
  const s = ((ax - px) * dy - (ay - py) * dx) / den;
  if (t > 1e-4 && s >= 0 && s <= 1) return t;
  return null;
}
function rayCircle(px, py, dx, dy, cx, cy, r) {
  const fx = px - cx, fy = py - cy;
  const b = fx * dx + fy * dy, c = fx * fx + fy * fy - r * r;
  const disc = b * b - c;
  if (disc < 0) return null;
  const t = -b - Math.sqrt(disc);
  return t > 0 ? t : (-b + Math.sqrt(disc) > 0 ? 0 : null);
}

function polygon(el) {
  let pts;
  if (el.shape === 'tri') { const s = el.size / 2; pts = [[-s, -s], [-s, s], [s, s]]; }
  else { const w = el.w / 2, h = el.h / 2; pts = [[-w, -h], [w, -h], [w, h], [-w, h]]; }
  const a = rad(el.da ?? el.a);
  const c = Math.cos(a), s = Math.sin(a);
  return pts.map(([x, y]) => ({ x: el.x + x * c - y * s, y: el.y + x * s + y * c }));
}

function mirrorEnds(el) {
  const a = rad(el.da ?? el.a);
  const c = Math.cos(a) * el.len / 2, s = Math.sin(a) * el.len / 2;
  return [{ x: el.x - c, y: el.y - s }, { x: el.x + c, y: el.y + s }];
}

function nOf(el) { return MATERIALS[el.mat].n; }

class LightGame {
  constructor(api, li) {
    this.api = api;
    this.lv = LEVELS[li];
    this.letterbox = '#120c2c';
    this.els = this.lv.els.map(e => ({ ...e }));
    this.walls = this.lv.walls;
    this.time = 0;
    this.moves = 0;
    this.lit = 0;
    this.done = false;
    this.fx = new Particles();
    this.sel = this.els.find(e => e.rot || e.mats) || null;

    // place automatic targets on the solution path, then restore the puzzle state
    const saved = this.els.map(e => ({ a: e.a, mat: e.mat }));
    for (const e of this.els) { if (e.sol !== undefined) e.a = e.sol; if (e.solMat) e.mat = e.solMat; }
    const solTrace = this.trace([]);
    this.targets = this.lv.targets.map(t => t.auto ? { ...this.crossing(solTrace.segs, t), r: t.r || 22 } : { ...t, r: t.r || 22 });
    this.els.forEach((e, i) => { Object.assign(e, saved[i]); e.da = e.a; });

    this.els.forEach((e, i) => {
      if (!e.mats) return;
      api.seg({
        label: T(`Block ${i + 1} material (n)`, `مادة القطعة ${i + 1} (n)`),
        options: e.mats.map(m => ({ label: `${L(MATERIALS[m].name)} ${MATERIALS[m].n}`, value: m })),
        value: e.mat,
        onChange: v => { e.mat = v; this.moves++; this.sel = e; }
      });
    });
    api.note(T('Tap a mirror/prism to rotate it 15°, or drag around it for fine control (keys: Tab select, ← → rotate).',
      'اضغط على المرآة أو المنشور لتدويره 15°، أو اسحب حوله للتحكم الدقيق (المفاتيح: Tab للاختيار، ← → للتدوير).'));
    api.hint(T('Guide the laser into every crystal!', 'وجّه الليزر إلى كل البلّورات!'));
  }

  crossing(segs, t) {
    for (const s of segs) {
      if (t.x !== undefined && (s.a.x - t.x) * (s.b.x - t.x) <= 0 && s.a.x !== s.b.x) {
        const k = (t.x - s.a.x) / (s.b.x - s.a.x);
        return { x: t.x, y: s.a.y + (s.b.y - s.a.y) * k };
      }
      if (t.y !== undefined && (s.a.y - t.y) * (s.b.y - t.y) <= 0 && s.a.y !== s.b.y) {
        const k = (t.y - s.a.y) / (s.b.y - s.a.y);
        return { x: s.a.x + (s.b.x - s.a.x) * k, y: t.y };
      }
    }
    return { x: t.x ?? 500, y: t.y ?? 300 };
  }

  // ---------- ray tracing ----------
  trace(targets) {
    const segs = [], events = [], hit = new Set();
    let px = this.lv.laser.x + 30, py = this.lv.laser.y;
    let dx = Math.cos(rad(this.lv.laser.a)), dy = Math.sin(rad(this.lv.laser.a));
    let inside = null;
    for (let bounce = 0; bounce < 50; bounce++) {
      let best = Infinity, bestHit = null;
      const test = (t, info) => { if (t !== null && t < best) { best = t; bestHit = info; } };
      for (const el of this.els) {
        if (el.type === 'mirror') { const [a, b] = mirrorEnds(el); test(raySeg(px, py, dx, dy, a.x, a.y, b.x, b.y), { kind: 'mirror', el, a, b }); }
        else {
          const poly = polygon(el);
          poly.forEach((a, i) => { const b = poly[(i + 1) % poly.length]; test(raySeg(px, py, dx, dy, a.x, a.y, b.x, b.y), { kind: 'glass', el, a, b, poly }); });
        }
      }
      for (const w of this.walls) {
        const c = [[w.x, w.y], [w.x + w.w, w.y], [w.x + w.w, w.y + w.h], [w.x, w.y + w.h]];
        c.forEach((a, i) => { const b = c[(i + 1) % 4]; test(raySeg(px, py, dx, dy, a[0], a[1], b[0], b[1]), { kind: 'wall' }); });
      }
      for (const [a, b] of [[[0, 0], [W, 0]], [[W, 0], [W, H]], [[W, H], [0, H]], [[0, H], [0, 0]]]) test(raySeg(px, py, dx, dy, a[0], a[1], b[0], b[1]), { kind: 'edge' });
      if (!bestHit) break;
      for (const tg of targets) { const t = rayCircle(px, py, dx, dy, tg.x, tg.y, tg.r); if (t !== null && t < best) hit.add(tg); }
      const hx = px + dx * best, hy = py + dy * best;
      segs.push({ a: { x: px, y: py }, b: { x: hx, y: hy }, inside: !!inside });
      if (bestHit.kind === 'wall' || bestHit.kind === 'edge') break;

      const ex = bestHit.b.x - bestHit.a.x, ey = bestHit.b.y - bestHit.a.y, el = Math.hypot(ex, ey);
      let nx = -ey / el, ny = ex / el;
      if (nx * dx + ny * dy > 0) { nx = -nx; ny = -ny; }           // normal facing the incoming ray
      const cosi = -(nx * dx + ny * dy);
      const thI = deg(Math.acos(clamp(cosi, -1, 1)));
      if (bestHit.kind === 'mirror') {
        dx += 2 * cosi * nx; dy += 2 * cosi * ny;
        events.push({ type: 'reflect', x: hx, y: hy, nx, ny, ti: thI, to: thI });
      } else {
        const entering = inside !== bestHit.el;
        const n1 = entering ? 1 : nOf(bestHit.el), n2 = entering ? nOf(bestHit.el) : 1;
        const eta = n1 / n2;
        const k = 1 - eta * eta * (1 - cosi * cosi);
        if (k < 0) {
          dx += 2 * cosi * nx; dy += 2 * cosi * ny;
          events.push({ type: 'tir', x: hx, y: hy, nx, ny, ti: thI, n1, crit: deg(Math.asin(n2 / n1)) });
        } else {
          const ct = Math.sqrt(k);
          dx = eta * dx + (eta * cosi - ct) * nx; dy = eta * dy + (eta * cosi - ct) * ny;
          events.push({ type: 'refract', x: hx, y: hy, nx, ny, ti: thI, to: deg(Math.acos(ct)), n1, n2 });
          inside = entering ? bestHit.el : null;
        }
      }
      const dl = Math.hypot(dx, dy); dx /= dl; dy /= dl;
      px = hx + dx * .05; py = hy + dy * .05;
    }
    return { segs, events, hit };
  }

  // ---------- input ----------
  elAt(p) {
    let best = null, bd = Infinity;
    for (const e of this.els) {
      if (!e.rot && !e.mats) continue;
      const r = e.type === 'mirror' ? e.len / 2 + 20 : Math.max(e.w || e.size, e.h || e.size) / 2 + 10;
      const d = Math.hypot(p.x - e.x, p.y - e.y);
      if (d < r && d < bd) { bd = d; best = e; }
    }
    return best;
  }
  down(p) {
    if (this.done) return;
    const e = this.elAt(p);
    if (!e) return;
    this.sel = e;
    if (!e.rot) return;
    this.drag = { e, a0: e.a, p0: Math.atan2(p.y - e.y, p.x - e.x), moved: false, sx: p.x, sy: p.y };
  }
  move(p) {
    const d = this.drag;
    if (!d) return;
    if (Math.hypot(p.x - d.sx, p.y - d.sy) > 8) d.moved = true;
    if (d.moved) {
      const a = Math.atan2(p.y - d.e.y, p.x - d.e.x);
      d.e.a = ((Math.round((d.a0 + deg(a - d.p0)) / 5) * 5) % 360 + 360) % 360;
    }
  }
  up() {
    const d = this.drag;
    this.drag = null;
    if (!d) return;
    if (!d.moved) this.rotate(d.e, 15);
    else { this.moves++; this.api.sfx('click'); }
  }
  wheel(p, s) { const e = this.elAt(p); if (e?.rot && !this.done) { this.sel = e; this.rotate(e, 5 * s); } }
  rotate(e, by) { e.a = ((e.a + by) % 360 + 360) % 360; this.moves++; this.api.sfx('click'); }
  key(ev) {
    const list = this.els.filter(e => e.rot);
    if (ev.key === 'Tab' && list.length) { this.sel = list[(list.indexOf(this.sel) + 1) % list.length]; return true; }
    if (!this.sel?.rot || this.done) return false;
    if (ev.key === 'ArrowRight') { this.rotate(this.sel, 5); return true; }
    if (ev.key === 'ArrowLeft') { this.rotate(this.sel, -5); return true; }
    if (ev.key === 'Enter') { this.rotate(this.sel, 15); return true; }
    return false;
  }

  // ---------- update ----------
  update(dt) {
    this.time += dt;
    this.fx.update(dt);
    // displayed angle eases toward the target angle so taps rotate smoothly
    for (const e of this.els) {
      const diff = ((e.a - e.da) % 360 + 540) % 360 - 180;
      e.da = Math.abs(diff) < .05 ? e.a : e.da + diff * Math.min(1, dt * 14);
    }
    this.tr = this.trace(this.targets);
    const all = this.targets.every(t => this.tr.hit.has(t));
    if (all && !this.done) {
      this.lit += dt;
      if (this.lit > .6) {
        this.done = true;
        for (const t of this.targets) this.fx.emit(t.x, t.y, 30, { color: ['#c9a3ff', '#fff', '#9b5de5'], speed: 260, size: 5, gravity: 0 });
        const p = this.lv.par, m = this.moves;
        this.api.win(m <= p ? 3 : m <= p * 2 + 2 ? 2 : 1);
      }
    } else if (!this.done) this.lit = 0;
    this.updateVars();
  }

  updateVars() {
    const rows = [];
    if (this.sel) {
      rows.push({ sym: '∠', name: T('selected angle', 'زاوية العنصر المحدد'), value: fmt(this.sel.a, 0), unit: '°' });
      if (this.sel.mat) {
        const n = nOf(this.sel);
        rows.push({ sym: 'n', name: T('refractive index', 'معامل الانكسار'), value: fmt(n, 2) });
        rows.push({ sym: 'θc', name: T('critical angle', 'الزاوية الحرجة'), value: fmt(deg(Math.asin(1 / n)), 1), unit: '°' });
        rows.push({ sym: 'v', name: 'c / n', value: fmt(3 / n, 2) + '×10⁸', unit: 'm/s' });
      }
    }
    for (const ev of this.tr.events.slice(0, 4)) {
      if (ev.type === 'reflect') rows.push({ sym: '↩', name: T('reflection θi = θr', 'انعكاس θi = θr'), value: `${fmt(ev.ti, 1)}° = ${fmt(ev.to, 1)}°`, hl: true });
      if (ev.type === 'refract') rows.push({ sym: '↘', name: `${fmt(ev.n1, 2)}·sin${fmt(ev.ti, 1)}° = ${fmt(ev.n2, 2)}·sin${fmt(ev.to, 1)}°`, value: `${fmt(ev.n1 * Math.sin(rad(ev.ti)), 3)}`, hl: true });
      if (ev.type === 'tir') rows.push({ sym: '⟲', name: T('total internal reflection', 'انعكاس كلي داخلي'), value: `${fmt(ev.ti, 1)}° > ${fmt(ev.crit, 1)}°`, hl: true });
    }
    rows.push({ sym: '💎', name: T('crystals lit', 'البلّورات المضاءة'), value: `${this.targets.filter(t => this.tr.hit.has(t)).length} / ${this.targets.length}` });
    rows.push({ sym: '#', name: T('moves', 'الحركات'), value: `${this.moves} (par ${this.lv.par})` });
    this.api.setVars(rows);
  }

  // ---------- drawing ----------
  draw(ctx) {
    ctx.fillStyle = '#120c2c'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#1e1646'; ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    for (const w of this.walls) {
      ctx.fillStyle = '#3b2f63'; ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeStyle = '#2a2148'; ctx.lineWidth = 2;
      for (let y = w.y + 20; y < w.y + w.h; y += 20) { ctx.beginPath(); ctx.moveTo(w.x, y); ctx.lineTo(w.x + w.w, y); ctx.stroke(); }
    }
    for (const e of this.els) if (e.type === 'glass') this.drawGlass(ctx, e);
    this.drawBeam(ctx);
    for (const e of this.els) if (e.type === 'mirror') this.drawMirror(ctx, e);
    for (const t of this.targets) {
      const on = this.tr.hit.has(t);
      drawCrystal(ctx, t.x, t.y, t.r * .9, on ? '#c77dff' : '#5a4a8a', on ? .9 + .1 * Math.sin(this.time * 8) : .2);
    }
    this.drawAnnotations(ctx);
    // laser device
    const lz = this.lv.laser;
    ctx.save(); ctx.translate(lz.x, lz.y); ctx.rotate(rad(lz.a));
    ctx.fillStyle = '#8a8fb3'; roundRect(ctx, -26, -16, 52, 32, 8); ctx.fill();
    ctx.fillStyle = '#ff4d6d'; ctx.fillRect(24, -6, 10, 12);
    ctx.restore();
    this.fx.draw(ctx);
  }

  drawBeam(ctx) {
    ctx.lineCap = 'round';
    for (const [w, c] of [[12, 'rgba(255,77,109,.18)'], [6, 'rgba(255,77,109,.45)'], [2.5, '#ffd6de']]) {
      ctx.strokeStyle = c; ctx.lineWidth = w;
      ctx.beginPath();
      for (const s of this.tr.segs) { ctx.moveTo(s.a.x, s.a.y); ctx.lineTo(s.b.x, s.b.y); }
      ctx.stroke();
    }
    const last = this.tr.segs.at(-1);
    if (last && Math.random() < .4) this.fx.emit(last.b.x, last.b.y, 1, { color: '#ff8fa3', speed: 80, size: 3, gravity: 0, life: .4 });
  }

  drawAnnotations(ctx) {
    for (const ev of this.tr.events.slice(0, 4)) {
      ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(ev.x - ev.nx * 45, ev.y - ev.ny * 45); ctx.lineTo(ev.x + ev.nx * 45, ev.y + ev.ny * 45); ctx.stroke();
      ctx.setLineDash([]);
      const txt = ev.type === 'refract' ? `${fmt(ev.ti, 0)}° → ${fmt(ev.to, 0)}°` : ev.type === 'tir' ? `TIR ${fmt(ev.ti, 0)}°` : `${fmt(ev.ti, 0)}° | ${fmt(ev.to, 0)}°`;
      label(ctx, txt, ev.x + ev.nx * 62, ev.y + ev.ny * 62 - 4, { size: 13, color: ev.type === 'tir' ? '#ffd166' : '#bdefff' });
    }
  }

  drawMirror(ctx, e) {
    const [a, b] = mirrorEnds(e);
    if (this.sel === e) {
      ctx.strokeStyle = 'rgba(255,224,102,.5)'; ctx.lineWidth = 2; ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.arc(e.x, e.y, e.len / 2 + 14, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#7f8bb3'; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.strokeStyle = '#e8f6ff'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.fillStyle = e.rot ? '#ffc93c' : '#555';
    ctx.beginPath(); ctx.arc(e.x, e.y, 6, 0, 7); ctx.fill();
    if (e.rot) label(ctx, `${e.a}°`, e.x, e.y + e.len / 2 + 22, { size: 12, color: '#ffe066' });
  }

  drawGlass(ctx, e) {
    const poly = polygon(e);
    const n = nOf(e);
    ctx.fillStyle = e.mat === 'diamond' ? 'rgba(220,240,255,.32)' : e.mat === 'water' ? 'rgba(60,170,255,.28)' : 'rgba(127,220,255,.25)';
    ctx.strokeStyle = this.sel === e ? '#ffe066' : '#bdefff';
    ctx.lineWidth = 3;
    ctx.beginPath(); poly.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(poly[0].x + 6, poly[0].y + 6); ctx.lineTo((poly[0].x + poly[1].x) / 2, (poly[0].y + poly[1].y) / 2 + 4); ctx.stroke();
    const below = Math.max(...poly.map(p => p.y));
    label(ctx, `${L(MATERIALS[e.mat].name)}  n = ${n}`, e.x, Math.min(H - 14, below + 18), { size: 13, color: '#e0f7ff' });
    if (e.rot) { ctx.fillStyle = '#ffc93c'; ctx.beginPath(); ctx.arc(e.x, e.y, 5, 0, 7); ctx.fill(); }
  }
}

export default {
  id: 'light',
  levels: LEVELS,
  quiz: QUIZ,
  formulas: [
    { expr: 'θᵢ = θᵣ', label: { en: 'Law of reflection', ar: 'قانون الانعكاس' } },
    { expr: 'n₁ sinθ₁ = n₂ sinθ₂', label: { en: "Snell's law", ar: 'قانون سنل' } },
    { expr: 'n = c / v', label: { en: 'Refractive index', ar: 'معامل الانكسار' } },
    { expr: 'sinθc = n₂ / n₁', label: { en: 'Critical angle', ar: 'الزاوية الحرجة' } }
  ],
  terms: [
    { en: 'Reflection', ar: 'الانعكاس' }, { en: 'Refraction', ar: 'الانكسار' }, { en: 'Normal line', ar: 'العمود المقام' },
    { en: 'Angle of incidence', ar: 'زاوية السقوط' }, { en: 'Refractive index', ar: 'معامل الانكسار' },
    { en: 'Critical angle', ar: 'الزاوية الحرجة' }, { en: 'Total internal reflection', ar: 'الانعكاس الكلي الداخلي' }
  ],
  tutorial: [
    { en: 'The laser always fires from the left. Every crystal must be crossed by the beam at the same time.', ar: 'يُطلق الليزر دائمًا من اليسار. يجب أن يعبر الشعاع كل البلّورات في الوقت نفسه.' },
    { en: 'Tap a mirror or prism to rotate it by 15°. Drag around it to rotate smoothly (5° steps).', ar: 'اضغط على المرآة أو المنشور لتدويره 15°. اسحب حوله لتدويره بسلاسة (خطوات 5°).' },
    { en: 'Change the material of a glass block in the lab panel to change its refractive index n.', ar: 'غيّر مادة قطعة الزجاج من لوحة المختبر لتغيير معامل انكسارها n.' },
    { en: 'Dashed lines are normals. The numbers show the angles of incidence, reflection and refraction.', ar: 'الخطوط المتقطعة هي الأعمدة المقامة، والأرقام تبيّن زوايا السقوط والانعكاس والانكسار.' },
    { en: 'Solve it in few moves for 3 stars!', ar: 'حُلّها بعدد قليل من الحركات لتحصل على 3 نجوم!' }
  ],
  create: (api, i) => new LightGame(api, i)
};
