import jwt from "jsonwebtoken";
import { userModel } from "../models/user.js";

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Authorization header missing or invalid" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "hello");

    const result = await userModel.getToken(decoded.userId, token);
    if (!result) {
      return res.status(401).json({ message: "Token invalid or revoked" });
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Token is invalid or expired" });
  }
}

export const checkAdmin = async (req, res, next) => {
  try {
    // const { email } = req.body;
    const email = req.user?.email;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const superUser = await userModel.isSuperUser(email);

    if (!superUser) {
      return res.status(403).json({ message: "Admins only." });
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};