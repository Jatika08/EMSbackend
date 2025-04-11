const express = require("express");
const { check } = require("express-validator");
const { loginUser, newUser } = require("../controllers/userController");
const checkAuth = require("../middleware/check-auth");
const { User } = require("../models/user"); // Use the correct import for Sequelize model

const userRoutes = express.Router();

// Debugging logs
console.log("Checking imports in user-routes:");
console.log("newUser:", typeof newUser);
console.log("loginUser:", typeof loginUser);

// Route for logging in
userRoutes.post(
  "/login",
  [
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  (req, res, next) => {
    if (typeof loginUser !== "function") {
      return res.status(500).json({ message: "loginUser function is missing!" });
    }
    loginUser(req, res, next);
  }
);

// Middleware for authentication
userRoutes.use(checkAuth);

// ✅ Add this here
userRoutes.get("/me", async (req, res) => {
  console.log("GET /me route hit");
  console.log("req.user:", req.user);

  if (!req.user || !req.user.userId) {
    return res.status(400).json({ message: "No userId in request.user" });
  }

  try {
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error("Error in /me route:", err.message);
    res.status(500).json({ message: "Fetching current user failed", error: err.message });
  }
});

// Route for getting user data (Fix here)
userRoutes.get("/profile", (req, res) => {
  res.status(200).json({ message: "User Profile Route Working!" });
});

// Route for signing up a new user
userRoutes.post(
  "/signup",
  [
    check("email").normalizeEmail().isEmail(),
    check("name").notEmpty(),
    check("password").isLength({ min: 8 }),
    check("position").notEmpty(),
    check("aadhar").notEmpty(),
    check("panNo").notEmpty(),
  ],
  (req, res, next) => {
    if (typeof newUser !== "function") {
      return res.status(500).json({ message: "newUser function is missing!" });
    }
    newUser(req, res, next);
  }
);

userRoutes.get("/", async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json({ user: users }); // Match the shape expected by Dashboard.jsx
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({ message: "Fetching users failed", error });
  }
});

module.exports = userRoutes;
