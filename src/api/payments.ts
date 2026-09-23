import { apiRequest } from "./client";
import { toQuery, type PageResponse } from "./types";

export type Payment = {
  id: string;
  reference: string;
  productCode?: string;
  paymentType: string;
  sourceAccount?: string;
  destinationAccount?: string;
  amount: number | string;
  currency: string;
  status: string;
  completedAt?: string;
};

export function listPayments(params: {
  status?: string;
  sourceAccount?: string;
  page?: number;
  size?: number;
} = {}) {
  return apiRequest<PageResponse<Payment>>(
    `/api/v1/payments${toQuery({ page: 0, size: 20, ...params })}`,
  );
}

export function createInternalPayment(body: {
  idempotencyKey: string;
  sourceAccount: string;
  destinationAccount: string;
  amount: number;
  currency: string;
  narration?: string;
}) {
  return apiRequest<{ reference?: string; status?: string; id?: string }>("/api/v1/payments/internal", {
    method: "POST",
    body,
  });
}

export function createExternalPayment(body: {
  idempotencyKey: string;
  productCode: string;
  sourceAccount: string;
  destinationAccount: string;
  destinationBankCode: string;
  amount: number;
  currency: string;
  valueDate: string;
  paymentDetails: string;
  sessionId: string;
  narration?: string;
}) {
  return apiRequest<Payment>("/api/v1/payments/external", { method: "POST", body });
}
