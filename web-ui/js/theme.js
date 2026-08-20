// Applied synchronously, before CSS paints, to avoid a flash of the wrong theme.
(function () {
  const saved = localStorage.getItem('ui_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);

  window.Theme = {
    get: () => document.documentElement.getAttribute('data-theme'),
    set: (theme) => {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('ui_theme', theme);
      window.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
    },
    toggle: () => {
      const next = window.Theme.get() === 'dark' ? 'light' : 'dark';
      window.Theme.set(next);
      return next;
    },
  };

  // Docks into a page's topbar (via #theme-toggle-slot) when present, so it
  // never collides with other topbar controls. Only falls back to a fixed
  // floating pill on pages with no topbar (e.g. the login page).
  function mountButton() {
    if (document.getElementById('globalThemeToggle')) return;
    const slot = document.getElementById('theme-toggle-slot');
    const btn = document.createElement('button');
    btn.id = 'globalThemeToggle';
    btn.type = 'button';

    const dockedStyle = [
      'display:flex', 'align-items:center', 'gap:7px',
      'padding:8px 14px', 'border-radius:6px',
      'font-family:Inter,sans-serif', 'font-size:12px', 'font-weight:600',
      'cursor:pointer',
      'background:var(--panel,#fff)', 'color:var(--text-muted,#5B6670)',
      'border:1px solid var(--border,#DDE3E8)',
    ];
    const floatingStyle = dockedStyle.concat([
      'position:fixed', 'top:16px', 'right:16px', 'z-index:500', 'border-radius:999px',
      'box-shadow:0 4px 14px rgba(0,0,0,0.18)',
    ]);
    btn.style.cssText = (slot ? dockedStyle : floatingStyle).join(';');

    function render() {
      const dark = window.Theme.get() === 'dark';
      btn.innerHTML = `<span aria-hidden="true">${dark ? '&#9728;' : '&#9789;'}</span><span>${dark ? 'Light' : 'Dark'}</span>`;
      btn.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
    }
    btn.addEventListener('click', () => { window.Theme.toggle(); render(); });
    window.addEventListener('themechange', render);
    render();
    (slot || document.body).appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountButton);
  } else {
    mountButton();
  }
})();

