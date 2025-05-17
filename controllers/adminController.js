import { userModel } from "../models/user.js";
import { generateTemporaryToken } from "../utils/functions.js";

export async function createUserByAdmin(req, res) {
  try {
    const { email, date_of_birth } = req.body;

    if (!email || !date_of_birth) {
      console.error(email);
      return res.status(400).json({ message: "Missing required fields" });
    }

    const temporary_token = generateTemporaryToken();

    const user = await userModel.createUser({
      email,
      date_of_birth,
      temporary_token,
    });

    res.status(201).json({ ...user, temporary_token });
  } catch (err) {
    res.status(500).json({
      message: "User creation failed",
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

export async function updateUserByAdmin(req, res) {
  const updated = await userModel.updateUser(req.params.email, req.body);
  res.status(200).json(updated);
}

export async function getUserByAdmin(req, res) {
  const data = await userModel.getUserByEmail(req.params.email, true);
  res.status(200).json(data);
}

export async function patchUserByAdmin(req, res) {
  const patched = await userModel.updateUser(req.params.email, req.body);
  res.status(200).json(patched);
}

export async function deleteUserByAdmin(req, res) {
  console.log("xdxd")
  const deleted = await userModel.deleteUser(req.params.email);
  res.status(200).json(deleted);
}

export async function resumeUserByAdmin(req, res) {
  const reactivated = await userModel.resumeUser(req.params.email);
  res.status(200).json(reactivated);
}

export async function createNotice(req, res) {
  try {
    const { notice_title, notice_text } = req.body;

    if (!notice_title || !notice_text) {
      return res.status(400).json({ message: "Title and text are required" });
    }

    const newNotice = await userModel.makeNotice(notice_title, notice_text);
    return res
      .status(201)
      .json({ message: "Notice created", notice: newNotice });
  } catch (err) {
    console.error("Error creating notice:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getNotices(req, res) {
  try {
    const notices = await userModel.getAllNotices();
    return res.status(200).json({ notices });
  } catch (err) {
    console.error("Error fetching notices:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
