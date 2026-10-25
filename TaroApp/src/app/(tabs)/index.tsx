import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../../shared/auth/AuthContext";
import { openBillingPortal } from "../../shared/billing/openBillingPortal";
import { useI18n } from "../../shared/i18n/LanguageContext";
import { getLocalizedTarotDeck } from "../../shared/tarot/tarotLocalization";
import { TarotCardImage } from "../../shared/tarot/TarotCardVisual";

const INNER_ICON = require("../../../assets/images/InnerIcoTransparent.png");

function getCardOfDayId() {
  const now = new Date();
  const dayKey = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000);
  return (dayKey % 78) + 1;
}

export default function HomeScreen() {
  const { user, refreshUser } = useAuth();
  const { language, t } = useI18n();
  const cardOfDayId = getCardOfDayId();
  const cardOfDay = getLocalizedTarotDeck(language).find((card) => card.id === cardOfDayId);
  const displayName = user?.nickname ?? user?.email?.split("@")[0] ?? t("home.stranger");

  async function handleOpenBillingPortal() {
    const opened = await openBillingPortal();
    if (opened) await refreshUser();
  }

  return (
    <View style={styles.screen}>
      <View style={styles.violetGlow} pointerEvents="none" />
      <View style={styles.roseGlow} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.brandBlock}>
            <Image source={INNER_ICON} resizeMode="contain" style={styles.brandIcon} />
            <View style={styles.brandText}>
              <Text style={styles.greeting}>{t("home.greeting")}</Text>
              <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
            </View>
          </View>

          <Pressable onPress={handleOpenBillingPortal} style={styles.balanceButton}>
            <Text style={styles.balanceStar}>✦</Text>
            <Text style={styles.balanceText}>{user?.stars ?? 0}</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>
              {language === "en" ? "YOUR DAILY CARD" : "ТВОЯ КАРТА НА СЕГОДНЯ"}
            </Text>
            <Text style={styles.heroTitle}>
              {language === "en" ? "Notice what asks for your attention" : "Заметь то, что просит внимания"}
            </Text>

            <View style={styles.cardMeta}>
              <Text style={styles.cardName}>{cardOfDay?.name ?? t("home.cardOfDayName")}</Text>
              <Text style={styles.cardMeaning} numberOfLines={3}>
                {cardOfDay?.meaningUpright ?? t("home.cardOfDaySubtitle")}
              </Text>
            </View>
          </View>

          <View style={styles.heroCardVisual}>
            <View style={styles.cardShadow} />
            <TarotCardImage cardId={cardOfDayId} style={styles.cardImage} />
            <View style={styles.cardNumberBadge}>
              <Text style={styles.cardNumberText}>{String(cardOfDayId).padStart(2, "0")}</Text>
            </View>
          </View>
        </View>

        <Pressable style={styles.primaryButton} onPress={() => router.push("/spread/topic")}>
          <View>
            <Text style={styles.primaryButtonText}>{t("home.makeSpread")}</Text>
            <Text style={styles.primaryButtonHint}>
              {language === "en" ? "Choose a topic and ask your question" : "Выбери тему и задай свой вопрос"}
            </Text>
          </View>
          <View style={styles.primaryButtonArrow}>
            <Ionicons name="arrow-forward" size={21} color="#11120E" />
          </View>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {language === "en" ? "Today in the app" : "Сегодня в приложении"}
          </Text>
          <View style={styles.sectionLine} />
        </View>

        <Pressable onPress={() => router.push("/(tabs)/horoscope")} style={styles.editorialRow}>
          <View style={[styles.editorialIndex, styles.editorialIndexViolet]}>
            <Ionicons name="moon-outline" size={22} color="#C7B0FF" />
          </View>
          <View style={styles.editorialCopy}>
            <Text style={styles.editorialTitle}>{t("home.horoscopeTitle")}</Text>
            <Text style={styles.editorialText} numberOfLines={2}>{t("home.horoscopeText")}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#746A82" />
        </Pressable>

        <Pressable onPress={() => router.push("/(tabs)/tarot")} style={styles.editorialRow}>
          <View style={[styles.editorialIndex, styles.editorialIndexRose]}>
            <Ionicons name="book-outline" size={22} color="#FF9CDD" />
          </View>
          <View style={styles.editorialCopy}>
            <Text style={styles.editorialTitle}>
              {language === "en" ? "Understand the cards" : "Понять язык карт"}
            </Text>
            <Text style={styles.editorialText} numberOfLines={2}>
              {language === "en" ? "Meanings, positions and how to read a spread." : "Значения, положения и принципы чтения расклада."}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#746A82" />
        </Pressable>

        <Pressable onPress={handleOpenBillingPortal} style={styles.siteLink}>
          <Text style={styles.siteLinkText}>{t("common.visitSite")}</Text>
          <Ionicons name="open-outline" size={15} color="#DFFF71" />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#090A12" },
  violetGlow: {
    position: "absolute", top: -170, right: -180, width: 430, height: 430,
    borderRadius: 215, backgroundColor: "rgba(110, 54, 216, 0.23)",
  },
  roseGlow: {
    position: "absolute", top: 370, left: -250, width: 420, height: 420,
    borderRadius: 210, backgroundColor: "rgba(215, 55, 158, 0.10)",
  },
  scrollContent: { paddingTop: 24, paddingHorizontal: 20, paddingBottom: 150 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14 },
  brandBlock: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center" },
  brandIcon: { width: 50, height: 50, marginRight: 10 },
  brandText: { flex: 1, minWidth: 0 },
  greeting: { color: "#8F849D", fontSize: 12, lineHeight: 16 },
  userName: { marginTop: 2, color: "#F6F1F8", fontSize: 18, fontWeight: "800" },
  balanceButton: {
    minWidth: 64, height: 42, borderRadius: 21, paddingHorizontal: 13,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
    backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
  },
  balanceStar: { color: "#DFFF71", fontSize: 17 },
  balanceText: { color: "#F3EFFA", fontSize: 16, fontWeight: "900" },
  hero: { minHeight: 360, marginTop: 30, flexDirection: "row", alignItems: "center" },
  heroCopy: { flex: 1, zIndex: 2, paddingRight: 4 },
  eyebrow: { color: "#B8ACC5", fontSize: 10, lineHeight: 15, fontWeight: "900" },
  heroTitle: {
    marginTop: 12, color: "#FAF7FC", fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 35, lineHeight: 40, fontWeight: "700",
  },
  cardMeta: { marginTop: 24, paddingRight: 18 },
  cardName: { color: "#DFFF71", fontSize: 18, fontWeight: "900" },
  cardMeaning: { marginTop: 7, color: "#B2A8BE", fontSize: 13, lineHeight: 19 },
  heroCardVisual: { width: 148, height: 278, alignItems: "center", justifyContent: "center" },
  cardShadow: {
    position: "absolute", width: 132, height: 222, borderRadius: 14,
    backgroundColor: "#6846C9", transform: [{ rotate: "8deg" }, { translateX: 8 }], opacity: 0.46,
  },
  cardImage: { width: 132, height: 222, borderRadius: 10, transform: [{ rotate: "-3deg" }] },
  cardNumberBadge: {
    position: "absolute", right: 0, bottom: 10, width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#DFFF71", alignItems: "center", justifyContent: "center",
  },
  cardNumberText: { color: "#12130E", fontSize: 12, fontWeight: "900" },
  primaryButton: {
    minHeight: 76, borderRadius: 18, paddingLeft: 20, paddingRight: 12,
    backgroundColor: "#DFFF71", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12,
  },
  primaryButtonText: { color: "#11120E", fontSize: 18, fontWeight: "900" },
  primaryButtonHint: { marginTop: 3, color: "rgba(17,18,14,0.68)", fontSize: 12, lineHeight: 16, fontWeight: "600" },
  primaryButtonArrow: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(17,18,14,0.10)", alignItems: "center", justifyContent: "center" },
  sectionHeader: { marginTop: 38, marginBottom: 4, flexDirection: "row", alignItems: "center", gap: 13 },
  sectionTitle: { color: "#F5F1F7", fontSize: 17, fontWeight: "800" },
  sectionLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.10)" },
  editorialRow: {
    minHeight: 88, flexDirection: "row", alignItems: "center", gap: 14,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)",
  },
  editorialIndex: { width: 44, height: 56, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  editorialIndexViolet: { backgroundColor: "rgba(126, 83, 228, 0.18)" },
  editorialIndexRose: { backgroundColor: "rgba(232, 80, 178, 0.15)" },
  editorialCopy: { flex: 1, minWidth: 0 },
  editorialTitle: { color: "#F3EFF6", fontSize: 15, fontWeight: "800" },
  editorialText: { marginTop: 4, color: "#8F849D", fontSize: 12, lineHeight: 17 },
  siteLink: { alignSelf: "center", marginTop: 24, minHeight: 38, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12 },
  siteLinkText: { color: "#DFFF71", fontSize: 13, fontWeight: "800" },
});
