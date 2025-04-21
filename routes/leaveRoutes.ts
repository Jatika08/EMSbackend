import express, { Request, Response, NextFunction } from "express";
import { applyLeaves, approveLeave } from "../controllers/leaveController";

const leaveRoutes = express.Router();

// Type for request body (if you want to enforce structure)
interface ApplyLeaveRequestBody {
  email: string;
  startDate: string;
  endDate: string;
}

interface ApproveLeaveRequestBody {
  email: string;
  leaveId: string;
}

leaveRoutes.patch(
  "/applyForleave/:uid", 
  (req: Request<{ uid: string }, {}, ApplyLeaveRequestBody>, res: Response, next: NextFunction) => {
    applyLeaves(req, res, next);
  }
);

leaveRoutes.patch(
  "/approve-leave/:leaveId", 
  (req: Request<{ leaveId: string }, {}, ApproveLeaveRequestBody>, res: Response, next: NextFunction) => {
    approveLeave(req, res, next);
  }
);

export default leaveRoutes;