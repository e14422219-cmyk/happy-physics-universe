import { GAMES, ACHIEVEMENTS, CRYSTAL_COLORS, LOCK_LEVELS, AGE_RATING, ROLES, RATING_QUESTIONS } from './config.js';
import { store, levelStars, setLevelStars, gameStars, totalStars, levelsCleared, isUnlocked as inOrder, isGameComplete } from './store.js';
import { t, T, L, getLang, setLang, applyDir } from './i18n.js';
import { crystalSVG, owlSVG, logoSVG } from './art.js';
import { gameIcon } from './icons.js';
import { Stage } from './engine.js';
import { sfx } from './audio.js';
import { startSky } from './sky.js';
import { initExtras, track, trackVisit, signatureHTML, showBoard, syncBoard, dailyCardHTML, dailyPick, checkDaily, streak, boardCardHTML, certificatesHTML, showCertificate, SITE, FULL } from './extras.js';

import bird from './games/bird.js';
import water from './games/water.js';
import magnet from './games/magnet.js';
import circuit from './games/circuit.js';
import light from './games/light.js';
import energy from './games/energy.js';

const isUnlocked = (id, i) => !LOCK_LEVELS || inOrder(id, i);
const MODULES = { bird, water, magnet, circuit, light, energy };
const $ = sel => document.querySelector(sel);
const meta = id => GAMES.find(g => g.id === id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const RATINGS_API = '/api/ratings';

const stage = new Stage($('#stage'));
const sky = startSky($('#sky'));
window.hpu = { stage };   // handy for debugging from the console
let session = null;
let introNext = false;   // show the game's explanation as soon as its screen opens

// ---------------- routing ----------------
// The current route lives in memory so navigation also works inside embedded frames
// (claude.ai artifacts) where hash changes may not reach the page; the URL is kept in sync when allowed.
let current = location.hash;

function route() {
  const parts = current.replace(/^#\/?/, '').split('/');
  closeModal();
  if (!store.profile && parts[0] !== 'welcome') return go('#/welcome');
  if (parts[0] === 'welcome') return showWelcome();
  if (parts[0] === 'rate') return showRate();
  if (parts[0] === 'g' && MODULES[parts[1]]) { introNext = true; return go(`#/p/${parts[1]}/${nextLevel(parts[1])}`); }
  if (parts[0] === 'p' && MODULES[parts[1]]) {
    const i = parseInt(parts[2], 10) || 0;
    if (i < MODULES[parts[1]].levels.length && isUnlocked(parts[1], i)) return showGame(parts[1], i);
    introNext = true;
    return go(`#/p/${parts[1]}/${nextLevel(parts[1])}`);
  }
  showHome();
}
function go(hash) {
  if (hash !== current) {
    current = hash;
    try { history.pushState(null, '', hash); } catch { /* frame without history access */ }
  }
  route();
}
window.addEventListener('popstate', () => { current = location.hash; route(); });
window.addEventListener('hashchange', () => { if (location.hash !== current) { current = location.hash; route(); } });

function nextLevel(id) {
  const n = MODULES[id].levels.length;
  for (let i = 0; i < n; i++) if (!levelStars(id, i) && isUnlocked(id, i)) return i;
  return 0;
}

// Circular colour wipe from the tap point with the game's icon, then route behind it.
let wiping = false;
function wipeTo(hash, gameId, ev) {
  if (wiping) return;
  const w = $('#wipe'), g = meta(gameId);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return go(hash);
  wiping = true;
  w.style.setProperty('--x', `${ev?.clientX ?? innerWidth / 2}px`);
  w.style.setProperty('--y', `${ev?.clientY ?? innerHeight / 2}px`);
  w.style.background = `radial-gradient(circle at 50% 45%, ${g.color}, ${CRYSTAL_COLORS[g.crystal]}cc 55%, #1d0d5c)`;
  w.innerHTML = `<div><div class="wipe-icon">${gameIcon(gameId)}</div><div class="wipe-title">${esc(L(g.title))}</div></div>`;
  w.className = 'in';
  setTimeout(() => {
    go(hash);
    w.className = 'out';
    setTimeout(() => { w.className = ''; w.innerHTML = ''; wiping = false; }, 520);
  }, 470);
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  sky.pause(id === 'screen-game');
  if (id !== 'screen-game') { stage.stop(); session = null; }
  window.scrollTo(0, 0);
}

const ageText = () => T(`Ages ${AGE_RATING.min}–${AGE_RATING.max} and up`, `للأعمار من ${AGE_RATING.min} إلى ${AGE_RATING.max} سنة وما فوق`);

// ---------------- welcome: name, age, role ----------------
function showWelcome() {
  showScreen('screen-welcome');
  const p = store.profile || {};
  const ages = Array.from({ length: AGE_RATING.max - AGE_RATING.min + 1 }, (_, i) => AGE_RATING.min + i);
  const other = getLang() === 'ar' ? 'en' : 'ar';
  $('#screen-welcome').innerHTML = `
  <div class="page-wrap" style="padding-top:72px">
    <form class="page-card glass" id="w-form" novalidate>
      ${owlSVG('guide')}
      <h1 class="display gradient-text">${T('Welcome, explorer!', 'أهلًا بك أيها المستكشف!')}</h1>
      <p class="lead">${T('Tell Nour the owl a little about you, then step into the Happy Physics Universe.', 'عرّف البومة «نور» بنفسك، ثم ادخل إلى كون الفيزياء السعيد.')}</p>
      <div class="badges" style="justify-content:center"><span class="badge">🎈 ${ageText()}</span></div>

      <div class="field">
        <label for="w-name">${T('Your name', 'اسمك')}</label>
        <input id="w-name" class="text-input" maxlength="40" autocomplete="name" value="${esc(p.name || '')}" placeholder="${T('Write your name', 'اكتب اسمك')}">
      </div>
      <div class="field">
        <span class="label" id="w-age-l">${T('Your age', 'عمرك')}</span>
        <div class="chips age-chips" role="radiogroup" aria-labelledby="w-age-l">
          ${ages.map(a => `<button type="button" class="chip" data-age="${a}" role="radio" aria-checked="${p.age === a}">${a}</button>`).join('')}
          <button type="button" class="chip" data-age="${AGE_RATING.max + 1}" role="radio" aria-checked="${p.age === AGE_RATING.max + 1}">${T(`${AGE_RATING.max}+`, `أكبر من ${AGE_RATING.max}`)}</button>
        </div>
      </div>
      <div class="field">
        <span class="label" id="w-role-l">${T('You are…', 'أنت…')}</span>
        <div class="chips" role="radiogroup" aria-labelledby="w-role-l">
          ${ROLES.map(r => `<button type="button" class="chip" data-role="${r.id}" role="radio" aria-checked="${p.role === r.id}"><span class="ic">${r.icon}</span>${L(r.name)}</button>`).join('')}
        </div>
      </div>
      <p class="note-small">🔒 ${T('Your name is not shown inside the games. It only appears on your own certificates and is sent with your rating to the game owner.', 'اسمك لا يظهر داخل الألعاب. يظهر فقط في شهاداتك، ويُرسل مع تقييمك إلى صاحب اللعبة.')}</p>
      <div class="form-error" id="w-err" aria-live="polite"></div>
      <div class="page-actions">
        <button type="submit" class="btn magic big">✨ ${T('Enter the universe', 'ادخل إلى الكون')}</button>
        <button type="button" class="btn ghost small" id="w-lang" lang="${other}">${t('btn.lang')}</button>
      </div>
    </form>
    <footer class="home-foot">${signatureHTML('big')}</footer>
  </div>`;
  const pick = { age: p.age || null, role: p.role || null };
  const sync = () => {
    document.querySelectorAll('[data-age]').forEach(b => { const on = +b.dataset.age === pick.age; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
    document.querySelectorAll('[data-role]').forEach(b => { const on = b.dataset.role === pick.role; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
  };
  sync();
  document.querySelectorAll('[data-age]').forEach(b => b.onclick = () => { pick.age = +b.dataset.age; sfx('click'); sync(); });
  document.querySelectorAll('[data-role]').forEach(b => b.onclick = () => { pick.role = b.dataset.role; sfx('click'); sync(); });
  $('#w-lang').onclick = () => { setLang(getLang() === 'ar' ? 'en' : 'ar'); showWelcome(); };
  $('#w-form').onsubmit = e => {
    e.preventDefault();
    const name = $('#w-name').value.trim();
    const err = !name ? T('Please write your name.', 'اكتب اسمك من فضلك.') : !pick.age ? T('Please choose your age.', 'اختر عمرك من فضلك.') : !pick.role ? T('Please choose who you are.', 'اختر من أنت من فضلك.') : '';
    $('#w-err').textContent = err;
    if (err) { sfx('bad'); return; }
    const first = !store.profile;
    store.profile = { name: name.slice(0, 40), age: pick.age, role: pick.role };
    store.save();
    announceEntry();
    sfx('ding');
    go('#/');
    if (first && !store.storySeen) showStory();
  };
}

// ---------------- portal (home) ----------------
function crystalsHTML() {
  return GAMES.map(g => {
    const done = isGameComplete(g.id, MODULES[g.id].levels.length);
    return crystalSVG(CRYSTAL_COLORS[g.crystal], 'crystal' + (done ? '' : ' off'));
  }).join('');
}

function maxStars() { return GAMES.reduce((a, g) => a + MODULES[g.id].levels.length * 3, 0); }

function showHome() {
  showScreen('screen-home');
  const restored = GAMES.filter(g => isGameComplete(g.id, MODULES[g.id].levels.length)).length;
  const other = getLang() === 'ar' ? 'en' : 'ar';
  $('#screen-home').innerHTML = `
  <div class="home-wrap">
    <header class="topbar glass">
      <div class="logo">${logoSVG()}<div><h1 class="display gradient-text">${t('app.name')}</h1><small>${t('app.tagline')}</small></div></div>
      <span class="pill" title="${t('home.crystals')}"><span class="crystal-row">${crystalsHTML()}</span></span>
      <span class="pill">⭐ ${totalStars()} / ${maxStars()}</span>
      <button class="icon-btn" id="h-rate" aria-label="${T('Rate the game', 'قيّم اللعبة')}" title="${T('Rate the game', 'قيّم اللعبة')}">⭐</button>
      <button class="icon-btn" id="h-ach" aria-label="${t('btn.achievements')}" title="${t('btn.achievements')}">🏆</button>
      <button class="icon-btn" id="h-story" aria-label="${t('btn.story')}" title="${t('btn.story')}">📖</button>
      <button class="icon-btn" id="h-profile" aria-label="${T('My profile', 'ملفي')}" title="${T('My profile', 'ملفي')}">👤</button>
      <button class="icon-btn" id="h-sound" aria-label="${t('btn.sound')}" title="${t('btn.sound')}">${store.settings.sound ? '🔊' : '🔇'}</button>
      <button class="btn small ghost" id="h-lang" lang="${other}">${t('btn.lang')}</button>
    </header>
    <section class="hero glass">
      ${owlSVG()}
      <div style="position:relative;z-index:1">
        <h2 class="display gradient-text">${t('home.heroTitle')}</h2>
        <p>${t('home.heroText')}</p>
        <div class="badges"><span class="badge">🎈 ${ageText()}</span><span class="badge">🧪 ${T('6 physics worlds • 30 levels', '6 عوالم فيزيائية • 30 مرحلة')}</span></div>
      </div>
      <div class="hero-progress">
        <div style="font-weight:800;margin-bottom:6px">${t('home.progress')}: ${restored}/6</div>
        <div class="bar"><i style="width:${(restored / 6) * 100}%"></i></div>
      </div>
    </section>
    <h2 class="section-title display">🎮 ${T('Pick a world', 'اختر عالمك')}</h2>
    <section class="tiles">
      ${GAMES.map((g, i) => tileHTML(g, i)).join('')}
    </section>
    <h2 class="section-title display">✨ ${T('Challenges & rewards', 'التحديات والجوائز')}</h2>
    <section class="features ${FULL ? '' : 'two'}">
      ${dailyCardHTML()}
      ${boardCardHTML()}
      ${certificatesHTML()}
    </section>
    <h2 class="section-title display" id="reviews-title" hidden>💬 ${T('What players say', 'آراء اللاعبين')}</h2>
    <section class="reviews glass" id="reviews" hidden aria-labelledby="reviews-title"></section>
    <section class="rate-cta glass">
      <div><h3 class="display">⭐ ${T('Tell us what you think!', 'أخبرنا برأيك!')}</h3><p>${T('Answer a few quick questions and rate the games with stars.', 'أجب عن أسئلة سريعة وقيّم الألعاب بالنجوم.')}</p></div>
      <button class="btn mint" id="h-rate2">${store.rated ? T('Rate again', 'قيّم مرة أخرى') : T('Rate the game', 'قيّم اللعبة')}</button>
    </section>
    <footer class="home-foot">${signatureHTML('big')}<p>${t('home.footer')}</p></footer>
  </div>`;

  document.querySelectorAll('.tile').forEach(tile => tile.onclick = ev => openGame(tile.dataset.id, ev));
  $('#h-lang').onclick = () => { setLang(getLang() === 'ar' ? 'en' : 'ar'); showHome(); };
  $('#h-sound').onclick = () => { store.settings.sound = !store.settings.sound; store.save(); showHome(); sfx('click'); };
  $('#h-story').onclick = showStory;
  $('#h-ach').onclick = showAchievements;
  $('#h-profile').onclick = () => go('#/welcome');
  $('#h-rate').onclick = $('#h-rate2').onclick = () => { sfx('click'); go('#/rate'); };
  $('#f-daily')?.addEventListener('click', ev => { const p = dailyPick(); sfx('click'); wipeTo(`#/p/${p.id}/${p.level}`, p.id, ev); });
  $('#f-board').onclick = () => { sfx('click'); showBoard(); };
  document.querySelectorAll('[data-cert]').forEach(b => b.onclick = () => { sfx('click'); showCertificate(b.dataset.cert); });
  loadReviews();
}

// Poki-style tile: the art only; the name shows on hover/focus and is read by screen readers.
function tileHTML(g, i) {
  const n = MODULES[g.id].levels.length;
  const stars = gameStars(g.id);
  const done = isGameComplete(g.id, n);
  const name = `${L(g.title)} — ${L(g.lesson)}`;
  return `
  <button class="tile ${i < 2 ? 'featured' : ''}" data-id="${g.id}" style="--glow:${g.color};animation-delay:${i * 70}ms" aria-label="${esc(name)}" title="${esc(name)}">
    ${gameIcon(g.id)}
    ${stars ? `<span class="tile-badge">★ ${stars}/${n * 3}</span>` : ''}
    ${done ? '<span class="tile-crystal">💎</span>' : ''}
    <span class="tile-name">${esc(L(g.title))}</span>
  </button>`;
}

function openGame(id, ev) {
  sfx('click');
  introNext = true;
  wipeTo(`#/p/${id}/${nextLevel(id)}`, id, ev);
}

// ---------------- game screen ----------------
function showGame(id, levelIndex) {
  showScreen('screen-game');
  applyDir();
  const g = meta(id), mod = MODULES[id];
  const lv = mod.levels[levelIndex];
  $('#g-title').textContent = L(g.title);
  $('#g-sub').textContent = `${t('lv.level')} ${levelIndex + 1}: ${L(lv.name)} • ${L(g.lesson)}`;
  $('#g-formulas').innerHTML = mod.formulas.map(f => `<div class="formula"><div class="expr">${f.expr}</div><div class="lbl">${L(f.label)}</div></div>`).join('');
  const other = getLang() === 'ar' ? 'en' : 'ar';
  $('#g-terms').innerHTML = mod.terms.map(tm => `<span class="term">${L(tm)} <small>· ${tm[other]}</small></span>`).join('');
  $('#g-back').onclick = () => go('#/');
  $('#g-restart').onclick = () => { sfx('click'); startLevel(id, levelIndex, (session?.attempt || 1) + 1); };
  $('#g-help').onclick = () => showGameIntro(id, levelIndex);
  wireTeacher();

  if (!store.played[id]) { store.played[id] = true; store.save(); checkAchievements(); }
  startLevel(id, levelIndex, 1);
  if (introNext || !store.tutorialSeen[id]) {
    introNext = false;
    store.tutorialSeen[id] = true;
    store.save();
    showGameIntro(id, levelIndex);
  }
}

// The game's explanation, shown right after tapping its tile: how to play, the levels, and Start.
function showGameIntro(id, levelIndex) {
  const mod = MODULES[id], g = meta(id);
  const other = getLang() === 'ar' ? 'en' : 'ar';
  const m = openModal(`
    <div class="intro-icon">${gameIcon(id)}</div>
    <h2>${L(g.title)}</h2>
    <p class="lesson-line">${L(g.lesson)} • <span lang="${other}">${g.lesson[other]}</span></p>
    <ol class="tut-steps">${mod.tutorial.map(s => `<li><span>${L(s)}</span></li>`).join('')}</ol>
    <h3 style="margin:16px 0 0;color:#4a1fb8">${t('lv.choose')}</h3>
    <div class="level-chips">
      ${mod.levels.map((lv, i) => {
        const open = isUnlocked(id, i), s = levelStars(id, i);
        return `<button class="level-chip ${i === levelIndex ? 'on' : ''} ${open ? '' : 'locked'}" data-i="${i}" title="${esc(L(lv.name))}" aria-label="${t('lv.level')} ${i + 1}: ${esc(L(lv.name))}">
          <span class="num">${open ? i + 1 : '🔒'}</span><span class="st">${'★'.repeat(s)}${'☆'.repeat(3 - s)}</span></button>`;
      }).join('')}
    </div>
    <div class="actions"><button class="btn mint big" id="t-ok">▶ ${t('btn.start')}</button></div>`, { closable: true });
  let chosen = levelIndex;
  const startBtn = m.querySelector('#t-ok');
  const label = () => { startBtn.textContent = `▶ ${t('lv.level')} ${chosen + 1}: ${L(mod.levels[chosen].name)}`; };
  label();
  m.querySelectorAll('.level-chip').forEach(b => b.onclick = () => {
    const i = +b.dataset.i;
    if (!isUnlocked(id, i)) { sfx('bad'); return; }
    chosen = i;
    m.querySelectorAll('.level-chip').forEach(x => x.classList.toggle('on', +x.dataset.i === i));
    label();
    sfx('click');
  });
  startBtn.onclick = () => {
    closeModal();
    if (chosen !== levelIndex || session?.id !== id) go(`#/p/${id}/${chosen}`);
  };
}

// Teacher mode: bigger equations and readouts for the class screen, plus pause and slow motion.
function wireTeacher() {
  const on = FULL && !!store.settings.teacher;   // teacher mode is part of the second (full) link only
  document.body.classList.toggle('teacher', on);
  stage.paused = false;
  stage.speed = on ? (store.settings.speed || 1) : 1;
  const teach = $('#g-teach'), pause = $('#g-pause'), speed = $('#g-speed');
  teach.hidden = !FULL;
  teach.classList.toggle('on', on);
  teach.title = teach.ariaLabel = on ? T('Teacher mode: on', 'وضع المعلم: مفعّل') : T('Teacher mode', 'وضع المعلم');
  pause.textContent = '⏸';
  pause.title = T('Pause', 'إيقاف مؤقت');
  speed.textContent = stage.speed === 1 ? '1×' : '½×';
  speed.title = T('Slow motion', 'حركة بطيئة');
  teach.onclick = () => {
    store.settings.teacher = !store.settings.teacher;
    store.save();
    sfx('click');
    wireTeacher();
    stage.resize?.();
    showToast(store.settings.teacher ? '👩‍🏫' : '🎮', store.settings.teacher ? T('Teacher mode on', 'وضع المعلم مفعّل') : T('Teacher mode off', 'وضع المعلم متوقف'),
      store.settings.teacher ? T('Bigger equations, pause and slow motion', 'معادلات أكبر، وإيقاف مؤقت، وحركة بطيئة') : '');
  };
  pause.onclick = () => { stage.paused = !stage.paused; pause.textContent = stage.paused ? '▶' : '⏸'; pause.classList.toggle('on', stage.paused); sfx('click'); };
  speed.onclick = () => {
    store.settings.speed = stage.speed === 1 ? 0.5 : 1;
    store.save();
    stage.speed = store.settings.speed;
    speed.textContent = stage.speed === 1 ? '1×' : '½×';
    speed.classList.toggle('on', stage.speed !== 1);
    sfx('click');
  };
  speed.classList.toggle('on', stage.speed !== 1);
}

function showToast(icon, title, sub = '') {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span class="ic">${icon}</span><div>${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ''}</div>`;
  $('#toast-root').appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function startLevel(id, levelIndex, attempt) {
  closeModal();
  track('start', { game: id, level: levelIndex });
  if (stage.paused) { stage.paused = false; $('#g-pause').textContent = '⏸'; $('#g-pause').classList.remove('on'); }
  const mod = MODULES[id];
  $('#g-controls').innerHTML = '';
  $('#g-vars').innerHTML = '';
  $('#g-hint').textContent = '';
  $('#g-banner').className = 'stage-banner';
  $('#g-card').hidden = true;
  session = { id, levelIndex, attempt, ended: false, varsAt: 0 };
  const api = makeApi(session);
  stage.start(mod.create(api, levelIndex));
}

function makeApi(s) {
  const mod = MODULES[s.id];
  const controls = $('#g-controls');
  let bannerTimer = 0;
  return {
    level: mod.levels[s.levelIndex],
    levelIndex: s.levelIndex,
    attempt: s.attempt,
    sfx,
    setVars(rows, force = false) {
      const now = performance.now();
      if (!force && now - s.varsAt < 100) return;
      s.varsAt = now;
      $('#g-vars').innerHTML = rows.map(r =>
        `<tr class="${r.hl ? 'hl' : ''}"><td class="sym">${r.sym}</td><td>${esc(r.name)}</td><td class="val">${r.value}${r.unit ? ' ' + r.unit : ''}</td></tr>`).join('');
    },
    hint(text) {
      const h = $('#g-hint');
      h.textContent = text || '';
      clearTimeout(s.hintTimer);
      if (text) s.hintTimer = setTimeout(() => { if (h.textContent === text) h.textContent = ''; }, 7000);
    },
    banner(text, bad = false, ms = 1400) {
      const b = $('#g-banner');
      b.textContent = text;
      b.className = 'stage-banner show' + (bad ? ' bad' : '');
      clearTimeout(bannerTimer);
      bannerTimer = setTimeout(() => { b.className = 'stage-banner' + (bad ? ' bad' : ''); }, ms);
    },
    // Card in the middle of the stage with worked equations. lines: [{ text, kind: 'bad' | 'good' | 'head …' }]
    card({ title, lines = [], hint = '', good = false }) {
      const c = $('#g-card');
      c.className = 'stage-card' + (good ? ' good' : '');
      c.innerHTML = `<h4>${esc(title)}</h4>${lines.map(l => `<div class="eq ${l.kind || ''}">${esc(l.text)}</div>`).join('')}` +
        (hint ? `<p class="hint">💡 ${esc(hint)}</p>` : '') + `<div class="close-note">${esc(T('Tap to close', 'اضغط للإغلاق'))}</div>`;
      c.hidden = false;
      c.onclick = () => { c.hidden = true; };
    },
    hideCard() { $('#g-card').hidden = true; },
    slider({ label, min, max, step, value, unit = '', digits = 1, onInput }) {
      const row = document.createElement('div');
      row.className = 'ctl-row';
      row.innerHTML = `<label><span>${esc(label)}</span><b></b></label><input type="range" dir="ltr" min="${min}" max="${max}" step="${step}" value="${value}" aria-label="${esc(label)}">`;
      const input = row.querySelector('input'), out = row.querySelector('b');
      const show = v => { out.textContent = `${(+v).toFixed(digits)} ${unit}`; };
      show(value);
      input.addEventListener('input', () => { show(input.value); onInput(+input.value); });
      controls.appendChild(row);
      return { set(v) { input.value = v; show(v); }, el: row, input };
    },
    buttons(list) {
      const row = document.createElement('div');
      row.className = 'ctl-btns';
      const els = list.map(b => {
        const el = document.createElement('button');
        el.className = 'btn small ' + (b.cls || '');
        el.textContent = b.label;
        el.onclick = () => { sfx('click'); b.onClick(); };
        row.appendChild(el);
        return el;
      });
      controls.appendChild(row);
      return els;
    },
    seg({ label, options, value, onChange }) {
      const row = document.createElement('div');
      row.className = 'ctl-row';
      row.innerHTML = `<label><span>${esc(label)}</span></label><div class="seg" role="group" aria-label="${esc(label)}"></div>`;
      const box = row.querySelector('.seg');
      const btns = options.map(o => {
        const b = document.createElement('button');
        b.textContent = o.label;
        b.onclick = () => { sfx('click'); set(o.value); onChange(o.value); };
        box.appendChild(b);
        return b;
      });
      const set = v => btns.forEach((b, i) => { b.classList.toggle('on', options[i].value === v); b.setAttribute('aria-pressed', options[i].value === v); });
      set(value);
      controls.appendChild(row);
      return { set, el: row };
    },
    check({ label, value, onChange }) {
      const row = document.createElement('label');
      row.className = 'check';
      row.innerHTML = `<input type="checkbox" ${value ? 'checked' : ''}> <span>${esc(label)}</span>`;
      row.querySelector('input').addEventListener('change', e => onChange(e.target.checked));
      controls.appendChild(row);
      return row;
    },
    note(text) {
      const p = document.createElement('p');
      p.style.cssText = 'margin:0;font-size:.88rem;color:var(--ink-soft);font-weight:600';
      p.textContent = text;
      controls.appendChild(p);
      return p;
    },
    win(stars) {
      if (s.ended || session !== s) return;
      s.ended = true;
      track('win', { game: s.id, level: s.levelIndex, stars });
      sfx('win');
      this.banner(T('Success!', 'نجحت!'), false, 900);
      setTimeout(() => { if (session === s) showResult(s, stars); }, 1000);
    },
    lose(msg) {
      if (s.ended || session !== s) return;
      s.ended = true;
      track('fail', { game: s.id, level: s.levelIndex });
      sfx('lose');
      this.banner(T('Oops!', 'أوه!'), true, 900);
      setTimeout(() => { if (session === s) showLose(s, msg); }, 1000);
    }
  };
}

// ---------------- results ----------------
function showResult(s, stars) {
  const { id, levelIndex } = s;
  const mod = MODULES[id], g = meta(id);
  const n = mod.levels.length;
  const wasComplete = isGameComplete(id, n);
  setLevelStars(id, levelIndex, stars);
  const nowComplete = isGameComplete(id, n);
  const lv = mod.levels[levelIndex];
  const q = mod.quiz[levelIndex];
  const hasNext = levelIndex + 1 < n;
  const allCrystals = GAMES.every(x => isGameComplete(x.id, MODULES[x.id].levels.length));
  const wins = Object.values(store.stars).flat().filter(x => x > 0).length;
  const nudge = !store.rated && !store.ratePrompted && (wins >= 3 || nowComplete);
  const dailyDone = checkDaily(id, levelIndex);
  syncBoard();

  const body = `
    ${dailyDone ? `<div class="daily-win">📅 ${T('Daily challenge complete!', 'أنجزت تحدي اليوم!')} <b>🔥 ${streak()}</b> <small>${T('days in a row', 'يوم متتالٍ')}</small></div>` : ''}
    ${!wasComplete && nowComplete ? `<div class="crystal-win">${crystalSVG(CRYSTAL_COLORS[g.crystal], '')}<h3 style="margin:4px 0">${t('res.crystal')}</h3>
      <button class="btn magic small" id="r-cert">🎓 ${T('Get your certificate', 'احصل على شهادتك')}</button></div>` : ''}
    <h2>${t('res.win')}</h2>
    <div class="big-stars">${[0, 1, 2].map(i => `<span class="${i < stars ? 'on' : ''}" style="animation-delay:${.15 + i * .2}s">★</span>`).join('')}</div>
    <div class="learn-card"><h4>💡 ${t('res.learned')}</h4><p>${L(lv.learn)}</p></div>
    ${q ? quizHTML(q) : ''}
    ${nudge ? `<div class="rate-nudge"><b>⭐ ${T('Enjoying the universe? Tell us with a few stars!', 'هل أعجبك الكون؟ أخبرنا ببعض النجوم!')}</b><div style="margin-top:8px"><button class="btn magic small" id="r-rate">${T('Rate the game', 'قيّم اللعبة')}</button></div></div>` : ''}
    <div class="actions">
      ${hasNext ? `<button class="btn mint" id="r-next">${t('btn.next')} ⟶</button>` : ''}
      <button class="btn ghost" id="r-replay">↻ ${t('btn.replay')}</button>
      <button class="btn ghost" id="r-levels">${t('btn.levels')}</button>
    </div>`;
  const m = openModal(body);
  for (let i = 0; i < stars; i++) setTimeout(() => sfx('star'), 250 + i * 200);
  if (q) wireQuiz(m, q, `${id}:${levelIndex}`);
  if (nudge) { store.ratePrompted = true; store.save(); }
  m.querySelector('#r-rate')?.addEventListener('click', () => go('#/rate'));
  m.querySelector('#r-cert')?.addEventListener('click', () => showCertificate(id));
  m.querySelector('#r-next')?.addEventListener('click', ev => { closeModal(); wipeTo(`#/p/${id}/${levelIndex + 1}`, id, ev); });
  m.querySelector('#r-replay').onclick = () => startLevel(id, levelIndex, 1);
  m.querySelector('#r-levels').onclick = () => showGameIntro(id, hasNext ? levelIndex + 1 : levelIndex);
  checkAchievements();
  if (allCrystals && !store.endingSeen) {
    store.endingSeen = true;
    store.save();
    m.querySelector('.actions').insertAdjacentHTML('beforebegin',
      `<div class="crystal-win" style="margin-top:12px"><h3>👑 ${t('res.universe')}</h3><p style="margin:0">${t('ending.text')}</p>
        <button class="btn magic small" id="r-grand" style="margin-top:8px">👑 ${T('Grand certificate', 'الشهادة الكبرى')}</button></div>`);
    m.querySelector('#r-grand').onclick = () => showCertificate('all');
  }
}

function quizHTML(q) {
  return `<div class="quiz"><h4>🧠 ${t('res.quiz')}</h4><p style="margin:0 0 8px;font-weight:700">${L(q.q)}</p>
    <div class="opts">${q.options.map((o, i) => `<button data-i="${i}">${L(o)}</button>`).join('')}</div>
    <div class="explain" hidden></div></div>`;
}

function wireQuiz(m, q, key) {
  const btns = m.querySelectorAll('.quiz .opts button');
  btns.forEach(b => b.onclick = () => {
    const i = +b.dataset.i;
    btns.forEach((x, j) => { x.disabled = true; if (j === q.answer) x.classList.add('right'); });
    const ok = i === q.answer;
    if (!ok) b.classList.add('wrong');
    sfx(ok ? 'ding' : 'bad');
    const ex = m.querySelector('.quiz .explain');
    ex.hidden = false;
    ex.textContent = (ok ? t('res.right') : t('res.wrong')) + L(q.explain);
    if (ok && !store.quiz[key]) { store.quiz[key] = true; store.save(); checkAchievements(); }
  });
}

function showLose(s, msg) {
  const m = openModal(`
    <h2>${t('res.lose')}</h2>
    <div class="learn-card" style="border-color:var(--coral)"><p>${esc(msg)}</p></div>
    <div class="actions">
      <button class="btn mint" id="l-retry">↻ ${t('btn.retry')}</button>
      <button class="btn ghost" id="l-levels">${t('btn.levels')}</button>
    </div>`);
  m.querySelector('#l-retry').onclick = () => startLevel(s.id, s.levelIndex, s.attempt + 1);
  m.querySelector('#l-levels').onclick = () => showGameIntro(s.id, s.levelIndex);
}

// ---------------- rating page ----------------
function showRate() {
  showScreen('screen-rate');
  const p = store.profile;
  const role = ROLES.find(r => r.id === p.role);
  const answers = {};
  let fav = '';
  $('#screen-rate').innerHTML = `
  <div class="page-wrap" style="padding-top:72px">
    <form class="page-card glass" id="r-form" novalidate>
      ${owlSVG('guide')}
      <h1 class="display gradient-text">${T('Rate the game', 'قيّم اللعبة')}</h1>
      <p class="lead">${T('Your opinion helps make the universe even better. Tap the stars!', 'رأيك يساعدنا نجعل الكون أجمل. اضغط على النجوم!')}</p>
      ${RATING_QUESTIONS.map(q => `
        <div class="q-card">
          <div class="q"><span>${q.icon}</span><span id="rq-${q.id}">${L(q.q)}</span></div>
          <div class="stars-input" role="radiogroup" aria-labelledby="rq-${q.id}">
            ${[1, 2, 3, 4, 5].map(v => `<button type="button" class="star-btn" data-q="${q.id}" data-v="${v}" role="radio" aria-checked="false" aria-label="${v}">★</button>`).join('')}
          </div>
        </div>`).join('')}
      <div class="q-card">
        <div class="q"><span>🏅</span><span id="rq-fav">${T('Which game did you like most?', 'أي لعبة أعجبتك أكثر؟')}</span></div>
        <div class="fav-grid" role="radiogroup" aria-labelledby="rq-fav" style="margin-top:10px">
          ${GAMES.map(g => `<button type="button" class="fav" data-fav="${g.id}" role="radio" aria-checked="false" aria-label="${esc(L(g.title))}" title="${esc(L(g.title))}">${gameIcon(g.id)}</button>`).join('')}
        </div>
      </div>
      <div class="field">
        <label for="r-comment">💬 ${T('Anything else? (optional)', 'هل لديك ملاحظة؟ (اختياري)')}</label>
        <textarea id="r-comment" class="text-input" maxlength="500" placeholder="${T('Write your note here', 'اكتب ملاحظتك هنا')}"></textarea>
      </div>
      <p class="note-small">📨 ${T('Sent as', 'يُرسل باسم')}: <b>${esc(p.name)}</b> • ${T('age', 'العمر')} ${p.age > AGE_RATING.max ? `${AGE_RATING.max}+` : p.age} • ${role ? `${role.icon} ${L(role.name)}` : ''} — <a href="#/welcome" id="r-edit" style="color:var(--gold)">${T('change', 'تغيير')}</a></p>
      <div class="form-error" id="r-err" aria-live="polite"></div>
      <div class="page-actions">
        <button type="submit" class="btn magic big" id="r-send">🚀 ${T('Send my rating', 'أرسل تقييمي')}</button>
        <button type="button" class="btn ghost small" id="r-back">${t('btn.home')}</button>
      </div>
    </form>
  </div>`;

  const paint = () => {
    document.querySelectorAll('.star-btn').forEach(b => {
      const on = (answers[b.dataset.q] || 0) >= +b.dataset.v;
      b.classList.toggle('on', on);
      b.setAttribute('aria-checked', answers[b.dataset.q] === +b.dataset.v);
    });
    document.querySelectorAll('.fav').forEach(b => { const on = b.dataset.fav === fav; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
  };
  document.querySelectorAll('.star-btn').forEach(b => b.onclick = () => { answers[b.dataset.q] = +b.dataset.v; sfx('star'); paint(); });
  document.querySelectorAll('.fav').forEach(b => b.onclick = () => { fav = b.dataset.fav; sfx('click'); paint(); });
  $('#r-back').onclick = () => go('#/');
  $('#r-edit').onclick = e => { e.preventDefault(); go('#/welcome'); };
  $('#r-form').onsubmit = async e => {
    e.preventDefault();
    const missing = RATING_QUESTIONS.filter(q => !answers[q.id]);
    if (missing.length) { $('#r-err').textContent = T('Please give stars to every question.', 'من فضلك أعطِ نجومًا لكل سؤال.'); sfx('bad'); return; }
    $('#r-err').textContent = '';
    const entry = { name: p.name, age: p.age, role: p.role, answers, favorite: fav, comment: $('#r-comment').value.trim().slice(0, 500), lang: getLang(), stars: totalStars(), device: await deviceInfo(), site: SITE };
    const btn = $('#r-send');
    btn.disabled = true;
    btn.textContent = T('Sending…', 'جارٍ الإرسال…');
    const sent = await sendRating(entry);
    store.rated = true;
    if (!sent) store.pending = [...(store.pending || []), entry];
    store.save();
    showThanks(sent);
  };
}

// Tell the owner (Telegram) that a player entered: once per visit, as soon as we know their name.
function announceEntry() {
  if (!store.profile) return;
  try { if (sessionStorage.getItem('hpu-entered')) return; sessionStorage.setItem('hpu-entered', '1'); } catch { /* still announce */ }
  deviceInfo().then(device => track('join', { ...store.profile, device }));
}

// Extra device details the server cannot read from the request: screen size, touch, and the phone model where the browser shares it.
async function deviceInfo() {
  const info = { screen: `${Math.round(screen.width)}x${Math.round(screen.height)}`, touch: (navigator.maxTouchPoints || 0) > 0 };
  try {
    const hi = await navigator.userAgentData?.getHighEntropyValues?.(['model']);
    if (hi?.model) info.model = String(hi.model).slice(0, 40);
  } catch { /* not shared by this browser */ }
  return info;
}

// Anonymous reviews for the home page: averages and recent notes, never names.
async function loadReviews() {
  const box = $('#reviews');
  if (!box) return;
  try {
    const r = await fetch(`${RATINGS_API}?view=public`);
    if (!r.ok) throw new Error(r.status);
    const d = await r.json();
    if (!$('#reviews')) return;
    if (!d.count) {
      box.innerHTML = `<p class="reviews-empty">${T('No reviews yet. Be the first to rate!', 'لا توجد آراء بعد. كن أول من يقيّم!')}</p>`;
      box.hidden = false; $('#reviews-title').hidden = false;
      return;
    }
    const starRow = v => [1, 2, 3, 4, 5].map(i => `<i class="${v >= i - 0.25 ? 'on' : v >= i - 0.75 ? 'half' : ''}">★</i>`).join('');
    const role = id => ROLES.find(x => x.id === id);
    const age = a => a > AGE_RATING.max ? `${AGE_RATING.max}+` : a;
    box.innerHTML = `
      <div class="reviews-head">
        <div class="reviews-score"><b>${d.avg.toFixed(1)}</b><span class="rstars" aria-hidden="true">${starRow(d.avg)}</span>
          <small>${T(`${d.count} ratings`, `${d.count} تقييم`)}</small></div>
        <div class="reviews-qs">${RATING_QUESTIONS.map(q => `
          <div class="rq"><span>${q.icon} ${L(q.q)}</span><div class="bar"><i style="width:${(d.questions[q.id] / 5) * 100}%"></i></div><b>${d.questions[q.id].toFixed(1)}</b></div>`).join('')}
        </div>
      </div>
      <div class="reviews-row">${d.recent.map(v => {
        const ro = role(v.role);
        return `<article class="review">
          <div class="review-top"><span class="avatar" aria-hidden="true">${ro ? ro.icon : '✨'}</span>
            <span>${ro ? esc(L(ro.name)) : ''} • ${T('age', 'العمر')} ${esc(age(v.age))}</span></div>
          <div class="rstars" aria-label="${v.score} / 5">${starRow(v.score)}</div>
          ${v.comment ? `<p>${esc(v.comment)}</p>` : ''}
          ${v.favorite && meta(v.favorite) ? `<div class="review-fav">${T('Favorite', 'المفضّلة')}: ${gameIcon(v.favorite)}<span>${esc(L(meta(v.favorite).title))}</span></div>` : ''}
        </article>`;
      }).join('')}</div>`;
    box.hidden = false; $('#reviews-title').hidden = false;
  } catch {
    box.hidden = true;   // no server here (e.g. an embedded preview): just leave the section out
    $('#reviews-title')?.setAttribute('hidden', '');
  }
}

async function sendRating(entry) {
  try {
    const r = await fetch(RATINGS_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) });
    return r.ok;
  } catch { return false; }
}

// Ratings that could not be sent (offline, or the database was not set up yet) are retried on the next visit.
async function flushPending() {
  if (!store.pending?.length) return;
  const left = [];
  for (const e of store.pending) if (!(await sendRating(e))) left.push(e);
  store.pending = left;
  store.save();
}

function showThanks(sent) {
  sfx('win');
  $('#screen-rate').innerHTML = `
  <div class="page-wrap" style="padding-top:72px">
    <div class="page-card glass thanks">
      ${owlSVG('guide')}
      <div class="thanks-emoji">🌟</div>
      <h1 class="display gradient-text">${T('Thank you!', 'شكرًا لك!')}</h1>
      <p class="lead">${sent ? T('Your rating reached us. Nour the owl is doing a happy dance!', 'وصل تقييمك إلينا. البومة «نور» ترقص من الفرح!')
        : T('Your rating is saved on this device and will be sent automatically when the connection is available.', 'حُفظ تقييمك على هذا الجهاز، وسيُرسل تلقائيًا عند توفر الاتصال.')}</p>
      <div class="page-actions"><button class="btn mint big" id="t-home">🎮 ${T('Back to the games', 'العودة إلى الألعاب')}</button></div>
    </div>
  </div>`;
  $('#t-home').onclick = () => go('#/');
}

// ---------------- modals ----------------
function openModal(html, { closable = false } = {}) {
  closeModal();
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${closable ? `<button class="icon-btn close" aria-label="${t('btn.close')}">✕</button>` : ''}${html}</div>`;
  $('#modal-root').appendChild(back);
  const m = back.querySelector('.modal');
  if (closable) {
    m.querySelector('.close').onclick = closeModal;
    back.addEventListener('click', e => { if (e.target === back) closeModal(); });
  }
  setTimeout(() => m.querySelector('button:not(.close)')?.focus(), 50);
  return m;
}
function closeModal() { $('#modal-root').innerHTML = ''; }
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { const c = document.querySelector('.modal .close'); if (c) c.click(); }
});

function showStory() {
  const m = openModal(`
    ${owlSVG('guide')}
    <h2>${t('story.title')}</h2>
    <div class="story-panels">
      <div class="story-panel"><div class="ic">💎</div><p>${t('story.1')}</p></div>
      <div class="story-panel"><div class="ic">👾</div><p>${t('story.2')}</p></div>
      <div class="story-panel"><div class="ic">🦉</div><p>${t('story.3')}</p></div>
    </div>
    <div class="actions"><button class="btn mint" id="s-go">${t('btn.start')}</button></div>`, { closable: true });
  m.querySelector('.guide').style.cssText = 'width:90px;height:90px;display:block;margin:0 auto';
  m.querySelector('#s-go').onclick = () => { store.storySeen = true; store.save(); closeModal(); };
}

function showAchievements() {
  const m = openModal(`
    <h2>🏆 ${t('ach.title')}</h2>
    <div class="ach-list">${ACHIEVEMENTS.map(a => `
      <div class="ach ${store.achievements[a.id] ? '' : 'locked'}"><div class="ic">${a.icon}</div><div><b>${L(a.name)}</b><small>${L(a.desc)}</small></div></div>`).join('')}
    </div>
    <div class="actions"><button class="btn coral small" id="a-reset">${t('btn.reset')}</button></div>`, { closable: true });
  // two-step confirmation inside the page (embedded frames block confirm())
  const reset = m.querySelector('#a-reset');
  reset.onclick = () => {
    if (reset.dataset.armed) { store.reset(); closeModal(); showHome(); return; }
    reset.dataset.armed = '1';
    reset.textContent = t('confirm.reset');
  };
}

// ---------------- achievements ----------------
function unlock(id) {
  if (store.achievements[id]) return;
  store.achievements[id] = Date.now();
  store.save();
  const a = ACHIEVEMENTS.find(x => x.id === id);
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span class="ic">${a.icon}</span><div>${esc(L(a.name))}<small>${esc(L(a.desc))}</small></div>`;
  $('#toast-root').appendChild(el);
  sfx('ding');
  setTimeout(() => el.remove(), 3500);
}

function checkAchievements() {
  const all = Object.values(store.stars).flat();
  if (all.some(s => s > 0)) unlock('first_win');
  if (all.some(s => s >= 3)) unlock('perfect');
  if (GAMES.every(g => store.played[g.id])) unlock('explorer');
  const crystals = GAMES.filter(g => isGameComplete(g.id, MODULES[g.id].levels.length)).length;
  if (crystals >= 1) unlock('crystal_1');
  if (crystals >= 6) unlock('all_crystals');
  if (totalStars() >= 30) unlock('stars_30');
  if (Object.keys(store.quiz).length >= 10) unlock('quiz_10');
  if (totalStars() >= maxStars()) unlock('all_stars');
}

// ---------------- boot ----------------
initExtras({ MODULES, openModal, closeModal, go, sfx });
applyDir();
route();
flushPending();
trackVisit();
announceEntry();
syncBoard();
window.__booted = true;
document.getElementById('boot-error').hidden = true;
