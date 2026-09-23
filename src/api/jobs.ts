import { apiRequest } from "./client";
import { toQuery } from "./types";

export type EodRun = {
  id: string;
  businessDate: string;
  status: string;
  triggerSource?: string;
  startedAt?: string;
  completedAt?: string;
  failureMessage?: string;
  completedSteps?: number;
  totalSteps?: number;
  percentComplete?: number;
};

export type EodRunList = {
  items: EodRun[];
  page: number;
  size: number;
  total: number;
};

export function listEodRuns(page = 0, size = 20) {
  return apiRequest<EodRunList>(`/api/v1/eod/runs${toQuery({ page, size })}`);
}
