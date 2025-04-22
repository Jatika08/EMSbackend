import jwt from "jsonwebtoken";
const { verify } = jwt;

const checkAuth = (req, res, next) => {
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
    const decodedToken = verify(token, process.env.JWT_SECRET || "hello");

    req.user = {
      userId: decodedToken.userId,
      email: decodedToken.email,
    };

    next();
  } catch (err) {
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
