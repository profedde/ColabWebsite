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
    throw new Error(`Unsafe identifier "${value}"`);
  }
  return `"${value}"`;
};

const pickFirst = (candidates, columnsSet) =>
  candidates.find((item) => columnsSet.has(item)) || null;

const isRequiredColumn = (mapping, columnName) => {
  const row = mapping.rows.find((item) => item.column_name === columnName);
  if (!row) {
    return false;
  }
  return row.is_nullable === "NO" && row.column_default == null;
};

const getAllColumns = async () => {
  const result = await pool.query(
    `SELECT table_name, column_name, is_nullable, data_type, column_default
     FROM information_schema.columns
     WHERE table_schema = 'public'
     ORDER BY table_name, ordinal_position`
  );

  const byTable = new Map();
  for (const row of result.rows) {
    if (!byTable.has(row.table_name)) {
      byTable.set(row.table_name, []);
    }
    byTable.get(row.table_name).push(row);
  }

  return byTable;
};

const detectBestMapping = (allTables) => {
  const candidates = [];

  for (const [tableName, rows] of allTables.entries()) {
    const columnsSet = new Set(rows.map((row) => row.column_name));
    const idCol = pickFirst(preferredColumns.id, columnsSet) || rows[0]?.column_name || null;
    const emailCol = pickFirst(preferredColumns.email, columnsSet);
    const usernameCol = pickFirst(preferredColumns.username, columnsSet);
    const passwordCol = pickFirst(preferredColumns.password, columnsSet);
    const createdAtCol = pickFirst(preferredColumns.createdAt, columnsSet);
    const updatedAtCol = pickFirst(preferredColumns.updatedAt, columnsSet);

    if (!passwordCol || (!emailCol && !usernameCol)) {
      continue;
    }

    let score = 0;
    if (tableName === "users") {
      score += 100;
    }
    if (tableName.includes("user")) {
      score += 20;
    }
    if (emailCol) {
      score += 10;
    }
    if (usernameCol) {
      score += 10;
    }
    if (idCol) {
      score += 10;
    }

    candidates.push({
      score,
      tableName,
      idCol,
      emailCol,
      usernameCol,
      passwordCol,
      createdAtCol,
      updatedAtCol,
      rows
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0] || null;
};

const getMapping = async () => {
  if (cachedMapping) {
    return cachedMapping;
  }

  const explicitTable = process.env.USER_TABLE;
  const explicitId = process.env.USER_ID_COLUMN;
  const explicitEmail = process.env.USER_EMAIL_COLUMN;
  const explicitUsername = process.env.USER_USERNAME_COLUMN;
  const explicitPassword = process.env.USER_PASSWORD_COLUMN;
  const explicitCreated = process.env.USER_CREATED_AT_COLUMN;
  const explicitUpdated = process.env.USER_UPDATED_AT_COLUMN;

  if (explicitTable && explicitPassword && (explicitEmail || explicitUsername)) {
    cachedMapping = {
      tableName: explicitTable,
      idCol: explicitId || "id",
      emailCol: explicitEmail || null,
      usernameCol: explicitUsername || null,
      passwordCol: explicitPassword,
      createdAtCol: explicitCreated || null,
      updatedAtCol: explicitUpdated || null,
      rows: []
    };
    return cachedMapping;
  }

  const allTables = await getAllColumns();
  const detected = detectBestMapping(allTables);
  if (detected) {
    cachedMapping = detected;
    return cachedMapping;
  }

  throw new Error(
    "Could not auto-detect your users table. Set USER_TABLE, USER_PASSWORD_COLUMN, and USER_EMAIL_COLUMN or USER_USERNAME_COLUMN in Railway env vars."
  );
};

const toPublicUser = (rawUser, mapping) => ({
  id: rawUser[mapping.idCol],
  email: mapping.emailCol ? rawUser[mapping.emailCol] : null,
  username: mapping.usernameCol ? rawUser[mapping.usernameCol] : null
});

const verifyPassword = async (plain, stored) => {
  if (!stored) {
    return false;
  }
  const storedText = String(stored);
  if (storedText.startsWith("$2a$") || storedText.startsWith("$2b$") || storedText.startsWith("$2y$")) {
    return bcrypt.compare(plain, storedText);
  }
  return plain === storedText;
};

const loadUserById = async (userId, mapping) => {
  const query = `SELECT * FROM ${quoteIdent(mapping.tableName)} WHERE ${quoteIdent(mapping.idCol)} = $1 LIMIT 1`;
  const result = await pool.query(query, [userId]);
  return result.rows[0] || null;
};

const loginUser = async ({ identifier, password }) => {
  const mapping = await getMapping();
  const whereClauses = [];

  if (mapping.emailCol) {
    whereClauses.push(`LOWER(${quoteIdent(mapping.emailCol)}) = LOWER($1)`);
  }
  if (mapping.usernameCol) {
    whereClauses.push(`LOWER(${quoteIdent(mapping.usernameCol)}) = LOWER($1)`);
  }

  if (whereClauses.length === 0) {
    throw new Error("No login columns configured.");
  }

  const sql = `
    SELECT *
    FROM ${quoteIdent(mapping.tableName)}
    WHERE ${whereClauses.join(" OR ")}
    LIMIT 1
  `;
  const result = await pool.query(sql, [identifier]);
  const user = result.rows[0];
  if (!user) {
    throw new Error("Invalid credentials.");
  }

  const ok = await verifyPassword(password, user[mapping.passwordCol]);
  if (!ok) {
    throw new Error("Invalid credentials.");
  }

  return toPublicUser(user, mapping);
};

const registerUser = async ({ email, username, password }) => {
  const mapping = await getMapping();

  if (!mapping.emailCol && !mapping.usernameCol) {
    throw new Error("Registration unavailable. No email/username column found.");
  }

  const normalizedEmail = email ? email.toLowerCase() : "";
  const normalizedUsername = username || "";
  const emailRequired = mapping.emailCol ? isRequiredColumn(mapping, mapping.emailCol) : false;
  const usernameRequired = mapping.usernameCol
    ? isRequiredColumn(mapping, mapping.usernameCol)
    : false;

  if (!normalizedEmail && !normalizedUsername) {
    throw new Error("Email or username is required.");
  }
  if (mapping.emailCol && emailRequired && !normalizedEmail) {
    throw new Error("Email is required by your database schema.");
  }
  if (mapping.usernameCol && usernameRequired && !normalizedUsername) {
    throw new Error("Username is required by your database schema.");
  }

  const duplicateChecks = [];
  const duplicateValues = [];

  if (mapping.emailCol && normalizedEmail) {
    duplicateChecks.push(`LOWER(${quoteIdent(mapping.emailCol)}) = LOWER($${duplicateValues.length + 1})`);
    duplicateValues.push(normalizedEmail);
  }
  if (mapping.usernameCol && normalizedUsername) {
    duplicateChecks.push(`LOWER(${quoteIdent(mapping.usernameCol)}) = LOWER($${duplicateValues.length + 1})`);
    duplicateValues.push(normalizedUsername);
  }

  if (duplicateChecks.length > 0) {
    const duplicateSql = `
      SELECT 1
      FROM ${quoteIdent(mapping.tableName)}
      WHERE ${duplicateChecks.join(" OR ")}
      LIMIT 1
    `;
    const duplicateResult = await pool.query(duplicateSql, duplicateValues);
    if (duplicateResult.rowCount > 0) {
      throw new Error("An account with that email/username already exists.");
    }
  }

  const hash = await bcrypt.hash(password, 12);
  const insertCols = [];
  const insertValues = [];

  if (mapping.emailCol && normalizedEmail) {
    insertCols.push(mapping.emailCol);
    insertValues.push(normalizedEmail);
  }
  if (mapping.usernameCol && normalizedUsername) {
    insertCols.push(mapping.usernameCol);
    insertValues.push(normalizedUsername);
  }
  insertCols.push(mapping.passwordCol);
  insertValues.push(hash);

  if (mapping.createdAtCol) {
    insertCols.push(mapping.createdAtCol);
    insertValues.push(new Date());
  }
  if (mapping.updatedAtCol) {
    insertCols.push(mapping.updatedAtCol);
    insertValues.push(new Date());
  }

  const sql = `
    INSERT INTO ${quoteIdent(mapping.tableName)} (${insertCols.map(quoteIdent).join(", ")})
    VALUES (${insertValues.map((_, index) => `$${index + 1}`).join(", ")})
    RETURNING *
  `;

  try {
    const result = await pool.query(sql, insertValues);
    return toPublicUser(result.rows[0], mapping);
  } catch (error) {
    if (error.code === "23502" && error.column) {
      throw new Error(
        `Registration failed because column "${error.column}" is required in your database schema.`
      );
    }
    if (error.code === "23505") {
      throw new Error("An account with that email/username already exists.");
    }
    throw error;
  }
};

const getUserById = async (userId) => {
  const mapping = await getMapping();
  const user = await loadUserById(userId, mapping);
  if (!user) {
    return null;
  }
  return toPublicUser(user, mapping);
};

const changePassword = async ({ userId, currentPassword, newPassword }) => {
  const mapping = await getMapping();
  const existingUser = await loadUserById(userId, mapping);
  if (!existingUser) {
    throw new Error("User not found.");
  }

  const valid = await verifyPassword(currentPassword, existingUser[mapping.passwordCol]);
  if (!valid) {
    throw new Error("Current password is incorrect.");
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  const values = [hashed, userId];
  let sql = `UPDATE ${quoteIdent(mapping.tableName)} SET ${quoteIdent(mapping.passwordCol)} = $1`;
  if (mapping.updatedAtCol) {
    sql += `, ${quoteIdent(mapping.updatedAtCol)} = NOW()`;
  }
  sql += ` WHERE ${quoteIdent(mapping.idCol)} = $2`;

  await pool.query(sql, values);
};

const requestDeleteAccount = async ({ userId, reason }) => {
  const mapping = await getMapping();
  const user = await loadUserById(userId, mapping);
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
    `
    INSERT INTO account_deletion_requests (user_id, user_email, user_username, reason)
    VALUES ($1, $2, $3, $4)
    `,
    [
      String(user[mapping.idCol]),
      mapping.emailCol ? user[mapping.emailCol] : null,
      mapping.usernameCol ? user[mapping.usernameCol] : null,
      reason || null
    ]
  );
};

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  changePassword,
  requestDeleteAccount
};
