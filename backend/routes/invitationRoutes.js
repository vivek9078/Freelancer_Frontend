// ============================================================
// routes/invitationRoutes.js — Invitation API Endpoints
//
// POST  /api/invitations                         → Send invitation (client)
// GET   /api/invitations/mine                    → My invitations (freelancer)
// GET   /api/invitations/project/:projectId      → Invitations for a project (client)
// PATCH /api/invitations/:id/respond             → Accept or reject (freelancer)
// ============================================================

const express = require("express");
const router = express.Router();
const {
    sendInvitation,
    getMyInvitations,
    respondInvitation,
    getProjectInvitations,
} = require("../controllers/invitationController");
const protect = require("../middleware/authMiddleware");

router.post("/", protect, sendInvitation);
router.get("/mine", protect, getMyInvitations);
router.get("/project/:projectId", protect, getProjectInvitations);
router.patch("/:id/respond", protect, respondInvitation);

module.exports = router;
