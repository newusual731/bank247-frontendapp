import { env } from "../config/env";

/** Map bank_id / known codes to Cloud URL slugs (extend via platform API later). */
const SLUG_BY_BANK: Record<string, string> = {
  BANK001: "bank001",
  BANK002: "bank002",
  FBN: "fbn",
  FIRSTBANK: "fbn",
};

export type TenantContext = {
  slug: string;
  bankIdHint: string | null;
  isLocalhost: boolean;
  host: string;
};

export function resolveTenantFromHost(hostname = window.location.hostname): TenantContext {
  const host = hostname.toLowerCase();
  const isLocalhost = host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");

  if (isLocalhost) {
    return {
      slug: env.defaultTenantSlug,
      bankIdHint: null,
      isLocalhost: true,
      host,
    };
  }

  const base = env.appBaseDomain.toLowerCase();
  if (host === base || host === `login.${base}` || host === `www.${base}`) {
    return { slug: env.defaultTenantSlug, bankIdHint: null, isLocalhost: false, host };
  }

  if (host.endsWith(`.${base}`)) {
    const slug = host.slice(0, -(base.length + 1)).split(".")[0];
    return {
      slug,
      bankIdHint: slug.toUpperCase(),
      isLocalhost: false,
      host,
    };
  }

  return { slug: env.defaultTenantSlug, bankIdHint: null, isLocalhost: false, host };
}

export function slugForBankId(bankId: string): string {
  const key = bankId.toUpperCase();
  return SLUG_BY_BANK[key] || key.toLowerCase();
}

/**
 * After login on shared host, navigate to tenant subdomain in production.
 * On localhost, stay put (no DNS for *.bank247.com).
 */
export function tenantAppOrigin(bankId: string): string | null {
  const tenant = resolveTenantFromHost();
  if (tenant.isLocalhost) return null;
  // Stay on current host during frontend-only demo (e.g. Vercel).
  if (env.demoMode) return null;
  const slug = slugForBankId(bankId);
  const proto = window.location.protocol;
  return `${proto}//${slug}.${env.appBaseDomain}`;
}

export function assertBankMatchesHost(bankId: string, tenant: TenantContext): boolean {
  if (tenant.isLocalhost || !tenant.bankIdHint) return true;
  const slug = slugForBankId(bankId);
  return slug === tenant.slug || bankId.toUpperCase() === tenant.bankIdHint;
}
