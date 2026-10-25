import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";

import { useI18n } from "../../shared/i18n/LanguageContext";
import { TarotCardImage } from "../../shared/tarot/TarotCardVisual";

type ChapterProps = {
  number: string;
  title: string;
  text: string;
};

function Chapter({ number, title, text }: ChapterProps) {
  return (
    <View style={styles.chapter}>
      <Text style={styles.chapterNumber}>{number}</Text>
      <View style={styles.chapterBody}>
        <Text style={styles.chapterTitle}>{title}</Text>
        <Text style={styles.chapterText}>{text}</Text>
      </View>
    </View>
  );
}

export default function TarotScreen() {
  const { language, t } = useI18n();
  const isEnglish = language === "en";

  return (
    <View style={styles.screen}>
      <View style={styles.heroGlow} pointerEvents="none" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => router.replace("/(tabs)")} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#F4F0F7" />
          </Pressable>
          <Text style={styles.topBarTitle}>{t("tarot.title")}</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>
              {isEnglish ? "A LANGUAGE OF IMAGES" : "ЯЗЫК ОБРАЗОВ"}
            </Text>
            <Text style={styles.heroTitle}>
              {isEnglish ? "The cards do not decide for you" : "Карты не решают за тебя"}
            </Text>
            <Text style={styles.heroLead}>
              {isEnglish
                ? "They give shape to what is already felt, but has not yet become a clear thought."
                : "Они придают форму тому, что уже чувствуется, но ещё не стало ясной мыслью."}
            </Text>
          </View>

          <View style={styles.heroCardWrap}>
            <View style={styles.heroCardAccent} />
            <TarotCardImage cardId={20} style={styles.heroCard} />
          </View>
        </View>

        <View style={styles.factLine}>
          <View style={styles.fact}>
            <Text style={styles.factValue}>78</Text>
            <Text style={styles.factLabel}>{isEnglish ? "cards" : "карт"}</Text>
          </View>
          <View style={styles.factDivider} />
          <View style={styles.fact}>
            <Text style={styles.factValue}>22</Text>
            <Text style={styles.factLabel}>{isEnglish ? "major arcana" : "старших аркана"}</Text>
          </View>
          <View style={styles.factDivider} />
          <View style={styles.fact}>
            <Text style={styles.factValue}>4</Text>
            <Text style={styles.factLabel}>{isEnglish ? "suits" : "масти"}</Text>
          </View>
        </View>

        <Text style={styles.sectionEyebrow}>
          {isEnglish ? "HOW TO READ A SPREAD" : "КАК ЧИТАТЬ РАСКЛАД"}
        </Text>

        <Chapter
          number="01"
          title={isEnglish ? "Start with the image" : "Начни с изображения"}
          text={isEnglish
            ? "Notice the first detail that catches your eye: a gesture, color, direction or figure. Your immediate response is part of the reading."
            : "Заметь первую деталь, которая цепляет взгляд: жест, цвет, направление или фигуру. Твоя мгновенная реакция — часть чтения."}
        />
        <Chapter
          number="02"
          title={isEnglish ? "Consider the position" : "Учти позицию карты"}
          text={isEnglish
            ? "The same arcana sounds differently in the position of a reason, obstacle, advice or possible outcome."
            : "Один и тот же аркан звучит по-разному в позиции причины, препятствия, совета или возможного исхода."}
        />
        <Chapter
          number="03"
          title={isEnglish ? "Read the cards together" : "Собери карты в историю"}
          text={isEnglish
            ? "Do not interpret every card in isolation. Look for repetitions, contrasts and the movement from the first card to the last."
            : "Не толкуй каждую карту отдельно. Ищи повторения, контрасты и движение от первой карты к последней."}
        />

        <View style={styles.quoteBlock}>
          <Text style={styles.quoteMark}>“</Text>
          <Text style={styles.quoteText}>
            {isEnglish
              ? "A good spread does not give an order. It gives you a new angle from which a choice becomes visible."
              : "Хороший расклад не отдаёт приказ. Он даёт новый угол зрения, с которого становится виден выбор."}
          </Text>
        </View>

        <Pressable style={styles.actionButton} onPress={() => router.push("/spread/topic")}>
          <Text style={styles.actionButtonText}>{t("tarot.button")}</Text>
          <Ionicons name="arrow-forward" size={20} color="#11120E" />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#090A12" },
  heroGlow: {
    position: "absolute", top: -110, right: -170, width: 430, height: 430,
    borderRadius: 215, backgroundColor: "rgba(119, 62, 227, 0.24)",
  },
  scrollContent: {
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 8 : 48,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "android" ? 138 : 152,
  },
  topBar: { height: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  topBarTitle: { color: "#EEE9F2", fontSize: 15, fontWeight: "800" },
  topBarSpacer: { width: 42 },
  hero: { minHeight: 410, flexDirection: "row", alignItems: "center" },
  heroCopy: { flex: 1, zIndex: 2, paddingRight: 2 },
  eyebrow: { color: "#DFFF71", fontSize: 10, lineHeight: 15, fontWeight: "900" },
  heroTitle: { marginTop: 12, color: "#FAF7FC", fontFamily: Platform.OS === "ios" ? "Georgia" : "serif", fontSize: 37, lineHeight: 42, fontWeight: "700" },
  heroLead: { marginTop: 18, color: "#AAA0B7", fontSize: 14, lineHeight: 22 },
  heroCardWrap: { width: 145, height: 286, alignItems: "center", justifyContent: "center" },
  heroCardAccent: { position: "absolute", width: 126, height: 222, borderRadius: 12, backgroundColor: "#D94AB7", transform: [{ rotate: "8deg" }], opacity: 0.35 },
  heroCard: { width: 128, height: 218, borderRadius: 9, transform: [{ rotate: "-4deg" }] },
  factLine: { minHeight: 92, flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.09)" },
  fact: { flex: 1, alignItems: "center" },
  factValue: { color: "#F5F1F8", fontSize: 22, fontWeight: "900" },
  factLabel: { marginTop: 4, color: "#83788F", fontSize: 10, lineHeight: 13, textAlign: "center" },
  factDivider: { width: 1, height: 36, backgroundColor: "rgba(255,255,255,0.09)" },
  sectionEyebrow: { marginTop: 36, marginBottom: 5, color: "#8E849A", fontSize: 10, lineHeight: 15, fontWeight: "900" },
  chapter: { paddingVertical: 25, flexDirection: "row", gap: 17, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" },
  chapterNumber: { width: 34, color: "#DFFF71", fontSize: 12, fontWeight: "900" },
  chapterBody: { flex: 1 },
  chapterTitle: { color: "#F4F0F6", fontFamily: Platform.OS === "ios" ? "Georgia" : "serif", fontSize: 20, lineHeight: 25, fontWeight: "700" },
  chapterText: { marginTop: 9, color: "#A399AF", fontSize: 14, lineHeight: 23 },
  quoteBlock: { marginTop: 32, paddingLeft: 24, borderLeftWidth: 3, borderLeftColor: "#D94AB7" },
  quoteMark: { color: "#D94AB7", fontSize: 34, lineHeight: 30, fontFamily: Platform.OS === "ios" ? "Georgia" : "serif" },
  quoteText: { color: "#D7D0DF", fontFamily: Platform.OS === "ios" ? "Georgia" : "serif", fontSize: 18, lineHeight: 28 },
  actionButton: { marginTop: 34, minHeight: 62, borderRadius: 16, backgroundColor: "#DFFF71", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  actionButtonText: { color: "#11120E", fontSize: 17, fontWeight: "900" },
});
