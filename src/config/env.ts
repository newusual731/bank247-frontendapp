export type AppConfig = {
  /** Single public API origin (nginx gateway). */
  apiBaseUrl: string;
  tokenUrl: string;
  clientId: string;
  appBaseDomain: string;
  defaultTenantSlug: string;
  /**
   * TEMPORARY frontend-only demo: fake auth + stubbed APIs (no Keycloak/gateway).
   * Set VITE_DEMO_MODE=false to restore live backend wiring.
   */
  demoMode: boolean;
};

/** Missing → fallback. Explicit empty string is kept (same-origin Vite proxy). */
const read = (key: string, fallback: string) => {
  const raw = import.meta.env[key] as string | undefined;
  if (raw === undefined) return fallback;
  return raw.trim();
};

const apiBaseUrl = read("VITE_API_BASE_URL", "http://localhost:8080");

export const env: AppConfig = {
  apiBaseUrl,
  tokenUrl: read(
    "VITE_KEYCLOAK_TOKEN_URL",
    apiBaseUrl
      ? `${apiBaseUrl.replace(/\/$/, "")}/realms/bank247/protocol/openid-connect/token`
      : "/realms/bank247/protocol/openid-connect/token",
  ),
  clientId: read("VITE_OIDC_CLIENT_ID", "bank247-cli"),
  appBaseDomain: read("VITE_APP_BASE_DOMAIN", "bank247.com"),
  defaultTenantSlug: read("VITE_DEFAULT_TENANT_SLUG", "bank001"),
  // Default ON for team UI demo without backend; flip to false for production API.
  demoMode: read("VITE_DEMO_MODE", "true").toLowerCase() === "true",
};
