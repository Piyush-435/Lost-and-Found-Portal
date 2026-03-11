// ============================
// UI UTILITIES
// ============================

export function showNotification(title, message) {

    const box = document.createElement("div");

    box.className = "notification";

    box.innerHTML = `
        <strong>${title}</strong>
        <p>${message}</p>
    `;

    document.body.appendChild(box);

    setTimeout(() => {
        box.remove();
    }, 3000);
}

export function formatDate(timestamp) {

    const date = new Date(timestamp);

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}