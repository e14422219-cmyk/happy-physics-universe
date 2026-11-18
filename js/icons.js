// Square game icons for the portal tiles (Poki-style grid: art only, no text).
const bricks = Array.from({ length: 12 }, (_, i) =>
  `<rect x="${(i % 4) * 52 + (Math.floor(i / 4) % 2) * 26 - 10}" y="${Math.floor(i / 4) * 30 + 4}" width="48" height="26" rx="4"/>`).join('');
const grid = Array.from({ length: 9 }, (_, i) => `<path d="M${i * 25} 0V200M0 ${i * 25}H200"/>`).join('');
const posts = [22, 40, 58, 76].map(x => `<path d="M${x} ${40 + (x - 22) * 1.6}V176"/>`).join('');

const ICONS = {
  bird: `<svg viewBox="0 0 200 200" aria-hidden="true">
    <defs>
      <linearGradient id="ib-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f8cff"/><stop offset="1" stop-color="#9ee9ff"/></linearGradient>
      <radialGradient id="ib-sun"><stop offset="0" stop-color="#fff6b8"/><stop offset=".55" stop-color="#ffd84d"/><stop offset="1" stop-color="#ffd84d" stop-opacity="0"/></radialGradient>
      <radialGradient id="ib-body" cx=".35" cy=".3"><stop offset="0" stop-color="#ffc35a"/><stop offset="1" stop-color="#ff7a1a"/></radialGradient>
    </defs>
    <rect width="200" height="200" fill="url(#ib-sky)"/>
    <circle cx="160" cy="38" r="34" fill="url(#ib-sun)"/>
    <g fill="#fff" opacity=".9"><ellipse cx="40" cy="44" rx="26" ry="10"/><ellipse cx="58" cy="38" rx="16" ry="12"/><ellipse cx="128" cy="78" rx="18" ry="7"/></g>
    <path d="M0 158 Q50 128 100 150 T200 140 V200 H0Z" fill="#5fd36b"/>
    <path d="M0 176 Q70 160 130 178 T200 172 V200 H0Z" fill="#33b257"/>
    <path d="M38 132 Q70 40 150 70" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="1 10" stroke-linecap="round"/>
    <path d="M36 176 V140 M36 142 L24 118 M36 142 L48 118" stroke="#7a4a1e" stroke-width="8" stroke-linecap="round" fill="none"/>
    <g transform="translate(112 96) rotate(-14)">
      <path d="M-10 -32 Q0 -56 14 -32 Q20 -48 28 -30" fill="#ff4d6d"/>
      <circle r="36" fill="url(#ib-body)"/>
      <ellipse cx="-4" cy="14" rx="22" ry="16" fill="#ffe0a8"/>
      <ellipse cx="-24" cy="2" rx="14" ry="9" fill="#e86a00" transform="rotate(-25 -24 2)"/>
      <rect x="-6" y="-22" width="40" height="11" rx="5" fill="#241a4f"/>
      <circle cx="16" cy="-12" r="11" fill="#fff"/><circle cx="19" cy="-11" r="5.5" fill="#241a4f"/><circle cx="21" cy="-13" r="2" fill="#fff"/>
      <path d="M30 -2 L54 6 L30 14Z" fill="#ffc93c"/>
    </g>
    <g transform="translate(166 158)"><path d="M-16 14 Q-18 -16 0 -16 Q18 -16 16 14Z" fill="#7a4fd1"/><circle cy="-2" r="7" fill="#fff"/><circle cx="1" cy="-1" r="3.5" fill="#241a4f"/></g>
  </svg>`,

  water: `<svg viewBox="0 0 200 200" aria-hidden="true">
    <defs>
      <linearGradient id="iw-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a2c8f"/><stop offset="1" stop-color="#22114f"/></linearGradient>
      <linearGradient id="iw-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fe3ff"/><stop offset="1" stop-color="#1471d1"/></linearGradient>
      <linearGradient id="iw-honey" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd166"/><stop offset="1" stop-color="#d7860b"/></linearGradient>
    </defs>
    <rect width="200" height="200" fill="url(#iw-bg)"/>
    <g fill="#5b3fa6" opacity=".55">${bricks}</g>
    <rect x="16" y="22" width="62" height="50" rx="4" fill="#d6ecff" opacity=".2" stroke="#efe8ff" stroke-width="4"/>
    <rect x="19" y="38" width="56" height="31" fill="url(#iw-water)"/>
    <rect x="122" y="22" width="62" height="50" rx="4" fill="#d6ecff" opacity=".2" stroke="#efe8ff" stroke-width="4"/>
    <rect x="125" y="42" width="56" height="27" fill="url(#iw-honey)"/>
    <path d="M47 74 V128" stroke="#5fe3ff" stroke-width="7" stroke-linecap="round"/>
    <g transform="translate(66 82)"><circle r="11" fill="none" stroke="#3cf2b0" stroke-width="4"/><path d="M-11 0H11M0-11V11" stroke="#3cf2b0" stroke-width="3"/></g>
    <g transform="translate(140 82) rotate(45)"><circle r="11" fill="none" stroke="#ff5a6e" stroke-width="4"/><path d="M-11 0H11M0-11V11" stroke="#ff5a6e" stroke-width="3"/></g>
    <rect x="20" y="104" width="160" height="88" rx="6" fill="#d6ecff" opacity=".18" stroke="#efe8ff" stroke-width="5"/>
    <path d="M24 138 Q60 130 100 138 T176 138 V188 H24Z" fill="url(#iw-water)"/>
    <rect x="68" y="128" width="64" height="12" rx="4" fill="#b5763a"/>
    <g transform="translate(100 104)">
      <path d="M-18 24 L-14 -4 L14 -4 L18 24Z" fill="#d7263d"/><rect x="-18" y="18" width="36" height="6" fill="#fff"/>
      <circle cy="-18" r="17" fill="#ffd6a5"/>
      <path d="M-16 -28 L-16 -46 L-8 -36 L0 -50 L8 -36 L16 -46 L16 -28Z" fill="#ffc93c" stroke="#e09b00" stroke-width="2"/>
      <circle cx="-6" cy="-19" r="2.6" fill="#241a4f"/><circle cx="6" cy="-19" r="2.6" fill="#241a4f"/>
      <path d="M-6 -10 Q0 -5 6 -10" stroke="#241a4f" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    </g>
    <g fill="#fff" opacity=".7"><circle cx="40" cy="170" r="3"/><circle cx="150" cy="160" r="4"/><circle cx="160" cy="176" r="2.5"/></g>
  </svg>`,

  magnet: `<svg viewBox="0 0 200 200" aria-hidden="true">
    <defs>
      <radialGradient id="im-bg" cx=".5" cy=".45"><stop offset="0" stop-color="#5a2a9e"/><stop offset="1" stop-color="#140a3a"/></radialGradient>
      <linearGradient id="im-red" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7a93"/><stop offset="1" stop-color="#e01e4b"/></linearGradient>
      <linearGradient id="im-blue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7aa2ff"/><stop offset="1" stop-color="#2d5bff"/></linearGradient>
    </defs>
    <rect width="200" height="200" fill="url(#im-bg)"/>
    <g fill="none" stroke="#ff8fd8" stroke-width="2.5" opacity=".45"><path d="M40 40 Q100 -10 160 40"/><path d="M28 60 Q100 -2 172 60"/><path d="M20 82 Q100 8 180 82"/></g>
    <g transform="translate(100 112) rotate(-12)">
      <path d="M-56 -50 V8 A56 56 0 0 0 0 64 V36 A28 28 0 0 1 -28 8 V-50Z" fill="url(#im-red)"/>
      <path d="M56 -50 V8 A56 56 0 0 1 0 64 V36 A28 28 0 0 0 28 8 V-50Z" fill="url(#im-blue)"/>
      <rect x="-56" y="-64" width="28" height="16" rx="3" fill="#f2f4fb"/><rect x="28" y="-64" width="28" height="16" rx="3" fill="#f2f4fb"/>
      <text x="-42" y="-12" font-size="24" font-weight="900" fill="#fff" text-anchor="middle" font-family="sans-serif">N</text>
      <text x="42" y="-12" font-size="24" font-weight="900" fill="#fff" text-anchor="middle" font-family="sans-serif">S</text>
    </g>
    <path d="M34 40 L52 18 L48 34 L62 30 L42 58 L46 42Z" fill="#ffe66d"/>
    <path d="M150 30 L170 10 L164 28 L178 26 L156 52 L160 36Z" fill="#ffe66d"/>
    <g fill="#ffe66d"><circle cx="30" cy="150" r="3"/><circle cx="172" cy="146" r="3.5"/><circle cx="160" cy="176" r="2.5"/></g>
  </svg>`,

  circuit: `<svg viewBox="0 0 200 200" aria-hidden="true">
    <defs>
      <radialGradient id="ic-bg" cx=".5" cy=".42"><stop offset="0" stop-color="#2b3c86"/><stop offset="1" stop-color="#0a1033"/></radialGradient>
      <radialGradient id="ic-glow"><stop offset="0" stop-color="#fff7c2"/><stop offset=".45" stop-color="#ffd23f" stop-opacity=".7"/><stop offset="1" stop-color="#ffd23f" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="200" height="200" fill="url(#ic-bg)"/>
    <g fill="none" stroke="#3ef0ff" stroke-width="3" opacity=".7" stroke-linecap="round">
      <path d="M0 40 H40 V70 H62"/><path d="M200 46 H158 V74 H138"/><path d="M0 162 H46 V140"/><path d="M200 160 H150 V140"/>
    </g>
    <g fill="#3ef0ff"><circle cx="40" cy="40" r="4"/><circle cx="158" cy="46" r="4"/><circle cx="46" cy="162" r="4"/><circle cx="150" cy="160" r="4"/></g>
    <circle cx="100" cy="86" r="78" fill="url(#ic-glow)"/>
    <g stroke="#fff4b0" stroke-width="5" stroke-linecap="round" opacity=".9">
      <path d="M100 8 V22"/><path d="M38 34 L48 44"/><path d="M162 34 L152 44"/><path d="M22 92 H36"/><path d="M178 92 H164"/>
    </g>
    <path d="M100 34 A46 46 0 0 1 128 118 Q122 126 122 138 H78 Q78 126 72 118 A46 46 0 0 1 100 34Z" fill="#fff3a0" stroke="#ffd23f" stroke-width="4"/>
    <path d="M86 118 L90 84 L100 100 L110 84 L114 118" fill="none" stroke="#e09b00" stroke-width="4" stroke-linejoin="round"/>
    <rect x="78" y="138" width="44" height="12" rx="3" fill="#9aa4c8"/><rect x="80" y="150" width="40" height="10" rx="3" fill="#7d87ad"/><rect x="88" y="160" width="24" height="8" rx="4" fill="#5b6488"/>
    <g transform="translate(150 178)"><rect x="-20" y="-9" width="40" height="18" rx="4" fill="#2ed3a0"/><rect x="20" y="-4" width="5" height="8" fill="#2ed3a0"/><text y="5" font-size="12" font-weight="900" fill="#06352a" text-anchor="middle" font-family="sans-serif">+  −</text></g>
  </svg>`,

  light: `<svg viewBox="0 0 200 200" aria-hidden="true">
    <defs>
      <radialGradient id="il-bg" cx=".6" cy=".35"><stop offset="0" stop-color="#3b1f78"/><stop offset="1" stop-color="#0c0624"/></radialGradient>
      <radialGradient id="il-glow"><stop offset="0" stop-color="#e3b8ff"/><stop offset="1" stop-color="#9b5de5" stop-opacity="0"/></radialGradient>
      <linearGradient id="il-crys" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1d3ff"/><stop offset="1" stop-color="#8a3ffc"/></linearGradient>
    </defs>
    <rect width="200" height="200" fill="url(#il-bg)"/>
    <g stroke="#2c1a63" stroke-width="1">${grid}</g>
    <rect x="10" y="146" width="34" height="22" rx="6" fill="#9aa0c8"/><rect x="42" y="152" width="8" height="10" fill="#ff4d6d"/>
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M50 157 H96 V60 H150" stroke="#ff4d6d" stroke-width="12" opacity=".3"/>
      <path d="M50 157 H96 V60 H150" stroke="#ff6b8a" stroke-width="5"/>
      <path d="M50 157 H96 V60 H150" stroke="#fff0f4" stroke-width="2"/>
    </g>
    <path d="M80 173 L112 141" stroke="#e8f6ff" stroke-width="8" stroke-linecap="round"/>
    <path d="M80 44 L112 76" stroke="#e8f6ff" stroke-width="8" stroke-linecap="round"/>
    <circle cx="160" cy="60" r="38" fill="url(#il-glow)"/>
    <path d="M160 26 L182 52 L160 98 L138 52Z" fill="url(#il-crys)" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>
    <path d="M160 26 L168 52 L160 98 L152 52Z" fill="#fff" opacity=".35"/>
    <g fill="#fff"><circle cx="186" cy="24" r="2.5"/><circle cx="132" cy="22" r="2"/><circle cx="186" cy="104" r="2"/></g>
  </svg>`,

  energy: `<svg viewBox="0 0 200 200" aria-hidden="true">
    <defs>
      <linearGradient id="ie-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5fa2"/><stop offset=".55" stop-color="#ff9a6b"/><stop offset="1" stop-color="#ffd38a"/></linearGradient>
    </defs>
    <rect width="200" height="200" fill="url(#ie-sky)"/>
    <circle cx="150" cy="60" r="26" fill="#fff3b0" opacity=".9"/>
    <path d="M0 176 H200 V200 H0Z" fill="#3fbf6b"/>
    <g stroke="#7a2f45" stroke-width="4" opacity=".75">${posts}<path d="M150 140V176"/><path d="M182 140V176"/></g>
    <path d="M10 36 C46 36 60 150 104 150 C132 150 140 150 166 150 L200 150" fill="none" stroke="#7a0f2a" stroke-width="12" stroke-linecap="round"/>
    <path d="M10 36 C46 36 60 150 104 150 C132 150 140 150 166 150 L200 150" fill="none" stroke="#ff3b5c" stroke-width="7" stroke-linecap="round"/>
    <circle cx="138" cy="112" r="38" fill="none" stroke="#7a0f2a" stroke-width="12"/>
    <circle cx="138" cy="112" r="38" fill="none" stroke="#ff3b5c" stroke-width="7"/>
    <g transform="translate(138 70)">
      <rect x="-20" y="-16" width="40" height="22" rx="7" fill="#00c27a" stroke="#065e3c" stroke-width="3"/>
      <circle cx="-11" cy="8" r="6" fill="#241a4f"/><circle cx="11" cy="8" r="6" fill="#241a4f"/>
      <circle cx="0" cy="-26" r="10" fill="#ffd6a5" stroke="#241a4f" stroke-width="2"/><path d="M-6 -24 Q0 -20 6 -24" stroke="#241a4f" stroke-width="2" fill="none"/>
      <path d="M-8 -36 Q0 -46 8 -36Z" fill="#241a4f"/>
    </g>
    <g fill="#fff"><path d="M40 18 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z"/><path d="M182 26 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"/></g>
  </svg>`
};

// Each copy gets its own gradient ids: the same icon appears in several places at once, and a
// gradient defined inside a hidden screen would otherwise leave the visible copy blank.
let copies = 0;
export function gameIcon(id) {
  const svg = ICONS[id];
  if (!svg) return '';
  const n = ++copies;
  return svg.replace(/id="([\w-]+)"/g, `id="$1-${n}"`).replace(/url\(#([\w-]+)\)/g, `url(#$1-${n})`);
}
