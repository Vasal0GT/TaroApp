import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../shared/auth/AuthContext";
import { useI18n } from "../../shared/i18n/LanguageContext";

const { width, height } = Dimensions.get("window");

type StarConfig = {
  left: number;
  top: number;
  size: number;
  delay: number;
};

const STARS: StarConfig[] = [
  { left: width * 0.1, top: height * 0.07, size: 2, delay: 0 },
  { left: width * 0.22, top: height * 0.13, size: 3, delay: 250 },
  { left: width * 0.77, top: height * 0.1, size: 2, delay: 450 },
  { left: width * 0.88, top: height * 0.18, size: 3, delay: 650 },
  { left: width * 0.16, top: height * 0.28, size: 2, delay: 850 },
  { left: width * 0.35, top: height * 0.25, size: 2, delay: 1050 },
  { left: width * 0.69, top: height * 0.3, size: 2, delay: 1250 },
  { left: width * 0.93, top: height * 0.38, size: 3, delay: 1450 },
  { left: width * 0.07, top: height * 0.47, size: 2, delay: 1650 },
  { left: width * 0.31, top: height * 0.55, size: 2, delay: 1850 },
  { left: width * 0.79, top: height * 0.57, size: 2, delay: 2050 },
  { left: width * 0.91, top: height * 0.67, size: 3, delay: 2250 },
  { left: width * 0.18, top: height * 0.75, size: 2, delay: 2450 },
  { left: width * 0.54, top: height * 0.79, size: 3, delay: 2650 },
  { left: width * 0.84, top: height * 0.86, size: 2, delay: 2850 },
];

function TwinklingStar({ left, top, size, delay }: StarConfig) {
  const opacity = useRef(new Animated.Value(0.25)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1.3,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0.25,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.8,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [delay, opacity, scale]);

  return (
    <Animated.View
      style={[
        styles.star,
        {
          left,
          top,
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
}

export default function ResetCodeScreen() {
  const { language, t } = useI18n();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const { forgotPassword, verifyPasswordResetCode, isLoading } = useAuth();

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const normalizedEmail = typeof email === "string" ? email : "";
  const code = digits.join("");
  const isCodeComplete = code.length === 6 && digits.every((digit) => digit !== "");

  function handleChangeDigit(value: string, index: number) {
    const cleanValue = value.replace(/\D/g, "");

    if (!cleanValue) {
      const nextDigits = [...digits];
      nextDigits[index] = "";
      setDigits(nextDigits);
      return;
    }

    const nextDigits = [...digits];

    if (cleanValue.length > 1) {
      const chars = cleanValue.slice(0, 6).split("");

      for (let i = 0; i < 6; i += 1) {
        nextDigits[i] = chars[i] ?? "";
      }

      setDigits(nextDigits);

      const lastFilledIndex = Math.min(chars.length - 1, 5);
      inputRefs.current[lastFilledIndex]?.focus();
      return;
    }

    nextDigits[index] = cleanValue;
    setDigits(nextDigits);

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === "Backspace" && digits[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleConfirm() {
    if (isLoading) {
      return;
    }

    if (!isCodeComplete) {
      Alert.alert(t("auth.codeEmptyTitle"), t("auth.codeEmptyMessage"));
      return;
    }

    if (!normalizedEmail) {
      Alert.alert(t("common.error"), t("auth.alerts.emailMissing"));
      return;
    }

    try {
      const resetToken = await verifyPasswordResetCode(normalizedEmail, code);

      router.push({
        pathname: "/auth/new-password",
        params: {
          resetToken,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось проверить код.";

      Alert.alert(t("common.error"), message);
    }
  }

  async function handleResendCode() {
    if (isLoading) {
      return;
    }

    if (!normalizedEmail) {
      Alert.alert(t("common.error"), t("auth.alerts.emailMissing"));
      return;
    }

    try {
      await forgotPassword(normalizedEmail);

      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();

      Alert.alert(t("auth.codeSentTitle"), t("auth.codeSentMessage"));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось отправить код повторно.";

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
      <View style={styles.starsLayer} pointerEvents="none">
        {STARS.map((star, index) => (
          <TwinklingStar
            key={index}
            left={star.left}
            top={star.top}
            size={star.size}
            delay={star.delay}
          />
        ))}
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#B698FF" />
            <Text style={styles.backButtonText}>{t("auth.changeEmail")}</Text>
          </Pressable>

          <View style={styles.content}>
            <View style={styles.iconBox}>
              <Ionicons name="mail-outline" size={44} color="#F6CD3D" />
            </View>

            <Text style={styles.title}>{t("auth.resetCodeTitle")}</Text>

            <Text style={styles.subtitle}>
              {language === "en"
                ? "We sent a 6-digit password recovery code to"
                : "Мы отправили 6-значный код для восстановления пароля на"}
            </Text>

            <Text style={styles.emailText}>
              {normalizedEmail || "example@email.com"}
            </Text>

            <View style={styles.codeRow}>
              {digits.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  value={digit}
                  onChangeText={(value) => handleChangeDigit(value, index)}
                  onKeyPress={({ nativeEvent }) =>
                    handleKeyPress(nativeEvent.key, index)
                  }
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  selectionColor="#F6CD3D"
                  style={styles.codeInput}
                />
              ))}
            </View>

            <Pressable
              onPress={handleConfirm}
              disabled={isLoading}
              hitSlop={10}
              style={[
                styles.confirmButton,
                (!isCodeComplete || isLoading) && styles.confirmButtonDisabled,
              ]}
            >
              <Text
                style={[
                  styles.confirmButtonText,
                  (!isCodeComplete || isLoading) &&
                    styles.confirmButtonTextDisabled,
                ]}
              >
                {isLoading ? language === "en" ? "Checking..." : "Проверяем..." : t("auth.confirm")}
              </Text>
            </Pressable>

            <View style={styles.footerBlock}>
              <Text style={styles.footerText}>{t("auth.resendQuestion")}</Text>

              <Pressable onPress={handleResendCode} disabled={isLoading}>
                <Text style={styles.footerLink}>
                  {isLoading ? language === "en" ? "Sending..." : "Отправляем..." : t("auth.resend")}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
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

  scrollContent: {
    flexGrow: 1,
    minHeight: height,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 72 : 48,
    paddingBottom: 28,
  },

  starsLayer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },

  star: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    shadowColor: "#FFFFFF",
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 2,
  },

  backButton: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
  },

  backButtonText: {
    fontSize: 18,
    color: "#B698FF",
    fontWeight: "500",
  },

  content: {
    width: "100%",
    alignItems: "center",
    marginTop: 58,
  },

  iconBox: {
    width: 102,
    height: 102,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    marginBottom: 38,
  },

  title: {
    fontSize: 28,
    lineHeight: 34,
    color: "#F6CD3D",
    fontWeight: "600",
    textAlign: "center",
  },

  subtitle: {
    marginTop: 14,
    fontSize: 16,
    lineHeight: 22,
    color: "#B698FF",
    textAlign: "center",
  },

  emailText: {
    marginTop: 6,
    fontSize: 18,
    lineHeight: 24,
    color: "#F6CD3D",
    fontWeight: "700",
    textAlign: "center",
  },

  codeRow: {
    marginTop: 38,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  codeInput: {
    width: 52,
    height: 68,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(185, 156, 255, 0.22)",
    backgroundColor: "rgba(16, 7, 34, 0.35)",
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "700",
  },

  confirmButton: {
    width: "100%",
    height: 70,
    borderRadius: 18,
    backgroundColor: "#E8C436",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
  },

  confirmButtonDisabled: {
    backgroundColor: "rgba(232, 196, 54, 0.42)",
  },

  confirmButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#05020A",
  },

  confirmButtonTextDisabled: {
    color: "rgba(5, 2, 10, 0.75)",
  },

  footerBlock: {
    marginTop: 28,
    alignItems: "center",
  },

  footerText: {
    fontSize: 16,
    color: "#B698FF",
    textAlign: "center",
  },

  footerLink: {
    marginTop: 10,
    fontSize: 16,
    color: "#F6CD3D",
    fontWeight: "800",
    textAlign: "center",
  },
});
