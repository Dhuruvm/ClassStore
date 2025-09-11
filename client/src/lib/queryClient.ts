import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  path: string,
  options?: {
    body?: any;
    isFormData?: boolean;
  }
): Promise<Response> {
  const { body, isFormData } = options || {};

  const requestOptions: RequestInit = {
    method,
    credentials: "include",
  };

  if (body && method !== "GET") {
    if (isFormData || body instanceof FormData) {
      requestOptions.body = body;
    } else {
      requestOptions.headers = {
        "Content-Type": "application/json",
      };
      requestOptions.body = JSON.stringify(body);
    }
  }

  const response = await fetch(path, requestOptions);

  if (!response.ok) {
    if (response.status >= 500) {
      throw new Error(`Server error: ${response.status}`);
    }

    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error: ${response.status}`);
  }

  return response;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});