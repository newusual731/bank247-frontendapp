import { apiRequest } from "./client";

export type Account = {
  id: string;
  accountNumber: string;
  customerId: string;
  productCode: string;
  currency: string;
  branchCode: string;
  status: string;
  customerType?: string;
  createdAt?: string;
};

export type Lien = {
  id: string;
  accountNumber: string;
  amount: number | string;
  currency: string;
  reason?: string;
  status: string;
  createdAt?: string;
};

export type Restriction = {
  id: string;
  accountNumber: string;
  restrictionType: string;
  reason?: string;
  status: string;
  createdAt?: string;
};

export type Product = {
  id: string;
  code: string;
  name: string;
  accountType?: string;
  currency: string;
  status: string;
  createdAt?: string;
};

export type MandateSummary = {
  id: string;
  versionNo: number;
  mandateType: string;
  instruction?: string;
  signatories?: string;
  status: string;
};

export type AccountEnquiry = {
  account: Account;
  debitAllowed: boolean;
  creditAllowed: boolean;
  restrictions: Restriction[];
  liens: Lien[];
  mandates: MandateSummary[];
};

export type ChequeBook = {
  id: string;
  accountNumber: string;
  startNumber: string;
  endNumber: string;
  leaves: number;
  status: string;
  createdAt?: string;
};

export function getAccount(accountNumber: string) {
  return apiRequest<Account>(`/api/v1/accounts/${encodeURIComponent(accountNumber)}`);
}

export function getAccountEnquiry(accountNumber: string) {
  return apiRequest<AccountEnquiry>(
    `/api/v1/accounts/${encodeURIComponent(accountNumber)}/enquiry`,
  );
}

export function issueChequeBook(
  accountNumber: string,
  body: { startNumber: string; endNumber: string; leaves: number },
) {
  return apiRequest<ChequeBook>(
    `/api/v1/accounts/${encodeURIComponent(accountNumber)}/cheque-books`,
    { method: "POST", body },
  );
}

export function listLiens(accountNumber: string) {
  return apiRequest<Lien[]>(`/api/v1/accounts/${encodeURIComponent(accountNumber)}/liens`);
}

export function placeLien(
  accountNumber: string,
  body: { amount: number; reason: string; reference: string },
) {
  return apiRequest<Lien>(`/api/v1/accounts/${encodeURIComponent(accountNumber)}/liens`, {
    method: "POST",
    body,
  });
}

export function applyLien(lienId: string) {
  return apiRequest<Lien>(`/api/v1/accounts/liens/${encodeURIComponent(lienId)}/apply`, {
    method: "POST",
  });
}

export function releaseLien(lienId: string) {
  return apiRequest<Lien>(`/api/v1/accounts/liens/${encodeURIComponent(lienId)}/release`, {
    method: "POST",
  });
}

export function applyReleaseLien(lienId: string) {
  return apiRequest<Lien>(`/api/v1/accounts/liens/${encodeURIComponent(lienId)}/apply-release`, {
    method: "POST",
  });
}

export function listRestrictions(accountNumber: string) {
  return apiRequest<Restriction[]>(
    `/api/v1/accounts/${encodeURIComponent(accountNumber)}/restrictions`,
  );
}

export function createRestriction(
  accountNumber: string,
  body: { restrictionType: string; reason: string },
) {
  return apiRequest<Restriction>(
    `/api/v1/accounts/${encodeURIComponent(accountNumber)}/restrictions`,
    { method: "POST", body },
  );
}

export function releaseRestriction(restrictionId: string) {
  return apiRequest<Restriction>(
    `/api/v1/accounts/restrictions/${encodeURIComponent(restrictionId)}/release`,
    { method: "POST" },
  );
}

export function listCasaProducts(params: { status?: string; page?: number; size?: number } = {}) {
  const q = new URLSearchParams();
  if (params.status) q.set("status", params.status);
  q.set("page", String(params.page ?? 0));
  q.set("size", String(params.size ?? 20));
  return apiRequest<{ content: Product[]; totalElements: number }>(`/api/v1/products/casa?${q}`);
}

export function listLoanProducts(params: { page?: number; size?: number } = {}) {
  const q = new URLSearchParams();
  q.set("page", String(params.page ?? 0));
  q.set("size", String(params.size ?? 20));
  return apiRequest<{ content: Product[]; totalElements: number }>(`/api/v1/products/loans?${q}`);
}

export function listInvestmentProducts(params: { page?: number; size?: number } = {}) {
  const q = new URLSearchParams();
  q.set("page", String(params.page ?? 0));
  q.set("size", String(params.size ?? 20));
  return apiRequest<{ content: Product[]; totalElements: number }>(
    `/api/v1/products/investments?${q}`,
  );
}

export function openAccount(body: {
  customerId: string;
  productCode: string;
  currency: string;
  branchCode: string;
  accountNumber?: string;
}) {
  return apiRequest<Account>("/api/v1/accounts", { method: "POST", body });
}

export function applyOpenAccount(accountNumber: string) {
  return apiRequest<Account>(`/api/v1/accounts/${encodeURIComponent(accountNumber)}/apply-open`, {
    method: "POST",
  });
}

export function retryAccountActivation(accountNumber: string) {
  return apiRequest<Account>(
    `/api/v1/accounts/${encodeURIComponent(accountNumber)}/activation/retry`,
    { method: "POST" },
  );
}

export function reactivateAccount(accountNumber: string) {
  return apiRequest<Account>(`/api/v1/accounts/${encodeURIComponent(accountNumber)}/reactivate`, {
    method: "POST",
  });
}

export function closeAccount(accountNumber: string, body: { reason: string }) {
  return apiRequest<Account>(`/api/v1/accounts/${encodeURIComponent(accountNumber)}/close`, {
    method: "POST",
    body,
  });
}

export function applyCloseAccount(accountNumber: string) {
  return apiRequest<Account>(`/api/v1/accounts/${encodeURIComponent(accountNumber)}/apply-close`, {
    method: "POST",
  });
}

export function createCasaProduct(body: {
  code: string;
  name: string;
  accountType: string;
  currency: string;
  minimumBalance: number;
  annualInterestRate?: number;
  interestExpenseLedgerAccount?: string;
  chargeIncomeLedgerAccount?: string;
}) {
  return apiRequest<Product>("/api/v1/products/casa", { method: "POST", body });
}
