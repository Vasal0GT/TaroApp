import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

import { TAROT_DECK } from "../../constants/tarotDeck";
import {
  createReadingRequest,
  getReadingRequest,
  type SelectedTarotCard,
  type TarotSpreadSize,
} from "../../shared/api/readingsApi";
import { useI18n } from "../../shared/i18n/LanguageContext";
import { translations, type AppLanguage } from "../../shared/i18n/translations";
import { TarotCardBack } from "../../shared/tarot/TarotCardVisual";
import { getLocalizedTarotCard } from "../../shared/tarot/tarotLocalization";

const POLL_INTERVAL_MS = 1500;
const MAX_WAIT_MS = 4 * 60 * 1000;
const SCREEN_WIDTH = Dimensions.get("window").width;

type RequestState = "creating" | "queued" | "processing" | "error";

export default function SpreadLoadingScreen() {
  const { language, t } = useI18n();
  const { topic, type, question, shuffleCount, cards } = useLocalSearchParams<{
    topic?: string | string[];
    type?: string | string[];
    question?: string | string[];
    shuffleCount?: string | string[];
    cards?: string | string[];
  }>();

  const topicValue = getParamValue(topic);
  const typeValue = getParamValue(type);
  const questionValue = getParamValue(question);
  const shuffleCountValue = getParamValue(shuffleCount);
  const cardsValue = getParamValue(cards);

  const [stepIndex, setStepIndex] = useState(0);
  const [requestState, setRequestState] = useState<RequestState>("creating");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const cardsPulse = useRef(new Animated.Value(0)).current;

  const loadingSteps = getLoadingSteps(language);
  const selectedCards = useMemo(
    () => buildSelectedCards(cardsValue, language),
    [cardsValue, language]
  );
  const spreadSize = selectedCards.length;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 3200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const cardsLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(cardsPulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(cardsPulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    spinLoop.start();
    cardsLoop.start();

    return () => {
      spinLoop.stop();
      cardsLoop.stop();
    };
  }, [cardsPulse, spinAnim]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((current) => (current + 1) % loadingSteps.length);
    }, 3800);

    return () => clearInterval(interval);
  }, [loadingSteps.length]);

  useEffect(() => {
    let isActive = true;

    async function createAndPollReading() {
      if (!isValidSpreadSize(spreadSize)) {
        if (isActive) {
          setRequestState("error");
          setErrorMessage(t("spread.errors.noSpreadSize"));
        }
        return;
      }

      if (!questionValue.trim()) {
        if (isActive) {
          setRequestState("error");
          setErrorMessage(t("spread.errors.noQuestion"));
        }
        return;
      }

      try {
        if (isActive) {
          setRequestState("creating");
          setErrorMessage(null);
        }

        const createdReading = await createReadingRequest({
          spreadSize,
          topic: topicValue.trim() || undefined,
          question: questionValue.trim(),
          cards: selectedCards,
        });

        if (!createdReading.id) {
          throw new Error(t("spread.errors.noReadingId"));
        }

        if (createdReading.status === "Failed") {
          throw new Error(createdReading.errorMessage || t("spread.errors.failedCreate"));
        }

        if (isActive) {
          setRequestState("queued");
        }

        const startedAt = Date.now();

        while (isActive) {
          const reading = await getReadingRequest(createdReading.id);

          if (reading.status === "Completed") {
            if (!reading.result) {
              throw new Error(t("spread.errors.completedWithoutResult"));
            }

            router.replace({
              pathname: "/spread/result",
              params: {
                readingId: reading.id,
                topic: topicValue,
                type: typeValue,
                question: questionValue,
                shuffleCount: shuffleCountValue,
                cards: cardsValue,
              },
            });
            return;
          }

          if (reading.status === "Failed") {
            throw new Error(
              reading.errorMessage || t("spread.errors.failedPrepare")
            );
          }

          if (Date.now() - startedAt > MAX_WAIT_MS) {
            throw new Error(t("spread.errors.waitTimeout"));
          }

          if (isActive) {
            setRequestState(reading.status === "Processing" ? "processing" : "queued");
          }

          await delay(POLL_INTERVAL_MS);
        }
      } catch (error) {
        if (!isActive) return;
        setRequestState("error");
        setErrorMessage(getErrorMessage(error, t));
      }
    }

    const startTimer = setTimeout(() => {
      void createAndPollReading();
    }, 80);

    return () => {
      isActive = false;
      clearTimeout(startTimer);
    };
  }, [
    cardsValue,
    questionValue,
    retryKey,
    selectedCards,
    shuffleCountValue,
    spreadSize,
    t,
    topicValue,
    typeValue,
  ]);

  const currentStep = loadingSteps[stepIndex] ?? loadingSteps[0];
  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const cardsTranslateY = cardsPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });
  const cardsGlowOpacity = cardsPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.18, 0.34],
  });
  const visibleCardsCount = selectedCards.length || 3;
  const loadingCardWidth = getLoadingCardWidth(visibleCardsCount);
  const loadingCardHeight = Math.round(loadingCardWidth * 1.62);

  function handleRetry() {
    setErrorMessage(null);
    setRequestState("creating");
    setRetryKey((current) => current + 1);
  }

  return (
    <LinearGradient
      colors={["#160726", "#3A0A67", "#6A00A8"]}
      start={{ x: 0.05, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.screen}
    >
      <View style={styles.content}>
        <View style={styles.loaderSection}>
          <View style={styles.loaderArea}>
            <View style={styles.outerRing} />
            <View style={styles.middleRing} />
            <View style={styles.innerRing} />

            <Animated.View style={[styles.centerCircle, { transform: [{ rotate: spin }] }]}>
              <SpinningStarIcon />
            </Animated.View>
          </View>

          {requestState === "error" ? (
            <View style={styles.errorBlock}>
              <Text style={styles.errorTitle}>{t("spread.loadingErrorTitle")}</Text>
              <Text style={styles.errorText}>
                {errorMessage || t("spread.loadingFallbackError")}
              </Text>

              <Pressable onPress={handleRetry} style={styles.retryButton}>
                <Ionicons name="refresh-outline" size={19} color="#18051F" />
                <Text style={styles.retryButtonText}>{t("common.retry")}</Text>
              </Pressable>

              <Pressable onPress={() => router.back()} style={styles.backAction}>
                <Text style={styles.backActionText}>{t("spread.backAction")}</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.title}>{currentStep.title}</Text>
              <Text style={styles.subtitle}>{currentStep.subtitle}</Text>
              <Text style={styles.statusText}>
                {getRequestStatusText(requestState, t)}
              </Text>
            </>
          )}
        </View>

        <Animated.View style={[styles.cardsRow, { transform: [{ translateY: cardsTranslateY }] }]}>
          {Array.from({ length: visibleCardsCount }).map((_, index) => (
            <View key={index} style={styles.cardMiniWrapper}>
              <Animated.View
                pointerEvents="none"
                style={[styles.cardMiniGlow, { opacity: cardsGlowOpacity }]}
              />

              <TarotCardBack
                compact
                style={[
                  styles.cardMini,
                  {
                    width: loadingCardWidth,
                    height: loadingCardHeight,
                  },
                ]}
              />
            </View>
          ))}
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

function SpinningStarIcon() {
  return (
    <Svg width={54} height={54} viewBox="0 0 64 64">
      <Circle
        cx="32"
        cy="32"
        r="24"
        fill="rgba(232, 196, 54, 0.10)"
        stroke="rgba(246, 205, 61, 0.42)"
        strokeWidth="1.6"
      />
      <Path
        d="M32 8 L37.8 25.4 L56 32 L37.8 38.6 L32 56 L26.2 38.6 L8 32 L26.2 25.4 Z"
        fill="#F6CD3D"
      />
      <Path
        d="M32 19 L34.6 28.9 L45 32 L34.6 35.1 L32 45 L29.4 35.1 L19 32 L29.4 28.9 Z"
        fill="#FFF3A6"
      />
    </Svg>
  );
}

function buildSelectedCards(cardsParam: string, language: AppLanguage): SelectedTarotCard[] {
  if (!cardsParam) return [];

  const usedIds = new Set<number>();

  return cardsParam
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [rawId, orientation] = item.split(":");
      const id = Number(rawId);

      if (!Number.isFinite(id) || id <= 0 || usedIds.has(id)) return null;

      const deckCard = TAROT_DECK.find((card) => card.id === id);
      if (!deckCard) return null;

      usedIds.add(id);
      const localizedCard = getLocalizedTarotCard(deckCard, language);
      const isReversed = orientation === "reversed";

      const selectedCard: SelectedTarotCard = {
        id,
        name: localizedCard.name,
        isReversed,
        position: isReversed
          ? translations[language].common.reversed
          : translations[language].common.upright,
        meaning: isReversed ? localizedCard.meaningReversed : localizedCard.meaningUpright,
      };

      return selectedCard;
    })
    .filter((card): card is SelectedTarotCard => card !== null);
}

function isValidSpreadSize(value: number): value is TarotSpreadSize {
  return value === 1 || value === 3 || value === 5 || value === 7 || value === 10;
}

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function getRequestStatusText(requestState: RequestState, t: (key: string) => string) {
  if (requestState === "creating") return t("spread.requestStatusCreating");
  if (requestState === "queued") return t("spread.requestStatusQueued");
  if (requestState === "processing") return t("spread.requestStatusProcessing");
  return "";
}

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

function getErrorMessage(error: unknown, t: (key: string) => string) {
  return error instanceof Error && error.message.trim()
    ? error.message
    : t("spread.errors.failedPrepare");
}

function getLoadingSteps(language: AppLanguage) {
  return translations[language].spread.loadingSteps.map(([title, subtitle]) => ({
    title,
    subtitle,
  }));
}

function getLoadingCardWidth(count: number) {
  const rowGap = 8;
  const horizontalPadding = 56;
  const maxWidth = SCREEN_WIDTH - horizontalPadding;

  if (count <= 5) {
    return 54;
  }

  const columns = Math.ceil(count / 2);
  const widthByColumns = Math.floor((maxWidth - rowGap * (columns - 1)) / columns);

  return Math.max(34, Math.min(48, widthByColumns));
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 24 : 64,
    paddingHorizontal: 28,
    alignItems: "center",
  },
  loaderSection: { marginTop: 42, width: "100%", alignItems: "center" },
  loaderArea: {
    width: 240,
    height: 240,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  outerRing: {
    position: "absolute", width: 210, height: 210, borderRadius: 105,
    borderWidth: 1.4, borderColor: "rgba(232,196,54,0.24)",
  },
  middleRing: {
    position: "absolute", width: 160, height: 160, borderRadius: 80,
    borderWidth: 1.6, borderColor: "rgba(232,196,54,0.34)",
  },
  innerRing: {
    position: "absolute", width: 110, height: 110, borderRadius: 55,
    borderWidth: 1.8, borderColor: "rgba(232,196,54,0.52)",
  },
  centerCircle: {
    width: 78, height: 78, borderRadius: 39, borderWidth: 2,
    borderColor: "#E8C436", alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(49, 11, 83, 0.55)",
  },
  title: {
    color: "#FFFFFF", fontSize: 23, lineHeight: 31, fontWeight: "700",
    textAlign: "center", marginBottom: 10,
  },
  subtitle: {
    color: "#B698FF", fontSize: 16, lineHeight: 22, fontWeight: "600",
    textAlign: "center", paddingHorizontal: 10,
  },
  statusText: {
    marginTop: 18, color: "#F6CD3D", fontSize: 14, lineHeight: 20,
    fontWeight: "800", textAlign: "center",
  },
  cardsRow: {
    width: "100%", marginTop: 26, flexDirection: "row", alignItems: "center",
    justifyContent: "center", flexWrap: "wrap", gap: 8,
  },
  cardMiniWrapper: { position: "relative" },
  cardMiniGlow: {
    position: "absolute", top: 8, left: 8, right: 8, bottom: 8,
    borderRadius: 10, backgroundColor: "#F6CD3D",
  },
  cardMini: {
    borderRadius: 8, alignItems: "center",
    justifyContent: "center", borderWidth: 1.2,
    borderColor: "rgba(255,255,255,0.28)",
  },
  errorBlock: { width: "100%", alignItems: "center" },
  errorTitle: {
    color: "#FFFFFF", fontSize: 22, lineHeight: 29, fontWeight: "800",
    textAlign: "center", marginBottom: 10,
  },
  errorText: {
    color: "#D3C4FF", fontSize: 15, lineHeight: 22, fontWeight: "600",
    textAlign: "center", marginBottom: 22,
  },
  retryButton: {
    minHeight: 50, paddingHorizontal: 22, borderRadius: 18,
    backgroundColor: "#F6CD3D", alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: 8,
  },
  retryButtonText: { color: "#18051F", fontSize: 15, fontWeight: "900" },
  backAction: { marginTop: 18, padding: 8 },
  backActionText: { color: "#B698FF", fontSize: 15, fontWeight: "800" },
});
