import { Ionicons } from "@expo/vector-icons";
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

import { useConfirmSpreadExit } from "../../hooks/useConfirmSpreadExit";
import { TarotCardBack } from "../../shared/tarot/TarotCardVisual";
import { useI18n } from "../../shared/i18n/LanguageContext";
import { type AppLanguage } from "../../shared/i18n/translations";
import { shuffleArray } from "../../utils/random";

type SpreadTypeId = "quick" | "clarity" | "deep" | "full" | "celtic";

const FULL_DECK = Array.from({ length: 78 }, (_, index) => index + 1);

const SPREAD_CARDS_COUNT: Record<SpreadTypeId, number> = {
  quick: 1,
  clarity: 3,
  deep: 5,
  full: 7,
  celtic: 10,
};

function getCardsCount(type?: string) {
  return type && type in SPREAD_CARDS_COUNT
    ? SPREAD_CARDS_COUNT[type as SpreadTypeId]
    : 3;
}

export default function SpreadCardsScreen() {
  const confirmSpreadExit = useConfirmSpreadExit();
  const { language, t } = useI18n();
  const { topic, type, question, shuffleCount } = useLocalSearchParams<{
    topic?: string;
    type?: string;
    question?: string;
    shuffleCount?: string;
  }>();

  const requiredCount = getCardsCount(type);
  const [deck, setDeck] = useState(() => shuffleArray(FULL_DECK));
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);

  const deckRows = useMemo(
    () =>
      Array.from({ length: 3 }, (_, rowIndex) =>
        deck.filter((_, index) => index % 3 === rowIndex)
      ),
    [deck]
  );

  const canReveal = selectedCardIds.length === requiredCount;

  function handleCardPress(cardId: number) {
    setSelectedCardIds((current) => {
      if (current.includes(cardId)) {
        return current.filter((id) => id !== cardId);
      }

      if (current.length >= requiredCount) {
        return current;
      }

      return [...current, cardId];
    });
  }

  function handleShuffle() {
    setDeck((current) => shuffleArray(current));
    setSelectedCardIds([]);
  }

  function handleAutoSelect() {
    setSelectedCardIds(shuffleArray(FULL_DECK).slice(0, requiredCount));
  }

  function handleRevealCards() {
    if (!canReveal) return;

    router.push({
      pathname: "/spread/reveal",
      params: {
        topic: topic ?? "",
        type: type ?? "",
        question: question ?? "",
        shuffleCount: shuffleCount ?? "",
        cards: selectedCardIds.join(","),
      },
    });
  }

  return (
    <View style={styles.screen}>
      <View style={styles.topGlow} pointerEvents="none" />

      <View style={styles.header}>
        <Pressable
          onPress={confirmSpreadExit}
          style={styles.iconButton}
          accessibilityLabel={t("common.back")}
        >
          <Ionicons name="arrow-back" size={23} color="#F3EFFA" />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>
            {language === "en" ? "TRUST THE FIRST IMPULSE" : "ДОВЕРЬСЯ ПЕРВОМУ ИМПУЛЬСУ"}
          </Text>
          <Text style={styles.title}>
            {t("spread.chooseCardsTitle", {
              count: requiredCount,
              word: getCardsWord(requiredCount, language),
            })}
          </Text>
        </View>

        <View style={styles.counter}>
          <Text style={styles.counterValue}>{selectedCardIds.length}</Text>
          <Text style={styles.counterTotal}>/{requiredCount}</Text>
        </View>
      </View>

      <View style={styles.selectionStrip}>
        {Array.from({ length: requiredCount }, (_, index) => {
          const isFilled = index < selectedCardIds.length;

          return (
            <Pressable
              key={index}
              onPress={() => {
                const cardId = selectedCardIds[index];
                if (cardId) handleCardPress(cardId);
              }}
              style={[styles.selectionSlot, isFilled && styles.selectionSlotFilled]}
            >
              {isFilled ? (
                <TarotCardBack style={styles.slotCard} />
              ) : (
                <Text style={styles.selectionSlotText}>{index + 1}</Text>
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.deckSection}>
        <View style={styles.deckSectionHeader}>
          <Text style={styles.deckHint}>
            {language === "en"
              ? "Tap a card. Tap it again to remove it."
              : "Нажми на карту. Повторное нажатие уберёт её из выбора."}
          </Text>

          <Pressable onPress={handleShuffle} style={styles.shuffleButton}>
            <Ionicons name="shuffle" size={18} color="#DFFF71" />
            <Text style={styles.shuffleButtonText}>
              {language === "en" ? "Shuffle" : "Перемешать"}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.deckScroll}
        >
          <View style={styles.deckRows}>
            {deckRows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.deckRow}>
                {row.map((cardId) => {
                  const selectedIndex = selectedCardIds.indexOf(cardId);
                  const isSelected = selectedIndex >= 0;
                  const isDisabled = !isSelected && selectedCardIds.length >= requiredCount;

                  return (
                    <Pressable
                      key={cardId}
                      onPress={() => handleCardPress(cardId)}
                      disabled={isDisabled}
                      style={({ pressed }) => [
                        styles.deckCardButton,
                        pressed && styles.deckCardPressed,
                        isSelected && styles.deckCardSelected,
                        isDisabled && styles.deckCardDisabled,
                      ]}
                    >
                      <TarotCardBack style={styles.deckCard} />

                      {isSelected ? (
                        <View style={styles.selectedBadge}>
                          <Text style={styles.selectedBadgeText}>{selectedIndex + 1}</Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={handleAutoSelect} style={styles.autoButton}>
          <Ionicons name="dice-outline" size={20} color="#CFC6DD" />
          <Text style={styles.autoButtonText}>{t("spread.autoSelect")}</Text>
        </Pressable>

        <Pressable
          onPress={handleRevealCards}
          disabled={!canReveal}
          style={[styles.revealButton, !canReveal && styles.revealButtonDisabled]}
        >
          <Text style={styles.revealButtonText}>{t("spread.revealCards")}</Text>
          <Ionicons name="arrow-forward" size={20} color="#11120E" />
        </Pressable>
      </View>
    </View>
  );
}

function getCardsWord(count: number, language: AppLanguage) {
  if (language === "en") return count === 1 ? "card" : "cards";
  if (count === 1) return "карту";
  if (count >= 2 && count <= 4) return "карты";
  return "карт";
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 8 : 50,
    backgroundColor: "#090A12",
  },
  topGlow: {
    position: "absolute",
    top: -150,
    left: -80,
    width: 390,
    height: 390,
    borderRadius: 195,
    backgroundColor: "rgba(103, 54, 190, 0.22)",
  },
  header: {
    minHeight: 102,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  headerText: { flex: 1, minWidth: 0 },
  eyebrow: {
    color: "#A89DBA",
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "800",
  },
  title: {
    marginTop: 5,
    color: "#F7F3FA",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 29,
    lineHeight: 34,
    fontWeight: "700",
  },
  counter: {
    flexDirection: "row",
    alignItems: "baseline",
    paddingTop: 18,
  },
  counterValue: { color: "#DFFF71", fontSize: 22, fontWeight: "900" },
  counterTotal: { color: "#817696", fontSize: 15, fontWeight: "700" },
  selectionStrip: {
    minHeight: 67,
    paddingHorizontal: 18,
    paddingBottom: 13,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
  },
  selectionSlot: {
    width: 30,
    height: 48,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(207,198,221,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  selectionSlotFilled: { borderColor: "#DFFF71" },
  selectionSlotText: { color: "#71677F", fontSize: 11, fontWeight: "800" },
  slotCard: { width: 28, height: 46, borderRadius: 4 },
  deckSection: {
    flex: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(13, 12, 23, 0.84)",
  },
  deckSectionHeader: {
    minHeight: 50,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  deckHint: { flex: 1, color: "#998FA7", fontSize: 12, lineHeight: 16 },
  shuffleButton: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
  },
  shuffleButtonText: { color: "#DFFF71", fontSize: 12, fontWeight: "800" },
  deckScroll: { paddingHorizontal: 18, paddingBottom: 14 },
  deckRows: { gap: 8 },
  deckRow: { flexDirection: "row", gap: 8 },
  deckCardButton: {
    width: 48,
    height: 76,
    borderRadius: 6,
  },
  deckCardPressed: { transform: [{ scale: 0.95 }] },
  deckCardSelected: {
    shadowColor: "#DFFF71",
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 6,
  },
  deckCardDisabled: { opacity: 0.34 },
  deckCard: { width: 48, height: 76, borderRadius: 6 },
  selectedBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DFFF71",
    borderWidth: 2,
    borderColor: "#090A12",
  },
  selectedBadgeText: { color: "#11120E", fontSize: 11, fontWeight: "900" },
  actions: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: Platform.OS === "android" ? 24 : 32,
    flexDirection: "row",
    gap: 10,
  },
  autoButton: {
    minHeight: 54,
    paddingHorizontal: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  autoButtonText: { color: "#CFC6DD", fontSize: 13, fontWeight: "700" },
  revealButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: "#DFFF71",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  revealButtonDisabled: { opacity: 0.32 },
  revealButtonText: { color: "#11120E", fontSize: 16, fontWeight: "900" },
});
