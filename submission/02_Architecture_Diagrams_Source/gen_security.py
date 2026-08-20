import graphviz

dot = graphviz.Digraph('security', format='png')
dot.attr(rankdir='TB', fontname='Helvetica', bgcolor='white')
dot.attr('node', fontname='Helvetica', fontsize='10', shape='box', style='filled,rounded')
dot.attr('edge', fontname='Helvetica', fontsize='9', color='#555555')

ACTOR = dict(fillcolor='#08427B', fontcolor='white')
SVC = dict(fillcolor='#1168BD', fontcolor='white', width='2.2', height='0.85')
DB = dict(shape='cylinder', style='filled', fillcolor='#438DD5', fontcolor='white')
CTRL = dict(shape='note', style='filled', fillcolor='#FFF3CD', fontcolor='#664D03', fontsize='9')

dot.node('user', 'Untrusted User\n(Browser)', **ACTOR)

with dot.subgraph(name='cluster_internet') as tb0:
    tb0.attr(label='TRUST BOUNDARY 1 \u2014 Public Internet / Untrusted Zone', style='rounded,dashed', color='#c0392b', fontname='Helvetica-Bold', fontsize='11', fontcolor='#c0392b')
    tb0.node('user')

with dot.subgraph(name='cluster_docker') as tb1:
    tb1.attr(label='TRUST BOUNDARY 2 \u2014 Docker Host / Application Network (logistics-net)', style='rounded,dashed', color='#B45309', fontname='Helvetica-Bold', fontsize='11', fontcolor='#B45309')

    tb1.node('webui', 'Web Console\n(nginx, static assets only\u2014\nno server-side secrets)', fillcolor='#666666', fontcolor='white')

    tb1.node('authctrl', 'Control: bcrypt password hashing\n+ JWT issuance (HS256)', **CTRL)
    tb1.node('auth', 'Auth Service', **SVC)

    with dot.subgraph(name='cluster_svc_boundary') as tb2:
        tb2.attr(label='TRUST BOUNDARY 3 \u2014 Per-Service Authorization Boundary\n(each service independently verifies JWT + role)', style='rounded,dashed', color='#1168BD', fontsize='10', fontcolor='#1168BD')
        tb2.node('shipctrl', 'Control: JWT signature + role\nverified locally (no shared session state)', **CTRL)
        tb2.node('shipment', 'Shipment Service', **SVC)
        tb2.node('warehouse', 'Warehouse Service', **SVC)
        tb2.node('tracking', 'Tracking Service', **SVC)

    with dot.subgraph(name='cluster_data_boundary') as tb3:
        tb3.attr(label='TRUST BOUNDARY 4 \u2014 Data Boundary (database-per-service,\nno cross-service DB access)', style='rounded,dashed', color='#2E7D32', fontsize='10', fontcolor='#2E7D32')
        tb3.node('authdb', 'Auth DB', **DB)
        tb3.node('shipdb', 'Shipment DB', **DB)
        tb3.node('wardb', 'Warehouse DB', **DB)
        tb3.node('trackdb', 'Tracking DB', **DB)

dot.edge('user', 'webui', 'HTTPS\n(TLS in production)')
dot.edge('webui', 'auth', 'credentials\n(HTTPS)')
dot.edge('auth', 'authctrl', style='dotted', arrowhead='none')
dot.edge('webui', 'shipment', 'Bearer JWT')
dot.edge('webui', 'warehouse', 'Bearer JWT')
dot.edge('webui', 'tracking', 'Bearer JWT')
dot.edge('shipment', 'shipctrl', style='dotted', arrowhead='none')
dot.edge('shipment', 'warehouse', 'Bearer JWT (service-to-service)', color='#c0392b', fontcolor='#c0392b')
dot.edge('tracking', 'shipment', 'Bearer JWT (service-to-service)', color='#c0392b', fontcolor='#c0392b')
dot.edge('auth', 'authdb')
dot.edge('shipment', 'shipdb')
dot.edge('warehouse', 'wardb')
dot.edge('tracking', 'trackdb')

dot.render('security_diagram', cleanup=True)
print('rendered security_diagram.png')
