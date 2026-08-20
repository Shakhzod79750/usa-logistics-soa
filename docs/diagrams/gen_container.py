import graphviz

dot = graphviz.Digraph('container', format='png')
dot.attr(rankdir='TB', fontname='Helvetica', bgcolor='white', splines='spline')
dot.attr('node', fontname='Helvetica', fontsize='10')
dot.attr('edge', fontname='Helvetica', fontsize='9', color='#555555')

PERSON = dict(shape='box', style='filled,rounded', fillcolor='#08427B', fontcolor='white')
SVC = dict(shape='box', style='filled,rounded', fillcolor='#1168BD', fontcolor='white', width='2.3', height='1.1')
DB = dict(shape='cylinder', style='filled', fillcolor='#438DD5', fontcolor='white', width='1.5', height='0.9')
CLIENT = dict(shape='box', style='filled,rounded', fillcolor='#666666', fontcolor='white')

dot.node('user', 'Users\n[Person]\nCustomer / Dispatcher / Driver / Admin', **PERSON)

with dot.subgraph(name='cluster_system') as c:
    c.attr(label='USA Logistics Tracking System  (SOA \u2014 REST over HTTP/JSON)', style='rounded,dashed', color='#1168BD', fontname='Helvetica-Bold', fontsize='12')

    c.node('webui', 'Web Console\n[Container: Static SPA\nvanilla JS + nginx]\nBrowser-based dispatch\nconsole \u2014 port 3000', **CLIENT)
    c.node('auth', 'Auth Service\n[Container: Node.js + Express]\nJWT auth, RBAC,\nuser CRUD  \u2014 port 4001', **SVC)
    c.node('shipment', 'Shipment Service\n[Container: Python + FastAPI]\nShipment/order CRUD,\ndriver assignment \u2014 port 4002', **SVC)
    c.node('tracking', 'Tracking Service\n[Container: Node.js + Express]\nTracking events,\nlive status \u2014 port 4003', **SVC)
    c.node('warehouse', 'Warehouse Service\n[Container: Python + FastAPI]\nWarehouse & inventory\nCRUD \u2014 port 4004', **SVC)

    c.node('authdb', 'Auth DB\n[SQLite]\nusers', **DB)
    c.node('shipdb', 'Shipment DB\n[SQLite]\nshipments, items', **DB)
    c.node('trackdb', 'Tracking DB\n[SQLite]\ntracking_events', **DB)
    c.node('wardb', 'Warehouse DB\n[SQLite]\nwarehouses, inventory', **DB)

    c.edge('auth', 'authdb', 'reads/writes')
    c.edge('shipment', 'shipdb', 'reads/writes')
    c.edge('tracking', 'trackdb', 'reads/writes')
    c.edge('warehouse', 'wardb', 'reads/writes')

dot.edge('user', 'webui', 'HTTPS (browser)')
dot.edge('webui', 'auth', 'Login / register\n[REST/JSON]')
dot.edge('webui', 'shipment', 'Manage shipments\n[REST/JSON + JWT]')
dot.edge('webui', 'tracking', 'View/log tracking events\n[REST/JSON + JWT]')
dot.edge('webui', 'warehouse', 'Manage inventory\n[REST/JSON + JWT]')

dot.edge('shipment', 'warehouse', 'Validate warehouse & stock\n[REST/JSON + JWT]\n(Python \u2194 Python)', color='#c0392b', fontcolor='#c0392b')
dot.edge('tracking', 'shipment', 'Validate tracking number exists\n[REST/JSON + JWT]\n(Node.js \u2194 Python)', color='#c0392b', fontcolor='#c0392b')

dot.render('container_diagram', cleanup=True)
print('rendered container_diagram.png')
