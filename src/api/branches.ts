import { apiRequest } from "./client";
import { toQuery, type PageResponse } from "./types";

export type Branch = {
  id: string;
  branchCode: string;
  name: string;
  address?: string;
  shortName?: string;
  regionCode?: string;
  countryCode?: string;
  currencyCode?: string;
  contactPhone?: string;
  contactEmail?: string;
  status: string;
  glMappings?: Record<string, string>;
  publishedAt?: string;
};

export type Region = {
  id: string;
  code: string;
  name: string;
  zoneCode?: string;
  countryCode?: string;
  status: string;
};

export type TillPosition = {
  tillId: string;
  tellerId: string;
  branchCode: string;
  currency: string;
  status: string;
  ledgerAccountNumber?: string;
  balance?: number | string;
};

export type VaultPosition = {
  vaultId: string;
  branchCode: string;
  currency: string;
  status: string;
  ledgerAccountNumber?: string;
  balance?: number | string;
};

export type CashPosition = {
  branchCode: string;
  tills: TillPosition[];
  vaults: VaultPosition[];
};

export function listBranches(params: { regionCode?: string; status?: string; page?: number; size?: number } = {}) {
  return apiRequest<PageResponse<Branch>>(
    `/api/v1/branches${toQuery({ page: 0, size: 50, ...params })}`,
  );
}

export function createBranch(body: {
  branchCode: string;
  name: string;
  address: string;
  regionCode: string;
  countryCode: string;
  currencyCode: string;
  shortName?: string;
  contactPhone?: string;
  contactEmail?: string;
}) {
  return apiRequest<Branch>("/api/v1/branches", { method: "POST", body });
}

export function getBranchByCode(code: string) {
  return apiRequest<Branch>(`/api/v1/branches/by-code/${encodeURIComponent(code)}`);
}

export function updateBranch(
  id: string,
  body: {
    name: string;
    address: string;
    regionCode: string;
    shortName?: string;
    contactPhone?: string;
    contactEmail?: string;
    glMappings?: Record<string, string>;
  },
) {
  return apiRequest<Branch>(`/api/v1/branches/${encodeURIComponent(id)}`, {
    method: "PUT",
    body,
  });
}

export function amendBranch(
  id: string,
  body: {
    name: string;
    address: string;
    regionCode: string;
    shortName?: string;
    contactPhone?: string;
    contactEmail?: string;
    glMappings?: Record<string, string>;
  },
) {
  return apiRequest<Branch>(`/api/v1/branches/${encodeURIComponent(id)}/amend`, {
    method: "POST",
    body,
  });
}

export function listRegions() {
  return apiRequest<Region[]>("/api/v1/regions");
}

export function getCashPositions() {
  return apiRequest<CashPosition>("/api/v1/teller/positions");
}
