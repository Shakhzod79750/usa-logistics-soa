(function () {
  const session = window.Layout.initLayout('users', { roles: ['admin'] });
  if (!session) return;

  let editingId = null;
  let resettingId = null;

  async function loadUsers() {
    try {
      const users = await window.Api.authApi.listUsers();
      const body = document.getElementById('userBody');
      if (users.length === 0) {
        body.innerHTML = `<tr class="empty-row"><td colspan="6">No users found.</td></tr>`;
        return;
      }
      body.innerHTML = users.map((u) => `
        <tr>
          <td class="mono text-muted">#${u.id}</td>
          <td>${u.full_name}</td>
          <td class="text-muted">${u.email}</td>
          <td><span class="${window.Layout.roleBadgeClass(u.role)}">${u.role}</span></td>
          <td class="text-muted">${window.Layout.fmtDate(u.created_at)}</td>
          <td class="flex gap-8">
            <button class="btn btn-ghost btn-sm" data-edit="${u.id}" data-name="${u.full_name}" data-role="${u.role}">Edit</button>
            <button class="btn btn-ghost btn-sm" data-resetpw="${u.id}" data-name="${u.full_name}">Reset Password</button>
            ${String(u.id) !== String(session.user_id) ? `<button class="btn btn-danger btn-sm" data-delete="${u.id}">Delete</button>` : ''}
          </td>
        </tr>`).join('');

      body.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => {
        editingId = btn.dataset.edit;
        document.getElementById('editName').value = btn.dataset.name;
        document.getElementById('editRole').value = btn.dataset.role;
        document.getElementById('editModalBackdrop').style.display = 'flex';
      }));
      body.querySelectorAll('[data-resetpw]').forEach((btn) => btn.addEventListener('click', () => {
        resettingId = btn.dataset.resetpw;
        document.getElementById('resetPwUserLabel').textContent = `Setting a new password for ${btn.dataset.name}.`;
        document.getElementById('resetPwForm').reset();
        document.getElementById('resetPwModalBackdrop').style.display = 'flex';
      }));
      body.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', async () => {
        if (!confirm('Delete this user?')) return;
        try {
          await window.Api.authApi.deleteUser(btn.dataset.delete);
          window.Layout.showToast('User deleted', 'success');
          loadUsers();
        } catch (err) { window.Layout.showToast(err.message, 'error'); }
      }));
    } catch (err) {
      document.getElementById('userBody').innerHTML = `<tr class="empty-row"><td colspan="6">Could not load users — ${err.message}</td></tr>`;
    }
  }

  const backdrop = document.getElementById('editModalBackdrop');
  document.getElementById('editModalClose').addEventListener('click', () => backdrop.style.display = 'none');
  document.getElementById('editCancelBtn').addEventListener('click', () => backdrop.style.display = 'none');
  document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('editSubmitBtn');
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      await window.Api.authApi.updateUser(editingId, {
        full_name: document.getElementById('editName').value.trim(),
        role: document.getElementById('editRole').value,
      });
      window.Layout.showToast('User updated', 'success');
      backdrop.style.display = 'none';
      loadUsers();
    } catch (err) { window.Layout.showToast(err.message, 'error'); }
    finally { btn.disabled = false; btn.textContent = 'Save Changes'; }
  });

  const resetBackdrop = document.getElementById('resetPwModalBackdrop');
  document.getElementById('resetPwModalClose').addEventListener('click', () => resetBackdrop.style.display = 'none');
  document.getElementById('resetPwCancelBtn').addEventListener('click', () => resetBackdrop.style.display = 'none');
  document.getElementById('resetPwForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('resetPwValue').value;
    if (newPassword.length < 8) {
      window.Layout.showToast('Password must be at least 8 characters', 'error');
      return;
    }
    const btn = document.getElementById('resetPwSubmitBtn');
    btn.disabled = true; btn.textContent = 'Resetting…';
    try {
      await window.Api.authApi.updateUser(resettingId, { password: newPassword });
      window.Layout.showToast('Password reset successfully', 'success');
      resetBackdrop.style.display = 'none';
    } catch (err) { window.Layout.showToast(err.message, 'error'); }
    finally { btn.disabled = false; btn.textContent = 'Reset Password'; }
  });

  loadUsers();
})();
