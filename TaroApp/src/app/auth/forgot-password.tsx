import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../../shared/auth/AuthContext";
import { useI18n } from "../../shared/i18n/LanguageContext";

export default function ForgotPasswordScreen() {
  const { language, t } = useI18n();
  const { forgotPassword, isLoading } = useAuth();
  const [email, setEmail] = useState("");

  async function handleSendCode() {
    if (!email.trim()) {
      Alert.alert("Email", t("auth.alerts.emailRequired"));
      return;
    }

    try {
      await forgotPassword(email);

      router.push({
        pathname: "/auth/reset-code",
        params: {
          email: email.trim(),
        },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : language === "en"
            ? "Could not send the code."
            : "Не удалось отправить код.";

      Alert.alert(t("common.error"), message);
    }
  }

  return (
    <LinearGradient
      colors={["#0B0718", "#241052", "#4B007D", "#2A074A"]}
      style={styles.screen}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="always"
        >
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#B698FF" />
            <Text style={styles.backButtonText}>{t("common.back")}</Text>
          </Pressable>

          <View style={styles.iconBox}>
            <Ionicons name="mail-outline" size={44} color="#F6CD3D" />
          </View>

          <Text style={styles.title}>{t("auth.forgotTitle")}</Text>

          <Text style={styles.subtitle}>{t("auth.forgotSubtitle")}</Text>

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

          <Pressable
            onPress={handleSendCode}
            disabled={isLoading}
            style={[styles.button, isLoading && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>
              {isLoading
                ? language === "en" ? "Sending..." : "Отправляем..."
                : t("auth.sendCode")}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B0718" },
  keyboardView: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 72 : 48,
    paddingBottom: 28,
  },
  backButton: {
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
  iconBox: {
    width: 102,
    height: 102,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    marginTop: 72,
    marginBottom: 34,
    alignSelf: "center",
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
    marginBottom: 30,
    fontSize: 16,
    lineHeight: 22,
    color: "#B698FF",
    textAlign: "center",
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
  button: {
    width: "100%",
    height: 70,
    borderRadius: 18,
    backgroundColor: "#E8C436",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.65 },
  buttonText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#05020A",
  },
});
