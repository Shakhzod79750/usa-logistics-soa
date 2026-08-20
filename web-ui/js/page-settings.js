(function () {
  const session = window.Layout.initLayout('settings');
  if (!session) return;

  document.getElementById('cfgAuth').value = window.APP_CONFIG.AUTH_BASE;
  document.getElementById('cfgTracking').value = window.APP_CONFIG.TRACKING_BASE;
  document.getElementById('cfgShipment').value = window.APP_CONFIG.SHIPMENT_BASE;
  document.getElementById('cfgWarehouse').value = window.APP_CONFIG.WAREHOUSE_BASE;

  document.getElementById('saveConfigBtn').addEventListener('click', () => {
    localStorage.setItem('cfg_auth_base', document.getElementById('cfgAuth').value.trim());
    localStorage.setItem('cfg_tracking_base', document.getElementById('cfgTracking').value.trim());
    localStorage.setItem('cfg_shipment_base', document.getElementById('cfgShipment').value.trim());
    localStorage.setItem('cfg_warehouse_base', document.getElementById('cfgWarehouse').value.trim());
    window.Layout.showToast('Saved. Reloading…', 'success');
    setTimeout(() => window.location.reload(), 600);
  });

  document.getElementById('resetConfigBtn').addEventListener('click', () => {
    ['cfg_auth_base', 'cfg_tracking_base', 'cfg_shipment_base', 'cfg_warehouse_base'].forEach((k) => localStorage.removeItem(k));
    window.Layout.showToast('Reset to defaults. Reloading…', 'success');
    setTimeout(() => window.location.reload(), 600);
  });

  const themeBtn = document.getElementById('settingsThemeToggle');
  function syncThemeBtn() { themeBtn.textContent = window.Theme.get() === 'dark' ? 'Switch to Light' : 'Switch to Dark'; }
  syncThemeBtn();
  themeBtn.addEventListener('click', () => window.Theme.toggle());
  window.addEventListener('themechange', syncThemeBtn);

  const tokenPreview = (window.Api.getToken() || '').slice(0, 24) + '…';
  document.getElementById('sessionTable').innerHTML = `
    <tr><td class="text-muted" style="width:160px;">Signed in as</td><td>${session.full_name} (${session.email})</td></tr>
    <tr><td class="text-muted">Role</td><td><span class="${window.Layout.roleBadgeClass(session.role)}">${session.role}</span></td></tr>
    <tr><td class="text-muted">User ID</td><td class="mono">#${session.user_id}</td></tr>
    <tr><td class="text-muted">JWT (truncated)</td><td class="mono text-faint">${tokenPreview}</td></tr>
  `;
})();
