import { GAMES, ACHIEVEMENTS, CRYSTAL_COLORS } from './config.js';
import { store, levelStars, setLevelStars, gameStars, totalStars, levelsCleared, isUnlocked, isGameComplete } from './store.js';
import { t, T, L, getLang, setLang, applyDir } from './i18n.js';
import { gameArt, crystalSVG, owlSVG, logoSVG } from './art.js';
import { Stage } from './engine.js';
import { sfx } from './audio.js';

import bird from './games/bird.js';
import water from './games/water.js';
import magnet from './games/magnet.js';
import circuit from './games/circuit.js';
import light from './games/light.js';
import energy from './games/energy.js';

const MODULES = { bird, water, magnet, circuit, light, energy };
const $ = sel => document.querySelector(sel);
const meta = id => GAMES.find(g => g.id === id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const stage = new Stage($('#stage'));
window.hpu = { stage };   // handy for debugging from the console
let session = null;

// ---------------- routing ----------------
function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/');
  closeModal();
  if (parts[0] === 'g' && MODULES[parts[1]]) return showLevels(parts[1]);
  if (parts[0] === 'p' && MODULES[parts[1]]) {
    const i = parseInt(parts[2], 10) || 0;
    if (i < MODULES[parts[1]].levels.length && isUnlocked(parts[1], i)) return showGame(parts[1], i);
    return go(`#/g/${parts[1]}`);
  }
  showHome();
}
function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }

// Circular colour wipe from the tap point, then route behind it and fade out.
let wiping = false;
function wipeTo(hash, gameId, ev) {
  if (wiping) return;
  const w = $('#wipe'), g = meta(gameId);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return go(hash);
  wiping = true;
  w.style.setProperty('--x', `${ev?.clientX ?? innerWidth / 2}px`);
  w.style.setProperty('--y', `${ev?.clientY ?? innerHeight / 2}px`);
  w.style.background = `radial-gradient(circle at 50% 45%, ${g.color}, ${CRYSTAL_COLORS[g.crystal]}cc 60%, #2b1d6e)`;
  w.innerHTML = `<div style="text-align:center">${crystalSVG(CRYSTAL_COLORS[g.crystal], '')}<div class="wipe-title">${esc(L(g.title))}</div></div>`;
  w.className = 'in';
  setTimeout(() => {
    go(hash);
    w.className = 'out';
    setTimeout(() => { w.className = ''; w.innerHTML = ''; wiping = false; }, 520);
  }, 470);
}
window.addEventListener('hashchange', route);

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  if (id !== 'screen-game') { stage.stop(); session = null; }
  window.scrollTo(0, 0);
}

// ---------------- home ----------------
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
    <header class="topbar">
      <div class="logo">${logoSVG()}<div><h1>${t('app.name')}</h1><small>${t('app.tagline')}</small></div></div>
      <span class="pill" title="${t('home.crystals')}"><span class="crystal-row">${crystalsHTML()}</span></span>
      <span class="pill">⭐ ${totalStars()} / ${maxStars()}</span>
      <button class="icon-btn" id="h-ach" aria-label="${t('btn.achievements')}" title="${t('btn.achievements')}">🏆</button>
      <button class="icon-btn" id="h-story" aria-label="${t('btn.story')}" title="${t('btn.story')}">📖</button>
      <button class="icon-btn" id="h-sound" aria-label="${t('btn.sound')}" title="${t('btn.sound')}">${store.settings.sound ? '🔊' : '🔇'}</button>
      <button class="btn small ghost" id="h-lang" lang="${other}">${t('btn.lang')}</button>
    </header>
    <section class="hero">
      ${owlSVG()}
      <div><h2>${t('home.heroTitle')}</h2><p>${t('home.heroText')}</p></div>
      <div class="hero-progress">
        <div style="font-weight:800;margin-bottom:6px">${t('home.progress')}: ${restored}/6</div>
        <div class="bar"><i style="width:${(restored / 6) * 100}%"></i></div>
      </div>
    </section>
    <section class="cards">
      ${GAMES.map(cardHTML).join('')}
    </section>
    <p class="home-foot">${t('home.footer')}</p>
  </div>`;

  document.querySelectorAll('.card').forEach(c => {
    const open = ev => { sfx('click'); wipeTo(`#/g/${c.dataset.id}`, c.dataset.id, ev); };
    c.addEventListener('click', open);
    c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
  $('#h-lang').onclick = () => { setLang(getLang() === 'ar' ? 'en' : 'ar'); showHome(); };
  $('#h-sound').onclick = () => { store.settings.sound = !store.settings.sound; store.save(); showHome(); sfx('click'); };
  $('#h-story').onclick = showStory;
  $('#h-ach').onclick = showAchievements;
  if (!store.storySeen) showStory();
}

function cardHTML(g) {
  const n = MODULES[g.id].levels.length;
  const stars = gameStars(g.id);
  const done = isGameComplete(g.id, n);
  const otherLesson = getLang() === 'ar' ? g.lesson.en : g.lesson.ar;
  return `
  <article class="card" data-id="${g.id}" tabindex="0" role="button" aria-label="${esc(L(g.title))}">
    <div class="card-art">${gameArt(g.id)}
      <span class="card-tag">${L(g.concept)}</span>
      ${done ? `<span class="card-done">💎 ${t('card.restored')}</span>` : ''}
    </div>
    <div class="card-body">
      <h3>${L(g.title)}</h3>
      <p class="lesson">${L(g.lesson)}<br><span lang="${getLang() === 'ar' ? 'en' : 'ar'}">${otherLesson}</span></p>
      <div class="card-meta">
        <span>${n} ${t('card.levels')}</span>
        <div class="bar"><i style="width:${(levelsCleared(g.id) / n) * 100}%"></i></div>
        <span class="stars-inline">⭐ ${stars}/${n * 3}</span>
      </div>
      <div class="card-foot">
        <span class="grade">${L(g.grade)}</span>
        <span class="btn mint small">▶ ${t('card.play')}</span>
      </div>
    </div>
  </article>`;
}

// ---------------- level select ----------------
function showLevels(id) {
  showScreen('screen-levels');
  const g = meta(id), mod = MODULES[id];
  $('#screen-levels').innerHTML = `
  <div class="lv-wrap">
    <div class="lv-head">
      <button class="icon-btn" id="lv-back" aria-label="${t('btn.home')}">⟵</button>
      <div><h2>${L(g.title)}</h2><p>${L(g.lesson)} • ${getLang() === 'ar' ? g.lesson.en : g.lesson.ar}</p></div>
    </div>
    <div class="lv-panel">
      <div class="lv-intro">
        <div class="art">${gameArt(id)}</div>
        <div>
          <p>${L(g.description)}</p>
          <strong>${t('lv.physics')}</strong>
          <div class="formula-preview">${mod.formulas.slice(0, 4).map(f => `<span class="formula-chip">${f.expr}</span>`).join('')}</div>
          <div style="margin-top:12px"><button class="btn small ghost" id="lv-tut">❓ ${t('btn.tutorial')}</button></div>
        </div>
      </div>
      <h3 style="margin:18px 0 0">${t('lv.choose')}</h3>
      <div class="levels">
        ${mod.levels.map((lv, i) => {
          const open = isUnlocked(id, i);
          const s = levelStars(id, i);
          return `<button class="level-btn ${open ? '' : 'locked'}" data-i="${i}" ${open ? '' : 'aria-disabled="true"'} aria-label="${t('lv.level')} ${i + 1}">
            <span class="num">${open ? i + 1 : '🔒'}</span>
            <span class="nm">${L(lv.name)}</span>
            <span class="st">${'★'.repeat(s)}${'☆'.repeat(3 - s)}</span>
          </button>`;
        }).join('')}
      </div>
    </div>
  </div>`;
  $('#lv-back').onclick = () => go('#/');
  $('#lv-tut').onclick = () => showTutorial(id);
  document.querySelectorAll('.level-btn').forEach(b => b.onclick = ev => {
    const i = +b.dataset.i;
    if (!isUnlocked(id, i)) {
      sfx('bad');
      b.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 260 });
      return;
    }
    sfx('click');
    wipeTo(`#/p/${id}/${i}`, id, ev);
  });
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
  $('#g-back').onclick = () => go(`#/g/${id}`);
  $('#g-restart').onclick = () => { sfx('click'); startLevel(id, levelIndex, (session?.attempt || 1) + 1); };
  $('#g-help').onclick = () => showTutorial(id);

  if (!store.played[id]) { store.played[id] = true; store.save(); checkAchievements(); }
  startLevel(id, levelIndex, 1);
  if (!store.tutorialSeen[id]) { store.tutorialSeen[id] = true; store.save(); showTutorial(id); }
}

function startLevel(id, levelIndex, attempt) {
  closeModal();
  const mod = MODULES[id];
  $('#g-controls').innerHTML = '';
  $('#g-vars').innerHTML = '';
  $('#g-hint').textContent = '';
  $('#g-banner').className = 'stage-banner';
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
      sfx('win');
      this.banner(T('Success!', 'نجحت!'), false, 900);
      setTimeout(() => { if (session === s) showResult(s, stars); }, 1000);
    },
    lose(msg) {
      if (s.ended || session !== s) return;
      s.ended = true;
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

  const body = `
    ${!wasComplete && nowComplete ? `<div class="crystal-win">${crystalSVG(CRYSTAL_COLORS[g.crystal], '')}<h3 style="margin:4px 0">${t('res.crystal')}</h3></div>` : ''}
    <h2>${t('res.win')}</h2>
    <div class="big-stars">${[0, 1, 2].map(i => `<span class="${i < stars ? 'on' : ''}" style="animation-delay:${.15 + i * .2}s">★</span>`).join('')}</div>
    <div class="learn-card"><h4>💡 ${t('res.learned')}</h4><p>${L(lv.learn)}</p></div>
    ${q ? quizHTML(q) : ''}
    <div class="actions">
      ${hasNext ? `<button class="btn mint" id="r-next">${t('btn.next')} ⟶</button>` : ''}
      <button class="btn ghost" id="r-replay">↻ ${t('btn.replay')}</button>
      <button class="btn ghost" id="r-levels">${t('btn.levels')}</button>
    </div>`;
  const m = openModal(body);
  for (let i = 0; i < stars; i++) setTimeout(() => sfx('star'), 250 + i * 200);
  if (q) wireQuiz(m, q, `${id}:${levelIndex}`);
  m.querySelector('#r-next')?.addEventListener('click', ev => { closeModal(); wipeTo(`#/p/${id}/${levelIndex + 1}`, id, ev); });
  m.querySelector('#r-replay').onclick = () => startLevel(id, levelIndex, 1);
  m.querySelector('#r-levels').onclick = () => go(`#/g/${id}`);
  checkAchievements();
  if (allCrystals && !store.endingSeen) {
    store.endingSeen = true;
    store.save();
    m.querySelector('.actions').insertAdjacentHTML('beforebegin',
      `<div class="crystal-win" style="margin-top:12px"><h3>👑 ${t('res.universe')}</h3><p style="margin:0">${t('ending.text')}</p></div>`);
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
  m.querySelector('#l-levels').onclick = () => go(`#/g/${s.id}`);
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

function showTutorial(id) {
  const mod = MODULES[id], g = meta(id);
  const m = openModal(`
    <h2>❓ ${L(g.title)}</h2>
    <ol class="tut-steps">${mod.tutorial.map(s => `<li><span>${L(s)}</span></li>`).join('')}</ol>
    <div class="actions"><button class="btn mint" id="t-ok">${t('btn.start')}</button></div>`, { closable: true });
  m.querySelector('#t-ok').onclick = closeModal;
}

function showAchievements() {
  const m = openModal(`
    <h2>🏆 ${t('ach.title')}</h2>
    <div class="ach-list">${ACHIEVEMENTS.map(a => `
      <div class="ach ${store.achievements[a.id] ? '' : 'locked'}"><div class="ic">${a.icon}</div><div><b>${L(a.name)}</b><small>${L(a.desc)}</small></div></div>`).join('')}
    </div>
    <div class="actions"><button class="btn coral small" id="a-reset">${t('btn.reset')}</button></div>`, { closable: true });
  m.querySelector('#a-reset').onclick = () => {
    if (confirm(t('confirm.reset'))) { store.reset(); closeModal(); showHome(); }
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
applyDir();
route();
window.__booted = true;
document.getElementById('boot-error').hidden = true;
