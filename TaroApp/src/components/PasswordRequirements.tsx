import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useI18n } from "../shared/i18n/LanguageContext";
import {
  getPasswordRuleLabel,
  getPasswordRules,
} from "../shared/auth/passwordValidation";

type PasswordRequirementsProps = {
  password: string;
};

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const { language } = useI18n();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {language === "en" ? "Password requirements" : "Требования к паролю"}
      </Text>

      <View style={styles.rules}>
        {getPasswordRules(password).map((rule) => (
          <View key={rule.id} style={styles.rule}>
            <Ionicons
              name={rule.isMet ? "checkmark-circle" : "ellipse-outline"}
              size={17}
              color={rule.isMet ? "#DFFF71" : "#817696"}
            />
            <Text style={[styles.ruleText, rule.isMet && styles.ruleTextMet]}>
              {getPasswordRuleLabel(rule.id, language)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginTop: -2,
    marginBottom: 18,
  },
  title: {
    color: "#F3EFFA",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    marginBottom: 9,
  },
  rules: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 8,
  },
  rule: {
    width: "50%",
    minHeight: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingRight: 8,
  },
  ruleText: {
    flex: 1,
    color: "#817696",
    fontSize: 12,
    lineHeight: 16,
  },
  ruleTextMet: {
    color: "#D9D1E6",
  },
});
