import { apiRequest } from "./client";

export type IamUser = {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  status: string;
  homeBranchCode?: string;
  departmentCode?: string;
  createdAt?: string;
};

export type IamRole = {
  id: string;
  code: string;
  name: string;
  description?: string;
  riskLevel?: string;
  status: string;
  permissionCodes?: string[];
};

export type IamPermission = {
  id: string;
  code: string;
  module: string;
  action: string;
  description?: string;
};

export function listUsers(params: { username?: string; status?: string; branch?: string } = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) q.set(k, v);
  });
  const qs = q.toString();
  return apiRequest<IamUser[]>(`/api/v1/iam/users${qs ? `?${qs}` : ""}`);
}

export function getUser(id: string) {
  return apiRequest<IamUser>(`/api/v1/iam/users/${encodeURIComponent(id)}`);
}

export function createUser(body: {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  branchCode?: string;
  departmentCode?: string;
  mfaRequired?: boolean;
}) {
  return apiRequest<IamUser>("/api/v1/iam/users", { method: "POST", body });
}

export function submitUserCreate(id: string) {
  return apiRequest<IamUser>(`/api/v1/iam/users/${encodeURIComponent(id)}/submit-create`, {
    method: "POST",
  });
}

export function applyUserCreate(id: string) {
  return apiRequest<IamUser>(`/api/v1/iam/users/${encodeURIComponent(id)}/apply-create`, {
    method: "POST",
  });
}

export function disableUser(id: string, reason?: string) {
  const q = reason ? `?reason=${encodeURIComponent(reason)}` : "";
  return apiRequest<IamUser>(`/api/v1/iam/users/${encodeURIComponent(id)}/disable${q}`, {
    method: "POST",
  });
}

export function listRoles() {
  return apiRequest<IamRole[]>("/api/v1/iam/roles");
}

export function listPermissions() {
  return apiRequest<IamPermission[]>("/api/v1/iam/permissions");
}
