# Taro mobile app

The Expo/React Native client for the Taro platform. It implements authentication, onboarding, tarot spreads, saved reading history, profile management, localization, and billing handoff.

## Run

```bash
cp .env.example .env
npm ci
npm start
```

Set `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_BILLING_PORTAL_URL` to addresses reachable from your simulator or physical device.

The complete architecture and backend setup are documented in the [repository README](../README.md).
