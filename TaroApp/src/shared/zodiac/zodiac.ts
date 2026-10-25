export type ZodiacSignId =
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpio"
  | "sagittarius"
  | "capricorn"
  | "aquarius"
  | "pisces";

export type ZodiacElement = string;

export type ZodiacSign = {
  id: ZodiacSignId;
  title: string;
  dates: string;
  element: ZodiacElement;
  planet: string;
  description: string;
  color: string;
  angle: number;
  icon: string;
};

export const ZODIAC_SIGNS: ZodiacSign[] = [
  {
    id: "aries",
    title: "Овен",
    dates: "21 мар — 19 апр",
    element: "Огонь",
    planet: "Марс",
    description: "Смелость, импульс и первый шаг. Ты зажигаешь путь там, где другие только собираются.",
    color: "#E0526D",
    angle: -90,
    icon: "zodiac-aries",
  },
  {
    id: "taurus",
    title: "Телец",
    dates: "20 апр — 20 май",
    element: "Земля",
    planet: "Венера",
    description: "Стабильность, вкус и внутренняя опора. Ты умеешь создавать красоту и надёжность.",
    color: "#3C766B",
    angle: -60,
    icon: "zodiac-taurus",
  },
  {
    id: "gemini",
    title: "Близнецы",
    dates: "21 май — 20 июн",
    element: "Воздух",
    planet: "Меркурий",
    description: "Слово, мысль и движение. Твой дар — видеть связи там, где другие видят случайность.",
    color: "#4D9EFF",
    angle: -30,
    icon: "zodiac-gemini",
  },
  {
    id: "cancer",
    title: "Рак",
    dates: "21 июн — 22 июл",
    element: "Вода",
    planet: "Луна",
    description: "Интуиция, память и глубина. Ты чувствуешь то, что ещё не было сказано.",
    color: "#6554E8",
    angle: 0,
    icon: "zodiac-cancer",
  },
  {
    id: "leo",
    title: "Лев",
    dates: "23 июл — 22 авг",
    element: "Огонь",
    planet: "Солнце",
    description: "Сияние, воля и сердце. Ты раскрываешь силу через смелость быть собой.",
    color: "#D94B78",
    angle: 30,
    icon: "zodiac-leo",
  },
  {
    id: "virgo",
    title: "Дева",
    dates: "23 авг — 22 сен",
    element: "Земля",
    planet: "Меркурий",
    description: "Точность, порядок и забота. Ты видишь детали, из которых собирается судьба.",
    color: "#3D7E75",
    angle: 60,
    icon: "zodiac-virgo",
  },
  {
    id: "libra",
    title: "Весы",
    dates: "23 сен — 22 окт",
    element: "Воздух",
    planet: "Венера",
    description: "Гармония, красота и выбор. Ты ищешь равновесие между сердцем и разумом.",
    color: "#46A7F0",
    angle: 90,
    icon: "zodiac-libra",
  },
  {
    id: "scorpio",
    title: "Скорпион",
    dates: "23 окт — 21 ноя",
    element: "Вода",
    planet: "Плутон",
    description: "Глубина, трансформация и тайна. Ты проходишь через тьму и находишь силу.",
    color: "#6A4CE8",
    angle: 120,
    icon: "zodiac-scorpio",
  },
  {
    id: "sagittarius",
    title: "Стрелец",
    dates: "22 ноя — 21 дек",
    element: "Огонь",
    planet: "Юпитер",
    description: "Свобода, смысл и дальний горизонт. Ты идёшь туда, где душа становится шире.",
    color: "#E06A55",
    angle: 150,
    icon: "zodiac-sagittarius",
  },
  {
    id: "capricorn",
    title: "Козерог",
    dates: "22 дек — 19 янв",
    element: "Земля",
    planet: "Сатурн",
    description: "Структура, выдержка и путь наверх. Ты умеешь строить то, что переживёт время.",
    color: "#477267",
    angle: 180,
    icon: "zodiac-capricorn",
  },
  {
    id: "aquarius",
    title: "Водолей",
    dates: "20 янв — 18 фев",
    element: "Воздух",
    planet: "Уран",
    description: "Идея, обновление и свобода мышления. Ты видишь будущее раньше других.",
    color: "#3F8EFF",
    angle: 210,
    icon: "zodiac-aquarius",
  },
  {
    id: "pisces",
    title: "Рыбы",
    dates: "19 фев — 20 мар",
    element: "Вода",
    planet: "Нептун",
    description: "Сны, эмпатия и тонкое чувство мира. Ты слышишь то, что приходит из глубины.",
    color: "#7462EE",
    angle: 240,
    icon: "zodiac-pisces",
  },
];

export function getZodiacTitle(sign?: string | null) {
  if (!sign) {
    return "Знак не выбран";
  }

  return ZODIAC_SIGNS.find((item) => item.id === sign)?.title ?? sign;
}
