# 🏕️ Project Camp Backend

> A RESTful API service powering a collaborative project management platform — built for teams who need structured workflows, fine-grained access control, and async collaboration tools.

![Version](https://img.shields.io/badge/version-2.0-blue)
![Status](https://img.shields.io/badge/status-in%20review-yellow)
![API](https://img.shields.io/badge/type-REST%20API-green)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Data Models](#data-models)
- [Permission Matrix](#permission-matrix)
- [Error Handling](#error-handling)
- [File Uploads](#file-uploads)
- [Non-Functional Requirements](#non-functional-requirements)

---

## Overview

**Project Camp Backend** provides the complete server-side foundation for teams to:

- Organise work into **Projects** with member-based access
- Break down work into **Tasks** and **Subtasks** with assignees and statuses
- Share **Notes** for documentation, decisions, and meeting summaries
- Attach **Files** directly to tasks
- Enforce access boundaries through a **three-tier role-based permission system**

> **Scope:** Backend API only. Frontend clients, mobile apps, and third-party integrations are out of scope.

---

## Features

### 🔐 Authentication & Authorization
- JWT-based stateless auth (access + refresh token pair)
- Refresh token rotation — single-use, 7-day lifetime
- Email verification on registration
- Forgot/reset password via time-limited email link
- Bcrypt password hashing (salt rounds ≥ 12)

### 📁 Project Management
- Create and manage projects with name and description
- Role-based membership — Admin, Project Admin, Member
- Add members by email; remove members without deleting their created tasks

### ✅ Task Management
- Tasks with title, description, assignee, and status (`todo` / `in_progress` / `done`)
- Filter tasks by status and assignee
- Attach multiple files per task (up to 10 MB each)

### 🔩 Subtask Management
- Break tasks into subtasks with individual completion tracking
- All roles can toggle subtask completion — enabling distributed ownership

### 📝 Project Notes
- Shared, persistent notes for documentation and reference
- Markdown-friendly content field
- Admin-controlled write access; all members can read

### ❤️ Health Check
- Unauthenticated endpoint for load balancer and uptime monitoring

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| API Style | RESTful, versioned (`/api/v1`) |
| Authentication | JWT (HS256 / RS256) |
| Password Hashing | bcrypt |
| Input Validation | Zod / Joi |
| File Uploads | Multer |
| Database | MongoDB (with ObjectId references) |
| Email Delivery | Nodemailer or equivalent |
| Storage | Local (`public/images/`) or Cloud bucket |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18.x
- MongoDB instance (local or Atlas)
- SMTP credentials for email delivery

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/project-camp-backend.git
cd project-camp-backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in the required values (see Environment Variables below)

# Start the development server
npm run dev
```

### Health Check

Once the server is running, confirm it's live:

```bash
curl http://localhost:PORT/api/v1/healthcheck/
```

Expected response:

```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "ok",
    "version": "2.0.0",
    "uptime": 42.3
  }
}
```

---

## Environment Variables

Create a `.env` file at the project root. **Never commit secrets to source control.**

```env
# Server
PORT=8000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/project-camp

# JWT
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password
EMAIL_FROM=no-reply@projectcamp.dev

# CORS
ALLOWED_ORIGINS=https://yourfrontend.com

# File Storage
STORAGE_TYPE=local           # or "cloud"
CLOUD_BUCKET_NAME=           # if using cloud storage
```

---

## API Reference

**Base URL:** `/api/v1`  
**Auth Header:** `Authorization: Bearer <access_token>`

---

### Authentication — `/api/v1/auth/`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register a new user account |
| `GET` | `/auth/verify-email/:token` | Public | Verify email via token link |
| `POST` | `/auth/login` | Public | Authenticate and receive token pair |
| `POST` | `/auth/logout` | Bearer | Invalidate the current refresh token |
| `GET` | `/auth/current-user` | Bearer | Get the authenticated user's profile |
| `POST` | `/auth/refresh-token` | Refresh token | Issue a new access token |
| `POST` | `/auth/change-password` | Bearer | Update the authenticated user's password |
| `POST` | `/auth/forgot-password` | Public | Request a password reset email |
| `POST` | `/auth/reset-password/:token` | Public | Reset password using the emailed token |
| `POST` | `/auth/resend-email-verification` | Bearer | Resend the email verification link |

---

### Projects — `/api/v1/projects/`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/projects/` | Bearer | List all projects for the current user |
| `POST` | `/projects/` | Bearer | Create a new project |
| `GET` | `/projects/:projectId` | Bearer + role | Get project details |
| `PUT` | `/projects/:projectId` | Admin | Update project name / description |
| `DELETE` | `/projects/:projectId` | Admin | Delete project and all its data |
| `GET` | `/projects/:projectId/members` | Bearer + role | List project members and their roles |
| `POST` | `/projects/:projectId/members` | Admin | Add a member by email |
| `PUT` | `/projects/:projectId/members/:userId` | Admin | Change a member's role |
| `DELETE` | `/projects/:projectId/members/:userId` | Admin | Remove a member from the project |

---

### Tasks — `/api/v1/tasks/`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/tasks/:projectId` | Bearer + role | List all tasks in the project |
| `POST` | `/tasks/:projectId` | Admin / Project Admin | Create a new task |
| `GET` | `/tasks/:projectId/t/:taskId` | Bearer + role | Get full task details |
| `PUT` | `/tasks/:projectId/t/:taskId` | Admin / Project Admin | Update task fields |
| `DELETE` | `/tasks/:projectId/t/:taskId` | Admin / Project Admin | Delete task and its subtasks |
| `POST` | `/tasks/:projectId/t/:taskId/subtasks` | Admin / Project Admin | Add a subtask |
| `PUT` | `/tasks/:projectId/st/:subTaskId` | Bearer + role | Update a subtask |
| `DELETE` | `/tasks/:projectId/st/:subTaskId` | Admin / Project Admin | Delete a subtask |

---

### Notes — `/api/v1/notes/`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/notes/:projectId` | Bearer + role | List all notes in the project |
| `POST` | `/notes/:projectId` | Admin | Create a new note |
| `GET` | `/notes/:projectId/n/:noteId` | Bearer + role | Get note details |
| `PUT` | `/notes/:projectId/n/:noteId` | Admin | Update note content |
| `DELETE` | `/notes/:projectId/n/:noteId` | Admin | Delete a note |

---

### Health Check — `/api/v1/healthcheck/`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/healthcheck/` | Public | Returns service status and uptime |

---

## Data Models

### User
| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | ✅ | Auto-generated |
| `name` | String | ✅ | Display name |
| `email` | String | ✅ | Unique, stored lowercased |
| `password` | String | ✅ | Bcrypt-hashed; never returned in responses |
| `isEmailVerified` | Boolean | ✅ | Defaults `false` |
| `emailVerificationToken` | String | ❌ | Hashed one-time token |
| `passwordResetToken` | String | ❌ | Hashed one-time token |
| `passwordResetExpiry` | Date | ❌ | Expiry for reset token |
| `createdAt` / `updatedAt` | Date | ✅ | Auto-managed |

### Project
| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | ✅ | Auto-generated |
| `name` | String | ✅ | Project display name |
| `description` | String | ❌ | Optional |
| `createdBy` | ObjectId (User) | ✅ | Creator is assigned Admin role |
| `members` | Array | ✅ | `[{ user: ObjectId, role: Enum }]` |
| `createdAt` / `updatedAt` | Date | ✅ | Auto-managed |

### Task
| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | ✅ | Auto-generated |
| `project` | ObjectId (Project) | ✅ | Parent project |
| `title` | String | ✅ | Task title |
| `description` | String | ❌ | Optional |
| `assignedTo` | ObjectId (User) | ❌ | Project member |
| `status` | Enum | ✅ | `todo` \| `in_progress` \| `done` |
| `subtasks` | ObjectId[] | ❌ | References to SubTask documents |
| `attachments` | Array | ❌ | `[{ url, mimeType, size }]` |
| `createdBy` | ObjectId (User) | ✅ | Creating user |
| `createdAt` / `updatedAt` | Date | ✅ | Auto-managed |

### SubTask
| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | ✅ | Auto-generated |
| `task` | ObjectId (Task) | ✅ | Parent task |
| `title` | String | ✅ | Subtask title |
| `description` | String | ❌ | Optional |
| `isCompleted` | Boolean | ✅ | Defaults `false` |
| `createdBy` | ObjectId (User) | ✅ | Creating user |
| `createdAt` / `updatedAt` | Date | ✅ | Auto-managed |

### Note
| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | ✅ | Auto-generated |
| `project` | ObjectId (Project) | ✅ | Parent project |
| `title` | String | ✅ | Note heading |
| `content` | String | ✅ | Markdown recommended |
| `createdBy` | ObjectId (User) | ✅ | Creating Admin |
| `createdAt` / `updatedAt` | Date | ✅ | Auto-managed |

---

## Permission Matrix

| Action | Admin | Project Admin | Member |
|---|:---:|:---:|:---:|
| Create Project | ✅ | ❌ | ❌ |
| Update / Delete Project | ✅ | ❌ | ❌ |
| Manage Project Members | ✅ | ❌ | ❌ |
| Create / Update / Delete Tasks | ✅ | ✅ | ❌ |
| View Tasks | ✅ | ✅ | ✅ |
| Create / Delete Subtasks | ✅ | ✅ | ❌ |
| Update Subtask Status | ✅ | ✅ | ✅ |
| Upload File Attachments | ✅ | ✅ | ❌ |
| View File Attachments | ✅ | ✅ | ✅ |
| Create / Update / Delete Notes | ✅ | ❌ | ❌ |
| View Notes | ✅ | ✅ | ✅ |

---

## Error Handling

All responses — success or error — follow a consistent envelope:

**Success**
```json
{
  "success": true,
  "message": "Projects fetched successfully",
  "data": {}
}
```

**Error**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Must be a valid email address" }
  ]
}
```

### HTTP Status Codes

| Code | When |
|---|---|
| `200 OK` | Successful `GET` or `PUT` |
| `201 Created` | Successful `POST` that creates a resource |
| `400 Bad Request` | Malformed request body or query parameters |
| `401 Unauthorized` | Missing or invalid/expired token |
| `403 Forbidden` | Valid token but insufficient role |
| `404 Not Found` | Resource does not exist or user lacks access |
| `409 Conflict` | Duplicate resource (e.g. email already registered) |
| `422 Unprocessable Entity` | Validation errors with per-field details |
| `500 Internal Server Error` | Unexpected server-side failure |

---

## File Uploads

| Constraint | Value |
|---|---|
| Max file size | 10 MB per file |
| Accepted MIME types | `image/*`, `application/pdf`, `text/plain`, `application/msword`, `application/vnd.openxmlformats-officedocument.*` |
| Upload middleware | Multer — validation runs before controller logic |
| Filename handling | Sanitised to remove path traversal characters |
| Storage (dev) | `public/images/` |
| Storage (prod) | Cloud bucket |

File metadata (URL, MIME type, byte size) is stored inside the parent task document and returned in all task detail responses.

---

## Non-Functional Requirements

### Performance
- p95 response time < 200ms for non-file endpoints
- List endpoints paginated — default 20 items/page, configurable up to 100
- Database indexes on: `user.email`, `projectMember.userId`, `task.projectId`, `task.status`
- File uploads streamed directly to storage; binary data never loaded into app memory

### Reliability
- 99.5% monthly uptime target
- Database connection pooling with automatic reconnect
- All errors return structured JSON (with stack trace in dev only)

### Security
- All traffic over HTTPS / TLS 1.2+ in production
- CORS allowlist — wildcard `*` disallowed in production
- Rate limiting on all auth endpoints
- Password reset and email verification tokens: single-use, expire within 24 hours, stored as hashes

### Developer Experience
- Versioned API namespace (`/api/v1/`) for non-breaking future changes
- Centralised middleware for auth, role checking, error handling, and logging
- All config via environment variables — no secrets in source control
- Test coverage target: ≥ 80% unit + integration

---

## Revision History

| Version | Date | Changes |
|---|---|---|
| 1.0 | April 2026 | Initial release |
| 2.0 | April 30, 2026 | Added goals, success metrics, data models, permission matrix, security section, NFRs, error standards, file management |
