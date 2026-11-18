// Vercel serverless function: stores ratings in Upstash Redis and lists them for the owner.
//   POST /api/ratings            → save one rating (anyone playing the game)
//   GET  /api/ratings            → list all ratings; needs header x-admin-key = ADMIN_KEY
// Environment (Vercel → Project → Settings → Environment Variables):
//   KV_REST_API_URL / KV_REST_API_TOKEN  (added automatically when an Upstash Redis store is connected;
//                                         UPSTASH_REDIS_REST_URL / _TOKEN also work)
//   ADMIN_KEY                            (a password you choose for the private ratings page)
const crypto = require('crypto');

const LIST = 'hpu:ratings';
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
    at: new Date().toISOString()
  };
}

function sameKey(a, b) {
  const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const db = store();
  if (!db) return res.status(503).json({ error: 'storage-not-configured' });

  try {
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
      const entry = clean(body);
      if (!entry) return res.status(400).json({ error: 'invalid-rating' });
      await redis(db, ['LPUSH', LIST, JSON.stringify(entry)]);
      await redis(db, ['LTRIM', LIST, '0', String(MAX_KEEP - 1)]);
      return res.status(201).json({ ok: true });
    }

    if (req.method === 'GET') {
      if (!process.env.ADMIN_KEY) return res.status(503).json({ error: 'admin-key-not-configured' });
      if (!sameKey(req.headers['x-admin-key'], process.env.ADMIN_KEY)) return res.status(401).json({ error: 'wrong-key' });
      const rows = await redis(db, ['LRANGE', LIST, '0', '-1']);
      const ratings = (rows || []).map(s => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
      return res.status(200).json({ ratings });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method-not-allowed' });
  } catch (e) {
    return res.status(500).json({ error: 'storage-error' });
  }
};
