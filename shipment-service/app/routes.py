import random
import string
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi.security import HTTPAuthorizationCredentials
from . import models, schemas
from .database import get_db
from .auth import get_current_user, require_roles, bearer_scheme
from .warehouse_client import check_and_reserve_stock
from .logging_config import logger

router = APIRouter(prefix="/shipments", tags=["Shipments"])


def _generate_tracking_number():
    return "USA-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=10))


@router.post("", response_model=schemas.ShipmentOut, status_code=201)
async def create_shipment(
    payload: schemas.ShipmentCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_roles("admin", "dispatcher", "customer")),
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    trace = [
        schemas.TraceStep(
            from_service="browser", to_service="shipment-service", method="POST", path="/shipments",
            note="JWT verified locally by shipment-service (Python)",
        )
    ]

    # Inter-service call: verify the origin warehouse exists (Shipment -> Warehouse)
    trace.append(schemas.TraceStep(
        from_service="shipment-service", to_service="warehouse-service", method="GET",
        path=f"/warehouses/{payload.origin_warehouse_id}", note="validating origin warehouse",
    ))
    _, wh_status = await check_and_reserve_stock(payload.origin_warehouse_id, payload.items, creds.credentials)
    trace.append(schemas.TraceStep(
        from_service="warehouse-service", to_service="shipment-service", method="RESPONSE",
        path=f"/warehouses/{payload.origin_warehouse_id}", status=wh_status, note="warehouse validated",
    ))

    shipment = models.Shipment(
        tracking_number=_generate_tracking_number(),
        customer_id=payload.customer_id,
        origin_warehouse_id=payload.origin_warehouse_id,
        origin_address=payload.origin_address,
        destination_address=payload.destination_address,
        item_description=payload.item_description,
        weight_kg=payload.weight_kg,
        status="CREATED",
    )
    db.add(shipment)
    db.commit()
    db.refresh(shipment)

    for item in payload.items:
        db.add(models.ShipmentItem(shipment_id=shipment.id, sku=item.sku, quantity=item.quantity))
    db.commit()
    db.refresh(shipment)

    trace.append(schemas.TraceStep(
        from_service="shipment-service", to_service="shipment-db", method="INSERT", path="shipments",
        note="shipment persisted",
    ))
    trace.append(schemas.TraceStep(
        from_service="shipment-service", to_service="browser", method="RESPONSE", path="/shipments",
        status=201, note="shipment created",
    ))

    logger.info(f"Shipment created: {shipment.tracking_number} by user {user['sub']}")
    shipment.trace = trace
    return shipment


@router.get("", response_model=list[schemas.ShipmentOut])
def list_shipments(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
    status_filter: str | None = None,
):
    query = select(models.Shipment)
    if user["role"] == "customer":
        query = query.where(models.Shipment.customer_id == int(user["sub"]))
    elif user["role"] == "driver":
        query = query.where(models.Shipment.driver_id == int(user["sub"]))
    if status_filter:
        query = query.where(models.Shipment.status == status_filter)
    return db.execute(query).scalars().all()


@router.get("/{shipment_id}", response_model=schemas.ShipmentOut)
def get_shipment(shipment_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    shipment = db.get(models.Shipment, shipment_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    if user["role"] == "customer" and shipment.customer_id != int(user["sub"]):
        raise HTTPException(status_code=403, detail="Not your shipment")
    return shipment


@router.get("/tracking/{tracking_number}", response_model=schemas.ShipmentOut)
def get_shipment_by_tracking_number(tracking_number: str, db: Session = Depends(get_db)):
    """Used by the Tracking Service (Node.js) to validate a tracking number exists."""
    shipment = db.execute(
        select(models.Shipment).where(models.Shipment.tracking_number == tracking_number)
    ).scalar_one_or_none()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return shipment


@router.put("/{shipment_id}", response_model=schemas.ShipmentOut)
def update_shipment(
    shipment_id: int,
    payload: schemas.ShipmentUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_roles("admin", "dispatcher")),
):
    shipment = db.get(models.Shipment, shipment_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    valid_statuses = {"CREATED", "ASSIGNED", "IN_TRANSIT", "DELIVERED", "CANCELLED"}
    if payload.status and payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"status must be one of {valid_statuses}")

    if payload.driver_id is not None:
        shipment.driver_id = payload.driver_id
    if payload.status is not None:
        shipment.status = payload.status
    if payload.destination_address is not None:
        shipment.destination_address = payload.destination_address

    db.commit()
    db.refresh(shipment)
    logger.info(f"Shipment {shipment_id} updated by {user['sub']}")
    return shipment


@router.delete("/{shipment_id}", status_code=204)
def delete_shipment(shipment_id: int, db: Session = Depends(get_db), user: dict = Depends(require_roles("admin"))):
    shipment = db.get(models.Shipment, shipment_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    db.delete(shipment)
    db.commit()
    logger.info(f"Shipment {shipment_id} deleted by {user['sub']}")
    return None
