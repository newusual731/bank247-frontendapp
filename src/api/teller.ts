import { apiRequest } from "./client";

export type TellerTransaction = {
  reference: string;
  type?: string;
  customerAccount?: string;
  amount?: number | string;
  currency?: string;
  status: string;
  narration?: string;
};

export type Till = {
  id: string;
  tellerId: string;
  branchCode: string;
  currency: string;
  ledgerAccountNumber?: string;
  status: string;
};

function idempotencyKey(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function depositCash(body: {
  customerAccount: string;
  amount: number;
  currency: string;
  narration?: string;
  chequeNumber?: string;
  ctrAcknowledged?: boolean;
}) {
  return apiRequest<TellerTransaction>("/api/v1/teller/transactions/deposits", {
    method: "POST",
    body: { ...body, idempotencyKey: idempotencyKey("DEP") },
  });
}

export function withdrawCash(body: {
  customerAccount: string;
  amount: number;
  currency: string;
  narration?: string;
  chequeNumber?: string;
  ctrAcknowledged?: boolean;
}) {
  return apiRequest<TellerTransaction>("/api/v1/teller/transactions/withdrawals", {
    method: "POST",
    body: { ...body, idempotencyKey: idempotencyKey("WDR") },
  });
}

export function requestCashReversal(reference: string) {
  return apiRequest<TellerTransaction>(
    `/api/v1/teller/transactions/${encodeURIComponent(reference)}/reversal-requests`,
    { method: "POST" },
  );
}

export function completeCashReversal(reference: string) {
  return apiRequest<TellerTransaction>(
    `/api/v1/teller/transactions/${encodeURIComponent(reference)}/complete-reversal`,
    { method: "POST" },
  );
}

export function getTellerTransaction(reference: string) {
  return apiRequest<TellerTransaction>(
    `/api/v1/teller/transactions/${encodeURIComponent(reference)}`,
  );
}

export function createTill(body: { tellerId: string; branchCode: string; currency: string }) {
  return apiRequest<Till>("/api/v1/teller/admin/tills", { method: "POST", body });
}

export async function listTills(): Promise<Till[]> {
  try {
    return await apiRequest<Till[]>("/api/v1/teller/admin/tills");
  } catch {
    return [];
  }
}

export type Vault = {
  id: string;
  branchCode: string;
  currency: string;
  status: string;
  ledgerAccountNumber?: string;
};

export async function listVaults(): Promise<Vault[]> {
  try {
    return await apiRequest<Vault[]>("/api/v1/teller/admin/vaults");
  } catch {
    return [];
  }
}

export function activateTill(id: string) {
  return apiRequest<Till>(`/api/v1/teller/admin/tills/${encodeURIComponent(id)}/activate`, {
    method: "POST",
  });
}

export function createTillTransfer(body: {
  destinationTillId: string;
  amount: number;
  currency: string;
  narration?: string;
}) {
  return apiRequest<{ reference: string; status: string }>("/api/v1/teller/till-transfers", {
    method: "POST",
    body: { ...body, idempotencyKey: idempotencyKey("TT") },
  });
}

export function acceptTillTransfer(reference: string) {
  return apiRequest<{ reference: string; status: string }>(
    `/api/v1/teller/till-transfers/${encodeURIComponent(reference)}/accept`,
    { method: "POST" },
  );
}

export function createVault(body: { branchCode: string; currency: string }) {
  return apiRequest<{ id: string; branchCode: string; currency: string; status: string }>(
    "/api/v1/teller/admin/vaults",
    { method: "POST", body },
  );
}
