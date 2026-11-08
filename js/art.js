// Original artwork: SVG card illustrations + canvas character drawings.
import { CRYSTAL_COLORS } from './config.js';

// ---------- SVG ----------
export function crystalSVG(color, cls = 'crystal') {
  return `<svg class="${cls}" viewBox="0 0 40 52" aria-hidden="true">
    <polygon points="20,2 36,16 20,50 4,16" fill="${color}" stroke="#fff" stroke-width="2"/>
    <polygon points="20,2 27,16 20,50 13,16" fill="#fff" opacity=".35"/>
    <polygon points="4,16 36,16 20,2" fill="#fff" opacity=".25"/></svg>`;
}

export function owlSVG(cls = 'guide') {
  return `<svg class="${cls}" viewBox="0 0 120 120" aria-hidden="true">
    <ellipse cx="60" cy="112" rx="34" ry="6" fill="#000" opacity=".15"/>
    <path d="M24 70 Q20 30 60 22 Q100 30 96 70 Q96 106 60 108 Q24 106 24 70Z" fill="#8c6cff"/>
    <path d="M38 80 Q60 66 82 80 Q80 104 60 104 Q40 104 38 80Z" fill="#d9ccff"/>
    <path d="M30 30 L40 14 L48 28Z M90 30 L80 14 L72 28Z" fill="#6a4cd8"/>
    <circle cx="44" cy="54" r="17" fill="#fff"/><circle cx="76" cy="54" r="17" fill="#fff"/>
    <circle cx="46" cy="55" r="8" fill="#241a4f"/><circle cx="74" cy="55" r="8" fill="#241a4f"/>
    <circle cx="49" cy="52" r="3" fill="#fff"/><circle cx="77" cy="52" r="3" fill="#fff"/>
    <circle cx="44" cy="54" r="19" fill="none" stroke="#ffc93c" stroke-width="4"/>
    <circle cx="76" cy="54" r="19" fill="none" stroke="#ffc93c" stroke-width="4"/>
    <line x1="63" y1="54" x2="57" y2="54" stroke="#ffc93c" stroke-width="4"/>
    <path d="M55 66 L65 66 L60 75Z" fill="#ff9f1c"/>
    <path d="M30 22 L90 22 L84 12 L36 12Z" fill="#241a4f"/><rect x="56" y="4" width="8" height="10" fill="#241a4f"/>
  </svg>`;
}

export function logoSVG() {
  return `<svg class="logo-mark" viewBox="0 0 60 60" aria-hidden="true">
    <circle cx="30" cy="30" r="26" fill="#ffc93c"/>
    <ellipse cx="30" cy="30" rx="28" ry="10" fill="none" stroke="#fff" stroke-width="3" transform="rotate(-25 30 30)"/>
    <circle cx="30" cy="30" r="12" fill="#ff6b6b"/>
    <circle cx="26" cy="27" r="3" fill="#fff"/><circle cx="34" cy="27" r="3" fill="#fff"/>
    <path d="M24 34 Q30 39 36 34" stroke="#241a4f" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <circle cx="53" cy="19" r="4" fill="#2ed3a0"/>
  </svg>`;
}

const ART = {
  bird: `<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice">
    <defs><linearGradient id="bsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#64c7ff"/><stop offset="1" stop-color="#cdf0ff"/></linearGradient></defs>
    <rect width="320" height="200" fill="url(#bsky)"/>
    <circle cx="270" cy="38" r="20" fill="#ffe27a"/>
    <ellipse cx="80" cy="40" rx="30" ry="10" fill="#fff" opacity=".9"/><ellipse cx="200" cy="60" rx="24" ry="8" fill="#fff" opacity=".8"/>
    <path d="M0 160 Q80 130 160 155 T320 150 V200 H0Z" fill="#7bd36b"/>
    <path d="M0 175 Q100 160 200 178 T320 172 V200 H0Z" fill="#4fb35a"/>
    <path d="M40 80 Q120 10 210 110" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="2 8" stroke-linecap="round"/>
    <rect x="44" y="120" width="8" height="40" rx="3" fill="#8b5a2b"/><path d="M48 124 L36 104 M48 124 L60 104" stroke="#8b5a2b" stroke-width="7" stroke-linecap="round"/>
    <g transform="translate(150 50) rotate(15)"><circle r="16" fill="#ff9f1c"/><circle cx="6" cy="-4" r="5" fill="#fff"/><circle cx="7" cy="-4" r="2.4" fill="#241a4f"/><path d="M14 0 L24 4 L14 7Z" fill="#ffc93c"/><path d="M-6 -12 Q0 -24 6 -14" fill="#ff6b6b"/><rect x="-2" y="-9" width="14" height="5" rx="2" fill="#241a4f" opacity=".6"/></g>
    <rect x="215" y="115" width="14" height="45" fill="#c98a4b"/><rect x="250" y="115" width="14" height="45" fill="#c98a4b"/><rect x="208" y="105" width="64" height="12" fill="#a66f38"/>
    <g transform="translate(240 92)"><circle r="13" fill="#7a4fd1"/><circle cx="0" cy="-2" r="5" fill="#fff"/><circle cy="-2" r="2.5" fill="#241a4f"/></g>
    <g transform="translate(240 148)"><circle r="11" fill="#7a4fd1"/><circle cy="-2" r="4" fill="#fff"/><circle cy="-2" r="2" fill="#241a4f"/></g>
    <text x="20" y="190" font-size="15" font-weight="800" fill="#1d4d20" font-family="serif">R = v₀² sin2θ / g</text>
  </svg>`,
  water: `<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice">
    <rect width="320" height="200" fill="#5e4b8b"/>
    <g fill="#6d5a9c">${Array.from({ length: 24 }, (_, i) => `<rect x="${(i % 8) * 40 + (Math.floor(i / 8) % 2) * 20}" y="${Math.floor(i / 8) * 26}" width="38" height="24" rx="3"/>`).join('')}</g>
    <rect x="30" y="20" width="90" height="70" fill="#d6ecff" opacity=".3" stroke="#e8e0ff" stroke-width="5"/>
    <rect x="33" y="40" width="84" height="47" fill="#2ec4f1"/>
    <rect x="200" y="20" width="90" height="70" fill="#d6ecff" opacity=".3" stroke="#e8e0ff" stroke-width="5"/>
    <rect x="203" y="48" width="84" height="39" fill="#e39b12"/><rect x="203" y="48" width="84" height="3" fill="#ffd66b"/>
    <path d="M220 60 q4 6 0 12 M262 58 q4 6 0 12" stroke="#ffd66b" stroke-width="2" fill="none" opacity=".7"/>
    <rect x="70" y="110" width="180" height="85" fill="#d6ecff" opacity=".3" stroke="#e8e0ff" stroke-width="5"/>
    <rect x="73" y="150" width="174" height="42" fill="#2ec4f1" opacity=".85"/>
    <rect x="70" y="88" width="20" height="10" fill="#cfc4f3"/><rect x="88" y="91" width="18" height="5" fill="#cfc4f3"/>
    <g transform="translate(112 93)"><circle r="9" fill="none" stroke="#2ed3a0" stroke-width="3.5"/><path d="M-9 0H9M0-9V9" stroke="#2ed3a0" stroke-width="2.5"/></g>
    <rect x="235" y="88" width="20" height="10" fill="#cfc4f3"/><rect x="214" y="91" width="22" height="5" fill="#cfc4f3"/>
    <g transform="translate(208 93) rotate(45)"><circle r="9" fill="none" stroke="#e63946" stroke-width="3.5"/><path d="M-9 0H9M0-9V9" stroke="#e63946" stroke-width="2.5"/></g>
    <path d="M80 98 V150" stroke="#2ec4f1" stroke-width="5"/>
    <rect x="125" y="142" width="70" height="10" rx="3" fill="#a66f38"/>
    <g transform="translate(160 118)"><circle r="14" fill="#ffd6a5"/><path d="M-12 -10 L-12 -24 L-6 -16 L0 -26 L6 -16 L12 -24 L12 -10Z" fill="#ffc93c"/><circle cx="-5" cy="-1" r="2.4" fill="#241a4f"/><circle cx="5" cy="-1" r="2.4" fill="#241a4f"/><path d="M-5 6 Q0 10 5 6" stroke="#241a4f" stroke-width="2" fill="none"/></g>
    <text x="96" y="186" font-size="16" font-weight="800" fill="#fff" font-family="serif">P = ρgh</text>
  </svg>`,
  magnet: `<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice">
    <rect width="320" height="200" fill="#2b2f4a"/>
    <rect x="0" y="160" width="320" height="40" fill="#3c4266"/>
    <g fill="none" stroke="#ff5d8f" stroke-width="2" opacity=".45"><ellipse cx="110" cy="100" rx="90" ry="40"/><ellipse cx="110" cy="100" rx="60" ry="24"/></g>
    <rect x="40" y="86" width="44" height="28" fill="#ff4d6d"/><rect x="84" y="86" width="44" height="28" fill="#4d7cff"/>
    <text x="55" y="106" font-size="18" font-weight="800" fill="#fff">N</text><text x="99" y="106" font-size="18" font-weight="800" fill="#fff">S</text>
    ${Array.from({ length: 9 }, (_, i) => `<ellipse cx="${170 + i * 9}" cy="100" rx="6" ry="30" fill="none" stroke="#f0a64a" stroke-width="5"/>`).join('')}
    <path d="M250 70 L280 70 L280 40" stroke="#f0a64a" stroke-width="3" fill="none"/>
    <circle cx="280" cy="30" r="14" fill="#ffe66d"/><circle cx="280" cy="30" r="24" fill="#ffe66d" opacity=".25"/>
    <path d="M150 50 L160 30 L156 44 L166 40 L154 62 L158 48Z" fill="#ffe66d"/>
    <text x="150" y="185" font-size="16" font-weight="800" fill="#fff" font-family="serif">ε = −N ΔΦ/Δt</text>
  </svg>`,
  circuit: `<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice">
    <rect width="320" height="200" fill="#1d2b53"/>
    ${[20, 70, 120, 200, 260].map((x, i) => `<circle cx="${x}" cy="${15 + (i * 17) % 30}" r="1.5" fill="#fff"/>`).join('')}
    <circle cx="280" cy="28" r="14" fill="#fff6c9"/>
    <g fill="#2f3f73"><rect x="20" y="90" width="60" height="70"/><rect x="130" y="70" width="60" height="90"/><rect x="240" y="95" width="60" height="65"/></g>
    <g fill="#ffd23f"><rect x="32" y="105" width="14" height="14"/><rect x="56" y="105" width="14" height="14"/><rect x="142" y="85" width="14" height="14"/><rect x="166" y="110" width="14" height="14"/><rect x="252" y="110" width="14" height="14"/></g>
    <g fill="#2f3f73" opacity=".9"><rect x="276" y="110" width="14" height="14"/><rect x="56" y="130" width="14" height="14"/></g>
    <path d="M20 175 H300" stroke="#ffd23f" stroke-width="4"/>
    <path d="M50 160 V175 M160 160 V175 M270 160 V175" stroke="#ffd23f" stroke-width="4"/>
    <path d="M120 175 l6 -8 l8 16 l8 -16 l8 16 l8 -16 l6 8" stroke="#ff6b6b" stroke-width="4" fill="#1d2b53"/>
    <circle cx="90" cy="175" r="5" fill="#fff"/><circle cx="220" cy="175" r="5" fill="#fff"/>
    <text x="16" y="60" font-size="18" font-weight="800" fill="#ffd23f" font-family="serif">V = I R</text>
  </svg>`,
  light: `<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice">
    <rect width="320" height="200" fill="#160f33"/>
    <g stroke="#2a1f5c" stroke-width="1">${Array.from({ length: 16 }, (_, i) => `<line x1="${i * 20}" y1="0" x2="${i * 20}" y2="200"/>`).join('')}${Array.from({ length: 10 }, (_, i) => `<line x1="0" y1="${i * 20}" x2="320" y2="${i * 20}"/>`).join('')}</g>
    <rect x="16" y="140" width="34" height="22" rx="5" fill="#8a8fb3"/><rect x="46" y="146" width="10" height="10" fill="#ff4d6d"/>
    <path d="M56 151 L150 151 L150 50 L250 50" stroke="#ff4d6d" stroke-width="4" fill="none"/>
    <path d="M56 151 L150 151 L150 50 L250 50" stroke="#ffb3c1" stroke-width="1.5" fill="none"/>
    <line x1="135" y1="166" x2="165" y2="136" stroke="#d6f0ff" stroke-width="6" stroke-linecap="round"/>
    <line x1="135" y1="35" x2="165" y2="65" stroke="#d6f0ff" stroke-width="6" stroke-linecap="round"/>
    <polygon points="190,120 250,120 250,180" fill="#7fdcff" opacity=".35" stroke="#bdefff" stroke-width="2"/>
    <g transform="translate(266 50)"><polygon points="0,-18 14,-4 0,20 -14,-4" fill="#9b5de5" stroke="#fff" stroke-width="2"/><circle r="26" fill="#9b5de5" opacity=".25"/></g>
    <text x="150" y="190" font-size="15" font-weight="800" fill="#d6f0ff" font-family="serif">n₁ sinθ₁ = n₂ sinθ₂</text>
  </svg>`,
  energy: `<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice">
    <defs><linearGradient id="esky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a8b"/><stop offset="1" stop-color="#ffe0a3"/></linearGradient></defs>
    <rect width="320" height="200" fill="url(#esky)"/>
    <circle cx="250" cy="60" r="26" fill="#fff3b0"/>
    <path d="M0 170 H320 V200 H0Z" fill="#6bbf59"/>
    <path d="M10 40 C60 40 70 170 120 170 C150 170 160 120 200 120 C240 120 230 170 270 170 L320 170" fill="none" stroke="#e63946" stroke-width="6"/>
    <circle cx="200" cy="140" r="22" fill="none" stroke="#e63946" stroke-width="5"/>
    <g stroke="#7a3d2e" stroke-width="3">${[20, 40, 60, 80, 100].map(x => `<line x1="${x}" y1="${60 + (x - 20) * 1.1}" x2="${x}" y2="170"/>`).join('')}</g>
    <g transform="translate(36 42) rotate(20)"><rect x="-16" y="-14" width="32" height="18" rx="5" fill="#00bb77"/><circle cx="-9" cy="6" r="5" fill="#241a4f"/><circle cx="9" cy="6" r="5" fill="#241a4f"/><circle cx="0" cy="-20" r="8" fill="#ffd6a5"/></g>
    <g transform="translate(270 100)"><rect x="0" y="-40" width="12" height="40" fill="#e63946"/><rect x="16" y="-22" width="12" height="22" fill="#457b9d"/><rect x="32" y="-6" width="12" height="6" fill="#f4a261"/></g>
    <text x="110" y="196" font-size="15" font-weight="800" fill="#1d4d20" font-family="serif">½mv² + mgh = const</text>
  </svg>`
};

export function gameArt(id) { return ART[id] || ''; }

export function crystalFor(id) {
  const map = { bird: 'motion', water: 'water', magnet: 'magnetism', circuit: 'electricity', light: 'light', energy: 'energy' };
  return CRYSTAL_COLORS[map[id]];
}

// ---------- Canvas characters ----------

// Fizz the bird: orange round scientist bird with goggles.
export function drawBird(ctx, x, y, r = 14, angle = 0, blink = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = '#ff6b6b';
  ctx.beginPath(); ctx.moveTo(-r * .3, -r * .8); ctx.quadraticCurveTo(-r * .1, -r * 1.6, r * .3, -r * .85); ctx.fill();
  ctx.fillStyle = '#ff9f1c';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffd38a';
  ctx.beginPath(); ctx.ellipse(-r * .1, r * .4, r * .6, r * .45, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e07b00';
  ctx.beginPath(); ctx.ellipse(-r * .55, r * .05, r * .45, r * .3, -.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#241a4f';
  ctx.fillRect(-r * .1, -r * .55, r * 1.05, r * .25);
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(r * .45, -r * .3, r * .32, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#241a4f';
  if (blink) ctx.fillRect(r * .25, -r * .32, r * .4, r * .08);
  else { ctx.beginPath(); ctx.arc(r * .52, -r * .28, r * .15, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#ffc93c';
  ctx.beginPath(); ctx.moveTo(r * .85, -r * .05); ctx.lineTo(r * 1.45, r * .15); ctx.lineTo(r * .85, r * .35); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// Gloomling: purple one-eyed blob (the mischief makers).
export function drawGloom(ctx, x, y, r = 18, t = 0, hurt = false) {
  const wob = Math.sin(t * 4 + x) * r * .05;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,.15)';
  ctx.beginPath(); ctx.ellipse(0, r * .95, r * .9, r * .2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = hurt ? '#c9a3ff' : '#7a4fd1';
  ctx.beginPath();
  ctx.moveTo(-r, r * .8);
  ctx.quadraticCurveTo(-r * 1.05, -r - wob, 0, -r - wob);
  ctx.quadraticCurveTo(r * 1.05, -r - wob, r, r * .8);
  ctx.quadraticCurveTo(0, r * 1.05, -r, r * .8);
  ctx.fill();
  ctx.fillStyle = '#5a35a8';
  ctx.beginPath(); ctx.moveTo(-r * .3, -r * .9); ctx.lineTo(-r * .1, -r * 1.35); ctx.lineTo(r * .05, -r * .95); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(0, -r * .15, r * .42, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#241a4f';
  ctx.beginPath(); ctx.arc(r * .05, -r * .1, r * .2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#241a4f'; ctx.lineWidth = r * .1; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-r * .35, r * .45); ctx.quadraticCurveTo(0, r * .3, r * .35, r * .45); ctx.stroke();
  ctx.restore();
}

// King Bubbles.
export function drawKing(ctx, x, y, s = 1, mood = 'happy') {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#d7263d';
  ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-11, -22); ctx.lineTo(11, -22); ctx.lineTo(14, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillRect(-14, -5, 28, 5);
  ctx.fillStyle = '#ffd6a5';
  ctx.beginPath(); ctx.arc(0, -32, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f5f5f5';
  ctx.beginPath(); ctx.ellipse(0, -24, 10, 6, 0, 0, Math.PI); ctx.fill();
  ctx.fillStyle = '#ffc93c';
  ctx.beginPath(); ctx.moveTo(-12, -40); ctx.lineTo(-12, -54); ctx.lineTo(-6, -46); ctx.lineTo(0, -57); ctx.lineTo(6, -46); ctx.lineTo(12, -54); ctx.lineTo(12, -40); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#241a4f';
  ctx.beginPath(); ctx.arc(-4.5, -33, 2, 0, Math.PI * 2); ctx.arc(4.5, -33, 2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#241a4f'; ctx.lineWidth = 1.8;
  ctx.beginPath();
  if (mood === 'happy') ctx.arc(0, -29, 4, .2, Math.PI - .2);
  else ctx.arc(0, -24, 4, Math.PI + .3, -.3);
  ctx.stroke();
  ctx.restore();
}

// Volt the robot helper (used by circuit + magnet games).
export function drawRobot(ctx, x, y, s = 1, glow = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#b8c4e8';
  ctx.fillRect(-14, -22, 28, 22);
  ctx.fillStyle = '#e0e7ff';
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-16, -48, 32, 24, 7) : ctx.rect(-16, -48, 32, 24); ctx.fill();
  ctx.fillStyle = `rgba(46,211,160,${.5 + glow * .5})`;
  ctx.beginPath(); ctx.arc(-7, -36, 4, 0, Math.PI * 2); ctx.arc(7, -36, 4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8a95bd'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, -48); ctx.lineTo(0, -56); ctx.stroke();
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath(); ctx.arc(0, -58, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath(); ctx.moveTo(-3, -18); ctx.lineTo(3, -18); ctx.lineTo(0, -6); ctx.fill();
  ctx.restore();
}

export function drawCrystal(ctx, x, y, s, color, glow = 1) {
  ctx.save();
  ctx.translate(x, y);
  if (glow > 0) {
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, s * 2.2);
    g.addColorStop(0, color + 'aa');
    g.addColorStop(1, color + '00');
    ctx.fillStyle = g;
    ctx.globalAlpha = glow;
    ctx.beginPath(); ctx.arc(0, 0, s * 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = color;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * .7, -s * .35); ctx.lineTo(0, s); ctx.lineTo(-s * .7, -s * .35); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.4)';
  ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * .25, -s * .35); ctx.lineTo(0, s); ctx.lineTo(-s * .25, -s * .35); ctx.closePath(); ctx.fill();
  ctx.restore();
}

export function drawCloud(ctx, x, y, s = 1, alpha = .9) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x, y, 22 * s, 0, Math.PI * 2);
  ctx.arc(x + 24 * s, y - 10 * s, 26 * s, 0, Math.PI * 2);
  ctx.arc(x + 52 * s, y, 20 * s, 0, Math.PI * 2);
  ctx.rect(x, y, 52 * s, 20 * s);
  ctx.fill('nonzero');
  ctx.restore();
}
