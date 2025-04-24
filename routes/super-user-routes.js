import express from "express";
import { checkAdmin, authenticateToken } from "../middleware/validate-login.js";
import { createUserByAdmin } from "../controllers/adminController.js";

import {
  getUserByIdForAdmin,
  updateUserByAdmin,
  patchUserByAdmin,
  deleteUserByAdmin,
} from "../controllers/adminController.js";

const superUserRoutes = express.Router();

superUserRoutes.use(authenticateToken);
superUserRoutes.use(checkAdmin);


superUserRoutes.post("/", createUserByAdmin);
superUserRoutes.get("/:id", getUserByIdForAdmin); //use this to get the user by id
superUserRoutes.patch("/:id", patchUserByAdmin); //use this to change the email of the user
superUserRoutes.delete("/:id", deleteUserByAdmin);

export default superUserRoutes;
