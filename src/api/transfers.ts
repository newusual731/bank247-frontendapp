import { apiRequest } from "./client";

export type TransferResult = {
  reference?: string;
  transactionReference?: string;
  status?: string;
  id?: string;
};

export function intraBankTransfer(body: {
  sourceAccount: string;
  destinationAccount: string;
  amount: number;
  currency: string;
  transactionReference: string;
  narration?: string;
}) {
  return apiRequest<TransferResult>("/api/v1/accounts/transfers", { method: "POST", body });
}

export function internalTransfer(body: {
  sourceAccount: string;
  destinationAccount: string;
  amount: number;
  currency: string;
  narration?: string;
  reference?: string;
}) {
  return apiRequest<TransferResult>("/api/v1/transactions/internal-transfers", {
    method: "POST",
    body: {
      ...body,
      idempotencyKey: `ITX-${crypto.randomUUID()}`,
      channel: "BRANCH",
    },
  });
}

export function reverseTransaction(reference: string) {
  return apiRequest<TransferResult>(
    `/api/v1/transactions/${encodeURIComponent(reference)}/reverse`,
    { method: "POST" },
  );
}
