// Play statistics: visits, level starts, wins and fails (anonymous), plus a "new player" alert.
//   POST /api/events  body {type: visit|start|win|fail|join, pid, site?, game?, level?, stars?, device?, name?, age?, role?}
// pid is a random id the browser keeps, used only to count unique players.
// "join" is sent every time a player enters (after the welcome page, then once per visit): it counts the
// entry and sends the owner a Telegram message (new or returning player, name, age, role, device, link).
const { store, pipeline, bodyOf, text, telegram, device, GAMES, ROLES, DEVICE_TYPES, dayKey } = require('./_db');

const TYPES = ['visit', 'start', 'win', 'fail', 'join'];
const SITES = ['main', 'plus'];
const KEEP_DAYS = 120 * 86400;
const JOIN_ALERTS_PER_MINUTE = 20;   // guards the owner's Telegram against a flood

const ROLE_AR = { student: '🎒 طالب', teacher: '👩‍🏫 معلم / دكتور', employee: '💼 موظف', parent: '👨‍👩‍👧 ولي أمر', other: '✨ أخرى' };
const OS_AR = { iPhone: 'آيفون', iPad: 'آيباد', Android: 'أندرويد', Windows: 'ويندوز', Mac: 'ماك', ChromeOS: 'كروم بوك', Linux: 'لينكس', other: 'جهاز آخر' };
const TYPE_AR = { phone: '📱', tablet: '📟', computer: '💻' };

async function join(db, b, site, req) {
  const name = text(b.name, 40);
  const age = Number.isInteger(b.age) && b.age >= 3 && b.age <= 99 ? b.age : null;
  const role = ROLES.includes(b.role) ? b.role : null;
  if (!name || !age || !role) return 400;
  const minute = `hpu:joinrate:${Math.floor(Date.now() / 60000)}`;
  const day = dayKey();
  const [isNew, perMinute] = await pipeline(db, [
    ['SADD', 'hpu:joined', b.pid],
    ['INCR', minute],
    ['EXPIRE', minute, '120'],
    ['HINCRBY', 'hpu:days', `${day}:join`, '1'],
    ['HINCRBY', `hpu:days:${site}`, `${day}:join`, '1']
  ]);
  if (perMinute > JOIN_ALERTS_PER_MINUTE) return 204;   // too many at once: count them but spare the owner's phone
  const d = device(req.headers['user-agent'], b.device);
  const link = site === 'plus' ? 'الرابط الثاني' : 'الرابط الأول';
  await telegram([
    isNew ? `🎉 لاعب جديد دخل كون الفيزياء السعيد (${link})` : `🔁 لاعب دخل كون الفيزياء السعيد (${link})`,
    `👤 ${name} • العمر ${age > 16 ? '16+' : age} • ${ROLE_AR[role]}`,
    `${TYPE_AR[d.type] || '📱'} ${OS_AR[d.os] || d.os}${d.osVer ? ' ' + d.osVer : ''}${d.browser !== 'other' ? ' • ' + d.browser : ''}`
  ].join('\n'));
  return 204;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'method-not-allowed' }); }
  const db = store();
  if (!db) return res.status(503).json({ error: 'storage-not-configured' });
  const b = bodyOf(req);
  if (!b || !TYPES.includes(b.type) || !/^[a-f0-9]{16,32}$/.test(b.pid || '')) return res.status(400).json({ error: 'invalid-event' });
  const site = SITES.includes(b.site) ? b.site : 'main';

  try {
    if (b.type === 'join') {
      const code = await join(db, b, site, req);
      return code === 204 ? res.status(204).end() : res.status(code).json({ error: 'invalid-event' });
    }

    const day = dayKey();
    // every counter is kept twice: all links together ("") and per link (":main" / ":plus")
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
    await pipeline(db, cmds);
    return res.status(204).end();
  } catch {
    return res.status(500).json({ error: 'storage-error' });
  }
};
