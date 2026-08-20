import graphviz

dot = graphviz.Digraph('component', format='png')
dot.attr(rankdir='TB', fontname='Helvetica', bgcolor='white')
dot.attr('node', fontname='Helvetica', fontsize='10', shape='box', style='filled,rounded')
dot.attr('edge', fontname='Helvetica', fontsize='9', color='#555555')

COMP = dict(fillcolor='#85BBF0', fontcolor='#08427B', width='2.4', height='0.9')
EXT = dict(fillcolor='#999999', fontcolor='white', width='2.0', height='0.8')
DB = dict(shape='cylinder', style='filled', fillcolor='#438DD5', fontcolor='white')

with dot.subgraph(name='cluster_shipment') as c:
    c.attr(label='Shipment Service  [Container: Python + FastAPI]', style='rounded,dashed', color='#1168BD', fontname='Helvetica-Bold', fontsize='12')
    c.node('router', 'Shipment Router\n[Component: FastAPI APIRouter]\nHTTP routes: POST/GET/PUT/DELETE\n/shipments', **COMP)
    c.node('authdep', 'Auth Dependency\n[Component: FastAPI Depends]\nDecodes & verifies JWT,\nenforces role-based access', **COMP)
    c.node('schemas', 'Pydantic Schemas\n[Component]\nRequest/response validation\n& serialization', **COMP)
    c.node('whclient', 'Warehouse Client\n[Component: httpx AsyncClient]\nCalls Warehouse Service;\nbuilds distributed trace steps', **COMP)
    c.node('orm', 'SQLAlchemy ORM Layer\n[Component]\nShipment & ShipmentItem\nmodels, session mgmt', **COMP)
    c.node('logging', 'Logging Middleware\n[Component]\nStructured request/error\nlogging', **COMP)
    c.node('exch', 'Global Exception Handler\n[Component]\nCatches unhandled errors,\nreturns uniform JSON', **COMP)

    c.edge('router', 'authdep', 'validates request via')
    c.edge('router', 'schemas', 'validates payload via')
    c.edge('router', 'whclient', 'calls (on create)')
    c.edge('router', 'orm', 'reads/writes via')
    c.edge('router', 'logging', 'logs through')
    c.edge('router', 'exch', 'errors caught by')

dot.node('client', 'Web Console\n(Browser)', **EXT)
dot.node('warehousesvc', 'Warehouse Service\n[Container]', **EXT)
dot.node('db', 'Shipment DB\n[SQLite]', **DB)

dot.edge('client', 'router', 'HTTPS + JWT')
dot.edge('whclient', 'warehousesvc', 'GET /warehouses/{id}\n[REST/JSON + JWT]', color='#c0392b', fontcolor='#c0392b')
dot.edge('orm', 'db', 'SQL')

dot.render('component_diagram', cleanup=True)
print('rendered component_diagram.png')
