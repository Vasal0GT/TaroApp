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
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../shared/auth/AuthContext";
import { AuthUser } from "../../shared/api/authApi";
import { useI18n } from "../../shared/i18n/LanguageContext";
import { PasswordRequirements } from "../../components/PasswordRequirements";
import { isPasswordValid } from "../../shared/auth/passwordValidation";

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

export default function RegisterScreen() {
  const { register, isLoading } = useAuth();
  const { language, t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [formError, setFormError] = useState("");

  function goAfterAuth(user: AuthUser) {
    if (user.isOnboardingCompleted) {
      router.replace("/(tabs)");
      return;
    }

    router.replace("/auth/onboarding-nickname");
  }

  async function handleRegister() {
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setFormError(
        language === "en"
          ? "Enter a valid email address."
          : "Введите корректный адрес почты."
      );
      return;
    }

    if (!isPasswordValid(password)) {
      setFormError(
        language === "en"
          ? "The password does not meet all requirements."
          : "Пароль пока не соответствует всем требованиям."
      );
      return;
    }

    try {
      setFormError("");
      const result = await register(normalizedEmail, password);

      if (result.type === "emailVerificationRequired") {
        router.push({
          pathname: "/auth/verify-email",
          params: {
            email: result.email,
          },
        });

        return;
      }

      goAfterAuth(result.user);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not create account.";

      setFormError(message);
    }
  }

  function handleTermsPress() {
    console.log("Terms pressed");
  }

  return (
    <LinearGradient
      colors={["#090A12", "#11101E", "#21143D", "#090A12"]}
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#B698FF" />
              <Text style={styles.backButtonText}>{t("common.back")}</Text>
            </Pressable>

            <View style={styles.headerBlock}>
              <Text style={styles.title}>{t("auth.registerTitle")}</Text>
              <Text style={styles.subtitle}>{t("auth.registerSubtitle")}</Text>
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t("auth.registerEmailDivider")}</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setFormError("");
                }}
                placeholder={t("common.email")}
                placeholderTextColor="#A98BEA"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setFormError("");
                }}
                placeholder={t("auth.newPasswordPlaceholder")}
                placeholderTextColor="#A98BEA"
                secureTextEntry={!isPasswordVisible}
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.input, styles.passwordInput]}
              />

              <Pressable
                onPress={() => setIsPasswordVisible((value) => !value)}
                hitSlop={12}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#B99CFF"
                />
              </Pressable>
            </View>

            <PasswordRequirements password={password} />

            {formError ? (
              <View style={styles.formError} accessibilityRole="alert">
                <Ionicons name="alert-circle-outline" size={18} color="#FF8A9A" />
                <Text style={styles.formErrorText}>{formError}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleRegister}
              disabled={isLoading}
              style={[
                styles.registerButton,
                isLoading && styles.registerButtonDisabled,
              ]}
            >
              <Text style={styles.registerButtonText}>
                {isLoading ? t("common.loading") : t("auth.registerButton")}
              </Text>
            </Pressable>

            <View style={styles.termsBlock}>
              <Text style={styles.termsText}>{t("auth.termsPrefix")}</Text>

              <Pressable onPress={handleTermsPress}>
                <Text style={styles.termsLink}>{t("auth.termsLink")}</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t("auth.hasAccount")}</Text>

            <Link href="/auth/login" asChild>
              <Pressable>
                <Text style={styles.footerLink}>{t("auth.loginLink")}</Text>
              </Pressable>
            </Link>
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
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 2,
  },

  content: {
    width: "100%",
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

  headerBlock: {
    marginTop: 40,
    marginBottom: 34,
  },

  title: {
    fontSize: 26,
    lineHeight: 32,
    color: "#F7F3FA",
    fontWeight: "800",
  },

  subtitle: {
    marginTop: 10,
    fontSize: 16,
    color: "#9D92AA",
  },

  dividerRow: {
    width: "100%",
    marginTop: 8,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(185, 156, 255, 0.25)",
  },

  dividerText: {
    fontSize: 14,
    color: "#A98BEA",
  },

  inputWrapper: {
    width: "100%",
    height: 70,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.04)",
    justifyContent: "center",
    marginBottom: 16,
  },

  input: {
    flex: 1,
    paddingHorizontal: 24,
    fontSize: 18,
    color: "#FFFFFF",
  },

  passwordInput: {
    paddingRight: 58,
  },

  eyeButton: {
    position: "absolute",
    right: 22,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },

  registerButton: {
    width: "100%",
    height: 70,
    borderRadius: 14,
    backgroundColor: "#DFFF71",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#DFFF71",
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 5,
  },

  formError: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 2,
  },

  formErrorText: {
    flex: 1,
    color: "#FFB1BC",
    fontSize: 13,
    lineHeight: 18,
  },

  registerButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#05020A",
  },

  registerButtonDisabled: {
    opacity: 0.65,
  },

  termsBlock: {
    marginTop: 22,
    alignItems: "center",
  },

  termsText: {
    fontSize: 15,
    color: "#B698FF",
    textAlign: "center",
  },

  termsLink: {
    marginTop: 4,
    fontSize: 16,
    color: "#F6CD3D",
    fontWeight: "800",
    textAlign: "center",
  },

  footer: {
    marginTop: "auto",
    paddingTop: 56,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
  },

  footerText: {
    fontSize: 16,
    color: "#B698FF",
  },

  footerLink: {
    fontSize: 16,
    color: "#F6CD3D",
    fontWeight: "800",
  },
});
