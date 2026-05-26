// ============================================================
// controllers/invitationController.js — Invitation Logic
//
// sendInvitation:     Client invites a freelancer to a project
// getMyInvitations:  Freelancer sees their pending invitations
// respondInvitation: Freelancer accepts or rejects an invitation
// getProjectInvitations: Client sees who they've invited for a project
// ============================================================

const Invitation = require("../models/Invitation");
const Member = require("../models/Member");
const Project = require("../models/Project");

// ---- SEND INVITATION ----
// POST /api/invitations
// Body: { projectId, freelancerId, message? }
// Protected: clients only
const sendInvitation = async (req, res) => {
    try {
        if (req.user.role !== "client") {
            return res.status(403).json({ message: "Only clients can send invitations." });
        }

        const { projectId, freelancerId, message } = req.body;

        // Check if this freelancer was already invited to this project
        const existing = await Invitation.findOne({ projectId, freelancerId });
        if (existing) {
            return res.status(400).json({ message: "This freelancer has already been invited." });
        }

        const invitation = await Invitation.create({
            projectId,
            freelancerId,
            clientId: req.user.id,
            message: message || "",
        });

        // Populate for a rich response
        const populated = await invitation.populate([
            { path: "freelancerId", select: "name email category" },
            { path: "projectId", select: "projectName" },
        ]);

        res.status(201).json({ message: "Invitation sent!", invitation: populated });
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ---- GET INVITATIONS FOR LOGGED-IN FREELANCER ----
// GET /api/invitations/mine
// Protected: freelancers only
const getMyInvitations = async (req, res) => {
    try {
        if (req.user.role !== "freelancer") {
            return res.status(403).json({ message: "Only freelancers can view their invitations." });
        }

        const invitations = await Invitation.find({ freelancerId: req.user.id })
            .populate("projectId", "projectName description budget deadline status")
            .populate("clientId", "name email")
            .sort({ createdAt: -1 });

        res.json(invitations);
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ---- RESPOND TO INVITATION (Accept or Reject) ----
// PATCH /api/invitations/:id/respond
// Body: { response: "accepted" | "rejected" }
// Protected: freelancers only
const respondInvitation = async (req, res) => {
    try {
        if (req.user.role !== "freelancer") {
            return res.status(403).json({ message: "Only freelancers can respond to invitations." });
        }

        const { response } = req.body; // "accepted" or "rejected"

        if (!["accepted", "rejected"].includes(response)) {
            return res.status(400).json({ message: "Response must be 'accepted' or 'rejected'." });
        }

        const invitation = await Invitation.findById(req.params.id);

        if (!invitation) {
            return res.status(404).json({ message: "Invitation not found." });
        }

        // Make sure this invitation belongs to the logged-in freelancer
        if (invitation.freelancerId.toString() !== req.user.id) {
            return res.status(403).json({ message: "This invitation is not for you." });
        }

        if (invitation.status !== "pending") {
            return res.status(400).json({ message: "Invitation already responded to." });
        }

        // Update invitation status
        invitation.status = response;
        await invitation.save();

        // If accepted → add freelancer as a project member
        if (response === "accepted") {
            // Check if already a member (safety check)
            const alreadyMember = await Member.findOne({
                projectId: invitation.projectId,
                freelancerId: req.user.id,
            });

            if (!alreadyMember) {
                await Member.create({
                    projectId: invitation.projectId,
                    freelancerId: req.user.id,
                });
            }

            // Update project status to "hired" if it was "available"
            await Project.findOneAndUpdate(
                { _id: invitation.projectId, status: "available" },
                { status: "hired" }
            );
        }

        res.json({ message: `Invitation ${response}!`, invitation });
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ---- GET INVITATIONS FOR A PROJECT (Client view) ----
// GET /api/invitations/project/:projectId
// Protected: client who owns the project
const getProjectInvitations = async (req, res) => {
    try {
        const invitations = await Invitation.find({ projectId: req.params.projectId })
            .populate("freelancerId", "name email category image")
            .sort({ createdAt: -1 });

        res.json(invitations);
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

module.exports = { sendInvitation, getMyInvitations, respondInvitation, getProjectInvitations };
