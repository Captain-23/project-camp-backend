# Project Camp Backend — Product Requirements Document

> **Version:** 2.0 &nbsp;|&nbsp; **Status:** In Review &nbsp;|&nbsp; **Date:** April 30, 2026 &nbsp;|&nbsp; **Type:** Backend API

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Goals & Success Criteria](#2-goals--success-criteria)
3. [Target Users & Roles](#3-target-users--roles)
4. [Core Features](#4-core-features)
5. [API Reference](#5-api-reference)
6. [Data Models](#6-data-models)
7. [Permission Matrix](#7-permission-matrix)
8. [Security Requirements](#8-security-requirements)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Error Handling & Response Standards](#10-error-handling--response-standards)
11. [File Management](#11-file-management)
12. [Revision History](#12-revision-history)

---

## 1. Executive Summary

**Project Camp Backend** is a RESTful API service that powers a collaborative project management platform. It provides the complete server-side foundation for teams to organise projects, manage hierarchical tasks and subtasks, share notes, and enforce access boundaries through a three-tier role-based permission system.

> **Vision:** Deliver a secure, scalable, and developer-friendly backend API that enables teams of any size to collaborate on projects with fine-grained control over who can see and do what.

> **Scope:** Backend API only. Authentication, authorisation, data persistence, file handling, and email delivery are all **in scope**. Frontend clients, mobile apps, and third-party integrations are **out of scope**.

---

## 2. Goals & Success Criteria

### 2.1 Business Goals

- Provide a production-ready API that development teams can onboard and integrate within hours
- Reduce coordination overhead by enforcing clear responsibility boundaries through role permissions
- Enable async collaboration through shared notes, file attachments, and subtask delegation

### 2.2 Success Metrics

| Metric | Target |
|---|---|
| API response time (p95) | < 200ms for non-file endpoints |
| Authentication security | JWT access tokens + refresh token rotation |
| Test coverage | ≥ 80% unit + integration coverage |
| Uptime | 99.5% monthly availability |
| Email delivery | Verification and reset emails sent within 30 seconds |
| File upload | Support attachments up to 10MB per file |

---

## 3. Target Users & Roles

| Role | Responsibilities | Typical User |
|---|---|---|
| **Admin** | Full system access: creates and deletes projects, manages members and roles, administers all content | Team lead, project owner, engineering manager |
| **Project Admin** | Manages tasks and subtasks within assigned projects; cannot modify project settings or membership | Tech lead, senior developer, QA lead |
| **Member** | Views project content, updates subtask completion status, accesses shared notes and files | Developer, designer, stakeholder |

---

## 4. Core Features

### 4.1 User Authentication & Authorization

All authentication follows a stateless JWT pattern. Access tokens are short-lived; refresh tokens allow session extension without re-authentication. All sensitive operations require email verification before activation.

- **User Registration** — Collect email, name, and hashed password; send verification email on signup
- **Email Verification** — One-time token link confirms account ownership before access is granted
- **Login / Logout** — Issues signed access + refresh token pair on login; logout invalidates the refresh token
- **Token Refresh** — Exchange a valid refresh token for a new access token without re-login
- **Change Password** — Authenticated users may update their own password at any time
- **Forgot / Reset Password** — Sends a time-limited reset link via email; token is invalidated on use
- **Resend Verification** — Re-issues a verification email if the previous link has expired
- **Current User** — Returns the authenticated user's profile data derived from the token

> **Security note:** Password reset and email verification tokens must be single-use, expire within 24 hours, and be stored as hashes — never plaintext.

---

### 4.2 Project Management

Projects are the top-level container for all work. Each project has exactly one Admin (its creator) and can have any number of Project Admins and Members.

- **Create Project** — Name and description required; creator is automatically assigned the Admin role
- **List Projects** — Returns all projects the authenticated user belongs to, including member count
- **Project Details** — Returns project metadata alongside the current user's role within the project
- **Update Project** — Admin-only; modify project name and description
- **Delete Project** — Admin-only; cascades deletion of all tasks, subtasks, notes, and file metadata

---

### 4.3 Team Member Management

Members are invited by email. If the email matches an existing account they are added directly; unrecognised emails return an appropriate error rather than auto-creating accounts.

- **Add Member** — Admin adds user by email; default role is Member
- **List Members** — Any project member can view the full member list with roles
- **Update Role** — Admin-only; change a member's role between Project Admin and Member
- **Remove Member** — Admin-only; member loses all access; their previously created tasks are retained

---

### 4.4 Task Management

Tasks are the primary unit of work within a project. Each task can be assigned to one team member, carry multiple file attachments, and contain any number of subtasks.

- **Create Task** — Title required; description, assignee, and status are optional (status defaults to `todo`)
- **List Tasks** — All project members; supports filtering by status and assignee
- **Task Details** — Full task info including subtask list and file attachment metadata
- **Update Task** — Admin/Project Admin; modify title, description, assignee, and status
- **Delete Task** — Admin/Project Admin; cascades deletion of all subtasks and file metadata
- **File Attachments** — Multiple files per task; stores URL, MIME type, and file size

#### Task Status Lifecycle

| Status | Value | Meaning |
|---|---|---|
| To Do | `todo` | Task has been created but work has not started |
| In Progress | `in_progress` | Task is actively being worked on |
| Done | `done` | Task is complete; all subtasks should be resolved |

---

### 4.5 Subtask Management

Subtasks provide fine-grained decomposition of tasks. Any team member can mark a subtask complete, enabling distributed ownership within a single task.

- **Create Subtask** — Admin/Project Admin; attached to a parent task with title and optional description
- **Update Subtask** — All roles can toggle completion status; Admin/Project Admin can also edit title and description
- **Delete Subtask** — Admin/Project Admin only

---

### 4.6 Project Notes

Notes provide a shared, persistent space for project-level documentation, meeting summaries, decision logs, and reference material. Only Admins can manage notes; all members can read them.

- **Create Note** — Admin only; title and body content required
- **List Notes** — All project members; returns list with titles and creation metadata
- **Note Details** — Full note content including last-modified timestamp
- **Update Note** — Admin only; updates body and refreshes last-modified timestamp
- **Delete Note** — Admin only

---

### 4.7 Health Check

- **`GET /api/v1/healthcheck/`** — Unauthenticated endpoint; returns `200 OK` with service status, version, and uptime for load balancer and monitoring integration

---

## 5. API Reference

**Base URL:** `/api/v1`  
**Auth header:** `Authorization: Bearer <access_token>`

---

### 5.1 Authentication — `/api/v1/auth/`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register a new user account |
| `GET` | `/auth/verify-email/:token` | Public | Verify email address via token link |
| `POST` | `/auth/login` | Public | Authenticate and receive access + refresh token pair |
| `POST` | `/auth/logout` | Bearer token | Invalidate the current refresh token |
| `GET` | `/auth/current-user` | Bearer token | Get the authenticated user's profile |
| `POST` | `/auth/refresh-token` | Refresh token | Issue a new access token |
| `POST` | `/auth/change-password` | Bearer token | Update the authenticated user's password |
| `POST` | `/auth/forgot-password` | Public | Request a password reset email |
| `POST` | `/auth/reset-password/:token` | Public | Reset password using the emailed token |
| `POST` | `/auth/resend-email-verification` | Bearer token | Resend the email verification link |

---

### 5.2 Projects — `/api/v1/projects/`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/projects/` | Bearer token | List all projects for the current user |
| `POST` | `/projects/` | Bearer token | Create a new project |
| `GET` | `/projects/:projectId` | Bearer + role check | Get project details |
| `PUT` | `/projects/:projectId` | Admin only | Update project name / description |
| `DELETE` | `/projects/:projectId` | Admin only | Delete project and all its data |
| `GET` | `/projects/:projectId/members` | Bearer + role check | List project members and their roles |
| `POST` | `/projects/:projectId/members` | Admin only | Add a member by email |
| `PUT` | `/projects/:projectId/members/:userId` | Admin only | Change a member's role |
| `DELETE` | `/projects/:projectId/members/:userId` | Admin only | Remove a member from the project |

---

### 5.3 Tasks — `/api/v1/tasks/`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/tasks/:projectId` | Bearer + role check | List all tasks in the project |
| `POST` | `/tasks/:projectId` | Admin / Project Admin | Create a new task |
| `GET` | `/tasks/:projectId/t/:taskId` | Bearer + role check | Get full task details |
| `PUT` | `/tasks/:projectId/t/:taskId` | Admin / Project Admin | Update task fields |
| `DELETE` | `/tasks/:projectId/t/:taskId` | Admin / Project Admin | Delete task and its subtasks |
| `POST` | `/tasks/:projectId/t/:taskId/subtasks` | Admin / Project Admin | Add a subtask to a task |
| `PUT` | `/tasks/:projectId/st/:subTaskId` | Bearer + role check | Update a subtask |
| `DELETE` | `/tasks/:projectId/st/:subTaskId` | Admin / Project Admin | Delete a subtask |

---

### 5.4 Notes — `/api/v1/notes/`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/notes/:projectId` | Bearer + role check | List all notes in the project |
| `POST` | `/notes/:projectId` | Admin only | Create a new note |
| `GET` | `/notes/:projectId/n/:noteId` | Bearer + role check | Get note details |
| `PUT` | `/notes/:projectId/n/:noteId` | Admin only | Update note content |
| `DELETE` | `/notes/:projectId/n/:noteId` | Admin only | Delete a note |

---

### 5.5 Health Check — `/api/v1/healthcheck/`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/healthcheck/` | Public | Returns service status and uptime |

---

## 6. Data Models

### 6.1 User

| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | `ObjectId` | Yes | Unique identifier |
| `name` | `String` | Yes | Display name |
| `email` | `String` | Yes | Unique email address, stored lowercased |
| `password` | `String` | Yes | Bcrypt-hashed; never returned in API responses |
| `isEmailVerified` | `Boolean` | Yes | True after email verification; defaults `false` |
| `emailVerificationToken` | `String` | No | Hashed one-time token for email confirmation |
| `passwordResetToken` | `String` | No | Hashed one-time token for password reset |
| `passwordResetExpiry` | `Date` | No | Expiry timestamp for the reset token |
| `createdAt` | `Date` | Yes | Auto-generated on creation |
| `updatedAt` | `Date` | Yes | Auto-updated on modification |

---

### 6.2 Project

| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | `ObjectId` | Yes | Unique identifier |
| `name` | `String` | Yes | Project display name |
| `description` | `String` | No | Optional project description |
| `createdBy` | `ObjectId (User)` | Yes | Reference to the creating user (Admin) |
| `members` | `Array` | Yes | List of `{ user: ObjectId, role: Enum }` objects |
| `createdAt` | `Date` | Yes | Auto-generated on creation |
| `updatedAt` | `Date` | Yes | Auto-updated on modification |

---

### 6.3 Task

| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | `ObjectId` | Yes | Unique identifier |
| `project` | `ObjectId (Project)` | Yes | Parent project reference |
| `title` | `String` | Yes | Task title |
| `description` | `String` | No | Optional task description |
| `assignedTo` | `ObjectId (User)` | No | Project member assigned to this task |
| `status` | `Enum` | Yes | One of: `todo`, `in_progress`, `done` |
| `subtasks` | `ObjectId[]` | No | References to child SubTask documents |
| `attachments` | `Array` | No | List of `{ url, mimeType, size }` objects |
| `createdBy` | `ObjectId (User)` | Yes | Reference to the creating user |
| `createdAt` | `Date` | Yes | Auto-generated on creation |
| `updatedAt` | `Date` | Yes | Auto-updated on modification |

---

### 6.4 SubTask

| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | `ObjectId` | Yes | Unique identifier |
| `task` | `ObjectId (Task)` | Yes | Parent task reference |
| `title` | `String` | Yes | Subtask title |
| `description` | `String` | No | Optional subtask details |
| `isCompleted` | `Boolean` | Yes | Completion status; defaults `false` |
| `createdBy` | `ObjectId (User)` | Yes | Reference to the creating user |
| `createdAt` | `Date` | Yes | Auto-generated on creation |
| `updatedAt` | `Date` | Yes | Auto-updated on modification |

---

### 6.5 Note

| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | `ObjectId` | Yes | Unique identifier |
| `project` | `ObjectId (Project)` | Yes | Parent project reference |
| `title` | `String` | Yes | Note heading |
| `content` | `String` | Yes | Note body; Markdown recommended |
| `createdBy` | `ObjectId (User)` | Yes | Reference to the creating Admin |
| `createdAt` | `Date` | Yes | Auto-generated on creation |
| `updatedAt` | `Date` | Yes | Auto-updated on modification |

---

## 7. Permission Matrix

| Feature / Action | Admin | Project Admin | Member |
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

## 8. Security Requirements

### 8.1 Authentication

- **JWT access tokens** — Short-lived (15 minutes recommended), signed with HS256 or RS256
- **Refresh tokens** — Longer-lived (7 days), stored hashed, single-use rotation on each refresh
- **Passwords** — Minimum 8 characters, hashed with bcrypt (salt rounds ≥ 12)
- **Email tokens** — Cryptographically random (≥ 32 bytes), hashed before storage, single-use

### 8.2 Transport & Input

- All traffic over HTTPS / TLS 1.2+ in production
- Input validation and sanitisation on every endpoint using a schema validation library (e.g. Zod, Joi)
- File upload validation — restrict MIME types, enforce size limits, sanitise filenames
- Rate limiting applied to all authentication endpoints to mitigate brute-force attacks

### 8.3 Authorisation

- Project membership verified on every project-scoped request before any role check
- Role verified before any write, update, or delete operation
- Users cannot escalate their own role; only the project Admin may change roles
- CORS configured to allowlist trusted origins only; wildcard `*` disallowed in production

---

## 9. Non-Functional Requirements

### 9.1 Performance

- List endpoints paginated (default 20 items/page, configurable up to 100)
- Database indexes required on: `user.email`, `projectMember.userId`, `task.projectId`, `task.status`
- File uploads streamed directly to storage; avoid loading binary data into application memory

### 9.2 Reliability

- All errors return a structured JSON response with `success`, `message`, and (dev-only) `stack`
- Database connection pooling with automatic reconnect on failure
- Health check endpoint must be usable by load balancers without authentication

### 9.3 Maintainability

- Versioned API namespace (`/api/v1/`) to support future breaking-change versions without disruption
- Centralised middleware for authentication, role checking, error handling, and request logging
- All configuration via environment variables; no secrets committed to source control

### 9.4 Developer Experience

- Consistent response envelope across all endpoints (see [Section 10](#10-error-handling--response-standards))
- Meaningful HTTP status codes for every error case
- All endpoints include request/response schema documentation

---

## 10. Error Handling & Response Standards

### 10.1 Standard Response Envelope

All responses — success or error — follow this shape:

```json
{
  "success": true,
  "message": "Projects fetched successfully",
  "data": { }
}
```

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Must be a valid email address" }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `success` | `Boolean` | `true` for 2xx responses, `false` for errors |
| `message` | `String` | Human-readable outcome description |
| `data` | `Object / Array` | Response payload; omitted on errors |
| `errors` | `Array` | Field-level validation errors; present only on `422` responses |

### 10.2 HTTP Status Code Reference

| Code | Status | When to use |
|---|---|---|
| `200` | OK | Successful `GET` or `PUT` |
| `201` | Created | Successful `POST` that creates a resource |
| `400` | Bad Request | Malformed request body or query parameters |
| `401` | Unauthorized | Missing or invalid/expired token |
| `403` | Forbidden | Valid token but insufficient role for the operation |
| `404` | Not Found | Resource does not exist or user lacks access to it |
| `409` | Conflict | Duplicate resource (e.g. email already registered) |
| `422` | Unprocessable Entity | Validation errors with per-field details |
| `500` | Internal Server Error | Unexpected server-side failure |

---

## 11. File Management

### 11.1 Upload Constraints

| Constraint | Value |
|---|---|
| Maximum file size | 10 MB per file |
| Accepted MIME types | `image/*`, `application/pdf`, `text/plain`, `application/msword`, `application/vnd.openxmlformats-officedocument.*` |
| Filename handling | Sanitised to remove path traversal characters before storage |
| Upload middleware | Multer; validation runs before controller logic |

### 11.2 Storage & Metadata

- Files stored under `public/images/` (local) or a cloud bucket (production)
- Original filename, MIME type, and byte size persisted inside the parent task document
- File access URL returned in all task detail responses

---

## 12. Revision History

| Version | Date | Changes |
|---|---|---|
| 1.0 | April 2026 | Initial PRD draft |
| 2.0 | April 30, 2026 | Added goals, success metrics, data models, permission matrix expansion, security section, NFRs, error standards, file management constraints |
