// ============================================================
//  dashboard.js — Role-based dashboard rendering
// ============================================================
import { apiGetMe, apiGetAllAssignments, apiGetStudentAssignments, apiGetAllUsers } from "./api.js";
import { requireAuth, getUser, logout, formatDate, roleBadge, isOverdue } from "./utils.js";

if (!requireAuth()) throw new Error("unauth");

const user = getUser();
initNav();
renderDashboard();

// ── Navigation ────────────────────────────────────────────────
function initNav() {
  const nameEl = document.getElementById("nav-name");
  const roleEl = document.getElementById("nav-role");
  if (nameEl) nameEl.textContent = user?.name || "User";
  if (roleEl) roleEl.innerHTML   = roleBadge(user?.role);

  document.getElementById("logoutBtn")?.addEventListener("click", logout);

  // Show/hide role-specific nav links
  document.querySelectorAll("[data-role]").forEach(el => {
    const roles = el.dataset.role.split(",");
    if (!roles.includes(user?.role)) el.classList.add("hidden");
  });
}

// ── Dashboard ─────────────────────────────────────────────────
async function renderDashboard() {
  const container = document.getElementById("dashboard-content");
  if (!container) return;

  if (user?.role === "student")  await renderStudentDash(container);
  if (user?.role === "lecturer") await renderLecturerDash(container);
  if (user?.role === "admin")    await renderAdminDash(container);
}

// ── Student Dashboard ─────────────────────────────────────────
async function renderStudentDash(container) {
  container.innerHTML = loadingSkeleton(3);

  const res = await apiGetStudentAssignments();
  if (!res.ok) { container.innerHTML = errorCard(res.error); return; }

  const assignments = res.data.assignments || res.data || [];
  const pending   = assignments.filter(a => !a.submitted);
  const submitted = assignments.filter(a => a.submitted);

  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
      ${statCard("Total", assignments.length, "📋")}
      ${statCard("Pending", pending.length, "⏳", "text-amber-400")}
      ${statCard("Submitted", submitted.length, "✅", "text-emerald-400")}
    </div>

    <div class="card">
      <div class="flex items-center justify-between mb-5">
        <h2 class="section-title">My Assignments</h2>
        <a href="/assignments/student.html" class="btn-ghost text-sm">View all →</a>
      </div>
      ${assignments.length === 0
        ? emptyState("No assignments yet")
        : `<div class="divide-y divide-navy-700">
            ${assignments.slice(0, 5).map(a => `
              <div class="py-4 flex items-center justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-white truncate">${a.title}</p>
                  <p class="text-xs font-mono text-slate-400 mt-0.5">Due: ${formatDate(a.dueDate)} 
                    ${isOverdue(a.dueDate) && !a.submitted ? '<span class="text-red-400">· overdue</span>' : ''}
                  </p>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                  ${a.submitted
                    ? `<span class="status-badge bg-emerald-900/50 text-emerald-300 border-emerald-600/40">Submitted</span>`
                    : `<a href="/assignments/submit.html?id=${a._id}" class="btn-primary text-xs px-3 py-1.5">Submit</a>`
                  }
                </div>
              </div>
            `).join("")}
          </div>`
      }
    </div>
  `;
}

// ── Lecturer Dashboard ────────────────────────────────────────
async function renderLecturerDash(container) {
  container.innerHTML = loadingSkeleton(3);

  const res = await apiGetAllAssignments();
  if (!res.ok) { container.innerHTML = errorCard(res.error); return; }

  const assignments = res.data.assignments || res.data || [];

  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
      ${statCard("Assignments", assignments.length, "📋")}
      ${statCard("Active", assignments.filter(a => !isOverdue(a.dueDate)).length, "🟢", "text-emerald-400")}
      ${statCard("Overdue", assignments.filter(a => isOverdue(a.dueDate)).length, "🔴", "text-red-400")}
    </div>

    <div class="card">
      <div class="flex items-center justify-between mb-5">
        <h2 class="section-title">Assignments</h2>
        <div class="flex gap-2">
          <a href="/assignments/list.html" class="btn-ghost text-sm">View all →</a>
          <a href="/assignments/create.html" class="btn-primary text-sm">+ New</a>
        </div>
      </div>
      ${assignmentTable(assignments.slice(0, 6))}
    </div>
  `;
}

// ── Admin Dashboard ───────────────────────────────────────────
async function renderAdminDash(container) {
  container.innerHTML = loadingSkeleton(3);

  const [assignRes, userRes] = await Promise.all([
    apiGetAllAssignments(),
    apiGetAllUsers(),
  ]);

  const assignments = assignRes.data?.assignments || assignRes.data || [];
  const users       = userRes.data?.users || userRes.data || [];

  container.innerHTML = `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
      ${statCard("Users", users.length, "👥")}
      ${statCard("Assignments", assignments.length, "📋")}
      ${statCard("Students", users.filter(u => u.role === "student").length, "🎓", "text-emerald-400")}
      ${statCard("Lecturers", users.filter(u => u.role === "lecturer").length, "🏫", "text-blue-400")}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card">
        <div class="flex items-center justify-between mb-5">
          <h2 class="section-title">Recent Users</h2>
          <a href="/users/list.html" class="btn-ghost text-sm">Manage →</a>
        </div>
        <div class="divide-y divide-navy-700">
          ${users.slice(0, 5).map(u => `
            <div class="py-3 flex items-center justify-between">
              <div>
                <p class="font-semibold text-white text-sm">${u.name}</p>
                <p class="text-xs font-mono text-slate-400">${u.email}</p>
              </div>
              ${roleBadge(u.role)}
            </div>
          `).join("") || emptyState("No users")}
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between mb-5">
          <h2 class="section-title">Assignments</h2>
          <a href="/assignments/list.html" class="btn-ghost text-sm">View all →</a>
        </div>
        ${assignmentTable(assignments.slice(0, 5))}
      </div>
    </div>
  `;
}

// ── Shared Components ─────────────────────────────────────────
function statCard(label, value, icon, valueClass = "text-amber-400") {
  return `
    <div class="card flex items-center gap-4">
      <span class="text-3xl">${icon}</span>
      <div>
        <p class="text-2xl font-bold ${valueClass}">${value}</p>
        <p class="text-xs font-mono text-slate-400 uppercase tracking-wider">${label}</p>
      </div>
    </div>`;
}

function assignmentTable(items) {
  if (!items.length) return emptyState("No assignments");
  return `
    <div class="divide-y divide-navy-700">
      ${items.map(a => `
        <div class="py-3">
          <p class="font-semibold text-white text-sm">${a.title}</p>
          <p class="text-xs font-mono text-slate-400 mt-0.5">Due: ${formatDate(a.dueDate)}
            ${isOverdue(a.dueDate) ? '<span class="text-red-400"> · overdue</span>' : '<span class="text-emerald-400"> · active</span>'}
          </p>
        </div>
      `).join("")}
    </div>`;
}

function loadingSkeleton(n = 3) {
  return Array(n).fill(0).map(() =>
    `<div class="card animate-pulse"><div class="h-4 bg-navy-700 rounded w-2/3 mb-3"></div><div class="h-3 bg-navy-700 rounded w-1/3"></div></div>`
  ).join("");
}

function errorCard(msg) {
  return `<div class="card border-red-600/40"><p class="text-red-400 font-mono text-sm">Error: ${msg}</p></div>`;
}

function emptyState(msg) {
  return `<p class="text-center text-slate-500 font-mono text-sm py-8">${msg}</p>`;
}
