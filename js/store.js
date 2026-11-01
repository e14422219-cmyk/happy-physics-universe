// Player progress, saved in the browser (localStorage). No server needed.
const KEY = 'hpu-progress-v1';

function blank() {
  return {
    stars: {},          // { gameId: [0..3, ...] }
    quiz: {},           // { 'gameId:level': true } correct answers
    achievements: {},   // { id: timestamp }
    played: {},         // { gameId: true }
    tutorialSeen: {},   // { gameId: true }
    storySeen: false,
    endingSeen: false,
    settings: { lang: 'ar', sound: true }
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    const data = JSON.parse(raw);
    const b = blank();
    return { ...b, ...data, settings: { ...b.settings, ...(data.settings || {}) } };
  } catch {
    return blank();
  }
}

export const store = {
  ...load(),

  save() {
    try {
      const { save, reset, ...data } = this;
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch { /* storage unavailable: progress lives for this session only */ }
  },

  reset() {
    const keepLang = this.settings.lang;
    Object.assign(this, blank());
    this.settings.lang = keepLang;
    this.save();
  }
};

// ---- helpers over the stored data ----
export function levelStars(gameId, i) {
  return (store.stars[gameId] || [])[i] || 0;
}

export function setLevelStars(gameId, i, s) {
  const arr = store.stars[gameId] || (store.stars[gameId] = []);
  const prev = arr[i] || 0;
  if (s > prev) arr[i] = s;
  store.save();
  return prev;
}

export function gameStars(gameId) {
  return (store.stars[gameId] || []).reduce((a, b) => a + (b || 0), 0);
}

export function totalStars() {
  return Object.keys(store.stars).reduce((a, id) => a + gameStars(id), 0);
}

export function levelsCleared(gameId) {
  return (store.stars[gameId] || []).filter(s => s > 0).length;
}

export function isUnlocked(gameId, i) {
  return i === 0 || levelStars(gameId, i - 1) > 0;
}

export function isGameComplete(gameId, levelCount) {
  return levelsCleared(gameId) >= levelCount;
}
