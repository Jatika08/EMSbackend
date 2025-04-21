import { RequestHandler } from "express";
import { verify } from "jsonwebtoken";
import { AuthenticatedRequest } from "../types/types";

const checkAuth: RequestHandler = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        message: "Authentication failed: No token provided",
        route: req.path,
        code: 401,
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = verify(token, process.env.JWT_SECRET || "hello") as {
      userId: string;
      email: string;
    };

    (req as AuthenticatedRequest).user = {
      userId: decodedToken.userId,
      email: decodedToken.email,
    };

    next();
  } catch (err: any) {
    res.status(401).json({
      message: "Authentication failed: Invalid token",
      error: {
        name: err.name,
        message: err.message,
      },
      route: req.path,
      code: 401,
    });
    return;
  }
};


export default checkAuth;