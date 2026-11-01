// Bilingual support (Arabic / English). Arabic is the default.
import { store } from './store.js';

const STRINGS = {
  'app.name': { en: 'Happy Physics Universe', ar: 'كون الفيزياء السعيد' },
  'app.tagline': { en: 'Learn Physics. Play the Impossible.', ar: 'تعلّم الفيزياء. والعب المستحيل.' },
  'home.heroTitle': { en: 'Restore the six Energy Crystals!', ar: 'أعِد بلّورات الطاقة الست!' },
  'home.heroText': {
    en: 'Glitch Gloom scattered the crystals that power our world. Solve real physics puzzles in six regions to bring Motion, Water, Magnetism, Electricity, Light and Energy back.',
    ar: 'قام «جليتش جلوم» بتشتيت البلّورات التي تشغّل عالمنا. حُلّ ألغاز فيزياء حقيقية في ستة أقاليم لتعيد الحركة والماء والمغناطيسية والكهرباء والضوء والطاقة.'
  },
  'home.crystals': { en: 'Crystals', ar: 'البلّورات' },
  'home.stars': { en: 'Stars', ar: 'النجوم' },
  'home.progress': { en: 'Universe restored', ar: 'نسبة إنقاذ الكون' },
  'home.footer': { en: 'Original educational game • progress is saved on this device', ar: 'لعبة تعليمية أصلية • يُحفظ تقدّمك على هذا الجهاز' },
  'card.levels': { en: 'levels', ar: 'مراحل' },
  'card.play': { en: 'Play', ar: 'العب' },
  'card.restored': { en: 'Crystal restored', ar: 'البلّورة مستعادة' },
  'btn.lang': { en: 'عربي', ar: 'English' },
  'btn.story': { en: 'Story', ar: 'القصة' },
  'btn.achievements': { en: 'Achievements', ar: 'الإنجازات' },
  'btn.sound': { en: 'Sound', ar: 'الصوت' },
  'btn.tutorial': { en: 'How to play', ar: 'طريقة اللعب' },
  'btn.next': { en: 'Next level', ar: 'المرحلة التالية' },
  'btn.replay': { en: 'Replay', ar: 'إعادة' },
  'btn.retry': { en: 'Try again', ar: 'حاول مجددًا' },
  'btn.levels': { en: 'Levels', ar: 'المراحل' },
  'btn.home': { en: 'Home', ar: 'الرئيسية' },
  'btn.start': { en: "Let's go!", ar: 'هيا بنا!' },
  'btn.close': { en: 'Close', ar: 'إغلاق' },
  'btn.reset': { en: 'Reset progress', ar: 'مسح التقدّم' },
  'lv.choose': { en: 'Choose a level', ar: 'اختر مرحلة' },
  'lv.physics': { en: 'The physics inside', ar: 'الفيزياء داخل اللعبة' },
  'lv.level': { en: 'Level', ar: 'المرحلة' },
  'panel.controls': { en: 'Lab controls', ar: 'أدوات المختبر' },
  'panel.live': { en: 'Live measurements', ar: 'قياسات مباشرة' },
  'panel.equations': { en: 'Equations', ar: 'المعادلات' },
  'panel.terms': { en: 'Key terms', ar: 'المصطلحات' },
  'res.win': { en: 'Level complete!', ar: 'أحسنت! اجتزت المرحلة' },
  'res.lose': { en: 'Not quite…', ar: 'ليس بعد…' },
  'res.learned': { en: 'What you learned', ar: 'ماذا تعلّمت؟' },
  'res.quiz': { en: 'Quick check', ar: 'سؤال سريع' },
  'res.right': { en: 'Correct! ', ar: 'إجابة صحيحة! ' },
  'res.wrong': { en: 'Not this one. ', ar: 'ليست هذه. ' },
  'res.crystal': { en: 'Crystal restored!', ar: 'استعدت البلّورة!' },
  'res.universe': { en: 'You restored the whole Happy Physics Universe!', ar: 'لقد أنقذت كون الفيزياء السعيد بالكامل!' },
  'story.title': { en: 'The Lost Energy Crystals', ar: 'بلّورات الطاقة المفقودة' },
  'story.1': {
    en: 'Long ago, an ancient scientific kingdom ran on six Energy Crystals: Motion, Water, Magnetism, Electricity, Light and Energy.',
    ar: 'منذ زمن بعيد، كانت مملكة علمية قديمة تعمل بست بلّورات طاقة: الحركة، الماء، المغناطيسية، الكهرباء، الضوء، والطاقة.'
  },
  'story.2': {
    en: 'One stormy night, the mischievous Glitch Gloom and its Gloomlings broke the laws of the kingdom and scattered the crystals.',
    ar: 'في ليلة عاصفة، قام «جليتش جلوم» المشاغب وأتباعه «الجلوملينز» بالعبث بقوانين المملكة وتشتيت البلّورات.'
  },
  'story.3': {
    en: 'Nour the scientist owl needs a brave young physicist. Use real laws of physics to solve each region and restore the crystals!',
    ar: 'تحتاج البومة العالِمة «نور» إلى فيزيائي شجاع. استخدم قوانين الفيزياء الحقيقية لحلّ ألغاز كل إقليم واستعادة البلّورات!'
  },
  'ach.title': { en: 'Achievements', ar: 'الإنجازات' },
  'confirm.reset': { en: 'Erase all progress on this device?', ar: 'هل تريد مسح كل التقدّم على هذا الجهاز؟' },
  'ending.text': {
    en: 'All six crystals shine again. Motion, water, magnetism, electricity, light and energy are back in balance — thanks to your physics skills!',
    ar: 'عادت البلّورات الست تتلألأ من جديد. الحركة والماء والمغناطيسية والكهرباء والضوء والطاقة عادت إلى توازنها — بفضل مهاراتك في الفيزياء!'
  }
};

let lang = store.settings.lang || 'ar';

export function getLang() { return lang; }

export function setLang(l) {
  lang = l;
  store.settings.lang = l;
  store.save();
  applyDir();
}

export function applyDir() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
}

export function t(key) {
  const s = STRINGS[key];
  if (!s) return key;
  return s[lang] ?? s.en;
}

// Inline bilingual text: T('Speed', 'السرعة')
export function T(en, ar) { return lang === 'ar' ? ar : en; }

// Localised object: L({ en: '...', ar: '...' })
export function L(obj) {
  if (obj == null) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] ?? obj.en ?? '';
}
