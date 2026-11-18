// Canvas stage: fixed 1000x600 world, scaled to fit, pointer + keyboard input.
export const W = 1000;
export const H = 600;

export class Stage {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scene = null;
    this.raf = 0;
    this.last = 0;
    this.scale = 1; this.ox = 0; this.oy = 0; this.dpr = 1;
    this.pointerId = null;
    // "juice": screen shake, particles, flashes and short slow motion
    this.shakeT = 0; this.shakeDur = 0; this.shakeAmp = 0;
    this.parts = [];
    this.flashA = 0; this.flashColor = '#fff';
    this.slowT = 0;

    if (window.ResizeObserver) new ResizeObserver(() => this.resize()).observe(canvas.parentElement);
    else window.addEventListener('resize', () => this.resize());

    canvas.addEventListener('pointerdown', e => {
      canvas.focus({ preventScroll: true });
      this.pointerId = e.pointerId;
      canvas.setPointerCapture?.(e.pointerId);
      this.scene?.down?.(this.toWorld(e));
    });
    canvas.addEventListener('pointermove', e => this.scene?.move?.(this.toWorld(e), this.pointerId != null));
    const up = e => {
      if (this.pointerId == null) return;
      this.pointerId = null;
      this.scene?.up?.(this.toWorld(e));
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', e => {
      if (this.scene?.wheel) { e.preventDefault(); this.scene.wheel(this.toWorld(e), Math.sign(e.deltaY)); }
    }, { passive: false });
    window.addEventListener('keydown', e => {
      if (!this.scene || document.querySelector('.modal-back')) return;
      if (e.target.matches?.('input, textarea, select')) return;
      if (this.scene.key?.(e)) e.preventDefault();
    });
  }

  resize() {
    const r = this.canvas.parentElement.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(r.width * this.dpr);
    this.canvas.height = Math.round(r.height * this.dpr);
    this.scale = Math.min(r.width / W, r.height / H);
    this.ox = (r.width - W * this.scale) / 2;
    this.oy = (r.height - H * this.scale) / 2;
  }

  toWorld(e) {
    const r = this.canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left - this.ox) / this.scale, y: (e.clientY - r.top - this.oy) / this.scale };
  }

  start(scene) {
    this.stop();
    this.scene = scene;
    this.intro = 1;
    this.resize();
    this.last = performance.now();
    const loop = now => {
      const dt = Math.min(.033, (now - this.last) / 1000);
      this.last = now;
      this.frame(dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.parts = []; this.shakeT = 0; this.flashA = 0; this.slowT = 0;
    cancelAnimationFrame(this.raf);
    this.scene?.destroy?.();
    this.scene = null;
  }

  // ---- juice helpers (all in world units, 1000×600) ----
  shake(amp = 8, dur = .35) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (amp >= this.shakeAmp * (this.shakeT / (this.shakeDur || 1))) { this.shakeAmp = amp; this.shakeDur = dur; this.shakeT = dur; }
  }
  burst(x, y, { n = 24, colors = ['#ffd36b', '#ff4fd8', '#3ef0ff', '#7bff9e', '#ffffff'], speed = 380, gravity = 520, life = 1.1, size = 6, shape = 'mix' } = {}) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = speed * (.35 + Math.random() * .65);
      this.parts.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * .25, g: gravity, life, t: life,
        r: size * (.6 + Math.random() * .8), c: colors[i % colors.length], rot: Math.random() * 6, vr: (Math.random() - .5) * 12,
        shape: shape === 'mix' ? (i % 3 === 0 ? 'star' : i % 3 === 1 ? 'rect' : 'dot') : shape
      });
    }
    if (this.parts.length > 400) this.parts.splice(0, this.parts.length - 400);
  }
  confetti() {
    for (let i = 0; i < 6; i++) this.burst(120 + i * 152, -10, { n: 14, speed: 260, gravity: 420, life: 1.6, size: 7 });
  }
  flash(color = '#fff', a = .5) { this.flashColor = color; this.flashA = a; }
  slowmo(t = .5) { this.slowT = Math.max(this.slowT, t); }

  updateJuice(dt) {
    if (this.shakeT > 0) this.shakeT = Math.max(0, this.shakeT - dt);
    if (this.flashA > 0) this.flashA = Math.max(0, this.flashA - dt * 2.2);
    if (this.slowT > 0) this.slowT = Math.max(0, this.slowT - dt);
    for (const p of this.parts) { p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.t -= dt; }
    this.parts = this.parts.filter(p => p.t > 0 && p.y < H + 40);
  }

  drawJuice(ctx) {
    for (const p of this.parts) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, p.t / p.life * 1.6);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      if (p.shape === 'rect') ctx.fillRect(-p.r, -p.r * .45, p.r * 2, p.r * .9);
      else if (p.shape === 'star') {
        ctx.beginPath();
        for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? p.r * .45 : p.r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
        ctx.closePath(); ctx.fill();
      } else { ctx.beginPath(); ctx.arc(0, 0, p.r * .7, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    if (this.flashA > 0) {
      ctx.globalAlpha = this.flashA;
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
  }

  frame(dt) {
    const { ctx, scene } = this;
    if (!scene) return;
    this.updateJuice(dt);
    // teacher mode: pause or slow motion; "juice" slow motion for dramatic moments
    if (!this.paused) scene.update(dt * (this.speed || 1) * (this.slowT > 0 ? .3 : 1));
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const cw = this.canvas.width, ch = this.canvas.height, mid = (this.oy + H * this.scale / 2) * this.dpr;
    ctx.fillStyle = scene.letterbox || '#1b1446';
    ctx.fillRect(0, 0, cw, mid);
    ctx.fillStyle = scene.letterboxBottom || scene.letterbox || '#1b1446';
    ctx.fillRect(0, mid, cw, ch - mid);
    const s = this.scale * this.dpr;
    let sx = 0, sy = 0;
    if (this.shakeT > 0) {
      const k = this.shakeAmp * (this.shakeT / this.shakeDur);
      sx = (Math.random() * 2 - 1) * k * s; sy = (Math.random() * 2 - 1) * k * s;
    }
    ctx.setTransform(s, 0, 0, s, this.ox * this.dpr + sx, this.oy * this.dpr + sy);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.clip();
    scene.draw(ctx);
    this.drawJuice(ctx);
    if (this.intro > 0) {
      // ease the scene in from dark at the start of every level
      ctx.fillStyle = `rgba(27,20,70,${this.intro * this.intro})`;
      ctx.fillRect(0, 0, W, H);
      this.intro = Math.max(0, this.intro - dt * 2.2);
    }
    ctx.restore();
  }
}
