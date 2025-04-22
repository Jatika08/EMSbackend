import express from "express";
import { applyLeaves, approveLeave } from "../controllers/leaveController.js";
import { authenticateToken } from "../middleware/validate-login.js";

import { getLeaveData } from "../controllers/leaveController.js";

const leaveRoutes = express.Router();

leaveRoutes.get("/", authenticateToken, (req, res, next) => {
  getLeaveData(req, res, next);
});

leaveRoutes.patch(
  "/applyForleave/:uid",
  authenticateToken,
  (req, res, next) => {
    applyLeaves(req, res, next);
  }
);

leaveRoutes.patch(
  "/approve-leave/:leaveId",
  authenticateToken,
  (req, res, next) => {
    approveLeave(req, res, next);
  }
);

export default leaveRoutes;
