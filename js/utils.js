// ============================================================
//  utils.js — Shared helper functions
// ============================================================

export function showMessage(msg, type = "success", containerId = "msg") {
  const el = document.getElementById(containerId);
  if (!el) return;
  const colors = {
    success: "bg-emerald-900/60 border-emerald-500 text-emerald-300",
    error:   "bg-red-900/60 border-red-500 text-red-300",
    info:    "bg-blue-900/60 border-blue-500 text-blue-300",
  };
  el.className = `border px-4 py-3 rounded text-sm font-mono ${colors[type]} animate-fadeIn`;
  el.textContent = msg;
  el.classList.remove("hidden");
  if (type === "success") setTimeout(() => el.classList.add("hidden"), 4000);
}

export function hideMessage(containerId = "msg") {
  const el = document.getElementById(containerId);
  if (el) el.classList.add("hidden");
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-GB", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function decodeJwtPayload(token) {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(b64));
  } catch {
    return null;
  }
}

export function isTokenValid(token) {
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  if (!payload.exp) return true;
  return payload.exp * 1000 > Date.now();
}

export function runPublicAuthCheck() {
  const isLocalDevHost =
    window.location.hostname === "localhost"
    || window.location.hostname === "127.0.0.1";
  if (isLocalDevHost) {
    console.log("[AUTH CHECK][PUBLIC] Local dev host detected, skipping auto-redirect.");
    return false;
  }

  const token = localStorage.getItem("token");
  const valid = isTokenValid(token);
  console.log("[AUTH CHECK][PUBLIC]", {
    path: window.location.pathname,
    hasToken: Boolean(token),
    validToken: valid,
  });
  if (valid) {
    window.location.replace("/dashboard.html");
    return true;
  }
  return false;
}

export function requireAuth(allowedRoles = []) {
  const token = localStorage.getItem("token");
  const valid = isTokenValid(token);
  console.log("[AUTH CHECK][PROTECTED]", {
    path: window.location.pathname,
    hasToken: Boolean(token),
    validToken: valid,
  });

  if (!valid) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.replace("/index.html");
    return false;
  }

  const user  = getUser();
  if (allowedRoles.length && (!user || !allowedRoles.includes(user.role))) {
    window.location.replace("/dashboard.html");
    return false;
  }
  return true;
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/index.html";
}

export function isOverdue(dateStr) {
  return dateStr && new Date(dateStr) < new Date();
}

export function roleBadge(role) {
  const map = {
    admin:    "bg-amber-400/20 text-amber-300 border-amber-500/40",
    lecturer: "bg-blue-400/20 text-blue-300 border-blue-500/40",
    student:  "bg-emerald-400/20 text-emerald-300 border-emerald-500/40",
  };
  return `<span class="border text-xs font-mono px-2 py-0.5 rounded-full ${map[role] || ''}">${role}</span>`;
}
