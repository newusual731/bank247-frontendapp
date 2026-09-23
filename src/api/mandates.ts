import { apiRequest } from "./client";

export type Mandate = {
  id: string;
  customerId: string;
  versionNo: number;
  mandateType: string;
  instruction?: string;
  signatories?: string;
  status: string;
  createdAt?: string;
};

export function listMandates(customerId: string) {
  return apiRequest<Mandate[]>(`/api/v1/customers/${encodeURIComponent(customerId)}/mandates`);
}

export function createMandate(
  customerId: string,
  body: {
    mandateType: string;
    instruction: string;
    signatories: { fullName: string; role?: string; bvn?: string }[];
  },
) {
  return apiRequest<Mandate>(`/api/v1/customers/${encodeURIComponent(customerId)}/mandates`, {
    method: "POST",
    body,
  });
}
