export type AppConfig = {
  /** Single public API origin (nginx gateway). */
  apiBaseUrl: string;
  tokenUrl: string;
  clientId: string;
  appBaseDomain: string;
  defaultTenantSlug: string;
};

const read = (key: string, fallback: string) =>
  (import.meta.env[key] as string | undefined)?.trim() || fallback;

const apiBaseUrl = read("VITE_API_BASE_URL", "http://localhost:8080");

export const env: AppConfig = {
  apiBaseUrl,
  tokenUrl: read(
    "VITE_KEYCLOAK_TOKEN_URL",
    `${apiBaseUrl}/realms/bank247/protocol/openid-connect/token`,
  ),
  clientId: read("VITE_OIDC_CLIENT_ID", "bank247-cli"),
  appBaseDomain: read("VITE_APP_BASE_DOMAIN", "bank247.com"),
  defaultTenantSlug: read("VITE_DEFAULT_TENANT_SLUG", "bank001"),
};
