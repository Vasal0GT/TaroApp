import { Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";

import { createBillingPortalLinkRequest } from "../api/billingApi";

const PUBLIC_BILLING_PORTAL_URL =
  process.env.EXPO_PUBLIC_BILLING_PORTAL_URL || "https://pay.taro-path-app.online";

export async function openBillingPortal() {
  try {
    const portalLink = await createBillingPortalLinkRequest();

    await WebBrowser.openBrowserAsync(portalLink.url);

    return true;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Не удалось открыть страницу оплаты.";

    Alert.alert("Ошибка", message);

    return false;
  }
}

export async function openPublicBillingPortal(path = "/") {
  try {
    const url = new URL(path, PUBLIC_BILLING_PORTAL_URL).toString();

    await WebBrowser.openBrowserAsync(url);

    return true;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Не удалось открыть сайт.";

    Alert.alert("Ошибка", message);

    return false;
  }
}
