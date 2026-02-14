import { API_BASE_URL } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import type { ApiErrorResponse } from "@/types/models";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

function buildQueryString(params?: Record<string, string | number | boolean | undefined | null>): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ""
  );
  if (entries.length === 0) return "";
  const qs = new URLSearchParams(
    entries.map(([k, v]) => [k, String(v)])
  ).toString();
  return `?${qs}`;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getAccessToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> | undefined),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorBody: ApiErrorResponse;
    try {
      errorBody = await response.json();
    } catch {
      throw new ApiError(
        response.status,
        "UNKNOWN",
        `Request failed with status ${response.status}`
      );
    }
    throw new ApiError(
      response.status,
      errorBody.error.code,
      errorBody.error.message,
      errorBody.error.details
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export const api = {
  get<T>(path: string, params?: Record<string, string | number | boolean | undefined | null>): Promise<T> {
    return request<T>(`${path}${buildQueryString(params)}`);
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  delete(path: string): Promise<void> {
    return request<void>(path, { method: "DELETE" });
  },
};
