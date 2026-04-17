const bcrypt = require("bcryptjs");
const { pool } = require("./db");

const preferredColumns = {
  id: ["id", "user_id", "uuid"],
  email: ["email", "mail"],
  username: ["username", "user_name", "name", "login", "nickname"],
  password: ["password", "password_hash", "hashed_password", "passwd", "pass"],
  createdAt: ["created_at", "createdat"],
  updatedAt: ["updated_at", "updatedat"]
};

let cachedMapping = null;

const isSafeIdentifier = (value) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(value);

const quoteIdent = (value) => {
  if (!isSafeIdentifier(value)) {
    throw new Error(`Unsafe identifier: ${value}`);
  }
  return `"${value}"`;
};

const pickFirst = (candidates, set) => candidates.find((candidate) => set.has(candidate)) || null;

const getColumnsByTable = async () => {
  const result = await pool.query(
    `SELECT table_name, column_name, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_schema = 'public'
     ORDER BY table_name, ordinal_position`
  );

  const grouped = new Map();
  for (const row of result.rows) {
    if (!grouped.has(row.table_name)) {
      grouped.set(row.table_name, []);
    }
    grouped.get(row.table_name).push(row);
  }
  return grouped;
};

const detectMapping = (tables) => {
  const options = [];

  for (const [tableName, rows] of tables.entries()) {
    const colSet = new Set(rows.map((r) => r.column_name));
    const mapping = {
      tableName,
      idCol: pickFirst(preferredColumns.id, colSet) || rows[0]?.column_name || null,
      emailCol: pickFirst(preferredColumns.email, colSet),
      usernameCol: pickFirst(preferredColumns.username, colSet),
      passwordCol: pickFirst(preferredColumns.password, colSet),
      createdAtCol: pickFirst(preferredColumns.createdAt, colSet),
      updatedAtCol: pickFirst(preferredColumns.updatedAt, colSet),
      rows
    };

    if (!mapping.passwordCol || (!mapping.emailCol && !mapping.usernameCol)) {
      continue;
    }

    let score = 0;
    if (tableName === "users") score += 100;
    if (tableName.includes("user")) score += 20;
    if (mapping.idCol) score += 10;
    if (mapping.emailCol) score += 10;
    if (mapping.usernameCol) score += 10;

    options.push({ score, mapping });
  }

  options.sort((a, b) => b.score - a.score);
  return options[0]?.mapping || null;
};

const getMapping = async () => {
  if (cachedMapping) {
    return cachedMapping;
  }

  const explicitTable = process.env.USER_TABLE;
  const explicitPassword = process.env.USER_PASSWORD_COLUMN;
  const explicitEmail = process.env.USER_EMAIL_COLUMN;
  const explicitUsername = process.env.USER_USERNAME_COLUMN;

  if (explicitTable && explicitPassword && (explicitEmail || explicitUsername)) {
    cachedMapping = {
      tableName: explicitTable,
      idCol: process.env.USER_ID_COLUMN || "id",
      emailCol: explicitEmail || null,
      usernameCol: explicitUsername || null,
      passwordCol: explicitPassword,
      createdAtCol: process.env.USER_CREATED_AT_COLUMN || null,
      updatedAtCol: process.env.USER_UPDATED_AT_COLUMN || null,
      rows: []
    };
    return cachedMapping;
  }

  const grouped = await getColumnsByTable();
  const detected = detectMapping(grouped);

  if (!detected) {
    throw new Error(
      "Users table not detected. Set USER_TABLE, USER_PASSWORD_COLUMN and USER_EMAIL_COLUMN or USER_USERNAME_COLUMN."
    );
  }

  cachedMapping = detected;
  return cachedMapping;
};

const isRequiredWithoutDefault = (mapping, columnName) => {
  const columnInfo = mapping.rows.find((r) => r.column_name === columnName);
  if (!columnInfo) return false;
  return columnInfo.is_nullable === "NO" && columnInfo.column_default == null;
};

const toPublicUser = (row, mapping) => ({
  id: row[mapping.idCol],
  email: mapping.emailCol ? row[mapping.emailCol] : null,
  username: mapping.usernameCol ? row[mapping.usernameCol] : null
});

const verifyPassword = async (plain, storedValue) => {
  if (storedValue == null) return false;
  const stored = String(storedValue);
  if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
    return bcrypt.compare(plain, stored);
  }
  return plain === stored;
};

const loadUserByIdRaw = async (userId, mapping) => {
  const sql = `SELECT * FROM ${quoteIdent(mapping.tableName)} WHERE ${quoteIdent(mapping.idCol)} = $1 LIMIT 1`;
  const result = await pool.query(sql, [userId]);
  return result.rows[0] || null;
};

const loginUser = async ({ identifier, password }) => {
  const mapping = await getMapping();
  const whereParts = [];

  if (mapping.emailCol) {
    whereParts.push(`LOWER(${quoteIdent(mapping.emailCol)}) = LOWER($1)`);
  }
  if (mapping.usernameCol) {
    whereParts.push(`LOWER(${quoteIdent(mapping.usernameCol)}) = LOWER($1)`);
  }

  if (whereParts.length === 0) {
    throw new Error("No login columns available.");
  }

  const sql = `SELECT * FROM ${quoteIdent(mapping.tableName)} WHERE ${whereParts.join(" OR ")} LIMIT 1`;
  const result = await pool.query(sql, [identifier]);
  const user = result.rows[0];

  if (!user) {
    throw new Error("Invalid credentials.");
  }

  const validPassword = await verifyPassword(password, user[mapping.passwordCol]);
  if (!validPassword) {
    throw new Error("Invalid credentials.");
  }

  return toPublicUser(user, mapping);
};

const registerUser = async ({ email, username, password }) => {
  const mapping = await getMapping();
  const normalizedEmail = email ? email.toLowerCase() : "";
  const normalizedUsername = username || "";

  if (!normalizedEmail && !normalizedUsername) {
    throw new Error("Email or username is required.");
  }

  if (mapping.emailCol && isRequiredWithoutDefault(mapping, mapping.emailCol) && !normalizedEmail) {
    throw new Error("Email is required by database schema.");
  }
  if (
    mapping.usernameCol &&
    isRequiredWithoutDefault(mapping, mapping.usernameCol) &&
    !normalizedUsername
  ) {
    throw new Error("Username is required by database schema.");
  }

  const duplicateParts = [];
  const duplicateValues = [];
  if (mapping.emailCol && normalizedEmail) {
    duplicateParts.push(`LOWER(${quoteIdent(mapping.emailCol)}) = LOWER($${duplicateValues.length + 1})`);
    duplicateValues.push(normalizedEmail);
  }
  if (mapping.usernameCol && normalizedUsername) {
    duplicateParts.push(
      `LOWER(${quoteIdent(mapping.usernameCol)}) = LOWER($${duplicateValues.length + 1})`
    );
    duplicateValues.push(normalizedUsername);
  }

  if (duplicateParts.length > 0) {
    const dupSql = `SELECT 1 FROM ${quoteIdent(mapping.tableName)} WHERE ${duplicateParts.join(" OR ")} LIMIT 1`;
    const dupResult = await pool.query(dupSql, duplicateValues);
    if (dupResult.rowCount > 0) {
      throw new Error("Account already exists.");
    }
  }

  const hashed = await bcrypt.hash(password, 12);
  const insertColumns = [];
  const insertValues = [];

  if (mapping.emailCol && normalizedEmail) {
    insertColumns.push(mapping.emailCol);
    insertValues.push(normalizedEmail);
  }
  if (mapping.usernameCol && normalizedUsername) {
    insertColumns.push(mapping.usernameCol);
    insertValues.push(normalizedUsername);
  }
  insertColumns.push(mapping.passwordCol);
  insertValues.push(hashed);

  if (mapping.createdAtCol) {
    insertColumns.push(mapping.createdAtCol);
    insertValues.push(new Date());
  }
  if (mapping.updatedAtCol) {
    insertColumns.push(mapping.updatedAtCol);
    insertValues.push(new Date());
  }

  const missingRequiredColumns = (mapping.rows || [])
    .filter((row) => row.is_nullable === "NO" && row.column_default == null)
    .map((row) => row.column_name)
    .filter((col) => !insertColumns.includes(col) && col !== mapping.idCol);

  if (missingRequiredColumns.length > 0) {
    throw new Error(
      `Registration blocked by required columns in users table: ${missingRequiredColumns.join(", ")}`
    );
  }

  const sql = `
    INSERT INTO ${quoteIdent(mapping.tableName)} (${insertColumns.map(quoteIdent).join(", ")})
    VALUES (${insertValues.map((_, idx) => `$${idx + 1}`).join(", ")})
    RETURNING *
  `;

  try {
    const result = await pool.query(sql, insertValues);
    return toPublicUser(result.rows[0], mapping);
  } catch (error) {
    if (error.code === "23505") {
      throw new Error("Account already exists.");
    }
    throw new Error("Registration failed.");
  }
};

const getUserById = async (userId) => {
  const mapping = await getMapping();
  const user = await loadUserByIdRaw(userId, mapping);
  if (!user) return null;
  return toPublicUser(user, mapping);
};

const changePassword = async ({ userId, currentPassword, newPassword }) => {
  const mapping = await getMapping();
  const user = await loadUserByIdRaw(userId, mapping);
  if (!user) {
    throw new Error("User not found.");
  }

  const validPassword = await verifyPassword(currentPassword, user[mapping.passwordCol]);
  if (!validPassword) {
    throw new Error("Current password is incorrect.");
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  let sql = `UPDATE ${quoteIdent(mapping.tableName)} SET ${quoteIdent(mapping.passwordCol)} = $1`;
  if (mapping.updatedAtCol) {
    sql += `, ${quoteIdent(mapping.updatedAtCol)} = NOW()`;
  }
  sql += ` WHERE ${quoteIdent(mapping.idCol)} = $2`;
  await pool.query(sql, [hashed, userId]);
};

const requestDeleteAccount = async ({ userId, reason }) => {
  const mapping = await getMapping();
  const user = await loadUserByIdRaw(userId, mapping);
  if (!user) {
    throw new Error("User not found.");
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS account_deletion_requests (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_email TEXT,
      user_username TEXT,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(
    `INSERT INTO account_deletion_requests (user_id, user_email, user_username, reason)
     VALUES ($1, $2, $3, $4)`,
    [
      String(user[mapping.idCol]),
      mapping.emailCol ? user[mapping.emailCol] : null,
      mapping.usernameCol ? user[mapping.usernameCol] : null,
      reason || null
    ]
  );
};

module.exports = {
  loginUser,
  registerUser,
  getUserById,
  changePassword,
  requestDeleteAccount
};
