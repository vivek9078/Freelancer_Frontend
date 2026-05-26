// ============================================================
// controllers/projectController.js — Project CRUD Logic
//
// createProject:    Client creates a new project
// getAllProjects:   Get all available projects (freelancers browse this)
// getMyProjects:   Get projects belonging to logged-in client
// getProjectById:  Get a single project's details
// updateStatus:    Update project status (available/hired/completed)
// ============================================================

const Project = require("../models/Project");
const Member = require("../models/Member");
const User = require("../models/User");

// ---- CREATE PROJECT ----
// POST /api/projects
// Protected: only clients
const createProject = async (req, res) => {
    try {
        // Make sure the logged-in user is a client
        if (req.user.role !== "client") {
            return res.status(403).json({ message: "Only clients can create projects." });
        }

        const { projectName, description, details, budget, deadline } = req.body;

        if (!projectName || !description || !details || !budget) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // Get client's name from DB
        const client = await User.findById(req.user.id);

        const project = await Project.create({
            clientId: req.user.id,
            clientName: client.name,
            projectName,
            description,
            details,
            budget,
            deadline: deadline ? `${deadline} days` : "Flexible",
        });

        res.status(201).json({ message: "Project created!", project });
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ---- GET ALL PROJECTS (for freelancers to browse) ----
// GET /api/projects
// Protected: any logged-in user
const getAllProjects = async (req, res) => {
    try {
        // Populate clientId so we get the client's full info instead of just their ID
        const projects = await Project.find().populate("clientId", "name email").sort({ createdAt: -1 });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ---- GET MY PROJECTS (for the logged-in client) ----
// GET /api/projects/mine
// Protected: clients only
const getMyProjects = async (req, res) => {
    try {
        const projects = await Project.find({ clientId: req.user.id }).sort({ createdAt: -1 });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ---- GET SINGLE PROJECT ----
// GET /api/projects/:id
// Protected: any logged-in user
const getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id).populate("clientId", "name email");

        if (!project) {
            return res.status(404).json({ message: "Project not found." });
        }

        // Also get team members for this project
        const members = await Member.find({ projectId: req.params.id }).populate(
            "freelancerId",
            "name email category image"
        );

        res.json({ project, members });
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ---- UPDATE PROJECT STATUS ----
// PATCH /api/projects/:id/status
// Protected: client who owns the project
const updateStatus = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: "Project not found." });
        }

        // Only the project's client can change its status
        if (project.clientId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to update this project." });
        }

        project.status = req.body.status;
        await project.save();

        res.json({ message: "Project status updated.", project });
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

module.exports = { createProject, getAllProjects, getMyProjects, getProjectById, updateStatus };
