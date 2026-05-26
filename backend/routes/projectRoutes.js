// ============================================================
// routes/projectRoutes.js — Project API Endpoints
//
// POST  /api/projects              → Create project (client only)
// GET   /api/projects              → Get all projects
// GET   /api/projects/mine         → Get my projects (client)
// GET   /api/projects/:id          → Get one project + members
// PATCH /api/projects/:id/status   → Update project status
// ============================================================

const express = require("express");
const router = express.Router();
const {
    createProject,
    getAllProjects,
    getMyProjects,
    getProjectById,
    updateStatus,
} = require("../controllers/projectController");
const protect = require("../middleware/authMiddleware");

// All project routes require login (protect middleware)
router.post("/", protect, createProject);
router.get("/", protect, getAllProjects);
router.get("/mine", protect, getMyProjects);
router.get("/:id", protect, getProjectById);
router.patch("/:id/status", protect, updateStatus);

module.exports = router;
