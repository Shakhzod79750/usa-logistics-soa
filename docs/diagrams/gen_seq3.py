from seq_helper import draw_sequence

actors = [
    ('disp', 'Dispatcher', '#08427B'),
    ('webui', 'Web Console\n(Browser)', '#666666'),
    ('ship', 'Shipment Service\n(Python/FastAPI)', '#1168BD'),
    ('wh', 'Warehouse Service\n(Python/FastAPI)', '#B45309'),
]

messages = [
    {'from': 'disp', 'to': 'webui', 'label': '1: Create shipment for a new order'},
    {'from': 'webui', 'to': 'ship', 'label': '2: POST /shipments (Bearer JWT)'},
    {'from': 'ship', 'to': 'wh', 'label': '3: GET /warehouses/{id} (Bearer JWT)', 'color': '#c0392b'},
    {'from': 'wh', 'to': 'wh', 'label': '3a: (fault) service down / timeout'},
    {'from': 'wh', 'to': 'ship', 'label': '4: connection refused / timeout', 'style': 'dashed', 'color': '#c0392b'},
    {'from': 'ship', 'to': 'ship', 'label': '4a: catch httpx.RequestError,\nmap to HTTP 503'},
    {'from': 'ship', 'to': 'webui', 'label': '5: 503 Service Unavailable\n{"detail":"Warehouse Service is currently unavailable"}',
     'style': 'dashed', 'color': '#c0392b'},
    {'from': 'webui', 'to': 'disp', 'label': '6: Show retry-able error (no partial shipment created)', 'style': 'dashed'},
    {'from': 'disp', 'to': 'webui', 'label': '7: Retries after Warehouse Service recovers'},
    {'from': 'webui', 'to': 'ship', 'label': '8: POST /shipments (retry)'},
    {'from': 'ship', 'to': 'wh', 'label': '9: GET /warehouses/{id} \u2192 200 OK', 'style': 'dashed'},
    {'from': 'ship', 'to': 'webui', 'label': '10: 201 Created {shipment}', 'style': 'dashed'},
]

draw_sequence(actors, messages,
              'Figure 11 \u2014 Sequence Diagram: Shipment Creation Under Warehouse Service Failure (fault tolerance)',
              'seq3_warehouse_failure.png', fig_width=12.5)
