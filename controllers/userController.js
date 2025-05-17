import { userModel } from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { hashPassword } from "./hashingController.js";

// =========================
// New User Registration (by Admin)
// =========================
export async function newUser(req, res, next) {
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

// =========================
// User Login
// =========================
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

// =========================
// User Self Registration (after admin approval)
// =========================
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

    if (existingUser.temporary_token === null) {
      return res.status(409).json({
        message: "User already exists or credentials do not match",
      });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await userModel.patchUser(email, {
      password: hashedPassword,
      ...rest,
    });

    res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (err) {
    res.status(500).json({
      message: "User registration failed",
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

// =========================
// Get Current Logged In User Profile (My Profile Page)
// =========================
export async function getUserProfile(req, res, next) {
  try {
    const email = req.query.email;
  

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const currentUser = await userModel.getUserByEmail(email);

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const userProfile = {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone,
      position: currentUser.position,
      department: currentUser.department,
      image: currentUser.image,
      joiningDate: currentUser.joining_date,
      address: currentUser.address,
      linkedInId: currentUser.linked_in_id,
      githubId: currentUser.github_id,
      dateOfBirth: currentUser.date_of_birth,
    };

    return res.status(200).json(userProfile);
  } catch (err) {
    next(err);
  }
}

// =========================
// Get Team Information (Optional)
// =========================
export async function myTeamToday(req, res, next) {
  try {
    const email = req.body.email; // Again frontend must send email if not using token

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const teamData = await userModel.myTeamToday(email);
    return res.status(200).json(teamData);
  } catch (err) {
    next(err);
  }
}

// =========================
// Get All Users (Admin view)
// =========================
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
