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
    cancelAnimationFrame(this.raf);
    this.scene?.destroy?.();
    this.scene = null;
  }

  frame(dt) {
    const { ctx, scene } = this;
    if (!scene) return;
    scene.update(dt);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const cw = this.canvas.width, ch = this.canvas.height, mid = (this.oy + H * this.scale / 2) * this.dpr;
    ctx.fillStyle = scene.letterbox || '#1b1446';
    ctx.fillRect(0, 0, cw, mid);
    ctx.fillStyle = scene.letterboxBottom || scene.letterbox || '#1b1446';
    ctx.fillRect(0, mid, cw, ch - mid);
    const s = this.scale * this.dpr;
    ctx.setTransform(s, 0, 0, s, this.ox * this.dpr, this.oy * this.dpr);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.clip();
    scene.draw(ctx);
    if (this.intro > 0) {
      // ease the scene in from dark at the start of every level
      ctx.fillStyle = `rgba(27,20,70,${this.intro * this.intro})`;
      ctx.fillRect(0, 0, W, H);
      this.intro = Math.max(0, this.intro - dt * 2.2);
    }
    ctx.restore();
  }
}
