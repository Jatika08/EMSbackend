import express from "express";
import { check } from "express-validator";
import checkAuth from "../middleware/check-auth.js";

import {
  loginUser,
  newUser,
  getUserProfile,
  getAllUsers,
  isSuperUser
} from "../controllers/userController.js";
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

const checkAdmin = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const superUser = await isSuperUser(email);

    if (!superUser) {
      return res.status(403).json({ message: 'Admins only.' });
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// userRoutes.use(checkAuth);
userRoutes.get("/me", async (req, res, next) => {
  await getUserProfile(req, res, next);
});

userRoutes.get("/profile/:id", getUserProfile);
userRoutes.get("/users", getAllUsers);

userRoutes.post("/action", checkAdmin, createUserByAdmin);
// userRoutes.get("/action/:id", checkAdmin, getUserByIdForAdmin);
// userRoutes.put("/action/:id", checkAdmin, updateUserByAdmin);
// userRoutes.patch("/action/:id", checkAdmin, patchUserByAdmin);
// userRoutes.delete("/action/:id", checkAdmin, deleteUserByAdmin);

export default userRoutes;
