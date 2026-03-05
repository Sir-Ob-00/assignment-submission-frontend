// ============================================================
//  nav.js — Shared navigation renderer
// ============================================================
import { getUser, logout, roleBadge } from "./utils.js";

export function renderNav(activePage = "") {
  const user = getUser();
  if (!user) return;

  const navLinks = {
    all: [
      { href: "/dashboard.html",          label: "Dashboard",  page: "dashboard" },
      { href: "/profile.html",             label: "Profile",    page: "profile"   },
    ],
    student: [
      { href: "/assignments/student.html", label: "My Assignments", page: "student-assignments" },
      { href: "/assignments/submit.html",  label: "Submit",         page: "submit"              },
    ],
    lecturer: [
      { href: "/assignments/list.html",    label: "Assignments", page: "list-all"    },
      { href: "/assignments/create.html",  label: "Create",      page: "create"      },
      { href: "/users/students.html",      label: "Students",    page: "student-list"},
    ],
    admin: [
      { href: "/assignments/list.html",    label: "Assignments", page: "list-all"  },
      { href: "/assignments/create.html",  label: "Create",      page: "create"    },
      { href: "/users/list.html",          label: "Users",       page: "user-list" },
    ],
  };

  const roleLinks  = navLinks[user.role] || [];
  const sharedLinks = navLinks.all;
  const allLinks   = [...sharedLinks, ...roleLinks];

  const linksHtml = allLinks.map(l =>
    `<a href="${l.href}" class="nav-link ${activePage === l.page ? 'active' : ''}">${l.label}</a>`
  ).join("");

  const navHtml = `
    <nav class="navbar" id="main-nav">
      <div style="display:flex;align-items:center;gap:32px;">
        <a href="/dashboard.html" class="nav-brand">AssignHub</a>
        <div id="nav-links" style="display:flex;gap:4px;align-items:center;" class="hidden md:flex">
          ${linksHtml}
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:12px;">
        <div style="text-align:right;" class="hidden sm:block">
          <p id="nav-name" style="font-size:0.85rem;font-weight:600;color:white;line-height:1.2;">${user.name || "User"}</p>
          <div id="nav-role" style="margin-top:2px;">${roleBadge(user.role)}</div>
        </div>
        <button id="logoutBtn" class="btn-secondary" style="padding:7px 14px;font-size:0.78rem;">
          Sign out
        </button>
        <!-- Mobile menu toggle -->
        <button id="mobileMenuBtn" class="md:hidden" style="background:none;border:none;cursor:pointer;color:#94a3b8;padding:4px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>
    </nav>

    <!-- Mobile menu -->
    <div id="mobile-menu" style="display:none;background:#0d1426;border-bottom:1px solid #1e2e4a;padding:12px 24px 16px;">
      ${allLinks.map(l => `<a href="${l.href}" class="nav-link" style="display:block;padding:10px 0;border-bottom:1px solid #152038;">${l.label}</a>`).join("")}
    </div>
  `;

  // Insert at top of body
  document.body.insertAdjacentHTML("afterbegin", navHtml);

  // Mobile menu toggle
  document.getElementById("mobileMenuBtn")?.addEventListener("click", () => {
    const m = document.getElementById("mobile-menu");
    m.style.display = m.style.display === "none" ? "block" : "none";
  });

  document.getElementById("logoutBtn")?.addEventListener("click", logout);
}
