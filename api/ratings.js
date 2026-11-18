// Ratings, stored in Upstash Redis.
//   POST /api/ratings                 → save one rating (anyone playing); the device is read from the request
//   GET  /api/ratings?view=public     → anonymous summary shown inside the game (no names, no devices)
//   GET  /api/ratings                 → all ratings for the owner (header x-admin-key = ADMIN_KEY)
//   POST /api/ratings?action=hide     → owner hides/shows a rating in the game   (body {id, hidden})
//   POST /api/ratings?action=delete   → owner deletes a rating permanently       (body {id})
// Environment: KV_REST_API_URL / KV_REST_API_TOKEN (added when Upstash Redis is connected), ADMIN_KEY,
// and optionally TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID for an alert on every new rating.
const crypto = require('crypto');
const { store, redis, pipeline, text, bodyOf, isAdmin, telegram, device, GAMES, ROLES, QUESTIONS, dayKey } = require('./_db');

const LIST = 'hpu:ratings';
const HIDDEN = 'hpu:hidden';
const MAX_KEEP = 10000;

const ROLE_AR = { student: 'طالب', teacher: 'معلم / دكتور', employee: 'موظف', parent: 'ولي أمر', other: 'أخرى' };
const GAME_AR = { bird: 'الطائر السعيد', water: 'أنقذ الملك', magnet: 'بطل المغناطيس', circuit: 'مغامرة الدوائر', light: 'متاهة الضوء', energy: 'راكب الطاقة' };
const OS_AR = { iPhone: 'آيفون', iPad: 'آيباد', Android: 'أندرويد', Windows: 'ويندوز', Mac: 'ماك', ChromeOS: 'كروم بوك', Linux: 'لينكس', other: 'جهاز آخر' };

function clean(b) {
  if (!b) return null;
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
    site: b.site === 'plus' ? 'plus' : 'main',
    at: new Date().toISOString(),
    id: crypto.randomBytes(6).toString('hex')
  };
}

const idOf = r => r.id || r.at;
const avg = (list, f) => list.length ? list.reduce((a, r) => a + f(r), 0) / list.length : 0;
const score = r => avg(QUESTIONS, q => (r.answers && r.answers[q]) || 0);
const round1 = v => Math.round(v * 10) / 10;

async function readRaw(db) {
  const rows = await redis(db, ['LRANGE', LIST, '0', '-1']);
  return (rows || []).map(raw => { try { return { raw, r: JSON.parse(raw) }; } catch { return null; } }).filter(Boolean);
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

function alertText(e) {
  const stars = '⭐'.repeat(Math.round(score(e)));
  const d = e.device || {};
  return [
    `🌟 تقييم جديد في كون الفيزياء السعيد (${e.site === 'plus' ? 'الرابط الثاني' : 'الرابط الأول'})`,
    `👤 ${e.name} • العمر ${e.age > 16 ? '16+' : e.age} • ${ROLE_AR[e.role] || e.role}`,
    `${stars} (${round1(score(e))} من 5)`,
    e.favorite ? `🏅 المفضّلة: ${GAME_AR[e.favorite]}` : '',
    e.comment ? `💬 ${e.comment}` : '',
    `📱 ${OS_AR[d.os] || d.os || ''} ${d.osVer || ''} • ${d.browser === 'other' ? '' : d.browser || ''}`.trim()
  ].filter(Boolean).join('\n');
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const db = store();
  if (!db) return res.status(503).json({ error: 'storage-not-configured' });
  const q = req.query || {};

  try {
    if (req.method === 'POST' && (q.action === 'hide' || q.action === 'delete')) {
      if (!isAdmin(req, res)) return;
      const b = bodyOf(req) || {};
      const id = text(b.id, 40);
      if (!id) return res.status(400).json({ error: 'invalid-id' });
      if (q.action === 'hide') {
        await redis(db, [b.hidden ? 'SADD' : 'SREM', HIDDEN, id]);
        return res.status(200).json({ ok: true });
      }
      const hit = (await readRaw(db)).find(x => idOf(x.r) === id);
      if (!hit) return res.status(404).json({ error: 'not-found' });
      await pipeline(db, [['LREM', LIST, '1', hit.raw], ['SREM', HIDDEN, id]]);
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'POST') {
      const body = bodyOf(req);
      const entry = clean(body);
      if (!entry) return res.status(400).json({ error: 'invalid-rating' });
      entry.device = device(req.headers['user-agent'], body.device);
      await pipeline(db, [
        ['LPUSH', LIST, JSON.stringify(entry)],
        ['LTRIM', LIST, '0', String(MAX_KEEP - 1)],
        ['HINCRBY', 'hpu:days', `${dayKey()}:rating`, '1'],
        ['HINCRBY', `hpu:days:${entry.site}`, `${dayKey()}:rating`, '1']
      ]);
      await telegram(alertText(entry));
      return res.status(201).json({ ok: true });
    }

    if (req.method === 'GET' && q.view === 'public') {
      const [rows, hidden] = await Promise.all([readRaw(db), redis(db, ['SMEMBERS', HIDDEN])]);
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=120');
      return res.status(200).json(publicSummary(rows.map(x => x.r), new Set(hidden || [])));
    }

    if (req.method === 'GET') {
      if (!isAdmin(req, res)) return;
      const [rows, hidden] = await Promise.all([readRaw(db), redis(db, ['SMEMBERS', HIDDEN])]);
      return res.status(200).json({ ratings: rows.map(x => ({ ...x.r, id: idOf(x.r) })), hidden: hidden || [] });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method-not-allowed' });
  } catch (e) {
    return res.status(500).json({ error: 'storage-error' });
  }
};
