import { apiRequest } from "./client";
import { toQuery, type PageResponse } from "./types";

export type AccountMemo = {
  id: string;
  accountNumber: string;
  branchCode: string;
  memoType: string;
  severity: string;
  text: string;
  status: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  createdAt?: string;
};

export function searchMemos(params: {
  branchCode?: string;
  type?: string;
  status?: string;
  page?: number;
  size?: number;
} = {}) {
  return apiRequest<PageResponse<AccountMemo>>(
    `/api/v1/account-memos${toQuery({ page: 0, size: 20, ...params })}`,
  );
}

export function listMemosForAccount(accountNumber: string) {
  return apiRequest<AccountMemo[]>(
    `/api/v1/accounts/${encodeURIComponent(accountNumber)}/memos`,
  );
}

export function createMemo(
  accountNumber: string,
  body: {
    memoType: string;
    text: string;
    severity: string;
    effectiveFrom?: string;
    effectiveTo?: string;
  },
) {
  return apiRequest<AccountMemo>(
    `/api/v1/accounts/${encodeURIComponent(accountNumber)}/memos`,
    { method: "POST", body },
  );
}

export function releaseMemo(id: string) {
  return apiRequest<AccountMemo>(`/api/v1/account-memos/${encodeURIComponent(id)}/release`, {
    method: "POST",
  });
}
