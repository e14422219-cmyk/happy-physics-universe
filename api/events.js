// Anonymous play statistics (no names): visits, level starts, wins and fails.
//   POST /api/events  body {type: visit|start|win|fail, pid, game?, level?, stars?, device?}
// pid is a random id the browser keeps, used only to count unique players.
const { store, pipeline, bodyOf, GAMES, DEVICE_TYPES, dayKey } = require('./_db');

const TYPES = ['visit', 'start', 'win', 'fail'];
const SITES = ['main', 'plus'];
const KEEP_DAYS = 120 * 86400;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'method-not-allowed' }); }
  const db = store();
  if (!db) return res.status(503).json({ error: 'storage-not-configured' });
  const b = bodyOf(req);
  if (!b || !TYPES.includes(b.type) || !/^[a-f0-9]{16,32}$/.test(b.pid || '')) return res.status(400).json({ error: 'invalid-event' });

  const day = dayKey();
  // every counter is kept twice: all links together ("") and per link (":main" / ":plus")
  const site = SITES.includes(b.site) ? b.site : 'main';
  const cmds = [];
  for (const sfx of ['', `:${site}`]) {
    cmds.push(['HINCRBY', `hpu:days${sfx}`, `${day}:${b.type}`, '1']);
    if (b.type === 'visit') {
      cmds.push(['PFADD', `hpu:u${sfx}`, b.pid], ['PFADD', `hpu:u${sfx}:${day}`, b.pid], ['EXPIRE', `hpu:u${sfx}:${day}`, String(KEEP_DAYS)]);
      if (DEVICE_TYPES.includes(b.device)) cmds.push(['HINCRBY', `hpu:dev${sfx}`, b.device, '1']);
    } else {
      const level = Number.isInteger(b.level) && b.level >= 0 && b.level < 10 ? b.level : -1;
      if (!GAMES.includes(b.game) || level < 0) return res.status(400).json({ error: 'invalid-event' });
      cmds.push(['HINCRBY', `hpu:lv${sfx}`, `${b.game}:${level}:${b.type}`, '1']);
      if (b.type === 'win' && Number.isInteger(b.stars) && b.stars >= 1 && b.stars <= 3) cmds.push(['HINCRBY', `hpu:lv${sfx}`, `${b.game}:${level}:stars`, String(b.stars)]);
    }
  }
  try {
    await pipeline(db, cmds);
    return res.status(204).end();
  } catch {
    return res.status(500).json({ error: 'storage-error' });
  }
};
