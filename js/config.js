// Editable content: game titles, lesson names, grade labels and descriptions.
// Change text here without touching game code. Grade labels are intentionally
// generic — adjust them to match your own curriculum.

// false: every level is open from the start (handy in class).
// true: a level opens only after the one before it is completed.
export const LOCK_LEVELS = false;

export const GAMES = [
  {
    id: 'bird',
    crystal: 'motion',
    color: '#ff9f1c',
    title: { en: 'Happy Bird: Sky Mission', ar: 'الطائر السعيد: مهمة السماء' },
    lesson: { en: 'Projectile Motion', ar: 'حركة المقذوفات' },
    concept: { en: 'Kinematics', ar: 'علم الحركة' },
    grade: { en: 'High school physics', ar: 'فيزياء المرحلة الثانوية' },
    description: {
      en: 'Launch Fizz with the slingshot. Pick the launch speed and angle, watch the trajectory and knock out the Gloomlings on Earth, the Moon and Mars.',
      ar: 'أطلق «فِز» بالمقلاع. اختر سرعة الإطلاق والزاوية، وراقب المسار، وأسقط الجلوملينز على الأرض والقمر والمريخ.'
    }
  },
  {
    id: 'water',
    crystal: 'water',
    color: '#2ec4f1',
    title: { en: 'Rescue the King: Water Kingdom', ar: 'أنقذ الملك: مملكة الماء' },
    lesson: { en: 'Fluid Pressure and Buoyancy', ar: 'ضغط الموائع والطفو' },
    concept: { en: 'Fluids', ar: 'الموائع' },
    grade: { en: 'High school physics', ar: 'فيزياء المرحلة الثانوية' },
    description: {
      en: 'Pull the pins in the right order. Use pressure, communicating vessels and buoyancy to float King Bubbles to safety — and keep the lava away!',
      ar: 'اسحب المسامير بالترتيب الصحيح. استخدم الضغط والأواني المستطرقة والطفو لترفع الملك «فقاعة» إلى بر الأمان — وابتعد عن الحمم!'
    }
  },
  {
    id: 'magnet',
    crystal: 'magnetism',
    color: '#ff5d8f',
    title: { en: 'Magnet Hero: Power Factory', ar: 'بطل المغناطيس: مصنع الطاقة' },
    lesson: { en: 'Electromagnetic Induction', ar: 'الحث الكهرومغناطيسي' },
    concept: { en: 'Faraday & Lenz', ar: 'فاراداي ولنز' },
    grade: { en: 'High school physics', ar: 'فيزياء المرحلة الثانوية' },
    description: {
      en: 'Move magnets through coils and spin generators. Change the magnetic flux to create current, unlock gates and power the factory.',
      ar: 'حرّك المغناطيس داخل الملفات وأدِر المولّدات. غيّر التدفق المغناطيسي لتولّد تيارًا، وافتح البوابات، وشغّل المصنع.'
    }
  },
  {
    id: 'circuit',
    crystal: 'electricity',
    color: '#ffd23f',
    title: { en: 'Circuit Quest: Light the City', ar: 'مغامرة الدوائر: أضئ المدينة' },
    lesson: { en: "Electrical Circuits and Ohm's Law", ar: 'الدوائر الكهربائية وقانون أوم' },
    concept: { en: 'V = I R', ar: 'قانون أوم' },
    grade: { en: 'High school physics', ar: 'فيزياء المرحلة الثانوية' },
    description: {
      en: 'Place wires, resistors and batteries to light every house — not too dim, not burnt out. Series, parallel and short circuits all matter.',
      ar: 'ضع الأسلاك والمقاومات والبطاريات لتضيء كل البيوت — لا خافتة ولا محترقة. التوالي والتوازي وقصر الدائرة كلها مهمة.'
    }
  },
  {
    id: 'light',
    crystal: 'light',
    color: '#9b5de5',
    title: { en: 'Light Maze: Laser Escape', ar: 'متاهة الضوء: هروب الليزر' },
    lesson: { en: 'Reflection and Refraction', ar: 'انعكاس الضوء وانكساره' },
    concept: { en: 'Optics', ar: 'البصريات' },
    grade: { en: 'High school physics', ar: 'فيزياء المرحلة الثانوية' },
    description: {
      en: 'Rotate mirrors, choose glass and prisms, and bend the laser beam to the crystal. Discover Snell\'s law and total internal reflection.',
      ar: 'دوّر المرايا، واختر الزجاج والمناشير، ووجّه شعاع الليزر إلى البلّورة. اكتشف قانون سنل والانعكاس الكلي الداخلي.'
    }
  },
  {
    id: 'energy',
    crystal: 'energy',
    color: '#00bb77',
    title: { en: 'Energy Rider: Roller Coaster Challenge', ar: 'راكب الطاقة: تحدي الأفعوانية' },
    lesson: { en: 'Conservation of Mechanical Energy', ar: 'حفظ الطاقة الميكانيكية' },
    concept: { en: 'KE + PE', ar: 'الحركية + الوضع' },
    grade: { en: 'High school physics', ar: 'فيزياء المرحلة الثانوية' },
    description: {
      en: 'Pick the starting height so the coaster clears hills and loops — but arrives slowly enough to stop at the station. Watch energy change form.',
      ar: 'اختر ارتفاع البداية لتعبر العربة التلال والحلقات — وتصل ببطء كافٍ لتتوقف في المحطة. راقب تحوّل الطاقة من شكل لآخر.'
    }
  }
];

export const CRYSTAL_COLORS = {
  motion: '#ff9f1c',
  water: '#2ec4f1',
  magnetism: '#ff5d8f',
  electricity: '#ffd23f',
  light: '#9b5de5',
  energy: '#00bb77'
};

export const ACHIEVEMENTS = [
  { id: 'first_win', icon: '🎉', name: { en: 'First Discovery', ar: 'أول اكتشاف' }, desc: { en: 'Complete any level', ar: 'أكمل أي مرحلة' } },
  { id: 'perfect', icon: '⭐', name: { en: 'Perfect Experiment', ar: 'تجربة مثالية' }, desc: { en: 'Get 3 stars on a level', ar: 'احصل على 3 نجوم في مرحلة' } },
  { id: 'explorer', icon: '🧭', name: { en: 'Explorer', ar: 'المستكشف' }, desc: { en: 'Play all six games', ar: 'العب الألعاب الست كلها' } },
  { id: 'crystal_1', icon: '💎', name: { en: 'Crystal Keeper', ar: 'حارس البلّورة' }, desc: { en: 'Restore your first crystal', ar: 'استعد أول بلّورة' } },
  { id: 'stars_30', icon: '🌟', name: { en: 'Star Collector', ar: 'جامع النجوم' }, desc: { en: 'Collect 30 stars', ar: 'اجمع 30 نجمة' } },
  { id: 'quiz_10', icon: '🧠', name: { en: 'Quiz Whiz', ar: 'عبقري الأسئلة' }, desc: { en: 'Answer 10 quick checks correctly', ar: 'أجب 10 أسئلة سريعة إجابة صحيحة' } },
  { id: 'all_crystals', icon: '👑', name: { en: 'Universe Guardian', ar: 'حامي الكون' }, desc: { en: 'Restore all six crystals', ar: 'استعد البلّورات الست' } },
  { id: 'all_stars', icon: '🏆', name: { en: 'Physics Legend', ar: 'أسطورة الفيزياء' }, desc: { en: 'Get every star in the universe', ar: 'احصل على كل النجوم في الكون' } }
];
