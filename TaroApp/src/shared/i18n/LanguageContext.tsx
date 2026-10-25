import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AppLanguage,
  LANGUAGE_STORAGE_KEY,
  TranslationParams,
  interpolate,
  translations,
} from "./translations";

type LanguagePreference = AppLanguage | "auto";

type LanguageContextValue = {
  language: AppLanguage;
  languagePreference: LanguagePreference;
  isLanguageReady: boolean;
  setLanguagePreference: (nextLanguage: LanguagePreference) => Promise<void>;
  t: (key: string, params?: TranslationParams) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

type LanguageProviderProps = {
  children: ReactNode;
};

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [deviceLanguage] = useState<AppLanguage>(() => getDeviceLanguage());
  const [languagePreference, setLanguagePreferenceState] =
    useState<LanguagePreference>("auto");
  const [isLanguageReady, setIsLanguageReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

        if (
          storedLanguage === "ru" ||
          storedLanguage === "en" ||
          storedLanguage === "auto"
        ) {
          if (isMounted) {
            setLanguagePreferenceState(storedLanguage);
          }
        }
      } finally {
        if (isMounted) {
          setIsLanguageReady(true);
        }
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const language =
    languagePreference === "auto" ? deviceLanguage : languagePreference;

  const setLanguagePreference = useCallback(
    async (nextLanguage: LanguagePreference) => {
      setLanguagePreferenceState(nextLanguage);
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    },
    []
  );

  const t = useCallback(
    (key: string, params?: TranslationParams) => {
      const value = readTranslation(language, key) ?? readTranslation("ru", key);

      if (typeof value === "string") {
        return interpolate(value, params);
      }

      return key;
    },
    [language]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      languagePreference,
      isLanguageReady,
      setLanguagePreference,
      t,
    }),
    [language, languagePreference, isLanguageReady, setLanguagePreference, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useI18n must be used inside LanguageProvider.");
  }

  return context;
}

function getDeviceLanguage(): AppLanguage {
  try {
    const locale =
      Intl.DateTimeFormat().resolvedOptions().locale ||
      Intl.NumberFormat().resolvedOptions().locale ||
      "";

    return locale.toLowerCase().startsWith("ru") ? "ru" : "en";
  } catch {
    return "en";
  }
}

function readTranslation(language: AppLanguage, key: string): unknown {
  return key.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    return (current as Record<string, unknown>)[part];
  }, translations[language]);
}
