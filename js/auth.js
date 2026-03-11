// ============================
// AUTHENTICATION MODULE
// ============================

import { getStorage, setStorage, removeStorage } from "./storage.js";

export function isLoggedIn() {
    return getStorage("isAuthenticated") === true;
}

export function getCurrentUser() {
    return getStorage("currentUser");
}

export function setCurrentUser(user) {
    setStorage("currentUser", user);
    setStorage("isAuthenticated", true);
}

export function logoutUser() {
    removeStorage("currentUser");
    removeStorage("isAuthenticated");

    window.location.href = "index.html";
}

export function requireAuth() {

    if (!isLoggedIn()) {

        alert("Please login first");

        setTimeout(() => {
            window.location.href = "login.html";
        }, 1000);

        return false;
    }

    return true;
}