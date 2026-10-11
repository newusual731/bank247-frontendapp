import { env } from "../config/env";
import type { AuthTokens } from "../auth/session";

const DEMO_BANK_ID = "BANK001";

function b64url(json: object): string {
  const raw = btoa(JSON.stringify(json));
  return raw.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/** Unsigned JWT the existing parseSession() can decode. */
export function buildDemoAccessToken(username: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url({ alg: "none", typ: "JWT" });
  const payload = b64url({
    sub: "demo-user",
    preferred_username: username || "demo",
    email: `${(username || "demo").replace(/\s+/g, ".")}@demo.bank247.com`,
    name: "Demo User",
    bank_id: DEMO_BANK_ID,
    // Empty → AuthContext hasPermission treats as allow-all
    bank247_permissions: [],
    bank247_roles: ["DEMO_ADMIN", "BRANCH_MANAGER"],
    exp: now + 60 * 60 * 24 * 14,
    iat: now,
  });
  return `${header}.${payload}.demo`;
}

/** Build demo tokens (caller persists via saveTokens). */
export function buildDemoTokens(username: string): AuthTokens {
  return {
    accessToken: buildDemoAccessToken(username.trim() || "demo"),
    refreshToken: "demo-refresh",
    expiresAt: Date.now() + 60 * 60 * 24 * 14 * 1000,
    tokenType: "Bearer",
  };
}

export function isDemoMode(): boolean {
  return env.demoMode;
}

export { DEMO_BANK_ID };
