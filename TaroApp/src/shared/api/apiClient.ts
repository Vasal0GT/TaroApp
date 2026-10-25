import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "./tokenStorage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean;
};

export class ApiError extends Error {
  status: number;
  errors?: string[];

  constructor(message: string, status: number, errors?: string[]) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

function getApiUrl() {
  if (!API_URL) {
    throw new Error("EXPO_PUBLIC_API_URL is not configured.");
  }

  return API_URL;
}

async function parseResponseBody(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function normalizeErrors(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (value && typeof value === "object") {
    const messages = Object.values(value)
      .flatMap((item) => (Array.isArray(item) ? item : [item]))
      .filter((item): item is string => typeof item === "string");

    return messages.length > 0 ? messages : undefined;
  }

  return undefined;
}

function getResponseError(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback;

  const body = data as { error?: unknown; message?: unknown; errors?: unknown };
  const errors = normalizeErrors(body.errors);

  if (errors?.[0]) return errors[0];
  if (typeof body.error === "string" && body.error.trim()) return body.error;
  if (typeof body.message === "string" && body.message.trim()) return body.message;

  return fallback;
}

let refreshPromise: Promise<string> | null = null;

async function performTokenRefresh() {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    await clearTokens();
    throw new ApiError("Session expired. Please log in again.", 401);
  }

  const response = await fetch(`${getApiUrl()}/api/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await parseResponseBody(response);

  if (!response.ok) {
    await clearTokens();

    throw new ApiError(
      getResponseError(data, "Refresh failed."),
      response.status,
      normalizeErrors(data?.errors)
    );
  }

  if (!data?.accessToken || !data?.refreshToken) {
    await clearTokens();
    throw new ApiError("Refresh response is incomplete.", 401);
  }

  await saveTokens(data.accessToken, data.refreshToken);

  return data.accessToken as string;
}

async function refreshTokens() {
  if (!refreshPromise) {
    refreshPromise = performTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.auth) {
    const accessToken = await getAccessToken();

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  let response = await fetch(`${getApiUrl()}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401 && options.auth) {
    const newAccessToken = await refreshTokens();

    response = await fetch(`${getApiUrl()}${path}`, {
      method: options.method ?? "GET",
      headers: {
        ...headers,
        Authorization: `Bearer ${newAccessToken}`,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  }

  const data = await parseResponseBody(response);

  if (!response.ok) {
    if (response.status === 401 && options.auth) {
      await clearTokens();
    }

    throw new ApiError(
      getResponseError(data, "Request failed."),
      response.status,
      normalizeErrors(data?.errors)
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return data as T;
}
