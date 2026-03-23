import { getErrorMessage, type APIResponse } from "@/types";

export async function apiPost<TData, TBody>(
  url: string,
  body: TBody,
): Promise<APIResponse<TData>> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = (await response.json().catch(() => ({}))) as APIResponse<TData>;
  if (!response.ok || !json.success) {
    throw new Error(getErrorMessage(json, "Request failed"));
  }
  return json;
}

export async function apiPatch<TData, TBody>(
  url: string,
  body: TBody,
): Promise<APIResponse<TData>> {
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = (await response.json().catch(() => ({}))) as APIResponse<TData>;
  if (!response.ok || !json.success) {
    throw new Error(getErrorMessage(json, "Request failed"));
  }
  return json;
}

export async function apiGet<TData>(url: string): Promise<APIResponse<TData>> {
  const response = await fetch(url, { method: "GET" });
  const json = (await response.json().catch(() => ({}))) as APIResponse<TData>;
  if (!response.ok || !json.success) {
    throw new Error(getErrorMessage(json, "Request failed"));
  }
  return json;
}

