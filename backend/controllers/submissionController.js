// ============================================================
// controllers/submissionController.js — Work Submission Logic
//
// submitWork:          Freelancer submits work for a task
// getProjectSubmissions: Client views all submissions for a project
// getMySubmissions:    Freelancer views their own submissions
// reviewSubmission:    Client approves, rejects, or requests revision
// ============================================================

const Submission = require("../models/Submission");
const Task = require("../models/Task");

// ---- SUBMIT WORK ----
// POST /api/submissions
// Body: { taskId, projectId, content }
// Protected: freelancers only
const submitWork = async (req, res) => {
    try {
        if (req.user.role !== "freelancer") {
            return res.status(403).json({ message: "Only freelancers can submit work." });
        }

        const { taskId, projectId, content } = req.body;

        if (!taskId || !projectId || !content) {
            return res.status(400).json({ message: "taskId, projectId, and content are required." });
        }

        // Confirm this task is assigned to the logged-in freelancer
        const task = await Task.findById(taskId);
        if (!task || task.assignedTo.toString() !== req.user.id) {
            return res.status(403).json({ message: "You can only submit for tasks assigned to you." });
        }

        // Create the submission
        const submission = await Submission.create({
            taskId,
            projectId,
            freelancerId: req.user.id,
            content,
        });

        // Link submission ID back to the task
        task.submissionId = submission._id;
        await task.save();

        res.status(201).json({ message: "Work submitted!", submission });
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ---- GET ALL SUBMISSIONS FOR A PROJECT (Client view) ----
// GET /api/submissions/project/:projectId
// Protected: clients only
const getProjectSubmissions = async (req, res) => {
    try {
        const submissions = await Submission.find({ projectId: req.params.projectId })
            .populate("freelancerId", "name email category image")
            .populate("taskId", "title description")
            .sort({ createdAt: -1 });

        res.json(submissions);
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ---- GET MY SUBMISSIONS (Freelancer view) ----
// GET /api/submissions/mine
// Protected: freelancers only
const getMySubmissions = async (req, res) => {
    try {
        if (req.user.role !== "freelancer") {
            return res.status(403).json({ message: "Only freelancers can view their submissions." });
        }

        const submissions = await Submission.find({ freelancerId: req.user.id })
            .populate("taskId", "title description status")
            .populate("projectId", "projectName clientName")
            .sort({ createdAt: -1 });

        res.json(submissions);
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ---- REVIEW SUBMISSION (Client approves/rejects/revision) ----
// PATCH /api/submissions/:id/review
// Body: { status: "approved" | "rejected" | "revision", feedback? }
// Protected: clients only
const reviewSubmission = async (req, res) => {
    try {
        if (req.user.role !== "client") {
            return res.status(403).json({ message: "Only clients can review submissions." });
        }

        const { status, feedback } = req.body;

        if (!["approved", "rejected", "revision"].includes(status)) {
            return res.status(400).json({ message: "Status must be 'approved', 'rejected', or 'revision'." });
        }

        const submission = await Submission.findById(req.params.id);

        if (!submission) {
            return res.status(404).json({ message: "Submission not found." });
        }

        submission.status = status;
        submission.feedback = feedback || "";
        await submission.save();

        res.json({ message: `Submission ${status}!`, submission });
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

module.exports = { submitWork, getProjectSubmissions, getMySubmissions, reviewSubmission };
