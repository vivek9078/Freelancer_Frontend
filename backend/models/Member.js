// ============================================================
// models/Member.js — Project Member Schema
// Created when a freelancer ACCEPTS an invitation.
// Represents who is actively working on a project.
// ============================================================

const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        freelancerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true } // createdAt = when they joined
);

module.exports = mongoose.model("Member", memberSchema);
