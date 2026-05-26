// ============================================================
// server.js — Entry Point of the Backend
// This is the FIRST file that runs when you start the server.
// It sets up Express, connects to MongoDB, and registers all routes.
// ============================================================

const express = require("express");
const cors = require("cors");
require("dotenv").config(); // Load .env variables (like MONGO_URI, JWT_SECRET)

const connectDB = require("./config/db");

// Import all route files
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const invitationRoutes = require("./routes/invitationRoutes");
const taskRoutes = require("./routes/taskRoutes");
const submissionRoutes = require("./routes/submissionRoutes");

// Create the Express app
const app = express();

// ---- Middleware ----
app.use(cors({
    origin: "*"
})); // Allow frontend (different port) to talk to backend
app.use(express.json()); // Parse incoming JSON request bodies

// ---- Connect to MongoDB ----
connectDB();

// ---- Register Routes ----
// Every route in authRoutes will be prefixed with /api/auth
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/submissions", submissionRoutes);

// ---- Default Route (Health Check) ----
app.get("/", (req, res) => {
    res.json({ message: "WorkHub Pro API is running!" });
});

// ---- Start Server ----
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {

    console.log(`Server running on http://localhost:${PORT}`);
});
