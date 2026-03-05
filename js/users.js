// ============================================================
//  users.js — User management (Admin & Lecturer)
// ============================================================
import { apiGetAllUsers, apiDeleteUser, apiGetStudents, apiGetMe } from "./api.js";
import { requireAuth, getUser, logout, formatDate, roleBadge, showMessage } from "./utils.js";

if (!requireAuth()) throw new Error("unauth");

const user = getUser();
initNav();

const page = document.body.dataset.page;
if (page === "user-list")     initUserList();
if (page === "student-list")  initStudentList();
if (page === "profile")       initProfile();

// ── Navigation ─────────────────────────────────────────────────
function initNav() {
  const nn = document.getElementById("nav-name");
  if (nn) nn.textContent = user?.name || "User";
  const nr = document.getElementById("nav-role");
  if (nr) nr.innerHTML   = roleBadge(user?.role);
  document.getElementById("logoutBtn")?.addEventListener("click", logout);
  document.querySelectorAll("[data-role]").forEach(el => {
    const roles = el.dataset.role.split(",");
    if (!roles.includes(user?.role)) el.classList.add("hidden");
  });
}

// ── Admin: All Users ───────────────────────────────────────────
async function initUserList() {
  requireAuth(["admin"]);
  const container = document.getElementById("userList");
  const searchEl  = document.getElementById("search");
  if (!container) return;

  let allUsers = [];

  async function loadUsers() {
    container.innerHTML = skeleton();
    const res = await apiGetAllUsers();
    if (!res.ok) { container.innerHTML = errorHtml(res.error); return; }
    allUsers = res.data.users || res.data || [];
    renderUsers(allUsers);
  }

  function renderUsers(users) {
    const query = searchEl?.value.toLowerCase() || "";
    const filtered = query
      ? users.filter(u => u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query))
      : users;

    if (!filtered.length) { container.innerHTML = emptyHtml("No users found"); return; }

    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="userTableBody">
          ${filtered.map(u => `
            <tr id="user-row-${u._id}">
              <td class="font-semibold text-white">${u.name}</td>
              <td class="font-mono text-sm text-slate-400">${u.email}</td>
              <td>${roleBadge(u.role)}</td>
              <td class="font-mono text-xs text-slate-400">${formatDate(u.createdAt)}</td>
              <td>
                ${u._id !== user?._id
                  ? `<button onclick="deleteUser('${u._id}', '${u.name}')" 
                       class="text-red-400 hover:text-red-300 font-mono text-xs border border-red-600/30 hover:border-red-400/50 px-3 py-1.5 rounded transition-colors">
                       Delete
                     </button>`
                  : `<span class="text-slate-600 font-mono text-xs">you</span>`
                }
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <p class="text-xs font-mono text-slate-500 mt-3">${filtered.length} user${filtered.length !== 1 ? 's' : ''} found</p>`;
  }

  searchEl?.addEventListener("input", () => renderUsers(allUsers));
  await loadUsers();

  // Expose deleteUser globally (called from inline onclick)
  window.deleteUser = async (id, name) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    const res = await apiDeleteUser(id);
    if (res.ok) {
      showMessage(`User "${name}" deleted`, "success");
      const row = document.getElementById(`user-row-${id}`);
      if (row) row.remove();
      allUsers = allUsers.filter(u => u._id !== id);
    } else {
      showMessage(res.error || "Delete failed", "error");
    }
  };
}

// ── Lecturer: Students ─────────────────────────────────────────
async function initStudentList() {
  requireAuth(["lecturer", "admin"]);
  const container = document.getElementById("studentList");
  if (!container) return;

  container.innerHTML = skeleton();

  const res = await apiGetStudents();
  if (!res.ok) { container.innerHTML = errorHtml(res.error); return; }

  const students = res.data.students || res.data || [];
  if (!students.length) { container.innerHTML = emptyHtml("No students found"); return; }

  container.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      ${students.map(s => `
        <div class="card hover:border-slate-600 transition-colors">
          <div class="w-10 h-10 rounded-full bg-amber-400/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold mb-3">
            ${s.name.charAt(0).toUpperCase()}
          </div>
          <h3 class="font-semibold text-white">${s.name}</h3>
          <p class="text-xs font-mono text-slate-400 mt-1">${s.email}</p>
          <p class="text-xs font-mono text-slate-500 mt-1">Joined: ${formatDate(s.createdAt)}</p>
        </div>
      `).join("")}
    </div>
    <p class="text-xs font-mono text-slate-500 mt-4">${students.length} student${students.length !== 1 ? 's' : ''}</p>`;
}

// ── Profile ────────────────────────────────────────────────────
async function initProfile() {
  const container = document.getElementById("profileContent");
  if (!container) return;

  container.innerHTML = skeleton();

  const res = await apiGetMe();
  if (!res.ok) { container.innerHTML = errorHtml(res.error); return; }

  const u = res.data.user || res.data;
  container.innerHTML = `
    <div class="card max-w-md">
      <div class="flex items-center gap-4 mb-6">
        <div class="w-16 h-16 rounded-full bg-amber-400/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-400 text-2xl font-bold">
          ${u.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 class="text-xl font-bold text-white">${u.name}</h2>
          <div class="mt-1">${roleBadge(u.role)}</div>
        </div>
      </div>
      <div class="space-y-4">
        ${profileRow("Email", u.email)}
        ${profileRow("Role", u.role)}
        ${profileRow("Member since", formatDate(u.createdAt))}
        ${u._id ? profileRow("User ID", u._id) : ""}
      </div>
    </div>`;
}

function profileRow(label, value) {
  return `
    <div class="flex items-center justify-between py-3 border-b border-navy-700">
      <span class="text-xs font-mono text-slate-400 uppercase tracking-wider">${label}</span>
      <span class="text-sm text-white font-mono">${value || "—"}</span>
    </div>`;
}

// ── Helpers ────────────────────────────────────────────────────
function skeleton() {
  return Array(4).fill(0).map(() =>
    `<div class="card animate-pulse mb-3"><div class="h-4 bg-navy-700 rounded w-1/2 mb-2"></div><div class="h-3 bg-navy-700 rounded w-1/3"></div></div>`
  ).join("");
}
function errorHtml(msg) {
  return `<div class="card border-red-600/40"><p class="text-red-400 font-mono text-sm">Error: ${msg}</p></div>`;
}
function emptyHtml(msg) {
  return `<div class="text-center py-16 text-slate-500 font-mono">${msg}</div>`;
}
