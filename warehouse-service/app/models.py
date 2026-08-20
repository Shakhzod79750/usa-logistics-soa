from sqlalchemy import Column, Integer, String, Float, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from .database import Base


class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    state = Column(String, nullable=False)
    capacity_units = Column(Integer, nullable=False)

    inventory = relationship("InventoryItem", back_populates="warehouse", cascade="all, delete-orphan")


class InventoryItem(Base):
    __tablename__ = "inventory_items"
    __table_args__ = (UniqueConstraint("warehouse_id", "sku", name="uq_warehouse_sku"),)

    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    sku = Column(String, nullable=False)
    description = Column(String, nullable=False)
    quantity_on_hand = Column(Integer, nullable=False, default=0)
    unit_price = Column(Float, nullable=False, default=0.0)

    warehouse = relationship("Warehouse", back_populates="inventory")
