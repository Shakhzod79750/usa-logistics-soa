# References and Supporting Material

The full, APA 7–formatted reference list is included in the Software Architecture Document itself
(`01_Software_Architecture_Document/`, References section, before the Appendices) rather than
duplicated here, per the submission guide's consistency requirement.

## Repository

Full source code, commit history, and this same submission package structure are available at:

**https://github.com/Shakhzod79750/usa-logistics-soa**

## Package Contents Overview

| Folder | Contents |
|---|---|
| 01_Software_Architecture_Document | The primary deliverable — full SAD (DOCX) |
| 02_Architecture_Diagrams_Source | Editable Python (Graphviz/Matplotlib) generator scripts + rendered PNG diagrams |
| 03_ADRs | Standalone copy of all 7 Architecture Decision Records |
| 04_API_and_Interface_Contracts | Postman collection + environment (executable API contract), static API reference |
| 05_Prototype_or_Implementation_Evidence | Live Newman test output (41/41 passing), live browser screenshots |
| 06_Deployment_and_Configuration | docker-compose.yml, per-service Dockerfiles and .env.example files |
| 07_References_and_Supporting_Material | This file |

## Reproducing the Validation Evidence

From the repository root:
```bash
docker compose up --build
```
Then, with Postman or Newman installed:
```bash
newman run 04_API_and_Interface_Contracts/USA_Logistics_SOA.postman_collection.json \
  -e 04_API_and_Interface_Contracts/USA_Logistics_SOA.postman_environment.json
```
This reproduces the exact 41-request, 0-failure run referenced in Section 15 of the SAD.
