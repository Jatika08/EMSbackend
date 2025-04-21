import express, { Request, Response, NextFunction } from "express";
import { applyForLeave, approveLeave } from "../controllers/leaveContoller";

const leaveRoutes = express.Router();

leaveRoutes.patch("/applyForleave/:uid", (req: Request, res: Response, next: NextFunction) => {
  applyForLeave(req, res, next);
});

leaveRoutes.patch("/approve-leave/:leaveId", (req: Request, res: Response, next: NextFunction) => {
  approveLeave(req, res, next);
});

export default leaveRoutes;
