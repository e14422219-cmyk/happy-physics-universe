// Magnet Hero: Power Factory — Electromagnetic Induction
import { T } from '../i18n.js';
import { W } from '../engine.js';
import { clamp, fmt, Particles, roundRect, label, arrow } from '../util.js';
import { drawRobot } from '../art.js';

const RAIL_Y = 230;
const COIL = { x: 560, len: 170, r: 70 };
const MAG_LEN = 200;              // longer than the coil, so only the facing pole can be inside it
const TURNS = 12;                 // loops sampled along the coil when averaging the flux
const AREA = Math.PI * 0.07 ** 2; // coil cross-section (m²)
const MX_MIN = 70 + MAG_LEN / 2;
const MX_MAX = COIL.x + COIL.len / 2 - 6 - MAG_LEN / 2;        // facing pole stops at the far end of the coil
const ROTATE_MAX = COIL.x - COIL.len / 2 - 30 - MAG_LEN / 2;   // magnet must be clear of the coil to turn
// Solid-angle flux of one magnetic pole through a loop, as a fraction: u(d) = d / √(d² + R²)
const u = d => d / Math.hypot(d, COIL.r);
const R_LOAD = 10;                // bulb / battery resistance (Ω)

const LEVELS = [
  {
    name: { en: 'First Spark', ar: 'الشرارة الأولى' }, mode: 'slide', N: 200, B: 0.4, par: 10,
    goal: { type: 'peak', v: 6 },
    learn: {
      en: 'A current is induced only while the magnetic flux through the coil is changing. A magnet resting inside the coil induces nothing.',
      ar: 'يتولد تيار حثي فقط أثناء تغيّر التدفق المغناطيسي عبر الملف. المغناطيس الساكن داخل الملف لا يولّد شيئًا.'
    }
  },
  {
    name: { en: 'Gate Code', ar: 'شيفرة البوابة' }, mode: 'slide', N: 200, B: 0.4, par: 15,
    goal: { type: 'seq', seq: [-1, 1, -1], v: 4 },
    learn: {
      en: 'Pushing the magnet in and pulling it out make the needle swing in opposite directions: the sign of ΔΦ/Δt decides the direction of the induced current.',
      ar: 'إدخال المغناطيس وإخراجه يحرّكان المؤشر في اتجاهين متعاكسين: إشارة ΔΦ/Δt تحدد اتجاه التيار الحثي.'
    }
  },
  {
    name: { en: 'Charge the Battery', ar: 'اشحن البطارية' }, mode: 'slide', N: 100, B: 0.2, par: 20, adjustable: true,
    goal: { type: 'energy', joules: 60, time: 30 },
    learn: {
      en: 'The induced emf grows with the number of turns N, the magnet strength B and how fast you move: ε = −N ΔΦ/Δt.',
      ar: 'تزداد القوة الدافعة الحثية بزيادة عدد اللفات N وشدة المغناطيس B وسرعة الحركة: ε = −N ΔΦ/Δt.'
    }
  },
  {
    name: { en: "Lenz's Lock", ar: 'قفل لنز' }, mode: 'slide', N: 200, B: 0.4, par: 30,
    goal: { type: 'seq', seq: [1, -1, -1], v: 4 },
    learn: {
      en: "Lenz's law: the induced current always opposes the change that caused it. Pushing in the S pole gives the opposite current to pushing in the N pole, so the pole you choose decides the direction.",
      ar: 'قانون لنز: التيار الحثي يقاوم دائمًا التغير المسبب له. إدخال القطب الجنوبي S يعطي تيارًا معاكسًا لإدخال القطب الشمالي N، فالقطب الذي تختاره يحدد الاتجاه.'
    }
  },
  {
    name: { en: 'City Generator', ar: 'مولّد المدينة' }, mode: 'gen', B: 0.5, A: 0.02, par: 20,
    goal: { type: 'band', lo: 10, hi: 12, hold: 4 },
    learn: {
      en: 'A generator spins a coil in a magnetic field. The emf is sinusoidal, ε = NBAω sinωt, and its peak value NBAω grows with the angular speed ω.',
      ar: 'المولّد يدير ملفًا داخل مجال مغناطيسي. القوة الدافعة جيبية ε = NBAω sinωt، وقيمتها العظمى NBAω تزداد بزيادة السرعة الزاوية ω.'
    }
  }
];

const QUIZ = [
  {
    q: { en: 'A magnet rests inside a coil. The induced current is…', ar: 'مغناطيس ساكن داخل ملف. التيار الحثي يكون…' },
    options: [{ en: 'maximum', ar: 'أكبر ما يمكن' }, { en: 'zero', ar: 'صفرًا' }, { en: 'alternating', ar: 'مترددًا' }],
    answer: 1,
    explain: { en: 'No change in flux (ΔΦ = 0) means no induced emf.', ar: 'لا تغير في التدفق (ΔΦ = 0) يعني لا قوة دافعة حثية.' }
  },
  {
    q: { en: 'Pulling the magnet out instead of pushing it in makes the current…', ar: 'سحب المغناطيس للخارج بدلًا من إدخاله يجعل التيار…' },
    options: [{ en: 'flow the opposite way', ar: 'يسري في الاتجاه المعاكس' }, { en: 'stop forever', ar: 'يتوقف للأبد' }, { en: 'flow the same way', ar: 'يسري في الاتجاه نفسه' }],
    answer: 0,
    explain: { en: 'Increasing and decreasing flux give opposite signs of ΔΦ/Δt.', ar: 'زيادة التدفق ونقصانه يعطيان إشارتين متعاكستين لـ ΔΦ/Δt.' }
  },
  {
    q: { en: 'Doubling the number of turns N (same motion) makes ε…', ar: 'مضاعفة عدد اللفات N (بنفس الحركة) تجعل ε…' },
    options: [{ en: 'half', ar: 'النصف' }, { en: 'the same', ar: 'كما هي' }, { en: 'double', ar: 'الضعف' }],
    answer: 2,
    explain: { en: 'ε = −N ΔΦ/Δt is proportional to N.', ar: 'ε = −N ΔΦ/Δt تتناسب طرديًا مع N.' }
  },
  {
    q: { en: 'The minus sign in Faraday\'s law represents…', ar: 'الإشارة السالبة في قانون فاراداي تمثل…' },
    options: [{ en: "Lenz's law (opposition to change)", ar: 'قانون لنز (مقاومة التغير)' }, { en: 'negative charge', ar: 'شحنة سالبة' }, { en: 'energy loss', ar: 'فقدان الطاقة' }],
    answer: 0,
    explain: { en: 'The induced current creates a field that opposes the change in flux.', ar: 'التيار الحثي يولّد مجالًا يقاوم التغير في التدفق.' }
  },
  {
    q: { en: 'A generator turns twice as fast. Its peak emf becomes…', ar: 'مولّد يدور بسرعة مضاعفة. قيمته العظمى للقوة الدافعة تصبح…' },
    options: [{ en: 'twice as large', ar: 'ضعف القيمة' }, { en: 'four times larger', ar: 'أربعة أضعاف' }, { en: 'unchanged', ar: 'كما هي' }],
    answer: 0,
    explain: { en: 'ε_max = NBAω is proportional to ω.', ar: 'ε_max = NBAω تتناسب طرديًا مع ω.' }
  }
];

class MagnetGame {
  constructor(api, li) {
    this.api = api;
    this.lv = LEVELS[li];
    this.letterbox = '#232742';
    this.letterboxBottom = '#1a1d33';
    this.N = this.lv.N || 100;
    this.B = this.lv.B;
    this.time = 0;
    this.playTime = 0;
    this.emf = 0;
    this.hist = new Array(240).fill(0);
    this.fx = new Particles();
    this.done = false;
    this.phase = 0;      // current dots
    this.goalProg = 0;
    this.seqIdx = 0;
    this.pulse = null;
    this.energy = 0;
    this.lastPulses = [];

    if (this.lv.mode === 'slide') this.initSlide(api);
    else this.initGen(api);
  }

  // ================= sliding magnet =================
  initSlide(api) {
    this.mx = 220; this.mv = 0;
    this.rot = 0; this.rotTarget = 0;   // 0: N pole faces the coil, π: S pole faces the coil
    this.phi = this.flux();
    this.drag = null;
    if (this.lv.adjustable) {
      api.slider({ label: T('Number of turns N', 'عدد اللفات N'), min: 50, max: 400, step: 50, value: this.N, digits: 0, onInput: v => { this.N = v; } });
      api.slider({ label: T('Magnet strength B', 'شدة المغناطيس B'), min: .1, max: .5, step: .05, value: this.B, unit: 'T', digits: 2, onInput: v => { this.B = v; } });
    }
    this.poleSeg = api.seg({
      label: T('Pole facing the coil', 'القطب المواجه للملف'),
      options: [{ label: T('N (north)', 'N (شمالي)'), value: 'N' }, { label: T('S (south)', 'S (جنوبي)'), value: 'S' }],
      value: 'N',
      onChange: v => { if (v !== this.facing) this.flip(); else this.poleSeg.set(this.facing); }
    });
    api.note(T('Drag the magnet toward the coil (keys ← →). Tap the magnet, the buttons above or F to turn it so the other pole faces the coil. Only the facing pole can enter.',
      'اسحب المغناطيس نحو الملف (المفاتيح ← →). اضغط على المغناطيس أو الأزرار أعلاه أو F لتدويره فيواجه الملفَ القطبُ الآخر. القطب المواجه وحده يدخل الملف.'));
    const g = this.lv.goal;
    if (g.type === 'peak') api.hint(T(`Move the magnet fast through the coil to reach ${g.v} V!`, `حرّك المغناطيس بسرعة عبر الملف لتصل إلى ${g.v} فولت!`));
    if (g.type === 'seq') api.hint(T('Make the needle swing in the order shown on the gate.', 'اجعل المؤشر يتحرك بالترتيب الظاهر على البوابة.'));
    if (g.type === 'energy') api.hint(T(`Store ${g.joules} J in ${g.time} s — tune N and B, then move fast!`, `خزّن ${g.joules} جول خلال ${g.time} ثانية — اضبط N وB ثم تحرّك بسرعة!`));
  }

  get facing() { return Math.round(this.rotTarget / Math.PI) % 2 === 0 ? 'N' : 'S'; }
  get rotating() { return Math.abs(this.rot - this.rotTarget) > 1e-3; }

  // Flux per turn, averaged over the coil: each pole acts like a point source, so
  // Φ = (q/2)·[u(x − x_S) − u(x − x_N)] summed over the turns, with q = 2·B·A.
  flux() {
    const c = Math.cos(this.rot) * MAG_LEN / 2;
    const pN = this.mx + c, pS = this.mx - c;
    let sum = 0;
    for (let i = 0; i < TURNS; i++) {
      const x = COIL.x - COIL.len / 2 + (i + .5) * COIL.len / TURNS;
      sum += u(x - pS) - u(x - pN);
    }
    return this.B * AREA * sum / TURNS;
  }

  flip() {
    if (this.done || this.rotating) return;
    if (this.mx > ROTATE_MAX + .5) {
      this.api.banner(T('Pull the magnet out of the coil first, then turn it', 'اسحب المغناطيس خارج الملف أولًا ثم دوّره'), true, 1600);
      this.api.sfx('bad');
      this.poleSeg?.set(this.facing);
      return;
    }
    this.rotTarget += Math.PI;
    this.poleSeg?.set(this.facing);
    this.api.sfx('click');
  }

  // ================= generator =================
  initGen(api) {
    this.N = 100;
    this.th = 0; this.omega = 0; this.turbine = 0;
    this.wheel = { x: 170, y: 300, r: 85 };
    this.dragGen = null;
    this.inBand = 0;
    api.seg({
      label: T('Coil turns N', 'عدد لفات الملف N'),
      options: [50, 100, 200].map(n => ({ label: String(n), value: n })), value: this.N,
      onChange: v => { this.N = v; }
    });
    this.sW = api.slider({ label: T('Water-turbine speed ω', 'سرعة التوربين المائي ω'), min: 0, max: 30, step: .5, value: 0, unit: 'rad/s', onInput: v => { this.turbine = v; } });
    api.note(T('Spin the crank wheel with your finger, or drive it with the turbine slider. Keep the peak emf in the green band.', 'أدر عجلة الذراع بإصبعك أو شغّلها بمنزلق التوربين. حافظ على القيمة العظمى للقوة الدافعة داخل النطاق الأخضر.'));
    api.hint(T('Keep ε_max between 10 V and 12 V for 4 seconds to power the city.', 'حافظ على ε_max بين 10 و12 فولت لمدة 4 ثوانٍ لتشغيل المدينة.'));
  }

  // ================= input =================
  down(p) {
    if (this.done) return;
    if (this.lv.mode === 'slide') {
      if (Math.abs(p.x - this.mx) < MAG_LEN / 2 + 10 && Math.abs(p.y - RAIL_Y) < 60) this.drag = { off: p.x - this.mx, sx: p.x, sy: p.y, moved: false };
    } else {
      const w = this.wheel;
      if (Math.hypot(p.x - w.x, p.y - w.y) < w.r + 30) this.dragGen = { a: Math.atan2(p.y - w.y, p.x - w.x), t: this.time };
    }
  }
  move(p) {
    if (this.drag) {
      if (Math.hypot(p.x - this.drag.sx, p.y - this.drag.sy) > 6) this.drag.moved = true;
      if (this.drag.moved && !this.rotating) this.target = clamp(p.x - this.drag.off, MX_MIN, MX_MAX);
    }
    if (this.dragGen) {
      const w = this.wheel;
      const a = Math.atan2(p.y - w.y, p.x - w.x);
      let da = a - this.dragGen.a;
      if (da > Math.PI) da -= 2 * Math.PI;
      if (da < -Math.PI) da += 2 * Math.PI;
      this.dragGen.a = a;
      this.crankDelta = (this.crankDelta || 0) + da;
    }
  }
  up() {
    if (this.drag && !this.drag.moved) this.flip();   // a tap on the magnet turns it around
    this.drag = null; this.dragGen = null; this.target = undefined;
  }
  key(e) {
    if (this.done) return false;
    if (this.lv.mode === 'slide') {
      if (e.key === 'ArrowLeft') { this.target = clamp(this.mx - 40, MX_MIN, MX_MAX); return true; }
      if (e.key === 'ArrowRight') { this.target = clamp(this.mx + 40, MX_MIN, MX_MAX); return true; }
      if (e.key === 'f' || e.key === 'F') { this.flip(); return true; }
    } else {
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { this.turbine = clamp(this.turbine + .5, 0, 30); this.sW.set(this.turbine); return true; }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { this.turbine = clamp(this.turbine - .5, 0, 30); this.sW.set(this.turbine); return true; }
    }
    return false;
  }

  // ================= update =================
  update(dt) {
    this.time += dt;
    if (!this.done) this.playTime += dt;
    this.fx.update(dt);
    if (this.lv.mode === 'slide') this.updateSlide(dt); else this.updateGen(dt);
    this.hist.push(this.emf);
    this.hist.shift();
    const I = this.emf / (this.Rcoil + R_LOAD);
    this.phase += I * dt * 6;
    this.updateVars();
  }

  get Rcoil() { return this.N * .02; }

  updateSlide(dt) {
    const prevX = this.mx;
    if (this.target !== undefined) {
      const k = this.drag ? 1 : Math.min(1, dt * 12);
      this.mx += (this.target - this.mx) * k;
      if (!this.drag && Math.abs(this.target - this.mx) < .5) this.target = undefined;
    }
    this.rotCool = this.rotating ? .35 : Math.max(0, (this.rotCool || 0) - dt);
    if (this.rotating) {
      const step = Math.PI / .45 * dt;
      this.rot = Math.abs(this.rotTarget - this.rot) <= step ? this.rotTarget : this.rot + Math.sign(this.rotTarget - this.rot) * step;
    }
    this.mv = this.mv * .7 + ((this.mx - prevX) / dt) * .3;
    const phi = this.flux();
    const raw = -this.N * (phi - this.phi) / dt;
    this.phi = phi;
    this.emf += (raw - this.emf) * Math.min(1, dt / .03);
    if (this.done) return;

    const g = this.lv.goal;
    if (g.type === 'peak') {
      this.goalProg = Math.max(this.goalProg, Math.abs(this.emf) / g.v);
      if (Math.abs(this.emf) >= g.v) this.finish();
    } else if (g.type === 'seq') {
      this.detectPulse(g);
    } else if (g.type === 'energy') {
      const I = this.emf / (this.Rcoil + R_LOAD);
      this.energy += this.emf * I * dt;
      this.goalProg = this.energy / g.joules;
      if (this.energy >= g.joules) this.finish();
      else if (this.playTime > g.time) {
        this.done = true;
        this.api.lose(T(`Time's up: only ${fmt(this.energy, 1)} J stored. Increase N and B — the emf grows with both (ε = −N ΔΦ/Δt).`,
          `انتهى الوقت: خُزّن ${fmt(this.energy, 1)} جول فقط. زِد N وB — فالقوة الدافعة تزداد بزيادتهما (ε = −N ΔΦ/Δt).`));
      }
    }
  }

  detectPulse(g) {
    const e = this.emf;
    if (this.rotating || this.rotCool > 0) { this.pulse = null; return; }   // turning the magnet is not part of the code
    if (!this.pulse) {
      if (Math.abs(e) > g.v) this.pulse = { sign: Math.sign(e) };
      return;
    }
    if (Math.abs(e) < g.v * .35) {
      const s = this.pulse.sign;
      this.pulse = null;
      this.lastPulses.push({ s, t: this.time });
      if (s === g.seq[this.seqIdx]) {
        this.seqIdx++;
        this.api.sfx('ding');
        this.goalProg = this.seqIdx / g.seq.length;
        if (this.seqIdx >= g.seq.length) this.finish();
      } else {
        this.seqIdx = s === g.seq[0] ? 1 : 0;
        this.goalProg = this.seqIdx / g.seq.length;
        this.api.sfx('bad');
        this.api.banner(T('Wrong direction — code reset', 'اتجاه خاطئ — أُعيدت الشيفرة'), true, 900);
      }
    }
  }

  updateGen(dt) {
    const L = this.lv;
    if (this.dragGen) {
      const d = this.crankDelta || 0;
      this.crankDelta = 0;
      this.th += d;
      this.omega += (d / dt - this.omega) * Math.min(1, dt * 8);
    } else if (this.turbine > 0) {
      this.omega += (this.turbine - this.omega) * Math.min(1, dt * 2);
      this.th += this.omega * dt;
    } else {
      this.omega *= Math.exp(-dt * .35);
      this.th += this.omega * dt;
    }
    const NBA = this.N * L.B * L.A;
    this.peak = NBA * Math.abs(this.omega);
    this.emf = NBA * this.omega * Math.sin(this.th);
    if (this.done) return;
    const g = L.goal;
    if (this.peak >= g.lo && this.peak <= g.hi) this.inBand += dt;
    else this.inBand = Math.max(0, this.inBand - dt * 2);
    this.goalProg = this.inBand / g.hold;
    if (this.peak > g.hi * 1.6 && !this.warned) { this.warned = true; this.api.banner(T('Too much voltage! Bulbs will burn — slow down.', 'جهد كبير جدًا! ستحترق المصابيح — أبطئ.'), true); }
    if (this.peak < g.hi) this.warned = false;
    if (this.inBand >= g.hold) this.finish();
  }

  finish() {
    if (this.done) return;
    this.done = true;
    this.goalProg = 1;
    this.fx.emit(820, 120, 40, { color: ['#ffe66d', '#2ed3a0', '#ff5d8f'], speed: 300, size: 5 });
    const p = this.lv.par, t = this.playTime;
    this.api.win(t <= p ? 3 : t <= p * 2 ? 2 : 1);
  }

  updateVars() {
    const I = this.emf / (this.Rcoil + R_LOAD);
    const rows = [{ sym: 'N', name: T('turns', 'عدد اللفات'), value: this.N }, { sym: 'B', name: T('magnetic field', 'المجال المغناطيسي'), value: fmt(this.B, 2), unit: 'T' }];
    if (this.lv.mode === 'slide') {
      rows.push(
        { sym: 'Φ', name: T('flux per turn', 'التدفق لكل لفة'), value: fmt(this.phi * 1000, 2), unit: 'mWb' },
        { sym: 'v', name: T('magnet speed', 'سرعة المغناطيس'), value: fmt(Math.abs(this.mv) / 1000, 2), unit: 'm/s' },
        { sym: 'ε', name: T('induced emf', 'القوة الدافعة الحثية'), value: fmt(this.emf, 2), unit: 'V', hl: true }
      );
    } else {
      rows.push(
        { sym: 'A', name: T('coil area', 'مساحة الملف'), value: fmt(this.lv.A, 2), unit: 'm²' },
        { sym: 'ω', name: T('angular speed', 'السرعة الزاوية'), value: fmt(this.omega, 1), unit: 'rad/s' },
        { sym: 'ε_max', name: 'N B A ω', value: fmt(this.peak, 2), unit: 'V', hl: true },
        { sym: 'ε', name: T('instant emf', 'القوة الدافعة اللحظية'), value: fmt(this.emf, 2), unit: 'V' }
      );
    }
    rows.push(
      { sym: 'I', name: T('current ε/R', 'التيار ε/R'), value: fmt(I, 3), unit: 'A' },
      { sym: 'P', name: T('power εI', 'القدرة εI'), value: fmt(this.emf * I, 2), unit: 'W' }
    );
    if (this.lv.goal.type === 'energy') rows.push({ sym: 'E', name: T('energy stored', 'الطاقة المخزنة'), value: `${fmt(this.energy, 1)} / ${this.lv.goal.joules}`, unit: 'J', hl: true });
    this.api.setVars(rows);
  }

  // ================= drawing =================
  draw(ctx) {
    ctx.fillStyle = '#232742'; ctx.fillRect(0, 0, W, 600);
    ctx.fillStyle = '#2b3052';
    for (let x = 0; x < W; x += 125) ctx.fillRect(x, 0, 60, 600);
    ctx.strokeStyle = '#3a4070'; ctx.lineWidth = 14;
    ctx.beginPath(); ctx.moveTo(0, 40); ctx.lineTo(W, 40); ctx.stroke();
    this.drawGear(ctx, 940, 60, 40, this.time * .5);
    this.drawGear(ctx, 880, 30, 24, -this.time * .8);
    ctx.fillStyle = '#1a1d33'; ctx.fillRect(0, 380, W, 220);

    if (this.lv.mode === 'slide') this.drawSlide(ctx); else this.drawGen(ctx);
    this.drawMeter(ctx, 140, 520);
    this.drawScope(ctx, 560, 400, 420, 180);
    this.drawGoal(ctx);
    this.fx.draw(ctx);
  }

  drawGear(ctx, x, y, r, a) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.fillStyle = '#3a4070';
    for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.fillRect(-r * .18, -r * 1.2, r * .36, r * .4); }
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
    ctx.fillStyle = '#232742'; ctx.beginPath(); ctx.arc(0, 0, r * .35, 0, 7); ctx.fill();
    ctx.restore();
  }

  drawSlide(ctx) {
    // rail
    ctx.fillStyle = '#4a5080'; ctx.fillRect(70, RAIL_Y + 30, 860, 8);
    // wires from coil to meter/load
    this.drawWire(ctx, [[COIL.x - COIL.len / 2 + 10, RAIL_Y + COIL.r], [COIL.x - COIL.len / 2 + 10, 340], [140, 340], [140, 440]]);
    this.drawWire(ctx, [[COIL.x + COIL.len / 2 - 10, RAIL_Y + COIL.r], [COIL.x + COIL.len / 2 - 10, 340], [400, 340], [400, 430]]);
    this.drawLoad(ctx, 400, 470);
    // coil back half
    const n = Math.round(clamp(this.N / 25, 3, 16));
    const x0 = COIL.x - COIL.len / 2;
    for (let i = 0; i < n; i++) {
      const x = x0 + (i + .5) * COIL.len / n;
      ctx.strokeStyle = '#a0612a'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.ellipse(x, RAIL_Y, 12, COIL.r, 0, Math.PI / 2, Math.PI * 1.5); ctx.stroke();
    }
    this.drawField(ctx);
    this.drawMagnet(ctx);
    for (let i = 0; i < n; i++) {
      const x = x0 + (i + .5) * COIL.len / n;
      ctx.strokeStyle = '#e8913a'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.ellipse(x, RAIL_Y, 12, COIL.r, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke();
    }
    label(ctx, `N = ${this.N}`, COIL.x, RAIL_Y - COIL.r - 18, { size: 15, color: '#ffd8a8' });
    // induced current arrow on coil
    if (Math.abs(this.emf) > .3) {
      const s = Math.sign(this.emf);
      arrow(ctx, COIL.x - 40 * s, RAIL_Y + COIL.r + 14, COIL.x + 40 * s, RAIL_Y + COIL.r + 14, '#ffe66d', 3);
      label(ctx, 'I', COIL.x, RAIL_Y + COIL.r + 30, { size: 13, color: '#ffe66d' });
    }
    if (this.lv.goal.type === 'seq') this.drawGate(ctx);
    drawRobot(ctx, 60, 372, 1, Math.min(1, Math.abs(this.emf) / 6));
  }

  drawField(ctx) {
    ctx.strokeStyle = Math.cos(this.rot) >= 0 ? 'rgba(255,93,143,.25)' : 'rgba(77,124,255,.3)';
    ctx.lineWidth = 2;
    for (let k = 1; k <= 3; k++) { ctx.beginPath(); ctx.ellipse(this.mx, RAIL_Y, 100 + k * 30, 18 + k * 22, this.rot, 0, 7); ctx.stroke(); }
  }

  // Bar magnet turned by this.rot: the red N half points along +x at rot = 0.
  drawMagnet(ctx) {
    const w = MAG_LEN, h = 44, x = this.mx;
    ctx.save();
    ctx.translate(x, RAIL_Y);
    ctx.rotate(this.rot);
    ctx.fillStyle = '#4d7cff'; roundRect(ctx, -w / 2, -h / 2, w / 2, h, 8); ctx.fill();
    ctx.fillStyle = '#ff4d6d'; roundRect(ctx, 0, -h / 2, w / 2, h, 8); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(-w / 2 + 6, -h / 2 + 5, w - 12, 5);
    ctx.restore();
    const cx = Math.cos(this.rot) * w / 4, cy = Math.sin(this.rot) * w / 4;
    label(ctx, 'N', x + cx, RAIL_Y + cy, { size: 22, color: '#fff', stroke: null });
    label(ctx, 'S', x - cx, RAIL_Y - cy, { size: 22, color: '#fff', stroke: null });
    if (!this.rotating) {
      label(ctx, T(`facing the coil: ${this.facing}`, `القطب المواجه للملف: ${this.facing}`), x, RAIL_Y - 52, { size: 15, color: this.facing === 'N' ? '#ff8fa3' : '#8fb0ff' });
    }
  }

  drawWire(ctx, pts) {
    ctx.strokeStyle = '#c47a35'; ctx.lineWidth = 4; ctx.lineJoin = 'round';
    ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
    // moving charges
    let total = 0;
    const segs = pts.slice(1).map((p, i) => { const l = Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]); total += l; return l; });
    ctx.fillStyle = '#ffe66d';
    const off = ((this.phase * 40) % 30 + 30) % 30;
    for (let d = off; d < total; d += 30) {
      let acc = 0;
      for (let i = 0; i < segs.length; i++) {
        if (d <= acc + segs[i]) {
          const t = (d - acc) / segs[i];
          ctx.globalAlpha = clamp(Math.abs(this.emf) / 3, 0, 1);
          ctx.beginPath(); ctx.arc(pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t, 3, 0, 7); ctx.fill();
          break;
        }
        acc += segs[i];
      }
    }
    ctx.globalAlpha = 1;
  }

  drawLoad(ctx, x, y) {
    const I = this.emf / (this.Rcoil + R_LOAD);
    const P = Math.abs(this.emf * I);
    if (this.lv.goal.type === 'energy') {
      ctx.fillStyle = '#e0e7ff'; roundRect(ctx, x - 40, y - 34, 80, 68, 8); ctx.fill();
      ctx.fillStyle = '#8a95bd'; ctx.fillRect(x - 10, y - 42, 20, 8);
      const f = clamp(this.energy / this.lv.goal.joules, 0, 1);
      ctx.fillStyle = f >= 1 ? '#2ed3a0' : '#ffd23f';
      ctx.fillRect(x - 32, y + 26 - 52 * f, 64, 52 * f);
      label(ctx, `${Math.round(f * 100)}%`, x, y, { size: 16 });
      return;
    }
    const glow = clamp(P / 4, 0, 1);
    if (glow > .02) {
      const g = ctx.createRadialGradient(x, y, 4, x, y, 90);
      g.addColorStop(0, `rgba(255,230,109,${.8 * glow})`); g.addColorStop(1, 'rgba(255,230,109,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 90, 0, 7); ctx.fill();
    }
    ctx.fillStyle = glow > .05 ? `rgb(255,${200 + 55 * glow},${110 + 100 * glow})` : '#d8dbe8';
    ctx.beginPath(); ctx.arc(x, y - 6, 26, 0, 7); ctx.fill();
    ctx.fillStyle = '#8a95bd'; ctx.fillRect(x - 13, y + 16, 26, 16);
    ctx.strokeStyle = '#a0612a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 8, y + 14); ctx.lineTo(x - 4, y - 10); ctx.lineTo(x + 4, y - 10); ctx.lineTo(x + 8, y + 14); ctx.stroke();
  }

  drawMeter(ctx, x, y) {
    const scale = this.lv.mode === 'gen' ? 20 : (this.lv.goal.v || 6) * 2;
    ctx.fillStyle = '#f5f3ff';
    ctx.beginPath(); ctx.arc(x, y, 92, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#241a4f'; ctx.lineWidth = 3; ctx.stroke();
    ctx.lineWidth = 2;
    for (let i = -4; i <= 4; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 12;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 70, y + Math.sin(a) * 70); ctx.lineTo(x + Math.cos(a) * 84, y + Math.sin(a) * 84); ctx.stroke();
    }
    label(ctx, '0', x, y - 54, { size: 12, color: '#241a4f', stroke: null });
    label(ctx, `−${scale}`, x - 64, y - 26, { size: 11, color: '#241a4f', stroke: null });
    label(ctx, `+${scale}`, x + 64, y - 26, { size: 11, color: '#241a4f', stroke: null });
    const a = -Math.PI / 2 + clamp(this.emf / scale, -1.15, 1.15) * Math.PI / 3;
    ctx.strokeStyle = '#e63946'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 80, y + Math.sin(a) * 80); ctx.stroke();
    ctx.fillStyle = '#241a4f'; ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fill();
    label(ctx, `ε = ${fmt(this.emf, 1)} V`, x, y + 22, { size: 15, color: '#ffe66d' });
  }

  drawScope(ctx, x, y, w, h) {
    ctx.fillStyle = '#0d1b12'; roundRect(ctx, x, y, w, h, 10); ctx.fill();
    ctx.strokeStyle = '#1f3d29'; ctx.lineWidth = 1;
    for (let i = 1; i < 8; i++) { ctx.beginPath(); ctx.moveTo(x + i * w / 8, y); ctx.lineTo(x + i * w / 8, y + h); ctx.stroke(); }
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x, y + i * h / 4); ctx.lineTo(x + w, y + i * h / 4); ctx.stroke(); }
    const scale = this.lv.mode === 'gen' ? 16 : (this.lv.goal.v || 6) * 1.6;
    if (this.lv.goal.type === 'band') {
      ctx.fillStyle = 'rgba(46,211,160,.18)';
      for (const sgn of [1, -1]) {
        const a = y + h / 2 - sgn * this.lv.goal.hi / scale * h / 2, b = y + h / 2 - sgn * this.lv.goal.lo / scale * h / 2;
        ctx.fillRect(x, Math.min(a, b), w, Math.abs(b - a));
      }
    } else if (this.lv.goal.v) {
      ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(255,230,109,.6)';
      for (const sgn of [1, -1]) { const yy = y + h / 2 - sgn * this.lv.goal.v / scale * h / 2; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke(); }
      ctx.setLineDash([]);
    }
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.strokeStyle = '#39ff88'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    this.hist.forEach((v, i) => {
      const px = x + i / (this.hist.length - 1) * w, py = y + h / 2 - clamp(v / scale, -1.1, 1.1) * h / 2;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    });
    ctx.stroke();
    ctx.restore();
    label(ctx, T('Oscilloscope: ε(t)', 'راسم الذبذبات: ε(t)'), x + 90, y + 14, { size: 12, color: '#39ff88', stroke: null });
  }

  drawGate(ctx) {
    const g = this.lv.goal;
    const x = 850, y = 120;
    ctx.fillStyle = '#3a4070'; roundRect(ctx, x - 70, y - 50, 140, 100, 14); ctx.fill();
    g.seq.forEach((s, i) => {
      const cx = x - 40 + i * 40;
      ctx.fillStyle = i < this.seqIdx ? '#2ed3a0' : '#1a1d33';
      ctx.beginPath(); ctx.arc(cx, y, 16, 0, 7); ctx.fill();
      label(ctx, s > 0 ? '→' : '←', cx, y, { size: 20, color: '#fff', stroke: null });
    });
    label(ctx, T('needle code', 'شيفرة المؤشر'), x, y + 34, { size: 12, color: '#c8cdf0', stroke: null });
  }

  drawGoal(ctx) {
    const g = this.lv.goal;
    let text = '';
    if (g.type === 'peak') text = T(`Goal: |ε| ≥ ${g.v} V`, `الهدف: |ε| ≥ ${g.v} فولت`);
    if (g.type === 'seq') text = T('Goal: match the needle code', 'الهدف: طابق شيفرة المؤشر');
    if (g.type === 'energy') text = T(`Goal: ${g.joules} J  •  ⏱ ${Math.max(0, Math.ceil(g.time - this.playTime))} s`, `الهدف: ${g.joules} جول  •  ⏱ ${Math.max(0, Math.ceil(g.time - this.playTime))} ث`);
    if (g.type === 'band') text = T(`Goal: ${g.lo} V ≤ ε_max ≤ ${g.hi} V for ${g.hold} s`, `الهدف: ${g.lo} ≤ ε_max ≤ ${g.hi} فولت لمدة ${g.hold} ث`);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; roundRect(ctx, 14, 14, 360, 52, 12); ctx.fill();
    label(ctx, text, 194, 32, { size: 15, stroke: null });
    ctx.fillStyle = '#1a1d33'; roundRect(ctx, 30, 46, 328, 10, 5); ctx.fill();
    ctx.fillStyle = '#2ed3a0'; roundRect(ctx, 30, 46, 328 * clamp(this.goalProg, 0, 1), 10, 5); ctx.fill();
  }

  drawGen(ctx) {
    const L = this.lv, w = this.wheel;
    // magnet poles
    ctx.fillStyle = '#ff4d6d'; roundRect(ctx, 400, 110, 90, 240, 14); ctx.fill();
    ctx.fillStyle = '#4d7cff'; roundRect(ctx, 750, 110, 90, 240, 14); ctx.fill();
    label(ctx, 'N', 445, 230, { size: 40, stroke: null });
    label(ctx, 'S', 795, 230, { size: 40, stroke: null });
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2;
    for (let y = 140; y <= 320; y += 30) arrow(ctx, 500, y, 740, y, 'rgba(255,255,255,.2)', 2, 8);
    label(ctx, `B = ${L.B} T`, 620, 96, { size: 15, color: '#ffd8a8' });
    // rotating coil (projected)
    const cw = 160 * Math.cos(this.th), cx = 620;
    ctx.strokeStyle = Math.cos(this.th) > 0 ? '#e8913a' : '#a0612a';
    ctx.lineWidth = 8;
    ctx.strokeRect(cx - Math.abs(cw) / 2, 150, Math.max(4, Math.abs(cw)), 160);
    ctx.fillStyle = 'rgba(232,145,58,.15)'; ctx.fillRect(cx - Math.abs(cw) / 2, 150, Math.abs(cw), 160);
    label(ctx, `N = ${this.N}`, cx, 136, { size: 14, color: '#ffd8a8' });
    // axle + belt
    ctx.strokeStyle = '#8a95bd'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(cx, 310); ctx.lineTo(cx, 360); ctx.stroke();
    ctx.strokeStyle = '#555c88'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(w.x, w.y - w.r + 20); ctx.lineTo(cx, 350); ctx.moveTo(w.x, w.y + 20); ctx.lineTo(cx, 368); ctx.stroke();
    // crank wheel
    ctx.save(); ctx.translate(w.x, w.y); ctx.rotate(this.th);
    ctx.fillStyle = '#4a5080'; ctx.beginPath(); ctx.arc(0, 0, w.r, 0, 7); ctx.fill();
    ctx.strokeStyle = '#8a95bd'; ctx.lineWidth = 6;
    for (let i = 0; i < 6; i++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w.r - 8, 0); ctx.stroke(); }
    ctx.fillStyle = '#ffc93c'; ctx.beginPath(); ctx.arc(w.r - 14, 0, 13, 0, 7); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#e0e7ff'; ctx.beginPath(); ctx.arc(w.x, w.y, 12, 0, 7); ctx.fill();
    label(ctx, `ω = ${fmt(this.omega, 1)} rad/s`, w.x, w.y + w.r + 22, { size: 15 });
    if (this.turbine > 0 && !this.dragGen) label(ctx, '💧 ' + T('turbine', 'توربين'), w.x, w.y - w.r - 18, { size: 14 });
    // city
    const ok = this.peak >= L.goal.lo && this.peak <= L.goal.hi;
    const over = this.peak > L.goal.hi;
    for (let i = 0; i < 4; i++) {
      const hx = 870 + (i % 2) * 60, hy = 160 + Math.floor(i / 2) * 110;
      ctx.fillStyle = '#2f3f73'; ctx.fillRect(hx - 22, hy - 30, 44, 50);
      ctx.beginPath(); ctx.moveTo(hx - 28, hy - 30); ctx.lineTo(hx, hy - 52); ctx.lineTo(hx + 28, hy - 30); ctx.fill();
      const lit = clamp(this.peak / L.goal.lo, 0, 1);
      ctx.fillStyle = over && Math.sin(this.time * 30) > 0 ? '#ff6b6b' : `rgba(255,214,63,${.15 + .85 * lit * (ok || over ? 1 : .6)})`;
      ctx.fillRect(hx - 10, hy - 18, 20, 18);
    }
    this.drawLoadGen(ctx);
  }

  drawLoadGen(ctx) {
    ctx.fillStyle = 'rgba(255,255,255,.1)';
    roundRect(ctx, 400, 380, 140, 30, 10); ctx.fill();
    label(ctx, T(`in band: ${fmt(this.inBand, 1)} s`, `داخل النطاق: ${fmt(this.inBand, 1)} ث`), 470, 395, { size: 13 });
  }
}

export default {
  id: 'magnet',
  levels: LEVELS,
  quiz: QUIZ,
  formulas: [
    { expr: 'ε = −N ΔΦ / Δt', label: { en: "Faraday's law", ar: 'قانون فاراداي' } },
    { expr: 'Φ = B A cosθ', label: { en: 'Magnetic flux', ar: 'التدفق المغناطيسي' } },
    { expr: 'I = ε / R', label: { en: 'Induced current', ar: 'التيار الحثي' } },
    { expr: 'P = ε I', label: { en: 'Electric power', ar: 'القدرة الكهربائية' } },
    { expr: 'ε = N B A ω sin(ωt)', label: { en: 'AC generator', ar: 'مولّد التيار المتردد' } }
  ],
  terms: [
    { en: 'Electromagnetic induction', ar: 'الحث الكهرومغناطيسي' }, { en: 'Magnetic flux', ar: 'التدفق المغناطيسي' },
    { en: 'Induced emf', ar: 'القوة الدافعة الحثية' }, { en: "Lenz's law", ar: 'قانون لنز' }, { en: 'Galvanometer', ar: 'الجلفانومتر' },
    { en: 'Generator', ar: 'المولّد' }, { en: 'Weber (Wb)', ar: 'الويبر' }, { en: 'Tesla (T)', ar: 'التسلا' }
  ],
  tutorial: [
    { en: 'Drag the bar magnet along the rail into and out of the copper coil.', ar: 'اسحب المغناطيس على السكة لإدخاله في الملف النحاسي وإخراجه منه.' },
    { en: 'The galvanometer needle and the oscilloscope show the induced emf ε. Faster motion = bigger ε.', ar: 'مؤشر الجلفانومتر وراسم الذبذبات يبيّنان القوة الدافعة الحثية ε. حركة أسرع = ε أكبر.' },
    { en: 'Tap the magnet (or use the N / S buttons) to turn it and choose which pole faces the coil. Only that pole can enter the coil.', ar: 'اضغط على المغناطيس (أو زرّي N / S) لتدويره واختيار القطب المواجه للملف. هذا القطب وحده يدخل الملف.' },
    { en: 'Pushing in and pulling out swing the needle in opposite directions, and the S pole gives the opposite swing to the N pole.', ar: 'الإدخال والإخراج يحرّكان المؤشر في اتجاهين متعاكسين، والقطب S يعطي عكس ما يعطيه القطب N.' },
    { en: 'In the generator level, spin the crank wheel (or use the turbine slider) to control ω.', ar: 'في مرحلة المولّد، أدر عجلة الذراع (أو استخدم منزلق التوربين) للتحكم في ω.' },
    { en: 'Finish quickly for 3 stars!', ar: 'أنهِ بسرعة لتحصل على 3 نجوم!' }
  ],
  create: (api, i) => new MagnetGame(api, i)
};
