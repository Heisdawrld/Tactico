/**
 * Tactico Frontend API Client
 */

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
    throw new Error(error.error || `API request failed with status ${response.status}`);
  }

  return response.json();
}
