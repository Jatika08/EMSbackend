import pool from "../database/db.js";

// Type definitions
// interface User {
//   id?: number;
//   email: string;
//   password: string;
//   joiningDate?: string;
//   position?: string;
//   name?: string;
//   aadhar?: string;
//   panNo?: string;
//   isSuperUser?: boolean;
//   image?: string;
//   address?: string;
//   linkedInId?: string;
//   phone?: string;
//   githubId?: string;
//   dateOfBirth?: string;
//   leaveDate?: string[];
// }

// interface ApprovedLeaveParams {
//   startDate: string;
//   endDate: string;
// }

async function createUser(user) {
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

async function getUserPasswordByEmail(email) {
  const res = await pool.query(
    "SELECT password,id,email FROM users WHERE email = $1 AND isactive = TRUE",
    [email]
  );
  return res.rows[0];
}

async function getUserByEmail(email) {
  const res = await pool.query(
    "SELECT email, position, name FROM users WHERE email = $1 AND isactive = TRUE",
    [email]
  );
  return res.rows[0];
}

async function getUserById(id, isAdmin = false) {
  const query = isAdmin
    ? "SELECT * FROM users WHERE id = $1 and isactive = TRUE"
    : "SELECT email, position, name FROM users WHERE id = $1 and isactive = TRUE";

  const res = await pool.query(query, [id]);
  return res.rows[0];
}

async function getMe(email) {
  const res = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return res.rows[0];
}

async function getAllUsers(departmentIds = []) {
  let query = "SELECT * FROM users";
  let values = [];

  if (departmentIds.length > 0) {
    const placeholders = departmentIds.map((_, i) => `$${i + 1}`).join(", ");
    query += ` WHERE departmentId IN (${placeholders})`;
    values = departmentIds;
  }

  const res = await pool.query(query, values);
  return res.rows;
}

async function updateUser(id, updates) {
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

async function deleteUser(id) {
  const res = await pool.query(
    "UPDATE users SET isactive = FALSE WHERE id = $1 RETURNING *",
    [id]
  );
  return res.rows[0];
}

async function applyLeave(values) {
  const q =
    "INSERT INTO leaves (email, start_date, end_date) VALUES ($1, $2, $3) RETURNING *";
  const res = await pool.query(q, values);
  return res.rows[0];
}

async function applyHalfDay(values) {
  return applyLeave(values);
}

async function applyWfh(values) {
  const q =
    "INSERT INTO wfh (email, start_date, end_date) VALUES ($1, $2, $3) RETURNING *";
  const res = await pool.query(q, values);
  return res.rows[0];
}

async function approveLeave({ email, leaveId }) {
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

async function getLeavesFiltered(filters) {
  const {
    email,
    fromMonth,
    fromYear,
    toMonth,
    toYear,
    isApproved,
    limit,
    offset,
  } = filters;

  const values = [];
  let whereClauses = [];

  if (email) {
    values.push(email);
    whereClauses.push(`email = $${values.length}`);
  }

  if (typeof isApproved === "boolean") {
    values.push(isApproved);
    whereClauses.push(`is_approved = $${values.length}`);
  }

  if (fromMonth && fromYear) {
    values.push(`${fromYear}-${String(fromMonth).padStart(2, "0")}-01`);
    whereClauses.push(`start_date >= $${values.length}`);
  }

  if (toMonth && toYear) {
    const lastDay = new Date(toYear, toMonth, 0).getDate();
    values.push(`${toYear}-${String(toMonth).padStart(2, "0")}-${lastDay}`);
    whereClauses.push(`end_date <= $${values.length}`);
  }

  const whereClause =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const q = `
    SELECT * FROM (
      SELECT * FROM leaves
      UNION ALL
      SELECT * FROM wfh
    ) AS combined
    ${whereClause}
    ORDER BY leave_apply_date DESC
    LIMIT $${values.length + 1} OFFSET $${values.length + 2};
  `;

  values.push(limit);
  values.push(offset);

  const res = await pool.query(q, values);
  return res.rows;
}

async function getApprovedLeavesWfh({ startDate, endDate }) {
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

async function getLeavesByEmail(email) {
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

const isSuperUser = async (email) => {
  try {
    const result = await pool.query(
      "SELECT is_super_user FROM users WHERE email = $1",
      [email]
    );
    if (result.rows.length === 0) {
      return false;
    }

    return result.rows[0].is_super_user === true;
  } catch (error) {
    console.error("Error checking super user status:", error);
    throw new Error("Database error");
  }
};

async function setToken(userId, token) {
  await pool.query("DELETE FROM user_tokens WHERE user_id = $1", [userId]);

  const q =
    "INSERT INTO user_tokens (user_id, token) VALUES ($1, $2) RETURNING *";
  const res = await pool.query(q, [userId, token]);
  return res.rows[0];
}

async function getToken(userId, token) {
  const q = "SELECT * FROM user_tokens WHERE user_id = $1 AND token = $2";
  const res = await pool.query(q, [userId, token]);
  return res.rows[0];
}

export const userModel = {
  getUserPasswordByEmail,
  setToken,
  getToken,
  isSuperUser,
  createUser,
  initDatabase,
  getUserByEmail,
  getUserById,
  getMe,
  getAllUsers,
  updateUser,
  deleteUser,
  applyLeave,
  applyHalfDay,
  applyWfh,
  approveLeave,
  getLeavesFiltered,
  getApprovedLeavesWfh,
  getLeavesByEmail,
};
