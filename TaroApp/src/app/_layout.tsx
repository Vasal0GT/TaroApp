import { router, Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import { AuthProvider, useAuth } from "../shared/auth/AuthContext";
import { AppErrorBoundary } from "../shared/errors/AppErrorBoundary";
import { LanguageProvider, useI18n } from "../shared/i18n/LanguageContext";

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <RootLayoutContent />
        </AuthProvider>
      </LanguageProvider>
    </AppErrorBoundary>
  );
}

function RootLayoutContent() {
  const segments = useSegments() as string[];
  const { isBootstrapping, isAuthenticated, user } = useAuth();
  const { isLanguageReady } = useI18n();

  const firstSegment = segments[0];
  const secondSegment = segments[1];

  const isAuthRoute = firstSegment === "auth";

  const isOnboardingRoute =
    firstSegment === "auth" &&
    (secondSegment === "onboarding-nickname" ||
      secondSegment === "onboarding-zodiac");

  useEffect(() => {
    async function setupNavigationBar() {
      if (Platform.OS !== "android") {
        return;
      }

      try {
        await NavigationBar.setBackgroundColorAsync("#0B0718");
        await NavigationBar.setButtonStyleAsync("light");
      } catch {
        // Navigation bar styling should never block the app from opening.
      }
    }

    void setupNavigationBar();
  }, []);

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }

    if (!isAuthenticated && !isAuthRoute) {
      router.replace("/auth/login");
      return;
    }

    if (
      isAuthenticated &&
      user &&
      !user.isOnboardingCompleted &&
      !isOnboardingRoute
    ) {
      router.replace("/auth/onboarding-nickname");
      return;
    }

    if (
      isAuthenticated &&
      user?.isOnboardingCompleted &&
      isAuthRoute
    ) {
      router.replace("/(tabs)");
    }
  }, [
    isBootstrapping,
    isAuthenticated,
    user,
    isAuthRoute,
    isOnboardingRoute,
  ]);

  if (isBootstrapping || !isLanguageReady) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />

        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#E8C436" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: "#0B0718",
          },
          animation: "fade",
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0B0718",
  },

  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0B0718",
  },
});
