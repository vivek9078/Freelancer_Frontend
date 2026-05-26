# WorkHub Pro — Backend API

Simple Node.js + Express + MongoDB backend for the WorkHub Pro freelance platform.

---

## Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Create your .env file
```bash
cp .env.example .env
```
Edit `.env` and fill in your values:
```
MONGO_URI=mongodb://localhost:27017/workhub_pro
JWT_SECRET=pick_any_long_random_string_here
PORT=5000
```

### 3. Run the Server
```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

---

## Folder Structure

```
backend/
├── server.js              ← App entry point
├── .env.example           ← Copy this to .env
├── package.json
├── config/
│   └── db.js              ← MongoDB connection
├── models/
│   ├── User.js            ← Client + Freelancer schema
│   ├── Project.js
│   ├── Invitation.js
│   ├── Member.js          ← Who's on a project team
│   ├── Task.js
│   └── Submission.js
├── routes/
│   ├── authRoutes.js
│   ├── projectRoutes.js
│   ├── invitationRoutes.js
│   ├── taskRoutes.js
│   └── submissionRoutes.js
├── controllers/
│   ├── authController.js
│   ├── projectController.js
│   ├── invitationController.js
│   ├── taskController.js
│   └── submissionController.js
└── middleware/
    └── authMiddleware.js   ← JWT verification
```

---

## Authentication

All protected routes require a JWT token in the request header:
```
Authorization: Bearer <your_token_here>
```

You get the token from `/api/auth/login` or `/api/auth/register`.

---

## API Reference

### AUTH

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | ❌ | Register client or freelancer |
| POST | /api/auth/login | ❌ | Login, receive JWT token |
| GET | /api/auth/freelancers | ✅ | List all freelancers |

**Register Client:**
```json
POST /api/auth/register
{
  "name": "John Client",
  "email": "john@example.com",
  "password": "password123",
  "role": "client"
}
```

**Register Freelancer:**
```json
POST /api/auth/register
{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "password": "password123",
  "role": "freelancer",
  "category": "Full Stack Developer",
  "phone": "+1234567890",
  "image": "https://example.com/photo.jpg",
  "pastExperience": "7 years in React, Node.js"
}
```

**Response (both register & login):**
```json
{
  "message": "Login successful!",
  "token": "eyJhbGci...",
  "user": {
    "id": "64f...",
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "role": "freelancer"
  }
}
```

---

### PROJECTS

| Method | Endpoint | Auth | Who |
|--------|----------|------|-----|
| POST | /api/projects | ✅ | Client |
| GET | /api/projects | ✅ | Anyone |
| GET | /api/projects/mine | ✅ | Client |
| GET | /api/projects/:id | ✅ | Anyone |
| PATCH | /api/projects/:id/status | ✅ | Client (owner) |

**Create Project:**
```json
POST /api/projects
{
  "projectName": "E-Commerce Website",
  "description": "Build a full online store",
  "details": "React frontend, Node backend, MongoDB",
  "budget": "5000",
  "deadline": "30"
}
```

---

### INVITATIONS

| Method | Endpoint | Auth | Who |
|--------|----------|------|-----|
| POST | /api/invitations | ✅ | Client |
| GET | /api/invitations/mine | ✅ | Freelancer |
| GET | /api/invitations/project/:projectId | ✅ | Client |
| PATCH | /api/invitations/:id/respond | ✅ | Freelancer |

**Send Invitation:**
```json
POST /api/invitations
{
  "projectId": "64f...",
  "freelancerId": "64f...",
  "message": "We'd love to have you on board!"
}
```

**Respond to Invitation:**
```json
PATCH /api/invitations/64f.../respond
{
  "response": "accepted"
}
```

---

### TASKS

| Method | Endpoint | Auth | Who |
|--------|----------|------|-----|
| POST | /api/tasks | ✅ | Client |
| GET | /api/tasks/project/:projectId | ✅ | Anyone |
| GET | /api/tasks/mine | ✅ | Freelancer |
| PATCH | /api/tasks/:id/status | ✅ | Freelancer (assignee) |

**Create Task:**
```json
POST /api/tasks
{
  "projectId": "64f...",
  "title": "Build Login Page",
  "description": "Create login with email/password",
  "assignedTo": "64f..."
}
```

**Update Task Status:**
```json
PATCH /api/tasks/64f.../status
{
  "status": "in-progress"
}
```
Valid transitions: `todo → in-progress → completed`

---

### SUBMISSIONS

| Method | Endpoint | Auth | Who |
|--------|----------|------|-----|
| POST | /api/submissions | ✅ | Freelancer |
| GET | /api/submissions/mine | ✅ | Freelancer |
| GET | /api/submissions/project/:projectId | ✅ | Client |
| PATCH | /api/submissions/:id/review | ✅ | Client |

**Submit Work:**
```json
POST /api/submissions
{
  "taskId": "64f...",
  "projectId": "64f...",
  "content": "Completed the login page. GitHub: https://github.com/..."
}
```

**Review Submission:**
```json
PATCH /api/submissions/64f.../review
{
  "status": "approved",
  "feedback": "Great work!"
}
```
Status options: `approved`, `rejected`, `revision`

---

## How to Connect Frontend

Replace localStorage calls in `app.js` with `fetch()` calls to these APIs.

Example — Login:
```javascript
const response = await fetch("http://localhost:5000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password })
});
const data = await response.json();
localStorage.setItem("token", data.token); // Store JWT
```

Example — Protected Request:
```javascript
const token = localStorage.getItem("token");
const response = await fetch("http://localhost:5000/api/projects", {
  headers: { "Authorization": `Bearer ${token}` }
});
```

---

## Technologies Used

- **Node.js** — JavaScript runtime
- **Express.js** — Web framework
- **MongoDB** — NoSQL database
- **Mongoose** — ODM for MongoDB (like ORM for SQL)
- **bcryptjs** — Password hashing
- **jsonwebtoken** — JWT authentication
- **dotenv** — Environment variables
- **cors** — Cross-Origin Resource Sharing
