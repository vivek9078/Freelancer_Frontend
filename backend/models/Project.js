// ============================================================
// models/Project.js — Project Schema
// A project is created by a client.
// It has a status: available → hired → completed
// ============================================================

const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
    {
        clientId: {
            type: mongoose.Schema.Types.ObjectId, // Reference to User collection
            ref: "User",
            required: true,
        },
        clientName: {
            type: String,
            required: true,
        },
        projectName: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        details: {
            type: String,
            required: true,
        },
        budget: {
            type: String,
            required: true, // Stored as string e.g. "5000" or "$5,000"
        },
        deadline: {
            type: String,
            default: "Flexible",
        },
        status: {
            type: String,
            enum: ["available", "hired", "completed"],
            default: "available",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
