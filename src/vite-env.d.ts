/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_KEYCLOAK_TOKEN_URL: string;
  readonly VITE_OIDC_CLIENT_ID: string;
  readonly VITE_APP_BASE_DOMAIN: string;
  readonly VITE_DEFAULT_TENANT_SLUG: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
