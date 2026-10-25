import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { TAROT_DECK } from "../../constants/tarotDeck";
import { useConfirmSpreadExit } from "../../hooks/useConfirmSpreadExit";
import { saveSpread, SavedSpread } from "../../storage/spreadHistory";
import {
  getReadingRequest,
  type ReadingResponse,
  type TarotReadingResult,
  type TarotReadingResultCard,
} from "../../shared/api/readingsApi";
import { useI18n } from "../../shared/i18n/LanguageContext";
import { type AppLanguage } from "../../shared/i18n/translations";
import { TarotCardImage } from "../../shared/tarot/TarotCardVisual";
import { getLocalizedTarotCard } from "../../shared/tarot/tarotLocalization";

const SIDE_PADDING = 26;

const TITLE_FONT = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: undefined,
});

export default function SpreadResultScreen() {
  const { language, t } = useI18n();
  const { readingId, topic, type, question } = useLocalSearchParams<{
    readingId?: string | string[];
    topic?: string | string[];
    type?: string | string[];
    question?: string | string[];
  }>();

  const readingIdValue = getParamValue(readingId);
  const topicValue = getParamValue(topic);
  const typeValue = getParamValue(type);
  const questionValue = getParamValue(question);

  const confirmSpreadExit = useConfirmSpreadExit();

  const [reading, setReading] = useState<ReadingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedClarification, setSelectedClarification] = useState<string | null>(null);
  const [historyStatus, setHistoryStatus] = useState(t("spread.savingHistory"));

  const hasAutoSavedRef = useRef(false);

  const loadReading = useCallback(async () => {
    if (!readingIdValue) {
      setErrorMessage(t("spread.errors.noReadingIdOpen"));
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const response = await getReadingRequest(readingIdValue);

      if (response.status === "Failed") {
        throw new Error(response.errorMessage || t("spread.errors.failedPrepare"));
      }

      if (response.status !== "Completed" || !response.result) {
        throw new Error(t("spread.errors.notReady"));
      }

      setReading(response);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, t));
    } finally {
      setIsLoading(false);
    }
  }, [readingIdValue, t]);

  useEffect(() => {
    void loadReading();
  }, [loadReading]);

  useEffect(() => {
    hasAutoSavedRef.current = false;
    setHistoryStatus(t("spread.savingHistory"));
  }, [readingIdValue, t]);

  useEffect(() => {
    const readingToSave = reading;

    if (readingToSave === null || readingToSave.result === null || hasAutoSavedRef.current) {
      return;
    }

    hasAutoSavedRef.current = true;

    const resultToSave = readingToSave.result;
    const cardsToSave = buildReadingCardsForDisplay(readingToSave, language, t);

    async function autoSaveSpread(
      safeReading: ReadingResponse,
      safeResult: TarotReadingResult
    ) {
      const savedSpread: SavedSpread = {
        id: safeReading.id,
        createdAt: safeReading.completedAt || new Date().toISOString(),
        topic: safeReading.topic ?? topicValue,
        topicLabel: getTopicLabel(safeReading.topic ?? topicValue, t),
        type: typeValue,
        typeLabel: getTypeLabel(typeValue, t),
        question: safeReading.question?.trim() || questionValue || t("spread.noQuestion"),
        title: safeResult.title,
        shortAnswer: safeResult.shortAnswer,
        tags: safeResult.tags,
        cards: cardsToSave.map((card) => ({
          id: card.id,
          name: card.name,
          isReversed: card.isReversed,
          position: card.position,
        })),
        rawServerAnswer: JSON.stringify(safeResult),
      };

      try {
        await saveSpread(savedSpread);
        setHistoryStatus(t("spread.historySaved"));
      } catch (error) {
        console.log("Auto save spread error:", error);
        setHistoryStatus(t("spread.historySaveFailed"));
      }
    }

    void autoSaveSpread(readingToSave, resultToSave);
  }, [language, questionValue, reading, t, topicValue, typeValue]);

  function handleClarificationChipPress(questionText: string) {
    setSelectedClarification(questionText);
  }

  function handleClarify() {
    if (!selectedClarification || !reading) {
      return;
    }

    router.push({
      pathname: "/spread/shuffle",
      params: {
        topic: reading.topic ?? topicValue,
        type: "quick",
        question: selectedClarification,
      },
    });
  }

  function handleDeepAnalysis() {
    const currentQuestion = reading?.question?.trim() || questionValue;

    if (currentQuestion) {
      router.push({
        pathname: "/spread/shuffle",
        params: {
          topic: reading?.topic ?? topicValue,
          type: "celtic",
          question: currentQuestion,
        },
      });
      return;
    }

    router.push({
      pathname: "/spread/question",
      params: {
        topic: reading?.topic ?? topicValue,
        type: "celtic",
      },
    });
  }

  function handleGoHome() {
    router.replace("/(tabs)");
  }

  if (isLoading) {
    return (
      <LinearGradient
        colors={["#090A12", "#11101E", "#21143D"]}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.screen}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E8C436" />
          <Text style={styles.loadingText}>{t("spread.resultLoading")}</Text>
        </View>
      </LinearGradient>
    );
  }

  if (errorMessage || !reading?.result) {
    return (
      <LinearGradient
        colors={["#090A12", "#11101E", "#21143D"]}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.screen}
      >
        <View style={styles.errorScreen}>
          <Ionicons name="alert-circle-outline" size={44} color="#F6CD3D" />

          <Text style={styles.errorScreenTitle}>{t("spread.resultOpenErrorTitle")}</Text>
          <Text style={styles.errorScreenText}>
            {errorMessage || t("spread.resultOpenErrorFallback")}
          </Text>

          <Pressable onPress={loadReading} style={styles.reloadButton}>
            <Ionicons name="refresh-outline" size={19} color="#18051F" />
            <Text style={styles.reloadButtonText}>{t("common.refresh")}</Text>
          </Pressable>

          <Pressable onPress={handleGoHome} style={styles.errorHomeButton}>
            <Text style={styles.errorHomeButtonText}>{t("common.home")}</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  const result = reading.result;
  const displayedCards = buildReadingCardsForDisplay(reading, language, t);
  const canClarify = selectedClarification !== null;

  return (
    <LinearGradient
      colors={["#090A12", "#11101E", "#21143D"]}
      start={{ x: 0.05, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.screen}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Pressable onPress={confirmSpreadExit} style={styles.backButton}>
          <Ionicons name="arrow-back" size={27} color="#B698FF" />
        </Pressable>

        <Text style={styles.title}>{result.title}</Text>

        <View style={styles.answerCard}>
          <Text style={styles.answerText}>{result.shortAnswer}</Text>

          {result.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {result.tags.map((tag, index) => (
                <View
                  key={`${tag}-${index}`}
                  style={[styles.tag, index === 1 && styles.tagSecondary]}
                >
                  <Text
                    style={[styles.tagText, index === 1 && styles.tagTextSecondary]}
                  >
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>{t("spread.fallenCards")}</Text>

        <View style={styles.cardsList}>
          {displayedCards.map((card, index) => (
            <View key={`${card.id}-${card.role}-${index}`} style={styles.resultCard}>
              <TarotCardImage
                cardId={card.id}
                isReversed={card.isReversed}
                style={styles.cardPreview}
              />

              <View style={styles.cardTextBlock}>
                <Text style={styles.cardRole}>{card.role}</Text>
                <Text style={styles.cardName}>{card.name}</Text>
                <Text style={styles.cardPosition}>{card.position}</Text>
                <Text style={styles.cardMeaning}>{card.meaning}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t("spread.generalConclusion")}</Text>
          <Text style={styles.infoText}>{result.generalConclusion}</Text>
        </View>

        <LinearGradient
          colors={["rgba(216, 67, 171, 0.22)", "rgba(101, 61, 178, 0.18)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.adviceCard}
        >
          <Text style={styles.adviceTitle}>{t("spread.cardAdvice")}</Text>
          <Text style={styles.adviceText}>{result.cardAdvice}</Text>
        </LinearGradient>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t("spread.attention")}</Text>
          <Text style={styles.infoText}>{result.attention}</Text>
        </View>

        {result.clarificationQuestions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t("spread.clarifyTitle")}</Text>

            <View style={styles.chipsWrap}>
              {result.clarificationQuestions.map((item) => {
                const isSelected = selectedClarification === item;

                return (
                  <Pressable
                    key={item}
                    onPress={() => handleClarificationChipPress(item)}
                    style={[styles.questionChip, isSelected && styles.questionChipSelected]}
                  >
                    <Text
                      style={[
                        styles.questionChipText,
                        isSelected && styles.questionChipTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        <View style={styles.actionsBlock}>
          <View style={styles.bottomButtonsRow}>
            <Pressable
              onPress={handleClarify}
              disabled={!canClarify}
              style={[styles.clarifyButton, !canClarify && styles.actionButtonDisabled]}
            >
              <Ionicons
                name="sparkles-outline"
                size={19}
                color={canClarify ? "#F6CD3D" : "rgba(255,255,255,0.42)"}
              />

              <Text
                style={[
                  styles.clarifyButtonText,
                  !canClarify && styles.actionButtonTextDisabled,
                ]}
              >
                {t("spread.clarify")}
              </Text>
            </Pressable>

            <Pressable onPress={handleDeepAnalysis} style={styles.deepButton}>
              <LinearGradient
                colors={["#F8D84A", "#E8C436", "#F0A91F"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.deepButtonGradient}
              >
                <Ionicons name="sparkles" size={18} color="#18051F" />

                <View style={styles.deepButtonTextBlock}>
                  <Text style={styles.deepButtonText}>{t("spread.deepButtonLine1")}</Text>
                  <Text style={styles.deepButtonText}>{t("spread.deepButtonLine2")}</Text>
                </View>
              </LinearGradient>
            </Pressable>
          </View>

          <Text style={styles.historyStatus}>{historyStatus}</Text>

          <Pressable onPress={handleGoHome} style={styles.homeButton}>
            <Ionicons name="home-outline" size={20} color="#B698FF" />
            <Text style={styles.homeButtonText}>{t("common.home")}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function getErrorMessage(error: unknown, t: (key: string) => string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return t("spread.errors.loadFailed");
}

function buildReadingCardsForDisplay(
  reading: ReadingResponse,
  language: AppLanguage,
  t: (key: string, params?: Record<string, string | number>) => string
): TarotReadingResultCard[] {
  const resultCards = reading.result?.cards ?? [];

  if (reading.cards.length === 0) {
    return resultCards.map((card, index) => localizeResultCard(card, index, language, t));
  }

  return reading.cards.map((selectedCard, index) => {
    const resultCard = resultCards[index];
    const deckCard = TAROT_DECK.find((card) => card.id === selectedCard.id);
    const localizedCard = deckCard ? getLocalizedTarotCard(deckCard, language) : null;
    const isReversed = selectedCard.isReversed;

    return {
      id: selectedCard.id,
      name: localizedCard?.name ?? selectedCard.name,
      isReversed,
      position: isReversed ? t("common.reversed") : t("common.upright"),
      role: resultCard?.role?.trim() || t("spread.cardLabel", { number: index + 1 }),
      meaning:
        resultCard?.meaning?.trim() ||
        (isReversed
          ? localizedCard?.meaningReversed
          : localizedCard?.meaningUpright) ||
        selectedCard.meaning,
    };
  });
}

function localizeResultCard(
  card: TarotReadingResultCard,
  index: number,
  language: AppLanguage,
  t: (key: string, params?: Record<string, string | number>) => string
) {
  const deckCard = TAROT_DECK.find((item) => item.id === card.id);
  const localizedCard = deckCard ? getLocalizedTarotCard(deckCard, language) : null;
  const isReversed = card.isReversed;

  return {
    ...card,
    name: localizedCard?.name ?? card.name,
    position: isReversed ? t("common.reversed") : t("common.upright"),
    role: card.role?.trim() || t("spread.cardLabel", { number: index + 1 }),
    meaning:
      card.meaning?.trim() ||
      (isReversed ? localizedCard?.meaningReversed : localizedCard?.meaningUpright) ||
      "",
  };
}

function getTopicLabel(topic: string | null | undefined, t: (key: string) => string) {
  if (topic === "love") return t("spread.topics.love");
  if (topic === "career" || topic === "work") return t("spread.topics.work");
  if (topic === "personal" || topic === "self") return t("spread.topics.personal");
  if (topic === "money" || topic === "finance") return t("spread.topics.money");
  if (topic === "yes-no") return t("spread.topics.yesNo");
  if (topic === "daily-advice") return t("spread.topics.dailyAdvice");
  if (topic === "compatibility") return t("spread.topics.compatibility");
  if (topic === "future") return t("spread.topics.future");
  return t("spread.topics.personal");
}

function getTypeLabel(type: string | undefined, t: (key: string) => string) {
  if (type === "quick") return t("spread.spreadTypes.quick");
  if (type === "clarity") return t("spread.spreadTypes.clarity");
  if (type === "deep") return t("spread.spreadTypes.deep");
  if (type === "full") return t("spread.spreadTypes.full");
  if (type === "celtic") return t("spread.spreadTypes.celtic");
  return t("spread.typeTitle");
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: {
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 10 : 52,
    paddingHorizontal: SIDE_PADDING,
    paddingBottom: Platform.OS === "android" ? 34 : 44,
  },
  loadingContainer: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 18,
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  errorScreen: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  errorScreenTitle: {
    marginTop: 16,
    color: "#FFFFFF",
    fontSize: 23,
    lineHeight: 30,
    fontWeight: "900",
    textAlign: "center",
  },
  errorScreenText: {
    marginTop: 10,
    color: "#C9B5FF",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
    textAlign: "center",
  },
  reloadButton: {
    height: 52,
    marginTop: 26,
    paddingHorizontal: 22,
    borderRadius: 18,
    backgroundColor: "#F6CD3D",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  reloadButtonText: {
    color: "#18051F",
    fontSize: 15,
    fontWeight: "900",
  },
  errorHomeButton: { marginTop: 16, padding: 8 },
  errorHomeButtonText: {
    color: "#B698FF",
    fontSize: 15,
    fontWeight: "800",
  },
  backButton: {
    width: 44,
    height: 38,
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 31,
    lineHeight: 39,
    fontWeight: "700",
    fontFamily: TITLE_FONT,
    marginBottom: 16,
  },
  answerCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(223, 255, 113, 0.20)",
    backgroundColor: "rgba(223, 255, 113, 0.055)",
    paddingHorizontal: 24,
    paddingVertical: 18,
    marginBottom: 32,
  },
  answerText: {
    color: "#FFFFFF",
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "800",
    marginBottom: 14,
  },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  tag: {
    minHeight: 28,
    paddingHorizontal: 15,
    borderRadius: 14,
    backgroundColor: "rgba(223, 255, 113, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  tagSecondary: { backgroundColor: "rgba(149, 63, 196, 0.34)" },
  tagText: {
    color: "#DFFF71",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "800",
  },
  tagTextSecondary: { color: "#C9B5FF" },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
    marginBottom: 12,
  },
  cardsList: { gap: 12, marginBottom: 16 },
  resultCard: {
    minHeight: 120,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  cardPreview: {
    width: 60,
    height: 96,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTextBlock: { flex: 1, minWidth: 0 },
  cardRole: {
    color: "#94899F",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardName: {
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "900",
    marginBottom: 3,
  },
  cardPosition: {
    color: "#DFFF71",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
    marginBottom: 6,
  },
  cardMeaning: {
    color: "#A99EAF",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
  },
  infoCard: {
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 24,
    paddingVertical: 18,
    marginBottom: 12,
  },
  infoTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
    marginBottom: 9,
  },
  infoText: {
    color: "#A99EAF",
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "600",
  },
  adviceCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(216, 67, 171, 0.18)",
    paddingHorizontal: 24,
    paddingVertical: 18,
    marginBottom: 12,
  },
  adviceTitle: {
    color: "#FF9CDD",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
    marginBottom: 9,
  },
  adviceText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "800",
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginBottom: 20,
  },
  questionChip: {
    minHeight: 38,
    paddingHorizontal: 15,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(185, 156, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  questionChipSelected: {
    backgroundColor: "rgba(223, 255, 113, 0.10)",
    borderColor: "#DFFF71",
  },
  questionChipText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "900",
  },
  questionChipTextSelected: { color: "#DFFF71" },
  actionsBlock: { gap: 10, marginTop: 2 },
  bottomButtonsRow: { flexDirection: "row", gap: 10 },
  clarifyButton: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(185, 156, 255, 0.12)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  clarifyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  deepButton: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#E8C436",
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 5,
  },
  deepButtonGradient: {
    width: "100%",
    height: "100%",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  deepButtonTextBlock: {
    alignItems: "flex-start",
    justifyContent: "center",
  },
  deepButtonText: {
    color: "#18051F",
    fontSize: 14,
    lineHeight: 16,
    fontWeight: "900",
  },
  actionButtonDisabled: { opacity: 0.48 },
  actionButtonTextDisabled: { color: "rgba(255,255,255,0.48)" },
  historyStatus: {
    color: "#B698FF",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 2,
  },
  homeButton: {
    height: 52,
    borderRadius: 17,
    backgroundColor: "rgba(16, 7, 34, 0.42)",
    borderWidth: 1,
    borderColor: "rgba(185, 156, 255, 0.12)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  homeButtonText: {
    color: "#B698FF",
    fontSize: 15,
    fontWeight: "900",
  },
});
