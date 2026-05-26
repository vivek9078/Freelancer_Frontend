// ============================================================
// config/db.js — MongoDB Connection
// This function connects Mongoose to your MongoDB database.
// Called once in server.js when the app starts.
// ============================================================

const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        // mongoose.connect() returns a promise, so we await it
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected successfully!");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1); // Stop the server if DB fails to connect
    }
};

module.exports = connectDB;
