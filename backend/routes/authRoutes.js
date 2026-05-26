// ============================================================
// routes/authRoutes.js — Auth API Endpoints
//
// POST   /api/auth/register   → Register a new user
// POST   /api/auth/login      → Login and get token
// GET    /api/auth/freelancers → Get all freelancers (protected)
// ============================================================

const express = require("express");
const router = express.Router();
const { register, login, getFreelancers } = require("../controllers/authController");
const protect = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/freelancers", protect, getFreelancers); // Must be logged in to browse

module.exports = router;
