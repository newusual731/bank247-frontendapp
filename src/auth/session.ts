import { env } from "../config/env";
import { buildDemoTokens, isDemoMode } from "../demo/demoAuth";

const STORAGE_KEY = "bank247.auth.v1";

export type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  tokenType: string;
};

export type JwtClaims = {
  sub?: string;
  preferred_username?: string;
  email?: string;
  name?: string;
  bank_id?: string;
  bank247_permissions?: string[] | string;
  bank247_roles?: string[] | string;
  exp?: number;
};

const SKEW_MS = 15_000;

/** Single in-flight refresh so parallel API calls share one token request. */
let refreshInFlight: Promise<string | null> | null = null;

function decodeJwt(token: string): JwtClaims {
  const payload = token.split(".")[1];
  if (!payload) return {};
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  try {
    return JSON.parse(atob(padded)) as JwtClaims;
  } catch {
    return {};
  }
}

function asStringList(value: string[] | string | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return value.split(/[\s,]+/).filter(Boolean);
}

function tokensFromTokenResponse(data: {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type?: string;
}, previousRefresh?: string): AuthTokens {
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || previousRefresh,
    expiresAt: Date.now() + data.expires_in * 1000,
    tokenType: data.token_type || "Bearer",
  };
}

export function loadTokens(): AuthTokens | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthTokens;
  } catch {
    return null;
  }
}

export function saveTokens(tokens: AuthTokens): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

export function clearTokens(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

function accessStillFresh(tokens: AuthTokens): boolean {
  return Date.now() < tokens.expiresAt - SKEW_MS;
}

/** Sync peek — does not clear session when expired (refresh may still work). */
export function getAccessToken(): string | null {
  const tokens = loadTokens();
  if (!tokens) return null;
  if (!accessStillFresh(tokens)) return null;
  return tokens.accessToken;
}

export function hasStoredSession(): boolean {
  const tokens = loadTokens();
  if (!tokens?.accessToken) return false;
  if (accessStillFresh(tokens)) return true;
  return Boolean(tokens.refreshToken);
}

export function notifyAuthLost(): void {
  window.dispatchEvent(new Event("bank247-auth-lost"));
}

async function requestToken(
  tokenUrl: string,
  body: URLSearchParams,
): Promise<AuthTokens> {
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    let detail = "Token request failed";
    try {
      const err = (await response.json()) as { error_description?: string; error?: string };
      detail = err.error_description || err.error || detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type?: string;
  };

  return tokensFromTokenResponse(data);
}

export async function refreshAccessToken(
  tokenUrl: string,
  clientId: string,
  refreshToken: string,
): Promise<string> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    refresh_token: refreshToken,
  });
  const previous = loadTokens()?.refreshToken;
  const tokens = await requestToken(tokenUrl, body);
  if (!tokens.refreshToken && previous) {
    tokens.refreshToken = previous;
  }
  saveTokens(tokens);
  return tokens.accessToken;
}

/**
 * Returns a usable access token, refreshing via Keycloak when expired.
 * Concurrent callers share one refresh request.
 */
export async function ensureAccessToken(
  tokenUrl: string,
  clientId: string,
  options: { forceRefresh?: boolean } = {},
): Promise<string | null> {
  const tokens = loadTokens();
  if (!tokens?.accessToken) return null;

  // Demo sessions never call Keycloak — keep the unsigned JWT as-is.
  if (isDemoMode() || env.demoMode) {
    return tokens.accessToken;
  }

  if (!options.forceRefresh && accessStillFresh(tokens)) {
    return tokens.accessToken;
  }

  if (!tokens.refreshToken) {
    clearTokens();
    notifyAuthLost();
    return null;
  }

  if (!refreshInFlight) {
    const refreshToken = tokens.refreshToken;
    refreshInFlight = refreshAccessToken(tokenUrl, clientId, refreshToken)
      .then((access) => access)
      .catch(() => {
        clearTokens();
        notifyAuthLost();
        return null;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
}

export function parseSession(accessToken: string) {
  const claims = decodeJwt(accessToken);
  return {
    claims,
    username: claims.preferred_username || claims.email || claims.sub || "user",
    displayName: claims.name || claims.preferred_username || "User",
    bankId: (claims.bank_id || "").toUpperCase(),
    permissions: asStringList(claims.bank247_permissions),
    roles: asStringList(claims.bank247_roles),
  };
}

/** Build session user from stored tokens (including expired access + refresh). */
export function sessionFromStoredTokens(): {
  username: string;
  displayName: string;
  bankId: string;
  permissions: string[];
  roles: string[];
} | null {
  const tokens = loadTokens();
  if (!tokens?.accessToken) return null;
  if (!accessStillFresh(tokens) && !tokens.refreshToken) {
    clearTokens();
    return null;
  }
  const parsed = parseSession(tokens.accessToken);
  if (!parsed.bankId) return null;
  return {
    username: parsed.username,
    displayName: parsed.displayName,
    bankId: parsed.bankId,
    permissions: parsed.permissions,
    roles: parsed.roles,
  };
}

export async function loginWithPassword(
  tokenUrl: string,
  clientId: string,
  username: string,
  password: string,
): Promise<AuthTokens> {
  if (isDemoMode() || env.demoMode) {
    void password;
    const tokens = buildDemoTokens(username);
    saveTokens(tokens);
    return tokens;
  }

  const body = new URLSearchParams({
    grant_type: "password",
    client_id: clientId,
    username,
    password,
  });
  const tokens = await requestToken(tokenUrl, body);
  saveTokens(tokens);
  return tokens;
}

export function logout(): void {
  clearTokens();
}
