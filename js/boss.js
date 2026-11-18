// Boss fights: each world ends with a "Glitch" monster. You beat it by winning three rounds in a row
// (harder variants of the world's own levels); every win is a hit that drains its health.
import { L, T } from './i18n.js';

export const BOSS_HP = 3;

export const BOSSES = {
  bird: {
    name: { ar: 'غليتش الرياح', en: 'Wind Glitch' }, color: '#3ec7ff', dark: '#155a8a', horns: 'wings', eyes: 2, rounds: [2, 3, 4],
    taunts: { ar: ['لن تصيب أي هدف وأنا أنفخ!', 'قذائفك تضيع في الهواء!', 'زاوية خاطئة يا صغير!'], en: ['You won\'t hit a thing while I blow!', 'Your shots get lost in the air!', 'Wrong angle, kid!'] },
    lesson: { ar: 'اضبط السرعة والزاوية بدقة: المسار قطع مكافئ.', en: 'Tune speed and angle: the path is a parabola.' }
  },
  water: {
    name: { ar: 'غليتش الطين', en: 'Mud Glitch' }, color: '#c08a4a', dark: '#5e3b17', horns: 'drips', eyes: 3, rounds: [2, 3, 4],
    taunts: { ar: ['سأسدّ كل الصمامات!', 'الملك سيغرق في عسلي!', 'الضغط كله لي!'], en: ['I\'ll clog every valve!', 'The king will sink in my honey!', 'All the pressure is mine!'] },
    lesson: { ar: 'تذكّر: الضغط يزيد مع العمق، والأكثف يغوص للأسفل.', en: 'Remember: pressure grows with depth; denser liquids sink.' }
  },
  magnet: {
    name: { ar: 'غليتش الصدأ', en: 'Rust Glitch' }, color: '#ff7a4d', dark: '#7a2c12', horns: 'horns', eyes: 2, rounds: [2, 3, 4],
    taunts: { ar: ['سأقلب أقطابك!', 'لا تيار بدون حركة… ولن تتحرك!', 'مغناطيسك ضعيف!'], en: ['I\'ll flip your poles!', 'No motion, no current… and you won\'t move!', 'Your magnet is weak!'] },
    lesson: { ar: 'التيار يتولد فقط عندما يتغير التدفق المغناطيسي.', en: 'Current appears only while the magnetic flux changes.' }
  },
  circuit: {
    name: { ar: 'غليتش الشرارة', en: 'Spark Glitch' }, color: '#ffd23e', dark: '#7a5a00', horns: 'bolts', eyes: 1, rounds: [2, 3, 4],
    taunts: { ar: ['سأحرق مصابيحك!', 'مقاومة؟ أنا لا أقاوَم!', 'دائرة مفتوحة… هاها!'], en: ['I\'ll burn your bulbs!', 'Resistance? I can\'t be resisted!', 'Open circuit… ha ha!'] },
    lesson: { ar: 'قانون أوم: الجهد = التيار × المقاومة.', en: 'Ohm\'s law: V = I × R.' }
  },
  light: {
    name: { ar: 'غليتش الظلام', en: 'Shadow Glitch' }, color: '#9b6bff', dark: '#3a1a7a', horns: 'antenna', eyes: 3, rounds: [2, 3, 4],
    taunts: { ar: ['سأطفئ كل شعاع!', 'مراياك لا تخيفني!', 'الضوء سيتوه في ظلامي!'], en: ['I\'ll put out every beam!', 'Your mirrors don\'t scare me!', 'Light will get lost in my dark!'] },
    lesson: { ar: 'زاوية السقوط = زاوية الانعكاس، والضوء ينكسر عند تغيّر الوسط.', en: 'Angle in = angle out; light bends when the medium changes.' }
  },
  energy: {
    name: { ar: 'غليتش الاحتكاك', en: 'Friction Glitch' }, color: '#4dff9a', dark: '#14703f', horns: 'spikes', eyes: 2, rounds: [2, 3, 4],
    taunts: { ar: ['سأسرق طاقتك!', 'ستتوقف قبل القمة!', 'الاحتكاك صديقي!'], en: ['I\'ll steal your energy!', 'You\'ll stop before the top!', 'Friction is my friend!'] },
    lesson: { ar: 'الطاقة لا تفنى: تتحول بين وضع وحركة وحرارة.', en: 'Energy is never lost: it changes between height, motion and heat.' }
  }
};

// Cartoon "glitch" monster as SVG; ids are unique per copy so several can be on screen.
let uid = 0;
export function monsterSVG(id, cls = '') {
  const b = BOSSES[id];
  const u = `m${++uid}`;
  const eyes = b.eyes === 1 ? [[60, 52, 15]] : b.eyes === 3 ? [[42, 54, 9], [60, 46, 11], [78, 54, 9]] : [[46, 52, 11], [74, 52, 11]];
  const extra = {
    wings: `<path d="M18 62 Q-4 40 6 22 Q20 40 28 48Z M102 62 Q124 40 114 22 Q100 40 92 48Z" fill="${b.color}" opacity=".85"/>`,
    drips: `<path d="M34 98 q4 14 0 18 q-4-4 0-18Z M60 102 q5 16 0 20 q-5-4 0-20Z M86 98 q4 14 0 18 q-4-4 0-18Z" fill="${b.dark}"/>`,
    horns: `<path d="M34 30 L24 6 L44 24Z M86 30 L96 6 L76 24Z" fill="#fff3e0" stroke="${b.dark}" stroke-width="2"/>`,
    bolts: `<path d="M30 28 L22 14 L32 16 L26 2 M90 28 L98 14 L88 16 L94 2" fill="none" stroke="${b.color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
    antenna: `<path d="M48 26 Q40 10 30 8 M72 26 Q80 10 90 8" fill="none" stroke="${b.dark}" stroke-width="3"/><circle cx="30" cy="8" r="5" fill="${b.color}"/><circle cx="90" cy="8" r="5" fill="${b.color}"/>`,
    spikes: `<path d="M30 30 l6-16 l6 14 l6-18 l6 16 l6-16 l6 18 l6-14 l6 16" fill="${b.dark}"/>`
  }[b.horns];
  return `
  <svg class="monster ${cls}" viewBox="-10 -6 140 136" aria-hidden="true">
    <defs>
      <radialGradient id="${u}b" cx=".4" cy=".35"><stop offset="0" stop-color="#ffffff" stop-opacity=".55"/><stop offset=".35" stop-color="${b.color}"/><stop offset="1" stop-color="${b.dark}"/></radialGradient>
    </defs>
    ${b.horns === 'wings' || b.horns === 'spikes' ? extra : ''}
    <path class="m-body" d="M60 22 C92 22 108 46 106 74 C104 98 88 112 60 112 C32 112 14 98 14 74 C12 46 28 22 60 22Z" fill="url(#${u}b)" stroke="${b.dark}" stroke-width="3"/>
    ${b.horns !== 'wings' && b.horns !== 'spikes' ? extra : ''}
    <g class="m-glitch" fill="${b.color}" opacity=".9"><rect x="96" y="40" width="10" height="6"/><rect x="104" y="58" width="7" height="5"/><rect x="10" y="80" width="9" height="6"/><rect x="4" y="62" width="6" height="5"/></g>
    ${eyes.map(([x, y, r]) => `<g class="m-eye"><circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/><circle class="m-pupil" cx="${x}" cy="${y + 1}" r="${r * .5}" fill="#1a0b2e"/><circle cx="${x - r * .3}" cy="${y - r * .3}" r="${r * .18}" fill="#fff"/></g>`).join('')}
    <path class="m-mouth" d="M40 84 Q60 98 80 84 L74 90 L68 84 L62 92 L56 84 L50 92 L44 84Z" fill="#1a0b2e"/>
    <path class="m-brows" d="M34 36 L54 42 M86 36 L66 42" stroke="#1a0b2e" stroke-width="4" stroke-linecap="round"/>
  </svg>`;
}

// On-stage HUD: the monster in a corner, its name, hearts and a speech bubble.
export function bossHUD(id, hp) {
  const b = BOSSES[id];
  return `
  <div class="boss-hud" id="boss-hud" style="--boss:${b.color};--boss-dark:${b.dark}">
    <div class="boss-bubble" id="boss-bubble"></div>
    ${monsterSVG(id)}
    <div class="boss-name">${L(b.name)}</div>
    <div class="boss-hp" aria-label="${T('Boss health', 'طاقة الزعيم')}">${Array.from({ length: BOSS_HP }, (_, i) => `<i class="${i < hp ? 'on' : ''}"></i>`).join('')}</div>
  </div>`;
}

export function setBossHP(hp) {
  document.querySelectorAll('#boss-hud .boss-hp i').forEach((h, i) => h.classList.toggle('on', i < hp));
}

export function bossSay(id, text, ms = 2600) {
  const el = document.getElementById('boss-bubble');
  if (!el) return;
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), ms);
}

export function bossHit() {
  const hud = document.getElementById('boss-hud');
  if (!hud) return;
  hud.classList.remove('hit');
  void hud.offsetWidth;
  hud.classList.add('hit');
}

export const randomTaunt = id => { const list = L(BOSSES[id].taunts); return list[Math.floor(Math.random() * list.length)]; };
