import graphviz

dot = graphviz.Digraph('context', format='png')
dot.attr(rankdir='TB', splines='ortho', fontname='Helvetica', bgcolor='white')
dot.attr('node', fontname='Helvetica', fontsize='11')
dot.attr('edge', fontname='Helvetica', fontsize='9', color='#555555')

PERSON = dict(shape='box', style='filled,rounded', fillcolor='#08427B', fontcolor='white', width='2.0', height='1.0')
SYSTEM = dict(shape='box', style='filled,rounded', fillcolor='#1168BD', fontcolor='white', width='3.2', height='1.4')
EXT = dict(shape='box', style='filled,rounded', fillcolor='#999999', fontcolor='white', width='2.2', height='1.0')

dot.node('customer', 'Customer\n[Person]\nBooks & tracks shipments', **PERSON)
dot.node('dispatcher', 'Dispatcher\n[Person]\nManages shipments & assigns drivers', **PERSON)
dot.node('driver', 'Driver\n[Person]\nUpdates shipment location/status', **PERSON)
dot.node('admin', 'System Admin\n[Person]\nManages users & full system access', **PERSON)

dot.node('system', 'USA Logistics Tracking System\n[Software System]\n\nBrowser-based console + four REST\nservices letting customers ship freight\nacross the US and track it in real time', **SYSTEM)

dot.node('email', 'Email/SMS Gateway\n[External System]\nDelivery notifications', **EXT)
dot.node('maps', 'Mapping/Geocoding API\n[External System]\nAddress validation & ETA', **EXT)

dot.edge('customer', 'system', 'Creates orders, views tracking\n[HTTPS/REST + JWT]')
dot.edge('dispatcher', 'system', 'Assigns drivers, manages warehouses\n[HTTPS/REST + JWT]')
dot.edge('driver', 'system', 'Logs pickup/delivery events\n[HTTPS/REST + JWT]')
dot.edge('admin', 'system', 'Administers users & data\n[HTTPS/REST + JWT]')
dot.edge('system', 'email', 'Sends notifications\n[REST/SMTP - future]', style='dashed')
dot.edge('system', 'maps', 'Validates addresses\n[REST - future]', style='dashed')

dot.render('context_diagram', cleanup=True)
print('rendered context_diagram.png')
