export const SESSION_KEYS = [
  "access",
  "refresh",
  "user_email",
  "display_name",
  "role",
];

export function saveSession(data) {
  if (data.access) localStorage.setItem("access", data.access);
  if (data.refresh) localStorage.setItem("refresh", data.refresh);
  if (data.email) localStorage.setItem("user_email", data.email);
  if (data.display_name) localStorage.setItem("display_name", data.display_name);
  if (data.role) localStorage.setItem("role", data.role);
}

export function clearSession() {
  SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function getAccessToken() {
  return localStorage.getItem("access");
}

export function getRefreshToken() {
  return localStorage.getItem("refresh");
}

export function getDisplayName() {
  return localStorage.getItem("display_name") || localStorage.getItem("user_email") || "Customer";
}

export function getUserRole() {
  return localStorage.getItem("role") || "customer";
}

export function hasSession() {
  return Boolean(getAccessToken() || getRefreshToken());
}
