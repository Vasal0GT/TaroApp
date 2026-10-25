import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useI18n } from "../../shared/i18n/LanguageContext";

export default function OnboardingNicknameScreen() {
  const params = useLocalSearchParams<{ nickname?: string; editing?: string }>();
  const { t } = useI18n();
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    if (typeof params.nickname === "string") {
      setNickname(params.nickname);
    }
  }, [params.nickname]);

  const cleanNickname = nickname.trim();
  const isValid = cleanNickname.length >= 2 && cleanNickname.length <= 32;

  function handleContinue() {
    if (!isValid) {
      Alert.alert("Nickname", t("auth.alerts.nicknameInvalid"));
      return;
    }

    router.push({
      pathname:
        params.editing === "true"
          ? "/profile-edit/zodiac"
          : "/auth/onboarding-zodiac",
      params: {
        nickname: cleanNickname,
        editing: params.editing,
      },
    } as unknown as Href);
  }

  return (
    <LinearGradient
      colors={["#0B0718", "#241052", "#4B007D", "#2A074A"]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.screen}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          <View style={styles.iconBox}>
            <Ionicons name="sparkles" size={38} color="#F6CD3D" />
          </View>

          <Text style={styles.title}>{t("auth.nicknameTitle")}</Text>

          <Text style={styles.subtitle}>{t("auth.nicknameSubtitle")}</Text>

          <View style={styles.inputWrapper}>
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder={t("auth.nicknamePlaceholder")}
              placeholderTextColor="#A98BEA"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={32}
              style={styles.input}
            />
          </View>

          <Text style={styles.previewText}>
            {cleanNickname
              ? `${t("auth.nicknamePreview")}: ${cleanNickname}`
              : "Example: Sasha"}
          </Text>

          <Pressable
            onPress={handleContinue}
            disabled={!isValid}
            style={[
              styles.continueButton,
              !isValid && styles.continueButtonDisabled,
            ]}
          >
            <Text style={styles.continueButtonText}>{t("common.continue")}</Text>
            <Ionicons name="chevron-forward" size={22} color="#05020A" />
          </Pressable>

          <View style={styles.stepsRow}>
            <View style={[styles.stepDot, styles.stepDotActive]} />

            <Pressable
              onPress={handleContinue}
              disabled={!isValid}
              style={styles.stepDot}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0B0718",
  },

  keyboardView: {
    flex: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: 26,
    paddingTop: Platform.OS === "ios" ? 104 : 72,
    paddingBottom: 34,
    alignItems: "center",
  },

  iconBox: {
    width: 108,
    height: 108,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    shadowColor: "#8B4DFF",
    shadowOpacity: 0.35,
    shadowRadius: 22,
    marginBottom: 36,
  },

  title: {
    fontSize: 27,
    lineHeight: 34,
    color: "#F6CD3D",
    fontWeight: "800",
    textAlign: "center",
  },

  subtitle: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 24,
    color: "#BFA8FF",
    textAlign: "center",
    marginBottom: 36,
  },

  inputWrapper: {
    width: "100%",
    height: 74,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(185, 156, 255, 0.30)",
    backgroundColor: "rgba(16, 7, 34, 0.45)",
    justifyContent: "center",
  },

  input: {
    flex: 1,
    paddingHorizontal: 22,
    fontSize: 25,
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "700",
  },

  previewText: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 22,
    color: "#D8C8FF",
    textAlign: "center",
    marginBottom: 32,
  },

  continueButton: {
    width: "100%",
    height: 72,
    borderRadius: 22,
    backgroundColor: "#E8C436",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: "auto",
    shadowColor: "#E8C436",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 5,
  },

  continueButtonDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },

  continueButtonText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#05020A",
  },

  stepsRow: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
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
