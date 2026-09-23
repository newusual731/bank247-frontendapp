import { apiRequest } from "./client";
import { toQuery } from "./types";

export type SodViolation = {
  id: string;
  userId: string;
  username?: string;
  roleACode: string;
  roleBCode: string;
  severity: string;
  conflictType?: string;
  status: string;
  detectedAt?: string;
};

export type BreakGlassGrant = {
  id: string;
  userId: string;
  roleId: string;
  reason?: string;
  requestedFrom?: string;
  requestedUntil?: string;
  status: string;
};

export type AccessRequest = {
  id: string;
  userId: string;
  roleId: string;
  branchScope?: string;
  reason?: string;
  sodConflict?: boolean;
  status: string;
};

export function listSodViolations(status?: string) {
  return apiRequest<SodViolation[]>(`/api/v1/iam/sod-violations${toQuery({ status })}`);
}

export function listBreakGlass() {
  return apiRequest<BreakGlassGrant[]>("/api/v1/iam/break-glass");
}

export function listAccessRequests(status?: string) {
  return apiRequest<AccessRequest[]>(`/api/v1/iam/access-requests${toQuery({ status })}`);
}
