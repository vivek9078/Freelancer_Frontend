// ============================================================
// models/Invitation.js — Invitation Schema
// A client sends an invitation to a freelancer for a project.
// Status goes: pending → accepted OR rejected
// ============================================================

const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        freelancerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected"],
            default: "pending",
        },
        message: {
            type: String,
            default: "", // Optional message from the client
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Invitation", invitationSchema);
