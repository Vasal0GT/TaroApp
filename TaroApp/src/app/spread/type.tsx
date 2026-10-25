import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../../shared/auth/AuthContext";
import { isPlusSubscriptionActive } from "../../shared/api/authApi";
import { useI18n } from "../../shared/i18n/LanguageContext";
import { AppLanguage } from "../../shared/i18n/translations";

type SpreadTypeId = "quick" | "clarity" | "deep" | "full" | "celtic";

type SpreadType = {
  id: SpreadTypeId;
  price?: number;
  badge?: "Small" | "Popular" | "Plus+";
  plusOnly?: boolean;
};

const SPREAD_TYPES: SpreadType[] = [
  {
    id: "quick",
    price: 1,
    badge: "Small",
  },
  {
    id: "clarity",
    price: 3,
    badge: "Popular",
  },
  {
    id: "deep",
    price: 5,
  },
  {
    id: "full",
    price: 7,
    badge: "Plus+",
    plusOnly: true,
  },
  {
    id: "celtic",
    price: 10,
    badge: "Plus+",
    plusOnly: true,
  },
];

export default function SpreadTypeScreen() {
  const { user } = useAuth();
  const { topic } = useLocalSearchParams<{ topic?: string }>();
  const [selectedType, setSelectedType] = useState<SpreadTypeId | null>(null);
  const { language, t } = useI18n();
  const hasPlus = isPlusSubscriptionActive(user);

  const canContinue = selectedType !== null;

  function handleSelect(spreadType: SpreadType) {
    if (spreadType.plusOnly && !hasPlus) {
      return;
    }

    setSelectedType(spreadType.id);
  }

  function handleContinue() {
    if (!selectedType) return;
    console.log("Continue button was clicked")

    router.push({
     pathname: "./question",
     params: {
       topic: topic ?? "",
       type: selectedType,
     },
    });
  }

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
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#F3EFFA" />
        </Pressable>

        <Text style={styles.title}>{t("spread.typeTitle")}</Text>
        <Text style={styles.subtitle}>{t("spread.typeSubtitle")}</Text>

        <View style={styles.list}>
          {SPREAD_TYPES.map((spreadType) => {
            const isSelected = selectedType === spreadType.id;
            const isPlusOnly = spreadType.plusOnly === true;
            const isLocked = isPlusOnly && !hasPlus;

            return (
              <Pressable
                key={spreadType.id}
                onPress={() => handleSelect(spreadType)}
                disabled={isLocked}
                style={[
                  styles.spreadCard,
                  isSelected && styles.spreadCardSelected,
                  isPlusOnly && styles.spreadCardPlus,
                  isLocked && styles.spreadCardLocked,
                ]}
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.cardMainText}>
                    <Text style={styles.spreadTitle}>
                      {t(`spread.spreadTypes.${spreadType.id}`)}
                    </Text>
                    <Text style={styles.cardsCount}>
                      {t("spread.cardsCount", {
                        count: getCardsCount(spreadType.id),
                        word: getCardsWord(getCardsCount(spreadType.id), language),
                      })}
                    </Text>
                  </View>

                  <View style={styles.rightColumn}>
                    {spreadType.badge && (
                      <View
                        style={[
                          styles.badge,
                          spreadType.badge === "Small" && styles.smallBadge,
                          spreadType.badge === "Popular" && styles.popularBadge,
                          spreadType.badge === "Plus+" && styles.plusBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            spreadType.badge === "Small" && styles.smallBadgeText,
                            spreadType.badge === "Popular" &&
                              styles.popularBadgeText,
                            spreadType.badge === "Plus+" &&
                              styles.plusBadgeText,
                          ]}
                        >
                          {spreadType.badge}
                        </Text>
                      </View>
                    )}

                    <View style={styles.priceRow}>
                      <Ionicons
                        name="sparkles-outline"
                        size={16}
                        color="#F6CD3D"
                      />
                      <Text style={styles.priceText}>{spreadType.price}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.description}>
                  {t(`spread.spreadDescriptions.${spreadType.id}`)}
                </Text>

                {isLocked && (
                  <View style={styles.premiumRow}>
                    <Ionicons name="lock-closed-outline" size={15} color="#B698FF" />
                    <Text style={styles.premiumText}>{t("spread.premiumRequired")}</Text>
                  </View>
                )}

                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={16} color="#261032" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable
          onPress={handleContinue}
          disabled={!canContinue}
          style={[
            styles.continueButton,
            !canContinue && styles.continueButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.continueButtonText,
              !canContinue && styles.continueButtonTextDisabled,
            ]}
          >
            {t("common.continue")}
          </Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

function getCardsCount(type: SpreadTypeId) {
  if (type === "quick") return 1;
  if (type === "clarity") return 3;
  if (type === "deep") return 5;
  if (type === "full") return 7;
  return 10;
}

function getCardsWord(count: number, language: AppLanguage) {
  if (language === "en") {
    return count === 1 ? "card" : "cards";
  }

  if (count === 1) return "карта";
  if (count >= 2 && count <= 4) return "карты";
  return "карт";
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  scrollContent: {
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 58,
    paddingHorizontal: 24,
    paddingBottom: 150,
  },

  backButton: {
    width: 42,
    height: 42,
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 36,
    lineHeight: 42,
    color: "#F8F5FA",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontWeight: "700",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 15,
    color: "#9C91A9",
    lineHeight: 26,
    marginBottom: 32,
  },

  list: {
    gap: 10,
  },

  spreadCard: {
    minHeight: 132,
    borderRadius: 14,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    position: "relative",
  },

  spreadCardSelected: {
    borderColor: "#DFFF71",
    backgroundColor: "rgba(223, 255, 113, 0.08)",
  },

  spreadCardPlus: {
    opacity: 0.95,
  },

  spreadCardLocked: {
    opacity: 0.62,
  },

  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  cardMainText: {
    flex: 1,
    paddingRight: 16,
  },

  spreadTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    lineHeight: 29,
    fontWeight: "800",
    marginBottom: 8,
  },

  cardsCount: {
    color: "#9D92AA",
    fontSize: 14,
    fontWeight: "700",
  },

  rightColumn: {
    alignItems: "flex-end",
    minWidth: 76,
  },

  badge: {
    minHeight: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  smallBadge: {
    backgroundColor: "rgba(37, 186, 115, 0.22)",
  },

  popularBadge: {
    backgroundColor: "rgba(190, 98, 42, 0.42)",
  },

  plusBadge: {
    backgroundColor: "rgba(130, 80, 195, 0.45)",
  },

  badgeText: {
    fontSize: 14,
    fontWeight: "800",
  },

  smallBadgeText: {
    color: "#5DF0A2",
  },

  popularBadgeText: {
    color: "#F6CD3D",
  },

  plusBadgeText: {
    color: "#D5B7FF",
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  priceText: {
    color: "#DFFF71",
    fontSize: 18,
    fontWeight: "800",
  },

  plusPriceText: {
    color: "#F6CD3D",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  description: {
    marginTop: 16,
    color: "#A69BAF",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
  },

  premiumRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 18,
  },

  premiumText: {
    color: "#D5B7FF",
    fontSize: 15,
    fontWeight: "700",
  },

  checkBadge: {
    position: "absolute",
    top: -10,
    right: -10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E8C436",
    alignItems: "center",
    justifyContent: "center",
  },

  bottomSpacer: {
    height: 120,
  },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: Platform.OS === "android" ? 18 : 26,
    backgroundColor: "rgba(9, 10, 18, 0.96)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },

  continueButton: {
    height: 58,
    borderRadius: 15,
    backgroundColor: "#DFFF71",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#DFFF71",
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 4,
  },

  continueButtonDisabled: {
    backgroundColor: "rgba(223, 255, 113, 0.28)",
    shadowOpacity: 0,
    elevation: 0,
  },

  continueButtonText: {
    color: "#05020A",
    fontSize: 18,
    fontWeight: "800",
  },

  continueButtonTextDisabled: {
    color: "rgba(5, 2, 10, 0.65)",
  },
});
