// ============================
// THEME MANAGEMENT
// ============================

const THEME_KEY = "portal-theme";

export function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
}

export function getTheme() {
    const saved = localStorage.getItem(THEME_KEY);

    if (saved) return saved;

    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        return "light";
    }

    return "dark";
}

export function toggleTheme() {
    const current = getTheme();
    const newTheme = current === "dark" ? "light" : "dark";

    setTheme(newTheme);
}

export function initTheme() {
    setTheme(getTheme());
}