import express from "express";
import { check } from "express-validator";
import checkAuth from "../middleware/check-auth.js";
import { checkAdmin, authenticateToken } from "../middleware/validate-login.js";
import {
  getUserByIdForAdmin,
  updateUserByAdmin,
  patchUserByAdmin,
  deleteUserByAdmin,
} from "../controllers/adminController.js";

import {
  loginUser,
  newUser,
  getUserProfile,
  getAllUsers,
  registerUserbyUser,
} from "../controllers/userController.js";
import { userModel } from "../models/user.js";
import { createUserByAdmin } from "../controllers/adminController.js";

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
  newUser
);

// userRoutes.use(checkAuth);
userRoutes.get("/me", async (req, res, next) => {
  await getUserProfile(req, res, next);
});

userRoutes.get("/profile/:id", authenticateToken, getUserProfile);
userRoutes.get("/users", authenticateToken, getAllUsers);//this gets all the users and their departments
userRoutes.post("/action", authenticateToken, checkAdmin, createUserByAdmin);
userRoutes.get("/action/:id", checkAdmin, getUserByIdForAdmin);//use this to get the user by id
// userRoutes.put("/action/:id", checkAdmin, updateUserByAdmin);
userRoutes.patch("/action/:id", checkAdmin, patchUserByAdmin); //use this to change the email of the user
userRoutes.delete("/action/:id", checkAdmin, deleteUserByAdmin); //soft delete

export default userRoutes;
