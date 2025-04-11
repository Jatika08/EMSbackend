const bcrypt = require("bcryptjs");

const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(plainPassword, salt);
  return hashed;
};

const verifyPassword = async (plainPassword, hashedPassword) => {
  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
  return true;
};

module.exports = { hashPassword, verifyPassword };
