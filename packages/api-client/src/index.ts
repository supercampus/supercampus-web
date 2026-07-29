export interface ApiClientOptions {
  baseUrl?: string;
  getAccessToken?: () => string | undefined | Promise<string | undefined>;
}

export function createApiClient(options: ApiClientOptions = {}) {
  const baseUrl = (options.baseUrl ?? "/api/v1").replace(/\/$/, "");
  return {
    async request<T>(path: string, init: RequestInit = {}): Promise<T> {
      const token = await options.getAccessToken?.();
      const headers = new Headers(init.headers);
      headers.set("Accept", "application/json");
      if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      const response = await fetch(`${baseUrl}/${path.replace(/^\//, "")}`, { ...init, headers });
      if (!response.ok) throw new Error(`SuperCampus API request failed (${response.status})`);
      return response.json() as Promise<T>;
    },
  };
}