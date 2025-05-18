import pool from "../database/db.js";

async function createUser(user) {
  const {
    email,
    joiningDate,
    position,
    password,
    name,
    aadhar,
    panNo,
    isSuperUser,
    image,
    address,
    linkedInId,
    phone,
    githubId,
    date_of_birth,
    temporary_token,
    leaveDate = [],
  } = user;

  const query = `
    INSERT INTO users (
      email,  joining_date, password, position, name, aadhar, pan_no,
      is_super_user, image, address, linked_in_id, phone, github_id,
      date_of_birth, temporary_token, leave_date
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12, $13,
            $14, $15, $16)
    RETURNING *;
  `;

  const values = [
    email,
    joiningDate,
    password,
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
    date_of_birth,
    temporary_token,
    JSON.stringify(leaveDate),
  ];

  const res = await pool.query(query, values);
  return res.rows[0];
}

async function patchUser(email, updates = {}) {
  const {
    joiningDate,
    position,
    password,
    aadhar,
    panNo,
    isSuperUser,
    image,
    address,
    linkedInId,
    phone,
    githubId,
    leaveDate,
    name,
    department,
  } = updates;

  const query = `
    UPDATE users
    SET
      joining_date = COALESCE($1, joining_date),
      password = COALESCE($2, password),
      position = COALESCE($3, position),
      aadhar = COALESCE($4, aadhar),
      pan_no = COALESCE($5, pan_no),
      is_super_user = COALESCE($6, is_super_user),
      image = COALESCE($7, image),
      address = COALESCE($8, address),
      linked_in_id = COALESCE($9, linked_in_id),
      phone = COALESCE($10, phone),
      github_id = COALESCE($11, github_id),
      leave_date = COALESCE($12, leave_date),
      name = COALESCE($13, name),
      department = COALESCE($14, department),
      temporary_token = NULL
    WHERE email = $15
    RETURNING *;
  `;

  const values = [
    joiningDate ?? null,
    password ?? null,
    position ?? null,
    aadhar ?? null,
    panNo ?? null,
    isSuperUser ?? null,
    image ?? null,
    address ?? null,
    linkedInId ?? null,
    phone ?? null,
    githubId ?? null,
    leaveDate ? JSON.stringify(leaveDate) : null,
    name ?? null,
    department ?? null,
    email,
  ];

  const res = await pool.query(query, values);
  return res.rows[0];
}

async function initDatabase() {
  await pool.query(`
    CREATE TABLE if not exists users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      joining_date DATE,
      position TEXT,
      name TEXT,
      aadhar TEXT,
      department TEXT,
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
      is_approved BOOLEAN DEFAULT FALSE,
      temporary_token TEXT
    );
  `);

  await pool.query(`
    CREATE TABLE if not exists leaves (
      leave_id UUID PRIMARY KEY  DEFAULT gen_random_uuid(),
      email TEXT REFERENCES users(email),
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      isCl BOOLEAN DEFAULT FALSE,
      leave_apply_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_approved BOOLEAN DEFAULT FALSE,
      isSettled BOOLEAN DEFAULT FALSE,
      reason TEXT
    );
  `);

  await pool.query(`CREATE OR REPLACE FUNCTION prevent_overlapping_leaves()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.start_date IS NULL OR NEW.end_date IS NULL OR NEW.email IS NULL THEN
    RAISE EXCEPTION 'Start date, end date, and email are required.';
  END IF;

  -- Overlapping check, excluding self in case of update
  IF EXISTS (
    SELECT 1
    FROM leaves
    WHERE email = NEW.email
      AND (
        NEW.start_date <= end_date AND NEW.end_date >= start_date
      )
      AND (TG_OP != 'UPDATE' OR leave_id != NEW.leave_id)  -- exclude self
  ) THEN
    RAISE EXCEPTION 'Overlapping leave exists for this user in the given date range.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`);

  await pool.query(`DROP TRIGGER IF EXISTS check_overlapping_leaves ON leaves;
CREATE TRIGGER check_overlapping_leaves
BEFORE INSERT OR UPDATE ON leaves
FOR EACH ROW
EXECUTE FUNCTION prevent_overlapping_leaves();
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

  await pool.query(`CREATE TABLE IF NOT EXISTS notices (
  notice_id SERIAL PRIMARY KEY,
  notice_time TIMESTAMP,
  notice_title TEXT,
  notice_text TEXT);`);
}

async function getUserPasswordByEmail(email) {
  const res = await pool.query(
    "SELECT password, id, email, position, is_super_user, name FROM users WHERE email = $1 AND isactive = TRUE",
    [email]
  );
  return res.rows[0];
}

async function getUserByEmail(email) {
  const res = await pool.query(
    "SELECT email, position, name,temporary_token,date_of_birth FROM users WHERE email = $1 AND isactive = TRUE",
    [email]
  );
  return res.rows[0];
}

async function getUserById(id, isAdmin = false) {
  const query = isAdmin
    ? "SELECT * FROM users WHERE id = $1"
    : "SELECT email, position, name FROM users WHERE id = $1";

  const res = await pool.query(query, [id]);
  return res.rows[0];
}

async function getMe(email) {
  const res = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return res.rows[0];
}

async function getAllUsers(departmentIds = []) {
  let query =
    "SELECT id,email,joining_date,position,name,date_of_birth,department,temporary_token,is_super_user,isactive FROM users";
  let values = [];

  if (departmentIds.length > 0) {
    const placeholders = departmentIds.map((_, i) => `$${i + 1}`).join(", ");
    query += ` WHERE departmentId IN (${placeholders})`;
    values = departmentIds;
  }

  const res = await pool.query(query, values);
  return res.rows;
}

async function updateUser(email, updates) {
  const fields = Object.keys(updates);
  const values = Object.values(updates);

  const setClause = fields
    .map((field, idx) => `${field} = $${idx + 1}`)
    .join(", ");

  const query = `
    UPDATE users SET ${setClause}
    WHERE email = $${fields.length + 1}
    RETURNING *;
  `;

  const res = await pool.query(query, [...values, email]);
  return res.rows[0];
}

async function deleteUser(email) {
  const res = await pool.query(
    "UPDATE users SET isactive = FALSE WHERE email = $1 RETURNING *",
    [email]
  );
  return res.rows[0];
}

async function resumeUser(email) {
  const res = await pool.query(
    "UPDATE users SET isactive = TRUE WHERE email = $1 RETURNING *",
    [email]
  );
  return res.rows[0];
}

async function applyLeave(values) {
  const q =
    "INSERT INTO leaves (email, start_date, end_date, isCl, reason) VALUES ($1, $2, $3, $4, $5) RETURNING *";
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

async function approveLeave({ leaveId, isApproved }) {
  const q = `
    UPDATE leaves
    SET is_approved = $1,
        isSettled = true
    WHERE leave_id = $2
    RETURNING *;
  `;
  try {
    const res = await pool.query(q, [isApproved, leaveId]);
    if (res.rowCount === 0) {
      throw new Error("Leave not found");
    }
    return res.rows[0];
  } catch (error) {
    console.error("Error approving leave:", error);
    throw error;
  }
}

async function getLeavesFiltered(filters) {
  const {
    email,
    fromMonth,
    fromYear,
    toMonth,
    toYear,
    isApproved,
    isSettled,
    limit,
    offset,
    id,
  } = filters;

  const values = [];
  let whereClauses = [];

  // if (email) {
  //   values.push(email);
  //   whereClauses.push(`email = $${values.length}`);
  // }

  let effectiveEmail = email;

  if (id && !email) {
    const userRes = await pool.query("SELECT email FROM users WHERE id = $1", [
      id,
    ]);
    if (userRes.rows.length === 0) {
      throw new Error("User not found");
    }
    effectiveEmail = userRes.rows[0].email;
  }

  if (effectiveEmail) {
    values.push(effectiveEmail);
    whereClauses.push(`email = $${values.length}`);
  }

  if (typeof isApproved === "boolean") {
    values.push(isApproved);
    whereClauses.push(`is_approved = $${values.length}`);
  }

  if (typeof isSettled === "boolean") {
    values.push(isSettled);
    whereClauses.push(`isSettled = $${values.length}`);
  }

  if (fromMonth && fromYear && toMonth && toYear) {
    const startOfMonth = `${fromYear}-${String(fromMonth).padStart(2, "0")}-01`;
    const lastDay = new Date(toYear, toMonth, 0).getDate();
    const endOfMonth = `${toYear}-${String(toMonth).padStart(
      2,
      "0"
    )}-${lastDay}`;

    values.push(startOfMonth);
    values.push(endOfMonth);
    values.push(startOfMonth);
    values.push(endOfMonth);

    whereClauses.push(
      `(start_date BETWEEN $${values.length - 3} AND $${
        values.length - 2
      } OR end_date BETWEEN $${values.length - 1} AND $${values.length})`
    );
  }

  const whereClause =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const q = `
    SELECT * FROM leaves
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

async function makeNotice(notice_title, notice_text) {
  const q =
    "INSERT INTO notices (notice_title,notice_text) values ($1,$2) RETURNING *";
  const res = await pool.query(q, [notice_title, notice_text]);
  return res.rows[0];
}

async function getAllNotices() {
  const q = "SELECT * from notices";
  const res = pool.query(q);
  return res.rows;
}

async function myTeamToday(email) {
  const q1 = "SELECT department FROM users WHERE email = $1";
  const res1 = await pool.query(q1, [email]);

  if (res1.rows.length === 0) {
    throw new Error("User not found");
  }

  const department = res1.rows[0].department;

  const q2 = `
    SELECT u.email, u.name,
      CASE
        WHEN EXISTS (
          SELECT 1 FROM leaves l
          WHERE l.email = u.email
          AND CURRENT_DATE BETWEEN l.start_date AND l.end_date
        )
        THEN FALSE
        ELSE TRUE
      END AS isPresent
    FROM users u
    WHERE u.department = $1
  `;

  const res2 = await pool.query(q2, [department]);
  return res2.rows;
}

export const userModel = {
  getUserPasswordByEmail,
  setToken,
  getToken,
  isSuperUser,
  createUser,
  patchUser,
  initDatabase,
  getUserByEmail,
  getUserById,
  getMe,
  getAllUsers,
  updateUser,
  deleteUser,
  resumeUser,
  applyLeave,
  applyHalfDay,
  applyWfh,
  approveLeave,
  getLeavesFiltered,
  getApprovedLeavesWfh,
  getLeavesByEmail,
  makeNotice,
  getAllNotices,
  myTeamToday,
};
