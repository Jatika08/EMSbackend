import bcrypt from "bcryptjs";

export const hashPassword = async (plainPassword) => {
  try {
    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(plainPassword, salt);
    return hashed;
  } catch (error) {
    console.error("Error hashing password:", error);
    throw error;
  }
};

// export const verifyPassword = async (plainPassword, hashedPassword) => {
//   try {
//     const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
//     return isMatch;
//   } catch (error) {
//     console.error("Error verifying password:", error);
//     return false;
//   }
// };
