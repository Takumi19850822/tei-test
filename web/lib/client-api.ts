/* eslint-disable @typescript-eslint/no-explicit-any -- 各 API の data 型が異なり、呼び出し側で扱う */
/** API の json.data */
export async function clientApi(url: string, init?: RequestInit): Promise<any> {
  const response = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const json = await response.json();
  if (!response.ok || !json.ok) {
    throw new Error(json.details ?? json.message ?? "API error");
  }
  return json.data;
}
