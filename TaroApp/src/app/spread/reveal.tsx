import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { TAROT_DECK, TarotDeckCard } from "../../constants/tarotDeck";
import { createReversedIndexes, shuffleArray } from "../../utils/random";
import { useConfirmSpreadExit } from "../../hooks/useConfirmSpreadExit";
import { TarotCardBack, TarotCardImage } from "../../shared/tarot/TarotCardVisual";
import { useI18n } from "../../shared/i18n/LanguageContext";
import { getLocalizedTarotCard } from "../../shared/tarot/tarotLocalization";

type RevealedCard = {
  id: number;
  card: TarotDeckCard;
  isReversed: boolean;
};

const HORIZONTAL_PADDING = 22;

export default function SpreadRevealScreen() {
  const { topic, type, question, shuffleCount, cards } = useLocalSearchParams<{
    topic?: string;
    type?: string;
    question?: string;
    shuffleCount?: string;
    cards?: string;
  }>();

  const selectedCards = useMemo(() => {
    return buildRevealCards(cards);
  }, [cards]);

  const [revealedIndexes, setRevealedIndexes] = useState<number[]>([]);
  const { language, t } = useI18n();

  const allRevealed = revealedIndexes.length === selectedCards.length;

  const confirmSpreadExit = useConfirmSpreadExit();

  function handleCardPress(index: number) {
    if (revealedIndexes.includes(index)) return;

    setRevealedIndexes((current) => [...current, index]);
  }

  function handleInterpretation() {
    if (!allRevealed) return;

    console.log("Topic:", topic);
    console.log("Type:", type);
    console.log("Question:", question);
    console.log("Shuffle count:", shuffleCount);
    console.log(
      "Cards:",
      selectedCards.map((item) => ({
        id: item.id,
        name: item.card.name,
        position: item.isReversed ? "reversed" : "upright",
      }))
    );

    router.push({
      pathname: "/spread/loading",
      params: {
        topic: topic ?? "",
        type: type ?? "",
        question: question ?? "",
        shuffleCount: shuffleCount ?? "",
        cards: selectedCards
          .map((item) => `${item.id}:${item.isReversed ? "reversed" : "upright"}`)
          .join(","),
      },
    });
  }

  return (
    <LinearGradient
      colors={["#160726", "#3A0A67", "#6A00A8"]}
      start={{ x: 0.05, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.screen}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Pressable onPress={confirmSpreadExit} style={styles.backButton}>
          <Ionicons name="arrow-back" size={25} color="#B698FF" />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>{t("spread.cardsSelectedTitle")}</Text>
          <Text style={styles.subtitle}>{t("spread.revealOneByOne")}</Text>
        </View>

        <View style={styles.cardsGrid}>
          {selectedCards.map((item, index) => {
            const isRevealed = revealedIndexes.includes(index);
            const localizedCard = getLocalizedTarotCard(item.card, language);

            return (
              <Pressable
                key={`${item.id}-${index}`}
                onPress={() => handleCardPress(index)}
                style={[
                  styles.cardShell,
                  selectedCards.length === 1 && styles.cardShellSingle,
                ]}
              >
                {!isRevealed ? (
                  <TarotCardBack
                    label={t("spread.cardLabel", { number: index + 1 })}
                    style={styles.cardBack}
                  />
                ) : (
                  <View
                    style={[
                      styles.cardFace,
                      item.isReversed && styles.cardFaceReversed,
                    ]}
                  >
                    <LinearGradient
                      colors={
                        item.isReversed
                          ? [
                              "rgba(89, 36, 119, 0.92)",
                              "rgba(34, 18, 70, 0.94)",
                            ]
                          : [
                              "rgba(232, 196, 54, 0.22)",
                              "rgba(74, 38, 124, 0.88)",
                            ]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.cardFaceGradient}
                    >
                      <View style={styles.cardInnerBorder} />

                      <TarotCardImage
                        cardId={item.id}
                        isReversed={item.isReversed}
                        style={styles.cardFaceImage}
                      />

                      <View style={styles.cardTextBlock}>
                        <Text style={styles.cardName}>{localizedCard.name}</Text>

                        <Text style={styles.cardPosition}>
                          {item.isReversed ? t("common.reversed") : t("common.upright")}
                        </Text>

                        <Text style={styles.cardMeaning}>
                          {item.isReversed
                            ? localizedCard.meaningReversed
                            : localizedCard.meaningUpright}
                        </Text>
                      </View>
                    </LinearGradient>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.bottomBlock}>
          <Text style={styles.progressText}>
            {t("spread.revealedProgress", {
              current: revealedIndexes.length,
              total: selectedCards.length,
            })}
          </Text>

          <Pressable
            onPress={handleInterpretation}
            disabled={!allRevealed}
            style={[
              styles.interpretButton,
              !allRevealed && styles.interpretButtonDisabled,
            ]}
          >
            <Text
              style={[
                styles.interpretButtonText,
                !allRevealed && styles.interpretButtonTextDisabled,
              ]}
            >
              {t("spread.getInterpretation")}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function buildRevealCards(cardsParam?: string): RevealedCard[] {
  const rawIds = cardsParam
    ? cardsParam
        .split(",")
        .map((value) => {
          const [rawIdPart] = value.split(":");
          return Number(rawIdPart);
        })
        .filter((value) => Number.isFinite(value))
    : [];

  const targetCount = rawIds.length > 0 ? rawIds.length : 3;
  const uniqueIds = getUniqueCardIds(rawIds, targetCount);
  const reversedIndexes = createReversedIndexes(uniqueIds.length);

  return uniqueIds.map((rawId, index) => {
    const normalizedId = ((rawId - 1) % TAROT_DECK.length) + 1;

    const card =
      TAROT_DECK.find((item) => item.id === normalizedId) ?? TAROT_DECK[0];

    return {
      id: normalizedId,
      card,
      isReversed: reversedIndexes.has(index),
    };
  });
}

function getUniqueCardIds(rawIds: number[], targetCount: number) {
  const usedIds = new Set<number>();
  const result: number[] = [];

  rawIds.forEach((rawId) => {
    const normalizedId = ((rawId - 1) % TAROT_DECK.length) + 1;

    if (!usedIds.has(normalizedId)) {
      usedIds.add(normalizedId);
      result.push(normalizedId);
    }
  });

  for (const card of shuffleArray(TAROT_DECK)) {
    if (result.length >= targetCount) break;

    if (!usedIds.has(card.id)) {
      usedIds.add(card.id);
      result.push(card.id);
    }
  }

  return result;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  scrollContent: {
    paddingTop:
      Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 44,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: Platform.OS === "android" ? 34 : 44,
  },

  backButton: {
    width: 40,
    height: 36,
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: 8,
  },

  header: {
    alignItems: "center",
    marginBottom: 16,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 31,
    lineHeight: 38,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },

  subtitle: {
    color: "#B698FF",
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "600",
    textAlign: "center",
  },

  cardsGrid: {
    gap: 12,
  },

  cardShell: {
    width: "100%",
    minHeight: 140,
    borderRadius: 14,
    alignItems: "center",
  },

  cardShellSingle: {
    width: "100%",
    minHeight: 162,
  },

  cardBack: {
    width: 92,
    height: 148,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(232, 196, 54, 0.46)",
    overflow: "hidden",
  },

  cardFace: {
    width: "100%",
    minHeight: 150,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(232, 196, 54, 0.62)",
    overflow: "hidden",
  },

  cardFaceReversed: {
    borderColor: "rgba(182, 152, 255, 0.62)",
  },

  cardGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 18,
    position: "relative",
  },

  cardFaceGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 14,
    position: "relative",
  },

  cardInnerBorder: {
    position: "absolute",
    top: 9,
    left: 9,
    right: 9,
    bottom: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  cardBackNumber: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 12,
  },

  openIcon: {
    marginBottom: 10,
  },

  cardFaceImage: {
    width: 92,
    height: 148,
    borderRadius: 10,
  },

  cardTextBlock: {
    flex: 1,
    minWidth: 0,
  },

  cardName: {
    color: "#FFFFFF",
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "900",
    textAlign: "left",
    marginBottom: 8,
  },

  cardPosition: {
    color: "#F6CD3D",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    textAlign: "left",
    marginBottom: 10,
  },

  cardMeaning: {
    color: "#E9DDFF",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    textAlign: "left",
  },

  bottomBlock: {
    marginTop: 18,
    gap: 10,
  },

  progressText: {
    color: "#B698FF",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    textAlign: "center",
  },

  interpretButton: {
    height: 58,
    borderRadius: 18,
    backgroundColor: "#E8C436",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E8C436",
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 4,
  },

  interpretButtonDisabled: {
    backgroundColor: "rgba(232, 196, 54, 0.42)",
    shadowOpacity: 0,
    elevation: 0,
  },

  interpretButtonText: {
    color: "#05020A",
    fontSize: 17,
    fontWeight: "800",
  },

  interpretButtonTextDisabled: {
    color: "rgba(5, 2, 10, 0.65)",
  },
});
