// ============================================================
// routes/submissionRoutes.js — Submission API Endpoints
//
// POST  /api/submissions                      → Submit work (freelancer)
// GET   /api/submissions/project/:projectId   → All submissions for project (client)
// GET   /api/submissions/mine                 → My submissions (freelancer)
// PATCH /api/submissions/:id/review           → Approve/reject/revision (client)
// ============================================================

const express = require("express");
const router = express.Router();
const {
    submitWork,
    getProjectSubmissions,
    getMySubmissions,
    reviewSubmission,
} = require("../controllers/submissionController");
const protect = require("../middleware/authMiddleware");

router.post("/", protect, submitWork);
router.get("/mine", protect, getMySubmissions);
router.get("/project/:projectId", protect, getProjectSubmissions);
router.patch("/:id/review", protect, reviewSubmission);

module.exports = router;
