// ============================================================================
// Shared app shell: sidebar nav (role-aware), auth guard, toast helper.
// Every page includes this after api.js and calls initLayout() with the
// current page key.
// ============================================================================

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Overview', href: 'dashboard.html', icon: '\u25A3' },
  { key: 'shipments', label: 'Shipments', href: 'shipments.html', icon: '\u25A3', svc: 'py' },
  { key: 'tracking', label: 'Tracking', href: 'tracking.html', icon: '\u25A3', svc: 'node' },
  { key: 'warehouses', label: 'Warehouses', href: 'warehouses.html', icon: '\u25A3', svc: 'py' },
  { key: 'users', label: 'Users', href: 'users.html', icon: '\u25A3', svc: 'node', roles: ['admin'] },
  { key: 'architecture', label: 'Architecture', href: 'architecture.html', icon: '\u25C8' },
  { key: 'settings', label: 'Settings', href: 'settings.html', icon: '\u2699' },
];

function roleBadgeClass(role) { return `badge badge-role-${role}`; }

function renderSidebar(activeKey) {
  const session = window.Api.getSession();
  const slot = document.getElementById('sidebar-slot');
  if (!slot) return;

  const items = NAV_ITEMS.filter((item) => !item.roles || (session && item.roles.includes(session.role)));
  const navHtml = items.map((item) => `
    <a class="nav-item ${item.key === activeKey ? 'active' : ''} ${item.svc === 'node' ? 'svc-node' : item.svc === 'py' ? 'svc-py' : ''}" href="${item.href}">
      <span class="dot"></span>${item.label}
    </a>`).join('');

  const initials = session ? session.full_name.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase() : '?';

  slot.innerHTML = `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark"><span class="crate"></span><span class="brand-title">USA Logistics</span></div>
        <div class="brand-sub">SOA Tracking Console</div>
      </div>
      <nav class="nav">
        <div class="nav-section-label">Operations</div>
        ${navHtml}
      </nav>
      <div class="sidebar-footer">
        ${session ? `
          <div class="user-chip">
            <div class="user-avatar">${initials}</div>
            <div class="user-meta">
              <div class="user-name">${session.full_name}</div>
              <span class="${roleBadgeClass(session.role)}">${session.role}</span>
            </div>
          </div>
          <button class="btn-logout" id="logoutBtn">Sign Out</button>
        ` : ''}
      </div>
    </aside>`;

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    window.Api.clearSession();
    window.location.href = 'login.html';
  });
}

function requireAuth() {
  const session = window.Api.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}

function requireRole(...roles) {
  const session = requireAuth();
  if (session && !roles.includes(session.role)) {
    showToast(`This page requires role: ${roles.join(' or ')}`, 'error');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 900);
    return null;
  }
  return session;
}

function showToast(message, kind = 'info') {
  let stack = document.querySelector('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

function initLayout(pageKey, opts = {}) {
  if (opts.public) {
    // login page etc — no sidebar/auth required
    return null;
  }
  const session = opts.roles ? requireRole(...opts.roles) : requireAuth();
  if (!session) return null;
  renderSidebar(pageKey);
  return session;
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function statusBadge(status) {
  return `<span class="badge badge-${String(status).toLowerCase()}">${status}</span>`;
}

window.Layout = { initLayout, showToast, fmtDate, statusBadge, roleBadgeClass, requireAuth, requireRole };
