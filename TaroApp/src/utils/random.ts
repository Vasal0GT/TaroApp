export function randomUnit() {
  const cryptoObject = (
    globalThis as unknown as {
      crypto?: {
        getRandomValues?: <T extends Uint32Array>(array: T) => T;
      };
    }
  ).crypto;

  if (cryptoObject?.getRandomValues) {
    const array = new Uint32Array(1);
    cryptoObject.getRandomValues(array);

    return array[0] / 4294967296;
  }

  return Math.random();
}

export function randomInt(maxExclusive: number) {
  if (!Number.isFinite(maxExclusive) || maxExclusive <= 0) {
    return 0;
  }

  return Math.floor(randomUnit() * maxExclusive);
}

export function shuffleArray<T>(array: T[]) {
  const nextArray = [...array];

  for (let index = nextArray.length - 1; index > 0; index -= 1) {
    const randomIndex = randomInt(index + 1);

    const currentItem = nextArray[index];
    nextArray[index] = nextArray[randomIndex];
    nextArray[randomIndex] = currentItem;
  }

  return nextArray;
}

export function createReversedIndexes(cardsCount: number) {
  if (cardsCount <= 0) {
    return new Set<number>();
  }

  /**
   * Случайно выбираем именно количество перевёрнутых карт.
   * Это даёт живые расклады:
   * иногда 0 перевёрнутых,
   * иногда половина,
   * иногда почти все.
   */
  const reversedCount = randomInt(cardsCount + 1);

  const indexes = shuffleArray(
    Array.from({ length: cardsCount }, (_, index) => index)
  ).slice(0, reversedCount);

  return new Set(indexes);
}
