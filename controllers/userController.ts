import { Request, Response, NextFunction } from "express";
import { userModel } from "../models/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { hashPassword, verifyPassword } from "./hashingController";

export async function newUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, ...rest } = req.body;

    const existingUser = await userModel.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await userModel.createUser({
      email,
      password: hashedPassword,
      ...rest,
    });

    res.status(201).json({ message: "User created", user: newUser });
  } catch (err) {
    next(err);
  }
}
export async function loginUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, password } = req.body;

    const user = await userModel.getUserByEmail(email);
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "hello",
      { expiresIn: "1h" }
    );

    res.status(200).json({ token, userId: user.id });
  } catch (err) {
    next(err);
  }
}

export async function getUserProfile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userIdParam = req.query.email;
    const currentUserId = req.query.email;

    const targetUser = userIdParam
      ? await userModel.getMe(userIdParam as string)
      : await userModel.getUserByEmail(currentUserId as string);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isSelf = String(currentUserId) === String(targetUser.id);

    const userProfile = isSelf
      ? targetUser
      : {
          id: targetUser.id,
          name: targetUser.name,
          position: targetUser.position,
          image: targetUser.image,
          linkedInId: targetUser.linked_in_id,
        };

    res.status(200).json(userProfile);
  } catch (err) {
    next(err);
  }
}

export async function getAllUsers(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const departmentIds = req.query.departmentIds
      ? String(req.query.departmentIds)
          .split(",")
          .map((id) => parseInt(id.trim()))
      : [];

    const users = await userModel.getAllUsers(departmentIds);
    res.status(200).json({ users });
  } catch (err) {
    next(err);
  }
}
