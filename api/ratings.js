// Vercel serverless function: stores ratings in Upstash Redis and lists them for the owner.
//   POST /api/ratings               → save one rating (anyone playing the game); the device is read from the request
//   GET  /api/ratings?view=public   → anonymous summary shown inside the game (no names, no devices)
//   GET  /api/ratings               → list all ratings; needs header x-admin-key = ADMIN_KEY
//   POST /api/ratings?action=hide   → owner hides/shows a rating in the public summary (x-admin-key, body {id, hidden})
// Environment (Vercel → Project → Settings → Environment Variables):
//   KV_REST_API_URL / KV_REST_API_TOKEN  (added automatically when an Upstash Redis store is connected;
//                                         UPSTASH_REDIS_REST_URL / _TOKEN also work)
//   ADMIN_KEY                            (a password you choose for the private ratings page)
const crypto = require('crypto');

const LIST = 'hpu:ratings';
const HIDDEN = 'hpu:hidden';
const MAX_KEEP = 10000;
const ROLES = ['student', 'teacher', 'employee', 'parent', 'other'];
const QUESTIONS = ['fun', 'learn', 'easy', 'look', 'recommend'];
const GAMES = ['bird', 'water', 'magnet', 'circuit', 'light', 'energy'];

// Vercel may add a custom prefix to the variable names (e.g. STORAGE_KV_REST_API_URL),
// so look for any variable that ends with the expected name.
function envEnding(...suffixes) {
  for (const s of suffixes) if (process.env[s]) return process.env[s];
  const keys = Object.keys(process.env);
  for (const s of suffixes) {
    const k = keys.find((key) => key.endsWith('_' + s) && process.env[key]);
    if (k) return process.env[k];
  }
  return '';
}

function store() {
  const url = envEnding('KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL');
  const token = envEnding('KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_TOKEN');
  return url && token ? { url, token } : null;
}

async function redis(db, args) {
  const r = await fetch(db.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${db.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args)
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

const text = (v, max) => (typeof v === 'string' ? v.trim().replace(/[\u0000-\u001f]/g, ' ').slice(0, max) : '');

function clean(b) {
  if (!b || typeof b !== 'object') return null;
  const name = text(b.name, 40);
  const age = Number.isInteger(b.age) && b.age >= 3 && b.age <= 99 ? b.age : null;
  const role = ROLES.includes(b.role) ? b.role : null;
  const answers = {};
  for (const q of QUESTIONS) {
    const v = b.answers && b.answers[q];
    if (!Number.isInteger(v) || v < 1 || v > 5) return null;
    answers[q] = v;
  }
  if (!name || !age || !role) return null;
  return {
    name, age, role, answers,
    favorite: GAMES.includes(b.favorite) ? b.favorite : '',
    comment: text(b.comment, 500),
    lang: b.lang === 'en' ? 'en' : 'ar',
    stars: Number.isInteger(b.stars) && b.stars >= 0 && b.stars <= 999 ? b.stars : 0,
    at: new Date().toISOString(),
    id: crypto.randomBytes(6).toString('hex')
  };
}

// Device from the browser's User-Agent, plus the screen size / model the page reports.
function device(ua, extra) {
  ua = String(ua || '');
  const e = extra && typeof extra === 'object' ? extra : {};
  let os = 'other', type = 'computer', osVer = '', m;
  if (/iPhone/.test(ua)) { os = 'iPhone'; type = 'phone'; }
  else if (/iPad/.test(ua) || (/Macintosh/.test(ua) && e.touch === true)) { os = 'iPad'; type = 'tablet'; }
  else if (/Android/.test(ua)) { os = 'Android'; type = /Mobile/.test(ua) ? 'phone' : 'tablet'; }
  else if (/Windows/.test(ua)) os = 'Windows';
  else if (/CrOS/.test(ua)) os = 'ChromeOS';
  else if (/Mac OS X|Macintosh/.test(ua)) os = 'Mac';
  else if (/Linux/.test(ua)) os = 'Linux';
  if ((os === 'iPhone' || os === 'iPad') && (m = ua.match(/OS (\d+)[_.](\d+)/))) osVer = m[1] + '.' + m[2];
  else if (os === 'Android' && (m = ua.match(/Android (\d+(?:\.\d+)?)/))) osVer = m[1];
  const BROWSERS = [[/Instagram/, 'Instagram'], [/FBAN|FBAV|FB_IAB/, 'Facebook'], [/Snapchat/, 'Snapchat'], [/musical_ly|TikTok|BytedanceWebview/, 'TikTok'],
    [/WhatsApp/, 'WhatsApp'], [/Twitter/, 'X'], [/Edg(A|iOS)?\//, 'Edge'], [/OPR\/|Opera/, 'Opera'], [/SamsungBrowser/, 'Samsung Internet'],
    [/CriOS/, 'Chrome'], [/FxiOS|Firefox\//, 'Firefox'], [/Chrome\//, 'Chrome'], [/Safari\//, 'Safari']];
  const hit = BROWSERS.find(([re]) => re.test(ua));
  let model = text(e.model, 40);
  if (!model && os === 'Android' && (m = ua.match(/Android [\d.]+; ([^;)]+)/)) && m[1].trim() !== 'K') model = text(m[1], 40);
  const screen = /^\d{2,5}x\d{2,5}$/.test(e.screen || '') ? e.screen : '';
  return { type, os, osVer, browser: hit ? hit[1] : 'other', model, screen, ua: ua.slice(0, 300) };
}

function sameKey(a, b) {
  const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

const idOf = r => r.id || r.at;
const avg = (list, f) => list.length ? list.reduce((a, r) => a + f(r), 0) / list.length : 0;
const score = r => avg(QUESTIONS, q => (r.answers && r.answers[q]) || 0);
const round1 = v => Math.round(v * 10) / 10;

async function readAll(db) {
  const rows = await redis(db, ['LRANGE', LIST, '0', '-1']);
  return (rows || []).map(s => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
}

// What the game shows to everyone: averages and recent reviews, never names or devices.
function publicSummary(all, hidden) {
  const shown = all.filter(r => !hidden.has(idOf(r)));
  const questions = {};
  for (const q of QUESTIONS) questions[q] = round1(avg(shown, r => (r.answers && r.answers[q]) || 0));
  return {
    count: shown.length,
    avg: round1(avg(shown, score)),
    questions,
    recent: shown.slice(0, 12).map(r => ({
      score: round1(score(r)), role: r.role, age: r.age, favorite: r.favorite || '', comment: r.comment || '', at: r.at
    }))
  };
}

function bodyOf(req) {
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  return body;
}

function isAdmin(req, res) {
  if (!process.env.ADMIN_KEY) { res.status(503).json({ error: 'admin-key-not-configured' }); return false; }
  if (!sameKey(req.headers['x-admin-key'], process.env.ADMIN_KEY)) { res.status(401).json({ error: 'wrong-key' }); return false; }
  return true;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const db = store();
  if (!db) return res.status(503).json({ error: 'storage-not-configured' });
  const q = req.query || {};

  try {
    if (req.method === 'POST' && q.action === 'hide') {
      if (!isAdmin(req, res)) return;
      const b = bodyOf(req) || {};
      const id = text(b.id, 40);
      if (!id) return res.status(400).json({ error: 'invalid-id' });
      await redis(db, [b.hidden ? 'SADD' : 'SREM', HIDDEN, id]);
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'POST') {
      const body = bodyOf(req);
      const entry = clean(body);
      if (!entry) return res.status(400).json({ error: 'invalid-rating' });
      entry.device = device(req.headers['user-agent'], body.device);
      await redis(db, ['LPUSH', LIST, JSON.stringify(entry)]);
      await redis(db, ['LTRIM', LIST, '0', String(MAX_KEEP - 1)]);
      return res.status(201).json({ ok: true });
    }

    if (req.method === 'GET' && q.view === 'public') {
      const [all, hidden] = await Promise.all([readAll(db), redis(db, ['SMEMBERS', HIDDEN])]);
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=120');
      return res.status(200).json(publicSummary(all, new Set(hidden || [])));
    }

    if (req.method === 'GET') {
      if (!isAdmin(req, res)) return;
      const [ratings, hidden] = await Promise.all([readAll(db), redis(db, ['SMEMBERS', HIDDEN])]);
      return res.status(200).json({ ratings: ratings.map(r => ({ ...r, id: idOf(r) })), hidden: hidden || [] });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method-not-allowed' });
  } catch (e) {
    return res.status(500).json({ error: 'storage-error' });
  }
};
