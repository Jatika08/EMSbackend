import { userModel } from "../models/user.js";
import { sendMail } from "../utils/mailer.js";

// Utility: Format date to readable IST string
const formatDateLocal = (isoDate) => {
  if (!isoDate) return "Invalid Date";
  const date = new Date(isoDate);
  return isNaN(date.getTime())
    ? "Invalid Date"
    : date.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "2-digit",
        timeZone: "Asia/Kolkata",
      });
};

// GET /leaves?isApproved=false&isSettled=false
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
      id,
      page = 1,
      limit = 10,
    } = req.query;

    const filters = {
      email,
      fromMonth: parseInt(fromMonth),
      fromYear: parseInt(fromYear),
      toMonth: parseInt(toMonth),
      toYear: parseInt(toYear),
      id: id ?? undefined,
      isApproved: isApproved !== undefined ? isApproved === "true" : undefined,
      isSettled:
        isSettled === "true" ? true : isSettled === "false" ? false : undefined,
      offset: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit),
    };

    const leaveData = await userModel.getLeavesFiltered(filters);

    const formatted = leaveData.map((l) => ({
      ...l,
      start_date: formatDateLocal(l.start_date),
      end_date: formatDateLocal(l.end_date),
    }));

    res.status(200).json(formatted);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching leave data",
      error: err.message,
    });
  }
};

// PATCH /leaves/approve-disapprove/:leaveId?isApproved=true
export const approveLeave = async (req, res, next) => {
  try {
    const { leaveId } = req.params;
    const { isApproved } = req.query;
    const isApprovedBool = isApproved === "true";

    const leaveData = await userModel.approveLeave({
      leaveId,
      isApproved: isApprovedBool,
    });

    if (!leaveData) {
      return res.status(404).json({ message: "Leave not found" });
    }

    const employeeEmail = leaveData?.email || leaveData?.user_email || "";
    const startDate = formatDateLocal(leaveData?.start_date);
    const endDate = formatDateLocal(leaveData?.end_date);

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
    res.status(500).json({
      message: "Error approving/disapproving leave",
      error: err.message,
    });
  }
};

// POST /leaves/apply
export const applyLeaves = async (req, res, next) => {
  try {
    const { email, startDate, endDate, isCl, reason } = req.body;

    if (!email || !startDate || !endDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Safely correct timezone issues by forcing mid-day local time
    const correctedStart = new Date(`${startDate}T12:00:00`);
    const correctedEnd = new Date(`${endDate}T12:00:00`);

    const leave = await userModel.applyLeave([
      email,
      correctedStart,
      correctedEnd,
      isCl,
      reason,
    ]);

    res.status(201).json({ message: "Leave applied", leave });
  } catch (err) {
    res.status(500).json({
      message: "Error applying leave",
      error: err.message,
    });
  }
};
