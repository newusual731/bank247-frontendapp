import { apiRequest } from "./client";

export type ApprovalRequest = {
  id: string;
  operationCode: string;
  resourceType: string;
  resourceId: string;
  status: string;
  requestedBy?: string;
  requiredApprovals?: number;
  approvalCount?: number;
  createdAt?: string;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export function listApprovals(params: { status?: string; eligibleOnly?: boolean; page?: number; size?: number } = {}) {
  const q = new URLSearchParams();
  if (params.status) q.set("status", params.status);
  if (params.eligibleOnly) q.set("eligibleOnly", "true");
  q.set("page", String(params.page ?? 0));
  q.set("size", String(params.size ?? 20));
  return apiRequest<PageResponse<ApprovalRequest>>(`/api/v1/approval-requests?${q}`);
}

export function approveRequest(id: string, comment?: string) {
  return apiRequest<ApprovalRequest>(`/api/v1/approval-requests/${id}/approve`, {
    method: "POST",
    body: { comment: comment || "Approved" },
  });
}

export function rejectRequest(id: string, comment?: string) {
  return apiRequest<ApprovalRequest>(`/api/v1/approval-requests/${id}/reject`, {
    method: "POST",
    body: { comment: comment || "Rejected" },
  });
}
