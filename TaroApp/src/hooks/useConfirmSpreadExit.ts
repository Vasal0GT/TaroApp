import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { Alert, BackHandler } from "react-native";

export function useConfirmSpreadExit() {
  const confirmExit = useCallback(() => {
    Alert.alert(
      "Выйти из расклада?",
      "Звёзды уже списаны и не восстановятся.",
      [
        {
          text: "Остаться",
          style: "cancel",
        },
        {
          text: "Выйти",
          style: "destructive",
          onPress: () => {
            router.replace("/(tabs)");
          },
        },
      ]
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          confirmExit();
          return true;
        }
      );

      return () => {
        subscription.remove();
      };
    }, [confirmExit])
  );

  return confirmExit;
}