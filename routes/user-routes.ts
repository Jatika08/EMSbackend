import express, { NextFunction } from "express";
import { check } from "express-validator";
import checkAuth from "../middleware/check-auth";
import { Request, Response } from "express";


import {
  loginUser,
  newUser,
  getUserProfile,
  getAllUsers,
} from "../controllers/userController";
import { createUserByAdmin } from "../controllers/adminController";
import { AuthenticatedRequest } from "../types/types";

interface CustomUser {
  isSuperUser: boolean;
}

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

const checkAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user?.isSuperUser) {
    res.status(403).json({ message: "Admins only." });
    return;
  }
  next();
};

// userRoutes.use(checkAuth);
// userRoutes.get("/me", getUserProfile);
// userRoutes.get("/profile/:id", getUserProfile);
// userRoutes.get("/users", getAllUsers);

// userRoutes.post("/action", checkAdmin, createUserByAdmin);
// userRoutes.get("/action/:id", checkAdmin, getUserByIdForAdmin);
// userRoutes.put("/action/:id", checkAdmin, updateUserByAdmin);
// userRoutes.patch("/action/:id", checkAdmin, patchUserByAdmin);
// userRoutes.delete("/action/:id", checkAdmin, deleteUserByAdmin);

export default userRoutes;
