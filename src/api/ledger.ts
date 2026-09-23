import { apiRequest } from "./client";
import { toQuery, type PageResponse } from "./types";

export type GlAccount = {
  id: string;
  code: string;
  description: string;
  nature: string;
  status: string;
  parentCode?: string;
  accountLevel: number;
  postable: boolean;
  currency: string;
  balance?: number | string;
};

export type LedgerEntry = {
  id: string;
  transactionReference: string;
  direction: string;
  amount: number | string;
  currency: string;
  narration?: string;
  postedAt?: string;
};

export type LedgerTrialBalance = {
  lines: {
    nature: string;
    accountType: string;
    currency: string;
    debit: number | string;
    credit: number | string;
  }[];
  totals: { currency: string; debit: number | string; credit: number | string; balanced: boolean }[];
  balanced: boolean;
};

export function searchGlAccounts(params: { parentCode?: string; status?: string; page?: number; size?: number } = {}) {
  return apiRequest<PageResponse<GlAccount>>(
    `/api/v1/gl/accounts${toQuery({ page: 0, size: 50, ...params })}`,
  );
}

export function listLedgerEntries(accountNumber: string, page = 0, size = 20) {
  return apiRequest<PageResponse<LedgerEntry>>(
    `/api/v1/ledger/accounts/${encodeURIComponent(accountNumber)}/entries${toQuery({ page, size })}`,
  );
}

export function getLedgerTrialBalance(currency?: string) {
  return apiRequest<LedgerTrialBalance>(`/api/v1/ledger/trial-balance${toQuery({ currency })}`);
}

export function createGlAccount(body: {
  code: string;
  description: string;
  nature: string;
  parentCode?: string;
  postable?: boolean;
  currency?: string;
}) {
  return apiRequest<GlAccount>("/api/v1/gl/accounts", { method: "POST", body });
}

export function reverseLedgerPosting(reference: string, reason?: string) {
  return apiRequest<{ reference?: string; status?: string }>(
    `/api/v1/ledger/postings/${encodeURIComponent(reference)}/reverse`,
    { method: "POST", body: reason ? { reason } : undefined },
  );
}
