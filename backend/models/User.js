// ============================================================
// models/User.js — User Schema
// Defines the shape of a user document in MongoDB.
// Both clients and freelancers are stored in the same collection.
// ============================================================

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true, // Cannot be empty
            trim: true,     // Removes extra spaces automatically
        },
        email: {
            type: String,
            required: true,
            unique: true,   // No two users can have the same email
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["client", "freelancer"], // Only these two values allowed
            required: true,
        },

        // Freelancer-only fields (optional for clients)
        category: { type: String, default: "" },       // e.g. "Full Stack Developer"
        phone: { type: String, default: "" },
        image: { type: String, default: "" },          // Profile photo URL
        pastExperience: { type: String, default: "" }, // Bio / experience text
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);

// Export the model — mongoose.model("User", userSchema) creates a "users" collection
module.exports = mongoose.model("User", userSchema);
