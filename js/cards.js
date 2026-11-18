// Scientist cards: finishing a world unlocks its scientist; beating the world's boss turns the card gold.
// Newton is the grand card, unlocked when all six worlds are complete.
import { L, T } from './i18n.js';

export const CARDS = [
  { id: 'galileo', world: 'bird', name: { ar: 'جاليليو جاليلي', en: 'Galileo Galilei' }, years: { ar: '1564 – 1642م • إيطاليا', en: '1564 – 1642 • Italy' },
    title: { ar: 'أبو علم الحركة', en: 'Father of the science of motion' },
    fact: { ar: 'أثبت أن الجسم المقذوف يتحرك في مسار على شكل قطع مكافئ، وأن الأجسام تسقط بالتسارع نفسه إذا أهملنا مقاومة الهواء.', en: 'Showed that a thrown object follows a parabola, and that objects fall with the same acceleration when air resistance is ignored.' },
    look: { skin: '#f1c9a5', hair: '#9a9a9a', hairStyle: 'side', beard: 'full', beardColor: '#a7a7a7', top: 'none', robe: '#3b2a5a', collar: '#e8e0d0' } },
  { id: 'archimedes', world: 'water', name: { ar: 'أرخميدس', en: 'Archimedes' }, years: { ar: 'نحو 287 – 212 ق.م • صقلية', en: 'c. 287 – 212 BC • Sicily' },
    title: { ar: 'صاحب قاعدة الطفو', en: 'Discoverer of buoyancy' },
    fact: { ar: 'اكتشف أن السائل يدفع الجسم المغمور فيه لأعلى بقوة تساوي وزن السائل الذي يزيحه، وتُعرف هذه بقاعدة أرخميدس.', en: 'Found that a liquid pushes up on an immersed object with a force equal to the weight of the liquid it displaces: Archimedes\' principle.' },
    look: { skin: '#e8b98f', hair: '#e9e4da', hairStyle: 'curly', beard: 'full', beardColor: '#efeae0', top: 'laurel', robe: '#f2ead8', collar: '#d9cbb0' } },
  { id: 'faraday', world: 'magnet', name: { ar: 'مايكل فاراداي', en: 'Michael Faraday' }, years: { ar: '1791 – 1867م • إنجلترا', en: '1791 – 1867 • England' },
    title: { ar: 'مكتشف الحث الكهرومغناطيسي', en: 'Discoverer of electromagnetic induction' },
    fact: { ar: 'اكتشف عام 1831م أن تحريك مغناطيس داخل ملف يولّد تيارًا كهربائيًا، وعلى هذه الفكرة تعمل المولدات الكهربائية اليوم.', en: 'In 1831 he found that moving a magnet in a coil makes an electric current — the idea behind today\'s generators.' },
    look: { skin: '#f3cfae', hair: '#6b4a2e', hairStyle: 'wavy', beard: 'sideburns', beardColor: '#6b4a2e', top: 'none', robe: '#1f2a44', collar: '#ffffff', tie: '#1a1a1a' } },
  { id: 'ohm', world: 'circuit', name: { ar: 'جورج سيمون أوم', en: 'Georg Simon Ohm' }, years: { ar: '1789 – 1854م • ألمانيا', en: '1789 – 1854 • Germany' },
    title: { ar: 'صاحب قانون أوم', en: 'The man behind Ohm\'s law' },
    fact: { ar: 'وجد أن التيار في الموصل يتناسب مع فرق الجهد (الجهد = التيار × المقاومة)، وسُمّيت وحدة المقاومة «أوم» باسمه.', en: 'Found that current in a conductor is proportional to voltage (V = I × R); the unit of resistance, the ohm, is named after him.' },
    look: { skin: '#f0c8a4', hair: '#3a2a20', hairStyle: 'side', beard: 'none', top: 'none', robe: '#2d3a2e', collar: '#ffffff', tie: '#5a1a1a' } },
  { id: 'ibnhaytham', world: 'light', name: { ar: 'ابن الهيثم', en: 'Ibn al-Haytham' }, years: { ar: 'نحو 965 – 1040م • البصرة والقاهرة', en: 'c. 965 – 1040 • Basra & Cairo' },
    title: { ar: 'رائد علم البصريات', en: 'Pioneer of optics' },
    fact: { ar: 'ألّف «كتاب المناظر»، وأثبت أن الرؤية تحدث بدخول الضوء إلى العين، ودرس الانعكاس والانكسار، ويُعد من رواد المنهج التجريبي.', en: 'Wrote the Book of Optics, showed that we see because light enters the eye, studied reflection and refraction, and pioneered the experimental method.' },
    look: { skin: '#d9a77a', hair: '#2a1a12', hairStyle: 'none', beard: 'full', beardColor: '#2a1a12', top: 'turban', robe: '#2f5d50', collar: '#e8dcc0' } },
  { id: 'joule', world: 'energy', name: { ar: 'جيمس جول', en: 'James Prescott Joule' }, years: { ar: '1818 – 1889م • إنجلترا', en: '1818 – 1889 • England' },
    title: { ar: 'صديق حفظ الطاقة', en: 'Champion of energy conservation' },
    fact: { ar: 'بيّن أن الشغل الميكانيكي يتحول إلى حرارة بمقدار ثابت، فدعم مبدأ حفظ الطاقة، وسُمّيت وحدة الطاقة «جول» باسمه.', en: 'Showed that mechanical work turns into heat at a fixed rate, supporting conservation of energy; the unit of energy, the joule, is named after him.' },
    look: { skin: '#f2cba8', hair: '#5a3b22', hairStyle: 'side', beard: 'full', beardColor: '#5a3b22', top: 'none', robe: '#3a2a1e', collar: '#ffffff', tie: '#202020' } },
  { id: 'newton', world: 'all', name: { ar: 'إسحاق نيوتن', en: 'Isaac Newton' }, years: { ar: '1643 – 1727م • إنجلترا', en: '1643 – 1727 • England' },
    title: { ar: 'البطاقة الكبرى: قوانين الحركة', en: 'Grand card: the laws of motion' },
    fact: { ar: 'وضع قوانين الحركة الثلاثة وقانون الجذب العام، فشرح بها حركة الأجسام على الأرض وحركة الكواكب في السماء.', en: 'Wrote the three laws of motion and the law of universal gravitation, explaining motion on Earth and of the planets alike.' },
    look: { skin: '#f3d0b0', hair: '#ece6dc', hairStyle: 'long', beard: 'none', top: 'none', robe: '#5a1f2e', collar: '#ffffff', tie: '#ffffff' } }
];

let uid = 0;
// Illustrated portrait (not a photo): face, hair, beard, headwear and clothes from each card's "look".
export function portraitSVG(card) {
  const k = card.look, u = `p${++uid}`;
  const hair = {
    side: `<path d="M34 50 Q34 22 60 20 Q88 20 88 50 Q84 34 70 32 Q52 30 40 40Z" fill="${k.hair}"/>`,
    wavy: `<path d="M32 54 Q28 24 60 18 Q92 22 88 54 Q86 40 78 36 Q70 44 62 34 Q54 44 46 36 Q38 42 32 54Z" fill="${k.hair}"/>`,
    curly: `<g fill="${k.hair}">${[[38, 34], [48, 26], [60, 23], [72, 26], [82, 34], [34, 46], [86, 46]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9"/>`).join('')}</g>`,
    long: `<path d="M30 52 Q28 18 60 18 Q92 18 90 52 L94 96 Q86 104 80 96 L82 60 Q78 40 60 38 Q42 40 38 60 L40 96 Q34 104 26 96Z" fill="${k.hair}"/><g fill="none" stroke="#cfc6b8" stroke-width="2">${[0, 1, 2].map(i => `<path d="M${30 + i * 2} ${66 + i * 10} q6 4 0 8"/><path d="M${90 - i * 2} ${66 + i * 10} q-6 4 0 8"/>`).join('')}</g>`,
    none: ''
  }[k.hairStyle] || '';
  const beard = {
    full: `<path d="M38 62 Q40 98 60 102 Q80 98 82 62 Q78 80 60 82 Q42 80 38 62Z" fill="${k.beardColor}"/>`,
    sideburns: `<path d="M36 52 L38 74 Q42 70 42 56Z M84 52 L82 74 Q78 70 78 56Z" fill="${k.beardColor}"/>`,
    none: ''
  }[k.beard] || '';
  const top = {
    laurel: `<g fill="#6aa84f">${[-3, -2, -1, 0, 1, 2, 3].map(i => `<ellipse cx="${60 + i * 9}" cy="${26 + Math.abs(i) * 3}" rx="5" ry="3" transform="rotate(${i * 18} ${60 + i * 9} ${26 + Math.abs(i) * 3})"/>`).join('')}</g>`,
    turban: `<path d="M30 46 Q28 14 60 12 Q92 14 90 46 Q86 36 60 34 Q34 36 30 46Z" fill="#f4efe4" stroke="#d8cfbc" stroke-width="2"/><path d="M36 30 Q60 22 84 30 M34 38 Q60 30 86 38" stroke="#d8cfbc" stroke-width="2" fill="none"/>`,
    none: ''
  }[k.top] || '';
  return `
  <svg class="portrait" viewBox="0 0 120 130" aria-hidden="true">
    <defs><radialGradient id="${u}" cx=".5" cy=".35"><stop offset="0" stop-color="#fff5d6"/><stop offset="1" stop-color="#f1c870"/></radialGradient></defs>
    <rect x="0" y="0" width="120" height="130" fill="url(#${u})"/>
    <path d="M14 130 Q18 100 60 96 Q102 100 106 130Z" fill="${k.robe}"/>
    <path d="M44 100 L60 116 L76 100 Q60 106 44 100Z" fill="${k.collar}"/>
    ${k.tie ? `<path d="M54 104 L60 112 L66 104 L60 100Z" fill="${k.tie}"/>` : ''}
    <rect x="52" y="78" width="16" height="22" rx="6" fill="${k.skin}"/>
    <ellipse cx="60" cy="56" rx="24" ry="28" fill="${k.skin}"/>
    <ellipse cx="36" cy="58" rx="4" ry="6" fill="${k.skin}"/><ellipse cx="84" cy="58" rx="4" ry="6" fill="${k.skin}"/>
    ${k.hairStyle === 'long' ? hair : ''}
    ${beard}
    <circle cx="51" cy="54" r="3" fill="#2a1a12"/><circle cx="69" cy="54" r="3" fill="#2a1a12"/>
    <path d="M46 47 Q51 44 56 47 M64 47 Q69 44 74 47" stroke="#4a3020" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M60 56 Q58 64 61 66" stroke="#b07a55" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M53 72 Q60 77 67 72" stroke="#8a4a3a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    ${k.hairStyle !== 'long' ? hair : ''}
    ${top}
  </svg>`;
}

// state: 'locked' | 'normal' | 'gold'
export function cardHTML(card, state, { big = false } = {}) {
  if (state === 'locked') {
    return `<div class="sci-card locked ${big ? 'big' : ''}" data-card="${card.id}"><div class="sc-frame"><div class="sc-lock">❓</div><div class="sc-name">${T('Locked card', 'بطاقة مقفلة')}</div>
      <div class="sc-hint">${card.world === 'all' ? T('Finish all six worlds', 'أكمل العوالم الستة') : T('Finish its world to unlock', 'أكمل عالمها لتفتحها')}</div></div></div>`;
  }
  return `
  <div class="sci-card ${state} ${big ? 'big' : ''}" data-card="${card.id}">
    <div class="sc-frame">
      ${state === 'gold' ? `<div class="sc-rare">✨ ${T('Gold', 'ذهبية')}</div>` : ''}
      <div class="sc-art">${portraitSVG(card)}</div>
      <div class="sc-name">${L(card.name)}</div>
      <div class="sc-title">${L(card.title)}</div>
      ${big ? `<div class="sc-years">${L(card.years)}</div><p class="sc-fact">💡 ${L(card.fact)}</p>` : ''}
    </div>
  </div>`;
}
