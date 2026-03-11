// ============================
// MAIN APP
// ============================

import { initTheme, toggleTheme, getTheme } from "./theme.js";
import { logoutUser } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {

    initTheme();

    const toggleBtn = document.getElementById("themeToggle");

    if (toggleBtn) {

        toggleBtn.textContent =
            getTheme() === "dark" ? "🌙" : "☀️";

        toggleBtn.addEventListener("click", () => {

            toggleTheme();

            toggleBtn.textContent =
                getTheme() === "dark" ? "🌙" : "☀️";
        });
    }

    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", logoutUser);
    }

});