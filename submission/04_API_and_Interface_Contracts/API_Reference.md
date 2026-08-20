# API Reference — USA Logistics & Shipment Tracking System

Every service exposes live, interactive OpenAPI/Swagger documentation at `/docs` when running
(auto-generated for the two FastAPI services; via `swagger-jsdoc` for the two Express services).
This file is a static reference; `USA_Logistics_SOA.postman_collection.json` in this folder is the
executable contract used for the validation evidence in Section 15 of the SAD (41 requests, 0 failures).

All endpoints except `/health`, `/auth/register`, and `/auth/login` require:
```
Authorization: Bearer <JWT access token>
```

## Auth Service — :4001
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | /auth/register | public | Register a user |
| POST | /auth/login | public | Login, returns JWT |
| GET | /auth/verify | any | Verify a token |
| GET | /auth/users | admin | List all users |
| GET | /auth/users/{id} | admin or self | Get one user |
| PUT | /auth/users/{id} | admin | Update name/role/password |
| DELETE | /auth/users/{id} | admin | Delete a user |

## Shipment Service — :4002
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | /shipments | admin, dispatcher, customer | Create a shipment (validates warehouse via Warehouse Service) |
| GET | /shipments | any (scoped) | List shipments |
| GET | /shipments/{id} | any (scoped) | Get by id |
| GET | /shipments/tracking/{trackingNumber} | any | Look up by tracking number (used by Tracking Service) |
| PUT | /shipments/{id} | admin, dispatcher | Update status/assign driver |
| DELETE | /shipments/{id} | admin | Delete |

## Warehouse Service — :4004
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | /warehouses | admin, dispatcher | Create warehouse |
| GET | /warehouses, /warehouses/{id} | any | List/get |
| PUT | /warehouses/{id} | admin, dispatcher | Update |
| DELETE | /warehouses/{id} | admin | Delete |
| POST/GET/PUT/DELETE | /warehouses/{id}/inventory[/...] | mirrors warehouse roles | Inventory CRUD |

## Tracking Service — :4003
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | /tracking/events | admin, dispatcher, driver | Log event (validates shipment via Shipment Service) |
| GET | /tracking/{trackingNumber} | any | Full history |
| GET | /tracking/{trackingNumber}/latest | any | Most recent event |
| DELETE | /tracking/events/{id} | admin | Delete |
