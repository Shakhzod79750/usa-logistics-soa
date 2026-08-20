from seq_helper import draw_sequence

actors = [
    ('cust', 'Customer', '#08427B'),
    ('webui', 'Web Console\n(Browser)', '#666666'),
    ('auth', 'Auth Service\n(Node.js)', '#1168BD'),
    ('ship', 'Shipment Service\n(Python/FastAPI)', '#1168BD'),
    ('wh', 'Warehouse Service\n(Python/FastAPI)', '#1168BD'),
    ('shipdb', 'Shipment DB', '#438DD5'),
]

messages = [
    {'from': 'cust', 'to': 'webui', 'label': '1: Enter login credentials'},
    {'from': 'webui', 'to': 'auth', 'label': '2: POST /auth/login {email, password}'},
    {'from': 'auth', 'to': 'auth', 'label': '2a: verify password, sign JWT\n(sub as string per RFC 7519)'},
    {'from': 'auth', 'to': 'webui', 'label': '3: 200 OK {access_token}', 'style': 'dashed'},
    {'from': 'cust', 'to': 'webui', 'label': '4: Submit new shipment form'},
    {'from': 'webui', 'to': 'ship', 'label': '5: POST /shipments  (Bearer JWT)'},
    {'from': 'ship', 'to': 'ship', 'label': '5a: verify JWT locally, check role\nin {admin,dispatcher,customer}'},
    {'from': 'ship', 'to': 'wh', 'label': '6: GET /warehouses/{id} (Bearer JWT)'},
    {'from': 'wh', 'to': 'wh', 'label': '6a: verify JWT, lookup warehouse'},
    {'from': 'wh', 'to': 'ship', 'label': '7: 200 OK {warehouse}', 'style': 'dashed'},
    {'from': 'ship', 'to': 'shipdb', 'label': '8: INSERT shipment + items'},
    {'from': 'shipdb', 'to': 'ship', 'label': '9: OK', 'style': 'dashed'},
    {'from': 'ship', 'to': 'webui', 'label': '10: 201 Created {shipment, tracking_number, trace[]}', 'style': 'dashed'},
    {'from': 'webui', 'to': 'cust', 'label': '11: Display confirmation + live trace animation', 'style': 'dashed'},
]

draw_sequence(actors, messages, 'Figure 9 \u2014 Sequence Diagram: Customer Creates a Shipment (SOA, synchronous REST)',
              'seq1_create_shipment.png', fig_width=13)
