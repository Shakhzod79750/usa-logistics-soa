# Architecture Diagram Source Files

Editable source (per the submission guide's requirement that "screenshots alone are not
sufficient when an editable source can reasonably be provided").

## Requirements
```bash
pip install graphviz matplotlib --break-system-packages
# plus the Graphviz binary itself: apt install graphviz (Linux) / brew install graphviz (Mac) /
# https://graphviz.org/download/ (Windows)
```

## Regenerating any diagram
```bash
python3 gen_context.py       # Figure 1 — System Context
python3 gen_container.py     # Figure 2 — Container View
python3 gen_component.py     # Figure 3 — Component View (Shipment Service)
python3 gen_security.py      # Figure 4 — Security / Trust Boundary View
python3 gen_er.py            # Figure 5 — Data Architecture / ER Diagram
python3 gen_deployment.py    # Figure 6 — Deployment View
python3 gen_seq1.py          # Figure 7 — Sequence: Create Shipment
python3 gen_seq2.py          # Figure 8 — Sequence: Log Tracking Event (cross-language)
python3 gen_seq3.py          # Figure 9 — Sequence: Warehouse Service Failure
```

`gen_seq1.py`, `gen_seq2.py`, and `gen_seq3.py` depend on `seq_helper.py` (must be in the same
directory). All scripts write a `.png` into the current directory using each diagram's real,
current service names/ports — editing a script and re-running it is the intended way to keep
diagrams in sync with any future code changes, per the SAD's internal-consistency requirement.
