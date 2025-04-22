import express from "express";
import { applyLeaves, approveLeave } from "../controllers/leaveController.js";

const leaveRoutes = express.Router();

leaveRoutes.patch("/applyForleave/:uid", (req, res, next) => {
  applyLeaves(req, res, next);
});

leaveRoutes.patch("/approve-leave/:leaveId", (req, res, next) => {
  approveLeave(req, res, next);
});

export default leaveRoutes;
