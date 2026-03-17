export const API_URL = import.meta.env.VITE_API_URL || '';

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
};

export const getApiData = async (endpoint: string) => {
  const res = await apiFetch(endpoint);
  if (!res.ok) {
    const errorText = await res.text();
    // Check if it's HTML (likely 404/500 from proxy/vercel)
    if (errorText.includes("<!doctype") || errorText.includes("<html")) {
      throw new Error(`API error: Received HTML instead of JSON from ${endpoint}. Check your VITE_API_URL and server status.`);
    }
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
};
