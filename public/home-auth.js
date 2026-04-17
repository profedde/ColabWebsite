(function () {
  const modal = document.getElementById("auth-modal");
  const openAuthBtn = document.getElementById("open-auth-btn");
  const closeAuthBtn = document.getElementById("close-auth-btn");
  const menuToggle = document.getElementById("menu-toggle");
  const siteNav = document.getElementById("site-nav");
  const yearNode = document.getElementById("year");
  const langToggle = document.getElementById("lang-toggle");

  const authForm = document.getElementById("auth-form");
  const usernameInput = document.getElementById("auth-identifier");
  const passwordInput = document.getElementById("auth-password");
  const registerUsername = document.getElementById("register-username");
  const registerEmail = document.getElementById("register-email");
  const registerConfirm = document.getElementById("register-confirm");
  const registerSubmitBtn = document.getElementById("register-submit-btn");
  const loginSubmitBtn = document.getElementById("login-submit-btn");

  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }

  const openModal = function () {
    if (!modal) return;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(function () {
      if (usernameInput) {
        usernameInput.focus();
      }
    }, 10);
  };

  const closeModal = function () {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = "";
  };

  if (openAuthBtn) {
    openAuthBtn.addEventListener("click", openModal);
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
    if (!modal.hidden) {
      document.body.style.overflow = "hidden";
      if (usernameInput) {
        usernameInput.focus();
      }
    }
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

  if (loginSubmitBtn && authForm) {
    loginSubmitBtn.addEventListener("click", function () {
      authForm.action = "/login";
    });
  }

  if (registerSubmitBtn && authForm) {
    registerSubmitBtn.addEventListener("click", function () {
      const username = usernameInput ? usernameInput.value.trim() : "";
      const password = passwordInput ? passwordInput.value : "";
      if (registerUsername) {
        registerUsername.value = username;
      }
      if (registerEmail) {
        registerEmail.value = "";
      }
      if (registerConfirm) {
        registerConfirm.value = password;
      }
      authForm.action = "/register";
    });
  }
})();
