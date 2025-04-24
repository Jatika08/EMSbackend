import express from "express";
import { applyLeaves, approveLeave } from "../controllers/leaveController.js";
import { checkAdmin, authenticateToken } from "../middleware/validate-login.js";

import { getLeaveData } from "../controllers/leaveController.js";

const leaveRoutes = express.Router();

leaveRoutes.get("/", authenticateToken, (req, res, next) => {
  getLeaveData(req, res, next);
});

leaveRoutes.post("/", authenticateToken, (req, res, next) => {
  applyLeaves(req, res, next);
});

leaveRoutes.patch(
  "/approve-disapprove/:leaveId",
  authenticateToken,
  checkAdmin,
  approveLeave
);

export default leaveRoutes;
