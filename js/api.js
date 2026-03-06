// ============================================================
//  api.js — Central API service layer
//  Change BASE_URL to match your backend
// ============================================================

const BASE_URL = "https://assignment-submission-9idl.onrender.com";   // ← update this

// ── Helpers ─────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem("token");
}

function authHeaders(isJson = true) {
  const h = { Authorization: `Bearer ${getToken()}` };
  if (isJson) h["Content-Type"] = "application/json";
  return h;
}

async function request(path, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ── Auth ─────────────────────────────────────────────────────

export async function apiLogin(email, password) {
  return request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function apiRegister(payload) {
  return request("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// ── Users ─────────────────────────────────────────────────────

export async function apiGetMe() {
  return request("/api/users/me", { headers: authHeaders() });
}

export async function apiGetAllUsers() {
  return request("/api/users", { headers: authHeaders() });
}

export async function apiDeleteUser(id) {
  return request(`/api/users/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export async function apiGetStudents() {
  return request("/api/users/students", { headers: authHeaders() });
}

// ── Assignments ───────────────────────────────────────────────

export async function apiCreateAssignment(payload) {
  return request("/api/assignments", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function apiGetAllAssignments() {
  return request("/api/assignments/all", { headers: authHeaders() });
}

export async function apiGetStudentAssignments() {
  return request("/api/assignments/student", { headers: authHeaders() });
}

export async function apiSubmitAssignment(id, formData) {
  return request(`/api/assignments/submit/${id}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` }, // no Content-Type for multipart
    body: formData,
  });
}

export { BASE_URL };

export async function apiDeleteAssignment(id) {
  return request(`/api/assignments/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}
