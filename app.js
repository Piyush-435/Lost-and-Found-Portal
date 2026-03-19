// ============================
// AUTHENTICATION & SESSION
// ============================

// Check if user is logged in
function isLoggedIn() {
  return localStorage.getItem('isAuthenticated') === 'true';
}

// Get current user
function getCurrentUser() {
  const userStr = localStorage.getItem('currentUser');
  return userStr ? JSON.parse(userStr) : null;
}

// Set current user
function setCurrentUser(user) {
  localStorage.setItem('currentUser', JSON.stringify(user));
  localStorage.setItem('isAuthenticated', 'true');
}

// Logout user
function logoutUser() {
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('currentUser');
  window.location.href = 'index.html';
}

// Require authentication for protected pages
function requireAuth() {
  if (!isLoggedIn()) {
    showNotification('Access Denied', 'Please login to access this page', 'warning');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
    return false;
  }
  return true;
}

// Check if user is verified
function isUserVerified() {
  const user = getCurrentUser();
  return user && (user.emailVerified || user.phoneVerified);
}

// Redirect if already logged in
function redirectIfAuthenticated() {
  if (isLoggedIn()) {
    window.location.href = 'dashboard.html';
  }
}

// ============================
// DATA STORAGE & MANAGEMENT
// ============================

// Initialize localStorage with sample data if empty
function initializeData() {
  if (!localStorage.getItem('items')) {
    const sampleItems = [
      {
        id: 1,
        type: 'lost',
        name: 'iPhone 14 Pro',
        category: 'electronics',
        location: 'Central Park, New York',
        date: '2026-02-10',
        time: '14:30',
        description: 'Black iPhone 14 Pro with leather case. Has a small scratch on the bottom left corner.',
        contactMethod: 'both',
        reward: 100,
        status: 'active',
        userId: 1,
        userName: 'John Doe',
        timestamp: Date.now() - 86400000 * 5,
        icon: '📱'
      },
      {
        id: 2,
        type: 'found',
        name: 'Black Leather Wallet',
        category: 'accessories',
        location: 'Coffee Shop, Main Street',
        date: '2026-02-12',
        time: '10:00',
        description: 'Brown leather wallet with credit cards and some cash inside. Found near the counter.',
        contactMethod: 'email',
        currentLocation: 'with-me',
        status: 'active',
        userId: 2,
        userName: 'Sarah Johnson',
        timestamp: Date.now() - 86400000 * 3,
        icon: '👛'
      },
      {
        id: 3,
        type: 'lost',
        name: 'Car Keys with Toyota Fob',
        category: 'keys',
        location: 'Shopping Mall Parking Lot',
        date: '2026-02-13',
        time: '16:45',
        description: 'Toyota car key with black leather keychain. Has a small flashlight attached.',
        contactMethod: 'phone',
        reward: 50,
        status: 'active',
        userId: 1,
        userName: 'John Doe',
        timestamp: Date.now() - 86400000 * 2,
        icon: '🔑'
      },
      {
        id: 4,
        type: 'found',
        name: 'Blue Backpack',
        category: 'bags',
        location: 'City Library',
        date: '2026-02-14',
        time: '11:30',
        description: 'Blue Nike backpack with laptop inside. Found in the reading room.',
        contactMethod: 'both',
        currentLocation: 'lost-found-office',
        status: 'active',
        userId: 3,
        userName: 'Mike Chen',
        timestamp: Date.now() - 86400000,
        icon: '🎒'
      },
      {
        id: 5,
        type: 'found',
        name: 'Silver Watch',
        category: 'jewelry',
        location: 'Gym Locker Room',
        date: '2026-02-14',
        time: '18:00',
        description: 'Silver Casio watch with metal band. Left in locker room.',
        contactMethod: 'email',
        currentLocation: 'security-desk',
        status: 'active',
        userId: 4,
        userName: 'Emma Davis',
        timestamp: Date.now() - 3600000 * 12,
        icon: '⌚'
      },
      {
        id: 6,
        type: 'lost',
        name: 'Prescription Glasses',
        category: 'accessories',
        location: 'Bus Stop on 5th Avenue',
        date: '2026-02-15',
        time: '08:00',
        description: 'Black frame prescription glasses in a blue case.',
        contactMethod: 'phone',
        status: 'active',
        userId: 5,
        userName: 'Alex Rodriguez',
        timestamp: Date.now() - 3600000 * 6,
        icon: '👓'
      }
    ];
    
    localStorage.setItem('items', JSON.stringify(sampleItems));
  }
  
  if (!localStorage.getItem('currentUser') && isLoggedIn()) {
    const currentUser = {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      memberSince: '2025-01-15',
      emailVerified: false,
      phoneVerified: false,
      avatar: '👤'
    };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
  }
}

// Get all items
function getItems() {
  return JSON.parse(localStorage.getItem('items')) || [];
}

// Save items
function saveItems(items) {
  localStorage.setItem('items', JSON.stringify(items));
}

// Get current user
function getCurrentUser() {
  return JSON.parse(localStorage.getItem('currentUser'));
}

// Add new item
function addItem(itemData) {
  const items = getItems();
  const newItem = {
    id: Date.now(),
    ...itemData,
    status: 'active',
    timestamp: Date.now()
  };
  items.unshift(newItem);
  saveItems(items);
  return newItem;
}

// Get item by ID
function getItemById(id) {
  const items = getItems();
  return items.find(item => item.id === parseInt(id));
}

// Update item
function updateItem(id, updates) {
  const items = getItems();
  const index = items.findIndex(item => item.id === parseInt(id));
  if (index !== -1) {
    items[index] = { ...items[index], ...updates };
    saveItems(items);
    return items[index];
  }
  return null;
}

// Delete item
function deleteItem(id) {
  const items = getItems();
  const filtered = items.filter(item => item.id !== parseInt(id));
  saveItems(filtered);
}

// Format date
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return minutes <= 1 ? 'Just now' : `${minutes} minutes ago`;
  }
  
  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  
  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  
  // Format as date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Get category icon
function getCategoryIcon(category) {
  const icons = {
    electronics: '📱',
    accessories: '👜',
    documents: '📄',
    bags: '🎒',
    keys: '🔑',
    clothing: '👕',
    jewelry: '💍',
    other: '📦'
  };
  return icons[category] || '📦';
}

// ============================
// RENDERING FUNCTIONS
// ============================

// Render item card
function renderItemCard(item) {
  return `
    <div class="item-card" data-id="${item.id}">
      <div class="item-image">
        ${item.icon || getCategoryIcon(item.category)}
      </div>
      <div class="item-content">
        <div class="item-header">
          <div>
            <h3 class="item-title">${item.name}</h3>
          </div>
          <span class="item-badge ${item.type}">${item.type === 'lost' ? 'Lost' : 'Found'}</span>
        </div>
        <div class="item-meta">
          <div class="meta-item">
            <span class="meta-icon">📍</span>
            <span>${item.location}</span>
          </div>
          <div class="meta-item">
            <span class="meta-icon">📅</span>
            <span>${formatDate(item.timestamp)}</span>
          </div>
          ${item.reward ? `
          <div class="meta-item">
            <span class="meta-icon">💰</span>
            <span>Reward: $${item.reward}</span>
          </div>
          ` : ''}
        </div>
        <p class="item-description">${item.description.substring(0, 100)}${item.description.length > 100 ? '...' : ''}</p>
        <div class="item-footer">
          <a href="#" class="btn-primary view-details" data-id="${item.id}">View Details</a>
          ${item.type === 'lost' ? '<button class="btn-secondary">Contact Finder</button>' : '<button class="btn-secondary">I Found This</button>'}
        </div>
      </div>
    </div>
  `;
}

// Render items on page
function renderItems(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  if (items.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
        <div style="font-size: 64px; margin-bottom: 20px;">🔍</div>
        <h3 style="font-size: 24px; margin-bottom: 10px;">No items found</h3>
        <p style="color: var(--text-medium);">Try adjusting your filters or search terms</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = items.map(item => renderItemCard(item)).join('');
}

// ============================
// FORM HANDLERS
// ============================

// Handle lost form submission
const lostForm = document.getElementById('lostForm');
if (lostForm) {
  // Check authentication first
  if (!requireAuth()) {
    // Will redirect to login
  } else {
    lostForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const currentUser = getCurrentUser();
      
      // Check if user is verified
      if (!isUserVerified()) {
        showNotification('Verification Required', 'Please verify your email or phone number before reporting items', 'warning');
        setTimeout(() => {
          window.location.href = 'profile.html';
        }, 2000);
        return;
      }
      
      const itemData = {
        type: 'lost',
        name: document.getElementById('itemName').value,
        category: document.getElementById('category').value,
        location: document.getElementById('location').value,
        date: document.getElementById('lostDate').value,
        time: document.getElementById('lostTime')?.value || '',
        description: document.getElementById('description').value,
        contactMethod: document.getElementById('contactMethod').value,
        reward: document.getElementById('offerReward')?.checked ? parseInt(document.getElementById('rewardAmount').value) || 0 : 0,
        userId: currentUser.id,
        userName: currentUser.name,
        icon: getCategoryIcon(document.getElementById('category').value)
      };
      
      addItem(itemData);
      showNotification('Success!', 'Your lost item has been reported successfully.', 'success');
      
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);
    });
  }
}

// Handle found form submission
const foundForm = document.getElementById('foundForm');
if (foundForm) {
  // Check authentication first
  if (!requireAuth()) {
    // Will redirect to login
  } else {
    foundForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const currentUser = getCurrentUser();
      
      // Check if user is verified
      if (!isUserVerified()) {
        showNotification('Verification Required', 'Please verify your email or phone number before reporting items', 'warning');
        setTimeout(() => {
          window.location.href = 'profile.html';
        }, 2000);
        return;
      }
      
      const itemData = {
        type: 'found',
        name: document.getElementById('itemName').value,
        category: document.getElementById('category').value,
        location: document.getElementById('location').value,
        date: document.getElementById('foundDate').value,
        time: document.getElementById('foundTime')?.value || '',
        description: document.getElementById('description').value,
        contactMethod: document.getElementById('contactMethod').value,
        currentLocation: document.getElementById('currentLocation').value,
        userId: currentUser.id,
        userName: currentUser.name,
        icon: getCategoryIcon(document.getElementById('category').value)
      };
      
      addItem(itemData);
      showNotification('Thank you!', 'Your found item has been reported successfully.', 'success');
      
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);
    });
  }
}

// Handle login form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  redirectIfAuthenticated();
  
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Simulate authentication
    const user = {
      id: Date.now(),
      name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
      email: email,
      phone: '',
      memberSince: new Date().toISOString().split('T')[0],
      emailVerified: false,
      phoneVerified: false,
      avatar: '👤'
    };
    
    setCurrentUser(user);
    showNotification('Success!', 'Login successful. Redirecting...', 'success');
    
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1500);
  });
}

// Handle register form
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  redirectIfAuthenticated();
  
  registerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
      showNotification('Error', 'Passwords do not match!', 'warning');
      return;
    }
    
    // Create new user
    const user = {
      id: Date.now(),
      name: document.getElementById('fullName').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      memberSince: new Date().toISOString().split('T')[0],
      emailVerified: false,
      phoneVerified: false,
      avatar: '👤'
    };
    
    setCurrentUser(user);
    showNotification('Success!', 'Account created successfully. Redirecting...', 'success');
    
    setTimeout(() => {
      window.location.href = 'profile.html';
    }, 1500);
  });
}

// ============================
// SEARCH & FILTER
// ============================

function filterItems() {
  const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const categoryFilter = document.getElementById('categoryFilter')?.value || '';
  const typeFilter = document.getElementById('typeFilter')?.value || '';
  const sortFilter = document.getElementById('sortFilter')?.value || 'recent';
  
  let items = getItems();
  
  // Apply filters
  items = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm) || 
                         item.description.toLowerCase().includes(searchTerm) ||
                         item.location.toLowerCase().includes(searchTerm);
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    const matchesType = !typeFilter || item.type === typeFilter;
    
    return matchesSearch && matchesCategory && matchesType;
  });
  
  // Apply sorting
  items.sort((a, b) => {
    if (sortFilter === 'recent') {
      return b.timestamp - a.timestamp;
    } else if (sortFilter === 'oldest') {
      return a.timestamp - b.timestamp;
    } else if (sortFilter === 'location') {
      return a.location.localeCompare(b.location);
    }
    return 0;
  });
  
  return items;
}

// Search input handler
const searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('input', function() {
    const items = filterItems();
    renderItems('itemsGrid', items);
  });
}

// Filter handlers
const categoryFilter = document.getElementById('categoryFilter');
const typeFilter = document.getElementById('typeFilter');
const sortFilter = document.getElementById('sortFilter');

if (categoryFilter) {
  categoryFilter.addEventListener('change', function() {
    const items = filterItems();
    renderItems('itemsGrid', items);
  });
}

if (typeFilter) {
  typeFilter.addEventListener('change', function() {
    const items = filterItems();
    renderItems('itemsGrid', items);
  });
}

if (sortFilter) {
  sortFilter.addEventListener('change', function() {
    const items = filterItems();
    renderItems('itemsGrid', items);
  });
}

// ============================
// NOTIFICATIONS
// ============================

function showNotification(title, message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-icon">${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'}</div>
    <div class="notification-content">
      <h4>${title}</h4>
      <p>${message}</p>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// ============================
// NAVIGATION SCROLL EFFECT
// ============================

window.addEventListener('scroll', function() {
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
});

// ============================
// PAGE-SPECIFIC INITIALIZATION
// ============================

// Initialize data on page load
initializeData();

// Home page - render recent items
const recentItemsGrid = document.getElementById('recentItemsGrid');
if (recentItemsGrid) {
  const items = getItems().slice(0, 6);
  renderItems('recentItemsGrid', items);
}

// Browse page - render all items
const itemsGrid = document.getElementById('itemsGrid');
if (itemsGrid && !document.getElementById('dashboardItems')) {
  const items = filterItems();
  renderItems('itemsGrid', items);
}

// Dashboard page - render user's items
const dashboardItems = document.getElementById('dashboardItems');
if (dashboardItems) {
  const currentUser = getCurrentUser();
  const userItems = getItems().filter(item => item.userId === currentUser.id).slice(0, 6);
  renderItems('dashboardItems', userItems);
}

// Load more button
const loadMoreBtn = document.getElementById('loadMoreBtn');
if (loadMoreBtn) {
  loadMoreBtn.addEventListener('click', function() {
    showNotification('Info', 'All items are already loaded!', 'info');
  });
}

// View details handler
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('view-details')) {
    e.preventDefault();
    const itemId = e.target.dataset.id;
    // In a real app, this would open a modal or navigate to item details page
    showNotification('Item Details', 'Item details feature coming soon!', 'info');
  }
});

// Chat send button
const sendBtn = document.getElementById('sendBtn');
const messageInput = document.getElementById('messageInput');

if (sendBtn && messageInput) {
  sendBtn.addEventListener('click', function() {
    const message = messageInput.value.trim();
    if (message) {
      // Add message to chat
      const chatMessages = document.querySelector('.chat-messages');
      const messageHTML = `
        <div class="message sent">
          <div class="message-avatar">JD</div>
          <div>
            <div class="message-content">
              <div class="message-text">${message}</div>
            </div>
            <div class="message-time">Just now</div>
          </div>
        </div>
      `;
      chatMessages.insertAdjacentHTML('beforeend', messageHTML);
      messageInput.value = '';
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  });
  
  messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendBtn.click();
    }
  });
}
// ============================
// THEME TOGGLE
// ============================

// Get saved theme or default to dark
function getTheme() {
  return localStorage.getItem('theme') || 'dark';
}

// Set theme
function setTheme(theme) {
  localStorage.setItem('theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcon();
}

// Toggle between dark and light
function toggleTheme() {
  const currentTheme = getTheme();
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}

// Update icon based on current theme
function updateThemeIcon() {
  const icon = document.querySelector('.theme-toggle-icon');
  if (icon) {
    icon.textContent = getTheme() === 'dark' ? '☀️' : '🌙';
  }
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', function() {
  setTheme(getTheme());
  
  // Add theme toggle button if it doesn't exist
  if (!document.querySelector('.theme-toggle')) {
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'theme-toggle';
    toggleBtn.setAttribute('aria-label', 'Toggle theme');
    toggleBtn.innerHTML = '<span class="theme-toggle-icon">☀️</span>';
    toggleBtn.addEventListener('click', toggleTheme);
    document.body.appendChild(toggleBtn);
    updateThemeIcon();
  }
});

// Console message
console.log('🔍 Lost & Found Portal - Frontend loaded successfully!');
console.log('📊 Current items in database:', getItems().length);

