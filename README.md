# Taskify — Full-Stack Multi-User Task Management & Smart Random Task Picker

Taskify is a full-stack web application designed for students, developers, and professionals to organize tasks into categorized lists and overcome decision paralysis through a random task picker powered by MongoDB `$sample` aggregations.

---

## 🌟 Key Features

1. **Authentication & Multi-Tenant Security**:
   - HTTP-only cookie-based JWT sessions.
   - Zero cross-user data leakage (cross-user access returns `404 Not Found`).
   - Password hashing with `bcryptjs`.
2. **Task Lists Management**:
   - Create, edit, and delete categorized lists.
   - Dynamic task counting via MongoDB `$lookup` aggregation.
   - Cascade deletion: deleting a list automatically cleans up all associated tasks.
3. **Task Management & Progress**:
   - Full CRUD on tasks (`title`, `description`, `priority`, `status`, `dueDate`).
   - Fast status toggling (`pending` ↔ `completed`).
   - Real-time progress tracking (`Completed: X / Y`, percentage completion bar).
   - Filtering by status, priority, real-time search, and flexible sorting.
4. **🎲 Smart Random Task Experience**:
   - Powered by MongoDB native `$sample: { size: 1 }`.
   - **Pending Priority**: Intelligently selects from pending tasks first.
   - **Completed Fallback**: When all tasks are done, offers completed tasks for review.
   - Roulette animation modal with "Start Task" and "Roll Again" actions.
5. **Production Hardening**:
   - Standard security headers and fingerprinting suppression (`x-powered-by` disabled).
   - Payload limiters (10kb) to prevent buffer exhaustion.
   - Centralized error handler catching Mongoose validation, duplicate keys, and invalid ObjectIds.
   - Support for 100+ tasks per list with pagination and indexed fields.

---

## 🏗️ Architecture

```
Taskify Application
│
├── server/
│   ├── config/db.js              # MongoDB Mongoose connection
│   ├── models/
│   │   ├── User.js               # User authentication model
│   │   ├── TaskList.js           # Task list with compound indexes
│   │   └── Task.js               # Task model with status, priority, dueDate
│   ├── controllers/
│   │   ├── authController.js     # Register, login, logout, me
│   │   ├── taskListController.js # List CRUD & taskCount aggregation
│   │   └── taskController.js     # Task CRUD, filters, and $sample random picker
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT cookie verification & user injection
│   │   └── errorMiddleware.js    # notFound (404) & centralized errorHandler
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth
│   │   ├── taskListRoutes.js     # /api/tasklists
│   │   └── taskRoutes.js         # /api/tasks and nested /:listId/tasks
│   └── app.js                    # Express configuration & security
│
└── src/
    ├── services/api.ts           # Typed API client with credentials: include
    ├── context/AuthContext.tsx   # React Auth State & session restoration
    ├── components/               # Modals, TaskCards, Filters, Progress
    └── App.tsx                   # Main SPA router & views
```

---

## 🚀 Getting Started

### 1. Installation & Environment
```bash
npm install
cp .env.example .env
```
Ensure your `.env` contains your `MONGO_URI` and `JWT_SECRET`.

### 2. Development Mode
```bash
npm run dev
```
Starts the full-stack Express + Vite server at `http://localhost:3000`.

### 3. API Testing with Postman
Import `postman_collection.json` directly into Postman to run pre-configured test requests.
