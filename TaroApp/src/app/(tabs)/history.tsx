import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getSavedSpreads, SavedSpread } from "../../storage/spreadHistory";
import { useAuth } from "../../shared/auth/AuthContext";
import { isPlusSubscriptionActive } from "../../shared/api/authApi";
import { useI18n } from "../../shared/i18n/LanguageContext";
import { type AppLanguage } from "../../shared/i18n/translations";
import { TarotCardImage } from "../../shared/tarot/TarotCardVisual";

const SIDE_PADDING = 30;

const TITLE_FONT = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: undefined,
});

export default function HistoryScreen() {
  const { user, refreshUser } = useAuth();
  const { language, t } = useI18n();
  const [savedSpreads, setSavedSpreads] = useState<SavedSpread[]>([]);
  const hasPlus = isPlusSubscriptionActive(user);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadHistory() {
        const spreads = await getSavedSpreads();

        try {
          await refreshUser();
        } catch (error) {
          console.log("Refresh user failed", error);
        }

        if (isActive) {
          setSavedSpreads(spreads);
        }
      }

      loadHistory();

      return () => {
        isActive = false;
      };
    }, [refreshUser])
  );

  function handleBack() {
    router.back();
  }

  function handleOpenSpread(spread: SavedSpread) {
    console.log("Open saved spread:", spread.id);
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
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={27} color="#B698FF" />
        </Pressable>

        <Text style={styles.title}>{t("history.title")}</Text>
        <Text style={styles.subtitle}>{t("history.subtitle")}</Text>

        {savedSpreads.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="file-tray-outline" size={36} color="#B698FF" />
            <Text style={styles.emptyTitle}>{t("history.emptyTitle")}</Text>
            <Text style={styles.emptyText}>{t("history.emptyText")}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {savedSpreads.map((spread, index) => {
              const typeLabel = getTypeLabel(spread.type, spread.typeLabel, t);
              const topicLabel = getTopicLabel(spread.topic, spread.topicLabel, t);
              const isLocked = !hasPlus && index > 0;

              return (
                <Pressable
                  key={spread.id}
                  onPress={() => handleOpenSpread(spread)}
                  disabled={isLocked}
                  style={[styles.historyCard, isLocked && styles.historyCardLocked]}
                >
                  <View
                    pointerEvents={isLocked ? "none" : "auto"}
                    style={isLocked && styles.historyCardContentLocked}
                  >
                  <View style={styles.cardHeader}>
                    <Text style={styles.dateText}>
                      {formatSavedDate(spread.createdAt, language)}
                    </Text>

                    <View style={styles.typeBadge}>
                      <Text
                        style={styles.typeBadgeText}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {typeLabel} · {spread.cards.length}{" "}
                        {getCardsWord(spread.cards.length, language)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.topicText}>{topicLabel}</Text>
                  <Text style={styles.questionText} numberOfLines={2}>
                    {spread.question}
                  </Text>

                  <View style={styles.previewCardsRow}>
                    {spread.cards.map((card, index) => (
                      <TarotCardImage
                        key={`${spread.id}-${card.id}-${index}`}
                        cardId={card.id}
                        isReversed={card.isReversed}
                        style={styles.previewCard}
                      />
                    ))}
                  </View>
                  </View>

                  {isLocked && (
                    <View style={styles.historyLockOverlay}>
                      <Text style={styles.historyLockTitle}>Plus</Text>
                      <Text style={styles.historyLockText}>{t("history.plusOnly")}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

function formatSavedDate(value: string, language: AppLanguage) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-US", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getCardsWord(count: number, language: AppLanguage) {
  if (language === "en") {
    return count === 1 ? "card" : "cards";
  }

  if (count === 1) return "карта";
  if (count >= 2 && count <= 4) return "карты";
  return "карт";
}

function getTopicLabel(
  topic: string | undefined,
  fallback: string,
  t: (key: string) => string
) {
  if (topic === "love") return t("spread.topics.love");
  if (topic === "career" || topic === "work") return t("spread.topics.work");
  if (topic === "personal" || topic === "self") return t("spread.topics.personal");
  if (topic === "money" || topic === "finance") return t("spread.topics.money");
  if (topic === "yes-no") return t("spread.topics.yesNo");
  if (topic === "daily-advice") return t("spread.topics.dailyAdvice");
  if (topic === "compatibility") return t("spread.topics.compatibility");
  if (topic === "future") return t("spread.topics.future");
  return fallback;
}

function getTypeLabel(
  type: string | undefined,
  fallback: string,
  t: (key: string) => string
) {
  if (type === "quick") return t("spread.spreadTypes.quick");
  if (type === "clarity") return t("spread.spreadTypes.clarity");
  if (type === "deep") return t("spread.spreadTypes.deep");
  if (type === "full") return t("spread.spreadTypes.full");
  if (type === "celtic") return t("spread.spreadTypes.celtic");
  return fallback;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: {
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 54,
    paddingHorizontal: SIDE_PADDING,
    paddingBottom: Platform.OS === "android" ? 100 : 116,
  },
  backButton: {
    width: 44,
    height: 38,
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 31,
    lineHeight: 38,
    fontWeight: "700",
    fontFamily: TITLE_FONT,
    marginBottom: 8,
  },
  subtitle: {
    color: "#B698FF",
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "600",
    marginBottom: 34,
  },
  list: { gap: 20 },
  historyCard: {
    position: "relative",
    borderRadius: 22,
    backgroundColor: "rgba(16, 7, 34, 0.58)",
    borderWidth: 1,
    borderColor: "rgba(185, 156, 255, 0.08)",
    paddingHorizontal: 24,
    paddingVertical: 22,
    overflow: "hidden",
  },
  historyCardLocked: {
    borderColor: "rgba(232, 196, 54, 0.18)",
  },
  historyCardContentLocked: {
    opacity: 0.24,
  },
  historyLockOverlay: {
    position: "absolute",
    top: 16,
    right: 16,
    bottom: 16,
    left: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(232, 196, 54, 0.32)",
    backgroundColor: "rgba(18, 8, 39, 0.88)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  historyLockTitle: {
    color: "#F6CD3D",
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 5,
  },
  historyLockText: {
    color: "#D8CAFF",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  previewCardsRow: {
    width: 210,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  previewCard: {
    width: 52,
    height: 84,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeader: {
    alignItems: "flex-start",
    marginBottom: 8,
  },
  dateText: {
    color: "#BFAEFF",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  typeBadge: {
    maxWidth: "100%",
    minHeight: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: "rgba(149, 63, 196, 0.36)",
    alignItems: "center",
    justifyContent: "center",
  },
  typeBadgeText: {
    color: "#D8CAFF",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800",
  },
  topicText: {
    color: "#FFFFFF",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    marginBottom: 18,
  },
  questionText: {
    color: "#BFAEFF",
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "600",
    marginBottom: 18,
  },
  emptyCard: {
    minHeight: 220,
    borderRadius: 22,
    backgroundColor: "rgba(16, 7, 34, 0.58)",
    borderWidth: 1,
    borderColor: "rgba(185, 156, 255, 0.08)",
    paddingHorizontal: 26,
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "900",
    marginTop: 14,
    marginBottom: 8,
  },
  emptyText: {
    color: "#BFAEFF",
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "600",
    textAlign: "center",
  },
});
