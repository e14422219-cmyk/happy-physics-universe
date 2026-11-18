// Heroes board. Players appear only under a nickname picked from fixed word lists (no typed text, no real names).
//   GET  /api/leaderboard?me=<pid>        → top 20 + the caller's own rank
//   POST /api/leaderboard                 → join / update   body {pid, a, n, stars, crystals}  (a, n = adjective and noun indexes)
//   POST /api/leaderboard?action=remove   → owner removes a player (x-admin-key, body {pid})
const { store, redis, pipeline, bodyOf, isAdmin } = require('./_db');

const BOARD = 'hpu:lb', INFO = 'hpu:lbn';
const WORDS = 16;          // must match NICK_ADJ / NICK_NOUN in js/config.js
const MAX_STARS = 90;      // 6 games × 5 levels × 3 stars
const validPid = p => /^[a-f0-9]{16,32}$/.test(p || '');
const idx = v => (Number.isInteger(v) && v >= 0 && v < WORDS ? v : -1);

function pairs(flat) {
  const out = [];
  for (let i = 0; i < (flat || []).length; i += 2) out.push([flat[i], flat[i + 1]]);
  return out;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const db = store();
  if (!db) return res.status(503).json({ error: 'storage-not-configured' });
  const q = req.query || {};

  try {
    if (req.method === 'POST' && q.action === 'remove') {
      if (!isAdmin(req, res)) return;
      const pid = (bodyOf(req) || {}).pid;
      if (!validPid(pid)) return res.status(400).json({ error: 'invalid-player' });
      await pipeline(db, [['ZREM', BOARD, pid], ['HDEL', INFO, pid]]);
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'POST') {
      const b = bodyOf(req) || {};
      const a = idx(b.a), n = idx(b.n);
      const stars = Number.isInteger(b.stars) && b.stars >= 0 && b.stars <= MAX_STARS ? b.stars : -1;
      const crystals = Number.isInteger(b.crystals) && b.crystals >= 0 && b.crystals <= 6 ? b.crystals : 0;
      if (!validPid(b.pid) || a < 0 || n < 0 || stars < 0) return res.status(400).json({ error: 'invalid-player' });
      await pipeline(db, [
        ['ZADD', BOARD, String(stars), b.pid],
        ['HSET', INFO, b.pid, JSON.stringify({ a, n, c: crystals, at: Date.now() })]
      ]);
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'GET') {
      const me = validPid(q.me) ? q.me : '';
      const [top, rank, total] = await pipeline(db, [
        ['ZREVRANGE', BOARD, '0', '19', 'WITHSCORES'],
        me ? ['ZREVRANK', BOARD, me] : ['ZCARD', BOARD],
        ['ZCARD', BOARD]
      ]);
      const list = pairs(top);
      const ids = list.map(x => x[0]);
      const infos = ids.length ? await redis(db, ['HMGET', INFO, ...ids]) : [];
      const players = list.map(([pid, s], i) => {
        let info = {};
        try { info = JSON.parse(infos[i] || '{}'); } catch { /* keep defaults */ }
        return { a: info.a || 0, n: info.n || 0, crystals: info.c || 0, stars: Number(s), you: pid === me };
      });
      res.setHeader('Cache-Control', me ? 'no-store' : 'public, max-age=0, s-maxage=20');
      return res.status(200).json({ players, myRank: me && rank != null ? rank + 1 : null, total: total || 0 });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method-not-allowed' });
  } catch {
    return res.status(500).json({ error: 'storage-error' });
  }
};
