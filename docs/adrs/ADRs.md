# Architecture Decision Records — USA Logistics & Shipment Tracking System

These seven ADRs are the authoritative, full-detail record of this system's significant
architectural decisions. They are also embedded in full in Section 12 of the Software
Architecture Document (`01_Software_Architecture_Document/`), which is the primary
deliverable — this file is provided as a standalone, quick-reference copy per the course
submission guide's recommended package structure.

---

## ADR-1: Service-Oriented Architecture over Event-Driven Architecture
**Status:** Accepted · **Date/Author:** July 28, 2026 / Shakhzod Musaev

**Context:** Needed an inter-service/client-service communication style. Candidates: synchronous SOA (REST) vs. asynchronous EDA (message broker).

**Decision:** Adopt SOA — synchronous REST/JSON over HTTP, no message broker or ESB.

**Rationale:** Core workflows (create shipment, log event) need an immediate success/failure answer; REST is trivially identical across Node.js and Python, satisfying the course's interoperability requirement without broker operational complexity.

**Consequences (+):** Simple to build/test/reason about; immediate consistency; low-overhead interoperability.
**Consequences (–):** Tighter runtime coupling than pub/sub; not suited to a future high-volume telemetry use case without revisiting this decision.

---

## ADR-2: Database-per-Service
**Status:** Accepted · **Date/Author:** July 28, 2026 / Shakhzod Musaev

**Context:** Each service needs persistence. A shared database is simpler but conflicts with independent deployability (FR1).

**Decision:** Each service owns an isolated SQLite database; no cross-service database access.

**Rationale:** A shared database lets one service's migration silently break another's queries. Application-layer validation via REST trades referential-integrity guarantees for full autonomy.

**Consequences (+):** Full service autonomy; independent schema evolution.
**Consequences (–):** No database-enforced cross-service foreign keys; referential integrity depends on application logic.

---

## ADR-3: Stateless, Locally-Verified JWT Authentication
**Status:** Accepted · **Date/Author:** July 28, 2026 / Shakhzod Musaev

**Context:** All four services need to authenticate/authorize requests, including from each other.

**Decision:** Issue a signed JWT (HS256) at login; every service verifies it locally via a shared secret, with no callback to Auth Service.

**Rationale:** Central verification would make Auth Service a bottleneck/single point of failure, undermining Availability (QAS-1).

**Consequences (+):** No central point of failure; lower latency; services testable in isolation.
**Consequences (–):** No instant token revocation.

**Notable defect found under this decision:** the Node.js issuer originally signed `sub` as a number; `python-jose` in the Python services strictly rejects this per RFC 7519 (StringOrURI). Fixed by signing `sub` as a string — a concrete illustration of why cross-language contract testing matters.

---

## ADR-4: Polyglot Stack — Node.js/Express and Python/FastAPI
**Status:** Accepted · **Date/Author:** July 28, 2026 / Shakhzod Musaev

**Context:** Course requires demonstrable interoperability across ≥2 languages/frameworks.

**Decision:** Auth + Tracking on Node.js/Express; Shipment + Warehouse on Python/FastAPI.

**Rationale:** Split along a genuine workload boundary (transactional pair benefits from FastAPI's async client; high-frequency pair benefits from Node's event loop), not an arbitrary one.

**Consequences (+):** Defensible rationale; forces an explicit, language-agnostic contract.
**Consequences (–):** Two toolchains to maintain; a developer must know both stacks.

---

## ADR-5: No API Gateway or Enterprise Service Bus
**Status:** Accepted · **Date/Author:** August 15, 2026 / Shakhzod Musaev

**Context:** The Web Console needs to reach four backend services.

**Decision:** The Web Console calls each service directly; no gateway.

**Rationale:** At this scale, a gateway's benefits don't outweigh its cost (new component, new single point of failure) within project scope/timeline.

**Consequences (+):** Simpler infrastructure; no new SPOF.
**Consequences (–):** Cross-cutting concerns (rate limiting, logging) duplicated per service; identified as the first production infrastructure addition needed.

---

## ADR-6: Browser-Direct Web Console (No Backend-for-Frontend)
**Status:** Accepted · **Date/Author:** August 15, 2026 / Shakhzod Musaev

**Context:** A browser UI was added after the four backend services already existed.

**Decision:** Static SPA (nginx-served) calls all four services directly via `fetch`, relying on existing permissive CORS.

**Rationale:** A BFF would add a 5th backend service and hide real cross-service calls behind an intermediary, undermining the goal of visibly demonstrating the SOA architecture through the UI.

**Consequences (+):** Zero new backend logic; validates QAS-4 (added with zero changes to existing services).
**Consequences (–):** Requires permissive CORS; JWT held client-side in `localStorage` (XSS exposure, documented).

---

## ADR-7: Fail-Fast, No Partial Writes on Downstream Failure
**Status:** Accepted · **Date/Author:** July 28, 2026 / Shakhzod Musaev

**Context:** A service-to-service call can fail for reasons outside the caller's control.

**Decision:** If a required downstream call fails, abort and return HTTP 503; persist nothing.

**Rationale:** Without distributed-transaction infrastructure, a "pending" record risks becoming permanently orphaned; a clean abort-and-retry contract is simpler to reason about and test.

**Consequences (+):** No inconsistent partial data; simple client contract.
**Consequences (–):** Manual retry required by the user; would need a saga pattern if guaranteed eventual completion were ever required.
