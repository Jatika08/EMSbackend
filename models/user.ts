import pool from "../database/db";

// Type definitions
interface User {
  id?: number;
  email: string;
  password: string;
  joiningDate?: string;
  position?: string;
  name?: string;
  aadhar?: string;
  panNo?: string;
  isSuperUser?: boolean;
  image?: string;
  address?: string;
  linkedInId?: string;
  phone?: string;
  githubId?: string;
  dateOfBirth?: string;
  leaveDate?: string[];
}

interface ApprovedLeaveParams {
  startDate: string;
  endDate: string;
}

async function createUser(user: User) {
  const {
    email,
    password,
    joiningDate,
    position,
    name,
    aadhar,
    panNo,
    isSuperUser,
    image,
    address,
    linkedInId,
    phone,
    githubId,
    dateOfBirth,
    leaveDate = [],
  } = user;

  const query = `
    INSERT INTO users (
      email, password, joining_date, position, name, aadhar, pan_no,
      is_super_user, image, address, linked_in_id, phone, github_id,
      date_of_birth, leave_date
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12, $13,
            $14, $15)
    RETURNING *;
  `;

  const values = [
    email,
    password,
    joiningDate,
    position,
    name,
    aadhar,
    panNo,
    isSuperUser ?? false,
    image,
    address,
    linkedInId,
    phone,
    githubId,
    dateOfBirth,
    JSON.stringify(leaveDate),
  ];

  const res = await pool.query(query, values);
  return res.rows[0];
}

async function initDatabase() {
  await pool.query(`
    CREATE TABLE if not exists users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      joining_date DATE,
      position TEXT,
      name TEXT,
      aadhar TEXT,
      pan_no TEXT,
      is_super_user BOOLEAN DEFAULT FALSE,
      image TEXT,
      address TEXT,
      linked_in_id TEXT,
      phone TEXT,
      github_id TEXT,
      date_of_birth DATE,
      isActive BOOLEAN DEFAULT TRUE,
      leave_date JSONB DEFAULT '[]'::jsonb,
      is_approved BOOLEAN DEFAULT FALSE
    );
  `);

  await pool.query(`
    CREATE TABLE if not exists leaves (
      email TEXT REFERENCES users(email),
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      leave_apply_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_approved BOOLEAN DEFAULT FALSE
    );
  `);

  await pool.query(`
    CREATE TABLE if not exists wfh (
      email TEXT REFERENCES users(email),
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      leave_apply_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_approved BOOLEAN DEFAULT FALSE
    );
  `);

  await pool.query(`
    CREATE TABLE if not exists user_tokens (
      tokens_id SERIAL PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

async function getUserByEmail(email: string) {
  const res = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return res.rows[0];
}

async function getMe(email: string) {
  const res = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return res.rows[0];
}

async function getAllUsers(departmentIds: number[] = []) {
  let query = "SELECT * FROM users";
  let values: number[] = [];

  if (departmentIds.length > 0) {
    const placeholders = departmentIds.map((_, i) => `$${i + 1}`).join(", ");
    query += ` WHERE departmentId IN (${placeholders})`;
    values = departmentIds;
  }

  const res = await pool.query(query, values);
  return res.rows;
}

async function updateUser(id: number, updates: Partial<User>) {
  const fields = Object.keys(updates);
  const values = Object.values(updates);

  const setClause = fields
    .map((field, idx) => `${field} = $${idx + 1}`)
    .join(", ");

  const query = `
    UPDATE users SET ${setClause}
    WHERE id = $${fields.length + 1}
    RETURNING *;
  `;

  const res = await pool.query(query, [...values, id]);
  return res.rows[0];
}

async function deleteUser(id: number) {
  const res = await pool.query("DELETE FROM users WHERE id = $1 RETURNING *", [
    id,
  ]);
  return res.rows[0];
}

async function applyLeave(values: [string, string, string]) {
  const q =
    "INSERT INTO leaves (email, start_date, end_date) VALUES ($1, $2, $3) RETURNING *";
  const res = await pool.query(q, values);
  return res.rows[0];
}

async function applyHalfDay(values: [string, string, string]) {
  return applyLeave(values); // same as applyLeave
}

async function applyWfh(values: [string, string, string]) {
  const q =
    "INSERT INTO wfh (email, start_date, end_date) VALUES ($1, $2, $3) RETURNING *";
  const res = await pool.query(q, values);
  return res.rows[0];
}

async function approveLeave({
  email,
  leaveId,
}: {
  email: string;
  leaveId: string;
}) {
  const q = `
    UPDATE users
    SET is_approved = true
    WHERE email = $1
    AND leaveId = $2
    RETURNING *;
  `;
  const res = await pool.query(q, [email, leaveId]);
  return res.rows[0];
}

async function getRecentlyPostedLeaves(limit: number, offset: number) {
  const q = `
    SELECT * FROM (
      SELECT * FROM leaves
      UNION
      SELECT * FROM wfh
    ) AS combined
    WHERE is_approved = false
    ORDER BY leave_apply_date ASC
    LIMIT $1 OFFSET $2;
  `;
  const res = await pool.query(q, [limit, offset]);
  return res.rows;
}

async function getApprovedLeavesWfh({
  startDate,
  endDate,
}: ApprovedLeaveParams) {
  const q = `
    SELECT * FROM (
      SELECT * FROM leaves
      UNION ALL
      SELECT * FROM wfh
    ) AS combined
    WHERE is_approved = true
    AND start_date <= $2
    AND end_date >= $1
    ORDER BY start_date ASC;
  `;
  const res = await pool.query(q, [startDate, endDate]);
  return res.rows;
}

async function getLeavesByEmail(email: string) {
  const q = `
    SELECT * FROM (
      SELECT * FROM leaves
      UNION ALL
      SELECT * FROM wfh
    ) AS combined
    WHERE email = $1
    ORDER BY leave_apply_date DESC;
  `;
  const res = await pool.query(q, [email]);
  return res.rows;
}

export const userModel = {
  createUser,
  initDatabase,
  getUserByEmail,
  getMe,
  getAllUsers,
  updateUser,
  deleteUser,
  applyLeave,
  applyHalfDay,
  applyWfh,
  approveLeave,
  getRecentlyPostedLeaves,
  getApprovedLeavesWfh,
  getLeavesByEmail,
};
