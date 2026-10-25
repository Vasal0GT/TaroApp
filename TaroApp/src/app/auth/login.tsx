import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
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
import { openPublicBillingPortal } from "../../shared/billing/openBillingPortal";

const INNER_ICON = require("../../../assets/images/InnerIcoTransparent.png");

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

export default function LoginScreen() {
  const { login, isLoading } = useAuth();
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  function goAfterAuth(user: AuthUser) {
    if (user.isOnboardingCompleted) {
      router.replace("/(tabs)");
      return;
    }

    router.replace("/auth/onboarding-nickname");
  }

  async function handleLogin() {
    try {
      const result = await login(email, password);

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
        error instanceof Error ? error.message : "Could not log in.";

      Alert.alert(t("auth.alerts.loginError"), message);
    }
  }

  function handleForgotPassword() {
    router.push("/auth/forgot-password");
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
            <View style={styles.logoBox}>
              <Image source={INNER_ICON} resizeMode="contain" style={styles.logoImage} />
            </View>

            <Text style={styles.title}>{t("auth.loginTitle")}</Text>
            <Text style={styles.subtitle}>{t("auth.loginSubtitle")}</Text>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t("auth.emailDivider")}</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                value={email}
                onChangeText={setEmail}
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
                onChangeText={setPassword}
                placeholder={t("auth.passwordPlaceholder")}
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

            <Pressable onPress={handleForgotPassword} style={styles.forgotButton}>
              <Text style={styles.forgotText}>{t("auth.forgotPassword")}</Text>
            </Pressable>

            <Pressable
              onPress={handleLogin}
              disabled={isLoading}
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? t("common.loading") : t("auth.loginButton")}
              </Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t("auth.noAccount")}</Text>

            <Link href="/auth/register" asChild>
              <Pressable>
                <Text style={styles.footerLink}>{t("auth.registerLink")}</Text>
              </Pressable>
            </Link>

            <Pressable
              onPress={() => openPublicBillingPortal("/register")}
              style={styles.siteRegisterLinkWrap}
              hitSlop={8}
            >
              <Text style={styles.siteRegisterLink}>
                {t("auth.registerOnSite")}
              </Text>
            </Pressable>
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
    paddingTop: Platform.OS === "ios" ? 78 : 56,
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

  content: {
    width: "100%",
    alignItems: "center",
  },

  logoBox: {
    width: 112,
    height: 112,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  logoImage: {
    width: "100%",
    height: "100%",
  },

  title: {
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: 5,
    color: "#F6CD3D",
    fontWeight: "500",
  },

  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: "#B698FF",
  },

  dividerRow: {
    width: "100%",
    marginTop: 52,
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
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(185, 156, 255, 0.25)",
    backgroundColor: "rgba(16, 7, 34, 0.35)",
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

  forgotButton: {
    alignSelf: "flex-end",
    marginTop: 4,
    marginBottom: 20,
  },

  forgotText: {
    fontSize: 15,
    color: "#F6CD3D",
    fontWeight: "600",
  },

  loginButton: {
    width: "100%",
    height: 70,
    borderRadius: 18,
    backgroundColor: "#E8C436",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E8C436",
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 5,
  },

  loginButtonDisabled: {
    opacity: 0.65,
  },

  loginButtonText: {
    fontSize: 19,
    fontWeight: "800",
    color: "#05020A",
  },

  footer: {
    marginTop: "auto",
    paddingTop: 40,
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

  siteRegisterLinkWrap: {
    width: "100%",
    alignItems: "center",
    marginTop: 14,
    paddingVertical: 8,
  },

  siteRegisterLink: {
    color: "#E8C436",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },
});
