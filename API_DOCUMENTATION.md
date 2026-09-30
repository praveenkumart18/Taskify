# Taskify REST API Documentation

Taskify is a multi-user task management and smart random task picker backend built with Node.js, Express, MongoDB (Mongoose), and JWT authentication.

---

## 1. Architecture & Design Principles

- **Strict Multi-Tenant Isolation**: Every task list and task is tied to an authenticated `userId`. Cross-user access returns `404 Not Found` to prevent entity enumeration.
- **HTTP-Only Cookie Authentication**: Tokens are stored in secure, `httpOnly`, `sameSite: 'lax'` cookies.
- **Centralized Error Handling**: Standardized error responses across all endpoints.
- **High-Performance MongoDB Aggregations**:
  - `taskCount` computed dynamically via `$lookup` and `$size`.
  - Random task selection powered by native MongoDB `$sample: { size: 1 }`.
  - Built-in pagination and index optimization for 100+ tasks per list.

---

## 2. Base URL & Common Headers

- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`
- **Credentials**: Send cookies with `credentials: 'include'` (browser) or include `Cookie: token=...`.

---

## 3. Standard Response Format

### Success Response
```json
{
  "success": true,
  "message": "Optional human-readable message",
  "data": { ... }
}
```

### Paginated Response
```json
{
  "success": true,
  "count": 20,
  "total": 128,
  "page": 1,
  "pages": 7,
  "data": [ ... ]
}
```

### Error Response
```json
{
  "success": false,
  "message": "Specific error explanation"
}
```

---

## 4. Endpoints Overview

| Category | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| **Health** | `GET` | `/api/health` | No | System and MongoDB connection status |
| **Auth** | `POST` | `/api/auth/register` | No | Register new account and issue cookie |
| **Auth** | `POST` | `/api/auth/login` | No | Authenticate user and issue cookie |
| **Auth** | `POST` | `/api/auth/logout` | No | Invalidate session & clear cookie |
| **Auth** | `GET` | `/api/auth/me` | **Yes** | Get current logged-in user profile |
| **Task Lists** | `GET` | `/api/tasklists` | **Yes** | Get all task lists with task counts |
| **Task Lists** | `POST` | `/api/tasklists` | **Yes** | Create a new task list |
| **Task Lists** | `GET` | `/api/tasklists/:id` | **Yes** | Get single task list details |
| **Task Lists** | `PUT` | `/api/tasklists/:id` | **Yes** | Update task list name/description |
| **Task Lists** | `DELETE` | `/api/tasklists/:id` | **Yes** | Delete task list & cascade delete tasks |
| **Tasks** | `GET` | `/api/tasklists/:listId/tasks` | **Yes** | Get list tasks (search, filter, sort, paginate) |
| **Tasks** | `POST` | `/api/tasklists/:listId/tasks` | **Yes** | Create task in specified list |
| **Tasks** | `GET` | `/api/tasks/:taskId` | **Yes** | Get task by ID |
| **Tasks** | `PUT` | `/api/tasks/:taskId` | **Yes** | Update task details |
| **Tasks** | `DELETE` | `/api/tasks/:taskId` | **Yes** | Delete task |
| **Tasks** | `PATCH` | `/api/tasks/:taskId/status` | **Yes** | Toggle status (pending ↔ completed) |
| **Random** | `GET` | `/api/tasklists/:listId/random` | **Yes** | Pick random task ($sample with pending priority) |

---

## 5. Detailed Endpoint Specs

### 5.1 Health Check
- **`GET /api/health`**
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Taskify API is running smoothly",
  "status": "online",
  "database": {
    "status": "connected",
    "connected": true,
    "name": "taskify",
    "host": "cluster0.mongodb.net",
    "readyState": 1
  },
  "uptime": 1420,
  "timestamp": "2026-09-26T16:15:00.000Z"
}
```

---

### 5.2 Authentication

#### Register
- **`POST /api/auth/register`**
- **Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123!"
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "_id": "651f8a...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "createdAt": "2026-09-26T16:15:00.000Z"
  }
}
```

#### Login
- **`POST /api/auth/login`**
- **Request Body**:
```json
{
  "email": "jane@example.com",
  "password": "Password123!"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Logged in successfully",
  "user": {
    "_id": "651f8a...",
    "name": "Jane Doe",
    "email": "jane@example.com"
  }
}
```

#### Logout
- **`POST /api/auth/logout`**
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### Get Current Profile
- **`GET /api/auth/me`**
- **Response `200 OK`**:
```json
{
  "success": true,
  "user": {
    "_id": "651f8a...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "createdAt": "2026-09-26T16:15:00.000Z"
  }
}
```

---

### 5.3 Task Lists

#### Get All Lists
- **`GET /api/tasklists`**
- **Response `200 OK`**:
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "651f8b...",
      "name": "Interview Preparation",
      "description": "DSA, system design, mock interviews",
      "taskCount": 42,
      "updatedAt": "2026-09-26T16:15:00.000Z"
    }
  ]
}
```

#### Create List
- **`POST /api/tasklists`**
- **Request Body**:
```json
{
  "name": "College Work",
  "description": "Semester 7 subjects and assignments"
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "Task list created successfully",
  "data": {
    "_id": "651f8c...",
    "name": "College Work",
    "description": "Semester 7 subjects and assignments",
    "userId": "651f8a...",
    "taskCount": 0,
    "createdAt": "2026-09-26T16:15:00.000Z",
    "updatedAt": "2026-09-26T16:15:00.000Z"
  }
}
```

#### Delete List
- **`DELETE /api/tasklists/:id`**
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Task list and all associated tasks deleted successfully"
}
```

---

### 5.4 Tasks & Management

#### Get Tasks (Search, Filter, Sort, Paginate)
- **`GET /api/tasklists/:listId/tasks?status=pending&priority=high&search=hooks&sort=newest&page=1&limit=20`**
- **Query Parameters**:
  - `status`: `pending` | `completed`
  - `priority`: `low` | `medium` | `high`
  - `search`: string (matches in `title` or `description`)
  - `sort`: `newest` | `oldest` | `priority` | `dueDate`
  - `page`: integer (default 1)
  - `limit`: integer (default 20/50, max 100)
- **Response `200 OK`**:
```json
{
  "success": true,
  "count": 1,
  "total": 1,
  "page": 1,
  "pages": 1,
  "data": [
    {
      "_id": "651f8d...",
      "taskListId": "651f8c...",
      "title": "Practice React Hooks",
      "description": "Study useState, useEffect, useCallback",
      "priority": "high",
      "status": "pending",
      "dueDate": "2026-09-30T00:00:00.000Z",
      "createdAt": "2026-09-26T16:15:00.000Z",
      "updatedAt": "2026-09-26T16:15:00.000Z"
    }
  ]
}
```

#### Create Task
- **`POST /api/tasklists/:listId/tasks`**
- **Request Body**:
```json
{
  "title": "Study Node.js Streams",
  "description": "Read documentation on readable/writable streams",
  "priority": "medium",
  "dueDate": "2026-10-05"
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "_id": "651f8e...",
    "taskListId": "651f8c...",
    "title": "Study Node.js Streams",
    "description": "Read documentation on readable/writable streams",
    "priority": "medium",
    "status": "pending",
    "dueDate": "2026-10-05T00:00:00.000Z",
    "createdAt": "2026-09-26T16:15:00.000Z"
  }
}
```

#### Toggle Task Status
- **`PATCH /api/tasks/:taskId/status`**
- **Request Body (Optional)**: `{ "status": "completed" }` or empty body `{}` to toggle.
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Task marked as completed",
  "data": {
    "_id": "651f8e...",
    "status": "completed"
  }
}
```

---

### 5.5 Random Task Selection ($sample)

- **`GET /api/tasklists/:listId/random`**
- **Response (Pending task selected) `200 OK`**:
```json
{
  "success": true,
  "message": "Random pending task selected successfully",
  "data": {
    "_id": "651f8e...",
    "title": "Study Node.js Streams",
    "priority": "medium",
    "status": "pending"
  }
}
```
- **Response (All tasks completed) `200 OK`**:
```json
{
  "success": true,
  "message": "All tasks in this list are completed! Selected a completed task for review",
  "allCompleted": true,
  "data": {
    "_id": "651f8e...",
    "title": "Practice React Hooks",
    "status": "completed"
  }
}
```

---

## 6. HTTP Status Codes

- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation failure (empty title, invalid priority).
- `401 Unauthorized`: Missing or expired auth cookie/token.
- `404 Not Found`: Resource doesn't exist or belongs to another user.
- `409 Conflict`: Duplicate key error (email already registered).
- `413 Payload Too Large`: Request body exceeds 10kb limit.
- `500 Internal Server Error`: Unhandled server exception.
