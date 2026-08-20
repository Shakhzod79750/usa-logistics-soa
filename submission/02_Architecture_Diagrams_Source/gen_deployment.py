import graphviz

dot = graphviz.Digraph('deployment', format='png')
dot.attr(rankdir='TB', fontname='Helvetica', bgcolor='white')
dot.attr('node', fontname='Helvetica', fontsize='9', shape='box', style='filled,rounded')
dot.attr('edge', fontname='Helvetica', fontsize='8', color='#555555')

CONTAINER = dict(fillcolor='#1168BD', fontcolor='white', width='2.1', height='0.8')
VOL = dict(shape='cylinder', style='filled', fillcolor='#438DD5', fontcolor='white', width='1.3', height='0.7')
CLIENT = dict(fillcolor='#999999', fontcolor='white')
WEBC = dict(fillcolor='#666666', fontcolor='white', width='2.1', height='0.8')

dot.node('devbox', 'Client Machine\n[Deployment Node]\nWeb Browser', **CLIENT)

with dot.subgraph(name='cluster_host') as host:
    host.attr(label='Docker Host  (docker-compose)', style='rounded', color='#08427B', fontname='Helvetica-Bold', fontsize='12')

    with host.subgraph(name='cluster_net') as net:
        net.attr(label='logistics-net  [Docker bridge network]', style='rounded,dashed', color='#666666', fontsize='10')

        with net.subgraph(name='cluster_webc') as c0:
            c0.attr(label='web-ui container\nnginx:alpine', style='rounded', color='#666666', fontsize='9')
            c0.node('webproc', 'nginx (static)\n:80 \u2192 host:3000', **WEBC)
        with net.subgraph(name='cluster_authc') as c1:
            c1.attr(label='auth-service container\nnode:20-slim', style='rounded', color='#1168BD', fontsize='9')
            c1.node('authproc', 'Express App\n:4001', **CONTAINER)
        with net.subgraph(name='cluster_shipc') as c2:
            c2.attr(label='shipment-service container\npython:3.11-slim', style='rounded', color='#1168BD', fontsize='9')
            c2.node('shipproc', 'Uvicorn/FastAPI\n:4002', **CONTAINER)
        with net.subgraph(name='cluster_trackc') as c3:
            c3.attr(label='tracking-service container\nnode:20-slim', style='rounded', color='#1168BD', fontsize='9')
            c3.node('trackproc', 'Express App\n:4003', **CONTAINER)
        with net.subgraph(name='cluster_warc') as c4:
            c4.attr(label='warehouse-service container\npython:3.11-slim', style='rounded', color='#1168BD', fontsize='9')
            c4.node('warproc', 'Uvicorn/FastAPI\n:4004', **CONTAINER)

        net.node('authvol', 'auth_data\nvolume', **VOL)
        net.node('shipvol', 'shipment_data\nvolume', **VOL)
        net.node('trackvol', 'tracking_data\nvolume', **VOL)
        net.node('warvol', 'warehouse_data\nvolume', **VOL)

        net.edge('authproc', 'authvol')
        net.edge('shipproc', 'shipvol')
        net.edge('trackproc', 'trackvol')
        net.edge('warproc', 'warvol')

        net.edge('webproc', 'authproc', 'REST/JSON (browser-initiated,\nproxied through client)', style='dotted', color='#666666')
        net.edge('shipproc', 'warproc', 'REST/JSON\n(internal DNS:\nwarehouse-service:4004)', color='#c0392b', fontcolor='#c0392b')
        net.edge('trackproc', 'shipproc', 'REST/JSON\n(internal DNS:\nshipment-service:4002)', color='#c0392b', fontcolor='#c0392b')

dot.edge('devbox', 'webproc', 'HTTPS\nhost:3000', style='dashed')
dot.edge('devbox', 'authproc', 'HTTPS\nhost:4001', style='dashed')
dot.edge('devbox', 'shipproc', 'HTTPS\nhost:4002', style='dashed')
dot.edge('devbox', 'trackproc', 'HTTPS\nhost:4003', style='dashed')
dot.edge('devbox', 'warproc', 'HTTPS\nhost:4004', style='dashed')

dot.render('deployment_diagram', cleanup=True)
print('rendered deployment_diagram.png')
