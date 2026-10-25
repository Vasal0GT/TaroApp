import { AppLanguage } from "../i18n/translations";
import { ZodiacSign } from "./zodiac";

const ENGLISH_ZODIAC: Record<string, Pick<ZodiacSign, "title" | "dates" | "element" | "planet" | "description">> = {
  aries: {
    title: "Aries",
    dates: "Mar 21 - Apr 19",
    element: "Fire",
    planet: "Mars",
    description: "Courage, impulse, and the first step. You light the path where others are still preparing.",
  },
  taurus: {
    title: "Taurus",
    dates: "Apr 20 - May 20",
    element: "Earth",
    planet: "Venus",
    description: "Stability, taste, and inner grounding. You know how to create beauty and reliability.",
  },
  gemini: {
    title: "Gemini",
    dates: "May 21 - Jun 20",
    element: "Air",
    planet: "Mercury",
    description: "Words, thought, and movement. Your gift is seeing links where others see coincidence.",
  },
  cancer: {
    title: "Cancer",
    dates: "Jun 21 - Jul 22",
    element: "Water",
    planet: "Moon",
    description: "Intuition, memory, and depth. You feel what has not yet been said.",
  },
  leo: {
    title: "Leo",
    dates: "Jul 23 - Aug 22",
    element: "Fire",
    planet: "Sun",
    description: "Radiance, will, and heart. You reveal strength through the courage to be yourself.",
  },
  virgo: {
    title: "Virgo",
    dates: "Aug 23 - Sep 22",
    element: "Earth",
    planet: "Mercury",
    description: "Precision, order, and care. You notice the details destiny is made from.",
  },
  libra: {
    title: "Libra",
    dates: "Sep 23 - Oct 22",
    element: "Air",
    planet: "Venus",
    description: "Harmony, beauty, and choice. You seek balance between heart and mind.",
  },
  scorpio: {
    title: "Scorpio",
    dates: "Oct 23 - Nov 21",
    element: "Water",
    planet: "Pluto",
    description: "Depth, transformation, and mystery. You pass through shadow and find strength.",
  },
  sagittarius: {
    title: "Sagittarius",
    dates: "Nov 22 - Dec 21",
    element: "Fire",
    planet: "Jupiter",
    description: "Freedom, meaning, and a far horizon. You move toward places where the soul expands.",
  },
  capricorn: {
    title: "Capricorn",
    dates: "Dec 22 - Jan 19",
    element: "Earth",
    planet: "Saturn",
    description: "Structure, endurance, and the climb upward. You build what can outlast time.",
  },
  aquarius: {
    title: "Aquarius",
    dates: "Jan 20 - Feb 18",
    element: "Air",
    planet: "Uranus",
    description: "Ideas, renewal, and freedom of thought. You see the future earlier than others.",
  },
  pisces: {
    title: "Pisces",
    dates: "Feb 19 - Mar 20",
    element: "Water",
    planet: "Neptune",
    description: "Dreams, empathy, and a subtle sense of the world. You hear what rises from the deep.",
  },
};

export function getLocalizedZodiacSign(sign: ZodiacSign, language: AppLanguage): ZodiacSign {
  if (language === "ru") {
    return sign;
  }

  const translation = ENGLISH_ZODIAC[sign.id];

  if (!translation) {
    return sign;
  }

  return {
    ...sign,
    ...translation,
  };
}
