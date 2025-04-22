import { userModel } from "../models/user.js";

export const getLeaveData = async (req, res, next) => {
  //GET /api/leaves?page=1&limit=10
  //GET /api/leaves?email=test@example.com&page=1&limit=10
  //GET /api/leaves?isApproved=false&page=1&limit=10
  //GET /api/leaves?fromMonth=1&fromYear=2024&toMonth=4&toYear=2024&page=1&limit=10
  //GET /api/leaves?isApproved=false&page=1&limit=20

  try {
    const {
      email,
      fromMonth,
      fromYear,
      toMonth,
      toYear,
      isApproved,
      page = 1,
      limit = 10,
    } = req.query;

    const filters = {
      email,
      fromMonth: parseInt(fromMonth),
      fromYear: parseInt(fromYear),
      toMonth: parseInt(toMonth),
      toYear: parseInt(toYear),
      isApproved: isApproved !== undefined ? isApproved === "true" : undefined,
      offset: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit),
    };

    const leaveData = await userModel.getLeavesFiltered(filters);
    res.status(200).json(leaveData);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching leave data", error: err.message });
  }
};

export const approveLeave = async (req, res, next) => {
  try {
    const { email, leaveId } = req.body;
    const leaveData = await userModel.approveLeave({ email, leaveId });
    res.status(200).json(leaveData);
  } catch (err) {
    res.status(500).json({ message: "Error approving leave", error: err });
  }
};

export const applyLeaves = async (req, res, next) => {
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
