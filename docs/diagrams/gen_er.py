import graphviz

dot = graphviz.Digraph('er', format='png')
dot.attr(rankdir='LR', fontname='Helvetica', bgcolor='white')
dot.attr('node', fontname='Courier', fontsize='9', shape='plaintext')
dot.attr('edge', fontname='Helvetica', fontsize='9', color='#555555')

def entity(name, title, pk_fields, other_fields, color):
    rows = ''.join(f'<TR><TD ALIGN="LEFT" BGCOLOR="white"><B>{f}</B> (PK)</TD></TR>' for f in pk_fields) + \
           ''.join(f'<TR><TD ALIGN="LEFT" BGCOLOR="white">{f}</TD></TR>' for f in other_fields)
    label = f'''<
    <TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" CELLPADDING="4">
      <TR><TD BGCOLOR="{color}"><FONT COLOR="white"><B>{title}</B></FONT></TD></TR>
      {rows}
    </TABLE>>'''
    dot.node(name, label)

entity('users', 'users  (Auth DB)', ['id'], ['full_name', 'email (UNIQUE)', 'password_hash', 'role', 'created_at', 'updated_at'], '#08427B')
entity('warehouses', 'warehouses  (Warehouse DB)', ['id'], ['name', 'address', 'state', 'capacity_units'], '#2E7D32')
entity('inventory_items', 'inventory_items  (Warehouse DB)', ['id'], ['warehouse_id (FK)', 'sku', 'description', 'quantity_on_hand', 'unit_price'], '#2E7D32')
entity('shipments', 'shipments  (Shipment DB)', ['id'],
       ['tracking_number (UNIQUE)', 'customer_id (ref. users.id)', 'driver_id (ref. users.id)',
        'origin_warehouse_id (ref. warehouses.id)', 'origin_address', 'destination_address',
        'item_description', 'weight_kg', 'status', 'created_at', 'updated_at'], '#B45309')
entity('shipment_items', 'shipment_items  (Shipment DB)', ['id'], ['shipment_id (FK)', 'sku', 'quantity'], '#B45309')
entity('tracking_events', 'tracking_events  (Tracking DB)', ['id'],
       ['tracking_number (ref. shipments.tracking_number)', 'event_type', 'latitude', 'longitude',
        'location_label', 'notes', 'recorded_by (ref. users.id)', 'created_at'], '#7B1FA2')

dot.edge('warehouses', 'inventory_items', '1 to many', dir='both', arrowhead='crow', arrowtail='none')
dot.edge('shipments', 'shipment_items', '1 to many', dir='both', arrowhead='crow', arrowtail='none')
dot.edge('users', 'shipments', 'places (customer)\n[cross-service logical FK]', style='dashed', color='#c0392b', fontcolor='#c0392b')
dot.edge('users', 'shipments', 'delivers (driver)\n[cross-service logical FK]', style='dashed', color='#c0392b', fontcolor='#c0392b')
dot.edge('warehouses', 'shipments', 'originates from\n[cross-service logical FK]', style='dashed', color='#c0392b', fontcolor='#c0392b')
dot.edge('shipments', 'tracking_events', 'generates\n[cross-service logical FK\nvia tracking_number]', style='dashed', color='#c0392b', fontcolor='#c0392b')
dot.edge('users', 'tracking_events', 'records\n[cross-service logical FK]', style='dashed', color='#c0392b', fontcolor='#c0392b')

dot.render('er_diagram', cleanup=True)
print('rendered er_diagram.png')
