(function () {
  // already signed in? go straight to dashboard
  if (window.Api.getSession()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active'); tabRegister.classList.remove('active');
    loginForm.style.display = 'block'; registerForm.style.display = 'none';
  });
  tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active'); tabLogin.classList.remove('active');
    registerForm.style.display = 'block'; loginForm.style.display = 'none';
  });

  document.getElementById('forgotPasswordLink').addEventListener('click', (e) => {
    e.preventDefault();
    alert(
      'This demo system has no email/SMS service, so there is no self-service password reset.\n\n' +
      'To reset a password: sign in as an Administrator → go to the Users page → click "Reset Password" next to the account.\n\n' +
      'If you don\u2019t have access to an Admin account, you\u2019ll need to register a new one.'
    );
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('loginSubmitBtn');
    btn.disabled = true; btn.textContent = 'Signing in…';
    try {
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const res = await window.Api.authApi.login({ email, password });
      window.Api.setSession({
        access_token: res.access_token,
        role: res.role,
        user_id: res.user_id,
        full_name: res.full_name || email,
        email,
      });
      window.location.href = 'dashboard.html';
    } catch (err) {
      window.Layout.showToast(err.message || 'Login failed', 'error');
      btn.disabled = false; btn.textContent = 'Sign In';
    }
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('regPassword').value;
    if (password.length < 8) {
      window.Layout.showToast('Password must be at least 8 characters', 'error');
      document.getElementById('regPassword').focus();
      return;
    }
    const btn = document.getElementById('regSubmitBtn');
    btn.disabled = true; btn.textContent = 'Creating…';
    try {
      const full_name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const role = document.getElementById('regRole').value;
      await window.Api.authApi.register({ full_name, email, password, role });
      window.Layout.showToast('Account created — signing you in…', 'success');
      const res = await window.Api.authApi.login({ email, password });
      window.Api.setSession({ access_token: res.access_token, role: res.role, user_id: res.user_id, full_name, email });
      window.location.href = 'dashboard.html';
    } catch (err) {
      window.Layout.showToast(err.message || 'Registration failed', 'error');
      btn.disabled = false; btn.textContent = 'Create Account';
    }
  });
})();
