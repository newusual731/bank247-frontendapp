import { apiRequest } from "./client";
import type { Customer } from "./customers";

export type CreateIndividualPayload = {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  bvn: string;
  nin: string;
  email: string;
  mobileNumber: string;
  branchCode: string;
  pep: boolean;
  nationality?: string;
  occupation?: string;
  addressLine1?: string;
  city?: string;
  stateName?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
};

export function createIndividualCustomer(body: CreateIndividualPayload) {
  return apiRequest<Customer>("/api/v1/customers/individual", {
    method: "POST",
    body,
  });
}

export type CreateCorporatePayload = {
  companyName: string;
  incorporationType: string;
  certificateNumber: string;
  incorporationDate: string;
  tin: string;
  email: string;
  mobileNumber: string;
  branchCode: string;
  category?: string;
  kycTier?: string;
  addressLine1?: string;
  city?: string;
  stateName?: string;
};

export function createCorporateCustomer(body: CreateCorporatePayload) {
  return apiRequest<Customer>("/api/v1/customers/corporate", {
    method: "POST",
    body,
  });
}

export function getCustomer(id: string) {
  return apiRequest<Customer>(`/api/v1/customers/${id}`);
}
