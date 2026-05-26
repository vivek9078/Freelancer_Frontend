// ============================================================
// models/Submission.js — Submission Schema
// A freelancer submits work for a task.
// The client can then approve or reject it.
// ============================================================

const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
    {
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
            required: true,
        },
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
        content: {
            type: String,
            required: true, // The actual submission text / link / notes
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected", "revision"],
            default: "pending",
        },
        feedback: {
            type: String,
            default: "", // Client's feedback when rejecting or requesting revision
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Submission", submissionSchema);
