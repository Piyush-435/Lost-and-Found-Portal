// ============================
// STORAGE UTILITY
// ============================

export function getStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

export function setStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

export function removeStorage(key) {
    localStorage.removeItem(key);
}