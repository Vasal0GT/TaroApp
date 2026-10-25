import { StyleSheet, Text, View } from "react-native";
import { useI18n } from "../../shared/i18n/LanguageContext";

export default function HoroscopeScreen() {
  const { t } = useI18n();

  return (
    <View style={styles.screen}>
      <Text style={styles.text}>{t("horoscope.title")}</Text>
      <Text style={styles.subtext}>{t("horoscope.text")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#160726",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  subtext: {
    marginTop: 10,
    color: "#B698FF",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
});
