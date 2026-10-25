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
  AuthResponse,
  AuthResultResponse,
  AuthUser,
  completeOnboardingRequest,
  deleteAccountRequest,
  forgotPasswordRequest,
  getMeRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
  resendEmailCodeRequest,
  resetPasswordRequest,
  verifyEmailRequest,
  verifyPasswordResetCodeRequest,
} from "../api/authApi";
import { clearTokens, getRefreshToken, saveTokens } from "../api/tokenStorage";
import { clearSavedSpreads } from "../../storage/spreadHistory";

type AuthContextValue = {
  user: AuthUser | null;
  isBootstrapping: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<AuthResultResponse>;
  register: (email: string, password: string) => Promise<AuthResultResponse>;

  verifyEmail: (email: string, code: string) => Promise<void>;
  resendEmailCode: (email: string) => Promise<void>;

  forgotPassword: (email: string) => Promise<void>;
  verifyPasswordResetCode: (email: string, code: string) => Promise<string>;
  resetPassword: (resetToken: string, newPassword: string) => Promise<void>;

  completeOnboarding: (nickname: string, zodiacSign: string) => Promise<void>;

  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const applyAuthenticatedResponse = useCallback(
    async (response: AuthResponse) => {
      await saveTokens(response.accessToken, response.refreshToken);
      setUser(response.user);
    },
    []
  );

  const refreshUser = useCallback(async () => {
    const me = await getMeRequest();
    setUser(me);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);

      try {
        const response = await loginRequest(email.trim(), password);

        if (response.type === "authenticated") {
          await applyAuthenticatedResponse({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            user: response.user,
          });
        }

        return response;
      } finally {
        setIsLoading(false);
      }
    },
    [applyAuthenticatedResponse]
  );

  const register = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);

      try {
        const response = await registerRequest(email.trim(), password);

        if (response.type === "authenticated") {
          await applyAuthenticatedResponse({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            user: response.user,
          });
        }

        return response;
      } finally {
        setIsLoading(false);
      }
    },
    [applyAuthenticatedResponse]
  );

  const verifyEmail = useCallback(
    async (email: string, code: string) => {
      setIsLoading(true);

      try {
        const response = await verifyEmailRequest(email.trim(), code.trim());
        await applyAuthenticatedResponse(response);
      } finally {
        setIsLoading(false);
      }
    },
    [applyAuthenticatedResponse]
  );

  const resendEmailCode = useCallback(async (email: string) => {
    setIsLoading(true);

    try {
      await resendEmailCodeRequest(email.trim());
    } finally {
      setIsLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    setIsLoading(true);

    try {
      await forgotPasswordRequest(email.trim());
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyPasswordResetCode = useCallback(
    async (email: string, code: string) => {
      setIsLoading(true);

      try {
        const response = await verifyPasswordResetCodeRequest(
          email.trim(),
          code.trim()
        );

        return response.resetToken;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const resetPassword = useCallback(
    async (resetToken: string, newPassword: string) => {
      setIsLoading(true);

      try {
        await resetPasswordRequest(resetToken, newPassword);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const completeOnboarding = useCallback(
    async (nickname: string, zodiacSign: string) => {
      setIsLoading(true);

      try {
        const updatedUser = await completeOnboardingRequest(
          nickname.trim(),
          zodiacSign
        );

        setUser(updatedUser);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setIsLoading(true);

    try {
      try {
        await logoutRequest();
      } finally {
        await clearTokens();
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    setIsLoading(true);

    try {
      await deleteAccountRequest();
      await Promise.all([clearTokens(), clearSavedSpreads()]);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        const refreshToken = await getRefreshToken();

        if (!refreshToken) {
          return;
        }

        const me = await getMeRequest();

        if (isMounted) {
          setUser(me);
        }
      } catch {
        try {
          await clearTokens();
        } catch {
          // Token cleanup is best-effort during app bootstrap.
        }

        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      isBootstrapping,
      isLoading,
      isAuthenticated: user !== null,

      login,
      register,

      verifyEmail,
      resendEmailCode,

      forgotPassword,
      verifyPasswordResetCode,
      resetPassword,

      completeOnboarding,

      logout,
      deleteAccount,
      refreshUser,
    };
  }, [
    user,
    isBootstrapping,
    isLoading,
    login,
    register,
    verifyEmail,
    resendEmailCode,
    forgotPassword,
    verifyPasswordResetCode,
    resetPassword,
    completeOnboarding,
    logout,
    deleteAccount,
    refreshUser,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
