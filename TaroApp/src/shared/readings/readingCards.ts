import { TAROT_DECK } from "../../constants/tarotDeck";
import { SelectedTarotCard, TarotSpreadSize } from "../api/readingsApi";

export function parseCardsParamToSelectedCards(cardsParam?: string): SelectedTarotCard[] {
  if (!cardsParam) {
    return [];
  }

  return cardsParam
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((item) => {
      const [rawIdPart, positionPart] = item.split(":");
      const rawId = Number(rawIdPart);
      const normalizedId = ((rawId - 1) % TAROT_DECK.length) + 1;

      const deckCard =
        TAROT_DECK.find((card) => card.id === normalizedId) ?? TAROT_DECK[0];

      const isReversed = positionPart === "reversed";

      return {
        id: normalizedId,
        name: deckCard.name,
        isReversed,
        position: isReversed ? "Перевёрнутая" : "Прямая",
        meaning: isReversed ? deckCard.meaningReversed : deckCard.meaningUpright,
      };
    });
}

export function getSpreadSizeFromCardsCount(count: number): TarotSpreadSize {
  if (count === 1) return 1;
  if (count === 3) return 3;
  if (count === 5) return 5;
  if (count === 7) return 7;
  if (count === 10) return 10;

  throw new Error("Неверное количество карт.");
}