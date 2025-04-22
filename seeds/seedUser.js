import dotenv from "dotenv";
import pool from "../database/db.js";
import { hashPassword } from "../controllers/hashingController.js";

dotenv.config();

const seedAdminUser = async () => {
  try {
    await pool.query("SELECT 1");

    const hashedPassword = await hashPassword("test123");

    const result = await pool.query(
      `INSERT INTO users (
        email, password, joining_date, position, name, aadhar, pan_no, 
        is_super_user, address, date_of_birth, phone, leave_date
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12
      )
      ON CONFLICT (email) DO NOTHING
      RETURNING *`,
      [
        "test@example.com",
        hashedPassword,
        new Date(),
        "Tester",
        "Test User",
        "123412341234",
        "ABCDE1234F",
        true,
        "456 Test Street",
        new Date("1995-05-05"),
        "1234567890",
        JSON.stringify([]),
      ]
    );

    if (result.rows.length > 0) {
      console.log("Admin user seeded:", result.rows[0]);
    } else {
      console.log("Admin user already exists.");
    }
  } catch (err) {
    console.error("Failed to seed admin user:", err);
  }
};

if (process.argv[1] === new URL(import.meta.url).pathname) {
  seedAdminUser();
}

export default seedAdminUser;
