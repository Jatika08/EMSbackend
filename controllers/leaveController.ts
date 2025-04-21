import { userModel } from "../models/user";

const getLeaveData = async (req, res) => {
  try {
    const { email } = req.body;
    const leaveData = await userModel.getLeavesByEmail(email);
    res.status(200).json(leaveData);
  } catch (err) {
    res.status(500).json({ message: "Error fetching leave data", error: err });
  }
};

const approveLeave = async (req, res) => {
  try {
    const { email, leaveId } = req.body;
    const leaveData = await userModel.approveLeave({email, leaveId});
    res.status(200).json(leaveData);
  } catch (err) {
    res.status(500).json({ message: "Error approving leave", error: err });
  }
};
