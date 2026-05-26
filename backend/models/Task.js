// ============================================================
// models/Task.js — Task Schema
// Tasks are created by the client and assigned to a team member.
// Status flow: todo → in-progress → completed
// ============================================================

const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // The freelancer assigned to this task
            default: null,
        },
        status: {
            type: String,
            enum: ["todo", "in-progress", "completed"],
            default: "todo",
        },
        completedAt: {
            type: Date,
            default: null,
        },
        submissionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Submission",
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
