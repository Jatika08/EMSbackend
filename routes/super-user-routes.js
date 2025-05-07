import express from "express";
import { checkAdmin, authenticateToken } from "../middleware/validate-login.js";
import { createUserByAdmin } from "../controllers/adminController.js";

import {
  getUserByAdmin,
  patchUserByAdmin,
  deleteUserByAdmin,
  createNotice,
  getNotices
} from "../controllers/adminController.js";

const superUserRoutes = express.Router();

superUserRoutes.use(authenticateToken);
superUserRoutes.use(checkAdmin);

superUserRoutes.post("/notice", createNotice)
superUserRoutes.get("/notice", getNotices)

superUserRoutes.post("/", createUserByAdmin);
superUserRoutes.get("/:email", getUserByAdmin);
superUserRoutes.patch("/:email", patchUserByAdmin);
superUserRoutes.delete("/:email", deleteUserByAdmin);

export default superUserRoutes;
