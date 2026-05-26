// ============================================================
// middleware/authMiddleware.js — JWT Token Verification
// This runs BEFORE controller functions on protected routes.
// It checks if the request has a valid token in the header.
//
// HOW IT WORKS:
//   1. Client sends token in header: Authorization: Bearer <token>
//   2. This middleware extracts and verifies the token
//   3. If valid, attaches user info to req.user and calls next()
//   4. If invalid, returns 401 Unauthorized
// ============================================================

const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
    // Get the Authorization header value
    const authHeader = req.headers.authorization;

    // Check if header exists and starts with "Bearer "
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided. Access denied." });
    }

    // Extract just the token part (after "Bearer ")
    const token = authHeader.split(" ")[1];

    try {
        // Verify the token using our secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach decoded user info to the request object
        // Now any controller can access req.user.id, req.user.role, etc.
        req.user = decoded;

        next(); // Move on to the actual controller function
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token." });
    }
};

module.exports = protect;
