// ============================================================
//  auth.js — Login & Register logic
// ============================================================
import { apiLogin, apiRegister } from "./api.js";
import { showMessage } from "./utils.js";

// ── Login ────────────────────────────────────────────────────
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMessage();
    const btn = loginForm.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Signing in…";

    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const res = await apiLogin(email, password);
    if (res.ok) {
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user",  JSON.stringify(res.data.user || decodeJwt(res.data.token)));
      window.location.href = "/dashboard.html";
    } else {
      showMessage(res.error || "Login failed", "error");
      btn.disabled = false;
      btn.textContent = "Sign In";
    }
  });
}

// ── Register ─────────────────────────────────────────────────
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = registerForm.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Creating account…";

    const payload = {
      name:     document.getElementById("name").value.trim(),
      email:    document.getElementById("email").value.trim(),
      password: document.getElementById("password").value,
      role:     document.getElementById("role").value,
    };

    const res = await apiRegister(payload);
    if (res.ok) {
      showMessage("Account created! Redirecting to login…", "success");
      setTimeout(() => (window.location.href = "/index.html"), 1800);
    } else {
      showMessage(res.error || "Registration failed", "error");
      btn.disabled = false;
      btn.textContent = "Create Account";
    }
  });
}

// ── Helpers ──────────────────────────────────────────────────
function hideMessage() {
  const el = document.getElementById("msg");
  if (el) el.classList.add("hidden");
}

function decodeJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}
