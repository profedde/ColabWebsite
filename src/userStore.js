const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { pool } = require("./db");

const preferredColumns = {
  id: ["id", "user_id", "uuid"],
  email: ["email", "mail"],
  username: ["username", "user_name", "name", "login", "nickname"],
  password: ["pass_hash", "password", "password_hash", "hashed_password", "passwd", "pass"],
  salt: ["salt", "password_salt", "pass_salt"],
  createdAt: ["created_at", "createdat"],
  updatedAt: ["updated_at", "updatedat"]
};

const saltedHashModes = [
  "sha256_salt_password",
  "sha256_password_salt",
  "sha256_salt_colon_password",
  "sha256_password_colon_salt",
  "sha256_salt_password_salt",
  "sha256_password_salt_password",
  "sha256_salt_dot_password",
  "sha256_password_dot_salt",
  "sha256_salt_pipe_password",
  "sha256_password_pipe_salt",
  "sha256_hmac_salt_key",
  "sha256_hmac_password_key",
  "sha256_double_salt_password",
  "sha256_double_password_salt"
];

let cachedMapping = null;

const isSafeIdentifier = (value) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(value);

const quoteIdent = (value) => {
  if (!isSafeIdentifier(value)) {
    throw new Error(`Unsafe identifier: ${value}`);
  }
  return `"${value}"`;
};

const pickFirst = (candidates, set) => candidates.find((candidate) => set.has(candidate)) || null;

const sha256 = (value) => crypto.createHash("sha256").update(String(value)).digest("hex");
const sha256Hmac = (key, value) =>
  crypto.createHmac("sha256", String(key)).update(String(value)).digest("hex");

const hashByMode = ({ mode, password, salt }) => {
  switch (mode) {
    case "sha256_salt_password":
      return sha256(`${salt}${password}`);
    case "sha256_password_salt":
      return sha256(`${password}${salt}`);
    case "sha256_salt_colon_password":
      return sha256(`${salt}:${password}`);
    case "sha256_password_colon_salt":
      return sha256(`${password}:${salt}`);
    case "sha256_salt_password_salt":
      return sha256(`${salt}${password}${salt}`);
    case "sha256_password_salt_password":
      return sha256(`${password}${salt}${password}`);
    case "sha256_salt_dot_password":
      return sha256(`${salt}.${password}`);
    case "sha256_password_dot_salt":
      return sha256(`${password}.${salt}`);
    case "sha256_salt_pipe_password":
      return sha256(`${salt}|${password}`);
    case "sha256_password_pipe_salt":
      return sha256(`${password}|${salt}`);
    case "sha256_hmac_salt_key":
      return sha256Hmac(salt, password);
    case "sha256_hmac_password_key":
      return sha256Hmac(password, salt);
    case "sha256_double_salt_password":
      return sha256(sha256(`${salt}${password}`));
    case "sha256_double_password_salt":
      return sha256(sha256(`${password}${salt}`));
    case "sha256_password":
      return sha256(password);
    default:
      return null;
  }
};

const normalizeHex = (value) => String(value || "").trim().toLowerCase();

const getColumnsByTable = async () => {
  const result = await pool.query(
    `SELECT table_name, column_name, is_nullable, column_default, data_type
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
      saltCol: pickFirst(preferredColumns.salt, colSet),
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
    if (mapping.passwordCol === "pass_hash") score += 30;
    if (mapping.saltCol === "salt") score += 20;

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
      saltCol: process.env.USER_SALT_COLUMN || null,
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
      "Users table not detected. Set USER_TABLE, USER_PASSWORD_COLUMN and USER_USERNAME_COLUMN."
    );
  }

  cachedMapping = detected;
  return cachedMapping;
};

const getColumnInfo = (mapping, columnName) =>
  (mapping.rows || []).find((row) => row.column_name === columnName) || null;

const isRequiredWithoutDefault = (columnInfo) => {
  if (!columnInfo) return false;
  return columnInfo.is_nullable === "NO" && columnInfo.column_default == null;
};

const toPublicUser = (row, mapping) => ({
  id: row[mapping.idCol],
  email: mapping.emailCol ? row[mapping.emailCol] : null,
  username: mapping.usernameCol ? row[mapping.usernameCol] : null
});

const verifyPassword = async ({ plain, storedValue, saltValue }) => {
  if (storedValue == null) {
    return { valid: false, mode: null };
  }

  const stored = String(storedValue);
  if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
    const ok = await bcrypt.compare(plain, stored);
    return { valid: ok, mode: ok ? "bcrypt" : null };
  }

  const normalizedStored = normalizeHex(stored);
  const looksLikeSha256 = /^[a-f0-9]{64}$/i.test(stored);

  if (saltValue != null && saltValue !== "") {
    const salt = String(saltValue);
    for (const mode of saltedHashModes) {
      const candidate = hashByMode({ mode, password: plain, salt });
      if (candidate && normalizeHex(candidate) === normalizedStored) {
        return { valid: true, mode };
      }
    }
  }

  if (looksLikeSha256) {
    const direct = hashByMode({ mode: "sha256_password", password: plain, salt: "" });
    if (normalizeHex(direct) === normalizedStored) {
      return { valid: true, mode: "sha256_password" };
    }
  }

  if (plain === stored) {
    return { valid: true, mode: "plain" };
  }

  return { valid: false, mode: null };
};

const loadUserByIdRaw = async (userId, mapping) => {
  const sql = `SELECT * FROM ${quoteIdent(mapping.tableName)} WHERE ${quoteIdent(mapping.idCol)} = $1 LIMIT 1`;
  const result = await pool.query(sql, [userId]);
  return result.rows[0] || null;
};

const getPreferredHashMode = (hasSaltColumn) => {
  const configured = process.env.USER_HASH_MODE;
  if (configured) {
    return configured;
  }
  return hasSaltColumn ? "sha256_salt_password" : "sha256_password";
};

const generateSalt = () => crypto.randomBytes(16).toString("hex");

const generateIdValue = ({ idInfo, username }) => {
  const dataType = String(idInfo?.data_type || "").toLowerCase();
  if (dataType === "uuid") {
    return crypto.randomUUID();
  }
  if (dataType.includes("char") || dataType.includes("text")) {
    if (username) {
      return username;
    }
    return `u_${crypto.randomBytes(8).toString("hex")}`;
  }
  if (dataType.includes("int") || dataType.includes("numeric") || dataType.includes("decimal")) {
    return Math.floor(Date.now() / 1000);
  }
  return `u_${crypto.randomBytes(8).toString("hex")}`;
};

const getRequiredColumnFallback = (columnName) => {
  const key = String(columnName || "").toLowerCase();
  if (key === "elo" || key === "rating") return 1200;
  if (
    key === "wins" ||
    key === "losses" ||
    key === "draws" ||
    key === "games" ||
    key === "games_played" ||
    key === "matches_played" ||
    key === "total_games" ||
    key === "points" ||
    key === "coins" ||
    key === "xp"
  ) {
    return 0;
  }
  return undefined;
};

const addInsertValue = ({ insertColumns, insertValues, column, value }) => {
  if (!column || insertColumns.includes(column)) return;
  insertColumns.push(column);
  insertValues.push(value);
};

const buildPasswordPayload = async ({ mapping, password, existingMode }) => {
  const shouldUseShaBased =
    Boolean(mapping.saltCol) ||
    /hash/i.test(String(mapping.passwordCol || "")) ||
    Boolean(process.env.USER_HASH_MODE);

  if (shouldUseShaBased) {
    const mode = existingMode || getPreferredHashMode(Boolean(mapping.saltCol));
    const salt = mapping.saltCol ? generateSalt() : "";
    const hashed = hashByMode({ mode, password, salt });
    if (!hashed) {
      throw new Error(`Unsupported hash mode: ${mode}`);
    }
    return {
      mode,
      passwordValue: hashed,
      saltValue: mapping.saltCol ? salt : null
    };
  }

  return {
    mode: "bcrypt",
    passwordValue: await bcrypt.hash(password, 12),
    saltValue: null
  };
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
  if (mapping.idCol) {
    whereParts.push(`LOWER(CAST(${quoteIdent(mapping.idCol)} AS TEXT)) = LOWER($1)`);
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

  const passwordCheck = await verifyPassword({
    plain: password,
    storedValue: user[mapping.passwordCol],
    saltValue: mapping.saltCol ? user[mapping.saltCol] : null
  });

  if (!passwordCheck.valid) {
    throw new Error("Invalid credentials.");
  }

  return toPublicUser(user, mapping);
};

const registerUser = async ({ email, username, password }) => {
  const mapping = await getMapping();
  const normalizedEmail = email ? email.toLowerCase() : "";
  const normalizedUsername = username ? username.trim() : "";

  if (!normalizedEmail && !normalizedUsername) {
    throw new Error("Username is required.");
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

  const insertColumns = [];
  const insertValues = [];

  if (mapping.emailCol && normalizedEmail) {
    addInsertValue({
      insertColumns,
      insertValues,
      column: mapping.emailCol,
      value: normalizedEmail
    });
  }
  if (mapping.usernameCol && normalizedUsername) {
    addInsertValue({
      insertColumns,
      insertValues,
      column: mapping.usernameCol,
      value: normalizedUsername
    });
  }

  const passwordPayload = await buildPasswordPayload({
    mapping,
    password
  });

  addInsertValue({
    insertColumns,
    insertValues,
    column: mapping.passwordCol,
    value: passwordPayload.passwordValue
  });

  if (mapping.saltCol && passwordPayload.saltValue) {
    addInsertValue({
      insertColumns,
      insertValues,
      column: mapping.saltCol,
      value: passwordPayload.saltValue
    });
  }

  if (mapping.createdAtCol) {
    addInsertValue({
      insertColumns,
      insertValues,
      column: mapping.createdAtCol,
      value: new Date()
    });
  }
  if (mapping.updatedAtCol) {
    addInsertValue({
      insertColumns,
      insertValues,
      column: mapping.updatedAtCol,
      value: new Date()
    });
  }

  const idInfo = getColumnInfo(mapping, mapping.idCol);
  if (mapping.idCol && isRequiredWithoutDefault(idInfo) && !insertColumns.includes(mapping.idCol)) {
    addInsertValue({
      insertColumns,
      insertValues,
      column: mapping.idCol,
      value: generateIdValue({ idInfo, username: normalizedUsername || null })
    });
  }

  for (const columnInfo of mapping.rows || []) {
    if (!isRequiredWithoutDefault(columnInfo)) continue;
    const columnName = columnInfo.column_name;
    if (insertColumns.includes(columnName)) continue;
    if (columnName === mapping.idCol) continue;
    const fallback = getRequiredColumnFallback(columnName);
    if (fallback !== undefined) {
      addInsertValue({
        insertColumns,
        insertValues,
        column: columnName,
        value: fallback
      });
    }
  }

  const missingRequiredColumns = (mapping.rows || [])
    .filter((row) => isRequiredWithoutDefault(row))
    .map((row) => row.column_name)
    .filter((col) => !insertColumns.includes(col));

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

  const passwordCheck = await verifyPassword({
    plain: currentPassword,
    storedValue: user[mapping.passwordCol],
    saltValue: mapping.saltCol ? user[mapping.saltCol] : null
  });

  if (!passwordCheck.valid) {
    throw new Error("Current password is incorrect.");
  }

  const passwordPayload = await buildPasswordPayload({
    mapping,
    password: newPassword,
    existingMode: passwordCheck.mode && passwordCheck.mode.startsWith("sha256_")
      ? passwordCheck.mode
      : null
  });

  const values = [];
  let sql = `UPDATE ${quoteIdent(mapping.tableName)} SET `;

  values.push(passwordPayload.passwordValue);
  sql += `${quoteIdent(mapping.passwordCol)} = $${values.length}`;

  if (mapping.saltCol) {
    values.push(passwordPayload.saltValue || generateSalt());
    sql += `, ${quoteIdent(mapping.saltCol)} = $${values.length}`;
  }

  if (mapping.updatedAtCol) {
    sql += `, ${quoteIdent(mapping.updatedAtCol)} = NOW()`;
  }

  values.push(userId);
  sql += ` WHERE ${quoteIdent(mapping.idCol)} = $${values.length}`;

  await pool.query(sql, values);
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
