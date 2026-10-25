import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../../shared/auth/AuthContext";
import { ZODIAC_SIGNS } from "../../shared/zodiac/zodiac";
import { useI18n } from "../../shared/i18n/LanguageContext";
import { getLocalizedZodiacSign } from "../../shared/zodiac/zodiacLocalization";

export default function OnboardingZodiacScreen() {
  const params = useLocalSearchParams<{ nickname?: string; editing?: string }>();
  const { user, completeOnboarding, isLoading } = useAuth();
  const { language, t } = useI18n();

  const nickname = useMemo(() => {
    if (typeof params.nickname === "string" && params.nickname.trim()) {
      return params.nickname.trim();
    }

    return user?.nickname?.trim() ?? "";
  }, [params.nickname, user?.nickname]);

  const [selectedSignId, setSelectedSignId] = useState(
    user?.zodiacSign ?? "libra"
  );

  const selectedSign =
    ZODIAC_SIGNS.find((sign) => sign.id === selectedSignId) ?? ZODIAC_SIGNS[0];
  const localizedSelectedSign = getLocalizedZodiacSign(selectedSign, language);

  function handleBackToNickname() {
    router.replace({
      pathname:
        params.editing === "true"
          ? "/profile-edit/nickname"
          : "/auth/onboarding-nickname",
      params: {
        nickname,
        editing: params.editing,
      },
    } as unknown as Href);
  }

  async function handleComplete() {
    if (!nickname) {
      Alert.alert("Nickname", t("auth.alerts.nicknameMissing"));
      router.replace("/auth/onboarding-nickname");
      return;
    }

    try {
      await completeOnboarding(nickname, selectedSign.id);

      router.replace("/(tabs)");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save data.";

      Alert.alert(t("common.error"), message);
    }
  }

  return (
    <LinearGradient
      colors={["#0B0718", "#241052", "#4B007D", "#2A074A"]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={handleBackToNickname} style={styles.backRow}>
          <Ionicons name="arrow-back" size={24} color="#BFA8FF" />
          <Text style={styles.backText}>{t("auth.zodiacBack")}</Text>
        </Pressable>

        <Text style={styles.title}>{t("auth.zodiacTitle")}</Text>

        <Text style={styles.subtitle}>{t("auth.zodiacSubtitle")}</Text>

        <View style={styles.wheel}>
          <View style={styles.outerRing} />
          <View style={styles.innerRing} />

          <View style={styles.centerCircle}>
            <Ionicons name="sparkles" size={28} color="#F6CD3D" />
            <Text style={styles.centerText}>TARO</Text>
          </View>

          {ZODIAC_SIGNS.map((sign) => {
            const radius = 128;
            const angleRad = (sign.angle * Math.PI) / 180;

            const x = Math.cos(angleRad) * radius;
            const y = Math.sin(angleRad) * radius;

            const isActive = sign.id === selectedSign.id;

            return (
              <Pressable
                key={sign.id}
                onPress={() => setSelectedSignId(sign.id)}
                style={[
                  styles.signNode,
                  {
                    left: 160 + x - 28,
                    top: 160 + y - 28,
                    transform: [{ scale: isActive ? 1.12 : 1 }],
                    shadowColor: isActive ? "#F6CD3D" : sign.color,
                    shadowOpacity: isActive ? 0.55 : 0.28,
                  },
                ]}
              >
                <LinearGradient
                  colors={[
                    `${sign.color}E6`,
                    `${sign.color}70`,
                    "rgba(29, 12, 57, 0.82)",
                  ]}
                  start={{ x: 0.12, y: 0.08 }}
                  end={{ x: 0.9, y: 1 }}
                  style={styles.signNodeGradient}
                >
                  <MaterialCommunityIcons
                    name={sign.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={27}
                    color={isActive ? "#FFF1A8" : "#FFFFFF"}
                  />
                </LinearGradient>
              </Pressable>
            );
          })}
        </View>

        <View
          style={[
            styles.infoCard,
            {
              borderColor: selectedSign.color,
            },
          ]}
        >
          <View style={styles.infoHeader}>
            <View
              style={[
                styles.signBadge,
                {
                  backgroundColor: selectedSign.color,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={selectedSign.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                size={28}
                color="#FFFFFF"
              />
            </View>

            <View style={styles.infoHeaderText}>
              <Text style={styles.signTitle}>{localizedSelectedSign.title}</Text>
              <Text style={styles.signMeta}>
                {localizedSelectedSign.dates} · {localizedSelectedSign.element}
              </Text>
              <Text style={styles.signPlanet}>
                {t("auth.planet", { planet: localizedSelectedSign.planet })}
              </Text>
            </View>
          </View>

          <Text style={styles.signDescription}>{localizedSelectedSign.description}</Text>
        </View>

        <Pressable
          onPress={handleComplete}
          disabled={isLoading}
          style={[styles.startButton, isLoading && styles.startButtonDisabled]}
        >
          <Ionicons name="sparkles-outline" size={21} color="#05020A" />
          <Text style={styles.startButtonText}>
            {isLoading ? t("common.loading") : t("auth.start")}
          </Text>
        </Pressable>

        <View style={styles.stepsRow}>
          <Pressable onPress={handleBackToNickname} style={styles.stepDot} />
          <View style={[styles.stepDot, styles.stepDotActive]} />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0B0718",
  },

  content: {
    paddingHorizontal: 22,
    paddingTop: Platform.OS === "ios" ? 76 : 48,
    paddingBottom: 34,
  },

  backRow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 26,
  },

  backText: {
    fontSize: 17,
    color: "#BFA8FF",
    fontWeight: "700",
  },

  title: {
    fontSize: 26,
    lineHeight: 32,
    color: "#F6CD3D",
    fontWeight: "900",
    textAlign: "center",
  },

  subtitle: {
    marginTop: 12,
    marginBottom: 24,
    fontSize: 15,
    lineHeight: 22,
    color: "#BFA8FF",
    textAlign: "center",
  },

  wheel: {
    width: 320,
    height: 320,
    alignSelf: "center",
    position: "relative",
    marginBottom: 26,
  },

  outerRing: {
    position: "absolute",
    left: 10,
    top: 10,
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.14)",
  },

  innerRing: {
    position: "absolute",
    left: 52,
    top: 52,
    width: 216,
    height: 216,
    borderRadius: 108,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  centerCircle: {
    position: "absolute",
    left: 110,
    top: 110,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(25, 8, 51, 0.92)",
    borderWidth: 2,
    borderColor: "rgba(246, 205, 61, 0.32)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7A2CFF",
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 6,
  },

  centerText: {
    marginTop: 8,
    color: "#BFA8FF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
  },

  signNode: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 18,
    overflow: "visible",
    shadowRadius: 14,
    elevation: 4,
  },

  signNodeGradient: {
    flex: 1,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  infoCard: {
    borderRadius: 28,
    borderWidth: 1.5,
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 22,
    marginBottom: 22,
  },

  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  signBadge: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  infoHeaderText: {
    flex: 1,
  },

  signTitle: {
    color: "#F6CD3D",
    fontSize: 21,
    fontWeight: "900",
  },

  signMeta: {
    marginTop: 4,
    color: "#DED3FF",
    fontSize: 14,
    fontWeight: "700",
  },

  signPlanet: {
    marginTop: 3,
    color: "#BFA8FF",
    fontSize: 14,
  },

  signDescription: {
    color: "#D8C8FF",
    fontSize: 16,
    lineHeight: 26,
  },

  startButton: {
    width: "100%",
    height: 72,
    borderRadius: 22,
    backgroundColor: "#E8C436",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: "#E8C436",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 5,
  },

  startButtonDisabled: {
    opacity: 0.6,
  },

  startButtonText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#05020A",
  },

  stepsRow: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },

  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.28)",
  },

  stepDotActive: {
    width: 34,
    backgroundColor: "#E8C436",
  },
});
