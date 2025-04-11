const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const statusCode = 401;
      console.log("❌ Authorization header missing or malformed");
      console.log(`📍 Route: ${req.path}`);
      console.log(`🚫 Responding with status ${statusCode}`);
      return res.status(statusCode).json({
        message: "Authentication failed: No token provided",
        route: req.path,
        code: statusCode,
      });
    }

    const token = authHeader.split(" ")[1];
    console.log("🛡️ Incoming Token:", token);
    console.log("🔐 JWT_SECRET:", process.env.JWT_SECRET || "jatika");

    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET || "jatika"
    );

    req.user = {
      userId: decodedToken.userId,
      email: decodedToken.email,
    };

    console.log("✅ Token verified. User ID:", decodedToken.userId);
    console.log("✅ Middleware: decoded req.user =", req.user);
    next();
  } catch (err) {
    const statusCode = 401;
    console.log(`❌ Authentication Error: ${err.name} - ${err.message}`);
    console.log(`📍 Route: ${req.path}`);
    console.log(`🚫 Responding with status ${statusCode}`);

    return res.status(statusCode).json({
      message: "Authentication failed: Invalid token",
      error: {
        name: err.name,
        message: err.message,
      },
      route: req.path,
      code: statusCode,
    });
  }
};
