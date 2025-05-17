import { userModel } from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { hashPassword } from "./hashingController.js";

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
    console.log(user);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "hello",
      { expiresIn: "7h" }
    );

    await userModel.setToken(user.id, token);

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        position: user.position,
        departmentName: user.department_name,
        isSuperUser: user.is_super_user,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function registerUserbyUser(req, res) {
  const { email, password, date_of_birth, temporary_token, ...rest } = req.body;

  if (!email || !password || !date_of_birth || !temporary_token) {
    return res.status(400).json({
      message: "Email, DOB, password, and temporary token are required",
    });
  }

  try {
    const existingUser = await userModel.getUserByEmail(email);

    if (!existingUser) {
      return res.status(404).json({ message: "Email not approved by admin" });
    }

    console.log(existingUser);

    const dobInDB = new Date(existingUser.date_of_birth)
      .toISOString()
      .split("T")[0];
    const dobInReq = new Date(date_of_birth).toISOString().split("T")[0];
    if (existingUser.temporary_token === null) {
      return res.status(409).json({
        message: "User already exists or credentials do not match",
      });
    }

    const hashedPassword = await hashPassword(password);
    console.log("About to patch user with:", {
      email,
      password: hashedPassword,
      ...rest,
    });

    const newUser = await userModel.patchUser(email, {
      password: hashedPassword,
      ...rest,
    });

    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
  } catch (err) {
    res.status(500).json({
      message: "User registration failed",
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

export async function getUserProfile(req, res, next) {
  try {
    console.log(req.user?.email);
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

export async function getUser(req, res, next) {
  try {
    const id = req.params.id;
    const user = await userModel.getUserById(id, true);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

export async function myTeamToday(req, res, next) {
  try {
    const email = req.user.email;
    const teamData = await userModel.myTeamToday(email);
    return res.status(200).json(teamData);
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
