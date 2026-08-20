from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    tracking_number = Column(String, unique=True, index=True, nullable=False)
    customer_id = Column(Integer, nullable=False)
    driver_id = Column(Integer, nullable=True)
    origin_warehouse_id = Column(Integer, nullable=False)
    origin_address = Column(String, nullable=False)
    destination_address = Column(String, nullable=False)
    item_description = Column(String, nullable=False)
    weight_kg = Column(Float, nullable=False)
    status = Column(String, default="CREATED")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    items = relationship("ShipmentItem", back_populates="shipment", cascade="all, delete-orphan")


class ShipmentItem(Base):
    __tablename__ = "shipment_items"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id"), nullable=False)
    sku = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)

    shipment = relationship("Shipment", back_populates="items")
