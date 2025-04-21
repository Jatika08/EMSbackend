import { Request, Response } from "express";
import { userModel } from "../models/user";

export async function createUserByAdmin(req: Request, res: Response) {
  try {
    const {
      email,
      password,
      joiningDate,
      position,
      name,
      aadhar,
      panNo,
      isSuperUser,
      image,
      address,
      linkedInId,
      phone,
      githubId,
      dateOfBirth,
      leaveDate = [],
    } = req.body;


    if (!email || !password || !name || !position) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user = await userModel.createUser({
      email,
      password,
      joiningDate,
      position,
      name,
      aadhar,
      panNo,
      isSuperUser,
      image,
      address,
      linkedInId,
      phone,
      githubId,
      dateOfBirth,
      leaveDate,
    });

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({
      message: "User creation failed",
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

export async function updateUserByAdmin(req: Request, res: Response) {
  const updated = await userModel.updateUser(req.params.id, req.body);
  res.status(200).json(updated);
}

export async function patchUserByAdmin(req: Request, res: Response) {
  const patched = await userModel.updateUser(req.params.id, req.body);
  res.status(200).json(patched);
}

export async function deleteUserByAdmin(req: Request, res: Response) {
  const deleted = await userModel.deleteUser(req.params.id);
  res.status(200).json(deleted);
}
