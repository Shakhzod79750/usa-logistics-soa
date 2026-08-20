// ============================================================================
// Trace Panel — injects a toggleable drawer (mini architecture diagram +
// scrolling call log) into any page that includes this script. Listens for
// `tracehop` events dispatched by js/api.js.
// ============================================================================

const EDGES = [
  ['browser', 'auth-service'],
  ['browser', 'shipment-service'],
  ['browser', 'warehouse-service'],
  ['browser', 'tracking-service'],
  ['shipment-service', 'warehouse-service'],
  ['tracking-service', 'shipment-service'],
];

const NODE_POS = {
  'browser': { x: 190, y: 26, label: 'Browser', lang: 'client' },
  'auth-service': { x: 60, y: 108, label: 'Auth', lang: 'node' },
  'tracking-service': { x: 320, y: 108, label: 'Tracking', lang: 'node' },
  'shipment-service': { x: 120, y: 206, label: 'Shipment', lang: 'py' },
  'warehouse-service': { x: 260, y: 206, label: 'Warehouse', lang: 'py' },
};

function buildDiagramSvg() {
  const edgesSvg = EDGES.map(([a, b]) => {
    const pa = NODE_POS[a], pb = NODE_POS[b];
    const cross = (a !== 'browser' && b !== 'browser');
    return `<line data-edge="${[a, b].sort().join('__')}" x1="${pa.x}" y1="${pa.y}" x2="${pb.x}" y2="${pb.y}"
      class="trace-edge ${cross ? 'trace-edge-cross' : ''}" />`;
  }).join('');

  const nodesSvg = Object.entries(NODE_POS).map(([key, n]) => `
    <g data-node="${key}" class="trace-node lang-${n.lang}">
      <circle cx="${n.x}" cy="${n.y}" r="${key === 'browser' ? 14 : 20}" class="trace-node-circle" />
      <text x="${n.x}" y="${n.y + 34}" class="trace-node-label" text-anchor="middle">${n.label}</text>
    </g>`).join('');

  return `
    <svg viewBox="0 0 380 250" class="trace-diagram" xmlns="http://www.w3.org/2000/svg">
      <style>
        .trace-edge { stroke: #2A3540; stroke-width: 1.5; }
        .trace-edge-cross { stroke-dasharray: 3 3; }
        .trace-edge.flash { stroke: #FF6B35; stroke-width: 2.5; }
        .trace-node-circle { fill: #171F27; stroke: #2A3540; stroke-width: 1.5; transition: stroke 0.15s, fill 0.15s; }
        .trace-node.lang-node .trace-node-circle { stroke: #7A5E12; }
        .trace-node.lang-py .trace-node-circle { stroke: #145E54; }
        .trace-node.lang-client .trace-node-circle { fill: #232D38; stroke: #8A97A3; }
        .trace-node.flash .trace-node-circle { fill: #FF6B35; stroke: #FF6B35; }
        .trace-node-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; fill: #8A97A3; text-transform: uppercase; letter-spacing: 0.04em; }
      </style>
      ${edgesSvg}
      ${nodesSvg}
    </svg>`;
}

function flashAll(selector, ms = 850) {
  document.querySelectorAll(selector).forEach((el) => {
    el.classList.add('flash');
    clearTimeout(el._flashTimer);
    el._flashTimer = setTimeout(() => el.classList.remove('flash'), ms);
  });
}

function formatHopLine(hop) {
  const from = window.SERVICE_META[hop.from_service] || { label: hop.from_service, lang: 'client' };
  const to = window.SERVICE_META[hop.to_service] || { label: hop.to_service, lang: 'client' };
  const langClass = (from.lang === 'node' || to.lang === 'node') && (from.lang === 'py' || to.lang === 'py')
    ? 'hop-cross' : (from.lang === 'node' || to.lang === 'node') ? 'hop-node' : (from.lang === 'py' || to.lang === 'py') ? 'hop-py' : 'hop-browser';

  const time = new Date().toLocaleTimeString([], { hour12: false });
  const statusHtml = hop.status !== undefined && hop.status !== null
    ? `<span class="trace-status ${hop.status >= 500 ? 's5' : hop.status >= 400 ? 's4' : 's2'}">${hop.status === 0 ? 'ERR' : hop.status}</span>`
    : (hop.pending ? '<span class="text-faint">…</span>' : '');

  return `
    <div class="trace-entry ${langClass}">
      <div class="trace-entry-top">
        <span>${time}</span>
        <span>${from.label} → ${to.label} ${statusHtml}</span>
      </div>
      <div class="trace-entry-path">${hop.method} ${hop.path}${hop.durationMs !== undefined ? ` <span class="text-faint">(${hop.durationMs}ms)</span>` : ''}</div>
      ${hop.note ? `<div class="trace-entry-note">${hop.note}</div>` : ''}
    </div>`;
}

function initTracePanel() {
  // toggle button — placed wherever a page has <div id="trace-toggle-slot">
  const slot = document.getElementById('trace-toggle-slot');
  if (slot) {
    slot.innerHTML = `<button class="trace-toggle" id="traceToggleBtn"><span class="pulse-dot"></span> Live Network Trace</button>`;
  }

  const drawer = document.createElement('div');
  drawer.className = 'trace-drawer';
  drawer.id = 'traceDrawer';
  drawer.innerHTML = `
    <div class="trace-drawer-header">
      <span class="trace-drawer-title">Live Network Trace</span>
      <button class="modal-close" id="traceCloseBtn">&times;</button>
    </div>
    <div class="trace-diagram-wrap" id="traceDiagramWrap"></div>
    <div class="flex-between" style="padding: 10px 18px 0;">
      <span class="text-faint" style="font-family:var(--font-mono); font-size:10px; text-transform:uppercase; letter-spacing:.06em;">Call Log</span>
      <button class="btn btn-ghost btn-sm" id="traceClearBtn">Clear</button>
    </div>
    <div class="trace-log" id="traceLog">
      <div class="trace-empty">No calls yet. Interact with the app — every request to every service appears here in real time, including the live inter-service hops (Shipment → Warehouse, Tracking → Shipment).</div>
    </div>`;
  document.body.appendChild(drawer);
  document.getElementById('traceDiagramWrap').innerHTML = buildDiagramSvg();

  const openDrawer = () => { drawer.classList.add('open'); document.body.classList.add('trace-open'); };
  const closeDrawer = () => { drawer.classList.remove('open'); document.body.classList.remove('trace-open'); };
  document.getElementById('traceToggleBtn')?.addEventListener('click', () => {
    drawer.classList.contains('open') ? closeDrawer() : openDrawer();
  });
  document.getElementById('traceCloseBtn')?.addEventListener('click', closeDrawer);
  document.getElementById('traceClearBtn')?.addEventListener('click', () => {
    document.getElementById('traceLog').innerHTML = '<div class="trace-empty">Cleared.</div>';
  });

  let count = 0;
  window.addEventListener('tracehop', (e) => {
    const hop = e.detail;
    count += 1;
    const log = document.getElementById('traceLog');
    if (count === 1) log.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.innerHTML = formatHopLine(hop);
    log.insertBefore(wrapper.firstElementChild, log.firstChild);
    while (log.children.length > 60) log.removeChild(log.lastChild);

    // animate diagram(s) — flashAll hits every instance on the page (drawer + architecture page)
    const a = hop.from_service, b = hop.to_service;
    if (NODE_POS[a] && NODE_POS[b]) {
      flashAll(`[data-edge="${[a, b].sort().join('__')}"]`);
      flashAll(`[data-node="${a}"]`);
      flashAll(`[data-node="${b}"]`);
    } else if (NODE_POS[a]) {
      flashAll(`[data-node="${a}"]`);
    } else if (NODE_POS[b]) {
      flashAll(`[data-node="${b}"]`);
    }

    // auto-open the drawer the first time a cross-service (polyglot) hop occurs
    if (!drawer.dataset.autoOpened && a !== 'browser' && b !== 'browser' && NODE_POS[a] && NODE_POS[b]) {
      drawer.dataset.autoOpened = '1';
      openDrawer();
    }
  });
}

window.TracePanel = { buildDiagramSvg, formatHopLine };
document.addEventListener('DOMContentLoaded', initTracePanel);
