from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from . import models, schemas
from .database import get_db
from .auth import get_current_user, require_roles
from .logging_config import logger

router = APIRouter(prefix="/warehouses", tags=["Warehouses"])


@router.post("", response_model=schemas.WarehouseOut, status_code=201)
def create_warehouse(
    payload: schemas.WarehouseCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_roles("admin", "dispatcher")),
):
    warehouse = models.Warehouse(**payload.model_dump())
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)
    logger.info(f"Warehouse created: {warehouse.id} by {user['sub']}")
    return warehouse


@router.get("", response_model=list[schemas.WarehouseOut])
def list_warehouses(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    return db.execute(select(models.Warehouse)).scalars().all()


@router.get("/{warehouse_id}", response_model=schemas.WarehouseOut)
def get_warehouse(warehouse_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    warehouse = db.get(models.Warehouse, warehouse_id)
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return warehouse


@router.put("/{warehouse_id}", response_model=schemas.WarehouseOut)
def update_warehouse(
    warehouse_id: int,
    payload: schemas.WarehouseUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_roles("admin", "dispatcher")),
):
    warehouse = db.get(models.Warehouse, warehouse_id)
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(warehouse, field, value)
    db.commit()
    db.refresh(warehouse)
    logger.info(f"Warehouse {warehouse_id} updated by {user['sub']}")
    return warehouse


@router.delete("/{warehouse_id}", status_code=204)
def delete_warehouse(warehouse_id: int, db: Session = Depends(get_db), user: dict = Depends(require_roles("admin"))):
    warehouse = db.get(models.Warehouse, warehouse_id)
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    db.delete(warehouse)
    db.commit()
    logger.info(f"Warehouse {warehouse_id} deleted by {user['sub']}")
    return None


@router.post("/{warehouse_id}/inventory", response_model=schemas.InventoryItemOut, status_code=201)
def add_inventory_item(
    warehouse_id: int,
    payload: schemas.InventoryItemCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_roles("admin", "dispatcher")),
):
    warehouse = db.get(models.Warehouse, warehouse_id)
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    item = models.InventoryItem(warehouse_id=warehouse_id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    logger.info(f"Inventory item {item.sku} added to warehouse {warehouse_id}")
    return item


@router.get("/{warehouse_id}/inventory", response_model=list[schemas.InventoryItemOut])
def list_inventory(warehouse_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    return db.execute(select(models.InventoryItem).where(models.InventoryItem.warehouse_id == warehouse_id)).scalars().all()


@router.put("/{warehouse_id}/inventory/{item_id}", response_model=schemas.InventoryItemOut)
def update_inventory_item(
    warehouse_id: int,
    item_id: int,
    payload: schemas.InventoryItemUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_roles("admin", "dispatcher")),
):
    item = db.get(models.InventoryItem, item_id)
    if not item or item.warehouse_id != warehouse_id:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{warehouse_id}/inventory/{item_id}", status_code=204)
def delete_inventory_item(
    warehouse_id: int, item_id: int, db: Session = Depends(get_db), user: dict = Depends(require_roles("admin"))
):
    item = db.get(models.InventoryItem, item_id)
    if not item or item.warehouse_id != warehouse_id:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    db.delete(item)
    db.commit()
    return None
