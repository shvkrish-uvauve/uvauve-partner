export function getAuthToken() {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem("auth_token"); } catch { return null; }
}
export function setAuthToken(token) {
  try { localStorage.setItem("auth_token", token); } catch {}
}
export function clearAuthToken() {
  try { localStorage.removeItem("auth_token"); } catch {}
}

export async function api(path, { method = "GET", body, headers } = {}) {
  const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  const url = `${base}${path}`;
  const token = getAuthToken();

  const opts = {
    method,
    credentials: "include",
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  const res = await fetch(url, opts);
  let data = null;
  try { data = await res.json(); } catch {}

  if (!res.ok) {
    const msg = data?.error || data?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}
