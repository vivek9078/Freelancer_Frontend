// ============================================================
// controllers/authController.js — Register & Login Logic
//
// register: Creates a new user (client or freelancer)
// login:    Verifies email+password, returns a JWT token
//
// The token is what the frontend stores (instead of localStorage session)
// and sends with every protected request.
// ============================================================

const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ---- Helper: Generate JWT Token ----
// This creates a token containing the user's id and role.
// It expires in 7 days, so the user stays logged in.
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

// ---- REGISTER ----
// POST /api/auth/register
// Body: { name, email, password, role, category?, phone?, image?, pastExperience? }
const register = async (req, res) => {
    try {
        const { name, email, password, role, category, phone, image, pastExperience } = req.body;

        // Basic validation
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "Name, email, password, and role are required." });
        }

        // Check if email is already taken
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered." });
        }

        // Hash the password before saving (NEVER store plain text passwords)
        // bcrypt.hash(password, saltRounds) — 10 rounds is a safe default
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user in DB
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            category: category || "",
            phone: phone || "",
            image: image || "",
            pastExperience: pastExperience || "",
        });

        // Return token + basic user info (don't return the password!)
        res.status(201).json({
            message: "Registration successful!",
            token: generateToken(user),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                category: user.category,
                phone: user.phone,
                image: user.image,
                pastExperience: user.pastExperience,
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Server error during registration.", error: error.message });
    }
};

// ---- LOGIN ----
// POST /api/auth/login
// Body: { email, password }
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        // Compare entered password with the hashed one in DB
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        // Login successful — send token
        res.json({
            message: "Login successful!",
            token: generateToken(user),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                category: user.category,
                phone: user.phone,
                image: user.image,
                pastExperience: user.pastExperience,
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Server error during login.", error: error.message });
    }
};

// ---- GET ALL FREELANCERS ----
// GET /api/auth/freelancers
// Used by the client dashboard to browse and invite freelancers
const getFreelancers = async (req, res) => {
    try {
        // Find all users with role "freelancer", exclude password field
        const freelancers = await User.find({ role: "freelancer" }).select("-password");
        res.json(freelancers);
    } catch (error) {
        res.status(500).json({ message: "Server error.", error: error.message });
    }
};

module.exports = { register, login, getFreelancers };
