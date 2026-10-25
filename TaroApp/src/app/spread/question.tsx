import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useI18n } from "../../shared/i18n/LanguageContext";
import { AppLanguage } from "../../shared/i18n/translations";

const MAX_QUESTION_LENGTH = 200;

type TopicId =
  | "love"
  | "work"
  | "money"
  | "personal"
  | "yes-no"
  | "daily-advice"
  | "compatibility";

type QuestionPreset = {
  placeholder: string;
  badExample: string;
  goodExample: string;
  advice: string;
  questions: string[];
};

const QUESTION_PRESETS: Record<TopicId, QuestionPreset> = {
  love: {
    placeholder: "Например: Что он/она может чувствовать ко мне сейчас?",
    badExample: "Он меня любит?",
    goodExample: "Что он/она может чувствовать ко мне сейчас?",
    advice:
      "В любви лучше спрашивать о чувствах, мотивах, динамике отношений и своём следующем шаге. Так карты дают не сухое «да/нет», а показывают, что происходит глубже.",
    questions: [
      "Что он/она чувствует ко мне?",
      "Какая перспектива наших отношений?",
      "Что мешает нам сблизиться?",
      "Какой мой лучший шаг в этой ситуации?",
      "Что мне важно понять об этих отношениях?",
    ],
  },

  work: {
    placeholder: "Например: Какой шаг поможет мне продвинуться в работе?",
    badExample: "Меня повысят?",
    goodExample: "Что поможет мне продвинуться в работе сейчас?",
    advice:
      "В работе лучше спрашивать о действиях, возможностях, рисках и стратегии. Такой вопрос помогает увидеть путь, а не просто ждать результата.",
    questions: [
      "Какой мой лучший шаг в работе?",
      "Что мешает моему профессиональному росту?",
      "Какая возможность сейчас передо мной?",
      "На что обратить внимание в текущем проекте?",
      "Как мне лучше проявить себя?",
    ],
  },

  money: {
    placeholder: "Например: Что поможет мне улучшить финансовую ситуацию?",
    badExample: "Я разбогатею?",
    goodExample: "Что поможет мне улучшить финансовую ситуацию сейчас?",
    advice:
      "В денежных вопросах полезнее спрашивать о решениях, привычках, рисках и возможностях. Так расклад покажет направление, а не будет обещать конкретную сумму.",
    questions: [
      "Что поможет мне улучшить финансовую ситуацию?",
      "Какая ошибка мешает мне с деньгами?",
      "Где сейчас моя главная финансовая возможность?",
      "Какое решение по деньгам будет мудрым?",
      "На что мне стоит обратить внимание в расходах?",
    ],
  },

  personal: {
    placeholder: "Например: Что мне важно понять о себе сейчас?",
    badExample: "У меня всё будет хорошо?",
    goodExample: "Что мне важно понять о себе в этой ситуации?",
    advice:
      "В личных вопросах лучше спрашивать о внутреннем состоянии, причинах, страхах, желаниях и следующем шаге. Так ответ получится глубже и честнее.",
    questions: [
      "Что мне важно понять о себе сейчас?",
      "Какой внутренний страх мной управляет?",
      "Что мне пора отпустить?",
      "Какой мой следующий шаг для себя?",
      "Что поможет мне восстановить внутренний баланс?",
    ],
  },

  "yes-no": {
    placeholder:
      "Например: Что склоняет ситуацию к положительному или отрицательному исходу?",
    badExample: "Да или нет?",
    goodExample: "Что говорит за и против в этой ситуации?",
    advice:
      "Даже если нужен короткий ответ, лучше спросить, что влияет на исход. Так ты получишь не только направление, но и причину.",
    questions: [
      "Что говорит за и против в этой ситуации?",
      "К какому исходу всё больше склоняется?",
      "Что может изменить ответ?",
      "Какой фактор сейчас самый важный?",
      "Что мне нужно знать перед решением?",
    ],
  },

  "daily-advice": {
    placeholder: "Например: На что мне стоит обратить внимание сегодня?",
    badExample: "Какой будет день?",
    goodExample: "На что мне стоит обратить внимание сегодня?",
    advice:
      "Для совета дня лучше спрашивать о фокусе, энергии дня, возможностях и предупреждениях. Так ответ будет практичным.",
    questions: [
      "На что мне стоит обратить внимание сегодня?",
      "Какая энергия будет вести меня сегодня?",
      "Какой совет дня мне сейчас нужен?",
      "Чего сегодня лучше избегать?",
      "Какая возможность может появиться сегодня?",
    ],
  },

  compatibility: {
    placeholder: "Например: Какая динамика между мной и этим человеком?",
    badExample: "Мы подходим друг другу?",
    goodExample: "Какая динамика сейчас между мной и этим человеком?",
    advice:
      "В совместимости лучше спрашивать о динамике, сильных сторонах, сложностях и точках роста. Это даёт более честную картину связи.",
    questions: [
      "Какая динамика между нами сейчас?",
      "В чём наша сильная сторона?",
      "Что создаёт напряжение между нами?",
      "Как нам лучше понять друг друга?",
      "Какая перспектива у этой связи?",
    ],
  },
};

const ENGLISH_QUESTION_PRESETS: Record<TopicId, QuestionPreset> = {
  love: {
    placeholder: "Example: What might they be feeling toward me now?",
    badExample: "Do they love me?",
    goodExample: "What might they be feeling toward me now?",
    advice: "In love questions, ask about feelings, motives, relationship dynamics, and your next step. This gives more than a dry yes or no.",
    questions: [
      "What do they feel toward me?",
      "What is the potential of this relationship?",
      "What keeps us from getting closer?",
      "What is my best next step here?",
      "What should I understand about this connection?",
    ],
  },
  work: {
    placeholder: "Example: What step can help me move forward at work?",
    badExample: "Will I get promoted?",
    goodExample: "What can help me move forward at work now?",
    advice: "For work, ask about actions, opportunities, risks, and strategy. It helps reveal a path instead of only waiting for an outcome.",
    questions: [
      "What is my best step at work?",
      "What blocks my professional growth?",
      "What opportunity is in front of me now?",
      "What should I notice in my current project?",
      "How can I show myself better?",
    ],
  },
  money: {
    placeholder: "Example: What can help me improve my financial situation?",
    badExample: "Will I become rich?",
    goodExample: "What can help me improve my finances now?",
    advice: "For money questions, ask about decisions, habits, risks, and opportunities. The spread can show direction, not promise a number.",
    questions: [
      "What can help me improve my finances?",
      "What money mistake is holding me back?",
      "Where is my main financial opportunity now?",
      "What money decision would be wise?",
      "What should I notice in my spending?",
    ],
  },
  personal: {
    placeholder: "Example: What should I understand about myself now?",
    badExample: "Will everything be fine?",
    goodExample: "What should I understand about myself in this situation?",
    advice: "For personal questions, ask about inner state, reasons, fears, desires, and the next step. The answer becomes deeper and more honest.",
    questions: [
      "What should I understand about myself now?",
      "What inner fear is guiding me?",
      "What is it time for me to release?",
      "What is my next step for myself?",
      "What can help me restore inner balance?",
    ],
  },
  "yes-no": {
    placeholder: "Example: What pushes this situation toward yes or no?",
    badExample: "Yes or no?",
    goodExample: "What speaks for and against this situation?",
    advice: "Even when you need a short answer, ask what affects the outcome. You will receive direction and the reason behind it.",
    questions: [
      "What speaks for and against this situation?",
      "Which outcome is becoming more likely?",
      "What could change the answer?",
      "What factor matters most now?",
      "What should I know before deciding?",
    ],
  },
  "daily-advice": {
    placeholder: "Example: What should I pay attention to today?",
    badExample: "How will the day be?",
    goodExample: "What should I pay attention to today?",
    advice: "For daily advice, ask about focus, the day's energy, opportunities, and gentle warnings. The answer becomes more practical.",
    questions: [
      "What should I pay attention to today?",
      "What energy will guide me today?",
      "What daily advice do I need now?",
      "What should I avoid today?",
      "What opportunity may appear today?",
    ],
  },
  compatibility: {
    placeholder: "Example: What is the dynamic between us?",
    badExample: "Are we a good match?",
    goodExample: "What is the dynamic between me and this person now?",
    advice: "For compatibility, ask about dynamics, strengths, challenges, and growth points. It gives a more honest view of the bond.",
    questions: [
      "What is the dynamic between us now?",
      "What is our strongest side?",
      "What creates tension between us?",
      "How can we understand each other better?",
      "What is the potential of this bond?",
    ],
  },
};

function getTopicPreset(topic: string | undefined, language: AppLanguage): QuestionPreset {
  if (
    topic === "love" ||
    topic === "work" ||
    topic === "money" ||
    topic === "personal" ||
    topic === "yes-no" ||
    topic === "daily-advice" ||
    topic === "compatibility"
  ) {
    return language === "en" ? ENGLISH_QUESTION_PRESETS[topic] : QUESTION_PRESETS[topic];
  }

  return language === "en" ? ENGLISH_QUESTION_PRESETS.personal : QUESTION_PRESETS.personal;
}

export default function SpreadQuestionScreen() {
  const { topic, type } = useLocalSearchParams<{
    topic?: string;
    type?: string;
  }>();

  const { language, t } = useI18n();
  const preset = getTopicPreset(topic, language);

  const [question, setQuestion] = useState("");

  const trimmedQuestion = question.trim();
  const canContinue = trimmedQuestion.length > 0;

  function handleReadyQuestionPress(readyQuestion: string) {
    setQuestion(readyQuestion);
  }

  function handleQuestionChange(text: string) {
    if (text.length <= MAX_QUESTION_LENGTH) {
      setQuestion(text);
    }
  }

  function handleContinue() {
    if (!canContinue) return;

    console.log("Selected topic:", topic);
    console.log("Selected type:", type);
    console.log("Question:", trimmedQuestion);

    router.push({
        pathname: "./shuffle",
        params: {
        topic: topic ?? "",
        type: type ?? "",
        question: trimmedQuestion,
        },
    });}

function getChipStyle(text: string) {
  if (text.length <= 28) {
    return styles.chipAuto;
  }

  if (text.length <= 38) {
    return styles.chipAuto;
  }

  return styles.chipAuto;
}

  return (
    <LinearGradient
      colors={["#160726", "#3A0A67", "#6A00A8"]}
      start={{ x: 0.05, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.screen}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={26} color="#B698FF" />
          </Pressable>

          <Text style={styles.title}>{t("spread.questionTitle")}</Text>

          <Text style={styles.subtitle}>{t("spread.questionSubtitle")}</Text>

          <View style={styles.inputWrapper}>
            <TextInput
              value={question}
              onChangeText={handleQuestionChange}
              placeholder={preset.placeholder}
              placeholderTextColor="#B698FF"
              multiline
              maxLength={MAX_QUESTION_LENGTH}
              style={styles.input}
              textAlignVertical="top"
            />

            <Text style={styles.counter}>
              {question.length}/{MAX_QUESTION_LENGTH}
            </Text>
          </View>

          <Text style={styles.readyTitle}>{t("spread.readyQuestions")}</Text>

          <View style={styles.chipsWrapper}>
            {preset.questions.map((readyQuestion) => {
              const isSelected = question === readyQuestion;

              return (
                <Pressable
                  key={readyQuestion}
                  onPress={() => handleReadyQuestionPress(readyQuestion)}
                  style={[
                    styles.chip,
                    getChipStyle(readyQuestion),
                    isSelected && styles.chipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextSelected,
                    ]}
                  >
                    {readyQuestion}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>{t("spread.questionTipTitle")}</Text>

            <View style={styles.tipRow}>
              <Text style={styles.badIcon}>✕</Text>
              <Text style={styles.tipText}>
                <Text style={styles.tipMuted}>{t("spread.bad")}</Text>"
                {preset.badExample}"
              </Text>
            </View>

            <View style={styles.tipRow}>
              <Text style={styles.goodIcon}>✓</Text>
              <Text style={styles.tipText}>
                <Text style={styles.tipStrong}>{t("spread.better")}</Text>"
                {preset.goodExample}"
              </Text>
            </View>

            <Text style={styles.tipDescription}>{preset.advice}</Text>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <Pressable
            onPress={handleContinue}
            disabled={!canContinue}
            style={[
              styles.continueButton,
              !canContinue && styles.continueButtonDisabled,
            ]}
          >
            <Text
              style={[
                styles.continueButtonText,
                !canContinue && styles.continueButtonTextDisabled,
              ]}
            >
              {t("common.continue")}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 58,
    paddingHorizontal: 24,
    paddingBottom: 150,
  },

  backButton: {
    width: 42,
    height: 42,
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: 22,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "700",
    marginBottom: 10,
  },

  subtitle: {
    color: "#B698FF",
    fontSize: 18,
    lineHeight: 25,
    marginBottom: 32,
  },

  inputWrapper: {
    minHeight: 160,
    borderRadius: 20,
    backgroundColor: "rgba(16, 7, 34, 0.55)",
    borderWidth: 1,
    borderColor: "rgba(185, 156, 255, 0.18)",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 38,
    position: "relative",
    marginBottom: 28,
  },

  input: {
    color: "#FFFFFF",
    fontSize: 19,
    lineHeight: 30,
    minHeight: 100,
    padding: 0,
  },

  counter: {
    position: "absolute",
    right: 18,
    bottom: 14,
    color: "#B698FF",
    fontSize: 15,
    fontWeight: "600",
  },

  readyTitle: {
    color: "#B698FF",
    fontSize: 15,
    marginBottom: 12,
  },

chipsWrapper: {
  flexDirection: "row",
  flexWrap: "wrap",
  alignItems: "flex-start",
  columnGap: 10,
  rowGap: 10,
  marginBottom: 24,
},

chip: {
  minHeight: 42,
  paddingHorizontal: 16,
  paddingVertical: 11,
  borderRadius: 21,
  backgroundColor: "rgba(16, 7, 34, 0.68)",
  borderWidth: 1,
  borderColor: "rgba(185, 156, 255, 0.16)",
  alignItems: "flex-start",
  justifyContent: "center",
},

chipAuto: {
  alignSelf: "flex-start",
},

chipHalf: {
  width: "48%",
},

chipFull: {
  width: "100%",
},

chipSelected: {
  backgroundColor: "rgba(112, 29, 104, 0.62)",
  borderColor: "#E8C436",
  shadowColor: "#E8C436",
  shadowOpacity: 0.22,
  shadowRadius: 10,
  elevation: 3,
},

chipText: {
  color: "#FFFFFF",
  fontSize: 14,
  lineHeight: 18,
  fontWeight: "800",
  textAlign: "left",
},

chipTextSelected: {
  color: "#F6CD3D",
},

  tipCard: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: "rgba(130, 38, 91, 0.30)",
    borderWidth: 1,
    borderColor: "rgba(232, 196, 54, 0.28)",
  },

  tipTitle: {
    color: "#F6CD3D",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 16,
  },

  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },

  badIcon: {
    width: 22,
    color: "#FF5A77",
    fontSize: 17,
    fontWeight: "800",
    marginRight: 8,
  },

  goodIcon: {
    width: 22,
    color: "#4FEA91",
    fontSize: 17,
    fontWeight: "800",
    marginRight: 8,
  },

  tipText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
  },

  tipMuted: {
    color: "#B698FF",
    fontWeight: "700",
  },

  tipStrong: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  tipDescription: {
    marginTop: 8,
    color: "#B698FF",
    fontSize: 14,
    lineHeight: 22,
  },

  bottomSpacer: {
    height: 160,
  },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: Platform.OS === "android" ? 18 : 26,
    backgroundColor: "rgba(60, 10, 103, 0.92)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },

  continueButton: {
    height: 70,
    borderRadius: 18,
    backgroundColor: "#E8C436",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E8C436",
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 4,
  },

  continueButtonDisabled: {
    backgroundColor: "rgba(232, 196, 54, 0.42)",
    shadowOpacity: 0,
    elevation: 0,
  },

  continueButtonText: {
    color: "#05020A",
    fontSize: 18,
    fontWeight: "800",
  },

  continueButtonTextDisabled: {
    color: "rgba(5, 2, 10, 0.65)",
  },
});
