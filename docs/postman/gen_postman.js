const fs = require('fs');
const path = require('path');

function req(name, method, url, opts = {}) {
  const item = { name, request: { method, header: opts.headers || [], url: { raw: url } }, response: [] };
  if (opts.auth === false) item.request.auth = { type: 'noauth' };
  if (opts.body) {
    item.request.header.push({ key: 'Content-Type', value: 'application/json' });
    item.request.body = { mode: 'raw', raw: JSON.stringify(opts.body, null, 2), options: { raw: { language: 'json' } } };
  }
  if (opts.bearer) item.request.auth = { type: 'bearer', bearer: [{ key: 'token', value: `{{${opts.bearer}}}`, type: 'string' }] };
  if (opts.test) {
    const wrapped = '(function () {\n' + opts.test + '\n})();';
    item.event = [{ listen: 'test', script: { exec: wrapped.split('\n'), type: 'text/javascript' } }];
  }
  if (opts.description) item.request.description = opts.description;
  return item;
}

function reqUrl(name, method, rawUrl, opts = {}) {
  const it = req(name, method, rawUrl, opts);
  const parts = rawUrl.split('?');
  const pathPart = parts[0];
  const query = parts[1];
  const hostVarMatch = pathPart.match(/^\{\{([a-z_]+)\}\}(.*)$/);
  it.request.url = { raw: rawUrl, host: [`{{${hostVarMatch[1]}}}`], path: hostVarMatch[2].split('/').filter(Boolean) };
  if (query) it.request.url.query = query.split('&').map((kv) => { const [key, value] = kv.split('='); return { key, value }; });
  return it;
}

// ---------- Web UI ----------
const webUiFolder = {
  name: '0. Web UI (Static Console — :3000)',
  item: [
    reqUrl('Login Page Reachable', 'GET', '{{webui_base}}/login.html', {
      auth: false,
      description: 'Confirms the nginx-served frontend is up. This is the actual browser UI at http://localhost:3000 — open it in a browser rather than Postman to use it interactively.',
    }),
  ],
};

// ---------- Auth Service ----------
const authFolder = {
  name: '1. Auth Service (Node.js/Express — :4001)',
  item: [
    reqUrl('Health Check', 'GET', '{{auth_base}}/health', { auth: false }),
    reqUrl('Register Admin', 'POST', '{{auth_base}}/auth/register', {
      auth: false, body: { full_name: 'Alice Admin', email: 'admin@usa-logistics.com', password: 'AdminPass123!', role: 'admin' },
      test: 'const data = pm.response.json();\npm.collectionVariables.set("admin_id", data.id);',
    }),
    reqUrl('Register Dispatcher', 'POST', '{{auth_base}}/auth/register', {
      auth: false, body: { full_name: 'Dan Dispatcher', email: 'dispatcher@usa-logistics.com', password: 'DispatchPass123!', role: 'dispatcher' },
      test: 'const data = pm.response.json();\npm.collectionVariables.set("dispatcher_id", data.id);',
    }),
    reqUrl('Register Driver', 'POST', '{{auth_base}}/auth/register', {
      auth: false, body: { full_name: 'Dave Driver', email: 'driver@usa-logistics.com', password: 'DriverPass123!', role: 'driver' },
      test: 'const data = pm.response.json();\npm.collectionVariables.set("driver_id", data.id);',
    }),
    reqUrl('Register Customer', 'POST', '{{auth_base}}/auth/register', {
      auth: false, body: { full_name: 'Cathy Customer', email: 'customer@usa-logistics.com', password: 'CustomerPass123!', role: 'customer' },
      test: 'const data = pm.response.json();\npm.collectionVariables.set("customer_id", data.id);',
    }),
    reqUrl('Login — Admin', 'POST', '{{auth_base}}/auth/login', {
      auth: false, body: { email: 'admin@usa-logistics.com', password: 'AdminPass123!' },
      test: 'const data = pm.response.json();\npm.test("Status is 200", () => pm.response.to.have.status(200));\npm.collectionVariables.set("admin_token", data.access_token);',
    }),
    reqUrl('Login — Dispatcher', 'POST', '{{auth_base}}/auth/login', {
      auth: false, body: { email: 'dispatcher@usa-logistics.com', password: 'DispatchPass123!' },
      test: 'const data = pm.response.json();\npm.test("Status is 200", () => pm.response.to.have.status(200));\npm.collectionVariables.set("dispatcher_token", data.access_token);',
    }),
    reqUrl('Login — Driver', 'POST', '{{auth_base}}/auth/login', {
      auth: false, body: { email: 'driver@usa-logistics.com', password: 'DriverPass123!' },
      test: 'const data = pm.response.json();\npm.test("Status is 200", () => pm.response.to.have.status(200));\npm.collectionVariables.set("driver_token", data.access_token);',
    }),
    reqUrl('Login — Customer', 'POST', '{{auth_base}}/auth/login', {
      auth: false, body: { email: 'customer@usa-logistics.com', password: 'CustomerPass123!' },
      test: 'const data = pm.response.json();\npm.test("Status is 200", () => pm.response.to.have.status(200));\npm.collectionVariables.set("customer_token", data.access_token);',
    }),
    reqUrl('Verify Token', 'GET', '{{auth_base}}/auth/verify', { bearer: 'admin_token' }),
    reqUrl('List Users (admin)', 'GET', '{{auth_base}}/auth/users', { bearer: 'admin_token' }),
    reqUrl('Get User By Id', 'GET', '{{auth_base}}/auth/users/{{admin_id}}', { bearer: 'admin_token' }),
    reqUrl('Update User (admin)', 'PUT', '{{auth_base}}/auth/users/{{admin_id}}', { bearer: 'admin_token', body: { full_name: 'Alice A. Admin' } }),
    reqUrl('Delete User (admin)', 'DELETE', '{{auth_base}}/auth/users/99', {
      bearer: 'admin_token',
      description: 'Intentionally targets a non-existent ID (99) to demonstrate correct 404 error handling.',
    }),
  ],
};

// ---------- Warehouse Service ----------
const warehouseFolder = {
  name: '2. Warehouse Service (Python/FastAPI — :4004)',
  item: [
    reqUrl('Health Check', 'GET', '{{warehouse_base}}/health', { auth: false }),
    reqUrl('Create Warehouse', 'POST', '{{warehouse_base}}/warehouses', {
      bearer: 'dispatcher_token', body: { name: 'Phoenix Distribution Center', address: '100 Logistics Way', state: 'AZ', capacity_units: 5000 },
      test: 'const data = pm.response.json();\npm.test("Status is 201", () => pm.response.to.have.status(201));\npm.collectionVariables.set("warehouse_id", data.id);',
    }),
    reqUrl('List Warehouses', 'GET', '{{warehouse_base}}/warehouses', { bearer: 'dispatcher_token' }),
    reqUrl('Get Warehouse By Id', 'GET', '{{warehouse_base}}/warehouses/{{warehouse_id}}', { bearer: 'dispatcher_token' }),
    reqUrl('Update Warehouse', 'PUT', '{{warehouse_base}}/warehouses/{{warehouse_id}}', { bearer: 'dispatcher_token', body: { capacity_units: 6000 } }),
    reqUrl('Add Inventory Item', 'POST', '{{warehouse_base}}/warehouses/{{warehouse_id}}/inventory', {
      bearer: 'dispatcher_token', body: { sku: 'SKU-1001', description: '55-inch LED TV', quantity_on_hand: 40, unit_price: 349.99 },
      test: 'const data = pm.response.json();\npm.test("Status is 201", () => pm.response.to.have.status(201));\npm.collectionVariables.set("inventory_item_id", data.id);',
    }),
    reqUrl('List Inventory', 'GET', '{{warehouse_base}}/warehouses/{{warehouse_id}}/inventory', { bearer: 'dispatcher_token' }),
    reqUrl('Update Inventory Item', 'PUT', '{{warehouse_base}}/warehouses/{{warehouse_id}}/inventory/{{inventory_item_id}}', { bearer: 'dispatcher_token', body: { quantity_on_hand: 35 } }),
    reqUrl('Delete Inventory Item', 'DELETE', '{{warehouse_base}}/warehouses/{{warehouse_id}}/inventory/{{inventory_item_id}}', { bearer: 'admin_token' }),
  ],
};

// ---------- Shipment Service ----------
const shipmentFolder = {
  name: '3. Shipment Service (Python/FastAPI — :4002)',
  item: [
    reqUrl('Health Check', 'GET', '{{shipment_base}}/health', { auth: false }),
    reqUrl('Create Shipment', 'POST', '{{shipment_base}}/shipments', {
      bearer: 'dispatcher_token',
      body: {
        customer_id: '{{customer_id}}', origin_warehouse_id: '{{warehouse_id}}',
        origin_address: '100 Logistics Way, Phoenix, AZ', destination_address: '22 Market St, Austin, TX',
        item_description: 'Electronics — 1x 55-inch LED TV', weight_kg: 12.5, items: [{ sku: 'SKU-1001', quantity: 1 }],
      },
      description: 'Demonstrates the Shipment -> Warehouse Service interoperability call, and the response now includes a `trace` array of the real inter-service calls made (also rendered live in the web-ui\u2019s Network Trace panel).',
      test:
        'const data = pm.response.json();\n' +
        'pm.test("Status is 201", () => pm.response.to.have.status(201));\n' +
        'pm.test("Has tracking_number", () => pm.expect(data.tracking_number).to.be.a("string"));\n' +
        'pm.test("Has trace array", () => pm.expect(data.trace).to.be.an("array"));\n' +
        'pm.collectionVariables.set("shipment_id", data.id);\n' +
        'pm.collectionVariables.set("tracking_number", data.tracking_number);',
    }),
    reqUrl('List Shipments', 'GET', '{{shipment_base}}/shipments', { bearer: 'dispatcher_token' }),
    reqUrl('List Shipments — filter by status', 'GET', '{{shipment_base}}/shipments?status_filter=CREATED', { bearer: 'dispatcher_token' }),
    reqUrl('Get Shipment By Id', 'GET', '{{shipment_base}}/shipments/{{shipment_id}}', { bearer: 'customer_token' }),
    reqUrl('Get Shipment By Tracking Number', 'GET', '{{shipment_base}}/shipments/tracking/{{tracking_number}}', {
      bearer: 'driver_token',
      description: 'This exact call is what the Tracking Service (Node.js) makes to the Shipment Service (Python) to validate a tracking number before logging an event.',
    }),
    reqUrl('Assign Driver / Update Status', 'PUT', '{{shipment_base}}/shipments/{{shipment_id}}', { bearer: 'dispatcher_token', body: { driver_id: '{{driver_id}}', status: 'ASSIGNED' } }),
  ],
};

// ---------- Tracking Service ----------
const trackingFolder = {
  name: '4. Tracking Service (Node.js/Express — :4003)',
  item: [
    reqUrl('Health Check', 'GET', '{{tracking_base}}/health', { auth: false }),
    reqUrl('Log Event — Picked Up', 'POST', '{{tracking_base}}/tracking/events', {
      bearer: 'driver_token',
      body: { tracking_number: '{{tracking_number}}', event_type: 'PICKED_UP', latitude: 33.4484, longitude: -112.074, location_label: 'Phoenix Distribution Center', notes: 'Package picked up from warehouse dock 3' },
      description: 'Demonstrates the Tracking -> Shipment Service interoperability call (Node.js calling Python). Response includes a `trace` array of the real hop.',
      test:
        'const data = pm.response.json();\n' +
        'pm.test("Status is 201", () => pm.response.to.have.status(201));\n' +
        'pm.test("Has trace array", () => pm.expect(data.trace).to.be.an("array"));',
    }),
    reqUrl('Log Event — In Transit', 'POST', '{{tracking_base}}/tracking/events', { bearer: 'driver_token', body: { tracking_number: '{{tracking_number}}', event_type: 'IN_TRANSIT', latitude: 34.0489, longitude: -111.0937, location_label: 'I-17 Northbound' } }),
    reqUrl('Log Event — Out For Delivery', 'POST', '{{tracking_base}}/tracking/events', { bearer: 'driver_token', body: { tracking_number: '{{tracking_number}}', event_type: 'OUT_FOR_DELIVERY', latitude: 30.2672, longitude: -97.7431, location_label: 'Austin, TX Hub' } }),
    reqUrl('Log Event — Delivered', 'POST', '{{tracking_base}}/tracking/events', { bearer: 'driver_token', body: { tracking_number: '{{tracking_number}}', event_type: 'DELIVERED', location_label: '22 Market St, Austin, TX', notes: 'Left at front door, signed by resident' } }),
    reqUrl('Get Full Tracking History', 'GET', '{{tracking_base}}/tracking/{{tracking_number}}', { bearer: 'customer_token' }),
    reqUrl('Get Latest Tracking Event', 'GET', '{{tracking_base}}/tracking/{{tracking_number}}/latest', { bearer: 'customer_token' }),
    reqUrl('Delete Tracking Event (admin)', 'DELETE', '{{tracking_base}}/tracking/events/1', { bearer: 'admin_token' }),
  ],
};

// ---------- Cleanup ----------
const cleanupFolder = {
  name: '5. Cleanup',
  item: [
    reqUrl('Delete Shipment (admin)', 'DELETE', '{{shipment_base}}/shipments/{{shipment_id}}', { bearer: 'admin_token', description: 'Run after Tracking folder — tracking events reference this shipment.' }),
    reqUrl('Delete Warehouse (admin)', 'DELETE', '{{warehouse_base}}/warehouses/{{warehouse_id}}', { bearer: 'admin_token', description: 'Run last — Shipment folder depends on this warehouse existing.' }),
  ],
};

const collection = {
  info: {
    _postman_id: 'a1b2c3d4-usa-logistics-soa-0002',
    name: 'USA Logistics & Shipment Tracking System (SOA)',
    description:
      'SFWE415 Software Architecture — SOA project, now including the web-ui console (:3000).\n\n' +
      'Run folders top-to-bottom (0 -> 1 -> 2 -> 3 -> 4 -> 5): each folder\u2019s requests save tokens/IDs ' +
      'into collection variables that later folders reuse.\n\n' +
      'Folder 0 just confirms the web-ui static server is reachable — the actual UI is meant to be used ' +
      'in a browser at http://localhost:3000, not through Postman. Folders 3 and 4\u2019s create/log-event ' +
      'requests now assert a `trace` array is present in the response, proving the real inter-service ' +
      'calls (Shipment -> Warehouse, Tracking -> Shipment) that also power the web-ui\u2019s live Network Trace panel.\n\n' +
      'Import the companion environment file or edit the collection variables below if your services run on non-default ports/hosts.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  item: [webUiFolder, authFolder, warehouseFolder, shipmentFolder, trackingFolder, cleanupFolder],
  variable: [
    { key: 'webui_base', value: 'http://localhost:3000', type: 'string' },
    { key: 'auth_base', value: 'http://localhost:4001', type: 'string' },
    { key: 'shipment_base', value: 'http://localhost:4002', type: 'string' },
    { key: 'tracking_base', value: 'http://localhost:4003', type: 'string' },
    { key: 'warehouse_base', value: 'http://localhost:4004', type: 'string' },
    { key: 'admin_token', value: '', type: 'string' },
    { key: 'dispatcher_token', value: '', type: 'string' },
    { key: 'driver_token', value: '', type: 'string' },
    { key: 'customer_token', value: '', type: 'string' },
    { key: 'admin_id', value: '1', type: 'string' },
    { key: 'dispatcher_id', value: '2', type: 'string' },
    { key: 'driver_id', value: '3', type: 'string' },
    { key: 'customer_id', value: '4', type: 'string' },
    { key: 'warehouse_id', value: '1', type: 'string' },
    { key: 'inventory_item_id', value: '1', type: 'string' },
    { key: 'shipment_id', value: '1', type: 'string' },
    { key: 'tracking_number', value: '', type: 'string' },
  ],
};

const environment = {
  id: 'e1e2e3e4-usa-logistics-env-0002',
  name: 'USA Logistics SOA — Local',
  values: [
    { key: 'webui_base', value: 'http://localhost:3000', type: 'default', enabled: true },
    { key: 'auth_base', value: 'http://localhost:4001', type: 'default', enabled: true },
    { key: 'shipment_base', value: 'http://localhost:4002', type: 'default', enabled: true },
    { key: 'tracking_base', value: 'http://localhost:4003', type: 'default', enabled: true },
    { key: 'warehouse_base', value: 'http://localhost:4004', type: 'default', enabled: true },
  ],
  _postman_variable_scope: 'environment',
};

fs.writeFileSync(path.join(__dirname, 'USA_Logistics_SOA.postman_collection.json'), JSON.stringify(collection, null, 2));
fs.writeFileSync(path.join(__dirname, 'USA_Logistics_SOA.postman_environment.json'), JSON.stringify(environment, null, 2));
console.log('Postman collection + environment written.');
