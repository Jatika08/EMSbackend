const { validationResult } = require("express-validator");
const { User } = require("../models/user");
const jwt = require("jsonwebtoken");
const { hashPassword, verifyPassword } = require("./hashingController");

const JWT_SECRET = process.env.JWT_SECRET;

const loginUser = async (req, res) => {
  console.log("🔹 Login Request Received:", req.body);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("❌ Validation Error:", errors.array());
    return res
      .status(400)
      .json({ message: "Invalid Data", errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ where: { email } });

    console.log("Found user:", existingUser);
    
    if (!existingUser) {
      console.log("❌ User Not Found!");
      return res
        .status(404)
        .json({ message: "User not found with this email.", success: false });
    }

    const isValidPassword = await verifyPassword(
      password,
      existingUser.password
    );
    console.log(password, existingUser.password);
    if (!isValidPassword) {
      console.log("❌ Password Mismatch!");
      return res
        .status(401)
        .json({ message: "Invalid Password", success: false });
    }

    if (!JWT_SECRET) {
      console.log("❌ JWT_SECRET is not defined in environment!");
      return res
        .status(500)
        .json({ message: "Server configuration error. JWT secret missing." });
    }

    const token = jwt.sign(
      {
        email: existingUser.email,
        userId: existingUser.id,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log("✅ Login Successful!");
    return res.status(200).json({
      message: "Login Successful",
      success: true,
      user: existingUser,
      token,
    });
  } catch (error) {
    console.error("❌ Login Error:", error);
    return res.status(500).json({ message: "Database Error", error });
  }
};

const newUser = async (req, res, next) => {
  const {
    email,
    password,
    name,
    position,
    aadhar,
    panNo,
    address,
    dateOfBirth,
    githubId,
    linkedInId,
    phone,
    isSuperUser,
  } = req.body;

  // Check if user already exists
  let existingUser;
  try {
    existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Database Error", error });
  }

  // Hash the password before saving
  const hashedPassword = await hashPassword(password);

  // Create the user with hashed password
  const createdUser = await User.create({
    email,
    password: hashedPassword, // Store hashed password here
    name,
    position,
    aadhar,
    panNo,
    address,
    dateOfBirth,
    githubId,
    linkedInId,
    phone,
    isSuperUser,
  });

  // Send response back to the client
  res.status(201).json({ message: "User Created", user: createdUser });
};

module.exports = { loginUser, newUser };
