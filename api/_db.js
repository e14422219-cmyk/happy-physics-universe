// Shared helpers for the serverless functions (files starting with "_" are not endpoints on Vercel).
const crypto = require('crypto');

// Vercel may add a custom prefix to the variable names (e.g. STORAGE_KV_REST_API_URL),
// so look for any variable that ends with the expected name.
function envEnding(...suffixes) {
  for (const s of suffixes) if (process.env[s]) return process.env[s];
  const keys = Object.keys(process.env);
  for (const s of suffixes) {
    const k = keys.find(key => key.endsWith('_' + s) && process.env[key]);
    if (k) return process.env[k];
  }
  return '';
}

function store() {
  const url = envEnding('KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL');
  const token = envEnding('KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_TOKEN');
  return url && token ? { url: url.replace(/\/+$/, ''), token } : null;
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

// Several commands in one request; returns their results in order.
async function pipeline(db, cmds) {
  if (!cmds.length) return [];
  const r = await fetch(db.url + '/pipeline', {
    method: 'POST',
    headers: { Authorization: `Bearer ${db.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds)
  });
  const j = await r.json();
  if (!Array.isArray(j)) throw new Error(j && j.error || 'pipeline-failed');
  return j.map(x => (x && x.error ? null : x && x.result));
}

const text = (v, max) => (typeof v === 'string' ? v.trim().replace(/[\u0000-\u001f]/g, ' ').slice(0, max) : '');

function bodyOf(req) {
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  return body && typeof body === 'object' ? body : null;
}

function sameKey(a, b) {
  const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function isAdmin(req, res) {
  if (!process.env.ADMIN_KEY) { res.status(503).json({ error: 'admin-key-not-configured' }); return false; }
  if (!sameKey(req.headers['x-admin-key'], process.env.ADMIN_KEY)) { res.status(401).json({ error: 'wrong-key' }); return false; }
  return true;
}

// Optional Telegram alerts: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID in Vercel's environment variables.
async function telegram(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return { ok: false, error: 'telegram-not-configured' };
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 4000);
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: message, disable_web_page_preview: true }),
      signal: ctl.signal
    });
    const j = await r.json().catch(() => ({}));
    return { ok: !!j.ok, error: j.ok ? '' : (j.description || 'telegram-error') };
  } catch (e) {
    return { ok: false, error: 'telegram-unreachable' };
  } finally {
    clearTimeout(timer);
  }
}

const GAMES = ['bird', 'water', 'magnet', 'circuit', 'light', 'energy'];
const ROLES = ['student', 'teacher', 'employee', 'parent', 'other'];
const QUESTIONS = ['fun', 'learn', 'easy', 'look', 'recommend'];
const DEVICE_TYPES = ['phone', 'tablet', 'computer'];

// Day key in Saudi time, so "today" matches the owner's day.
const dayKey = (d = new Date()) => new Date(d.getTime() + 3 * 3600e3).toISOString().slice(0, 10);

module.exports = { store, redis, pipeline, text, bodyOf, sameKey, isAdmin, telegram, GAMES, ROLES, QUESTIONS, DEVICE_TYPES, dayKey };
