const getBrevoConfig = () => {
  const apiKey = String(process.env.BREVO_API_KEY || "").trim();
  const fromName = String(process.env.BREVO_FROM_NAME || "ColabGames").trim();
  const fromEmail = String(process.env.BREVO_FROM_EMAIL || "").trim();
  const timeoutMs = Number(process.env.BREVO_TIMEOUT_MS || 8000);

  return {
    apiKey,
    fromName,
    fromEmail,
    timeoutMs
  };
};

const isMailConfigured = () => {
  const config = getBrevoConfig();
  return Boolean(config.apiKey && config.fromEmail);
};

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const sendWithBrevo = async ({ to, subject, html, text }) => {
  const config = getBrevoConfig();
  if (!isMailConfigured()) {
    throw new Error("Brevo not configured. Set BREVO_API_KEY and BREVO_FROM_EMAIL.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": config.apiKey
      },
      body: JSON.stringify({
        sender: {
          name: config.fromName || "ColabGames",
          email: config.fromEmail
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text
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
      throw new Error(`Brevo API error (${response.status}): ${detail || response.statusText}`);
    }
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Brevo API timeout");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

const sendPasswordResetEmail = async ({ to, username, resetUrl }) => {
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

  await sendWithBrevo({
    to,
    subject,
    html,
    text
  });
};

module.exports = {
  isMailConfigured,
  sendPasswordResetEmail
};
