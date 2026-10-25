import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { TarotCardBack } from "../../shared/tarot/TarotCardVisual";
import { useI18n } from "../../shared/i18n/LanguageContext";
import { AppLanguage } from "../../shared/i18n/translations";

const CARD_WIDTH = 150;
const CARD_HEIGHT = 230;

export default function SpreadShuffleScreen() {
  const { topic, type, question } = useLocalSearchParams<{
    topic?: string;
    type?: string;
    question?: string;
  }>();

  const [shuffleCount, setShuffleCount] = useState(0);
  const [isShuffling, setIsShuffling] = useState(false);
  const { language, t } = useI18n();

  const deckPulse = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.8)).current;

  const cardOne = useRef(new Animated.Value(0)).current;
  const cardTwo = useRef(new Animated.Value(0)).current;
  const cardThree = useRef(new Animated.Value(0)).current;
  const cardFour = useRef(new Animated.Value(0)).current;

  const canChooseCards = shuffleCount > 0 && !isShuffling;

  function resetAnimationValues() {
    deckPulse.setValue(1);
    glowOpacity.setValue(0);
    glowScale.setValue(0.8);
    cardOne.setValue(0);
    cardTwo.setValue(0);
    cardThree.setValue(0);
    cardFour.setValue(0);
  }

  function handleShuffle() {
    if (isShuffling) return;

    setIsShuffling(true);
    resetAnimationValues();

    Animated.parallel([
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 160,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0,
          duration: 520,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),

      Animated.timing(glowScale, {
        toValue: 1.25,
        duration: 680,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.sequence([
        Animated.spring(deckPulse, {
          toValue: 1.06,
          friction: 4,
          tension: 110,
          useNativeDriver: true,
        }),
        Animated.spring(deckPulse, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),

      Animated.sequence([
        Animated.stagger(55, [
          Animated.spring(cardOne, {
            toValue: 1,
            friction: 6,
            tension: 90,
            useNativeDriver: true,
          }),
          Animated.spring(cardTwo, {
            toValue: 1,
            friction: 6,
            tension: 90,
            useNativeDriver: true,
          }),
          Animated.spring(cardThree, {
            toValue: 1,
            friction: 6,
            tension: 90,
            useNativeDriver: true,
          }),
          Animated.spring(cardFour, {
            toValue: 1,
            friction: 6,
            tension: 90,
            useNativeDriver: true,
          }),
        ]),

        Animated.delay(130),

        Animated.stagger(45, [
          Animated.spring(cardFour, {
            toValue: 0,
            friction: 7,
            tension: 95,
            useNativeDriver: true,
          }),
          Animated.spring(cardThree, {
            toValue: 0,
            friction: 7,
            tension: 95,
            useNativeDriver: true,
          }),
          Animated.spring(cardTwo, {
            toValue: 0,
            friction: 7,
            tension: 95,
            useNativeDriver: true,
          }),
          Animated.spring(cardOne, {
            toValue: 0,
            friction: 7,
            tension: 95,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start(() => {
      setShuffleCount((current) => current + 1);
      setIsShuffling(false);
    });
  }

  function handleChooseCards() {
    if (!canChooseCards) return;

    console.log("Selected topic:", topic);
    console.log("Selected type:", type);
    console.log("Question:", question);
    console.log("Shuffle count:", shuffleCount);


    router.push({
        pathname: "./cards",
        params: {
        topic: topic ?? "",
        type: type ?? "",
        question: question ?? "",
        shuffleCount: String(shuffleCount),
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
      <View style={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={25} color="#B698FF" />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>{t("spread.shuffleTitle")}</Text>
          <Text style={styles.subtitle}>{t("spread.shuffleSubtitle")}</Text>
        </View>

        <View style={styles.deckArea}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.glowCircle,
              {
                opacity: glowOpacity,
                transform: [{ scale: glowScale }],
              },
            ]}
          />

          <Animated.View
            style={[styles.deckStack, { transform: [{ scale: deckPulse }] }]}
          >
            <AnimatedCard
              progress={cardFour}
              translateX={54}
              translateY={-14}
              rotate="14deg"
              opacity={0.75}
            />

            <AnimatedCard
              progress={cardThree}
              translateX={-58}
              translateY={-8}
              rotate="-16deg"
              opacity={0.8}
            />

            <AnimatedCard
              progress={cardTwo}
              translateX={38}
              translateY={18}
              rotate="9deg"
              opacity={0.85}
            />

            <AnimatedCard
              progress={cardOne}
              translateX={-40}
              translateY={16}
              rotate="-10deg"
              opacity={0.9}
            />

            <TarotCardBack style={styles.mainCard} />
          </Animated.View>
        </View>

        <View style={styles.bottomBlock}>
          <Text style={styles.shuffleCounter}>
            {shuffleCount === 0
              ? (language === "en" ? "The deck is not shuffled yet" : "Колода ещё не перемешана")
              : language === "en"
                ? `Shuffled ${shuffleCount} ${getTimesWord(shuffleCount, language)}`
                : `Перемешано ${shuffleCount} ${getTimesWord(shuffleCount, language)}`}
          </Text>

          <Pressable
            onPress={handleShuffle}
            disabled={isShuffling}
            style={[styles.shuffleButton, isShuffling && styles.shuffleButtonActive]}
          >
            <Ionicons
              name={isShuffling ? "sparkles-outline" : "shuffle-outline"}
              size={22}
              color="#FFFFFF"
            />
            <Text style={styles.shuffleButtonText}>
              {isShuffling ? t("common.loading") : t("spread.shuffleButton")}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleChooseCards}
            disabled={!canChooseCards}
            style={[
              styles.chooseButton,
              !canChooseCards && styles.chooseButtonDisabled,
            ]}
          >
            <Text
              style={[
                styles.chooseButtonText,
                !canChooseCards && styles.chooseButtonTextDisabled,
              ]}
            >
              {t("spread.goToCards")}
            </Text>
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}

type AnimatedCardProps = {
  progress: Animated.Value;
  translateX: number;
  translateY: number;
  rotate: string;
  opacity: number;
};

function AnimatedCard({
  progress,
  translateX,
  translateY,
  rotate,
  opacity,
}: AnimatedCardProps) {
  const animatedTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, translateX],
  });

  const animatedTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, translateY],
  });

  const animatedOpacity = progress.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, opacity, opacity],
  });

  const animatedRotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", rotate],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.sideCard,
        {
          opacity: animatedOpacity,
          transform: [
            { translateX: animatedTranslateX },
            { translateY: animatedTranslateY },
            { rotate: animatedRotate },
          ],
        },
      ]}
    >
      <TarotCardBack compact style={styles.sideCardBack} />
    </Animated.View>
  );
}

function getTimesWord(count: number, language: AppLanguage = "ru") {
  if (language === "en") {
    return count === 1 ? "time" : "times";
  }

  const lastTwo = count % 100;
  const last = count % 10;

  if (lastTwo >= 11 && lastTwo <= 14) {
    return "раз";
  }

  if (last === 1) {
    return "раз";
  }

  if (last >= 2 && last <= 4) {
    return "раза";
  }

  return "раз";
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  content: {
    flex: 1,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 8 : 44,
    paddingHorizontal: 22,
    paddingBottom: Platform.OS === "android" ? 44 : 34,
  },

  backButton: {
    width: 40,
    height: 36,
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: 4,
  },

  header: {
    alignItems: "center",
    paddingHorizontal: 4,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 29,
    lineHeight: 34,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },

  subtitle: {
    color: "#B698FF",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
    textAlign: "center",
  },

  deckArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 250,
  },

  glowCircle: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "rgba(232, 196, 54, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(232, 196, 54, 0.28)",
  },

  deckStack: {
    width: CARD_WIDTH + 120,
    height: CARD_HEIGHT + 70,
    alignItems: "center",
    justifyContent: "center",
  },

  mainCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(232, 196, 54, 0.70)",
    overflow: "hidden",
    shadowColor: "#E8C436",
    shadowOpacity: 0.26,
    shadowRadius: 18,
    elevation: 8,
  },

  cardGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  cardInnerLine: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  starBadge: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "rgba(10, 4, 24, 0.24)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  cardBackText: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 13,
    letterSpacing: 4,
    fontWeight: "800",
  },

  sideCard: {
    position: "absolute",
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(232, 196, 54, 0.30)",
    overflow: "hidden",
  },

  sideCardGradient: {
    flex: 1,
  },

  sideCardBack: {
    flex: 1,
    borderRadius: 20,
    opacity: 0.72,
  },

  bottomBlock: {
    gap: 9,
    marginBottom: Platform.OS === "android" ? 16 : 10,
  },

  shuffleCounter: {
    color: "#B698FF",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 0,
  },

  shuffleButton: {
    height: 54,
    borderRadius: 18,
    backgroundColor: "rgba(16, 7, 34, 0.76)",
    borderWidth: 1,
    borderColor: "rgba(185, 156, 255, 0.16)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  shuffleButtonActive: {
    opacity: 0.78,
  },

  shuffleButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },

  chooseButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "#E8C436",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E8C436",
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 4,
  },

  chooseButtonDisabled: {
    backgroundColor: "rgba(232, 196, 54, 0.42)",
    shadowOpacity: 0,
    elevation: 0,
  },

  chooseButtonText: {
    color: "#05020A",
    fontSize: 17,
    fontWeight: "800",
  },

  chooseButtonTextDisabled: {
    color: "rgba(5, 2, 10, 0.65)",
  },
});
