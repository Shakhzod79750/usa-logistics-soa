(function () {
  const session = window.Layout.initLayout('shipments');
  if (!session) return;

  const canCreate = ['admin', 'dispatcher', 'customer'].includes(session.role);
  const canManage = ['admin', 'dispatcher'].includes(session.role);
  const canDelete = session.role === 'admin';
  let shipmentsCache = [];
  let managingId = null;

  async function loadShipments() {
    try {
      shipmentsCache = await window.Api.shipmentApi.list();
      renderTable();
    } catch (err) {
      document.getElementById('shipmentBody').innerHTML = `<tr class="empty-row"><td colspan="7">Could not load shipments — ${err.message}</td></tr>`;
    }
  }

  function getFiltered() {
    const q = (document.getElementById('searchInput').value || '').trim().toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    return shipmentsCache.filter((s) => {
      if (statusFilter && s.status !== statusFilter) return false;
      if (!q) return true;
      return (
        s.tracking_number.toLowerCase().includes(q) ||
        s.origin_address.toLowerCase().includes(q) ||
        s.destination_address.toLowerCase().includes(q) ||
        s.status.toLowerCase().includes(q)
      );
    });
  }

  document.getElementById('searchInput').addEventListener('input', renderTable);
  document.getElementById('statusFilter').addEventListener('change', renderTable);

  document.getElementById('exportCsvBtn').addEventListener('click', () => {
    const rows = getFiltered();
    if (rows.length === 0) { window.Layout.showToast('Nothing to export', 'error'); return; }
    const header = ['tracking_number', 'status', 'customer_id', 'driver_id', 'origin_address', 'destination_address', 'weight_kg', 'created_at'];
    const csvRows = [header.join(',')];
    rows.forEach((s) => {
      csvRows.push(header.map((k) => `"${String(s[k] ?? '').replace(/"/g, '""')}"`).join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `shipments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    window.Layout.showToast(`Exported ${rows.length} shipment(s) to CSV`, 'success');
  });

  function renderTable() {
    const body = document.getElementById('shipmentBody');
    const rows = getFiltered();
    if (shipmentsCache.length === 0) {
      body.innerHTML = `<tr class="empty-row"><td colspan="7">No shipments yet.${canCreate ? ' Click "New Shipment" to create one.' : ''}</td></tr>`;
      return;
    }
    if (rows.length === 0) {
      body.innerHTML = `<tr class="empty-row"><td colspan="7">No shipments match your search/filter.</td></tr>`;
      return;
    }
    body.innerHTML = rows.map((s) => `
      <tr>
        <td class="mono">${s.tracking_number}</td>
        <td>${window.Layout.statusBadge(s.status)}</td>
        <td class="text-muted">#${s.customer_id}</td>
        <td class="text-muted">${s.driver_id ? '#' + s.driver_id : '—'}</td>
        <td class="text-muted">${truncate(s.origin_address, 18)} → ${truncate(s.destination_address, 18)}</td>
        <td>${s.weight_kg} kg</td>
        <td class="flex gap-8">
          <a class="btn btn-ghost btn-sm" href="tracking.html?tn=${s.tracking_number}">Track</a>
          ${canManage ? `<button class="btn btn-ghost btn-sm" data-manage="${s.id}">Manage</button>` : ''}
          ${canDelete ? `<button class="btn btn-danger btn-sm" data-delete="${s.id}">Delete</button>` : ''}
        </td>
      </tr>`).join('');

    body.querySelectorAll('[data-manage]').forEach((btn) => btn.addEventListener('click', () => openManage(btn.dataset.manage)));
    body.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => deleteShipment(btn.dataset.delete)));
  }

  function truncate(str, n) { return str && str.length > n ? str.slice(0, n) + '…' : str; }

  async function deleteShipment(id) {
    if (!confirm('Delete this shipment?')) return;
    try {
      await window.Api.shipmentApi.delete(id);
      window.Layout.showToast('Shipment deleted', 'success');
      loadShipments();
    } catch (err) { window.Layout.showToast(err.message, 'error'); }
  }

  function openManage(id) {
    managingId = id;
    document.getElementById('mgForm').reset();
    document.getElementById('mgModalBackdrop').style.display = 'flex';
  }

  // --- New Shipment modal ---
  const shBackdrop = document.getElementById('shModalBackdrop');
  const newBtn = document.getElementById('newShipmentBtn');
  if (canCreate) {
    newBtn.addEventListener('click', async () => {
      try {
        const warehouses = await window.Api.warehouseApi.list();
        const select = document.getElementById('shWarehouseId');
        select.innerHTML = warehouses.length
          ? warehouses.map((w) => `<option value="${w.id}">#${w.id} — ${w.name} (${w.state})</option>`).join('')
          : `<option value="">No warehouses yet — create one first</option>`;
        document.getElementById('shCustomerId').value = session.role === 'customer' ? session.user_id : '';
        shBackdrop.style.display = 'flex';
      } catch (err) { window.Layout.showToast(err.message, 'error'); }
    });
  } else {
    newBtn.style.display = 'none';
  }
  document.getElementById('shModalClose').addEventListener('click', () => shBackdrop.style.display = 'none');
  document.getElementById('shCancelBtn').addEventListener('click', () => shBackdrop.style.display = 'none');
  document.getElementById('shForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('shSubmitBtn');
    btn.disabled = true; btn.textContent = 'Creating…';
    try {
      const result = await window.Api.shipmentApi.create({
        customer_id: parseInt(document.getElementById('shCustomerId').value, 10),
        origin_warehouse_id: parseInt(document.getElementById('shWarehouseId').value, 10),
        origin_address: document.getElementById('shOrigin').value.trim(),
        destination_address: document.getElementById('shDest').value.trim(),
        item_description: document.getElementById('shItemDesc').value.trim(),
        weight_kg: parseFloat(document.getElementById('shWeight').value),
        items: [],
      });
      window.Layout.showToast(`Shipment created — tracking # ${result.tracking_number}`, 'success');
      shBackdrop.style.display = 'none';
      document.getElementById('shForm').reset();
      loadShipments();
    } catch (err) { window.Layout.showToast(err.message, 'error'); }
    finally { btn.disabled = false; btn.textContent = 'Create Shipment'; }
  });

  // --- Manage modal ---
  const mgBackdrop = document.getElementById('mgModalBackdrop');
  document.getElementById('mgModalClose').addEventListener('click', () => mgBackdrop.style.display = 'none');
  document.getElementById('mgCancelBtn').addEventListener('click', () => mgBackdrop.style.display = 'none');
  document.getElementById('mgForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('mgSubmitBtn');
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      const payload = {};
      const driverId = document.getElementById('mgDriverId').value;
      const status = document.getElementById('mgStatus').value;
      if (driverId) payload.driver_id = parseInt(driverId, 10);
      if (status) payload.status = status;
      await window.Api.shipmentApi.update(managingId, payload);
      window.Layout.showToast('Shipment updated', 'success');
      mgBackdrop.style.display = 'none';
      loadShipments();
    } catch (err) { window.Layout.showToast(err.message, 'error'); }
    finally { btn.disabled = false; btn.textContent = 'Save Changes'; }
  });

  loadShipments();
})();
