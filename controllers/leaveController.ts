import { Request, Response, NextFunction } from "express";
import { userModel } from "../models/user";

export const getLeaveData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;
    const leaveData = await userModel.getLeavesByEmail(email);
    res.status(200).json(leaveData);
  } catch (err) {
    res.status(500).json({ message: "Error fetching leave data", error: err });
  }
};

export const approveLeave = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, leaveId } = req.body;
    const leaveData = await userModel.approveLeave({ email, leaveId });
    res.status(200).json(leaveData);
  } catch (err) {
    res.status(500).json({ message: "Error approving leave", error: err });
  }
};

export const applyLeaves = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, startDate, endDate } = req.body;

    if (!email || !startDate || !endDate) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const leave = await userModel.applyLeave([email, startDate, endDate]);
    res.status(201).json({ message: "Leave applied", leave });
  } catch (err) {
    res.status(500).json({ message: "Error applying leave", error: err });
  }
};
