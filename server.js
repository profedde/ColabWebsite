const path = require("path");
const express = require("express");
const session = require("express-session");
const { testConnection } = require("./src/db");
const userStore = require("./src/userStore");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "guesschess-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 14
    }
  })
);

const setFlash = (req, type, message) => {
  req.session.flash = { type, message };
};

const readFlash = (req) => {
  const flash = req.session.flash;
  delete req.session.flash;
  return flash;
};

const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    setFlash(req, "error", "Please log in first.");
    return res.redirect("/");
  }
  return next();
};

const withTimeout = async (promise, ms) => {
  let timerId;
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

app.get("/health", (_req, res) => {
  return res.status(200).json({
    ok: true,
    service: "colab-guesschess-web"
  });
});

app.get("/health/db", async (_req, res) => {
  const dbOk = await withTimeout(testConnection(), 3000);
  return res.status(dbOk ? 200 : 500).json({
    ok: dbOk,
    database: dbOk ? "reachable" : "unreachable_or_timeout"
  });
});

app.get("/", (req, res) => {
  if (req.session.userId) {
    return res.redirect("/account");
  }

  return res.render("home", {
    flash: readFlash(req)
  });
});

app.post("/register", async (req, res) => {
  const email = String(req.body.email || "").trim();
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");
  const confirmPassword = String(req.body.confirmPassword || "");

  if (!email && !username) {
    setFlash(req, "error", "Email or username is required.");
    return res.redirect("/");
  }

  if (password.length < 8) {
    setFlash(req, "error", "Password must be at least 8 characters.");
    return res.redirect("/");
  }

  if (password !== confirmPassword) {
    setFlash(req, "error", "Passwords do not match.");
    return res.redirect("/");
  }

  try {
    const created = await userStore.registerUser({ email, username, password });
    req.session.userId = created.id;
    setFlash(req, "success", "Welcome to GuessChess.");
    return res.redirect("/account");
  } catch (error) {
    setFlash(req, "error", error.message || "Registration failed.");
    return res.redirect("/");
  }
});

app.post("/login", async (req, res) => {
  const identifier = String(req.body.identifier || "").trim();
  const password = String(req.body.password || "");

  if (!identifier || !password) {
    setFlash(req, "error", "Please provide your credentials.");
    return res.redirect("/");
  }

  try {
    const user = await userStore.loginUser({ identifier, password });
    req.session.userId = user.id;
    setFlash(req, "success", "Welcome back.");
    return res.redirect("/account");
  } catch (error) {
    setFlash(req, "error", error.message || "Login failed.");
    return res.redirect("/");
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/");
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
      flash: readFlash(req),
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
    setFlash(req, "error", error.message || "Password update failed.");
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
    setFlash(
      req,
      "success",
      "Account deletion request received. Our team will process it."
    );
  } catch (error) {
    setFlash(req, "error", error.message || "Delete request failed.");
  }

  return res.redirect("/account");
});

app.use((_req, res) => {
  res.status(404).send("Not Found");
});

app.listen(PORT, () => {
  console.log(`GuessChess site running on port ${PORT}`);
});
