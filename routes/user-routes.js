import express from "express";
import { check } from "express-validator";
import { authenticateToken } from "../middleware/validate-login.js";

import {
  loginUser,
  newUser,
  getUserProfile,
  getAllUsers,
  registerUserbyUser,
  myTeamToday,
} from "../controllers/userController.js";

const userRoutes = express.Router();

userRoutes.post(
  "/login",
  [
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  loginUser
);

userRoutes.patch("/register", registerUserbyUser);

// userRoutes.use(checkAuth);
userRoutes.get("/me", async (req, res, next) => {
  await getUserProfile(req, res, next);
});

userRoutes.get("/myteamtoday", async (req, res, next) => {
  await myTeamToday(req, res, next);
});

userRoutes.get("/profile/:id", authenticateToken, getUserProfile);
userRoutes.get("/users", authenticateToken, getAllUsers);
//soft delete

export default userRoutes;
