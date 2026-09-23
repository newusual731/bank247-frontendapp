import { apiRequest } from "./client";

export type CustomerType = "INDIVIDUAL" | "CORPORATE";
export type CustomerStatus = "DRAFT" | "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED" | "CLOSED" | "BLACKLISTED";

export type Customer = {
  id: string;
  cifNumber: string;
  type: CustomerType;
  displayName: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  companyName?: string;
  branchCode: string;
  status: CustomerStatus;
  email?: string;
  mobileNumber?: string;
  createdAt: string;
  kycStatus?: string;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type CustomerSearchParams = {
  name?: string;
  cifNumber?: string;
  type?: CustomerType;
  status?: CustomerStatus;
  branchCode?: string;
  page?: number;
  size?: number;
};

function toQuery(params: CustomerSearchParams): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      q.set(key, String(value));
    }
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function searchCustomers(params: CustomerSearchParams = {}) {
  return apiRequest<PageResponse<Customer>>(
    `/api/v1/customers${toQuery({ page: 0, size: 20, ...params })}`,
  );
}
