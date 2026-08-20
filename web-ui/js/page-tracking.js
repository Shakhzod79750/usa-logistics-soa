(function () {
  const session = window.Layout.initLayout('tracking');
  if (!session) return;

  const canLog = ['admin', 'dispatcher', 'driver'].includes(session.role);
  if (!canLog) {
    document.getElementById('eventForm').innerHTML = '<p class="text-faint" style="font-size:12.5px;">Logging events requires admin, dispatcher, or driver role.</p>';
  }

  const urlParams = new URLSearchParams(window.location.search);
  const presetTn = urlParams.get('tn');
  if (presetTn) document.getElementById('tnInput').value = presetTn;

  async function loadHistory() {
    const tn = document.getElementById('tnInput').value.trim();
    if (!tn) { window.Layout.showToast('Enter a tracking number', 'error'); return; }
    const list = document.getElementById('timelineList');
    list.innerHTML = '<li><span class="text-faint" style="font-size:12.5px;">Loading…</span></li>';
    try {
      const events = await window.Api.trackingApi.getHistory(tn);
      if (events.length === 0) {
        list.innerHTML = '<li><span class="text-faint" style="font-size:12.5px;">No tracking events yet for this shipment.</span></li>';
        return;
      }
      list.innerHTML = events.map((ev) => `
        <li>
          <div class="timeline-type">${ev.event_type.replace(/_/g, ' ')}</div>
          <div class="timeline-meta">${window.Layout.fmtDate(ev.created_at)}${ev.location_label ? ' · ' + ev.location_label : ''}${(ev.latitude && ev.longitude) ? ` · ${ev.latitude}, ${ev.longitude}` : ''}</div>
          ${ev.notes ? `<div class="timeline-note">${ev.notes}</div>` : ''}
        </li>`).join('');
    } catch (err) {
      list.innerHTML = `<li><span class="field-error">${err.message}</span></li>`;
    }
  }

  document.getElementById('lookupBtn').addEventListener('click', loadHistory);
  document.getElementById('tnInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') loadHistory(); });

  document.getElementById('eventForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const tn = document.getElementById('tnInput').value.trim();
    if (!tn) { window.Layout.showToast('Enter a tracking number first', 'error'); return; }
    const btn = document.getElementById('evSubmitBtn');
    btn.disabled = true; btn.textContent = 'Logging…';
    try {
      const lat = document.getElementById('evLat').value;
      const lng = document.getElementById('evLng').value;
      await window.Api.trackingApi.logEvent({
        tracking_number: tn,
        event_type: document.getElementById('evType').value,
        location_label: document.getElementById('evLocation').value.trim() || undefined,
        latitude: lat ? parseFloat(lat) : undefined,
        longitude: lng ? parseFloat(lng) : undefined,
        notes: document.getElementById('evNotes').value.trim() || undefined,
      });
      window.Layout.showToast('Tracking event logged', 'success');
      document.getElementById('evNotes').value = '';
      loadHistory();
    } catch (err) {
      window.Layout.showToast(err.message, 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Log Event';
    }
  });

  if (presetTn) loadHistory();
})();
