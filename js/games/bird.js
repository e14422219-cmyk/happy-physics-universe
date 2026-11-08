// Happy Bird: Sky Mission — Projectile Motion
import { T, L } from '../i18n.js';
import { W } from '../engine.js';
import { clamp, fmt, deg, rad, Particles, roundRect, arrow, label } from '../util.js';
import { drawBird, drawGloom, drawCloud } from '../art.js';

const PPM = 10;            // pixels per meter
const GROUND = 540;
const ANCHOR = { x: 130, y: 430 };
const MAX_PULL = 110;
const BR = 14;             // bird radius (px)
const BREAK = { wood: 9, glass: 4 };   // impact speed (m/s) needed to break

const WORLDS = {
  earth: { g: 9.8, name: { en: 'Earth', ar: 'الأرض' }, sky: ['#5ec8ff', '#d4f3ff'], ground: '#6cc35b', ground2: '#4ea84a', hill: '#9ad98a' },
  moon: { g: 1.62, name: { en: 'Moon', ar: 'القمر' }, sky: ['#070722', '#26265a'], ground: '#a3a8bd', ground2: '#80869c', hill: '#4a4e6a', stars: true },
  mars: { g: 3.71, name: { en: 'Mars', ar: 'المريخ' }, sky: ['#e9875a', '#ffd3a8'], ground: '#c4521f', ground2: '#9c3a10', hill: '#d97a48' }
};

const LEVELS = [
  {
    name: { en: 'First Flight', ar: 'الطيران الأول' }, world: 'earth', birds: 3, vmax: 30, preview: 1, timeScale: 1.3,
    blocks: [], targets: [{ x: 720, y: GROUND - 18 }],
    learn: {
      en: 'A projectile moves in a parabola. Its horizontal velocity stays constant while gravity changes only the vertical velocity.',
      ar: 'يتحرك المقذوف في مسار على شكل قطع مكافئ. تبقى السرعة الأفقية ثابتة بينما تغيّر الجاذبية السرعة الرأسية فقط.'
    }
  },
  {
    name: { en: 'Over the Wall', ar: 'فوق الجدار' }, world: 'earth', birds: 3, vmax: 30, preview: .5, timeScale: 1.3,
    blocks: [
      { x: 470, y: 340, w: 30, h: 200, type: 'stone' },
      { x: 800, y: 440, w: 16, h: 100, type: 'wood' },
      { x: 864, y: 440, w: 16, h: 100, type: 'wood' },
      { x: 790, y: 424, w: 100, h: 16, type: 'wood' }
    ],
    targets: [{ x: 640, y: GROUND - 18 }, { x: 840, y: 406, on: 3 }],
    learn: {
      en: 'Larger launch angles give higher, shorter flights. To clear a wall, the bird must reach enough height before it gets there.',
      ar: 'زوايا الإطلاق الكبيرة تعطي مسارًا أعلى وأقصر. لعبور الجدار يجب أن يصل الطائر إلى ارتفاع كافٍ قبل الوصول إليه.'
    }
  },
  {
    name: { en: 'Moon Hop', ar: 'قفزة على القمر' }, world: 'moon', birds: 3, vmax: 18, preview: .35, timeScale: 2.4,
    blocks: [{ x: 780, y: 260, w: 150, h: 20, type: 'stone' }],
    targets: [{ x: 560, y: GROUND - 18 }, { x: 860, y: 242, on: -1 }],
    learn: {
      en: 'On the Moon g is only 1.62 m/s² — about 1/6 of Earth. The same launch flies much higher and farther because R = v₀² sin2θ / g.',
      ar: 'على القمر تساوي g قيمة 1.62 م/ث² فقط — أي نحو سدس جاذبية الأرض. الإطلاق نفسه يطير أعلى وأبعد بكثير لأن R = v₀² sin2θ / g.'
    }
  },
  {
    name: { en: 'Mars Fortress', ar: 'حصن المريخ' }, world: 'mars', birds: 4, vmax: 22, preview: .35, timeScale: 1.8,
    blocks: [
      { x: 600, y: 440, w: 14, h: 100, type: 'glass' },
      { x: 690, y: 440, w: 14, h: 100, type: 'glass' },
      { x: 590, y: 426, w: 124, h: 14, type: 'glass' },
      { x: 850, y: 400, w: 16, h: 140, type: 'wood' },
      { x: 914, y: 400, w: 16, h: 140, type: 'wood' },
      { x: 840, y: 386, w: 100, h: 14, type: 'wood' }
    ],
    targets: [{ x: 652, y: GROUND - 18 }, { x: 890, y: 368, on: 5 }, { x: 780, y: GROUND - 18 }],
    learn: {
      en: 'On Mars g = 3.71 m/s². A faster impact carries more kinetic energy (½mv²) — enough to break glass and knock wooden towers down.',
      ar: 'على المريخ g = 3.71 م/ث². الاصطدام الأسرع يحمل طاقة حركية أكبر (½mv²) — تكفي لكسر الزجاج وإسقاط الأبراج الخشبية.'
    }
  },
  {
    name: { en: 'Cliff and Cave', ar: 'الجرف والكهف' }, world: 'earth', birds: 4, vmax: 32, preview: .3, timeScale: 1.3,
    blocks: [
      { x: 820, y: 200, w: 180, h: 340, type: 'stone' },
      { x: 640, y: 300, w: 30, h: 240, type: 'stone' },
      { x: 380, y: 370, w: 200, h: 22, type: 'stone' }
    ],
    targets: [{ x: 900, y: 182, on: -1 }, { x: 520, y: GROUND - 18 }],
    learn: {
      en: 'Complementary angles (like 30° and 60°) reach the same range on level ground, but the high angle flies over obstacles and the low angle slips under them.',
      ar: 'الزاويتان المتتامتان (مثل 30° و60°) تعطيان المدى نفسه على أرض مستوية، لكن الزاوية الكبيرة تعبر فوق العوائق والصغيرة تمر من تحتها.'
    }
  }
];

const QUIZ = [
  {
    q: { en: 'During flight (no air resistance), which quantity stays constant?', ar: 'أثناء الطيران (بإهمال مقاومة الهواء)، أي كمية تبقى ثابتة؟' },
    options: [{ en: 'Vertical velocity', ar: 'السرعة الرأسية' }, { en: 'Horizontal velocity', ar: 'السرعة الأفقية' }, { en: 'Height', ar: 'الارتفاع' }],
    answer: 1,
    explain: { en: 'No horizontal force acts, so vₓ = v₀cosθ stays the same.', ar: 'لا توجد قوة أفقية، لذلك تبقى vₓ = v₀cosθ ثابتة.' }
  },
  {
    q: { en: 'On level ground, which angle gives the maximum range?', ar: 'على أرض مستوية، أي زاوية تعطي أكبر مدى أفقي؟' },
    options: [{ en: '30°', ar: '30°' }, { en: '45°', ar: '45°' }, { en: '75°', ar: '75°' }],
    answer: 1,
    explain: { en: 'R = v₀² sin2θ / g is largest when sin2θ = 1, so θ = 45°.', ar: 'R = v₀² sin2θ / g تكون أكبر ما يمكن عندما sin2θ = 1، أي θ = 45°.' }
  },
  {
    q: { en: 'If g becomes 6 times smaller, the range (same v₀ and θ) becomes…', ar: 'إذا صغرت g ست مرات، فإن المدى (بنفس v₀ وθ) يصبح…' },
    options: [{ en: '6 times larger', ar: 'أكبر 6 مرات' }, { en: '6 times smaller', ar: 'أصغر 6 مرات' }, { en: 'unchanged', ar: 'لا يتغير' }],
    answer: 0,
    explain: { en: 'R is inversely proportional to g.', ar: 'المدى يتناسب عكسيًا مع g.' }
  },
  {
    q: { en: 'At the highest point of the path, the vertical velocity is…', ar: 'عند أعلى نقطة في المسار، تكون السرعة الرأسية…' },
    options: [{ en: 'maximum', ar: 'أكبر ما يمكن' }, { en: 'equal to v₀', ar: 'مساوية لـ v₀' }, { en: 'zero', ar: 'صفرًا' }],
    answer: 2,
    explain: { en: 'vᵧ changes sign at the top, so it is momentarily zero; only vₓ remains.', ar: 'تغيّر vᵧ إشارتها عند القمة فتكون صفرًا لحظيًا، ويبقى فقط vₓ.' }
  },
  {
    q: { en: 'Which pair of angles gives the same range on level ground?', ar: 'أي زاويتين تعطيان المدى نفسه على أرض مستوية؟' },
    options: [{ en: '20° and 70°', ar: '20° و 70°' }, { en: '20° and 40°', ar: '20° و 40°' }, { en: '30° and 45°', ar: '30° و 45°' }],
    answer: 0,
    explain: { en: 'sin(2·20°) = sin(140°) = sin(2·70°): complementary angles share the same range.', ar: 'sin(2·20°) = sin(140°) = sin(2·70°): الزاويتان المتتامتان لهما المدى نفسه.' }
  }
];

class BirdGame {
  constructor(api, li) {
    this.api = api;
    this.lv = LEVELS[li];
    this.world = WORLDS[this.lv.world];
    this.g = this.world.g;
    this.letterbox = this.world.sky[0];
    this.letterboxBottom = this.world.ground2;
    this.blocks = this.lv.blocks.map(b => ({ ...b, alive: true }));
    this.targets = this.lv.targets.map(t => ({ ...t, r: 18, alive: true, falling: false, vy: 0 }));
    this.birdsLeft = this.lv.birds;
    this.used = 0;
    this.v0 = Math.round(this.lv.vmax * .5);
    this.theta = 30;
    this.state = 'aim';
    this.drag = false;
    this.bird = null;
    this.trail = [];
    this.lastTrail = [];
    this.apex = null;
    this.showVectors = true;
    this.fx = new Particles();
    this.time = 0;
    this.hop = 1;        // 0→1 while the next bird jumps onto the slingshot
    this.recoil = 0;     // slingshot band wobble after a launch
    this.clouds = [[120, 90, 1], [420, 60, .8], [700, 110, 1.1], [880, 50, .7]];
    this.stars = Array.from({ length: 60 }, (_, i) => [(i * 137) % W, (i * 71) % 400, (i % 3) + 1]);

    this.sV = api.slider({ label: T('Launch speed v₀', 'سرعة الإطلاق v₀'), min: 4, max: this.lv.vmax, step: .5, value: this.v0, unit: 'm/s', onInput: v => { this.v0 = v; } });
    this.sA = api.slider({ label: T('Launch angle θ', 'زاوية الإطلاق θ'), min: 0, max: 85, step: 1, value: this.theta, unit: '°', digits: 0, onInput: v => { this.theta = v; } });
    api.buttons([{ label: T('🚀 Launch', '🚀 أطلق'), cls: 'mint', onClick: () => this.launch() }]);
    api.check({ label: T('Show velocity vectors', 'إظهار متجهات السرعة'), value: true, onChange: v => { this.showVectors = v; } });
    api.note(T(`World: ${L(this.world.name)} • g = ${this.g} m/s²`, `العالم: ${L(this.world.name)} • g = ${this.g} م/ث²`));
    api.hint(T('Drag back from the slingshot (or use the sliders) and release!', 'اسحب الطائر للخلف من المقلاع (أو استخدم المنزلقات) ثم اترك!'));
  }

  get y0m() { return (GROUND - ANCHOR.y) / PPM; }

  launch() {
    if (this.state !== 'aim' || this.birdsLeft <= 0 || this.hop < 1) return;
    const a = rad(this.theta);
    this.bird = {
      x: ANCHOR.x, y: ANCHOR.y,
      vx: this.v0 * Math.cos(a), vy: this.v0 * Math.sin(a),
      t: 0, touched: false, rest: 0, firstHit: null, rot: -a, squash: 0
    };
    this.recoil = 1;
    this.shotPops = 0;
    this.api.hideCard();
    this.trail = [];
    this.apex = null;
    this.birdsLeft--;
    this.used++;
    this.state = 'fly';
    this.api.sfx('launch');
    this.api.hint('');
  }

  // ---------- input ----------
  down(p) {
    if (this.state !== 'aim' || this.hop < 1) return;
    if (Math.hypot(p.x - ANCHOR.x, p.y - ANCHOR.y) < 140) { this.drag = true; this.api.hideCard(); this.aimAt(p); }
  }
  move(p) { if (this.drag) this.aimAt(p); }
  up() {
    if (!this.drag) return;
    this.drag = false;
    if (this.pull > 15) this.launch();
  }
  aimAt(p) {
    let dx = ANCHOR.x - p.x, dy = ANCHOR.y - p.y;
    const len = Math.hypot(dx, dy);
    this.pull = Math.min(len, MAX_PULL);
    if (len < 4) return;
    let th = deg(Math.atan2(dy, dx));
    th = clamp(th, 0, 85);
    this.theta = Math.round(th);
    this.v0 = Math.round(clamp(this.pull / MAX_PULL * this.lv.vmax, 4, this.lv.vmax) * 2) / 2;
    this.sV.set(this.v0);
    this.sA.set(this.theta);
  }
  key(e) {
    if (this.state !== 'aim') return false;
    const k = e.key;
    if (k === 'ArrowUp') this.theta = clamp(this.theta + 1, 0, 85);
    else if (k === 'ArrowDown') this.theta = clamp(this.theta - 1, 0, 85);
    else if (k === 'ArrowRight') this.v0 = clamp(this.v0 + .5, 4, this.lv.vmax);
    else if (k === 'ArrowLeft') this.v0 = clamp(this.v0 - .5, 4, this.lv.vmax);
    else if (k === ' ' || k === 'Enter') { this.launch(); return true; }
    else return false;
    this.sV.set(this.v0); this.sA.set(this.theta);
    return true;
  }

  // ---------- physics ----------
  update(dt) {
    this.time += dt;
    this.fx.update(dt);
    if (this.hop < 1) this.hop = Math.min(1, this.hop + dt / .45);
    this.recoil = Math.max(0, this.recoil - dt * 2.5);
    if (this.bird) this.bird.squash = Math.max(0, this.bird.squash - dt * 5);
    for (const t of this.targets) {
      if (!t.falling) continue;
      t.vy += 900 * dt;
      t.y += t.vy * dt;
      if (t.y + t.r >= GROUND) { t.y = GROUND - t.r; this.pop(t); }
    }
    if (this.state === 'fly') {
      const steps = 8, h = dt * this.lv.timeScale / steps;
      for (let i = 0; i < steps && this.state === 'fly'; i++) this.step(h);
    }
    this.updateVars();
  }

  step(h) {
    const b = this.bird, g = this.g;
    b.x += b.vx * h * PPM;
    b.y -= (b.vy * h - .5 * g * h * h) * PPM;
    b.vy -= g * h;
    b.t += h;
    if (!this.apex && b.vy <= 0 && !b.touched) this.apex = { x: b.x, y: b.y };
    if (this.trail.length === 0 || Math.hypot(b.x - this.trail.at(-1).x, b.y - this.trail.at(-1).y) > 12) this.trail.push({ x: b.x, y: b.y });

    for (const t of this.targets) {
      if (t.alive && !t.falling && Math.hypot(b.x - t.x, b.y - t.y) < t.r + BR) {
        this.pop(t);
        b.vx *= .7; b.vy *= .7;
      }
    }
    for (const r of this.blocks) if (r.alive) this.collide(b, r);
    this.collide(b, { x: -500, y: GROUND, w: 2000, h: 200, type: 'ground' });

    if (b.touched) {
      b.rot += b.vx * h * .3;
      if (Math.hypot(b.vx, b.vy) < 1.2) b.rest += h; else b.rest = 0;
    } else {
      b.rot = -Math.atan2(b.vy, b.vx);
    }
    if (b.rest > .35 || b.t > 16 || b.x > W + 40 || b.x < -40 || b.y > 700) {
      if (!this.shotPops) this.explainMiss(b);
      this.endShot();
    }
  }

  collide(b, r) {
    const cx = clamp(b.x, r.x, r.x + r.w), cy = clamp(b.y, r.y, r.y + r.h);
    let dx = b.x - cx, dy = b.y - cy;
    let d = Math.hypot(dx, dy);
    if (d >= BR) return;
    let nx, ny;
    if (d > 1e-4) { nx = dx / d; ny = dy / d; }
    else {
      const pen = [[b.x - r.x, -1, 0], [r.x + r.w - b.x, 1, 0], [b.y - r.y, 0, -1], [r.y + r.h - b.y, 0, 1]].sort((a, c) => a[0] - c[0])[0];
      nx = pen[1]; ny = pen[2]; d = 0;
    }
    const vsx = b.vx, vsy = -b.vy;           // screen-space velocity (y down)
    const vn = vsx * nx + vsy * ny;
    b.x += nx * (BR - d);
    b.y += ny * (BR - d);
    if (vn >= 0) return;
    const impact = -vn;
    if (!b.touched) { b.touched = true; b.firstHit = { t: b.t, x: b.x, type: r.type }; }
    if (impact > 2) b.squash = Math.max(b.squash, Math.min(1, impact / 12));
    if (BREAK[r.type] && impact > BREAK[r.type]) {
      this.breakBlock(r);
      b.vx *= .6; b.vy *= .6;
      return;
    }
    const e = r.type === 'ground' ? .3 : .4, f = r.type === 'ground' ? .75 : .85;
    const tx = vsx - vn * nx, ty = vsy - vn * ny;
    const nvx = tx * f - e * vn * nx, nvy = ty * f - e * vn * ny;
    b.vx = nvx; b.vy = -nvy;
    if (impact > 3) this.api.sfx('hit');
  }

  breakBlock(r) {
    r.alive = false;
    this.api.sfx('break');
    const col = r.type === 'glass' ? ['#bfefff', '#ffffff', '#8fd8f5'] : ['#b5763a', '#8b5a2b', '#d9a066'];
    this.fx.emit(r.x + r.w / 2, r.y + r.h / 2, 18, { color: col, speed: 260, size: 6, shape: 'square' });
    const idx = this.blocks.indexOf(r);
    for (const t of this.targets) if (t.alive && t.on === idx) t.falling = true;
  }

  pop(t) {
    if (!t.alive) return;
    t.alive = false;
    t.falling = false;
    if (this.state === 'fly') this.shotPops = (this.shotPops || 0) + 1;
    this.api.sfx('pop');
    this.fx.emit(t.x, t.y, 22, { color: ['#7a4fd1', '#c9a3ff', '#ffd23f'], speed: 300, size: 5 });
    if (this.targets.every(x => !x.alive) && this.state !== 'fly') this.checkEnd();
  }

  // A shot that hit nothing: show the projectile equations with the player's own numbers
  // in the middle of the stage, and where the result differs from the target.
  explainMiss(b) {
    const alive = this.targets.filter(t => t.alive);
    if (!alive.length) return;
    const hit = b.firstHit || { t: b.t, x: b.x, type: 'none' };
    const xLand = (hit.x - ANCHOR.x) / PPM;
    const dist = t => Math.abs((t.x - ANCHOR.x) / PPM - xLand);
    const tgt = alive.reduce((m, t) => dist(t) < dist(m) ? t : m);
    const xT = (tgt.x - ANCHOR.x) / PPM, diff = xLand - xT;
    const a = rad(this.theta), g = this.g;
    const vx = this.v0 * Math.cos(a), vy = this.v0 * Math.sin(a);
    const flewOff = !b.firstHit;
    let hint;
    if (hit.type === 'stone' || hit.type === 'wood' || hit.type === 'glass') {
      hint = T('The bird hit an obstacle before the target. Raise the angle θ for a higher path, or lower it to pass underneath.',
        'اصطدم الطائر بعائق قبل الهدف. ارفع الزاوية θ ليعلو المسار، أو اخفضها ليمر من تحته.');
    } else if (diff < 0) {
      hint = T(`It landed ${fmt(-diff, 1)} m short. Increase v₀, or bring θ closer to 45°.`,
        `سقط قبل الهدف بـ ${fmt(-diff, 1)} م. زِد السرعة v₀ أو قرّب الزاوية θ من 45°.`);
    } else {
      hint = T(`It went ${fmt(diff, 1)} m too far. Decrease v₀, or move θ away from 45°.`,
        `تجاوز الهدف بـ ${fmt(diff, 1)} م. قلّل السرعة v₀ أو أبعد الزاوية θ عن 45°.`);
    }
    const fix = this.correctShot(tgt);
    this.api.card({
      title: T('Missed! Your numbers, then the correct ones', 'أخطأت الهدف! معادلتك بأرقامك، ثم المعادلة الصحيحة'),
      lines: [
        { text: T('✖ Your shot', '✖ رميتك'), kind: 'head bad' },
        { text: `v₀ = ${fmt(this.v0, 1)} m/s    θ = ${this.theta}°    g = ${g} m/s²` },
        { text: `vₓ = v₀·cosθ = ${fmt(this.v0, 1)} × cos${this.theta}° = ${fmt(vx, 2)} m/s` },
        { text: `vᵧ = v₀·sinθ = ${fmt(this.v0, 1)} × sin${this.theta}° = ${fmt(vy, 2)} m/s` },
        { text: `y = y₀ + vᵧ·t − ½·g·t²  ⇒  t = ${fmt(hit.t, 2)} s` },
        { text: `x = vₓ·t = ${fmt(vx, 2)} × ${fmt(hit.t, 2)} = ${fmt(vx * hit.t, 1)} m`, kind: 'bad' },
        { text: `x(target) = ${fmt(xT, 1)} m    Δx = ${diff > 0 ? '+' : ''}${fmt(diff, 1)} m`, kind: 'bad' },
        ...fix.lines
      ],
      hint: (flewOff ? T('The bird left the screen. ', 'خرج الطائر من الشاشة. ') : '') + hint + ' ' + fix.hint
    });
  }

  // v₀ that sends the bird through (x, y) at angle θ: y = y₀ + x·tanθ − g·x² / (2·v₀²·cos²θ)
  speedFor(th, x, y) {
    const a = rad(th), c = Math.cos(a);
    const den = 2 * c * c * (this.y0m + x * Math.tan(a) - y);
    return den > 0 ? Math.sqrt(this.g * x * x / den) : NaN;
  }

  // Does a free flight at (v, θ) reach the target before touching a standing block?
  pathClear(v, th, tgt) {
    const a = rad(th), vx = v * Math.cos(a), vy = v * Math.sin(a), g = this.g;
    for (let t = 0; t < 20; t += .005) {
      const px = ANCHOR.x + vx * t * PPM, py = ANCHOR.y - (vy * t - .5 * g * t * t) * PPM;
      if (Math.hypot(px - tgt.x, py - tgt.y) < tgt.r + BR - 4) return true;
      if (py > GROUND || px > W + 50) return false;
      for (const r of this.blocks) {
        if (!r.alive) continue;
        if (Math.hypot(px - clamp(px, r.x, r.x + r.w), py - clamp(py, r.y, r.y + r.h)) >= BR - 1) continue;
        const speed = Math.hypot(vx, vy - g * t);
        if (BREAK[r.type] && speed > BREAK[r.type] + 1) continue;   // glass / wood smash at this speed
        return false;
      }
    }
    return false;
  }

  // The correct shot for this target: keep the player's θ if a speed works, otherwise the nearest
  // angle that does, checked against the blocks still standing.
  correctShot(tgt) {
    const g = this.g, y0 = this.y0m;
    const x = (tgt.x - ANCHOR.x) / PPM, y = (GROUND - tgt.y) / PPM;
    const angles = [this.theta, ...Array.from({ length: 84 }, (_, i) => i + 2).filter(th => th !== this.theta).sort((p, q) => Math.abs(p - this.theta) - Math.abs(q - this.theta))];
    for (const th of angles) {
      const v = Math.round(this.speedFor(th, x, y) * 10) / 10;
      if (!(v >= 4 && v <= this.lv.vmax) || !this.pathClear(v, th, tgt)) continue;
      const ar = rad(th), t = x / (v * Math.cos(ar));
      const yAt = y0 + v * Math.sin(ar) * t - .5 * g * t * t;
      const same = th === this.theta;
      return {
        lines: [
          { text: T('✔ Correct equation', '✔ المعادلة الصحيحة'), kind: 'head good' },
          { text: `v₀ = ${fmt(v, 1)} m/s    θ = ${th}°`, kind: 'good' },
          { text: `v₀ = √( g·x² / (2·cos²θ·(y₀ + x·tanθ − y)) ) = √( ${g}·${fmt(x, 1)}² / (2·cos²${th}°·(${fmt(y0, 1)} + ${fmt(x, 1)}·tan${th}° − ${fmt(y, 1)})) ) = ${fmt(v, 1)} m/s`, kind: 'good' },
          { text: `t = x / (v₀·cosθ) = ${fmt(x, 1)} / (${fmt(v, 1)} × cos${th}°) = ${fmt(t, 2)} s`, kind: 'good' },
          { text: `y = ${fmt(y0, 1)} + ${fmt(v, 1)}·sin${th}°·${fmt(t, 2)} − ½·${g}·${fmt(t, 2)}² = ${fmt(yAt, 1)} m = y(target) ✔`, kind: 'good' }
        ],
        hint: same
          ? T(`Correct: keep θ = ${th}° and use v₀ = ${fmt(v, 1)} m/s.`, `الصحيح: أبقِ θ = ${th}° واجعل v₀ = ${fmt(v, 1)} م/ث.`)
          : T(`Correct: at θ = ${this.theta}° the path is blocked or out of range; use θ = ${th}° and v₀ = ${fmt(v, 1)} m/s.`,
            `الصحيح: بزاوية ${this.theta}° المسار مسدود أو خارج المدى؛ استخدم θ = ${th}° و v₀ = ${fmt(v, 1)} م/ث.`)
      };
    }
    return {
      lines: [{ text: T('✔ No clear path to this target from here: try another target first.', '✔ لا يوجد مسار مفتوح لهذا الهدف الآن: جرّب هدفًا آخر أولًا.'), kind: 'head good' }],
      hint: ''
    };
  }

  endShot() {
    this.lastTrail = this.trail;
    this.state = 'aim';
    this.bird = null;
    if (this.birdsLeft > 0) this.hop = 0;
    this.checkEnd();
  }

  checkEnd() {
    if (this.targets.some(t => t.falling)) { setTimeout(() => this.checkEnd(), 300); return; }
    if (this.targets.every(t => !t.alive)) {
      this.state = 'done';
      this.api.win(this.used <= 1 ? 3 : this.used === 2 ? 2 : 1);
    } else if (this.birdsLeft <= 0 && this.state === 'aim') {
      this.state = 'done';
      this.api.lose(T('Out of birds! Tip: compare your trail with the target and adjust v₀ or θ a little at a time.',
        'نفدت الطيور! نصيحة: قارن مسارك السابق بالهدف وعدّل v₀ أو θ قليلًا في كل مرة.'));
    } else {
      this.api.hint(T(`${this.birdsLeft} bird(s) left — your last path is shown faintly.`, `متبقٍ ${this.birdsLeft} طائر — مسارك السابق ظاهر بشكل باهت.`));
    }
  }

  updateVars() {
    const a = rad(this.theta), g = this.g;
    const rows = [];
    if (this.state === 'fly' && this.bird) {
      const b = this.bird;
      const x = (b.x - ANCHOR.x) / PPM, y = (GROUND - b.y) / PPM;
      rows.push(
        { sym: 't', name: T('time', 'الزمن'), value: fmt(b.t, 2), unit: 's' },
        { sym: 'x', name: T('horizontal distance', 'المسافة الأفقية'), value: fmt(x, 1), unit: 'm' },
        { sym: 'y', name: T('height', 'الارتفاع'), value: fmt(y, 1), unit: 'm' },
        { sym: 'vₓ', name: T('horizontal velocity', 'السرعة الأفقية'), value: fmt(b.vx, 1), unit: 'm/s', hl: !b.touched },
        { sym: 'vᵧ', name: T('vertical velocity', 'السرعة الرأسية'), value: fmt(b.vy, 1), unit: 'm/s' },
        { sym: 'v', name: T('speed', 'مقدار السرعة'), value: fmt(Math.hypot(b.vx, b.vy), 1), unit: 'm/s' }
      );
    } else {
      rows.push(
        { sym: 'v₀', name: T('launch speed', 'سرعة الإطلاق'), value: fmt(this.v0, 1), unit: 'm/s' },
        { sym: 'θ', name: T('launch angle', 'زاوية الإطلاق'), value: fmt(this.theta, 0), unit: '°' },
        { sym: 'v₀ₓ', name: 'v₀ cosθ', value: fmt(this.v0 * Math.cos(a), 1), unit: 'm/s' },
        { sym: 'v₀ᵧ', name: 'v₀ sinθ', value: fmt(this.v0 * Math.sin(a), 1), unit: 'm/s' },
        { sym: 'H', name: T('max rise', 'أقصى ارتفاع إضافي'), value: fmt((this.v0 * Math.sin(a)) ** 2 / (2 * g), 1), unit: 'm', hl: true },
        { sym: 'R', name: T('range (level ground)', 'المدى (أرض مستوية)'), value: fmt(this.v0 ** 2 * Math.sin(2 * a) / g, 1), unit: 'm', hl: true }
      );
    }
    rows.push({ sym: 'g', name: T('gravity', 'تسارع الجاذبية'), value: fmt(g, 2), unit: 'm/s²' });
    this.api.setVars(rows);
  }

  // ---------- drawing ----------
  draw(ctx) {
    const w = this.world;
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
    sky.addColorStop(0, w.sky[0]); sky.addColorStop(1, w.sky[1]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, 600);
    if (w.stars) {
      ctx.fillStyle = '#fff';
      for (const [x, y, s] of this.stars) { ctx.globalAlpha = .4 + .4 * Math.sin(this.time * 2 + x); ctx.fillRect(x, y, s, s); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#3d7bd9'; ctx.beginPath(); ctx.arc(860, 90, 34, 0, 7); ctx.fill();
      ctx.fillStyle = '#5cc27a'; ctx.beginPath(); ctx.arc(850, 82, 14, 0, 7); ctx.arc(872, 100, 9, 0, 7); ctx.fill();
    } else {
      ctx.fillStyle = this.lv.world === 'mars' ? '#fff1c9' : '#ffe27a';
      ctx.beginPath(); ctx.arc(880, 80, 34, 0, 7); ctx.fill();
      for (const [x, y, s] of this.clouds) drawCloud(ctx, (x + this.time * 6 * s) % (W + 160) - 80, y, s, this.lv.world === 'mars' ? .35 : .85);
    }
    ctx.fillStyle = w.hill;
    ctx.beginPath(); ctx.moveTo(0, GROUND);
    for (let x = 0; x <= W; x += 50) ctx.lineTo(x, GROUND - 60 - Math.sin(x / 140) * 30 - Math.sin(x / 57) * 10);
    ctx.lineTo(W, GROUND); ctx.fill();
    ctx.fillStyle = w.ground; ctx.fillRect(0, GROUND, W, 60);
    ctx.fillStyle = w.ground2; ctx.fillRect(0, GROUND + 14, W, 60);

    // distance ruler
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    for (let m = 10; ANCHOR.x + m * PPM < W; m += 10) {
      const x = ANCHOR.x + m * PPM;
      ctx.fillRect(x - 1, GROUND, 2, 8);
      label(ctx, `${m}m`, x, GROUND + 24, { size: 11, color: '#fff', stroke: 'rgba(0,0,0,.35)' });
    }

    // previous path
    ctx.fillStyle = 'rgba(255,255,255,.45)';
    for (const p of this.lastTrail) { ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, 7); ctx.fill(); }

    for (const r of this.blocks) if (r.alive) this.drawBlock(ctx, r);
    for (const t of this.targets) if (t.alive) drawGloom(ctx, t.x, t.y, t.r, this.time, t.falling);

    this.drawSling(ctx, 'back');
    if (this.state === 'aim') this.drawPreview(ctx);

    // current trail + apex
    ctx.fillStyle = '#fff';
    for (const p of this.trail) { ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, 7); ctx.fill(); }
    if (this.apex) {
      ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(this.apex.x, this.apex.y); ctx.lineTo(this.apex.x, GROUND); ctx.stroke(); ctx.setLineDash([]);
      label(ctx, `H = ${fmt((GROUND - this.apex.y) / PPM, 1)} m`, this.apex.x, this.apex.y - 26, { size: 15, color: '#ffe066' });
    }

    if (this.bird) {
      const b = this.bird;
      const sq = b.squash * .35;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.scale(1 + sq, 1 - sq);
      drawBird(ctx, 0, 0, BR, b.rot);
      ctx.restore();
      if (this.showVectors && !b.touched) {
        const k = 3;
        arrow(ctx, b.x, b.y, b.x + b.vx * k, b.y, '#ff4d6d', 3);
        arrow(ctx, b.x, b.y, b.x, b.y - b.vy * k, '#3a86ff', 3);
        arrow(ctx, b.x, b.y, b.x + b.vx * k, b.y - b.vy * k, '#fff', 2);
        label(ctx, 'vₓ', b.x + b.vx * k + 12, b.y, { size: 13, color: '#ff8fa3' });
        label(ctx, 'vᵧ', b.x, b.y - b.vy * k + (b.vy > 0 ? -12 : 12), { size: 13, color: '#8fb8ff' });
      }
    } else if (this.state === 'aim') {
      const p = this.pouch();
      if (this.hop < 1) {
        // next bird hops from the queue onto the slingshot
        const k = this.hop, e = 1 - (1 - k) * (1 - k);
        const qx = 70, qy = GROUND - 14;
        drawBird(ctx, qx + (p.x - qx) * e, qy + (p.y - qy) * e - Math.sin(k * Math.PI) * 70, BR, -k * Math.PI * 2);
      } else {
        drawBird(ctx, p.x, p.y + Math.sin(this.time * 4) * 1.5, BR, -rad(this.theta), Math.sin(this.time * 3) > .97);
      }
    }
    this.drawSling(ctx, 'front');

    // waiting birds
    for (let i = 0; i < this.birdsLeft - (this.state === 'aim' ? 1 : 0); i++) {
      const bounce = Math.max(0, Math.sin(this.time * 5 - i * .9)) * 5;
      drawBird(ctx, 70 - i * 30, GROUND - 14 - bounce, 12, 0);
    }

    this.fx.draw(ctx);

    // HUD
    ctx.fillStyle = 'rgba(20,10,60,.55)';
    roundRect(ctx, 12, 12, 250, 36, 12); ctx.fill();
    label(ctx, L(w.name), 60, 30, { size: 16, stroke: null });
    label(ctx, `g = ${w.g} m/s²`, 180, 30, { size: 16, stroke: null, color: '#ffe066' });
    if (this.state === 'aim') label(ctx, `v₀ = ${fmt(this.v0, 1)} m/s   θ = ${this.theta}°`, ANCHOR.x + 10, ANCHOR.y - 70, { size: 15 });
  }

  pouch() {
    if (this.drag) {
      const a = rad(this.theta);
      const len = this.pull;
      return { x: ANCHOR.x - Math.cos(a) * len, y: ANCHOR.y + Math.sin(a) * len };
    }
    const a = rad(this.theta), len = this.v0 / this.lv.vmax * MAX_PULL * .35;
    return { x: ANCHOR.x - Math.cos(a) * len, y: ANCHOR.y + Math.sin(a) * len };
  }

  drawSling(ctx, layer) {
    const bx = ANCHOR.x, by = ANCHOR.y;
    if (layer === 'back') {
      ctx.fillStyle = '#7a4a1e';
      roundRect(ctx, bx - 6, by + 10, 12, GROUND - by - 10, 4); ctx.fill();
      ctx.strokeStyle = '#7a4a1e'; ctx.lineWidth = 10; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(bx, by + 18); ctx.lineTo(bx + 14, by - 10); ctx.stroke();
      const p = this.bandPoint();
      ctx.strokeStyle = '#3b2412'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(bx + 14, by - 10); ctx.lineTo(p.x, p.y); ctx.stroke();
    } else {
      ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 10; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(bx, by + 18); ctx.lineTo(bx - 14, by - 10); ctx.stroke();
      const p = this.bandPoint();
      ctx.strokeStyle = '#3b2412'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(bx - 14, by - 10); ctx.lineTo(p.x, p.y); ctx.stroke();
    }
  }

  // where the rubber band meets: the pouch while aiming, a decaying wobble after a launch
  bandPoint() {
    if (this.state === 'aim' && this.hop >= 1) return this.pouch();
    const w = Math.sin(this.time * 45) * this.recoil * 16;
    return { x: ANCHOR.x + w, y: ANCHOR.y - 6 - Math.abs(w) * .3 };
  }

  drawPreview(ctx) {
    const a = rad(this.theta), g = this.g;
    const vx = this.v0 * Math.cos(a), vy = this.v0 * Math.sin(a);
    const tLand = (vy + Math.sqrt(vy * vy + 2 * g * this.y0m)) / g;
    const tMax = tLand * this.lv.preview;
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    const n = 40;
    for (let i = 1; i <= n; i++) {
      const t = tMax * i / n;
      const x = ANCHOR.x + vx * t * PPM, y = ANCHOR.y - (vy * t - .5 * g * t * t) * PPM;
      if (x > W) break;
      ctx.globalAlpha = 1 - i / n * .7;
      ctx.beginPath(); ctx.arc(x, y, 3.2, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // angle arc
    ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ANCHOR.x, ANCHOR.y); ctx.lineTo(ANCHOR.x + 60, ANCHOR.y); ctx.stroke();
    ctx.beginPath(); ctx.arc(ANCHOR.x, ANCHOR.y, 40, -a, 0); ctx.stroke();
    label(ctx, `${this.theta}°`, ANCHOR.x + 58, ANCHOR.y - 16, { size: 13, color: '#ffe066' });
  }

  drawBlock(ctx, r) {
    if (r.type === 'stone') {
      ctx.fillStyle = '#8d93a8'; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = '#6c7287'; ctx.lineWidth = 2;
      for (let y = r.y + 20; y < r.y + r.h; y += 20) { ctx.beginPath(); ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); ctx.stroke(); }
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = '#a9afc2'; ctx.fillRect(r.x, r.y, r.w, 4);
    } else if (r.type === 'wood') {
      ctx.fillStyle = '#c98a4b'; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 2; ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
      ctx.beginPath();
      if (r.w > r.h) { ctx.moveTo(r.x + 6, r.y + r.h / 2); ctx.lineTo(r.x + r.w - 6, r.y + r.h / 2); }
      else { ctx.moveTo(r.x + r.w / 2, r.y + 6); ctx.lineTo(r.x + r.w / 2, r.y + r.h - 6); }
      ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(190,240,255,.55)'; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = '#e6fbff'; ctx.lineWidth = 2; ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = 'rgba(255,255,255,.8)';
      ctx.beginPath(); ctx.moveTo(r.x + 3, r.y + r.h * .3); ctx.lineTo(r.x + Math.min(r.w, 12), r.y + 3); ctx.stroke();
    }
  }
}

export default {
  id: 'bird',
  levels: LEVELS,
  quiz: QUIZ,
  formulas: [
    { expr: 'x = v₀ cosθ · t', label: { en: 'Horizontal position', ar: 'الموقع الأفقي' } },
    { expr: 'y = y₀ + v₀ sinθ · t − ½ g t²', label: { en: 'Vertical position', ar: 'الموقع الرأسي' } },
    { expr: 'vᵧ = v₀ sinθ − g t', label: { en: 'Vertical velocity', ar: 'السرعة الرأسية' } },
    { expr: 'R = v₀² sin2θ / g', label: { en: 'Range (level ground)', ar: 'المدى الأفقي' } },
    { expr: 'H = v₀² sin²θ / 2g', label: { en: 'Maximum height', ar: 'أقصى ارتفاع' } }
  ],
  terms: [
    { en: 'Projectile', ar: 'المقذوف' }, { en: 'Trajectory', ar: 'المسار' }, { en: 'Range', ar: 'المدى الأفقي' },
    { en: 'Launch angle', ar: 'زاوية الإطلاق' }, { en: 'Free-fall acceleration', ar: 'تسارع السقوط الحر' },
    { en: 'Velocity components', ar: 'مركبات السرعة' }, { en: 'Parabola', ar: 'القطع المكافئ' }
  ],
  tutorial: [
    { en: 'Drag Fizz backwards from the slingshot. The farther you pull, the larger the launch speed v₀.', ar: 'اسحب «فِز» للخلف من المقلاع. كلما سحبت أكثر زادت سرعة الإطلاق v₀.' },
    { en: 'The direction of the pull sets the launch angle θ. The dotted line predicts the path.', ar: 'اتجاه السحب يحدد زاوية الإطلاق θ. الخط المنقط يتنبأ بالمسار.' },
    { en: 'Prefer exact values? Use the v₀ and θ sliders in the lab panel and press Launch (keyboard: arrows + Space).', ar: 'تفضّل القيم الدقيقة؟ استخدم منزلقات v₀ وθ في لوحة المختبر واضغط «أطلق» (لوحة المفاتيح: الأسهم + المسافة).' },
    { en: 'Watch the live measurements: vₓ stays constant, vᵧ shrinks to zero at the top and then grows downward.', ar: 'راقب القياسات المباشرة: vₓ ثابتة، وvᵧ تتناقص حتى الصفر عند القمة ثم تزداد للأسفل.' },
    { en: 'Pop every Gloomling. Fewer birds = more stars!', ar: 'أسقط كل الجلوملينز. طيور أقل = نجوم أكثر!' }
  ],
  create: (api, i) => new BirdGame(api, i)
};
