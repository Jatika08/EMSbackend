import express from "express";
import { check } from "express-validator";
import { checkAdmin, authenticateToken } from "../middleware/validate-login.js";
import { approveLeave } from "../controllers/leaveController.js";

import checkAuth from "../middleware/check-auth.js";

const superUserRoutes = express.Router();

// POST /api/superuser/login
// superUserRoutes.post(
//   "/login",
//   [
//     check("email").normalizeEmail().isEmail().withMessage("Valid email is required"),
//     check("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
//   ],
//   async (req, res, next) => {
//     try {
//       if (typeof loginUser !== "function") {
//         res.status(500).json({ message: "loginUser function is missing!" });
//         return;
//       }
//       await loginUser(req, res, next);
//     } catch (err) {
//       next(err);
//     }
//   }
// );
superUserRoutes.use(authenticateToken);
superUserRoutes.use(checkAdmin);

// superUserRoutes.post(
//   "/signup",
//   [
//     check("email").normalizeEmail().isEmail().withMessage("Valid email is required"),
//     check("name").notEmpty().withMessage("Name is required"),
//     check("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
//     check("position").notEmpty().withMessage("Position is required"),
//     check("aadhar").notEmpty().withMessage("Aadhar is required"),
//     check("panNo").notEmpty().withMessage("PAN number is required"),
//   ],
//   async (req, res, next) => {
//     try {
//       if (typeof newUser !== "function") {
//         res.status(500).json({ message: "newUser function is missing!" });
//         return;
//       }
//       await newUser(req, res, next);
//     } catch (err) {
//       next(err);
//     }
//   }
// );

//add actions in this file
superUserRoutes.patch("leaves/:uid", approveLeave);

export default superUserRoutes;
