import { AppLanguage } from "../i18n/translations";
import { TAROT_DECK, TarotDeckCard } from "../../constants/tarotDeck";

type LocalizedCard = {
  name: string;
  meaningUpright: string;
  meaningReversed: string;
};

const ENGLISH_CARDS: Record<number, LocalizedCard> = {
  1: { name: "The Fool", meaningUpright: "A new beginning, freedom, trust, spontaneity.", meaningReversed: "Carelessness, chaos, an immature choice, risk without awareness." },
  2: { name: "The Magician", meaningUpright: "Willpower, action, talent, the ability to influence events.", meaningReversed: "Manipulation, scattered focus, unused potential." },
  3: { name: "The High Priestess", meaningUpright: "Intuition, hidden knowledge, inner voice, observation.", meaningReversed: "Ignoring intuition, secrecy, inner noise." },
  4: { name: "The Empress", meaningUpright: "Growth, care, abundance, creativity, feminine energy.", meaningReversed: "Stagnation, overprotection, depletion, dependence on comfort." },
  5: { name: "The Emperor", meaningUpright: "Structure, control, responsibility, stability.", meaningReversed: "Rigidity, pressure, stubbornness, loss of control." },
  6: { name: "The Hierophant", meaningUpright: "Tradition, guidance, rules, a spiritual system.", meaningReversed: "Rebellion against rules, dogma, borrowed beliefs." },
  7: { name: "The Lovers", meaningUpright: "Choice, union, attraction, harmony between heart and mind.", meaningReversed: "Doubt, disharmony, a misaligned choice, values pulling apart." },
  8: { name: "The Chariot", meaningUpright: "Forward motion, victory, discipline, control of direction.", meaningReversed: "Losing direction, haste, clashing forces, lack of focus." },
  9: { name: "Strength", meaningUpright: "Inner strength, gentle control, patience, courage.", meaningReversed: "Weakness, irritation, fear, suppressed emotions." },
  10: { name: "The Hermit", meaningUpright: "Self-reflection, wisdom, pause, the search for truth.", meaningReversed: "Isolation, withdrawal, loneliness, avoiding people." },
  11: { name: "Wheel of Fortune", meaningUpright: "Change, opportunity, a turn of fate, cycles.", meaningReversed: "Resistance to change, repeated mistakes, instability." },
  12: { name: "Justice", meaningUpright: "Honesty, balance, law, consequences of choices.", meaningReversed: "Unfairness, self-deception, imbalance, avoiding responsibility." },
  13: { name: "The Hanged Man", meaningUpright: "Pause, a new perspective, acceptance, voluntary stillness.", meaningReversed: "Stagnation, resistance, sacrifice without meaning." },
  14: { name: "Death", meaningUpright: "Ending, transformation, release of the old.", meaningReversed: "Fear of change, clinging to the past, delayed closure." },
  15: { name: "Temperance", meaningUpright: "Balance, healing, harmony, gradual progress.", meaningReversed: "Extremes, impatience, inner imbalance." },
  16: { name: "The Devil", meaningUpright: "Attachment, temptation, dependence, strong desire.", meaningReversed: "Liberation, breaking a toxic bond, regaining control." },
  17: { name: "The Tower", meaningUpright: "Sudden rupture, illusions falling, unexpected truth.", meaningReversed: "A prolonged crisis, fear of collapse, holding the unstable." },
  18: { name: "The Star", meaningUpright: "Hope, inspiration, recovery, faith in the future.", meaningReversed: "Loss of faith, fatigue, disappointment, closing off." },
  19: { name: "The Moon", meaningUpright: "Uncertainty, fears, dreams, hidden motives.", meaningReversed: "Clarity, secrets revealed, stepping out of illusion." },
  20: { name: "The Sun", meaningUpright: "Joy, success, clarity, energy, openness.", meaningReversed: "Delayed joy, overconfidence, temporary confusion." },
  21: { name: "Judgement", meaningUpright: "Awakening, decision, outcome, an important inner turn.", meaningReversed: "Self-criticism, refusing the call, an unfinished lesson." },
  22: { name: "The World", meaningUpright: "Completion, wholeness, achievement, a new level.", meaningReversed: "Incompletion, delay, an unfinished cycle." },
  23: { name: "Ace of Wands", meaningUpright: "Impulse, inspiration, a new project, action energy.", meaningReversed: "Lost motivation, delayed start, a weak spark." },
  24: { name: "Two of Wands", meaningUpright: "Planning, choosing a direction, looking ahead.", meaningReversed: "Fear of taking a step, indecision, narrow thinking." },
  25: { name: "Three of Wands", meaningUpright: "Expansion, awaiting results, growing possibilities.", meaningReversed: "Delays, limited prospects, impatience." },
  26: { name: "Four of Wands", meaningUpright: "Celebration, stability, home, a joyful event.", meaningReversed: "Instability at home, delayed joy, tension." },
  27: { name: "Five of Wands", meaningUpright: "Competition, argument, clashing interests.", meaningReversed: "Avoiding conflict, inner tension, chaos easing." },
  28: { name: "Six of Wands", meaningUpright: "Victory, recognition, success, confidence.", meaningReversed: "Self-doubt, delayed recognition, pride." },
  29: { name: "Seven of Wands", meaningUpright: "Defending your position, resilience, standing your ground.", meaningReversed: "Fatigue, giving up ground, outside pressure." },
  30: { name: "Eight of Wands", meaningUpright: "Fast movement, news, events speeding up.", meaningReversed: "Delays, confusion, too much happening at once." },
  31: { name: "Nine of Wands", meaningUpright: "Endurance, caution, one last push.", meaningReversed: "Exhaustion, suspicion, fear of repeated pain." },
  32: { name: "Ten of Wands", meaningUpright: "Burden, responsibility, a heavy path toward completion.", meaningReversed: "Overload, dropping the extra weight, need to delegate." },
  33: { name: "Page of Wands", meaningUpright: "Curiosity, enthusiasm, a new desire to try.", meaningReversed: "Immaturity, an empty impulse, lack of discipline." },
  34: { name: "Knight of Wands", meaningUpright: "Courage, passion, movement, a decisive burst.", meaningReversed: "Impulsiveness, impatience, harshness, instability." },
  35: { name: "Queen of Wands", meaningUpright: "Charisma, confidence, warmth, creative power.", meaningReversed: "Jealousy, burnout, controlling through emotion." },
  36: { name: "King of Wands", meaningUpright: "Leadership, vision, mature action, ambition.", meaningReversed: "Pressure, authoritarianism, pride, intolerance." },
  37: { name: "Ace of Cups", meaningUpright: "New feelings, love, emotional opening.", meaningReversed: "A closed heart, suppressed feelings, emotional stagnation." },
  38: { name: "Two of Cups", meaningUpright: "Mutuality, union, affection, emotional exchange.", meaningReversed: "Discord, imbalance, misunderstanding, cooling off." },
  39: { name: "Three of Cups", meaningUpright: "Joy, friendship, support, communication.", meaningReversed: "Superficiality, gossip, too many people involved." },
  40: { name: "Four of Cups", meaningUpright: "Apathy, reassessing desires, emotional pause.", meaningReversed: "Opening up, renewed interest, accepting a chance." },
  41: { name: "Five of Cups", meaningUpright: "Disappointment, loss, regret, focus on what is gone.", meaningReversed: "Acceptance, recovery, seeing what remains." },
  42: { name: "Six of Cups", meaningUpright: "The past, memories, tenderness, a familiar bond.", meaningReversed: "Stuck in the past, idealization, immaturity." },
  43: { name: "Seven of Cups", meaningUpright: "Many options, dreams, illusions, choice.", meaningReversed: "Clarification, leaving fantasy, naming the desire." },
  44: { name: "Eight of Cups", meaningUpright: "Leaving, seeking more, emotional distance.", meaningReversed: "Fear of leaving, returning, an unfinished emotional cycle." },
  45: { name: "Nine of Cups", meaningUpright: "Wish fulfillment, pleasure, emotional fullness.", meaningReversed: "Empty pleasure, excess, dissatisfaction." },
  46: { name: "Ten of Cups", meaningUpright: "Happiness, family, harmony, emotional completion.", meaningReversed: "Broken harmony, family expectations, an outer ideal." },
  47: { name: "Page of Cups", meaningUpright: "A tender message, affection, sensitivity, openness.", meaningReversed: "Emotional immaturity, touchiness, fantasies." },
  48: { name: "Knight of Cups", meaningUpright: "Romance, proposal, movement of feelings, softness.", meaningReversed: "Idealization, inconsistency, pretty words without action." },
  49: { name: "Queen of Cups", meaningUpright: "Empathy, care, deep feelings, intuition.", meaningReversed: "Emotional dependence, mood swings, losing yourself in another." },
  50: { name: "King of Cups", meaningUpright: "Emotional maturity, calm, a wise heart.", meaningReversed: "Holding feelings back, manipulation, emotional closure." },
  51: { name: "Ace of Swords", meaningUpright: "Clarity, truth, decision, a new view.", meaningReversed: "Confusion, harsh words, a wrong conclusion." },
  52: { name: "Two of Swords", meaningUpright: "A difficult choice, pause, blocked emotions.", meaningReversed: "No longer able to avoid a decision, inner conflict." },
  53: { name: "Three of Swords", meaningUpright: "Pain, disappointment, an unpleasant truth.", meaningReversed: "Healing, releasing pain, recovery after a wound." },
  54: { name: "Four of Swords", meaningUpright: "Rest, recovery, pause, silence.", meaningReversed: "Inability to rest, anxiety, exhaustion." },
  55: { name: "Five of Swords", meaningUpright: "Conflict, victory at the cost of connection, tension.", meaningReversed: "Dropping the fight, trying to reconcile, consequences of conflict." },
  56: { name: "Six of Swords", meaningUpright: "Transition, leaving difficulty, moving toward calm.", meaningReversed: "Stuckness, resisting transition, carrying the past." },
  57: { name: "Seven of Swords", meaningUpright: "Cunning, secrecy, strategy, an indirect path.", meaningReversed: "Secrets revealed, guilt, stepping away from deception." },
  58: { name: "Eight of Swords", meaningUpright: "Restriction, fear, feeling trapped.", meaningReversed: "Liberation, leaving the mental cage." },
  59: { name: "Nine of Swords", meaningUpright: "Anxiety, sleeplessness, guilt, heavy thoughts.", meaningReversed: "Relief, naming the fear, beginning recovery." },
  60: { name: "Ten of Swords", meaningUpright: "An ending, painful closure, a point of no return.", meaningReversed: "Recovery after an ending, a chance to rise." },
  61: { name: "Page of Swords", meaningUpright: "Curiosity, observation, news, mental activity.", meaningReversed: "Gossip, sharpness, immature words, anxious control." },
  62: { name: "Knight of Swords", meaningUpright: "A decisive rush, force, directness, speed.", meaningReversed: "Aggression, haste, conflict, lack of tact." },
  63: { name: "Queen of Swords", meaningUpright: "Clarity, independence, honesty, cool wisdom.", meaningReversed: "Harshness, resentment, criticism, emotional closure." },
  64: { name: "King of Swords", meaningUpright: "Logic, mental authority, strategy, a fair decision.", meaningReversed: "Coldness, control, misuse of words or power." },
  65: { name: "Ace of Pentacles", meaningUpright: "Material opportunity, money, the start of something stable.", meaningReversed: "A missed chance, money delay, weak foundation." },
  66: { name: "Two of Pentacles", meaningUpright: "Balancing resources, flexibility, handling several things.", meaningReversed: "Overload, chaos, difficulty keeping balance." },
  67: { name: "Three of Pentacles", meaningUpright: "Teamwork, skill, cooperation, growth of craft.", meaningReversed: "Poor coordination, undervalued work, weak team." },
  68: { name: "Four of Pentacles", meaningUpright: "Control, saving, protecting resources, stability.", meaningReversed: "Greed, fear of loss, tight grip, inability to release." },
  69: { name: "Five of Pentacles", meaningUpright: "Lack, a difficult period, feeling excluded.", meaningReversed: "Leaving crisis, support, gradual recovery." },
  70: { name: "Six of Pentacles", meaningUpright: "Help, exchange, generosity, balance of giving and receiving.", meaningReversed: "Unequal exchange, dependence, hidden debt." },
  71: { name: "Seven of Pentacles", meaningUpright: "Waiting for results, patience, invested work.", meaningReversed: "Impatience, doubting the result, weak return." },
  72: { name: "Eight of Pentacles", meaningUpright: "Work, learning, mastery, steady effort.", meaningReversed: "Routine without growth, careless work, fatigue with the process." },
  73: { name: "Nine of Pentacles", meaningUpright: "Self-sufficiency, comfort, success, personal achievement.", meaningReversed: "Dependence on status, loneliness, unstable comfort." },
  74: { name: "Ten of Pentacles", meaningUpright: "Family, legacy, long-term stability, capital.", meaningReversed: "Family issues, financial imbalance, unstable foundation." },
  75: { name: "Page of Pentacles", meaningUpright: "Study, a practical chance, first money, skill growth.", meaningReversed: "Laziness, immaturity, lost focus, weak discipline." },
  76: { name: "Knight of Pentacles", meaningUpright: "Reliability, slow progress, responsibility.", meaningReversed: "Stagnation, stubbornness, routine, lack of movement." },
  77: { name: "Queen of Pentacles", meaningUpright: "Practicality, care, financial maturity, comfort.", meaningReversed: "Money anxiety, exhaustion from caring, dependence on routine." },
  78: { name: "King of Pentacles", meaningUpright: "Money, status, stability, mature resource management.", meaningReversed: "Materialism, rigid control, fear of losing status." },
};

export function getLocalizedTarotCard(card: TarotDeckCard, language: AppLanguage): TarotDeckCard {
  if (language === "ru") {
    return card;
  }

  const translation = ENGLISH_CARDS[card.id];

  if (!translation) {
    return card;
  }

  return {
    ...card,
    ...translation,
  };
}

export function getLocalizedTarotDeck(language: AppLanguage) {
  return TAROT_DECK.map((card) => getLocalizedTarotCard(card, language));
}
