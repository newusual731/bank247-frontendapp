import { apiRequest } from "./client";
import { toQuery, type PageResponse } from "./types";

export type WorkflowDefinition = {
  id: string;
  operationCode: string;
  resourceType: string;
  requiredApprovals: number;
  enabled: boolean;
  approverRoleCodes?: string[];
  branchScoped?: boolean;
};

export function listWorkflowDefinitions(params: { operationCode?: string; enabled?: boolean; page?: number; size?: number } = {}) {
  return apiRequest<PageResponse<WorkflowDefinition>>(
    `/api/v1/workflow-definitions${toQuery({ page: 0, size: 50, ...params })}`,
  );
}
