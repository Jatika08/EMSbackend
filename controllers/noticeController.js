import { userModel } from "../models/user.js";

// GET all notices
export const getNotices = async (req, res) => {
  try {
    const notices = await userModel.getAllNotices(); // implement in model
    res.status(200).json(notices);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notices", error: err.message });
  }
};

// POST a new notice
export const addNotice = async (req, res) => {
  try {
    const { notice_title, notice_text } = req.body;
    const notice_time = new Date();
    await userModel.makeNotice(notice_title, notice_text, notice_time);
    res.status(201).json({ message: "Notice added" });
  } catch (err) {
    res.status(500).json({ message: "Failed to add notice", error: err.message });
  }
};

// DELETE a notice
export const deleteNotice = async (req, res) => {
  try {
    const { notice_id } = req.params;
    const deleted = await userModel.removeNotice(notice_id);
    if (!deleted) {
      return res.status(404).json({ message: "Notice not found" });
    }
    res.status(200).json({ message: "Notice deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete notice", error: err.message });
  }
};


