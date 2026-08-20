from seq_helper import draw_sequence

actors = [
    ('driver', 'Driver', '#08427B'),
    ('webui', 'Web Console\n(Browser)', '#666666'),
    ('track', 'Tracking Service\n(Node.js/Express)', '#1168BD'),
    ('ship', 'Shipment Service\n(Python/FastAPI)', '#1168BD'),
    ('trackdb', 'Tracking DB', '#438DD5'),
]

messages = [
    {'from': 'driver', 'to': 'webui', 'label': '1: Mark package "Picked Up"\n+ GPS coordinates'},
    {'from': 'webui', 'to': 'track', 'label': '2: POST /tracking/events\n{tracking_number, event_type, lat, lng} (Bearer JWT)'},
    {'from': 'track', 'to': 'track', 'label': '2a: verify JWT locally,\nrole must be admin/dispatcher/driver'},
    {'from': 'track', 'to': 'ship', 'label': '3: GET /shipments/tracking/{trackingNumber}\n(Bearer JWT)  [Node.js \u2194 Python]'},
    {'from': 'ship', 'to': 'ship', 'label': '3a: verify JWT, look up shipment'},
    {'from': 'ship', 'to': 'track', 'label': '4: 200 OK {shipment}  \u2014 exists', 'style': 'dashed'},
    {'from': 'track', 'to': 'trackdb', 'label': '5: INSERT INTO tracking_events'},
    {'from': 'trackdb', 'to': 'track', 'label': '6: OK', 'style': 'dashed'},
    {'from': 'track', 'to': 'webui', 'label': '7: 201 Created {event, trace[]}', 'style': 'dashed'},
    {'from': 'webui', 'to': 'driver', 'label': '8: Show confirmation + live trace animation', 'style': 'dashed'},
]

draw_sequence(actors, messages,
              'Figure 10 \u2014 Sequence Diagram: Driver Logs a Tracking Event (cross-language REST interoperability)',
              'seq2_log_tracking_event.png', fig_width=12.5)
