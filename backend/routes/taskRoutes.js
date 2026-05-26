// ============================================================
// routes/taskRoutes.js — Task API Endpoints
//
// POST  /api/tasks                        → Create task (client)
// GET   /api/tasks/project/:projectId     → All tasks for a project
// GET   /api/tasks/mine                   → My assigned tasks (freelancer)
// PATCH /api/tasks/:id/status             → Update task status (freelancer)
// ============================================================

const express = require("express");
const router = express.Router();
const { createTask, getProjectTasks, getMyTasks, updateTaskStatus } = require("../controllers/taskController");
const protect = require("../middleware/authMiddleware");

router.post("/", protect, createTask);
router.get("/mine", protect, getMyTasks);
router.get("/project/:projectId", protect, getProjectTasks);
router.patch("/:id/status", protect, updateTaskStatus);

module.exports = router;
