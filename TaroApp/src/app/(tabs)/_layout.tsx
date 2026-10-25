import { Ionicons } from "@expo/vector-icons";
import { usePathname } from "expo-router";
import { ComponentProps, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import PagerView from "react-native-pager-view";

import HistoryScreen from "./history";
import HomeScreen from "./index";
import HoroscopeScreen from "./horoscope";
import ProfileScreen from "./profile";
import TarotScreen from "./tarot";
import { useI18n } from "../../shared/i18n/LanguageContext";

type IconName = ComponentProps<typeof Ionicons>["name"];

type TabConfig = {
  titleKey: string;
  href: string;
  icon: IconName;
  activeIcon: IconName;
  Component: () => React.JSX.Element;
};

const TAB_CONFIGS: TabConfig[] = [
  {
    titleKey: "tabs.home",
    href: "/(tabs)",
    icon: "sparkles-outline",
    activeIcon: "sparkles",
    Component: HomeScreen,
  },
  {
    titleKey: "tabs.tarot",
    href: "/(tabs)/tarot",
    icon: "star-outline",
    activeIcon: "star",
    Component: TarotScreen,
  },
  {
    titleKey: "tabs.horoscope",
    href: "/(tabs)/horoscope",
    icon: "sunny-outline",
    activeIcon: "sunny",
    Component: HoroscopeScreen,
  },
  {
    titleKey: "tabs.history",
    href: "/(tabs)/history",
    icon: "eye-outline",
    activeIcon: "eye",
    Component: HistoryScreen,
  },
  {
    titleKey: "tabs.profile",
    href: "/(tabs)/profile",
    icon: "people-outline",
    activeIcon: "people",
    Component: ProfileScreen,
  },
];

export default function TabsLayout() {
  const pathname = usePathname();
  const pagerRef = useRef<PagerView>(null);
  const lastPathnameRef = useRef(pathname);

  const initialIndex = useMemo(() => {
    return getCurrentTabIndex(pathname);
  }, []);

  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    if (lastPathnameRef.current === pathname) return;

    lastPathnameRef.current = pathname;

    const nextIndex = getCurrentTabIndex(pathname);

    setActiveIndex(nextIndex);
    pagerRef.current?.setPageWithoutAnimation(nextIndex);
  }, [pathname]);

  function handlePageSelected(index: number) {
    setActiveIndex(index);
  }

  function handleTabPress(index: number) {
    setActiveIndex(index);
    pagerRef.current?.setPage(index);
  }

  return (
    <View style={styles.screen}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={initialIndex}
        overdrag
        offscreenPageLimit={4}
        onPageSelected={(event) => {
          handlePageSelected(event.nativeEvent.position);
        }}
      >
        {TAB_CONFIGS.map((tab) => {
          const ScreenComponent = tab.Component;

          return (
            <View key={tab.href} collapsable={false} style={styles.page}>
              <ScreenComponent />
            </View>
          );
        })}
      </PagerView>

      <FloatingTabBar activeIndex={activeIndex} onTabPress={handleTabPress} />
    </View>
  );
}

function FloatingTabBar({
  activeIndex,
  onTabPress,
}: {
  activeIndex: number;
  onTabPress: (index: number) => void;
}) {
  const { t } = useI18n();

  return (
    <View pointerEvents="box-none" style={styles.tabBarWrapper}>
      <View style={styles.tabBar}>
        {TAB_CONFIGS.map((tab, index) => {
          const isFocused = activeIndex === index;

          return (
            <Pressable
              key={tab.href}
              onPress={() => onTabPress(index)}
              android_ripple={null}
              style={styles.tabItem}
            >
              {isFocused ? (
                <>
                  <View pointerEvents="none" style={styles.activeSoftBorderOuter} />
                  <View pointerEvents="none" style={styles.activeSoftBorderInner} />
                </>
              ) : null}

              <Ionicons
                name={isFocused ? tab.activeIcon : tab.icon}
                size={22}
                color={isFocused ? "#DFFF71" : "#82788D"}
              />

              <Text
                numberOfLines={1}
                style={[styles.tabLabel, isFocused && styles.tabLabelActive]}
              >
                {t(tab.titleKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function getCurrentTabIndex(pathname: string) {
  if (pathname === "/" || pathname === "/(tabs)") return 0;

  if (pathname.includes("/tarot")) return 1;
  if (pathname.includes("/horoscope")) return 2;
  if (pathname.includes("/history")) return 3;
  if (pathname.includes("/profile")) return 4;

  return 0;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  pager: {
    flex: 1,
  },

  page: {
    flex: 1,
  },

  tabBarWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: Platform.OS === "android" ? 14 : 22,
    alignItems: "center",
  },

  tabBar: {
    width: "92%",
    minHeight: 64,
    borderRadius: 20,
    backgroundColor: "rgba(12, 12, 20, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 6,

    shadowColor: "#000000",
    shadowOpacity: 0.36,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 16,
  },

  tabItem: {
    flex: 1,
    height: 54,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    position: "relative",
    overflow: "visible",
  },

  activeSoftBorderOuter: {
    position: "absolute",
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(223, 255, 113, 0.16)",
    backgroundColor: "rgba(223, 255, 113, 0.04)",
  },

  activeSoftBorderInner: {
    position: "absolute",
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(223, 255, 113, 0.08)",
    backgroundColor: "rgba(223, 255, 113, 0.025)",
  },

  tabLabel: {
    color: "#82788D",
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: "800",
  },

  tabLabelActive: {
    color: "#DFFF71",
  },
});
