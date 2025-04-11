const express = require("express");
const { check } = require("express-validator");
const { newUser, loginUser } = require("../controllers/userController");
const checkAuth = require("../middleware/check-auth");

const superUserRoutes = express.Router();

// Debugging logs
console.log("Checking imports in routes:");
console.log("newUser:", typeof newUser);
console.log("loginUser:", typeof loginUser);

// Route for logging in a user
superUserRoutes.post(
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
superUserRoutes.use(checkAuth);

// Route for signing up a new user
superUserRoutes.post(
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

module.exports = superUserRoutes;
