# USA Logistics & Shipment Tracking System

A Service-Oriented Architecture (SOA) reference implementation built for **SFWE415 – Software Architecture** (Final International University, Summer 2025–2026).

Five independently deployable containers — a browser-based Web Console plus four backend services split across two language stacks (Node.js/Express and Python/FastAPI) — communicating over REST + JWT, with a live, observable distributed-trace feature that shows the real cross-service, cross-language calls as they happen.

> 📄 **Full documentation:** [`submission/01_Software_Architecture_Document/`](./submission/01_Software_Architecture_Document/) — the complete 46-page Software Architecture Document (problem statement, C4 views, quality-attribute scenarios, security architecture, 7 ADRs, traceability matrix, and live validation evidence).

---

## Architecture at a Glance

| Container | Stack | Responsibility | Port |
|---|---|---|---|
| **Web Console** | Vanilla JS + nginx | Browser-based dispatch console; client to all four services | 3000 |
| **Auth Service** | Node.js + Express | JWT auth, RBAC, user management | 4001 |
| **Shipment Service** | Python + FastAPI | Shipment/order lifecycle, driver assignment | 4002 |
| **Tracking Service** | Node.js + Express | Tracking events, live status | 4003 |
| **Warehouse Service** | Python + FastAPI | Warehouses & inventory | 4004 |

**Style:** Service-Oriented Architecture — synchronous REST/JSON, database-per-service, stateless JWT authentication verified independently by every service. See [ADR-1](./submission/03_ADRs/ADRs.md) for why SOA was chosen over an event-driven alternative.

**Interoperability:** Shipment Service (Python) calls Warehouse Service (Python) to validate a warehouse before creating a shipment; Tracking Service (Node.js) calls Shipment Service (Python) to validate a tracking number before logging an event — the second is the cross-*language* interoperability this project is built around, and it's rendered live in the Web Console's Network Trace panel as it happens.

---

## Running It

```bash
git clone https://github.com/Shakhzod79750/usa-logistics-soa.git
cd usa-logistics-soa
docker compose up --build
```

Then open **http://localhost:3000** and register an Admin account first (needed to create warehouses and manage users), followed by a Dispatcher, Driver, and Customer to see role-based access across the console.

Each service also exposes live Swagger/OpenAPI docs at `/docs`:
- http://localhost:4001/docs (Auth)
- http://localhost:4002/docs (Shipment)
- http://localhost:4003/docs (Tracking)
- http://localhost:4004/docs (Warehouse)

## Verifying It

A 41-request Postman collection exercises every endpoint across all five containers, including both live cross-service calls:

```bash
newman run submission/04_API_and_Interface_Contracts/USA_Logistics_SOA.postman_collection.json \
  -e submission/04_API_and_Interface_Contracts/USA_Logistics_SOA.postman_environment.json
```

Last verified run: **41/41 requests passed, 0 failures** (full output: [`newman_output.txt`](./submission/05_Prototype_or_Implementation_Evidence/newman_output.txt)).

---

## Repository Structure

```
usa-logistics-soa/
├── auth-service/            # Node.js/Express — identity & JWT
├── shipment-service/        # Python/FastAPI — shipments & orders
├── tracking-service/        # Node.js/Express — tracking events
├── warehouse-service/       # Python/FastAPI — warehouses & inventory
├── web-ui/                  # Static SPA (vanilla JS) + nginx
├── docker-compose.yml       # Orchestrates all 5 containers
├── docs/
│   ├── sad/                 # SAD source (docx generator scripts)
│   ├── diagrams/            # Editable diagram sources (Graphviz/Matplotlib) + rendered PNGs
│   ├── adrs/                # Architecture Decision Records
│   └── postman/             # API test collection
└── submission/               # Course submission package (01–07 folder structure)
    ├── 01_Software_Architecture_Document/
    ├── 02_Architecture_Diagrams_Source/
    ├── 03_ADRs/
    ├── 04_API_and_Interface_Contracts/
    ├── 05_Prototype_or_Implementation_Evidence/
    ├── 06_Deployment_and_Configuration/
    └── 07_References_and_Supporting_Material/
```

---

## Key Architectural Decisions

Full detail in the [ADRs](./submission/03_ADRs/ADRs.md) and Section 12 of the SAD:

1. **SOA over Event-Driven Architecture** — core workflows need an immediate success/failure answer.
2. **Database-per-service** — full service autonomy; no shared database, no cross-service schema coupling.
3. **Stateless, locally-verified JWT** — no central auth bottleneck, at the cost of instant token revocation.
4. **Polyglot stack (Node.js + Python)** — split along a genuine workload boundary, not an arbitrary one.
5. **No API Gateway** — not justified at this project's scale; documented as the first production infrastructure addition needed.
6. **Browser-direct Web Console, no BFF** — zero new backend logic; keeps the real SOA call graph visible rather than hidden behind an intermediary.
7. **Fail-fast on downstream failure** — a dependency outage returns a clean error rather than a partial write.

## Known Limitations

Documented in full (with justification) in Sections 10.6, 13.3–13.4, and 16.4 of the SAD: no TLS in this deployment, no login rate-limiting, secrets via environment variables rather than a managed secrets store, SQLite rather than a production database engine, and no automated CI pipeline. None of these are oversights — each is a deliberate, scope-appropriate trade-off for a single-developer, one-semester coursework project, explicitly flagged as required work before any real deployment.

---

## Course Information

**Course:** SFWE415 — Software Architecture
**Institution:** Final International University, Faculty of Engineering
**Student:** Shakhzod Musaev (2003060085)
**Instructor:** Ibrahim Adeshola
**Semester:** Summer 2025–2026
