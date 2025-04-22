import { userModel } from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { hashPassword, verifyPassword } from "./hashingController.js";


export async function newUser(req, res, next) {
  try {
    const { email, password, ...rest } = req.body;

    const existingUser = await userModel.getUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ message: "User already exists" });
      return;
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

export async function loginUser(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await userModel.getUserPasswordByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "hello",
      { expiresIn: "1h" }
    );

    await userModel.setToken(user.id, token);

    return res.status(200).json({ token, userId: user.id, email: user.email });
  } catch (err) {
    next(err);
  }
}

export function registerUserbyUser(req, res) {
  const { email, password, date_of_birth, ...rest } = req.body;

  if (!email || !password || !date_of_birth) {
    return res
      .status(400)
      .json({ message: "Email, DOB, and password are required" });
  }

  userModel
    .getUserByEmail(email)
    .then((existingUser) => {
      if (!existingUser) {
        res.status(404).json({ message: "Email not approved by admin" });
        throw new Error("Stop chain");
      }

      const dobInDB = new Date(existingUser.date_of_birth)
        .toISOString()
        .split("T")[0];
      const dobInReq = new Date(date_of_birth).toISOString().split("T")[0];

      if (existingUser.password !== null || dobInDB !== dobInReq) {
        res
          .status(409)
          .json({ message: "User already exists or DOB doesn't match" });
        throw new Error("Stop chain");
      }

      return hashPassword(password);
    })
    .then((hashedPassword) => {
      return userModel.createUser({
        email,
        password: hashedPassword,
        ...rest,
      });
    })
    .then((newUser) => {
      res.status(201).json({ message: "User created", user: newUser });
    })
    .catch((err) => {
      if (err.message === "Stop chain") return;
      res.status(500).json({
        message: "User creation failed",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    });
}

export async function getUserProfile(req, res, next) {
  try {
    const userIdParam = req.body.email;
    const currentUserId = req.body.email;

    const targetUser = userIdParam
      ? await userModel.getMe(userIdParam)
      : await userModel.getUserByEmail(currentUserId);

    if (!targetUser) {
      return res
        .status(404)
        .json({ message: currentUserId + " user not found" });
    }

    const isSelf = String(currentUserId) === String(targetUser.id);

    const userProfile = isSelf
      ? targetUser
      : {
          id: targetUser.id,
          email: targetUser.email,
          joining_date: targetUser.joining_date,
          date_of_birth: targetUser.date_of_birth,
          phone: targetUser.phone,
          name: targetUser.name,
          position: targetUser.position,
          linkedInId: targetUser.linked_in_id,
        };
    return res.status(200).json(userProfile);
  } catch (err) {
    next(err);
  }
}

export async function getAllUsers(req, res, next) {
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
