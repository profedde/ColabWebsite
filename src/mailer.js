const nodemailer = require("nodemailer");

let cachedTransporter = null;

const getMailConfig = () => {
  const host = String(process.env.SMTP_HOST || "").trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const user = String(process.env.SMTP_USER || "").trim();
  const rawPass = String(process.env.SMTP_PASS || "").trim();
  const pass =
    host.includes("gmail.com") && /\s/.test(rawPass) ? rawPass.replace(/\s+/g, "") : rawPass;
  const from = String(process.env.SMTP_FROM || process.env.MAIL_FROM || "").trim();
  const secure = String(process.env.SMTP_SECURE || "").trim() === "true";
  const family = Number(process.env.SMTP_IP_FAMILY || 4);
  const connectionTimeout = Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 6000);
  const greetingTimeout = Number(process.env.SMTP_GREETING_TIMEOUT_MS || 6000);
  const socketTimeout = Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 12000);
  const dnsTimeout = Number(process.env.SMTP_DNS_TIMEOUT_MS || 6000);

  return {
    host,
    port,
    user,
    pass,
    from,
    secure,
    family,
    connectionTimeout,
    greetingTimeout,
    socketTimeout,
    dnsTimeout
  };
};

const isMailConfigured = () => {
  const config = getMailConfig();
  return Boolean(config.host && config.port && config.user && config.pass && config.from);
};

const getTransporter = () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const config = getMailConfig();
  if (!isMailConfigured()) {
    throw new Error("Email service not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.");
  }

  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    family: config.family,
    connectionTimeout: config.connectionTimeout,
    greetingTimeout: config.greetingTimeout,
    socketTimeout: config.socketTimeout,
    dnsTimeout: config.dnsTimeout,
    auth: {
      user: config.user,
      pass: config.pass
    }
  });

  return cachedTransporter;
};

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const sendPasswordResetEmail = async ({ to, username, resetUrl }) => {
  const config = getMailConfig();
  const transporter = getTransporter();
  const appName = String(process.env.APP_NAME || "GuessChess");

  const safeUser = escapeHtml(username || "player");
  const safeUrl = escapeHtml(resetUrl);
  const subject = `${appName} password reset`;
  const text =
    `Hi ${username || "player"},\n\n` +
    `We received a request to reset your password.\n` +
    `Open this link to choose a new one:\n${resetUrl}\n\n` +
    `This link expires in 1 hour.\n` +
    `If you did not request this, you can ignore this email.`;
  const html =
    `<p>Hi <strong>${safeUser}</strong>,</p>` +
    `<p>We received a request to reset your password.</p>` +
    `<p><a href="${safeUrl}">Reset password</a></p>` +
    `<p>This link expires in 1 hour.</p>` +
    `<p>If you did not request this, you can ignore this email.</p>`;

  await transporter.sendMail({
    from: config.from,
    to,
    subject,
    text,
    html
  });
};

module.exports = {
  isMailConfigured,
  sendPasswordResetEmail
};
