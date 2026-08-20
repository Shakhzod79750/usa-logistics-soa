from pydantic import BaseModel, Field
from typing import Optional, List


class InventoryItemCreate(BaseModel):
    sku: str
    description: str
    quantity_on_hand: int = Field(ge=0)
    unit_price: float = Field(ge=0)


class InventoryItemUpdate(BaseModel):
    description: Optional[str] = None
    quantity_on_hand: Optional[int] = Field(default=None, ge=0)
    unit_price: Optional[float] = Field(default=None, ge=0)


class InventoryItemOut(InventoryItemCreate):
    id: int
    warehouse_id: int

    class Config:
        from_attributes = True


class WarehouseCreate(BaseModel):
    name: str
    address: str
    state: str = Field(min_length=2, max_length=2)
    capacity_units: int = Field(gt=0)


class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = Field(default=None, min_length=2, max_length=2)
    capacity_units: Optional[int] = Field(default=None, gt=0)


class WarehouseOut(BaseModel):
    id: int
    name: str
    address: str
    state: str
    capacity_units: int
    inventory: List[InventoryItemOut] = []

    class Config:
        from_attributes = True
