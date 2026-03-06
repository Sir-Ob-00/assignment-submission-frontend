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

function decodeJwtPayload(token) {
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

function isTokenValid(token) {
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  if (!payload.exp) return true;
  return payload.exp * 1000 > Date.now();
}

function extractToken(data) {
  return data?.token
    || data?.accessToken
    || data?.access_token
    || data?.jwt
    || data?.data?.token
    || data?.data?.accessToken
    || data?.result?.token
    || null;
}

// ── Auth ─────────────────────────────────────────────────────

export async function apiLogin(email, password) {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    console.log("[LOGIN] API response:", { status: res.status, data });

    if (!res.ok) {
      return { ok: false, error: data?.message || "Invalid email or password" };
    }

    const token = extractToken(data);
    if (!isTokenValid(token)) {
      console.error("[LOGIN] Missing or invalid JWT:", token);
      return { ok: false, error: "Login succeeded but JWT token is missing or invalid." };
    }

    localStorage.setItem("token", token);
    console.log("[LOGIN] Token saved:", Boolean(localStorage.getItem("token")));
    return { ok: true, data, token };
  } catch (err) {
    console.error("[LOGIN] Network/CORS error:", err);
    return {
      ok: false,
      error: "Network or CORS error. Verify backend URL and CORS settings.",
    };
  }
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
  try {
    const token = getToken();
    if (!token) return { ok: false, error: "Missing auth token." };

    const hasAttachment = payload?.attachment instanceof File;
    const parsedDate = new Date(payload?.dueDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return { ok: false, error: "Invalid due date." };
    }
    const dueDate = parsedDate.toISOString();

    let res;
    if (hasAttachment) {
      const formData = new FormData();
      formData.append("title", payload.title || "");
      formData.append("description", payload.description || "");
      formData.append("dueDate", dueDate);
      formData.append("attachment", payload.attachment);

      console.log("[ASSIGNMENTS][CREATE] Sending multipart payload", {
        title: payload.title,
        dueDate,
        hasAttachment: true,
      });

      res = await fetch(`${BASE_URL}/api/assignments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
    } else {
      const body = {
        title: payload?.title || "",
        description: payload?.description || "",
        dueDate,
      };

      console.log("[ASSIGNMENTS][CREATE] Sending JSON payload", body);

      res = await fetch(`${BASE_URL}/api/assignments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    }

    const rawText = await res.text();
    let data = {};
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      data = { message: rawText };
    }

    console.log("[ASSIGNMENTS][CREATE] API response", {
      status: res.status,
      ok: res.ok,
      data,
    });

    if (!res.ok) {
      return {
        ok: false,
        error: data?.message || data?.error || `Failed with status ${res.status}`,
        data,
        status: res.status,
      };
    }

    return { ok: true, data, status: res.status };
  } catch (err) {
    console.error("[ASSIGNMENTS][CREATE] Network/CORS error:", err);
    return {
      ok: false,
      error: "Network or CORS error. Verify backend URL and CORS settings.",
    };
  }
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
