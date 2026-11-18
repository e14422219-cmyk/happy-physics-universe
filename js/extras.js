// Added features: anonymous play stats, heroes board, daily challenge, certificates and the author's signature.
import { GAMES, CREDIT, NICK_ADJ, NICK_NOUN } from './config.js';
import { store, totalStars, levelStars, isGameComplete } from './store.js';
import { T, L, getLang } from './i18n.js';
import { gameIcon } from './icons.js';

let ctx = null;   // { MODULES, openModal, closeModal, go, sfx, toast }
export function initExtras(c) { ctx = c; }

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const meta = id => GAMES.find(g => g.id === id);

// ---------------- anonymous id + play statistics ----------------
export function playerId() {
  if (!/^[a-f0-9]{16,32}$/.test(store.pid || '')) {
    const bytes = new Uint8Array(12);
    (self.crypto || {}).getRandomValues ? crypto.getRandomValues(bytes) : bytes.forEach((_, i) => { bytes[i] = Math.random() * 256; });
    store.pid = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
    store.save();
  }
  return store.pid;
}

const deviceType = () => {
  const ua = navigator.userAgent;
  if (/iPad|Tablet/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) || (/Android/.test(ua) && !/Mobile/.test(ua))) return 'tablet';
  if (/Mobi|iPhone|Android/.test(ua)) return 'phone';
  return 'computer';
};

// Fire-and-forget; works offline or inside previews without a server (the request just fails quietly).
export function track(type, extra = {}) {
  const body = JSON.stringify({ type, pid: playerId(), ...extra });
  try {
    if (navigator.sendBeacon && navigator.sendBeacon('/api/events', new Blob([body], { type: 'text/plain' }))) return;
  } catch { /* fall back to fetch */ }
  fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body, keepalive: true }).catch(() => {});
}

export function trackVisit() {
  try { if (sessionStorage.getItem('hpu-visit')) return; sessionStorage.setItem('hpu-visit', '1'); } catch { /* count it anyway */ }
  track('visit', { device: deviceType() });
}

// ---------------- signature ----------------
export function signatureHTML(size = '') {
  return `
  <div class="credit ${size}" lang="ar">
    <span class="credit-label">${T('Prepared by', 'إعداد')}</span>
    <span class="signature">
      <span class="sig-name">${CREDIT.ar}</span>
      <svg class="sig-swash" viewBox="0 0 300 40" aria-hidden="true"><path d="M6 26 C 60 40, 120 6, 170 20 S 250 38, 294 12" /><path class="dot" d="M240 30 l4 -4" /></svg>
    </span>
    ${getLang() === 'en' ? `<span class="credit-en">${CREDIT.en}</span>` : ''}
  </div>`;
}

// ---------------- heroes board ----------------
export const nickName = nk => nk ? (getLang() === 'ar' ? `${NICK_NOUN[nk.n].ar} ${NICK_ADJ[nk.a].ar}` : `${NICK_ADJ[nk.a].en} ${NICK_NOUN[nk.n].en}`) : '';
const crystalsCount = () => GAMES.filter(g => isGameComplete(g.id, ctx.MODULES[g.id].levels.length)).length;

export function syncBoard() {
  if (!store.nick) return Promise.resolve(false);
  return fetch('/api/leaderboard', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pid: playerId(), a: store.nick.a, n: store.nick.n, stars: Math.min(90, totalStars()), crystals: crystalsCount() })
  }).then(r => r.ok).catch(() => false);
}

export async function showBoard() {
  if (!store.nick) return pickNick();
  const m = ctx.openModal(`
    <div class="board-crown" aria-hidden="true">👑</div>
    <h2>${T('Heroes board', 'لوحة الأبطال')}</h2>
    <p class="lesson-line">${T('Collect stars to climb! Only nicknames are shown.', 'اجمع النجوم لتصعد! تظهر الألقاب فقط.')}</p>
    <div class="board" id="board"><div class="board-loading">${T('Loading…', 'جارٍ التحميل…')}</div></div>
    <div class="actions"><button class="btn ghost small" id="b-nick">✏️ ${T('Change nickname', 'غيّر لقبي')}</button></div>`, { closable: true });
  m.querySelector('#b-nick').onclick = pickNick;
  await syncBoard();
  try {
    const r = await fetch(`/api/leaderboard?me=${playerId()}`);
    if (!r.ok) throw new Error(r.status);
    const d = await r.json();
    const box = m.querySelector('#board');
    if (!box) return;
    const medal = i => ['🥇', '🥈', '🥉'][i] || `#${i + 1}`;
    box.innerHTML = d.players.length ? d.players.map((p, i) => `
      <div class="board-row ${p.you ? 'you' : ''} ${i < 3 ? 'top' : ''}">
        <span class="rank">${medal(i)}</span>
        <span class="avatar">${NICK_NOUN[p.n].icon}</span>
        <span class="nick">${esc(nickName(p))}${p.you ? ` <em>${T('(you)', '(أنت)')}</em>` : ''}</span>
        <span class="crys">${p.crystals ? `💎 ${p.crystals}` : ''}</span>
        <b class="pts">⭐ ${p.stars}</b>
      </div>`).join('') + (d.myRank && d.myRank > 20 ? `<div class="board-me">${T('Your rank', 'ترتيبك')}: <b>#${d.myRank}</b> ${T('of', 'من')} ${d.total}</div>` : '')
      : `<div class="board-loading">${T('Be the first hero!', 'كن أول بطل!')}</div>`;
  } catch {
    const box = m.querySelector('#board');
    if (box) box.innerHTML = `<div class="board-loading">${T('The heroes board needs an internet connection.', 'لوحة الأبطال تحتاج اتصالًا بالإنترنت.')}</div>`;
  }
}

function pickNick() {
  let nk = store.nick ? { ...store.nick } : { a: Math.floor(Math.random() * 16), n: Math.floor(Math.random() * 16) };
  const m = ctx.openModal(`
    <h2>${T('Choose your hero nickname', 'اختر لقبك البطولي')}</h2>
    <p class="lesson-line">${T('Your real name never appears on the board.', 'اسمك الحقيقي لا يظهر في اللوحة أبدًا.')}</p>
    <div class="nick-preview"><span class="avatar" id="n-av"></span><b id="n-name"></b></div>
    <div class="nick-grid" id="n-nouns">${NICK_NOUN.map((w, i) => `<button class="nick-noun" data-i="${i}" title="${esc(L(w))}" aria-label="${esc(L(w))}">${w.icon}</button>`).join('')}</div>
    <div class="nick-adjs" id="n-adjs">${NICK_ADJ.map((w, i) => `<button class="chip" data-i="${i}">${esc(L(w))}</button>`).join('')}</div>
    <div class="actions">
      <button class="btn ghost small" id="n-dice">🎲 ${T('Surprise me', 'اختر لي')}</button>
      <button class="btn mint" id="n-ok">👑 ${T('Join the board', 'انضم للوحة')}</button>
    </div>`, { closable: true });
  const paint = () => {
    m.querySelector('#n-av').textContent = NICK_NOUN[nk.n].icon;
    m.querySelector('#n-name').textContent = nickName(nk);
    m.querySelectorAll('.nick-noun').forEach(b => b.classList.toggle('on', +b.dataset.i === nk.n));
    m.querySelectorAll('#n-adjs .chip').forEach(b => b.classList.toggle('on', +b.dataset.i === nk.a));
  };
  m.querySelectorAll('.nick-noun').forEach(b => b.onclick = () => { nk.n = +b.dataset.i; ctx.sfx('click'); paint(); });
  m.querySelectorAll('#n-adjs .chip').forEach(b => b.onclick = () => { nk.a = +b.dataset.i; ctx.sfx('click'); paint(); });
  m.querySelector('#n-dice').onclick = () => { nk = { a: Math.floor(Math.random() * 16), n: Math.floor(Math.random() * 16) }; ctx.sfx('star'); paint(); };
  m.querySelector('#n-ok').onclick = () => { store.nick = nk; store.save(); ctx.sfx('win'); showBoard(); };
  paint();
}

// ---------------- daily challenge ----------------
export const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// The same level for everyone on the same date.
export function dailyPick(day = today()) {
  const all = [];
  GAMES.forEach(g => ctx.MODULES[g.id].levels.forEach((_, i) => all.push({ id: g.id, level: i })));
  let h = 2166136261;
  for (const c of day) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return all[h % all.length];
}

export function streak() {
  let n = 0;
  const d = new Date();
  if (!store.daily[today(d)]) d.setDate(d.getDate() - 1);   // today's not done yet: count up to yesterday
  while (store.daily[today(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

// Called after every win; returns true when this win completed today's challenge for the first time.
export function checkDaily(id, levelIndex) {
  const p = dailyPick();
  if (p.id !== id || p.level !== levelIndex || store.daily[today()]) return false;
  store.daily[today()] = true;
  store.save();
  return true;
}

export function dailyCardHTML() {
  const p = dailyPick(), g = meta(p.id), lv = ctx.MODULES[p.id].levels[p.level];
  const done = !!store.daily[today()], s = streak();
  return `
  <article class="feature daily ${done ? 'done' : ''}" style="--glow:${g.color}">
    <div class="feature-head"><span class="feature-ic">📅</span><h3>${T('Daily challenge', 'تحدي اليوم')}</h3>${s ? `<span class="streak" title="${T('Days in a row', 'أيام متتالية')}">🔥 ${s}</span>` : ''}</div>
    <div class="daily-body">
      <div class="daily-icon">${gameIcon(p.id)}</div>
      <div><b>${esc(L(g.title))}</b><small>${T('Level', 'المرحلة')} ${p.level + 1}: ${esc(L(lv.name))}</small></div>
    </div>
    ${done ? `<p class="feature-done">✅ ${T('Done today! Come back tomorrow for a new one.', 'أنجزته اليوم! ارجع غدًا لتحدٍّ جديد.')}</p>`
      : `<button class="btn mint small" id="f-daily">▶ ${T('Play now', 'العب الآن')}</button>`}
  </article>`;
}

// ---------------- certificates ----------------
export function certificatesHTML() {
  const doneGames = GAMES.filter(g => isGameComplete(g.id, ctx.MODULES[g.id].levels.length));
  return `
  <article class="feature cert">
    <div class="feature-head"><span class="feature-ic">🎓</span><h3>${T('Certificates', 'شهادات الإنجاز')}</h3></div>
    ${doneGames.length ? `<p class="feature-note">${T('Finish a world to earn its certificate. Tap to download:', 'أكمل عالمًا لتحصل على شهادته. اضغط للتحميل:')}</p>
      <div class="cert-list">${doneGames.map(g => `<button class="cert-chip" data-cert="${g.id}" title="${esc(L(g.title))}" aria-label="${esc(L(g.title))}">${gameIcon(g.id)}</button>`).join('')}
      ${doneGames.length === GAMES.length ? `<button class="cert-chip grand" data-cert="all" title="${T('Grand certificate', 'الشهادة الكبرى')}">👑</button>` : ''}</div>`
      : `<p class="feature-note">${T('Finish all the levels of any world to earn a certificate with your name.', 'أكمل كل مراحل أي عالم لتحصل على شهادة باسمك.')}</p>
      <div class="cert-locked" aria-hidden="true">📜🔒</div>`}
  </article>`;
}

export function boardCardHTML() {
  return `
  <article class="feature heroes">
    <div class="feature-head"><span class="feature-ic">👑</span><h3>${T('Heroes board', 'لوحة الأبطال')}</h3></div>
    <p class="feature-note">${store.nick ? `${T('You are', 'أنت')}: <b>${NICK_NOUN[store.nick.n].icon} ${esc(nickName(store.nick))}</b>` : T('Pick a hero nickname and race other players for stars!', 'اختر لقبًا بطوليًا ونافس اللاعبين على النجوم!')}</p>
    <button class="btn magic small" id="f-board">${store.nick ? T('See the board', 'شاهد اللوحة') : T('Join now', 'انضم الآن')}</button>
  </article>`;
}

const loadFonts = () => Promise.all(['700 64px "Aref Ruqaa"', '400 64px "Lalezar"', '700 30px "Baloo Bhaijaan 2"']
  .map(f => document.fonts?.load(f).catch(() => null))).catch(() => null);

// Draws the certificate on a canvas (landscape A4 ratio).
async function drawCertificate(gameId) {
  await loadFonts();
  const W = 1600, H = 1131;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  const grand = gameId === 'all';
  const g = grand ? null : meta(gameId);
  const name = (store.profile?.name || '').trim() || T('Physics hero', 'بطل الفيزياء');

  // background
  const bg = x.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#fffaf0'); bg.addColorStop(1, '#fdf1d8');
  x.fillStyle = bg; x.fillRect(0, 0, W, H);
  const glow = x.createRadialGradient(W / 2, H * .42, 50, W / 2, H * .42, W * .6);
  glow.addColorStop(0, 'rgba(255, 211, 107, .25)'); glow.addColorStop(1, 'rgba(255, 211, 107, 0)');
  x.fillStyle = glow; x.fillRect(0, 0, W, H);
  // borders
  const gold = x.createLinearGradient(0, 0, W, H);
  gold.addColorStop(0, '#b8860b'); gold.addColorStop(.5, '#ffd36b'); gold.addColorStop(1, '#b8860b');
  x.strokeStyle = '#2b1670'; x.lineWidth = 26; x.strokeRect(30, 30, W - 60, H - 60);
  x.strokeStyle = gold; x.lineWidth = 8; x.strokeRect(58, 58, W - 116, H - 116);
  x.lineWidth = 2; x.strokeRect(74, 74, W - 148, H - 148);
  // corner stars
  const star = (cx, cy, r, color) => {
    x.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
    x.closePath(); x.fillStyle = color; x.fill();
  };
  [[110, 110], [W - 110, 110], [110, H - 110], [W - 110, H - 110]].forEach(([a, b]) => star(a, b, 26, '#e0a526'));
  for (let i = 0; i < 26; i++) star(140 + Math.random() * (W - 280), 130 + Math.random() * 60, 3 + Math.random() * 4, 'rgba(224,165,38,.35)');

  const ar = getLang() === 'ar';
  x.textAlign = 'center';
  x.direction = ar ? 'rtl' : 'ltr';
  // title
  x.fillStyle = '#2b1670';
  x.font = '400 92px "Lalezar", sans-serif';
  x.fillText(ar ? 'شهادة إنجاز' : 'Certificate of Achievement', W / 2, 250);
  x.fillStyle = '#7a5a1e';
  x.font = '700 34px "Baloo Bhaijaan 2", sans-serif';
  x.fillText(ar ? 'كون الفيزياء السعيد يمنح هذه الشهادة إلى' : 'Happy Physics Universe proudly presents this certificate to', W / 2, 320);
  // name
  const nameGrad = x.createLinearGradient(W / 2 - 400, 0, W / 2 + 400, 0);
  nameGrad.addColorStop(0, '#7b3fe4'); nameGrad.addColorStop(.5, '#d6249f'); nameGrad.addColorStop(1, '#7b3fe4');
  x.fillStyle = nameGrad;
  let size = 120;
  x.font = `700 ${size}px "Aref Ruqaa", "Lalezar", serif`;
  while (x.measureText(name).width > W - 420 && size > 60) { size -= 6; x.font = `700 ${size}px "Aref Ruqaa", "Lalezar", serif`; }
  x.fillText(name, W / 2, 470);
  x.strokeStyle = gold; x.lineWidth = 4;
  x.beginPath(); x.moveTo(W / 2 - 380, 505); x.lineTo(W / 2 + 380, 505); x.stroke();
  // reason
  x.fillStyle = '#2b1670';
  x.font = '700 40px "Baloo Bhaijaan 2", sans-serif';
  const reason = grand
    ? (ar ? 'تقديرًا لإتمام جميع العوالم الستة واستعادة كل البلورات' : 'for completing all six worlds and restoring every crystal')
    : (ar ? `تقديرًا لإتمام جميع مراحل عالم «${g.title.ar}»` : `for completing every level of “${g.title.en}”`);
  x.fillText(reason, W / 2, 590);
  x.fillStyle = '#7a5a1e';
  x.font = '700 32px "Baloo Bhaijaan 2", sans-serif';
  const lessons = grand ? (ar ? 'المقذوفات • الموائع • الحث • الدوائر • البصريات • الطاقة' : 'Projectiles • Fluids • Induction • Circuits • Optics • Energy') : L(g.lesson);
  x.fillText(lessons, W / 2, 645);
  const stars = grand ? totalStars() : ctx.MODULES[gameId].levels.reduce((a, _, i) => a + levelStars(gameId, i), 0);
  const maxS = grand ? 90 : ctx.MODULES[gameId].levels.length * 3;
  x.fillStyle = '#e0a526';
  x.font = '700 44px "Baloo Bhaijaan 2", sans-serif';
  x.fillText(`★ ${stars} / ${maxS}`, W / 2, 720);

  // seal
  const sx = W / 2, sy = 860;
  x.save();
  x.translate(sx, sy);
  for (let i = 0; i < 24; i++) { x.rotate(Math.PI / 12); x.fillStyle = i % 2 ? '#e0a526' : '#ffd36b'; x.fillRect(-6, 70, 12, 26); }
  x.restore();
  const seal = x.createRadialGradient(sx - 20, sy - 20, 10, sx, sy, 80);
  seal.addColorStop(0, '#ffe7a3'); seal.addColorStop(1, '#d89a17');
  x.fillStyle = seal; x.beginPath(); x.arc(sx, sy, 78, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#fff6d8'; x.lineWidth = 4; x.beginPath(); x.arc(sx, sy, 62, 0, Math.PI * 2); x.stroke();
  star(sx, sy - 6, 34, '#fff8e1');
  x.fillStyle = '#7a4a00'; x.font = '700 20px "Baloo Bhaijaan 2", sans-serif';
  x.fillText(ar ? 'كون الفيزياء' : 'PHYSICS', sx, sy + 46);

  // date (left) and signature (right)
  const dateStr = new Date().toLocaleDateString(ar ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
  x.fillStyle = '#2b1670';
  x.font = '700 30px "Baloo Bhaijaan 2", sans-serif';
  x.fillText(dateStr, 330, 900);
  x.strokeStyle = '#2b1670'; x.lineWidth = 2;
  x.beginPath(); x.moveTo(190, 920); x.lineTo(470, 920); x.stroke();
  x.fillStyle = '#7a5a1e'; x.font = '700 26px "Baloo Bhaijaan 2", sans-serif';
  x.fillText(ar ? 'التاريخ' : 'Date', 330, 960);

  const sigX = W - 340;
  x.fillStyle = '#7a5a1e'; x.font = '700 26px "Baloo Bhaijaan 2", sans-serif';
  x.fillText(ar ? 'إعداد' : 'Prepared by', sigX, 800);
  x.save();
  x.translate(sigX, 875);
  x.rotate(-0.06);
  x.direction = 'rtl';
  x.fillStyle = '#1e2a8a';
  x.font = '700 56px "Aref Ruqaa", serif';
  x.fillText(CREDIT.ar, 0, 0);
  x.strokeStyle = '#1e2a8a'; x.lineWidth = 3; x.lineCap = 'round';
  x.beginPath(); x.moveTo(-200, 28); x.bezierCurveTo(-120, 60, -20, 0, 60, 22); x.bezierCurveTo(120, 40, 170, 30, 210, 4); x.stroke();
  x.restore();
  x.strokeStyle = '#2b1670'; x.lineWidth = 2;
  x.beginPath(); x.moveTo(sigX - 170, 920); x.lineTo(sigX + 170, 920); x.stroke();
  x.fillStyle = '#7a5a1e'; x.font = '700 26px "Baloo Bhaijaan 2", sans-serif';
  x.fillText(ar ? CREDIT.ar : CREDIT.en, sigX, 960);

  x.fillStyle = 'rgba(43,22,112,.55)'; x.font = '700 22px "Baloo Bhaijaan 2", sans-serif';
  x.fillText('happy-physics-universe.vercel.app', W / 2, H - 100);
  return c;
}

export async function showCertificate(gameId) {
  const m = ctx.openModal(`
    <h2>🎓 ${T('Your certificate', 'شهادتك')}</h2>
    <div class="cert-view" id="c-view"><div class="board-loading">${T('Preparing…', 'جارٍ التجهيز…')}</div></div>
    <p class="lesson-line">${T('On a phone you can also press and hold the picture to save it.', 'على الجوال يمكنك أيضًا الضغط مطولًا على الصورة لحفظها.')}</p>
    <div class="actions"><button class="btn mint" id="c-dl" disabled>⬇ ${T('Download', 'تحميل الشهادة')}</button></div>`, { closable: true });
  const canvas = await drawCertificate(gameId);
  const url = canvas.toDataURL('image/png');
  const view = m.querySelector('#c-view');
  if (!view) return;
  view.innerHTML = `<img src="${url}" alt="${T('Certificate', 'شهادة إنجاز')}">`;
  const dl = m.querySelector('#c-dl');
  dl.disabled = false;
  dl.onclick = () => {
    canvas.toBlob(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `certificate-${gameId}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }, 'image/png');
    ctx.sfx('ding');
  };
}
