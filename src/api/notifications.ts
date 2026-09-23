import { apiRequest } from "./client";
import { toQuery, type PageResponse } from "./types";

export type NotificationDelivery = {
  id: string;
  requestReference: string;
  templateCode?: string;
  channel: string;
  recipientMasked?: string;
  status: string;
  createdAt?: string;
};

export type NotificationTemplate = {
  id: string;
  code: string;
  channel: string;
  subjectTemplate?: string;
  status: string;
  active: boolean;
  version: number;
};

export function listNotifications(params: { status?: string; channel?: string; page?: number; size?: number } = {}) {
  return apiRequest<PageResponse<NotificationDelivery>>(
    `/api/v1/notifications${toQuery({ page: 0, size: 20, ...params })}`,
  );
}

export function listTemplates(status?: string) {
  return apiRequest<NotificationTemplate[]>(
    `/api/v1/notification-templates${toQuery({ status })}`,
  );
}

export function sendNotification(body: {
  requestReference: string;
  templateCode: string;
  recipient: string;
  variables?: Record<string, string>;
  maxAttempts?: number;
}) {
  return apiRequest<NotificationDelivery>("/api/v1/notifications", { method: "POST", body });
}

export function createNotificationTemplate(body: {
  code: string;
  channel: string;
  subjectTemplate?: string;
  bodyTemplate: string;
  active: boolean;
}) {
  return apiRequest<NotificationTemplate>("/api/v1/notification-templates", {
    method: "POST",
    body,
  });
}
