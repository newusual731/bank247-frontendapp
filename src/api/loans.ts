import { apiRequest } from "./client";
import { toQuery, type PageResponse } from "./types";

export type Loan = {
  id: string;
  loanNumber: string;
  customerId: string;
  productCode: string;
  currency: string;
  branchCode?: string;
  principalAmount: number | string;
  outstandingPrincipal?: number | string;
  status: string;
  maturityDate?: string;
  applicationDate?: string;
};

export type Investment = {
  id: string;
  investmentNumber: string;
  customerId?: string;
  customerName?: string;
  productCode: string;
  investmentType?: string;
  currency: string;
  branchCode?: string;
  originalPrincipal?: number | string;
  currentPrincipal?: number | string;
  annualInterestRate?: number | string;
  status: string;
  maturityDate?: string;
  applicationDate?: string;
};

export function searchLoans(params: {
  loanNumber?: string;
  status?: string;
  productCode?: string;
  page?: number;
  size?: number;
} = {}) {
  return apiRequest<PageResponse<Loan>>(`/api/v1/loans${toQuery({ page: 0, size: 20, ...params })}`);
}

export function searchInvestments(params: {
  investmentNumber?: string;
  status?: string;
  productCode?: string;
  page?: number;
  size?: number;
} = {}) {
  return apiRequest<PageResponse<Investment>>(
    `/api/v1/investments${toQuery({ page: 0, size: 20, ...params })}`,
  );
}

export function createLoan(body: {
  applicationReference: string;
  customerId: string;
  productCode: string;
  disbursementAccount: string;
  amount: number;
  tenorMonths: number;
  applicationDate: string;
  purpose?: string;
}) {
  return apiRequest<Loan>("/api/v1/loans", { method: "POST", body });
}

export function createInvestment(body: {
  applicationReference: string;
  customerId: string;
  productCode: string;
  settlementAccount: string;
  amount: number;
  tenorDays: number;
  applicationDate: string;
  rolloverOption: string;
  annualInterestRate?: number;
}) {
  return apiRequest<Investment>("/api/v1/investments", { method: "POST", body });
}

export function bookInvestment(investmentNumber: string, valueDate: string) {
  return apiRequest<Investment>(
    `/api/v1/investments/${encodeURIComponent(investmentNumber)}/book`,
    { method: "POST", body: { valueDate } },
  );
}
