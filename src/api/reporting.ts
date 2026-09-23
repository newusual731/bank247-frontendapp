import { apiRequest } from "./client";
import { toQuery, type PageResponse } from "./types";

export type TrialBalanceRow = {
  businessDate?: string;
  branchCode?: string;
  glCode: string;
  currency: string;
  openingBalance?: number | string;
  debitMovement?: number | string;
  creditMovement?: number | string;
  closingBalance?: number | string;
  accountCategory?: string;
};

export type TrialBalanceReport = {
  businessDate: string;
  branchCode?: string;
  rows: TrialBalanceRow[];
  totalDebits?: number | string;
  totalCredits?: number | string;
  movementBalanced?: boolean;
};

export type AuditEvent = {
  id: string;
  module?: string;
  action?: string;
  actorId?: string;
  branchCode?: string;
  resourceType?: string;
  resourceId?: string;
  occurredAt?: string;
};

export function getTrialBalance(businessDate: string, branchCode?: string) {
  return apiRequest<TrialBalanceReport>(
    `/api/v1/reports/financial/trial-balance${toQuery({ businessDate, branchCode })}`,
  );
}

export function searchAuditEvents(params: {
  module?: string;
  action?: string;
  actorId?: string;
  page?: number;
  size?: number;
} = {}) {
  return apiRequest<PageResponse<AuditEvent>>(
    `/api/v1/audit/events${toQuery({ page: 0, size: 50, ...params })}`,
  );
}
