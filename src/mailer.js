const nodemailer = require("nodemailer");
const net = require("net");
const dns = require("dns").promises;

let cachedTransporter = null;
let cachedTransporterKey = "";

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

const isMailConfiguredForConfig = (config) =>
  Boolean(config?.host && config?.port && config?.user && config?.pass && config?.from);

const getResendConfig = () => {
  const apiKey = String(process.env.RESEND_API_KEY || "").trim();
  const from = String(process.env.RESEND_FROM || process.env.SMTP_FROM || "").trim();
  const timeoutMs = Number(process.env.RESEND_TIMEOUT_MS || 8000);
  return {
    apiKey,
    from,
    timeoutMs
  };
};

const isResendConfigured = () => {
  const config = getResendConfig();
  return Boolean(config.apiKey && config.from);
};

const sendWithResend = async ({ to, subject, html, text }) => {
  const resend = getResendConfig();
  if (!resend.apiKey || !resend.from) {
    throw new Error("Resend not configured. Set RESEND_API_KEY and RESEND_FROM.");
  }

  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), resend.timeoutMs);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resend.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: resend.from,
        to: [to],
        subject,
        html,
        text
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      let detail = "";
      try {
        detail = await response.text();
      } catch (_error) {
        detail = "";
      }
      throw new Error(`Resend API error (${response.status}): ${detail || response.statusText}`);
    }
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Resend API timeout");
    }
    throw error;
  } finally {
    clearTimeout(timerId);
  }
};

const withTimeout = async (promise, ms, timeoutMessage) => {
  let timerId = null;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timerId = setTimeout(() => reject(new Error(timeoutMessage)), ms);
      })
    ]);
  } finally {
    if (timerId) {
      clearTimeout(timerId);
    }
  }
};

const resolveSmtpTarget = async (config) => {
  const host = config.host;
  const family = config.family;

  if (!family || ![4, 6].includes(family) || net.isIP(host)) {
    return {
      connectHost: host,
      tlsServername: null
    };
  }

  try {
    const lookup = await withTimeout(
      dns.lookup(host, { family, all: false }),
      config.dnsTimeout,
      `SMTP DNS lookup timeout for ${host}`
    );
    const connectHost = lookup.address || host;
    return {
      connectHost,
      tlsServername: connectHost !== host ? host : null
    };
  } catch (error) {
    if (process.env.DEBUG_AUTH === "true") {
      console.error("SMTP DNS fallback to host:", error.message);
    }
    return {
      connectHost: host,
      tlsServername: null
    };
  }
};

const buildTransporterForConfig = async (config) => {
  const target = await resolveSmtpTarget(config);
  const transportOptions = {
    host: target.connectHost,
    port: config.port,
    secure: config.secure,
    connectionTimeout: config.connectionTimeout,
    greetingTimeout: config.greetingTimeout,
    socketTimeout: config.socketTimeout,
    dnsTimeout: config.dnsTimeout,
    auth: {
      user: config.user,
      pass: config.pass
    }
  };

  if (target.tlsServername) {
    transportOptions.tls = { servername: target.tlsServername };
  }

  return {
    key: [
      target.connectHost,
      target.tlsServername || "",
      config.port,
      config.user,
      config.secure,
      config.family
    ].join("|"),
    transporter: nodemailer.createTransport(transportOptions)
  };
};

const getTransporter = async (forceRefresh = false) => {
  const config = getMailConfig();

  if (!isMailConfigured()) {
    throw new Error("Email service not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.");
  }

  const built = await buildTransporterForConfig(config);
  if (!forceRefresh && cachedTransporter && cachedTransporterKey === built.key) {
    return cachedTransporter;
  }

  cachedTransporter = built.transporter;
  cachedTransporterKey = built.key;
  return cachedTransporter;
};

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const isRetryableNetworkError = (message) =>
  message.includes("ENETUNREACH") ||
  message.includes("EHOSTUNREACH") ||
  message.includes("ECONNREFUSED") ||
  message.includes("ECONNRESET") ||
  message.includes("ETIMEDOUT") ||
  message.includes("Connection timeout");

const sendPasswordResetEmail = async ({ to, username, resetUrl }) => {
  const config = getMailConfig();
  const appName = String(process.env.APP_NAME || "GuessChess");
  const provider = String(process.env.EMAIL_PROVIDER || "smtp").trim().toLowerCase();

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

  const sendPayload = {
    from: config.from,
    to,
    subject,
    text,
    html
  };

  if (provider === "resend" || (provider === "auto" && isResendConfigured())) {
    await sendWithResend(sendPayload);
    return;
  }

  try {
    const transporter = await getTransporter(false);
    await transporter.sendMail(sendPayload);
  } catch (error) {
    const message = String(error?.message || "");
    if (!isRetryableNetworkError(message)) {
      throw error;
    }

    if (process.env.DEBUG_AUTH === "true") {
      console.error("SMTP first attempt failed, retrying once:", message);
    }

    try {
      const retryTransporter = await getTransporter(true);
      await retryTransporter.sendMail(sendPayload);
      return;
    } catch (retryError) {
      const retryMessage = String(retryError?.message || "");

      if (!isRetryableNetworkError(retryMessage)) {
        throw retryError;
      }

      const canTryGmailSslFallback = config.host.includes("gmail.com") && Number(config.port) !== 465;
      if (!canTryGmailSslFallback) {
        if (provider === "auto" && isResendConfigured()) {
          await sendWithResend(sendPayload);
          return;
        }
        throw retryError;
      }

      const gmailSslConfig = {
        ...config,
        port: 465,
        secure: true
      };

      if (!isMailConfiguredForConfig(gmailSslConfig)) {
        throw retryError;
      }

      if (process.env.DEBUG_AUTH === "true") {
        console.error("SMTP retry failed, trying Gmail SSL fallback on port 465.");
      }

      const fallback = await buildTransporterForConfig(gmailSslConfig);
      try {
        await fallback.transporter.sendMail(sendPayload);
      } catch (fallbackError) {
        if (provider === "auto" && isResendConfigured()) {
          await sendWithResend(sendPayload);
          return;
        }
        throw fallbackError;
      }
    }
  }
};

module.exports = {
  isMailConfigured,
  sendPasswordResetEmail
};
