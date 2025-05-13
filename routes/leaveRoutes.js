import express from "express";
import { applyLeaves, approveLeave, getLeaveData } from "../controllers/leaveController.js";
import { checkAdmin, authenticateToken } from "../middleware/validate-login.js";
import pool from "../database/db.js";


const leaveRoutes = express.Router();

// ✅ Existing routes
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

// ✅ New route for My Leaves
leaveRoutes.get("/myleaves", authenticateToken, async (req, res) => {
  const email = req.user.email; // ✅ Extract email from token

  try {
    const result = await pool.query(
      `SELECT 
          leave_id AS id, 
          start_date AS "fromDate", 
          end_date AS "toDate", 
          leave_apply_date AS "leaveApplyDate",
          reason,
          is_approved AS "isApproved",
          issettled AS "isSettled",
          iscl
       FROM leaves
       WHERE email = $1
       ORDER BY start_date DESC`,
      [email]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching my leaves", error);
    res.status(500).json({ error: "Server error" });
  }
});



export default leaveRoutes;
