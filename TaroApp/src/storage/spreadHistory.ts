import AsyncStorage from "@react-native-async-storage/async-storage";

export type SavedSpreadCard = {
  id: number;
  name: string;
  isReversed: boolean;
  position: string;
};

export type SavedSpread = {
  id: string;
  createdAt: string;
  topic: string;
  topicLabel: string;
  type: string;
  typeLabel: string;
  question: string;
  title: string;
  shortAnswer: string;
  tags: string[];
  cards: SavedSpreadCard[];
  rawServerAnswer: string;
};

const STORAGE_KEY = "taro_saved_spreads_v1";

export async function getSavedSpreads(): Promise<SavedSpread[]> {
  const rawValue = await AsyncStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

export async function saveSpread(spread: SavedSpread) {
  const currentSpreads = await getSavedSpreads();

  const nextSpreads = [
    spread,
    ...currentSpreads.filter((item) => item.id !== spread.id),
  ];

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextSpreads));
}

export async function clearSavedSpreads() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}