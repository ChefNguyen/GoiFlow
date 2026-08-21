const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("goiflow_token");
}

export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("goiflow_token", token);
  }
}

export function removeAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("goiflow_token");
  }
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
}
