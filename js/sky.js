// Twinkling star field with the odd shooting star, drawn behind every screen.
// Paused while a game runs (that screen paints its own world) and when the tab is hidden.
export function startSky(canvas) {
  const ctx = canvas.getContext('2d');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let stars = [], shoot = null, nextShoot = 2, w = 0, h = 0, dpr = 1, last = performance.now(), paused = false;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const n = Math.min(220, Math.round(w * h / 6000));
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() < .12 ? 1.6 + Math.random() * 1.2 : .5 + Math.random() * .9,
      ph: Math.random() * 6.28, sp: .6 + Math.random() * 2,
      hue: [0, 0, 0, 200, 300, 45][Math.floor(Math.random() * 6)]
    }));
    draw(0);
  }

  function draw(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      const a = still ? .8 : .35 + .65 * Math.abs(Math.sin(t * s.sp + s.ph));
      ctx.globalAlpha = a;
      ctx.fillStyle = s.hue ? `hsl(${s.hue} 100% 85%)` : '#fff';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
      if (s.r > 1.5) {   // little sparkle cross on the bright ones
        ctx.globalAlpha = a * .5;
        ctx.fillRect(s.x - s.r * 3, s.y - .4, s.r * 6, .8);
        ctx.fillRect(s.x - .4, s.y - s.r * 3, .8, s.r * 6);
      }
    }
    if (shoot) {
      const g = ctx.createLinearGradient(shoot.x, shoot.y, shoot.x - shoot.vx * .12, shoot.y - shoot.vy * .12);
      g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalAlpha = Math.min(1, shoot.life * 2);
      ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(shoot.x, shoot.y); ctx.lineTo(shoot.x - shoot.vx * .12, shoot.y - shoot.vy * .12); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000);
    last = now;
    if (!paused && !document.hidden) {
      nextShoot -= dt;
      if (!shoot && nextShoot <= 0) {
        const fromLeft = Math.random() < .5;
        shoot = { x: fromLeft ? Math.random() * w * .5 : w * .5 + Math.random() * w * .5, y: Math.random() * h * .35, vx: (fromLeft ? 1 : -1) * (700 + Math.random() * 300), vy: 260 + Math.random() * 140, life: .9 };
        nextShoot = 4 + Math.random() * 6;
      }
      if (shoot) { shoot.x += shoot.vx * dt; shoot.y += shoot.vy * dt; shoot.life -= dt; if (shoot.life <= 0) shoot = null; }
      draw(now / 1000);
    }
    requestAnimationFrame(frame);
  }

  addEventListener('resize', resize);
  resize();
  if (!still) requestAnimationFrame(frame);
  return { pause(v) { paused = v; } };
}
