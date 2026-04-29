export async function clientApi<T>(
  loginId: string,
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-login-id": loginId,
      ...(init?.headers ?? {}),
    },
  });
  const json = await response.json();
  if (!response.ok || !json.ok) {
    throw new Error(json.details ?? json.message ?? "API error");
  }
  return json.data as T;
}
