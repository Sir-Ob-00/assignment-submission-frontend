# AssignHub — Frontend

A fully functional frontend for the Assignment Submission System, built with plain HTML, Tailwind CSS (CDN), and vanilla JavaScript ES modules.

---

## 📁 Folder Structure

```
assignment-frontend/
├── index.html              # Login page
├── register.html           # Registration page
├── dashboard.html          # Role-based dashboard
├── profile.html            # User profile
│
├── assignments/
│   ├── create.html         # Lecturer/Admin: create assignment
│   ├── list.html           # Lecturer/Admin: all assignments
│   ├── student.html        # Student: own assignments
│   └── submit.html         # Student: submit PDF
│
├── users/
│   ├── list.html           # Admin: all users + delete
│   └── students.html       # Lecturer: enrolled students
│
├── js/
│   ├── api.js              # All API fetch functions
│   ├── auth.js             # Login/register logic
│   ├── nav.js              # Shared navigation renderer
│   ├── dashboard.js        # (legacy - logic now inline)
│   ├── assignments.js      # Assignment logic module
│   ├── users.js            # User management module
│   └── utils.js            # Helpers: formatDate, showMessage, requireAuth
│
└── css/
    └── styles.css          # Full design system (dark navy + amber)
```

---

## ⚙️ Configuration

**Step 1:** Open `js/api.js` and update the base URL to match your backend:

```js
const BASE_URL = "http://localhost:5000";   // ← change this
```

---

## 🚀 Running Locally

The frontend uses ES modules (`type="module"`) which require a proper HTTP server — you **cannot** open the files directly with `file://`.

### Option 1: VS Code Live Server (recommended)
1. Install the **Live Server** extension in VS Code
2. Right-click `index.html` → **Open with Live Server**

### Option 2: Python HTTP server
```bash
cd assignment-frontend
python3 -m http.server 3000
# Open: http://localhost:3000
```

### Option 3: Node.js `serve`
```bash
npx serve assignment-frontend -p 3000
# Open: http://localhost:3000
```

---

## 🔑 Authentication Flow

1. User logs in at `index.html`
2. JWT token saved to `localStorage.token`
3. User object saved to `localStorage.user`
4. All pages use `requireAuth()` to check auth on load
5. All API calls include `Authorization: Bearer <token>`
6. `logout()` clears localStorage and redirects to login

---

## 👥 Role-Based Access

| Page | Student | Lecturer | Admin |
|------|---------|----------|-------|
| Dashboard | ✅ | ✅ | ✅ |
| My Assignments | ✅ | ❌ | ❌ |
| Submit Assignment | ✅ | ❌ | ❌ |
| Create Assignment | ❌ | ✅ | ✅ |
| All Assignments | ❌ | ✅ | ✅ |
| Student List | ❌ | ✅ | ✅ |
| User Management | ❌ | ❌ | ✅ |

Pages automatically redirect unauthorized users to `/dashboard.html`.

---

## 📄 PDF Submission

- Students select a PDF (drag & drop or click)
- File is validated: PDF type, max 10MB
- Uploaded via `multipart/form-data` with field name `file`
- After submission: displays a download link from `fileUrl`
- Already-submitted assignments are locked (can't re-submit)

---

## 🎨 Design System

- **Font:** DM Serif Display (headings) + IBM Plex Mono (data/labels) + Outfit (body)
- **Theme:** Dark navy (`#080d1a`) + amber accent (`#f59e0b`)
- **Components:** `.card`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.form-input`, `.data-table`, `.status-badge`
- Tailwind CSS loaded via CDN (no build step required)

---

## 🔧 Backend Requirements

Make sure your backend has:

```
CORS enabled for your frontend origin
Content-Type: application/json responses
JWT returned as { token, user } on login
File uploads accessible at /uploads/<filename>
```

---

## 📬 API Endpoints Used

| Method | Endpoint | Used by |
|--------|----------|---------|
| POST | `/api/auth/login` | Login page |
| POST | `/api/auth/register` | Register page |
| GET | `/api/users/me` | Profile page |
| GET | `/api/users` | Admin: user list |
| DELETE | `/api/users/:id` | Admin: delete user |
| GET | `/api/users/students` | Lecturer: student list |
| POST | `/api/assignments` | Lecturer: create |
| GET | `/api/assignments/all` | Lecturer/Admin: list |
| GET | `/api/assignments/student` | Student: own assignments |
| POST | `/api/assignments/submit/:id` | Student: submit PDF |
