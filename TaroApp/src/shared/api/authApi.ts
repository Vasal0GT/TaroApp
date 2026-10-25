import { apiRequest } from "./apiClient";

export type AuthUser = {
  id: string;
  email: string;
  nickname: string | null;
  zodiacSign: string | null;
  subscriptionTier: "Free" | "Plus" | "Premium";
  subscriptionExpiresAt: string | null;
  stars: number;
  isEmailVerified: boolean;
  isOnboardingCompleted: boolean;
};

export function isPlusSubscriptionActive(user: AuthUser | null | undefined) {
  if (!user || (user.subscriptionTier !== "Plus" && user.subscriptionTier !== "Premium")) {
    return false;
  }

  if (!user.subscriptionExpiresAt) {
    return true;
  }

  const expiresAt = new Date(user.subscriptionExpiresAt).getTime();

  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type AuthResultResponse =
  | {
      type: "authenticated";
      accessToken: string;
      refreshToken: string;
      user: AuthUser;
      email: string | null;
    }
  | {
      type: "emailVerificationRequired";
      accessToken: null;
      refreshToken: null;
      user: null;
      email: string;
    };

export async function registerRequest(email: string, password: string) {
  return apiRequest<AuthResultResponse>("/api/auth/register", {
    method: "POST",
    body: {
      email,
      password,
    },
  });
}

export async function loginRequest(email: string, password: string) {
  return apiRequest<AuthResultResponse>("/api/auth/login", {
    method: "POST",
    body: {
      email,
      password,
    },
  });
}

export async function verifyEmailRequest(email: string, code: string) {
  return apiRequest<AuthResponse>("/api/auth/verify-email", {
    method: "POST",
    body: {
      email,
      code,
    },
  });
}

export async function resendEmailCodeRequest(email: string) {
  return apiRequest<{ success: boolean }>("/api/auth/resend-email-code", {
    method: "POST",
    body: {
      email,
    },
  });
}

export async function forgotPasswordRequest(email: string) {
  return apiRequest<{ success: boolean }>("/api/auth/forgot-password", {
    method: "POST",
    body: {
      email,
    },
  });
}

export async function verifyPasswordResetCodeRequest(
  email: string,
  code: string
) {
  return apiRequest<{ resetToken: string }>(
    "/api/auth/verify-password-reset-code",
    {
      method: "POST",
      body: {
        email,
        code,
      },
    }
  );
}

export async function resetPasswordRequest(
  resetToken: string,
  newPassword: string
) {
  return apiRequest<{ success: boolean }>("/api/auth/reset-password", {
    method: "POST",
    body: {
      resetToken,
      newPassword,
    },
  });
}

export async function completeOnboardingRequest(
  nickname: string,
  zodiacSign: string
) {
  return apiRequest<AuthUser>("/api/account/onboarding", {
    method: "PUT",
    auth: true,
    body: {
      nickname,
      zodiacSign,
    },
  });
}

export async function getMeRequest() {
  return apiRequest<AuthUser>("/api/account/me", {
    method: "GET",
    auth: true,
  });
}

export async function logoutRequest() {
  return apiRequest<void>("/api/auth/logout", {
    method: "POST",
    auth: true,
  });
}

export async function externalLoginRequest(
  provider: "apple" | "google",
  identityToken: string
) {
  return apiRequest<AuthResultResponse>("/api/auth/external", {
    method: "POST",
    body: {
      provider,
      identityToken,
    },
  });
}

export async function deleteAccountRequest() {
  return apiRequest<void>("/api/account", {
    method: "DELETE",
    auth: true,
  });
}
