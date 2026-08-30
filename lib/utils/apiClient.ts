// lib/utils/apiClient.ts

export async function apiFetch(url: string, options: RequestInit = {}) {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('reportpilot_token')
      : null;

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}