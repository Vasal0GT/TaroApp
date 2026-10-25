import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href, useFocusEffect } from "expo-router";
import { ReactNode, useCallback, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { getSavedSpreads, SavedSpread } from "../../storage/spreadHistory";
import { TAROT_DECK } from "../../constants/tarotDeck";
import { useAuth } from "../../shared/auth/AuthContext";
import { openBillingPortal } from "../../shared/billing/openBillingPortal";
import { isPlusSubscriptionActive } from "../../shared/api/authApi";
import { TarotCardBack, TarotCardImage } from "../../shared/tarot/TarotCardVisual";
import { getLocalizedTarotCard } from "../../shared/tarot/tarotLocalization";
import { getZodiacTitle, ZODIAC_SIGNS } from "../../shared/zodiac/zodiac";
import { useI18n } from "../../shared/i18n/LanguageContext";
import { getLocalizedZodiacSign } from "../../shared/zodiac/zodiacLocalization";
import { type AppLanguage } from "../../shared/i18n/translations";

type TopicStat = {
  label: string;
  value: number;
  percent: number;
  color: string;
};

type FrequentCardStat = {
  id: number;
  name: string;
  count: number;
  reversedCount: number;
  uprightCount: number;
};

type SuitStat = {
  key: string;
  label: string;
  subtitle: string;
  percent: number;
  color: string;
};

type ActivityCell = {
  dateKey: string;
  count: number;
  day: number | null;
  isCurrentMonth: boolean;
};

type IntuitionProgress = {
  level: number;
  title: string;
  totalXp: number;
  currentXp: number;
  nextLevelXp: number;
  progressPercent: number;
};

const SIDE_PADDING = 24;
const TOTAL_DECK_CARDS = 78;
const MAX_INTUITION_LEVEL = 250;
const FIRST_LEVEL_XP = 5;
const LEVEL_COST_MULTIPLIER = 1.5;

const TITLE_FONT = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: undefined,
});

const TOPIC_COLORS = [
  "#FF3FA4",
  "#33A9FF",
  "#E8C436",
  "#B65CFF",
  "#78D66D",
  "#FFB84D",
  "#FF6B8A",
];

const WEEK_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const WEEK_DAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TOPIC_DEFINITIONS = [
  { key: "love", label: "Любовь" },
  { key: "work", label: "Работа" },
  { key: "money", label: "Деньги" },
  { key: "personal", label: "Личное" },
  { key: "yes-no", label: "Да / Нет" },
  { key: "daily-advice", label: "Совет дня" },
  { key: "compatibility", label: "Совместимость" },
];

const SPREAD_TYPE_DEFINITIONS = [
  { type: "quick", label: "Быстрый ответ", cards: 1, xp: 1 },
  { type: "clarity", label: "Ясность", cards: 3, xp: 2 },
  { type: "deep", label: "Глубокий взгляд", cards: 5, xp: 3 },
  { type: "full", label: "Полный разбор", cards: 7, xp: 4 },
  { type: "celtic", label: "Кельтский крест", cards: 10, xp: 5 },
];

const INTUITION_TITLES = [
  "Искра интуиции",
  "Наблюдатель знаков",
  "Ученик карт",
  "Слушатель арканов",
  "Толкователь символов",
  "Проводник смысла",
  "Хранитель вопроса",
  "Читатель теней",
  "Лунный практик",
  "Звёздный наблюдатель",
  "Искатель пути",
  "Голос внутреннего знания",
  "Арканист",
  "Хранитель раскладов",
  "Мастер вопросов",
  "Проводник арканов",
  "Созерцатель судьбы",
  "Знаток карт",
  "Старший толкователь",
  "Лунный наставник",
  "Мастер интуиции",
  "Звёздный проводник",
  "Хранитель тайн",
  "Магистр арканов",
  "Оракул пути",
  "Советник судьбы",
  "Хранитель света",
  "Верховный арканист",
  "Мудрец карт",
  "Оракул Taro",
];

const INTUITION_TITLES_EN = [
  "Spark of intuition",
  "Sign watcher",
  "Card apprentice",
  "Arcana listener",
  "Symbol reader",
  "Meaning guide",
  "Question keeper",
  "Shadow reader",
  "Moon practitioner",
  "Star observer",
  "Path seeker",
  "Inner voice",
  "Arcanist",
  "Spread keeper",
  "Question master",
  "Arcana guide",
  "Fate contemplator",
  "Card adept",
  "Senior interpreter",
  "Moon mentor",
  "Intuition master",
  "Star guide",
  "Keeper of mysteries",
  "Arcana magister",
  "Path oracle",
  "Fate adviser",
  "Keeper of light",
  "High arcanist",
  "Card sage",
  "Taro oracle",
];

export default function ProfileScreen() {
  const [savedSpreads, setSavedSpreads] = useState<SavedSpread[]>([]);

  const { user, logout, deleteAccount, refreshUser, isLoading } = useAuth();
  const { language, languagePreference, setLanguagePreference, t } = useI18n();

  const profileName =
    user?.nickname?.trim() || user?.email?.split("@")[0] || t("home.stranger");

  const profileBalance = user?.stars ?? 0;
  const hasPlus = isPlusSubscriptionActive(user);

  const zodiacSign = ZODIAC_SIGNS.find((item) => item.id === user?.zodiacSign);
  const zodiacTitle = zodiacSign
    ? getLocalizedZodiacSign(zodiacSign, language).title
    : getZodiacTitle(user?.zodiacSign);
  const zodiacSymbol = getZodiacSymbol(user?.zodiacSign);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadProfileStats() {
        const spreads = await getSavedSpreads();

        try {
          await refreshUser();
        } catch (error) {
          console.log("Refresh user failed", error);
        }

        if (isActive) {
          setSavedSpreads(spreads);
        }
      }

      loadProfileStats();

      return () => {
        isActive = false;
      };
    }, [refreshUser])
  );

  const stats = useMemo(() => {
    return buildProfileStats(savedSpreads, language, t);
  }, [language, savedSpreads, t]);

  function handleOpenHistory() {
    router.push("/(tabs)/history");
  }

  async function handleTopUpBalance() {
    const opened = await openBillingPortal();

    if (opened) {
      await refreshUser();
    }
  }

  function handleSettings() {
    console.log("Settings pressed");
  }

  function handleNotifications() {
    console.log("Notifications pressed");
  }

  function handlePrivacy() {
    console.log("Privacy pressed");
  }

  function handleEditProfile() {
    router.push({
      pathname: "/profile-edit/nickname",
      params: {
        nickname: user?.nickname ?? "",
        editing: "true",
      },
    } as unknown as Href);
  }

  async function handleLogout() {
    try {
      await logout();

      router.replace("/auth/login");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not log out.";

      Alert.alert(t("common.error"), message);
    }
  }

  function handleDeleteProfile() {
    Alert.alert(
      language === "en" ? "Delete account?" : "Удалить аккаунт?",
      language === "en"
        ? "Your profile, reading history, subscription and account data will be permanently deleted. This cannot be undone."
        : "Профиль, история раскладов, подписка и данные аккаунта будут удалены без возможности восстановления.",
      [
        { text: t("common.no"), style: "cancel" },
        {
          text: language === "en" ? "Delete permanently" : "Удалить навсегда",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount();
              router.replace("/auth/login");
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : language === "en"
                    ? "Could not delete the account."
                    : "Не удалось удалить аккаунт.";

              Alert.alert(t("common.error"), message);
            }
          },
        },
      ]
    );
  }

  return (
    <LinearGradient
      colors={["#090A12", "#11101E", "#21143D"]}
      start={{ x: 0.05, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.screen}
    >
      <View pointerEvents="none" style={styles.starsLayer}>
        {Array.from({ length: 34 }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.star,
              {
                left: `${(index * 23) % 94}%`,
                top: `${(index * 37) % 96}%`,
                opacity: index % 3 === 0 ? 0.65 : 0.28,
                width: index % 4 === 0 ? 3 : 2,
                height: index % 4 === 0 ? 3 : 2,
              },
            ]}
          />
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.pageTitle}>{t("profile.title")}</Text>

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <LinearGradient
              colors={["rgba(255,255,255,0.13)", "rgba(255,255,255,0.05)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarSymbol}>🌙</Text>
            </LinearGradient>

            <View style={styles.userInfoBlock}>
              <Text style={styles.userName}>{profileName}</Text>

              <View style={styles.zodiacRow}>
                <View style={styles.zodiacBadge}>
                  <Text style={styles.zodiacBadgeText}>{zodiacSymbol}</Text>
                </View>

                <Text style={styles.userMeta}>{zodiacTitle}</Text>
              </View>

              {hasPlus && (
                <View style={styles.plusBadge}>
                  <Text style={styles.plusBadgeText}>Plus</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.intuitionPanel}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankBadgeText}>{stats.intuition.title}</Text>
            </View>

            <View style={styles.intuitionRow}>
              <Text style={styles.intuitionLabel}>
                {t("profile.intuitionLevel", {
                  level: stats.intuition.level,
                  max: MAX_INTUITION_LEVEL,
                })}
              </Text>
              <Text style={styles.intuitionPercent}>
                {stats.intuition.progressPercent}%
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${stats.intuition.progressPercent}%` },
                ]}
              />
            </View>

            <Text style={styles.intuitionHint}>
              {stats.intuition.level >= MAX_INTUITION_LEVEL
                ? t("profile.maxLevelHint", { xp: stats.intuition.totalXp })
                : t("profile.nextLevelHint", {
                    current: stats.intuition.currentXp,
                    next: stats.intuition.nextLevelXp,
                  })}
            </Text>
          </View>

          <View style={styles.balanceBlock}>
            <Text style={styles.balanceText}>
              {t("profile.balance", { balance: profileBalance })}
            </Text>

            <Pressable onPress={handleTopUpBalance} hitSlop={8}>
              <Text style={styles.balanceSiteLink}>{t("common.visitSite")}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>{t("profile.languageTitle")}</Text>
          <Text style={styles.captionText}>{t("profile.languageSubtitle")}</Text>

          <View style={styles.languageRow}>
            {[
              { value: "auto", label: t("profile.languageAuto") },
              { value: "ru", label: t("common.russian") },
              { value: "en", label: t("common.english") },
            ].map((item) => {
              const isSelected = languagePreference === item.value;

              return (
                <Pressable
                  key={item.value}
                  onPress={() =>
                    setLanguagePreference(item.value as "auto" | "ru" | "en")
                  }
                  style={[
                    styles.languageOption,
                    isSelected && styles.languageOptionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.languageOptionText,
                      isSelected && styles.languageOptionTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <PlusLockedArea locked={!hasPlus} label={t("profile.plusOnly")}>
        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>{t("profile.pathTitle")}</Text>

          <View style={styles.mainStatsGrid}>
            <StatTile value={stats.totalSpreads} label={t("profile.spreads")} />
            <StatTile value={stats.totalCards} label={t("profile.cardsFallen")} />
            <StatTile value={`${stats.uprightPercent}%`} label={t("profile.uprightCards")} />
            <StatTile value={stats.activeDays} label={t("profile.activeDays")} />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>{t("profile.energyBalance")}</Text>

          <EnergyBar
            label={t("profile.upright")}
            percent={stats.uprightPercent}
            color="#B65CFF"
          />

          <EnergyBar
            label={t("profile.reversed")}
            percent={stats.reversedPercent}
            color="#E8C436"
          />

          <Text style={styles.captionText}>{stats.energyCaption}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>{t("profile.frequentTopics")}</Text>

          {stats.topicStats.map((item) => (
            <TopicBar key={item.label} item={item} />
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>{t("profile.openedCards")}</Text>

          <View style={styles.openCardsRow}>
            <Text style={styles.openCardsNumber}>{stats.discoveredCards}</Text>
            <Text style={styles.openCardsTotal}>/ {TOTAL_DECK_CARDS}</Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.openCardsProgressFill,
                { width: `${stats.discoveredPercent}%` },
              ]}
            />
          </View>

          <Text style={styles.captionText}>
            {t("profile.deckPercent", { percent: stats.discoveredPercent })}
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>{t("profile.frequentCards")}</Text>

          {stats.frequentCards.length === 0 ? (
            <Text style={styles.emptySmallText}>
              {t("profile.noFrequentCards")}
            </Text>
          ) : (
            stats.frequentCards.map((card, index) => (
              <FrequentCardRow
                key={card.id}
                card={card}
                index={index}
                language={language}
              />
            ))
          )}
        </View>

        <LinearGradient
          colors={["rgba(139, 58, 95, 0.72)", "rgba(108, 31, 109, 0.56)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.monthCard}
        >
          <Text style={styles.cardTitle}>{t("profile.cardOfMonth")}</Text>

            <View style={styles.monthCardRow}>
            {stats.cardOfMonth ? (
              <TarotCardImage
                cardId={stats.cardOfMonth.id}
                isReversed={stats.cardOfMonth.mostlyReversed}
                style={styles.monthCardPreview}
              />
            ) : (
              <TarotCardBack compact style={styles.monthCardPreview} />
            )}

            <View style={styles.monthTextBlock}>
              <Text style={styles.monthCardName}>
                {stats.cardOfMonth?.name ?? t("profile.noMonthCard")}
              </Text>
              <Text style={styles.monthCardText}>
                {stats.cardOfMonth
                  ? t("profile.monthCardText", { name: stats.cardOfMonth.name })
                  : t("profile.noFrequentCards")}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>{t("profile.spreadTypes")}</Text>

          <View style={styles.spreadTypesGrid}>
            {stats.spreadTypes.map((item) => (
              <View key={item.label} style={styles.spreadTypeTile}>
                <View style={styles.spreadTypeTopRow}>
                  <View style={styles.spreadTypeBadge}>
                    <Text style={styles.spreadTypeBadgeText}>{item.cards}</Text>
                  </View>

                  <Text style={styles.spreadTypeCardsText}>
                    {item.cards} {getCardsWord(item.cards, language)}
                  </Text>
                </View>

                <Text style={styles.spreadTypeLabel}>{item.label}</Text>

                <Text style={styles.spreadTypeCount}>
                  {item.count} {getSpreadsWord(item.count, language)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>{t("profile.suitEnergy")}</Text>

          <View style={styles.suitDonutBlock}>
            <SuitDonutChart suits={stats.suitStats} centerLabel={t("profile.suits.center")} />

            <View style={styles.suitLegend}>
              {stats.suitStats.map((suit) => (
                <View key={suit.key} style={styles.suitLegendRow}>
                  <View
                    style={[
                      styles.suitLegendDot,
                      { backgroundColor: suit.color },
                    ]}
                  />
                  <Text style={styles.suitLegendText}>{suit.label}</Text>
                  <Text style={styles.suitLegendPercent}>{suit.percent}%</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>{t("profile.moodStats")}</Text>

          <View style={styles.moodWrap}>
            {stats.moodStats.length === 0 ? (
              <Text style={styles.emptySmallText}>
                {t("profile.noMoodStats")}
              </Text>
            ) : (
              stats.moodStats.map((item) => (
                <View key={item.label} style={styles.moodChip}>
                  <Text style={styles.moodNumber}>{item.count}</Text>
                  <Text style={styles.moodLabel}>{item.label}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>{t("profile.activityMonth")}</Text>

          <View style={styles.monthActivityHeader}>
            {getWeekDays(language).map((day) => (
              <Text key={day} style={styles.monthActivityDay}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.monthActivityGrid}>
            {stats.activityMatrix.map((week, weekIndex) => (
              <View key={`week-${weekIndex}`} style={styles.monthActivityRow}>
                {week.map((cell) => (
                  <View
                    key={cell.dateKey}
                    style={[
                      styles.monthActivityCell,
                      !cell.isCurrentMonth && styles.monthActivityCellMuted,
                      cell.count > 0 && styles.monthActivityCellActive,
                      cell.count > 1 && styles.monthActivityCellStrong,
                    ]}
                  >
                    <Text
                      style={[
                        styles.monthActivityCellText,
                        !cell.isCurrentMonth && styles.monthActivityCellTextMuted,
                        cell.count > 0 && styles.monthActivityCellTextActive,
                      ]}
                    >
                      {cell.day ?? ""}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          <Text style={styles.activityCaption}>
            {t("profile.activityCaption", {
              count: stats.thisMonthSpreads,
              word: getSpreadsWord(stats.thisMonthSpreads, language),
              day: stats.mostActiveDayLabel,
            })}
          </Text>
        </View>

        <LinearGradient
          colors={["rgba(139, 58, 95, 0.66)", "rgba(106, 30, 102, 0.46)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.streakCard}
        >
          <View style={styles.fireCircle}>
            <Text style={styles.fireEmoji}>🔥</Text>
          </View>

          <View style={styles.streakTextBlock}>
            <Text style={styles.streakTitle}>
              {t("profile.streak", { days: stats.streakDays })}
            </Text>
            <Text style={styles.streakText}>
              {t("profile.weekActivity", { count: stats.thisWeekSpreads })}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>{t("profile.lastSpread")}</Text>

          {stats.lastSpread ? (
            <>
              <View style={styles.lastSpreadBox}>
                <View style={styles.lastSpreadMetaRow}>
                  <View style={styles.lastSpreadPill}>
                    <Text style={styles.lastSpreadPillText}>
                      {stats.lastSpread.topicLabel}
                    </Text>
                  </View>

                  <View style={styles.lastSpreadPillMuted}>
                    <Text style={styles.lastSpreadPillMutedText}>
                      {stats.lastSpread.typeLabel}
                    </Text>
                  </View>

                  <View style={styles.lastSpreadPillMuted}>
                    <Text style={styles.lastSpreadPillMutedText}>
                      {stats.lastSpread.cards.length}{" "}
                      {getCardsWord(stats.lastSpread.cards.length, language)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.lastSpreadQuestion} numberOfLines={2}>
                  "{stats.lastSpread.question}"
                </Text>

                <Text style={styles.lastSpreadAnswer} numberOfLines={2}>
                  {stats.lastSpread.shortAnswer}
                </Text>
              </View>

              <Pressable onPress={handleOpenHistory} style={styles.openHistoryButton}>
                <Text style={styles.openHistoryButtonText}>{t("profile.openHistory")}</Text>
              </Pressable>
            </>
          ) : (
            <Text style={styles.emptySmallText}>
              {t("profile.lastSpreadEmpty")}
            </Text>
          )}
        </View>

        </PlusLockedArea>

        <View style={styles.menuCard}>
          <MenuRow
            icon="✦"
            label={t("common.visitSite")}
            accent
            onPress={handleTopUpBalance}
          />
          <MenuRow icon="⚙" label={t("profile.menuSettings")} onPress={handleSettings} />
          <MenuRow
            icon="✨"
            label={t("profile.menuEditProfile")}
            onPress={handleEditProfile}
          />
          <MenuRow icon="🔔" label={t("profile.menuNotifications")} onPress={handleNotifications} />
          <MenuRow icon="📜" label={t("profile.menuHistory")} onPress={handleOpenHistory} />
          <MenuRow
            icon="🔒"
            label={t("profile.menuPrivacy")}
            onPress={handlePrivacy}
          />
        </View>

        <View style={styles.dangerCard}>
          <Pressable
            onPress={handleLogout}
            disabled={isLoading}
            style={styles.deleteRow}
          >
            <Text style={styles.logoutText}>
              {isLoading ? t("common.loading") : t("profile.logout")}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="white" />
          </Pressable>

          <Text style={styles.dangerTitle}>{t("profile.dangerZone")}</Text>

          <Pressable
            onPress={handleDeleteProfile}
            disabled={isLoading}
            style={styles.deleteRow}
          >
            <Text style={styles.deleteText}>
              {isLoading ? t("common.loading") : t("profile.deleteProfile")}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#FF6B7A" />
          </Pressable>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function PlusLockedArea({
  locked,
  label,
  children,
}: {
  locked: boolean;
  label: string;
  children: ReactNode;
}) {
  if (!locked) {
    return <>{children}</>;
  }

  return (
    <View style={styles.plusLockedArea}>
      <View pointerEvents="none" style={styles.plusLockedHiddenContent}>
        {children}
      </View>

      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.plusLockedBase]} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.plusLockedStripeOne]} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.plusLockedStripeTwo]} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.plusLockedNoise]} />

      <View style={styles.plusLockedNotice}>
        <Text style={styles.plusLockedNoticeTitle}>Plus</Text>
        <Text style={styles.plusLockedNoticeText}>{label}</Text>
      </View>
    </View>
  );
}

function StatTile({ value, label }: { value: number | string; label: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function EnergyBar({
  label,
  percent,
  color,
}: {
  label: string;
  percent: number;
  color: string;
}) {
  return (
    <View style={styles.energyBlock}>
      <View style={styles.energyHeader}>
        <Text style={styles.energyLabel}>{label}</Text>
        <Text style={styles.energyPercent}>{percent}%</Text>
      </View>

      <View style={styles.energyTrack}>
        <View
          style={[
            styles.energyFill,
            {
              width: `${percent}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

function TopicBar({ item }: { item: TopicStat }) {
  return (
    <View style={styles.topicBlock}>
      <View style={styles.topicHeader}>
        <Text style={styles.topicLabel}>{item.label}</Text>
        <Text style={styles.topicPercent}>{item.percent}%</Text>
      </View>

      <View style={styles.topicTrack}>
        <View
          style={[
            styles.topicFill,
            {
              width: `${item.percent}%`,
              backgroundColor: item.color,
            },
          ]}
        />
      </View>
    </View>
  );
}

function FrequentCardRow({
  card,
  index,
  language,
}: {
  card: FrequentCardStat;
  index: number;
  language: AppLanguage;
}) {
  const mostlyReversed = card.reversedCount > card.uprightCount;

  return (
    <View style={styles.frequentCardRow}>
      <TarotCardImage
        cardId={card.id}
        isReversed={mostlyReversed}
        style={styles.frequentCardPreview}
      />

      <View style={styles.frequentCardTextBlock}>
        <Text style={styles.frequentCardName}>{card.name}</Text>
        <Text style={styles.frequentCardMeta}>
          {card.count} {getTimesWord(card.count, language)} ·{" "}
          {language === "en" ? "mostly" : "чаще"}{" "}
          {mostlyReversed
            ? language === "en" ? "reversed" : "перевёрнутая"
            : language === "en" ? "upright" : "прямая"}
        </Text>
      </View>

      <Text style={styles.frequentCardRank}>#{index + 1}</Text>
    </View>
  );
}

function SuitDonutChart({
  suits,
  centerLabel,
}: {
  suits: SuitStat[];
  centerLabel: string;
}) {
  const size = 132;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let offsetPercent = 0;

  return (
    <View style={styles.donutWrapper}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(85, 35, 130, 0.62)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {suits.map((suit) => {
            const dash = (suit.percent / 100) * circumference;
            const gap = 3;
            const dashValue = Math.max(0, dash - gap);
            const strokeDashoffset = -(offsetPercent / 100) * circumference;

            offsetPercent += suit.percent;

            return (
              <Circle
                key={suit.key}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={suit.color}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={`${dashValue} ${circumference - dashValue}`}
                strokeDashoffset={strokeDashoffset}
              />
            );
          })}
        </G>
      </Svg>

      <View style={styles.donutCenter}>
        <Text style={styles.donutCenterNumber}>4</Text>
        <Text style={styles.donutCenterText}>{centerLabel}</Text>
      </View>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  accent,
  onPress,
}: {
  icon: string;
  label: string;
  accent?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.menuRow}>
      <Text style={[styles.menuIcon, accent && styles.menuIconAccent]}>{icon}</Text>
      <Text style={[styles.menuText, accent && styles.menuTextAccent]}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color="#8F6DCA" />
    </Pressable>
  );
}

function getZodiacSymbol(sign?: string | null) {
  const map: Record<string, string> = {
    aries: "♈",
    taurus: "♉",
    gemini: "♊",
    cancer: "♋",
    leo: "♌",
    virgo: "♍",
    libra: "♎",
    scorpio: "♏",
    sagittarius: "♐",
    capricorn: "♑",
    aquarius: "♒",
    pisces: "♓",
  };

  if (!sign) {
    return "✦";
  }

  return map[sign] ?? "✦";
}

function buildProfileStats(
  spreads: SavedSpread[],
  language: AppLanguage,
  t: (key: string, params?: Record<string, string | number>) => string
) {
  const totalSpreads = spreads.length;
  const allCards = spreads.flatMap((spread) => spread.cards);
  const totalCards = allCards.length;

  const reversedCards = allCards.filter((card) => card.isReversed).length;
  const uprightCards = Math.max(0, totalCards - reversedCards);

  const uprightPercent =
    totalCards > 0 ? Math.round((uprightCards / totalCards) * 100) : 0;
  const reversedPercent =
    totalCards > 0 ? Math.round((reversedCards / totalCards) * 100) : 0;

  const activeDayKeys = new Set(spreads.map((spread) => getDateKey(spread.createdAt)));
  const activeDays = activeDayKeys.size;

  const topicStats = buildTopicStats(spreads, t);
  const discoveredCards = new Set(allCards.map((card) => card.id)).size;
  const discoveredPercent = Math.round((discoveredCards / TOTAL_DECK_CARDS) * 100);

  const frequentCards = buildFrequentCards(spreads, language);
  const cardOfMonth = buildCardOfMonth(spreads, language);
  const spreadTypes = buildSpreadTypes(spreads, t);
  const suitStats = buildSuitStats(spreads, t);
  const moodStats = buildMoodStats(spreads);
  const activityMatrix = buildActivityMatrix(spreads);
  const mostActiveDayLabel = buildMostActiveDayLabel(spreads, language, t);
  const streakDays = buildStreakDays(spreads);
  const thisWeekSpreads = buildThisWeekSpreads(spreads);
  const thisMonthSpreads = buildThisMonthSpreads(spreads);
  const intuition = buildIntuitionProgress(spreads, language);
  const lastSpread = spreads[0] ?? null;

  const energyCaption =
    totalCards === 0
      ? t("profile.energyCaptionEmpty")
      : uprightPercent >= reversedPercent
        ? t("profile.energyCaptionUpright")
        : t("profile.energyCaptionReversed");

  return {
    totalSpreads,
    totalCards,
    uprightPercent,
    reversedPercent,
    activeDays,
    topicStats,
    discoveredCards,
    discoveredPercent,
    frequentCards,
    cardOfMonth,
    spreadTypes,
    suitStats,
    moodStats,
    activityMatrix,
    mostActiveDayLabel,
    streakDays,
    thisWeekSpreads,
    thisMonthSpreads,
    intuition,
    lastSpread,
    energyCaption,
  };
}

function buildTopicStats(
  spreads: SavedSpread[],
  t: (key: string) => string
): TopicStat[] {
  const counts = new Map<string, number>();

  spreads.forEach((spread) => {
    const key = normalizeTopicKey(spread.topic || spread.topicLabel);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  const total = Math.max(1, spreads.length);

  return TOPIC_DEFINITIONS.map((item, index) => {
    const value = counts.get(item.key) ?? 0;

    return {
      label: getTopicLabel(item.key, t),
      value,
      percent: Math.round((value / total) * 100),
      color: TOPIC_COLORS[index % TOPIC_COLORS.length],
    };
  });
}

function buildFrequentCards(
  spreads: SavedSpread[],
  language: AppLanguage
): FrequentCardStat[] {
  const map = new Map<number, FrequentCardStat>();

  spreads.forEach((spread) => {
    spread.cards.forEach((card) => {
      const deckCard = TAROT_DECK.find((item) => item.id === card.id);
      const localizedCard = deckCard ? getLocalizedTarotCard(deckCard, language) : null;
      const current = map.get(card.id) ?? {
        id: card.id,
        name: localizedCard?.name ?? card.name,
        count: 0,
        reversedCount: 0,
        uprightCount: 0,
      };

      current.count += 1;

      if (card.isReversed) {
        current.reversedCount += 1;
      } else {
        current.uprightCount += 1;
      }

      map.set(card.id, current);
    });
  });

  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 3);
}

function buildCardOfMonth(spreads: SavedSpread[], language: AppLanguage) {
  const now = new Date();
  const monthAgo = new Date(now);
  monthAgo.setDate(now.getDate() - 30);

  const recentSpreads = spreads.filter((spread) => {
    const date = new Date(spread.createdAt);
    return !Number.isNaN(date.getTime()) && date >= monthAgo;
  });

  const frequentCards = buildFrequentCards(recentSpreads, language);
  const topCard = frequentCards[0];

  if (!topCard) {
    return null;
  }

  return {
    ...topCard,
    mostlyReversed: topCard.reversedCount > topCard.uprightCount,
  };
}

function buildSpreadTypes(spreads: SavedSpread[], t: (key: string) => string) {
  return SPREAD_TYPE_DEFINITIONS.map((item) => {
    const count = spreads.filter((spread) => {
      const typeValue = spread.type?.toLowerCase();
      const labelValue = spread.typeLabel?.toLowerCase();

      return typeValue === item.type || labelValue === item.label.toLowerCase();
    }).length;

    return {
      ...item,
      label: getSpreadTypeLabel(item.type, t),
      count,
    };
  });
}

function buildSuitStats(
  spreads: SavedSpread[],
  t: (key: string) => string
): SuitStat[] {
  const allCards = spreads.flatMap((spread) => spread.cards);
  const minorCards = allCards.filter((card) => getSuitByCardId(card.id) !== "major");
  const total = Math.max(1, minorCards.length);

  const suits = [
    {
      key: "cups",
      label: t("profile.suits.cups"),
      subtitle: t("profile.suits.cupsSub"),
      color: "#4BC6FF",
    },
    {
      key: "swords",
      label: t("profile.suits.swords"),
      subtitle: t("profile.suits.swordsSub"),
      color: "#B65CFF",
    },
    {
      key: "wands",
      label: t("profile.suits.wands"),
      subtitle: t("profile.suits.wandsSub"),
      color: "#E8C436",
    },
    {
      key: "pentacles",
      label: t("profile.suits.pentacles"),
      subtitle: t("profile.suits.pentaclesSub"),
      color: "#78D66D",
    },
  ];

  return suits.map((suit) => {
    const value = minorCards.filter((card) => getSuitByCardId(card.id) === suit.key)
      .length;

    return {
      ...suit,
      percent: Math.round((value / total) * 100),
    };
  });
}

function buildMoodStats(spreads: SavedSpread[]) {
  const counts = new Map<string, number>();

  spreads.forEach((spread) => {
    spread.tags.forEach((tag) => {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    });
  });

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
}

function buildActivityMatrix(spreads: SavedSpread[]): ActivityCell[][] {
  const countsByDate = new Map<string, number>();

  spreads.forEach((spread) => {
    const key = getDateKey(spread.createdAt);
    countsByDate.set(key, (countsByDate.get(key) ?? 0) + 1);
  });

  const today = new Date();
  const firstDay = startOfDay(new Date(today.getFullYear(), today.getMonth(), 1));
  const lastDay = startOfDay(new Date(today.getFullYear(), today.getMonth() + 1, 0));
  const cursor = new Date(firstDay);
  cursor.setDate(firstDay.getDate() - getMondayBasedDay(firstDay));

  const end = new Date(lastDay);
  end.setDate(lastDay.getDate() + (6 - getMondayBasedDay(lastDay)));

  const weeks: ActivityCell[][] = [];

  while (cursor <= end) {
    const week: ActivityCell[] = [];

    for (let day = 0; day < 7; day += 1) {
      const key = getDateKey(cursor.toISOString());
      const isCurrentMonth = cursor.getMonth() === today.getMonth();

      week.push({
        dateKey: key,
        count: countsByDate.get(key) ?? 0,
        day: isCurrentMonth ? cursor.getDate() : null,
        isCurrentMonth,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    weeks.push(week);
  }

  return weeks;
}

function buildMostActiveDayLabel(
  spreads: SavedSpread[],
  language: AppLanguage,
  t: (key: string) => string
) {
  if (spreads.length === 0) {
    return t("profile.noData");
  }

  const counts = Array.from({ length: 7 }, () => 0);

  spreads.forEach((spread) => {
    const date = new Date(spread.createdAt);
    if (Number.isNaN(date.getTime())) return;

    counts[getMondayBasedDay(date)] += 1;
  });

  const maxIndex = counts.indexOf(Math.max(...counts));
  const labels = getWeekdayLabels(language);

  return labels[maxIndex] ?? t("profile.noData");
}

function buildStreakDays(spreads: SavedSpread[]) {
  const activeDays = new Set(spreads.map((spread) => getDateKey(spread.createdAt)));

  let streak = 0;
  const cursor = startOfDay(new Date());

  while (activeDays.has(getDateKey(cursor.toISOString()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function buildThisWeekSpreads(spreads: SavedSpread[]) {
  const today = startOfDay(new Date());
  const monday = new Date(today);
  monday.setDate(today.getDate() - getMondayBasedDay(today));

  return spreads.filter((spread) => {
    const date = new Date(spread.createdAt);
    return !Number.isNaN(date.getTime()) && date >= monday;
  }).length;
}

function buildThisMonthSpreads(spreads: SavedSpread[]) {
  const today = new Date();
  const firstDay = startOfDay(new Date(today.getFullYear(), today.getMonth(), 1));
  const nextMonth = startOfDay(new Date(today.getFullYear(), today.getMonth() + 1, 1));

  return spreads.filter((spread) => {
    const date = new Date(spread.createdAt);
    return !Number.isNaN(date.getTime()) && date >= firstDay && date < nextMonth;
  }).length;
}

function buildIntuitionProgress(
  spreads: SavedSpread[],
  language: AppLanguage
): IntuitionProgress {
  const totalXp = spreads.reduce((sum, spread) => sum + getSpreadXp(spread), 0);
  let level = 0;
  let spentXp = 0;
  let nextLevelXp = FIRST_LEVEL_XP;

  while (
    level < MAX_INTUITION_LEVEL &&
    totalXp - spentXp >= nextLevelXp
  ) {
    spentXp += nextLevelXp;
    level += 1;
    nextLevelXp = Math.ceil(nextLevelXp * LEVEL_COST_MULTIPLIER);
  }

  const currentXp = Math.max(0, totalXp - spentXp);
  const progressPercent =
    level >= MAX_INTUITION_LEVEL
      ? 100
      : Math.min(100, Math.round((currentXp / nextLevelXp) * 100));

  return {
    level,
    title: getIntuitionTitle(level, language),
    totalXp,
    currentXp,
    nextLevelXp,
    progressPercent,
  };
}

function getSpreadXp(spread: SavedSpread) {
  const byType = SPREAD_TYPE_DEFINITIONS.find((item) => item.type === spread.type);

  if (byType) {
    return byType.xp;
  }

  const byCards = SPREAD_TYPE_DEFINITIONS.find(
    (item) => item.cards === spread.cards.length
  );

  return byCards?.xp ?? Math.max(1, Math.ceil(spread.cards.length / 2));
}

function getIntuitionTitle(level: number, language: AppLanguage) {
  const titles = language === "en" ? INTUITION_TITLES_EN : INTUITION_TITLES;
  const safeLevel = Math.max(0, Math.min(MAX_INTUITION_LEVEL, level));
  const step = MAX_INTUITION_LEVEL / titles.length;
  const index = Math.min(
    titles.length - 1,
    Math.floor(safeLevel / step)
  );

  return titles[index];
}

function normalizeTopicKey(value?: string) {
  const normalized = value?.toLowerCase() ?? "";

  if (normalized.includes("люб") || normalized === "love") return "love";
  if (normalized.includes("раб") || normalized === "work" || normalized === "career") {
    return "work";
  }
  if (
    normalized.includes("день") ||
    normalized.includes("фин") ||
    normalized === "money" ||
    normalized === "finance"
  ) {
    return "money";
  }
  if (normalized.includes("лич") || normalized === "personal" || normalized === "self") {
    return "personal";
  }
  if (normalized.includes("да / нет") || normalized.includes("да/нет") || normalized === "yes-no") {
    return "yes-no";
  }
  if (normalized.includes("совет") || normalized === "daily-advice") {
    return "daily-advice";
  }
  if (normalized.includes("совмест") || normalized === "compatibility") {
    return "compatibility";
  }

  return "personal";
}

function getTopicLabel(key: string, t: (key: string) => string) {
  if (key === "love") return t("spread.topics.love");
  if (key === "work") return t("spread.topics.work");
  if (key === "money") return t("spread.topics.money");
  if (key === "personal") return t("spread.topics.personal");
  if (key === "yes-no") return t("spread.topics.yesNo");
  if (key === "daily-advice") return t("spread.topics.dailyAdvice");
  if (key === "compatibility") return t("spread.topics.compatibility");
  return t("spread.topics.personal");
}

function getSpreadTypeLabel(type: string, t: (key: string) => string) {
  if (type === "quick") return t("spread.spreadTypes.quick");
  if (type === "clarity") return t("spread.spreadTypes.clarity");
  if (type === "deep") return t("spread.spreadTypes.deep");
  if (type === "full") return t("spread.spreadTypes.full");
  if (type === "celtic") return t("spread.spreadTypes.celtic");
  return t("spread.typeTitle");
}

function getWeekDays(language: AppLanguage) {
  return language === "en" ? WEEK_DAYS_EN : WEEK_DAYS;
}

function getWeekdayLabels(language: AppLanguage) {
  return language === "en"
    ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    : ["понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"];
}

function getSuitByCardId(id: number) {
  if (id <= 22) return "major";
  if (id >= 23 && id <= 36) return "wands";
  if (id >= 37 && id <= 50) return "cups";
  if (id >= 51 && id <= 64) return "swords";
  if (id >= 65 && id <= 78) return "pentacles";
  return "major";
}

function getDateKey(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function getMondayBasedDay(date: Date) {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

function getCardsWord(count: number, language: AppLanguage = "ru") {
  if (language === "en") {
    return count === 1 ? "card" : "cards";
  }

  if (count === 1) return "карта";
  if (count >= 2 && count <= 4) return "карты";
  return "карт";
}

function getSpreadsWord(count: number, language: AppLanguage = "ru") {
  if (language === "en") {
    return count === 1 ? "spread" : "spreads";
  }

  if (count === 1) return "расклад";
  if (count >= 2 && count <= 4) return "расклада";
  return "раскладов";
}

function getTimesWord(count: number, language: AppLanguage = "ru") {
  if (language === "en") {
    return count === 1 ? "time" : "times";
  }

  if (count === 1) return "раз";
  if (count >= 2 && count <= 4) return "раза";
  return "раз";
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.9)",
  },

  scrollContent: {
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 22 : 64,
    paddingHorizontal: SIDE_PADDING,
    paddingBottom: Platform.OS === "android" ? 104 : 122,
  },

  pageTitle: {
    color: "#F7F3FA",
    fontSize: 32,
    lineHeight: 35,
    fontWeight: "700",
    fontFamily: TITLE_FONT,
    letterSpacing: 0,
    marginBottom: 18,
  },

  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(255,255,255,0.045)",
    paddingHorizontal: 22,
    paddingVertical: 22,
    marginBottom: 18,
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 18,
  },

  avatar: {
    width: 78,
    height: 78,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarSymbol: {
    fontSize: 32,
  },

  userInfoBlock: {
    flex: 1,
    minWidth: 0,
  },

  userName: {
    color: "#FFFFFF",
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "900",
    marginBottom: 7,
  },

  zodiacRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  zodiacBadge: {
    width: 18,
    height: 18,
    borderRadius: 3,
    backgroundColor: "rgba(185, 156, 255, 0.38)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  zodiacBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  userMeta: {
    color: "#9F94AB",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },

  plusBadge: {
    alignSelf: "flex-start",
    minHeight: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "rgba(232, 196, 54, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(232, 196, 54, 0.42)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 9,
  },

  plusBadgeText: {
    color: "#F6CD3D",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  intuitionPanel: {
    marginBottom: 22,
  },

  rankBadge: {
    alignSelf: "stretch",
    minHeight: 30,
    paddingHorizontal: 13,
    borderRadius: 15,
    backgroundColor: "rgba(232, 196, 54, 0.17)",
    borderWidth: 1,
    borderColor: "rgba(232, 196, 54, 0.24)",
    justifyContent: "center",
    marginBottom: 10,
  },

  rankBadgeText: {
    color: "#E8C436",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },

  intuitionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  intuitionLabel: {
    color: "#BFAEFF",
    fontSize: 14,
    fontWeight: "700",
  },

  intuitionPercent: {
    color: "#D8CAFF",
    fontSize: 14,
    fontWeight: "900",
  },

  progressTrack: {
    height: 9,
    borderRadius: 8,
    backgroundColor: "rgba(85, 35, 130, 0.62)",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#E8C436",
  },

  intuitionHint: {
    color: "#BFAEFF",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    marginTop: 8,
    textAlign: "center",
  },

  balanceBlock: {
    alignItems: "center",
  },

  balanceText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  balanceSiteLink: {
    marginTop: 6,
    color: "#E8C436",
    fontSize: 14,
    fontWeight: "900",
    textTransform: "lowercase",
  },

  sectionCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(185, 156, 255, 0.10)",
    backgroundColor: "rgba(16, 7, 34, 0.38)",
    paddingHorizontal: 22,
    paddingVertical: 20,
    marginBottom: 18,
  },

  plusLockedArea: {
    position: "relative",
  },

  plusLockedHiddenContent: {
    opacity: 0,
  },

  plusLockedBase: {
    zIndex: 1,
    borderRadius: 22,
    backgroundColor: "rgba(10, 4, 23, 0.92)",
  },

  plusLockedStripeOne: {
    zIndex: 2,
    borderRadius: 22,
    backgroundColor: "rgba(106, 0, 168, 0.46)",
    transform: [{ rotate: "-8deg" }, { scaleX: 1.25 }],
  },

  plusLockedStripeTwo: {
    zIndex: 3,
    borderRadius: 22,
    backgroundColor: "rgba(232, 196, 54, 0.12)",
    transform: [{ rotate: "7deg" }, { scaleX: 1.18 }],
  },

  plusLockedNoise: {
    zIndex: 4,
    borderRadius: 22,
    backgroundColor: "rgba(18, 8, 39, 0.58)",
  },

  plusLockedNotice: {
    position: "absolute",
    top: 18,
    left: 18,
    right: 18,
    zIndex: 5,
    minHeight: 86,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(232, 196, 54, 0.32)",
    backgroundColor: "rgba(18, 8, 39, 0.90)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
  },

  plusLockedNoticeTitle: {
    color: "#F6CD3D",
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 5,
  },

  plusLockedNoticeText: {
    color: "#D8CAFF",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
    textAlign: "center",
  },

  cardTitle: {
    color: "#A69BAF",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "900",
    fontFamily: TITLE_FONT,
    textTransform: "uppercase",
    letterSpacing: 0,
    marginBottom: 16,
  },

  mainStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
  },

  statTile: {
    width: "48%",
    minHeight: 92,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.045)",
    alignItems: "center",
    justifyContent: "center",
  },

  statValue: {
    color: "#DFFF71",
    fontSize: 29,
    lineHeight: 35,
    fontWeight: "900",
    fontFamily: TITLE_FONT,
    marginBottom: 4,
  },

  statLabel: {
    color: "#BFAEFF",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    textAlign: "center",
  },

  energyBlock: {
    marginBottom: 14,
  },

  energyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  energyLabel: {
    color: "#BFAEFF",
    fontSize: 15,
    fontWeight: "700",
  },

  energyPercent: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  energyTrack: {
    height: 9,
    borderRadius: 8,
    backgroundColor: "rgba(85, 35, 130, 0.62)",
    overflow: "hidden",
  },

  energyFill: {
    height: "100%",
    borderRadius: 8,
  },

  captionText: {
    color: "#BFAEFF",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
    marginTop: 1,
  },

  languageRow: {
    flexDirection: "row",
    gap: 9,
    marginTop: 14,
  },

  languageOption: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(185, 156, 255, 0.18)",
    backgroundColor: "rgba(87, 37, 135, 0.30)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  languageOptionActive: {
    borderColor: "rgba(232, 196, 54, 0.70)",
    backgroundColor: "rgba(232, 196, 54, 0.16)",
  },

  languageOptionText: {
    color: "#BFAEFF",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "900",
    textAlign: "center",
  },

  languageOptionTextActive: {
    color: "#F6CD3D",
  },

  topicBlock: {
    marginBottom: 13,
  },

  topicHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  topicLabel: {
    color: "#BFAEFF",
    fontSize: 15,
    fontWeight: "700",
  },

  topicPercent: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  topicTrack: {
    height: 9,
    borderRadius: 8,
    backgroundColor: "rgba(85, 35, 130, 0.62)",
    overflow: "hidden",
  },

  topicFill: {
    height: "100%",
    borderRadius: 8,
  },

  openCardsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 11,
  },

  openCardsNumber: {
    color: "#E8C436",
    fontSize: 34,
    lineHeight: 39,
    fontWeight: "900",
    fontFamily: TITLE_FONT,
  },

  openCardsTotal: {
    color: "#BFAEFF",
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "900",
  },

  openCardsProgressFill: {
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#E8C436",
  },

  frequentCardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  frequentCardPreview: {
    width: 50,
    height: 80,
    borderRadius: 8,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  frequentCardSymbol: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
  },

  frequentCardTextBlock: {
    flex: 1,
  },

  frequentCardName: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
    marginBottom: 3,
  },

  frequentCardMeta: {
    color: "#BFAEFF",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
  },

  frequentCardRank: {
    color: "rgba(232, 196, 54, 0.66)",
    fontSize: 21,
    fontWeight: "900",
  },

  monthCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(232, 196, 54, 0.20)",
    paddingHorizontal: 22,
    paddingVertical: 20,
    marginBottom: 18,
  },

  monthCardRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  monthCardPreview: {
    width: 60,
    height: 96,
    borderRadius: 8,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },

  monthCardSymbol: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
  },

  monthTextBlock: {
    flex: 1,
  },

  monthCardName: {
    color: "#E8C436",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
    marginBottom: 4,
  },

  monthCardText: {
    color: "#BFAEFF",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },

  spreadTypesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
  },

  spreadTypeTile: {
    width: "48%",
    minHeight: 108,
    borderRadius: 24,
    backgroundColor: "rgba(87, 37, 135, 0.36)",
    paddingHorizontal: 15,
    paddingVertical: 14,
  },

  spreadTypeTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
  },

  spreadTypeBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(232, 196, 54, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  spreadTypeBadgeText: {
    color: "#E8C436",
    fontSize: 13,
    fontWeight: "900",
  },

  spreadTypeCardsText: {
    color: "#BFAEFF",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "800",
  },

  spreadTypeLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    marginBottom: 8,
  },

  spreadTypeCount: {
    color: "#E8C436",
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
  },

  suitDonutBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },

  donutWrapper: {
    width: 132,
    height: 132,
    alignItems: "center",
    justifyContent: "center",
  },

  donutCenter: {
    position: "absolute",
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(16, 7, 34, 0.62)",
    alignItems: "center",
    justifyContent: "center",
  },

  donutCenterNumber: {
    color: "#E8C436",
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "900",
    fontFamily: TITLE_FONT,
  },

  donutCenterText: {
    color: "#BFAEFF",
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "800",
  },

  suitLegend: {
    flex: 1,
    gap: 8,
  },

  suitLegendRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  suitLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },

  suitLegendText: {
    flex: 1,
    color: "#BFAEFF",
    fontSize: 14,
    fontWeight: "800",
  },

  suitLegendPercent: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  moodWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  moodChip: {
    minHeight: 34,
    paddingHorizontal: 13,
    borderRadius: 17,
    backgroundColor: "rgba(87, 37, 135, 0.42)",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  moodNumber: {
    color: "#E8C436",
    fontSize: 15,
    fontWeight: "900",
  },

  moodLabel: {
    color: "#BFAEFF",
    fontSize: 13,
    fontWeight: "800",
  },

  monthActivityHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },

  monthActivityDay: {
    flex: 1,
    color: "#BFAEFF",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
    textAlign: "center",
  },

  monthActivityGrid: {
    gap: 7,
    marginBottom: 15,
  },

  monthActivityRow: {
    flexDirection: "row",
  },

  monthActivityCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: "rgba(87, 37, 135, 0.50)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
  },

  monthActivityCellMuted: {
    opacity: 0.28,
  },

  monthActivityCellActive: {
    backgroundColor: "rgba(232, 196, 54, 0.46)",
    borderColor: "rgba(232, 196, 54, 0.25)",
  },

  monthActivityCellStrong: {
    backgroundColor: "rgba(232, 196, 54, 0.72)",
    borderColor: "rgba(232, 196, 54, 0.40)",
  },

  monthActivityCellText: {
    color: "#BFAEFF",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
  },

  monthActivityCellTextMuted: {
    color: "transparent",
  },

  monthActivityCellTextActive: {
    color: "#FFFFFF",
  },

  activityCaption: {
    color: "#BFAEFF",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },

  activityCaptionAccent: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  streakCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(232, 196, 54, 0.22)",
    paddingHorizontal: 22,
    paddingVertical: 19,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
  },

  fireCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(232, 196, 54, 0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },

  fireEmoji: {
    fontSize: 28,
  },

  streakTextBlock: {
    flex: 1,
  },

  streakTitle: {
    color: "#E8C436",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
    marginBottom: 4,
  },

  streakText: {
    color: "#BFAEFF",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },

  lastSpreadBox: {
    borderRadius: 24,
    backgroundColor: "rgba(87, 37, 135, 0.28)",
    paddingHorizontal: 17,
    paddingVertical: 17,
    marginBottom: 14,
  },

  lastSpreadMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 11,
  },

  lastSpreadPill: {
    minHeight: 26,
    paddingHorizontal: 11,
    borderRadius: 13,
    backgroundColor: "rgba(232, 196, 54, 0.17)",
    justifyContent: "center",
  },

  lastSpreadPillText: {
    color: "#E8C436",
    fontSize: 13,
    fontWeight: "900",
  },

  lastSpreadPillMuted: {
    minHeight: 26,
    paddingHorizontal: 11,
    borderRadius: 13,
    backgroundColor: "rgba(149, 63, 196, 0.30)",
    justifyContent: "center",
  },

  lastSpreadPillMutedText: {
    color: "#D8CAFF",
    fontSize: 13,
    fontWeight: "800",
  },

  lastSpreadQuestion: {
    color: "#FFFFFF",
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "900",
    marginBottom: 8,
  },

  lastSpreadAnswer: {
    color: "#BFAEFF",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },

  openHistoryButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(87, 37, 135, 0.46)",
    borderWidth: 1,
    borderColor: "rgba(185, 156, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  openHistoryButtonText: {
    color: "#BFAEFF",
    fontSize: 15,
    fontWeight: "900",
  },

  menuCard: {
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 18,
  },

  menuRow: {
    minHeight: 64,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(185, 156, 255, 0.08)",
  },

  menuIcon: {
    width: 32,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  menuIconAccent: {
    color: "#E8C436",
  },

  menuText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  menuTextAccent: {
    color: "#E8C436",
  },

  dangerCard: {
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  dangerTitle: {
    color: "#C54C66",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 2,
    paddingHorizontal: 22,
    paddingTop: 13,
    paddingBottom: 7,
  },

  deleteRow: {
    minHeight: 64,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
  },

  deleteIcon: {
    width: 32,
    color: "#FF6B7A",
    fontSize: 18,
    fontWeight: "900",
  },

  logoutText: {
    flex: 1,
    color: "white",
    fontSize: 16,
    fontWeight: "900",
  },

  deleteText: {
    flex: 1,
    color: "#FF6B7A",
    fontSize: 16,
    fontWeight: "900",
  },

  emptySmallText: {
    color: "#BFAEFF",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
  },
});
