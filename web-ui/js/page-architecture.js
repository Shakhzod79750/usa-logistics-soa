(function () {
  const session = window.Layout.initLayout('architecture');
  if (!session) return;

  document.getElementById('archDiagramWrap').innerHTML = window.TracePanel.buildDiagramSvg();

  document.querySelectorAll('[data-swagger]').forEach((el) => {
    const base = window.APP_CONFIG[el.dataset.swagger];
    el.href = `${base}/docs`;
  });

  const SERVICES = [
    { key: 'auth-service', name: 'Auth Service', lang: 'Node.js / Express', base: window.APP_CONFIG.AUTH_BASE, fn: window.Api.authApi.health },
    { key: 'shipment-service', name: 'Shipment Service', lang: 'Python / FastAPI', base: window.APP_CONFIG.SHIPMENT_BASE, fn: window.Api.shipmentApi.health },
    { key: 'tracking-service', name: 'Tracking Service', lang: 'Node.js / Express', base: window.APP_CONFIG.TRACKING_BASE, fn: window.Api.trackingApi.health },
    { key: 'warehouse-service', name: 'Warehouse Service', lang: 'Python / FastAPI', base: window.APP_CONFIG.WAREHOUSE_BASE, fn: window.Api.warehouseApi.health },
  ];

  async function checkHealth() {
    const grid = document.getElementById('healthGrid');
    grid.innerHTML = SERVICES.map((s) => `
      <div class="health-card" id="health-${s.key}">
        <div class="health-top"><span class="health-name">${s.name}</span><span class="health-dot" id="dot-${s.key}"></span></div>
        <div class="health-meta health-url">${s.base}</div>
        <div class="health-meta" style="margin-top:4px;">${s.lang}</div>
        <div class="health-meta" id="status-${s.key}" style="margin-top:8px;">checking…</div>
      </div>`).join('');

    SERVICES.forEach(async (s) => {
      const dot = document.getElementById(`dot-${s.key}`);
      const status = document.getElementById(`status-${s.key}`);
      try {
        const t0 = performance.now();
        await s.fn();
        const ms = Math.round(performance.now() - t0);
        dot.classList.add('up');
        status.innerHTML = `<span style="color:var(--success)">● online</span> · ${ms}ms`;
      } catch (err) {
        dot.classList.add('down');
        status.innerHTML = `<span style="color:var(--danger)">● unreachable</span>`;
      }
    });
  }

  document.getElementById('refreshHealthBtn').addEventListener('click', checkHealth);
  checkHealth();

  // mirror every hop into the full-width log on this page too
  let count = 0;
  window.addEventListener('tracehop', (e) => {
    count += 1;
    const log = document.getElementById('archLog');
    if (count === 1) log.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.style.padding = '0 4px';
    wrapper.innerHTML = window.TracePanel.formatHopLine(e.detail);
    log.insertBefore(wrapper.firstElementChild, log.firstChild);
    while (log.children.length > 150) log.removeChild(log.lastChild);
  });

  document.getElementById('archClearLogBtn').addEventListener('click', () => {
    document.getElementById('archLog').innerHTML = '<div class="trace-empty">Cleared.</div>';
    count = 0;
  });
})();
