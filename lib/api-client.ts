/**
 * API Client Wrapper
 * Centralized API client using NEXT_PUBLIC_API_BASE environment variable
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

export type ApiError = {
  message: string;
  status: number;
  data?: unknown;
};

export class ApiClientError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | null | undefined>;
  requireAuth?: boolean;
}

/**
 * Get full URL for API request
 */
function getUrl(endpoint: string, params?: Record<string, string | number | boolean | null | undefined>): string {
  const base = API_BASE.replace(/\/$/, ""); // Remove trailing slash
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = new URL(path, base);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

/**
 * Get default headers for API requests
 */
function getHeaders(requireAuth = true): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Add auth token if available (you may need to adjust this based on your auth implementation)
  if (requireAuth) {
    // Example: const token = getAuthToken();
    // if (token) headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Handle API response
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  let data: unknown;
  try {
    data = isJson ? await response.json() : await response.text();
  } catch (error) {
    throw new ApiClientError("Failed to parse response", response.status);
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "message" in data
        ? String(data.message)
        : `API request failed with status ${response.status}`;
    throw new ApiClientError(message, response.status, data);
  }

  return data as T;
}

/**
 * API Client methods
 */
export const apiClient = {
  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const { params, requireAuth = true, ...fetchOptions } = options || {};
    const url = getUrl(endpoint, params);

    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders(requireAuth),
      ...fetchOptions,
    });

    return handleResponse<T>(response);
  },

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const { params, requireAuth = true, ...fetchOptions } = options || {};
    const url = getUrl(endpoint, params);

    const response = await fetch(url, {
      method: "POST",
      headers: getHeaders(requireAuth),
      body: body ? JSON.stringify(body) : undefined,
      ...fetchOptions,
    });

    return handleResponse<T>(response);
  },

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const { params, requireAuth = true, ...fetchOptions } = options || {};
    const url = getUrl(endpoint, params);

    const response = await fetch(url, {
      method: "PUT",
      headers: getHeaders(requireAuth),
      body: body ? JSON.stringify(body) : undefined,
      ...fetchOptions,
    });

    return handleResponse<T>(response);
  },

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const { params, requireAuth = true, ...fetchOptions } = options || {};
    const url = getUrl(endpoint, params);

    const response = await fetch(url, {
      method: "PATCH",
      headers: getHeaders(requireAuth),
      body: body ? JSON.stringify(body) : undefined,
      ...fetchOptions,
    });

    return handleResponse<T>(response);
  },

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const { params, requireAuth = true, ...fetchOptions } = options || {};
    const url = getUrl(endpoint, params);

    const response = await fetch(url, {
      method: "DELETE",
      headers: getHeaders(requireAuth),
      ...fetchOptions,
    });

    return handleResponse<T>(response);
  },
};

