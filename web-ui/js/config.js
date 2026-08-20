// Base URLs for the four backend services. Override via localStorage if the
// person's Docker/host setup uses different ports.
window.APP_CONFIG = {
  AUTH_BASE: localStorage.getItem('cfg_auth_base') || 'http://localhost:4001',
  SHIPMENT_BASE: localStorage.getItem('cfg_shipment_base') || 'http://localhost:4002',
  TRACKING_BASE: localStorage.getItem('cfg_tracking_base') || 'http://localhost:4003',
  WAREHOUSE_BASE: localStorage.getItem('cfg_warehouse_base') || 'http://localhost:4004',
};
