import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
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
import { PasswordRequirements } from "../../components/PasswordRequirements";
import { isPasswordValid } from "../../shared/auth/passwordValidation";

export default function NewPasswordScreen() {
  const { language, t } = useI18n();
  const { resetToken } = useLocalSearchParams<{ resetToken?: string }>();
  const { resetPassword, isLoading } = useAuth();

  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [formError, setFormError] = useState("");

  const normalizedResetToken = typeof resetToken === "string" ? resetToken : "";

  async function handleResetPassword() {
    if (!normalizedResetToken) {
      Alert.alert(t("common.error"), t("auth.alerts.resetTokenMissing"));
      router.replace("/auth/forgot-password");
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

    if (password !== passwordRepeat) {
      setFormError(
        language === "en" ? "Passwords do not match." : "Пароли не совпадают."
      );
      return;
    }

    try {
      setFormError("");
      await resetPassword(normalizedResetToken, password);

      Alert.alert(
        language === "en" ? "Done" : "Готово",
        language === "en" ? "Password has been changed." : "Пароль успешно изменён.",
        [
          {
            text: t("auth.loginButton"),
            onPress: () => router.replace("/auth/login"),
          },
        ]
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : language === "en"
            ? "Could not change the password."
            : "Не удалось изменить пароль.";

      setFormError(message);
    }
  }

  return (
    <LinearGradient
      colors={["#090A12", "#11101E", "#21143D", "#090A12"]}
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
            <Ionicons name="lock-closed-outline" size={44} color="#F6CD3D" />
          </View>

          <Text style={styles.title}>{t("auth.newPasswordTitle")}</Text>

          <Text style={styles.subtitle}>{t("auth.newPasswordSubtitle")}</Text>

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

          <View style={styles.inputWrapper}>
            <TextInput
              value={passwordRepeat}
              onChangeText={(value) => {
                setPasswordRepeat(value);
                setFormError("");
              }}
              placeholder={
                language === "en" ? "Repeat password" : "Повтори пароль"
              }
              placeholderTextColor="#A98BEA"
              secureTextEntry={!isPasswordVisible}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>

          {formError ? (
            <View style={styles.formError} accessibilityRole="alert">
              <Ionicons name="alert-circle-outline" size={18} color="#FF8A9A" />
              <Text style={styles.formErrorText}>{formError}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={handleResetPassword}
            disabled={isLoading}
            style={[styles.button, isLoading && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>
              {isLoading
                ? language === "en" ? "Saving..." : "Сохраняем..."
                : t("auth.savePassword")}
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
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    marginTop: 72,
    marginBottom: 34,
    alignSelf: "center",
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    color: "#F7F3FA",
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 14,
    marginBottom: 30,
    fontSize: 16,
    lineHeight: 22,
    color: "#9D92AA",
    textAlign: "center",
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
  passwordInput: { paddingRight: 58 },
  eyeButton: {
    position: "absolute",
    right: 22,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  button: {
    width: "100%",
    height: 70,
    borderRadius: 14,
    backgroundColor: "#DFFF71",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
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
  buttonDisabled: { opacity: 0.65 },
  buttonText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#05020A",
  },
});
