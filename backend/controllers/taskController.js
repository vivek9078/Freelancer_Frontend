// ============================================================
// controllers/taskController.js — Task Logic
//
// createTask:        Client creates a task and assigns to a team member
// getProjectTasks:   Get all tasks for a project
// getMyTasks:        Freelancer gets their assigned tasks
// updateTaskStatus:  Freelancer moves task: todo → in-progress → completed
// ============================================================

const Task = require("../models/Task");
const Member = require("../models/Member");
const Project = require("../models/Project");

// ---- CREATE TASK ----
// POST /api/tasks
// Body: { projectId, title, description, assignedTo (freelancer userId) }
// Protected: clients only
const createTask = async (req, res) => {
    try {
        if (req.user.role !== "client") {
            return res.status(403).json({ message: "Only clients can create tasks." });
        }

        const { projectId, title, description, assignedTo } = req.body;

        if (!projectId || !title || !assignedTo) {
            return res.status(400).json({ message: "projectId, title, and assignedTo are required." });
        }

        // Confirm the project belongs to this client
        const project = await Project.findById(projectId);
        if (!project || project.clientId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Project not found or access denied." });
        }

        // Confirm the assignee is actually a member of this project
        const isMember = await Member.findOne({ projectId, freelancerId: assignedTo });
        if (!isMember) {
            return res.status(400).json({ message: "You can only assign tasks to team members." });
        }

        const task = await Task.create({
            projectId,
            title,
            description: description || "",
            assignedTo,
        });

        const populated = await task.populate("assignedTo", "name email");

        res.status(201).json({ message: "Task created!", task: populated });
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ---- GET ALL TASKS FOR A PROJECT ----
// GET /api/tasks/project/:projectId
// Protected: any logged-in user
const getProjectTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ projectId: req.params.projectId })
            .populate("assignedTo", "name email category image")
            .sort({ createdAt: -1 });

        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ---- GET TASKS ASSIGNED TO THE LOGGED-IN FREELANCER ----
// GET /api/tasks/mine?projectId=xxx (optional filter by project)
// Protected: freelancers only
const getMyTasks = async (req, res) => {
    try {
        if (req.user.role !== "freelancer") {
            return res.status(403).json({ message: "Only freelancers can view their tasks." });
        }

        const filter = { assignedTo: req.user.id };

        // Optionally filter by a specific project
        if (req.query.projectId) {
            filter.projectId = req.query.projectId;
        }

        const tasks = await Task.find(filter)
            .populate("projectId", "projectName clientName")
            .sort({ createdAt: -1 });

        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ---- UPDATE TASK STATUS ----
// PATCH /api/tasks/:id/status
// Body: { status: "in-progress" | "completed" }
// Protected: the freelancer assigned to the task
const updateTaskStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: "Task not found." });
        }

        // Only the assigned freelancer can update status
        if (task.assignedTo.toString() !== req.user.id) {
            return res.status(403).json({ message: "You can only update tasks assigned to you." });
        }

        // Enforce valid status transitions
        const validTransitions = {
            "todo": ["in-progress"],
            "in-progress": ["completed"],
            "completed": [],
        };

        if (!validTransitions[task.status].includes(status)) {
            return res.status(400).json({
                message: `Cannot change status from '${task.status}' to '${status}'.`,
            });
        }

        task.status = status;
        if (status === "completed") {
            task.completedAt = new Date();
        }

        await task.save();

        res.json({ message: "Task status updated.", task });
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

module.exports = { createTask, getProjectTasks, getMyTasks, updateTaskStatus };
