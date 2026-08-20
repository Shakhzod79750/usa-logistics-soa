(function () {
  const session = window.Layout.initLayout('dashboard');
  if (!session) return;

  async function load() {
    const results = await Promise.allSettled([
      window.Api.shipmentApi.list(),
      window.Api.warehouseApi.list(),
    ]);

    const shipments = results[0].status === 'fulfilled' ? results[0].value : [];
    const warehouses = results[1].status === 'fulfilled' ? results[1].value : [];

    if (results[0].status === 'rejected') window.Layout.showToast(`Shipment Service: ${results[0].reason.message}`, 'error');
    if (results[1].status === 'rejected') window.Layout.showToast(`Warehouse Service: ${results[1].reason.message}`, 'error');

    let inventoryCount = 0;
    for (const wh of warehouses) inventoryCount += (wh.inventory || []).length;
    const inTransit = shipments.filter((s) => s.status === 'IN_TRANSIT' || s.status === 'ASSIGNED').length;

    document.getElementById('statGrid').innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Shipments</div>
        <div class="stat-value">${shipments.length}</div>
        <div class="stat-sub">via Shipment Service</div>
      </div>
      <div class="stat-card svc-py">
        <div class="stat-label">Warehouses</div>
        <div class="stat-value">${warehouses.length}</div>
        <div class="stat-sub">via Warehouse Service (Python)</div>
      </div>
      <div class="stat-card svc-py">
        <div class="stat-label">Inventory SKUs</div>
        <div class="stat-value">${inventoryCount}</div>
        <div class="stat-sub">across all warehouses</div>
      </div>
      <div class="stat-card svc-node">
        <div class="stat-label">In Transit</div>
        <div class="stat-value">${inTransit}</div>
        <div class="stat-sub">via Tracking Service (Node.js)</div>
      </div>`;

    const recent = [...shipments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8);
    const body = document.getElementById('recentShipmentsBody');
    if (recent.length === 0) {
      body.innerHTML = `<tr class="empty-row"><td colspan="5">No shipments yet. <a href="shipments.html" style="color:var(--brand)">Create one →</a></td></tr>`;
      return;
    }
    body.innerHTML = recent.map((s) => `
      <tr>
        <td class="mono">${s.tracking_number}</td>
        <td>${window.Layout.statusBadge(s.status)}</td>
        <td class="text-muted">${truncate(s.origin_address, 20)} → ${truncate(s.destination_address, 20)}</td>
        <td>${s.weight_kg} kg</td>
        <td class="text-muted">${window.Layout.fmtDate(s.created_at)}</td>
      </tr>`).join('');
  }

  function truncate(str, n) { return str && str.length > n ? str.slice(0, n) + '…' : str; }

  load();
})();
