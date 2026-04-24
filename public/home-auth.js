(function () {
  const modal = document.getElementById("auth-modal");
  const authPanel = document.querySelector(".auth-panel-login");
  const openAuthBtn = document.getElementById("open-auth-btn");
  const closeAuthBtn = document.getElementById("close-auth-btn");
  const menuToggle = document.getElementById("menu-toggle");
  const siteNav = document.getElementById("site-nav");
  const yearNode = document.getElementById("year");
  const langToggle = document.getElementById("lang-toggle");
  const LANG_KEY = "colabgames_home_lang";
  const translations = {
    en: {
      navHome: "Home",
      navChessguess: "GuessChess",
      navSupport: "Support",
      menu: "Menu",
      login: "Login",
      register: "Register",
      homeKicker: "INDIE GAME STUDIO",
      homeTitle: "ColabGames builds games around fast decisions.",
      homeLead:
        "Current focus: GuessChess, a hidden-information strategy game with bot mode, custom rooms, and competitive online multiplayer.",
      linksTitle: "Official Links",
      privacyPolicy: "Privacy Policy",
      privacy: "Privacy",
      terms: "Terms and Conditions",
      termsShort: "Terms",
      support: "Support",
      deleteAccount: "Delete Account",
      loginTitle: "Login",
      registerTitle: "Register",
      forgotTitle: "Forgot Password",
      forgotPassword: "Forgot password?",
      identifier: "Username or email",
      username: "Username",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm password",
      createAccount: "Create account",
      back: "Back",
      sendReset: "Send reset link",
      resetNote: "If your account has an email, we will send a reset link valid for 1 hour."
    },
    it: {
      navHome: "Home",
      navChessguess: "GuessChess",
      navSupport: "Supporto",
      menu: "Menu",
      login: "Accedi",
      register: "Registrati",
      homeKicker: "INDIE GAME STUDIO",
      homeTitle: "ColabGames crea giochi basati su decisioni rapide.",
      homeLead:
        "Focus attuale: GuessChess, un gioco strategico a informazione nascosta con bot, stanze personalizzate e multiplayer competitivo online.",
      linksTitle: "Link ufficiali",
      privacyPolicy: "Privacy Policy",
      privacy: "Privacy",
      terms: "Termini e condizioni",
      termsShort: "Termini",
      support: "Supporto",
      deleteAccount: "Elimina account",
      loginTitle: "Accedi",
      registerTitle: "Registrati",
      forgotTitle: "Recupera password",
      forgotPassword: "Password dimenticata?",
      identifier: "Username o email",
      username: "Username",
      email: "Email",
      password: "Password",
      confirmPassword: "Conferma password",
      createAccount: "Crea account",
      back: "Indietro",
      sendReset: "Invia link reset",
      resetNote: "Se il tuo account ha un'email, invieremo un link di reset valido per 1 ora."
    }
  };

  const panels = Array.from(document.querySelectorAll("[data-auth-panel]"));
  const showRegisterBtn = document.getElementById("show-register-btn");
  const showForgotBtn = document.getElementById("show-forgot-btn");
  const showLoginFromRegisterBtn = document.getElementById("show-login-from-register-btn");
  const showLoginFromForgotBtn = document.getElementById("show-login-from-forgot-btn");

  const focusByPanel = {
    login: document.getElementById("auth-identifier"),
    register: document.querySelector('#register-form input[name="username"]'),
    forgot: document.querySelector('#forgot-form input[name="identifier"]')
  };

  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }

  const getStoredLang = function () {
    try {
      const saved = window.localStorage.getItem(LANG_KEY);
      return saved === "it" ? "it" : "en";
    } catch (_err) {
      return "en";
    }
  };

  const storeLang = function (lang) {
    try {
      window.localStorage.setItem(LANG_KEY, lang);
    } catch (_err) {
      // Ignore private browsing storage failures.
    }
  };

  const applyLanguage = function (lang) {
    document.documentElement.lang = lang;

    document.querySelectorAll("[data-i18n]").forEach(function (node) {
      const key = node.getAttribute("data-i18n");
      if (translations[lang] && translations[lang][key]) {
        node.textContent = translations[lang][key];
      }
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (node) {
      const key = node.getAttribute("data-i18n-placeholder");
      if (translations[lang] && translations[lang][key]) {
        node.setAttribute("placeholder", translations[lang][key]);
      }
    });

    if (langToggle) {
      langToggle.textContent = lang.toUpperCase();
      langToggle.setAttribute("aria-label", lang === "it" ? "Cambia lingua" : "Change language");
      langToggle.setAttribute("title", lang === "it" ? "Cambia lingua" : "Change language");
    }
  };

  const setPanel = function (panelName) {
    panels.forEach(function (panel) {
      panel.hidden = panel.dataset.authPanel !== panelName;
    });

    const targetInput = focusByPanel[panelName];
    if (targetInput) {
      setTimeout(function () {
        targetInput.focus();
      }, 10);
    }
  };

  const openModal = function (panelName) {
    if (!modal) return;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    setPanel(panelName || "login");
  };

  const closeModal = function () {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = "";
  };

  if (openAuthBtn) {
    openAuthBtn.addEventListener("click", function () {
      openModal("login");
    });
  }

  if (closeAuthBtn) {
    closeAuthBtn.addEventListener("click", closeModal);
  }

  if (modal) {
    modal.addEventListener("click", function (event) {
      if (event.target === modal) {
        closeModal();
      }
    });

    const startupPanel =
      (authPanel && authPanel.dataset.activePanel && authPanel.dataset.activePanel.trim()) || "login";
    if (!modal.hidden) {
      document.body.style.overflow = "hidden";
    }
    setPanel(startupPanel);
  }

  if (showRegisterBtn) {
    showRegisterBtn.addEventListener("click", function () {
      setPanel("register");
    });
  }

  if (showForgotBtn) {
    showForgotBtn.addEventListener("click", function () {
      setPanel("forgot");
    });
  }

  if (showLoginFromRegisterBtn) {
    showLoginFromRegisterBtn.addEventListener("click", function () {
      setPanel("login");
    });
  }

  if (showLoginFromForgotBtn) {
    showLoginFromForgotBtn.addEventListener("click", function () {
      setPanel("login");
    });
  }

  if (menuToggle && siteNav) {
    menuToggle.addEventListener("click", function () {
      const expanded = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!expanded));
      siteNav.classList.toggle("is-open", !expanded);
    });
  }

  let activeLang = getStoredLang();
  applyLanguage(activeLang);

  if (langToggle) {
    langToggle.addEventListener("click", function () {
      activeLang = activeLang === "en" ? "it" : "en";
      storeLang(activeLang);
      applyLanguage(activeLang);
    });
  }
})();
