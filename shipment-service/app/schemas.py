from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


class ShipmentItemCreate(BaseModel):
    sku: str
    quantity: int = Field(gt=0)


class ShipmentItemOut(ShipmentItemCreate):
    id: int

    class Config:
        from_attributes = True


class ShipmentCreate(BaseModel):
    customer_id: int
    origin_warehouse_id: int
    origin_address: str
    destination_address: str
    item_description: str
    weight_kg: float = Field(gt=0)
    items: List[ShipmentItemCreate] = []


class ShipmentUpdate(BaseModel):
    driver_id: Optional[int] = None
    status: Optional[str] = None
    destination_address: Optional[str] = None


class TraceStep(BaseModel):
    from_service: str
    to_service: str
    method: str
    path: str
    status: Optional[int] = None
    note: Optional[str] = None


class ShipmentOut(BaseModel):
    id: int
    tracking_number: str
    customer_id: int
    driver_id: Optional[int]
    origin_warehouse_id: int
    origin_address: str
    destination_address: str
    item_description: str
    weight_kg: float
    status: str
    created_at: datetime
    items: List[ShipmentItemOut] = []
    # Populated only on create — a simplified distributed trace of the real
    # inter-service calls made while handling this request, so a UI can
    # visualize the SOA call graph directly from a live API response.
    trace: Optional[List[TraceStep]] = None

    class Config:
        from_attributes = True
