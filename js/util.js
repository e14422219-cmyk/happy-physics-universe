export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
export const deg = r => r * 180 / Math.PI;
export const rad = d => d * Math.PI / 180;
export const rand = (a, b) => a + Math.random() * (b - a);

// Format a number with a fixed count of decimals, trimming "-0".
export function fmt(v, d = 1) {
  if (!isFinite(v)) return '∞';
  const s = v.toFixed(d);
  return s === (-0).toFixed(d) ? (0).toFixed(d) : s;
}

export function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function arrow(ctx, x1, y1, x2, y2, color, width = 3, head = 9) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 2) return;
  ctx.save();
  ctx.strokeStyle = ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - Math.cos(a) * head * .6, y2 - Math.sin(a) * head * .6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(a - .45) * head, y2 - Math.sin(a - .45) * head);
  ctx.lineTo(x2 - Math.cos(a + .45) * head, y2 - Math.sin(a + .45) * head);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Text with a soft outline, readable on any background.
export function label(ctx, text, x, y, { size = 16, color = '#fff', stroke = 'rgba(20,10,60,.75)', align = 'center', base = 'middle', weight = 800 } = {}) {
  ctx.save();
  ctx.font = `${weight} ${size}px 'Baloo Bhaijaan 2', 'Segoe UI', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = base;
  ctx.direction = /[؀-ۿ]/.test(text) ? 'rtl' : 'ltr';
  ctx.lineJoin = 'round';
  if (stroke) {
    ctx.lineWidth = Math.max(3, size / 4);
    ctx.strokeStyle = stroke;
    ctx.strokeText(text, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export class Particles {
  constructor() { this.list = []; }
  emit(x, y, n, { color = '#fff', speed = 200, life = .8, size = 5, gravity = 400, spread = Math.PI * 2, dir = 0, shape = 'circle' } = {}) {
    for (let i = 0; i < n; i++) {
      const a = dir + (Math.random() - .5) * spread;
      const s = speed * (.3 + Math.random() * .7);
      this.list.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: life,
        size: size * (.5 + Math.random() * .7), color: Array.isArray(color) ? color[i % color.length] : color,
        gravity, shape, rot: Math.random() * 6, vr: (Math.random() - .5) * 10
      });
    }
  }
  update(dt) {
    for (const p of this.list) {
      p.life -= dt;
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
    }
    this.list = this.list.filter(p => p.life > 0);
  }
  draw(ctx) {
    for (const p of this.list) {
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.color;
      if (p.shape === 'square') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
}

// Shortest distance from point to segment, plus closest point.
export function closestOnSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const l2 = dx * dx + dy * dy || 1;
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1);
  const x = ax + dx * t, y = ay + dy * t;
  return { x, y, t, d: Math.hypot(px - x, py - y) };
}

export function starsByAttempt(attempt) {
  return attempt <= 1 ? 3 : attempt === 2 ? 2 : 1;
}
