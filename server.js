const path = require("path");
const express = require("express");
const session = require("express-session");
const userStore = require("./src/userStore");
const { sendPasswordResetEmail } = require("./src/mailer");
const { testConnection } = require("./src/db");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    name: "colab.sid",
    secret: process.env.SESSION_SECRET || "colab-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production" ? "auto" : false,
      maxAge: 1000 * 60 * 60 * 24 * 14
    }
  })
);

const withTimeout = async (promise, ms) => {
  let timerId = null;
  try {
    return await Promise.race([
      promise,
      new Promise((resolve) => {
        timerId = setTimeout(() => resolve(false), ms);
      })
    ]);
  } finally {
    if (timerId) {
      clearTimeout(timerId);
    }
  }
};

const setFlash = (req, type, message, panel = "login") => {
  req.session.flash = { type, message, panel };
};

const pullFlash = (req) => {
  const flash = req.session.flash || null;
  delete req.session.flash;
  return flash;
};

const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    setFlash(req, "error", "Please log in first.", "login");
    return res.redirect("/");
  }
  return next();
};

const getBaseUrl = (req) => {
  if (process.env.APP_BASE_URL) {
    return String(process.env.APP_BASE_URL).trim().replace(/\/+$/g, "");
  }
  return `${req.protocol}://${req.get("host")}`;
};

const mapForgotPasswordError = (error) => {
  const message = String(error?.message || "");
  if (message.includes("ENETUNREACH")) {
    return "Email network unavailable on server. Set SMTP_IP_FAMILY=4 and retry.";
  }
  if (message.includes("EHOSTUNREACH")) {
    return "Email network unreachable from server (EHOSTUNREACH).";
  }
  if (message.includes("ECONNREFUSED")) {
    return "SMTP connection refused. Check host/port or provider SMTP restrictions.";
  }
  if (message.includes("ECONNRESET")) {
    return "SMTP connection reset by provider. Retry or check SMTP security settings.";
  }
  if (message.includes("EAUTH") || message.includes("Invalid login")) {
    return "SMTP login failed. Check SMTP_USER / SMTP_PASS app password.";
  }
  if (message.includes("ETIMEDOUT") || message.includes("Greeting never received")) {
    return "Email provider timeout. Check SMTP host/port and try again.";
  }
  if (message.includes("Resend API")) {
    return "Email provider API error. Check RESEND_API_KEY / RESEND_FROM.";
  }
  if (message.includes("Resend not configured")) {
    return "Resend not configured. Set RESEND_API_KEY and RESEND_FROM.";
  }
  if (message.includes("users table does not include email")) {
    return "Users table mapping error: email column not detected. Set USER_EMAIL_COLUMN=email.";
  }
  if (message.includes("No login columns available")) {
    return "Users table mapping error: set USER_USERNAME_COLUMN and USER_EMAIL_COLUMN.";
  }
  if (message.includes("Database timeout")) {
    return "Database timeout while preparing password reset. Retry.";
  }
  if (message.includes("Email service not configured")) {
    return message;
  }
  if (process.env.DEBUG_AUTH === "true" && message) {
    return `Debug: ${message.slice(0, 220)}`;
  }
  return "Could not process password reset right now.";
};

app.get("/health", (_req, res) => {
  return res.status(200).json({
    ok: true,
    service: "colab-guesschess-web"
  });
});

app.get("/health/db", async (_req, res) => {
  const dbOk = await withTimeout(testConnection(), 3000);
  return res.status(dbOk ? 200 : 500).json({
    ok: dbOk
  });
});

app.get("/", (req, res) => {
  if (req.session.userId) {
    return res.redirect("/account");
  }
  return res.render("home", { flash: pullFlash(req) });
});

app.post("/register", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");
  const confirmPassword = String(req.body.confirmPassword || "");

  if (!username) {
    setFlash(req, "error", "Username is required.", "register");
    return res.redirect("/");
  }

  if (!email) {
    setFlash(req, "error", "Email is required.", "register");
    return res.redirect("/");
  }

  if (password.length < 8) {
    setFlash(req, "error", "Password must be at least 8 characters.", "register");
    return res.redirect("/");
  }

  if (password !== confirmPassword) {
    setFlash(req, "error", "Passwords do not match.", "register");
    return res.redirect("/");
  }

  try {
    const user = await userStore.registerUser({ email, username, password });
    req.session.userId = user.id;
    setFlash(req, "success", "Welcome to GuessChess.", "login");
    return res.redirect("/account");
  } catch (error) {
    setFlash(req, "error", error.message || "Registration failed.", "register");
    return res.redirect("/");
  }
});

app.post("/login", async (req, res) => {
  const identifier = String(req.body.identifier || req.body.username || "").trim();
  const password = String(req.body.password || "");

  if (!identifier || !password) {
    setFlash(req, "error", "Enter username and password.", "login");
    return res.redirect("/");
  }

  try {
    const user = await userStore.loginUser({ identifier, password });
    req.session.userId = user.id;
    setFlash(req, "success", "Welcome back.", "login");
    return res.redirect("/account");
  } catch (error) {
    setFlash(req, "error", error.message || "Login failed.", "login");
    return res.redirect("/");
  }
});

app.post("/forgot-password", async (req, res) => {
  const identifier = String(req.body.identifier || "").trim();

  if (!identifier) {
    setFlash(req, "error", "Enter username or email.", "forgot");
    return res.redirect("/");
  }

  try {
    const resetRequest = await withTimeout(
      userStore.createPasswordResetRequest({
        identifier,
        baseUrl: getBaseUrl(req)
      }),
      Number(process.env.FORGOT_DB_TIMEOUT_MS || 4500)
    );

    if (resetRequest === false) {
      throw new Error("Database timeout while creating reset request.");
    }

    if (resetRequest) {
      const sent = await withTimeout(
        sendPasswordResetEmail({
          to: resetRequest.email,
          username: resetRequest.username || identifier,
          resetUrl: resetRequest.resetUrl
        }),
        Number(process.env.FORGOT_SMTP_TIMEOUT_MS || 5000)
      );

      if (sent === false) {
        throw new Error("ETIMEDOUT SMTP send timeout.");
      }
    }

    setFlash(
      req,
      "success",
      "If the account exists, we sent an email with a reset link.",
      "login"
    );
    return res.redirect("/");
  } catch (error) {
    if (process.env.DEBUG_AUTH === "true") {
      console.error("Forgot password error:", error);
    }
    setFlash(req, "error", mapForgotPasswordError(error), "forgot");
    return res.redirect("/");
  }
});

app.get("/reset-password", async (req, res) => {
  const token = String(req.query.token || "").trim();
  const flash = pullFlash(req);

  if (!token) {
    return res.render("reset-password", {
      flash: flash || { type: "error", message: "Reset link is invalid." },
      token: "",
      tokenValid: false
    });
  }

  try {
    const details = await userStore.getPasswordResetTokenDetails({ token });
    return res.render("reset-password", {
      flash,
      token,
      tokenValid: Boolean(details)
    });
  } catch (_error) {
    return res.render("reset-password", {
      flash: flash || { type: "error", message: "Reset link is invalid or expired." },
      token,
      tokenValid: false
    });
  }
});

app.post("/reset-password", async (req, res) => {
  const token = String(req.body.token || "").trim();
  const newPassword = String(req.body.newPassword || "");
  const confirmNewPassword = String(req.body.confirmNewPassword || "");

  if (!token) {
    setFlash(req, "error", "Reset link is invalid.", "forgot");
    return res.redirect("/");
  }

  if (newPassword.length < 8) {
    setFlash(req, "error", "Password must be at least 8 characters.", "reset");
    return res.redirect(`/reset-password?token=${encodeURIComponent(token)}`);
  }

  if (newPassword !== confirmNewPassword) {
    setFlash(req, "error", "Passwords do not match.", "reset");
    return res.redirect(`/reset-password?token=${encodeURIComponent(token)}`);
  }

  try {
    await userStore.resetPasswordByToken({
      token,
      newPassword
    });
    setFlash(req, "success", "Password reset complete. You can now log in.", "login");
    return res.redirect("/");
  } catch (error) {
    setFlash(req, "error", error.message || "Could not reset password.", "reset");
    return res.redirect(`/reset-password?token=${encodeURIComponent(token)}`);
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("colab.sid");
    return res.redirect("/");
  });
});

app.get("/account", requireAuth, async (req, res) => {
  try {
    const user = await userStore.getUserById(req.session.userId);
    if (!user) {
      req.session.destroy(() => {
        res.redirect("/");
      });
      return;
    }
    return res.render("account", {
      flash: pullFlash(req),
      user
    });
  } catch (_error) {
    setFlash(req, "error", "Could not load your account.");
    return res.redirect("/");
  }
});

app.post("/account/change-password", requireAuth, async (req, res) => {
  const currentPassword = String(req.body.currentPassword || "");
  const newPassword = String(req.body.newPassword || "");
  const confirmNewPassword = String(req.body.confirmNewPassword || "");

  if (newPassword.length < 8) {
    setFlash(req, "error", "New password must be at least 8 characters.");
    return res.redirect("/account");
  }

  if (newPassword !== confirmNewPassword) {
    setFlash(req, "error", "New passwords do not match.");
    return res.redirect("/account");
  }

  try {
    await userStore.changePassword({
      userId: req.session.userId,
      currentPassword,
      newPassword
    });
    setFlash(req, "success", "Password updated.");
  } catch (error) {
    setFlash(req, "error", error.message || "Could not update password.");
  }

  return res.redirect("/account");
});

app.post("/account/delete-request", requireAuth, async (req, res) => {
  const reason = String(req.body.reason || "").trim();
  try {
    await userStore.requestDeleteAccount({
      userId: req.session.userId,
      reason
    });
    setFlash(req, "success", "Delete request sent successfully.");
  } catch (error) {
    setFlash(req, "error", error.message || "Could not submit delete request.");
  }
  return res.redirect("/account");
});

app.use((_req, res) => {
  res.status(404).send("Not Found");
});

app.use((error, _req, res, _next) => {
  console.error(error);
  if (res.headersSent) {
    return;
  }
  return res.status(500).send("Internal Server Error");
});

app.listen(PORT, () => {
  console.log(`Colab GuessChess website listening on ${PORT}`);
});
