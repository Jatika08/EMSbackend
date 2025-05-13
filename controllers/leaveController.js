import { userModel } from "../models/user.js";
import { sendMail } from "../utils/mailer.js";

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

    const filters = {
      email,
      fromMonth: parseInt(fromMonth),
      fromYear: parseInt(fromYear),
      toMonth: parseInt(toMonth),
      toYear: parseInt(toYear),
      isApproved: isApproved !== undefined ? isApproved === "true" : undefined,
      isSettled:
        isSettled !== undefined
          ? isSettled === "true"
          : isSettled === "false"
          ? "false"
          : undefined,
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
    const isApprovedBool = isApproved === "true"; // Convert to boolean safely

    const leaveData = await userModel.approveLeave({
      leaveId,
      isApproved: isApprovedBool,
    });

    if (!leaveData) {
      return res.status(404).json({ message: "Leave not found" });
    }

    // Send Email Notification to Employee
    const employeeEmail = leaveData?.email || leaveData?.user_email || "";
    const startDate = leaveData?.start_date || "Start Date";
    const endDate = leaveData?.end_date || "End Date";

    if (employeeEmail) {
      await sendMail(
        employeeEmail,
        `Your Leave Request has been ${
          isApprovedBool ? "Approved" : "Rejected"
        }`,
        `Hello,\n\nYour leave from ${startDate} to ${endDate} has been ${
          isApprovedBool ? "approved" : "rejected"
        }.\n\nThank you,\nEMS System`
      );
    }

    res.status(200).json({
      message: `Leave was successfully ${
        isApprovedBool ? "approved" : "disapproved"
      }`,
      leave: leaveData,
    });
  } catch (err) {
    console.error("Error in approveLeave:", err);
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
