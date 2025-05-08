import { userModel } from "../models/user.js";

export const getLeaveData = async (req, res, next) => {
  try {
    const {
      email,
      fromMonth,
      fromYear,
      toMonth,
      toYear,
      isApproved,
      isSettled,
      page = 1,
      limit = 10,
    } = req.query;

    console.log("Query Parameters:", {
      email,
      fromMonth,
      fromYear,
      toMonth,
      toYear,
      isApproved,
      isSettled,
      page,
      limit,
    });

    const filters = {
      email,
      fromMonth: parseInt(fromMonth),
      fromYear: parseInt(fromYear),
      toMonth: parseInt(toMonth),
      toYear: parseInt(toYear),
      isApproved: isApproved !== undefined ? isApproved === "true" : undefined,
      isSettled: isSettled !== undefined ? isSettled === "true" : true,
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
    const { leaveId } = req.params;
    const { isApproved } = req.query;

    const leaveData = await userModel.approveLeave({
      leaveId,
      isApproved: isApproved === "true",
    });

    if (!leaveData) {
      return res.status(404).json({ message: "Leave not found" });
    }

    res.status(200).json({
      message: `Leave was successfully ${
        isApproved ? "approved" : "disapproved"
      }`,
      leave: leaveData,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error approving/disapproving leave", error: err });
  }
};

export const applyLeaves = async (req, res, next) => {
  try {
    const { email, startDate, endDate, isCl, reason } = req.body;

    if (!email || !startDate || !endDate) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const leave = await userModel.applyLeave([
      email,
      startDate,
      endDate,
      isCl,
      reason,
    ]);
    res.status(201).json({ message: "Leave applied", leave });
  } catch (err) {
    res.status(500).json({ message: "Error applying leave", error: err });
  }
};
