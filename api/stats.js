// Owner-only statistics for the private admin page (header x-admin-key = ADMIN_KEY).
//   GET  /api/stats                         → play stats, daily numbers, devices, heroes board, alert status
//   POST /api/stats?action=telegram-test    → send a test Telegram message
//   POST /api/stats?action=telegram-chats   → list chats that messaged the bot (to find TELEGRAM_CHAT_ID)
const { store, pipeline, isAdmin, telegram, dayKey } = require('./_db');

function hash(flat) {
  const o = {};
  for (let i = 0; i < (flat || []).length; i += 2) o[flat[i]] = Number(flat[i + 1]) || 0;
  return o;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!isAdmin(req, res)) return;
  const q = req.query || {};

  if (req.method === 'POST' && q.action === 'telegram-test') {
    const r = await telegram('✅ تم ربط تنبيهات «كون الفيزياء السعيد» بنجاح. ستصلك رسالة هنا مع كل تقييم جديد.');
    return res.status(r.ok ? 200 : 400).json(r);
  }
  if (req.method === 'POST' && q.action === 'telegram-chats') {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return res.status(400).json({ error: 'telegram-token-missing' });
    try {
      const j = await fetch(`https://api.telegram.org/bot${token}/getUpdates`).then(r => r.json());
      if (!j.ok) return res.status(400).json({ error: j.description || 'telegram-error' });
      const chats = {};
      for (const u of j.result || []) {
        const c = (u.message || u.channel_post || u.my_chat_member || {}).chat;
        if (c) chats[c.id] = c.title || [c.first_name, c.last_name].filter(Boolean).join(' ') || c.username || String(c.id);
      }
      return res.status(200).json({ chats: Object.entries(chats).map(([id, name]) => ({ id, name })) });
    } catch {
      return res.status(502).json({ error: 'telegram-unreachable' });
    }
  }
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'method-not-allowed' }); }

  const db = store();
  if (!db) return res.status(503).json({ error: 'storage-not-configured' });
  const days = Array.from({ length: 30 }, (_, i) => dayKey(new Date(Date.now() - (29 - i) * 86400e3)));
  // ?site=main|plus → one link only; otherwise both links together
  const sfx = q.site === 'main' || q.site === 'plus' ? `:${q.site}` : '';
  try {
    const out = await pipeline(db, [
      ['HGETALL', `hpu:lv${sfx}`],
      ['HGETALL', `hpu:days${sfx}`],
      ['PFCOUNT', `hpu:u${sfx}`],
      ['HGETALL', `hpu:dev${sfx}`],
      ['ZREVRANGE', 'hpu:lb', '0', '99', 'WITHSCORES'],
      ['HGETALL', 'hpu:lbn'],
      ...days.map(d => ['PFCOUNT', `hpu:u${sfx}:${d}`])
    ]);
    const [lv, dayFlat, players, dev, lb, lbn] = out;
    const daily = hash(dayFlat);
    const lbInfo = {};
    for (let i = 0; i < (lbn || []).length; i += 2) { try { lbInfo[lbn[i]] = JSON.parse(lbn[i + 1]); } catch { /* skip */ } }
    const board = [];
    for (let i = 0; i < (lb || []).length; i += 2) board.push({ pid: lb[i], stars: Number(lb[i + 1]), ...(lbInfo[lb[i]] || {}) });
    return res.status(200).json({
      levels: hash(lv),
      players: Number(players) || 0,
      devices: hash(dev),
      days: days.map((d, i) => ({
        day: d, players: Number(out[6 + i]) || 0, visits: daily[`${d}:visit`] || 0, starts: daily[`${d}:start`] || 0,
        wins: daily[`${d}:win`] || 0, fails: daily[`${d}:fail`] || 0, ratings: daily[`${d}:rating`] || 0
      })),
      board,
      telegram: { token: !!process.env.TELEGRAM_BOT_TOKEN, chat: !!process.env.TELEGRAM_CHAT_ID }
    });
  } catch {
    return res.status(500).json({ error: 'storage-error' });
  }
};
