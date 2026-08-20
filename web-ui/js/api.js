// ============================================================================
// API client — every call here is a real browser -> service HTTP request.
// Each request/response is broadcast as a `tracehop` CustomEvent so the
// trace drawer (js/trace-panel.js) can render a live, honest log of what's
// actually happening on the wire — including, for the two endpoints that
// make server-side inter-service calls (shipment create, tracking log),
// the *real* second-hop trace those services report back in their response.
// ============================================================================

const SERVICE_META = {
  'auth-service': { label: 'Auth Service', lang: 'node', base: () => window.APP_CONFIG.AUTH_BASE },
  'shipment-service': { label: 'Shipment Service', lang: 'py', base: () => window.APP_CONFIG.SHIPMENT_BASE },
  'tracking-service': { label: 'Tracking Service', lang: 'node', base: () => window.APP_CONFIG.TRACKING_BASE },
  'warehouse-service': { label: 'Warehouse Service', lang: 'py', base: () => window.APP_CONFIG.WAREHOUSE_BASE },
  'browser': { label: 'Browser', lang: 'client' },
  'shipment-db': { label: 'Shipment DB', lang: 'db' },
  'tracking-db': { label: 'Tracking DB', lang: 'db' },
};
window.SERVICE_META = SERVICE_META;

function emitHop(hop) {
  window.dispatchEvent(new CustomEvent('tracehop', { detail: hop }));
}

function getToken() { return localStorage.getItem('auth_token'); }
function getSession() {
  try { return JSON.parse(localStorage.getItem('auth_session') || 'null'); }
  catch { return null; }
}
function setSession(session) {
  localStorage.setItem('auth_token', session.access_token);
  localStorage.setItem('auth_session', JSON.stringify(session));
}
function clearSession() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_session');
}

class ApiError extends Error {
  constructor(status, message, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

/**
 * @param {string} serviceKey - one of SERVICE_META keys (must have a base())
 * @param {string} method
 * @param {string} path - starts with /
 * @param {object|null} body
 * @param {object} opts - { auth: true|false, browserHopNote }
 */
async function request(serviceKey, method, path, body = null, opts = {}) {
  const svc = SERVICE_META[serviceKey];
  const url = svc.base() + path;
  const headers = { 'Content-Type': 'application/json' };
  const auth = opts.auth !== false;
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const startedAt = performance.now();
  emitHop({
    from_service: 'browser', to_service: serviceKey, method, path,
    note: opts.browserHopNote || 'request sent', pending: true,
  });

  let res, data;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    emitHop({
      from_service: serviceKey, to_service: 'browser', method: 'RESPONSE', path,
      status: 0, note: `network error — is ${svc.label} running on ${svc.base()}?`,
    });
    throw new ApiError(0, `Cannot reach ${svc.label}. Is it running?`, null);
  }

  const durationMs = Math.round(performance.now() - startedAt);
  const contentType = res.headers.get('content-type') || '';
  if (res.status === 204) {
    data = null;
  } else if (contentType.includes('application/json')) {
    data = await res.json().catch(() => null);
  } else {
    data = await res.text().catch(() => null);
  }

  emitHop({
    from_service: serviceKey, to_service: 'browser', method: 'RESPONSE', path,
    status: res.status, durationMs,
    note: res.ok ? 'ok' : (data && data.detail) || (data && data.error && data.error.message) || 'error',
  });

  // If the service itself reported a server-side distributed trace
  // (shipment create / tracking event create), replay those real hops too.
  if (data && Array.isArray(data.trace)) {
    data.trace.forEach((hop) => emitHop({ ...hop, serverReported: true }));
  }

  if (!res.ok) {
    const message = (data && (data.detail || (data.error && data.error.message))) || `${svc.label} returned ${res.status}`;
    throw new ApiError(res.status, message, data);
  }
  return data;
}

// ---------------- Auth Service (Node.js) ----------------
const authApi = {
  register: (payload) => request('auth-service', 'POST', '/auth/register', payload, { auth: false }),
  login: (payload) => request('auth-service', 'POST', '/auth/login', payload, { auth: false }),
  verify: () => request('auth-service', 'GET', '/auth/verify'),
  listUsers: () => request('auth-service', 'GET', '/auth/users'),
  getUser: (id) => request('auth-service', 'GET', `/auth/users/${id}`),
  updateUser: (id, payload) => request('auth-service', 'PUT', `/auth/users/${id}`, payload),
  deleteUser: (id) => request('auth-service', 'DELETE', `/auth/users/${id}`),
  health: () => request('auth-service', 'GET', '/health', null, { auth: false }),
};

// ---------------- Warehouse Service (Python) ----------------
const warehouseApi = {
  create: (payload) => request('warehouse-service', 'POST', '/warehouses', payload),
  list: () => request('warehouse-service', 'GET', '/warehouses'),
  get: (id) => request('warehouse-service', 'GET', `/warehouses/${id}`),
  update: (id, payload) => request('warehouse-service', 'PUT', `/warehouses/${id}`, payload),
  delete: (id) => request('warehouse-service', 'DELETE', `/warehouses/${id}`),
  addInventory: (id, payload) => request('warehouse-service', 'POST', `/warehouses/${id}/inventory`, payload),
  listInventory: (id) => request('warehouse-service', 'GET', `/warehouses/${id}/inventory`),
  updateInventory: (id, itemId, payload) => request('warehouse-service', 'PUT', `/warehouses/${id}/inventory/${itemId}`, payload),
  deleteInventory: (id, itemId) => request('warehouse-service', 'DELETE', `/warehouses/${id}/inventory/${itemId}`),
  health: () => request('warehouse-service', 'GET', '/health', null, { auth: false }),
};

// ---------------- Shipment Service (Python) ----------------
const shipmentApi = {
  create: (payload) => request('shipment-service', 'POST', '/shipments', payload, {
    browserHopNote: 'creating shipment — will trigger a live call to Warehouse Service',
  }),
  list: (statusFilter) => request('shipment-service', 'GET', `/shipments${statusFilter ? `?status_filter=${statusFilter}` : ''}`),
  get: (id) => request('shipment-service', 'GET', `/shipments/${id}`),
  getByTrackingNumber: (tn) => request('shipment-service', 'GET', `/shipments/tracking/${tn}`),
  update: (id, payload) => request('shipment-service', 'PUT', `/shipments/${id}`, payload),
  delete: (id) => request('shipment-service', 'DELETE', `/shipments/${id}`),
  health: () => request('shipment-service', 'GET', '/health', null, { auth: false }),
};

// ---------------- Tracking Service (Node.js) ----------------
const trackingApi = {
  logEvent: (payload) => request('tracking-service', 'POST', '/tracking/events', payload, {
    browserHopNote: 'logging tracking event — will trigger a live call to Shipment Service',
  }),
  getHistory: (tn) => request('tracking-service', 'GET', `/tracking/${tn}`),
  getLatest: (tn) => request('tracking-service', 'GET', `/tracking/${tn}/latest`),
  deleteEvent: (id) => request('tracking-service', 'DELETE', `/tracking/events/${id}`),
  health: () => request('tracking-service', 'GET', '/health', null, { auth: false }),
};

window.Api = { authApi, warehouseApi, shipmentApi, trackingApi, getSession, setSession, clearSession, getToken, ApiError };
