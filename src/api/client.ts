import { env } from "../config/env";
import { ensureAccessToken } from "../auth/session";
import { demoApiRequest } from "../demo/demoApi";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function toApiError(status: number, payload: unknown): ApiError {
  const err = payload as { message?: string; code?: string; error?: string } | null;
  return new ApiError(
    err?.message || err?.error || `Request failed (${status})`,
    status,
    err?.code,
  );
}

/** All staff API calls go through the nginx gateway (`env.apiBaseUrl`). */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (env.demoMode) {
    return demoApiRequest<T>(path, { method: options.method, body: options.body });
  }

  const { body, auth = true, headers, ...rest } = options;
  const url = `${env.apiBaseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;

  async function doFetch(accessToken: string | null): Promise<Response> {
    const finalHeaders = new Headers(headers);
    if (body !== undefined && !finalHeaders.has("Content-Type")) {
      finalHeaders.set("Content-Type", "application/json");
    }
    if (auth) {
      if (!accessToken) {
        throw new ApiError("Not authenticated", 401, "UNAUTHENTICATED");
      }
      finalHeaders.set("Authorization", `Bearer ${accessToken}`);
    }
    return fetch(url, {
      ...rest,
      headers: finalHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  let token: string | null = null;
  if (auth) {
    token = await ensureAccessToken(env.tokenUrl, env.clientId);
    if (!token) {
      throw new ApiError("Not authenticated", 401, "UNAUTHENTICATED");
    }
  }

  let response = await doFetch(token);
  if (auth && response.status === 401) {
    token = await ensureAccessToken(env.tokenUrl, env.clientId, { forceRefresh: true });
    if (!token) {
      throw new ApiError("Not authenticated", 401, "UNAUTHENTICATED");
    }
    response = await doFetch(token);
  }

  const payload = await parseBody(response);
  if (!response.ok) {
    throw toApiError(response.status, payload);
  }
  return payload as T;
}
