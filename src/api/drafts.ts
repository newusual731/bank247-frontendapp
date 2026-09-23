import { apiRequest } from "./client";
import { toQuery, type PageResponse } from "./types";

export type BankDraft = {
  id: string;
  draftNumber: string;
  sourceAccount: string;
  beneficiaryName: string;
  amount: number | string;
  currency: string;
  branchCode: string;
  narration?: string;
  status: string;
  flagReason?: string;
  cancelReason?: string;
  issuedAt?: string;
  settledAt?: string;
  createdAt?: string;
  liabilityGl?: string;
  settlementGl?: string;
  issueLedgerReference?: string;
  settleLedgerReference?: string;
  cancelLedgerReference?: string;
};

export function searchBankDrafts(params: {
  branchCode?: string;
  status?: string;
  page?: number;
  size?: number;
} = {}) {
  return apiRequest<PageResponse<BankDraft>>(
    `/api/v1/teller/drafts${toQuery({ page: 0, size: 20, ...params })}`,
  );
}

export function issueBankDraft(body: {
  sourceAccount: string;
  beneficiaryName: string;
  amount: number;
  currency: string;
  branchCode?: string;
  narration?: string;
}) {
  return apiRequest<BankDraft>("/api/v1/teller/drafts", { method: "POST", body });
}

export function settleBankDraft(draftNumber: string) {
  return apiRequest<BankDraft>(`/api/v1/teller/drafts/${encodeURIComponent(draftNumber)}/settle`, {
    method: "POST",
  });
}

export function cancelBankDraft(draftNumber: string, reason?: string) {
  return apiRequest<BankDraft>(`/api/v1/teller/drafts/${encodeURIComponent(draftNumber)}/cancel`, {
    method: "POST",
    body: { reason },
  });
}

export function flagBankDraft(draftNumber: string, reason?: string) {
  return apiRequest<BankDraft>(`/api/v1/teller/drafts/${encodeURIComponent(draftNumber)}/flag`, {
    method: "POST",
    body: { reason },
  });
}
