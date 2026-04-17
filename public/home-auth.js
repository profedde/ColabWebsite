(function () {
  const modal = document.getElementById("auth-modal");
  const authPanel = document.querySelector(".auth-panel-login");
  const openAuthBtn = document.getElementById("open-auth-btn");
  const closeAuthBtn = document.getElementById("close-auth-btn");
  const menuToggle = document.getElementById("menu-toggle");
  const siteNav = document.getElementById("site-nav");
  const yearNode = document.getElementById("year");
  const langToggle = document.getElementById("lang-toggle");

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

  if (langToggle) {
    langToggle.addEventListener("click", function () {
      langToggle.textContent = langToggle.textContent === "EN" ? "IT" : "EN";
    });
  }
})();
