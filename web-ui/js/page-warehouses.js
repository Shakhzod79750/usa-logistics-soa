(function () {
  const session = window.Layout.initLayout('warehouses');
  if (!session) return;

  const canManage = ['admin', 'dispatcher'].includes(session.role);
  const canDelete = session.role === 'admin';
  let selectedWarehouseId = null;
  let warehousesCache = [];

  async function loadWarehouses() {
    try {
      warehousesCache = await window.Api.warehouseApi.list();
      renderTable();
    } catch (err) {
      document.getElementById('warehouseBody').innerHTML = `<tr class="empty-row"><td colspan="7">Could not load warehouses — ${err.message}</td></tr>`;
    }
  }

  function renderTable() {
    const body = document.getElementById('warehouseBody');
    const q = (document.getElementById('searchInput').value || '').trim().toLowerCase();
    const rows = q
      ? warehousesCache.filter((w) => w.name.toLowerCase().includes(q) || w.address.toLowerCase().includes(q) || w.state.toLowerCase().includes(q))
      : warehousesCache;
    if (warehousesCache.length === 0) {
      body.innerHTML = `<tr class="empty-row"><td colspan="7">No warehouses yet.${canManage ? ' Click "New Warehouse" to add one.' : ''}</td></tr>`;
      return;
    }
    if (rows.length === 0) {
      body.innerHTML = `<tr class="empty-row"><td colspan="7">No warehouses match your search.</td></tr>`;
      return;
    }
    body.innerHTML = rows.map((w) => `
      <tr>
        <td class="mono text-muted">#${w.id}</td>
        <td>${w.name}</td>
        <td class="text-muted">${w.address}</td>
        <td>${w.state}</td>
        <td>${w.capacity_units.toLocaleString()} units</td>
        <td>${(w.inventory || []).length} SKUs</td>
        <td class="flex gap-8">
          <button class="btn btn-ghost btn-sm" data-view="${w.id}">Inventory</button>
          ${canDelete ? `<button class="btn btn-danger btn-sm" data-delete="${w.id}">Delete</button>` : ''}
        </td>
      </tr>`).join('');

    body.querySelectorAll('[data-view]').forEach((btn) => btn.addEventListener('click', () => viewInventory(btn.dataset.view)));
    body.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => deleteWarehouse(btn.dataset.delete)));
  }

  async function viewInventory(id) {
    selectedWarehouseId = id;
    const wh = warehousesCache.find((w) => String(w.id) === String(id));
    document.getElementById('inventorySection').style.display = 'block';
    document.getElementById('inventoryTitle').textContent = `Inventory — ${wh.name} (#${id})`;
    document.getElementById('inventorySection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    try {
      const items = await window.Api.warehouseApi.listInventory(id);
      const body = document.getElementById('inventoryBody');
      if (items.length === 0) {
        body.innerHTML = `<tr class="empty-row"><td colspan="5">No inventory items in this warehouse yet.</td></tr>`;
        return;
      }
      body.innerHTML = items.map((it) => `
        <tr>
          <td class="mono">${it.sku}</td>
          <td>${it.description}</td>
          <td>${it.quantity_on_hand}</td>
          <td>$${Number(it.unit_price).toFixed(2)}</td>
          <td>${canDelete ? `<button class="btn btn-danger btn-sm" data-delitem="${it.id}">Delete</button>` : ''}</td>
        </tr>`).join('');
      body.querySelectorAll('[data-delitem]').forEach((btn) => btn.addEventListener('click', async () => {
        try {
          await window.Api.warehouseApi.deleteInventory(selectedWarehouseId, btn.dataset.delitem);
          window.Layout.showToast('Inventory item deleted', 'success');
          viewInventory(selectedWarehouseId);
        } catch (err) { window.Layout.showToast(err.message, 'error'); }
      }));
    } catch (err) {
      window.Layout.showToast(err.message, 'error');
    }
  }

  async function deleteWarehouse(id) {
    if (!confirm('Delete this warehouse? This cannot be undone.')) return;
    try {
      await window.Api.warehouseApi.delete(id);
      window.Layout.showToast('Warehouse deleted', 'success');
      if (String(selectedWarehouseId) === String(id)) document.getElementById('inventorySection').style.display = 'none';
      loadWarehouses();
    } catch (err) { window.Layout.showToast(err.message, 'error'); }
  }

  // --- New Warehouse modal ---
  const whBackdrop = document.getElementById('whModalBackdrop');
  if (canManage) {
    document.getElementById('newWarehouseBtn').addEventListener('click', () => { whBackdrop.style.display = 'flex'; });
  } else {
    document.getElementById('newWarehouseBtn').style.display = 'none';
  }
  document.getElementById('whModalClose').addEventListener('click', () => whBackdrop.style.display = 'none');
  document.getElementById('whCancelBtn').addEventListener('click', () => whBackdrop.style.display = 'none');
  document.getElementById('whForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('whSubmitBtn');
    btn.disabled = true; btn.textContent = 'Creating…';
    try {
      await window.Api.warehouseApi.create({
        name: document.getElementById('whName').value.trim(),
        address: document.getElementById('whAddress').value.trim(),
        state: document.getElementById('whState').value.trim().toUpperCase(),
        capacity_units: parseInt(document.getElementById('whCapacity').value, 10),
      });
      window.Layout.showToast('Warehouse created', 'success');
      whBackdrop.style.display = 'none';
      document.getElementById('whForm').reset();
      loadWarehouses();
    } catch (err) { window.Layout.showToast(err.message, 'error'); }
    finally { btn.disabled = false; btn.textContent = 'Create Warehouse'; }
  });

  // --- Add Inventory modal ---
  const invBackdrop = document.getElementById('invModalBackdrop');
  document.getElementById('addInventoryBtn').addEventListener('click', () => {
    if (!selectedWarehouseId) return;
    invBackdrop.style.display = 'flex';
  });
  document.getElementById('invModalClose').addEventListener('click', () => invBackdrop.style.display = 'none');
  document.getElementById('invCancelBtn').addEventListener('click', () => invBackdrop.style.display = 'none');
  document.getElementById('invForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('invSubmitBtn');
    btn.disabled = true; btn.textContent = 'Adding…';
    try {
      await window.Api.warehouseApi.addInventory(selectedWarehouseId, {
        sku: document.getElementById('invSku').value.trim(),
        description: document.getElementById('invDesc').value.trim(),
        quantity_on_hand: parseInt(document.getElementById('invQty').value, 10),
        unit_price: parseFloat(document.getElementById('invPrice').value),
      });
      window.Layout.showToast('Inventory item added', 'success');
      invBackdrop.style.display = 'none';
      document.getElementById('invForm').reset();
      viewInventory(selectedWarehouseId);
      loadWarehouses();
    } catch (err) { window.Layout.showToast(err.message, 'error'); }
    finally { btn.disabled = false; btn.textContent = 'Add Item'; }
  });

  loadWarehouses();
  document.getElementById('searchInput').addEventListener('input', renderTable);
})();
