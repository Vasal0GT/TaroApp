import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
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
import { useI18n } from "../../shared/i18n/LanguageContext";

type TopicId =
  | "love"
  | "work"
  | "money"
  | "personal"
  | "yes-no"
  | "daily-advice"
  | "compatibility";

type Topic = {
  id: TopicId;
  titleKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  selectedColor: string;
  selectedBackground: string;
};

const TOPICS: Topic[] = [
  {
    id: "love",
    titleKey: "spread.topics.love",
    icon: "heart-outline",
    selectedColor: "#F6CD3D",
    selectedBackground: "rgba(194, 42, 132, 0.30)",
  },
  {
    id: "work",
    titleKey: "spread.topics.work",
    icon: "briefcase-outline",
    selectedColor: "#B698FF",
    selectedBackground: "rgba(109, 76, 255, 0.28)",
  },
  {
    id: "money",
    titleKey: "spread.topics.money",
    icon: "cash-outline",
    selectedColor: "#E8C436",
    selectedBackground: "rgba(232, 196, 54, 0.22)",
  },
  {
    id: "personal",
    titleKey: "spread.topics.personal",
    icon: "moon-outline",
    selectedColor: "#B698FF",
    selectedBackground: "rgba(118, 76, 219, 0.26)",
  },
  {
    id: "yes-no",
    titleKey: "spread.topics.yesNo",
    icon: "help-circle-outline",
    selectedColor: "#F6CD3D",
    selectedBackground: "rgba(246, 205, 61, 0.20)",
  },
  {
    id: "daily-advice",
    titleKey: "spread.topics.dailyAdvice",
    icon: "sunny-outline",
    selectedColor: "#E8C436",
    selectedBackground: "rgba(232, 196, 54, 0.22)",
  },
  {
    id: "compatibility",
    titleKey: "spread.topics.compatibility",
    icon: "people-outline",
    selectedColor: "#B698FF",
    selectedBackground: "rgba(182, 152, 255, 0.22)",
  },
];

export default function SpreadTopicScreen() {
  const [selectedTopic, setSelectedTopic] = useState<TopicId | null>(null);
  const { t } = useI18n();

  const canContinue = selectedTopic !== null;

  function handleContinue() {
    if (!selectedTopic) return;

    console.log("Selected spread topic:", selectedTopic);

    router.push({
        pathname: "./type",
        params: { topic: selectedTopic }
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

        <Text style={styles.title}>{t("spread.topicTitle")}</Text>
        <Text style={styles.subtitle}>{t("spread.topicSubtitle")}</Text>

        <View style={styles.grid}>
          {TOPICS.map((topic) => {
            const isSelected = selectedTopic === topic.id;

            return (
              <Pressable
                key={topic.id}
                onPress={() => setSelectedTopic(topic.id)}
                style={[
                  styles.topicCard,
                  isSelected && {
                    borderColor: topic.selectedColor,
                    backgroundColor: topic.selectedBackground,
                  },
                ]}
              >
                <Ionicons
                  name={topic.icon}
                  size={36}
                  color={isSelected ? topic.selectedColor : "#B698FF"}
                />

                <Text
                  style={[
                    styles.topicTitle,
                    isSelected && {
                      color: "#FFFFFF",
                    },
                  ]}
                >
                  {t(topic.titleKey)}
                </Text>

                {isSelected && (
                  <View
                    style={[
                      styles.checkBadge,
                      {
                        backgroundColor: topic.selectedColor,
                      },
                    ]}
                  >
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  scrollContent: {
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 58,
    paddingHorizontal: 24,
    paddingBottom: 140,
  },

  backButton: {
    width: 42,
    height: 42,
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: 18,
  },

  title: {
    fontSize: 36,
    lineHeight: 42,
    color: "#F8F5FA",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontWeight: "700",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#9C91A9",
    marginBottom: 32,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },

  topicCard: {
    width: "47.5%",
    height: 126,
    borderRadius: 14,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    justifyContent: "space-between",
    position: "relative",
  },

  topicTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },

  checkBadge: {
    position: "absolute",
    top: -10,
    right: -10,
    width: 28,
    height: 28,
    borderRadius: 14,
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
    paddingTop: 16,
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
