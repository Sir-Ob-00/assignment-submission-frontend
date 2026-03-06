import { defineConfig } from "vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        dashboard: resolve(__dirname, "dashboard.html"),
        profile: resolve(__dirname, "profile.html"),
        register: resolve(__dirname, "register.html"),
        assignmentsCreate: resolve(__dirname, "assignments/create.html"),
        assignmentsList: resolve(__dirname, "assignments/list.html"),
        assignmentsStudent: resolve(__dirname, "assignments/student.html"),
        assignmentsSubmit: resolve(__dirname, "assignments/submit.html"),
        usersList: resolve(__dirname, "users/list.html"),
        usersStudents: resolve(__dirname, "users/students.html"),
      },
    },
  },
});
