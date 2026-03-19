// ============================
// THEME TOGGLE
// ============================

function getTheme() {
  return localStorage.getItem('theme') || 'dark';
}

function setTheme(theme) {
  localStorage.setItem('theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcon();
}

function toggleTheme() {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

function updateThemeIcon() {
  const icon = document.querySelector('.theme-toggle-icon');
  if (icon) icon.textContent = getTheme() === 'dark' ? '☀️' : '🌙';
}

// ============================
// NAVBAR DROPDOWN
// ============================

function initNavbar() {
const profileBtn = document.getElementById('profileDropdownBtn');
const dropdown   = document.getElementById('profileDropdown');

  if (profileBtn && dropdown) {
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });
    document.addEventListener('click', () => dropdown.classList.remove('open'));
  }

  // Highlight active nav link
  const links = document.querySelectorAll('.nav-link');
  links.forEach(link => {
    if (link.href === window.location.href) link.classList.add('active');
  });
}

// ============================
// NAVBAR SCROLL EFFECT
// ============================

function initScrollEffect() {
  window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 50);
  });
}

// ============================
// AUTO-DISMISS FLASH MESSAGES
// ============================

function initFlashMessages() {
  const flashes = document.querySelectorAll('.flash-message');
  flashes.forEach(flash => {
    setTimeout(() => {
      flash.style.opacity = '0';
      flash.style.transition = 'opacity 0.4s ease';
      setTimeout(() => flash.remove(), 400);
    }, 4000);
  });
}

// ============================
// THEME TOGGLE BUTTON
// ============================

function initThemeToggle() {
  setTheme(getTheme());
  if (!document.querySelector('.theme-toggle')) {
    const btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.setAttribute('aria-label', 'Toggle theme');
    btn.innerHTML = '<span class="theme-toggle-icon"></span>';
    btn.addEventListener('click', toggleTheme);
    document.body.appendChild(btn);
    updateThemeIcon();
  }
}

// ============================
// INIT
// ============================

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initNavbar();
  initScrollEffect();
  initFlashMessages();
});