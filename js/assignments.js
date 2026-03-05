// ============================================================
//  assignments.js — Assignment CRUD & submission logic
// ============================================================
import {
  apiCreateAssignment, apiGetAllAssignments,
  apiGetStudentAssignments, apiSubmitAssignment, BASE_URL
} from "./api.js";
import { requireAuth, getUser, logout, formatDate, formatDateTime, isOverdue, roleBadge, showMessage } from "./utils.js";

if (!requireAuth()) throw new Error("unauth");

const user = getUser();
initNav();

const page = document.body.dataset.page;

if (page === "create")          initCreate();
if (page === "list-all")        initListAll();
if (page === "list-student")    initListStudent();
if (page === "submit")          initSubmit();

// ── Navigation ─────────────────────────────────────────────────
function initNav() {
  document.getElementById("nav-name")?.setAttribute("textContent", user?.name);
  const nn = document.getElementById("nav-name");
  if (nn) nn.textContent = user?.name || "User";
  const nr = document.getElementById("nav-role");
  if (nr) nr.innerHTML  = roleBadge(user?.role);
  document.getElementById("logoutBtn")?.addEventListener("click", logout);
  document.querySelectorAll("[data-role]").forEach(el => {
    const roles = el.dataset.role.split(",");
    if (!roles.includes(user?.role)) el.classList.add("hidden");
  });
}

// ── Create Assignment ──────────────────────────────────────────
function initCreate() {
  requireAuth(["lecturer", "admin"]);
  const form = document.getElementById("createForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "Creating…";

    const payload = {
      title:       document.getElementById("title").value.trim(),
      description: document.getElementById("description").value.trim(),
      dueDate:     document.getElementById("dueDate").value,
    };

    const res = await apiCreateAssignment(payload);
    if (res.ok) {
      showMessage("Assignment created successfully!", "success");
      form.reset();
    } else {
      showMessage(res.error || "Failed to create", "error");
    }
    btn.disabled = false; btn.textContent = "Create Assignment";
  });
}

// ── List All (Lecturer/Admin) ──────────────────────────────────
async function initListAll() {
  requireAuth(["lecturer", "admin"]);
  const container = document.getElementById("assignmentList");
  if (!container) return;

  container.innerHTML = skeleton();

  const res = await apiGetAllAssignments();
  if (!res.ok) { container.innerHTML = errorHtml(res.error); return; }

  const assignments = res.data.assignments || res.data || [];

  if (!assignments.length) {
    container.innerHTML = emptyHtml("No assignments found");
    return;
  }

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Description</th>
          <th>Due Date</th>
          <th>Status</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        ${assignments.map(a => `
          <tr>
            <td class="font-semibold text-white">${a.title}</td>
            <td class="text-slate-400 max-w-xs truncate">${a.description || "—"}</td>
            <td class="font-mono text-sm">${formatDate(a.dueDate)}</td>
            <td>${isOverdue(a.dueDate)
              ? `<span class="status-badge bg-red-900/40 text-red-300 border-red-600/40">Overdue</span>`
              : `<span class="status-badge bg-emerald-900/40 text-emerald-300 border-emerald-600/40">Active</span>`}
            </td>
            <td class="font-mono text-xs text-slate-400">${formatDate(a.createdAt)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>`;
}

// ── Student: List Own Assignments ──────────────────────────────
async function initListStudent() {
  requireAuth(["student"]);
  const container = document.getElementById("assignmentList");
  if (!container) return;

  container.innerHTML = skeleton();

  const res = await apiGetStudentAssignments();
  if (!res.ok) { container.innerHTML = errorHtml(res.error); return; }

  const assignments = res.data.assignments || res.data || [];

  if (!assignments.length) {
    container.innerHTML = emptyHtml("No assignments assigned to you yet");
    return;
  }

  container.innerHTML = `
    <div class="grid gap-4">
      ${assignments.map(a => `
        <div class="card hover:border-amber-500/30 transition-colors">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <h3 class="font-bold text-white text-lg mb-1">${a.title}</h3>
              <p class="text-slate-400 text-sm mb-3">${a.description || ""}</p>
              <div class="flex flex-wrap gap-3 text-xs font-mono text-slate-400">
                <span>Due: <span class="${isOverdue(a.dueDate) && !a.submitted ? 'text-red-400' : 'text-slate-300'}">${formatDate(a.dueDate)}</span></span>
                ${a.submittedAt ? `<span>Submitted: <span class="text-emerald-300">${formatDateTime(a.submittedAt)}</span></span>` : ""}
                ${a.fileUrl ? `<a href="${BASE_URL}/${a.fileUrl}" target="_blank" class="text-amber-400 hover:underline">📎 View submission</a>` : ""}
              </div>
            </div>
            <div class="shrink-0">
              ${a.submitted
                ? `<span class="status-badge bg-emerald-900/50 text-emerald-300 border-emerald-600/40">✓ Submitted</span>`
                : `<a href="/assignments/submit.html?id=${a._id}" class="btn-primary text-sm">Submit →</a>`
              }
            </div>
          </div>
        </div>
      `).join("")}
    </div>`;
}

// ── Student: Submit Assignment ─────────────────────────────────
async function initSubmit() {
  requireAuth(["student"]);

  const urlParams     = new URLSearchParams(window.location.search);
  const assignmentId  = urlParams.get("id");
  const form          = document.getElementById("submitForm");

  if (!assignmentId) {
    showMessage("No assignment specified", "error");
    return;
  }

  // Pre-load assignment info
  const res = await apiGetStudentAssignments();
  if (res.ok) {
    const assignments = res.data.assignments || res.data || [];
    const assignment  = assignments.find(a => a._id === assignmentId);
    if (assignment) {
      const titleEl = document.getElementById("assignment-title");
      const dueEl   = document.getElementById("assignment-due");
      if (titleEl) titleEl.textContent = assignment.title;
      if (dueEl)   dueEl.textContent   = `Due: ${formatDate(assignment.dueDate)}`;

      if (assignment.submitted) {
        showMessage("You have already submitted this assignment.", "info");
        if (form) form.querySelector("button[type=submit]").disabled = true;
      }
    }
  }

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn  = form.querySelector("button[type=submit]");
    const file = document.getElementById("file").files[0];

    if (!file) { showMessage("Please select a PDF file", "error"); return; }
    if (file.type !== "application/pdf") { showMessage("Only PDF files are allowed", "error"); return; }
    if (file.size > 10 * 1024 * 1024) { showMessage("File must be under 10MB", "error"); return; }

    btn.disabled = true; btn.textContent = "Uploading…";

    const formData = new FormData();
    formData.append("file", file);

    const submitRes = await apiSubmitAssignment(assignmentId, formData);
    if (submitRes.ok) {
      showMessage("Assignment submitted successfully! 🎉", "success");
      btn.textContent = "Submitted ✓";

      const fileUrl = submitRes.data.fileUrl || submitRes.data.submission?.fileUrl;
      if (fileUrl) {
        const linkContainer = document.getElementById("file-link");
        if (linkContainer) {
          linkContainer.innerHTML = `<a href="${BASE_URL}/${fileUrl}" target="_blank" class="text-amber-400 underline font-mono text-sm">📎 View your submission</a>`;
          linkContainer.classList.remove("hidden");
        }
      }
    } else {
      showMessage(submitRes.error || "Submission failed", "error");
      btn.disabled = false; btn.textContent = "Submit Assignment";
    }
  });
}

// ── Helpers ────────────────────────────────────────────────────
function skeleton() {
  return Array(3).fill(0).map(() =>
    `<div class="card animate-pulse mb-4"><div class="h-4 bg-navy-700 rounded w-1/2 mb-2"></div><div class="h-3 bg-navy-700 rounded w-1/3"></div></div>`
  ).join("");
}

function errorHtml(msg) {
  return `<div class="card border-red-600/40"><p class="text-red-400 font-mono text-sm">Error: ${msg}</p></div>`;
}

function emptyHtml(msg) {
  return `<div class="text-center py-16 text-slate-500 font-mono">${msg}</div>`;
}
