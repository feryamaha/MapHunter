export class ServerApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ServerApiError";
    this.status = status;
    this.body = body;
  }
}

interface ServerApiOptions {
  headers?: Record<string, string>;
  timeout?: number;
}

const DEFAULT_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

async function request<T>(
  url: string,
  method: string,
  body?: unknown,
  options?: ServerApiOptions,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = options?.timeout
    ? setTimeout(() => controller.abort(), options.timeout)
    : undefined;

  try {
    const response = await fetch(url, {
      method,
      headers: { ...DEFAULT_HEADERS, ...options?.headers },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new ServerApiError(
        `Request failed: ${response.status} ${response.statusText}`,
        response.status,
        errorBody,
      );
    }

    return (await response.json()) as T;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export const serverApi = {
  get<T>(url: string, options?: ServerApiOptions): Promise<T> {
    return request<T>(url, "GET", undefined, options);
  },

  post<T>(url: string, body?: unknown, options?: ServerApiOptions): Promise<T> {
    return request<T>(url, "POST", body, options);
  },

  put<T>(url: string, body?: unknown, options?: ServerApiOptions): Promise<T> {
    return request<T>(url, "PUT", body, options);
  },

  delete<T>(url: string, options?: ServerApiOptions): Promise<T> {
    return request<T>(url, "DELETE", undefined, options);
  },
};
