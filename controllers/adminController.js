import { userModel } from "../models/user.js";
import { generateTemporaryToken } from "../utils/functions.js";

export async function createUserByAdmin(req, res) {
  try {
    const { email, dateOfBirth } = req.body;

    if (!email || !dateOfBirth) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const temporary_token = generateTemporaryToken();

    const user = await userModel.createUser({
      email,
      dateOfBirth,
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
  const updated = await userModel.updateUser(req.params.id, req.body);
  res.status(200).json(updated);
}

export async function getUserByIdForAdmin(req, res) {
  const data = await userModel.getUserById(req.params.id, true);
  res.status(200).json(data);
}

export async function patchUserByAdmin(req, res) {
  const patched = await userModel.updateUser(req.params.id, req.body);
  res.status(200).json(patched);
}

export async function deleteUserByAdmin(req, res) {
  const deleted = await userModel.deleteUser(req.params.id);
  res.status(200).json(deleted);
}
