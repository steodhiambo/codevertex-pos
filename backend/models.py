from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Numeric, DateTime, Enum
from sqlalchemy.orm import relationship
from database import Base
import datetime
import enum

class UserRole(str, enum.Enum):
    Admin = "Admin"
    Manager = "Manager"
    Waiter = "Waiter"
    Kitchen = "Kitchen"
    Bar = "Bar"
    Cashier = "Cashier"
    Receptionist = "Receptionist"

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(String, primary_key=True)
    full_name = Column(String, nullable=False)
    pin = Column(String, nullable=False) # In production, hash this!
    role = Column(Enum(UserRole), default=UserRole.Waiter)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Category(Base):
    __tablename__ = "categories"
    id = Column(String, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    display_order = Column(Integer, default=0)

class MenuItem(Base):
    __tablename__ = "menu_items"
    id = Column(String, primary_key=True)
    category_id = Column(String, ForeignKey("categories.id"))
    name = Column(String, nullable=False)
    price = Column(Numeric(12, 2), nullable=False)
    is_available = Column(Boolean, default=True)
    production_area = Column(String)

class Table(Base):
    __tablename__ = "tables"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    seats = Column(Integer, nullable=False)
    status = Column(String, default="available")

class Order(Base):
    __tablename__ = "orders"
    id = Column(String, primary_key=True)
    table_id = Column(String, ForeignKey("tables.id"))
    waiter_id = Column(String, ForeignKey("profiles.id"))
    guest_count = Column(Integer, default=1)
    status = Column(String, default="pending")
    subtotal = Column(Numeric(12, 2), default=0)
    tax = Column(Numeric(12, 2), default=0)
    total = Column(Numeric(12, 2), default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(String, primary_key=True)
    order_id = Column(String, ForeignKey("orders.id"))
    menu_item_id = Column(String, ForeignKey("menu_items.id"))
    quantity = Column(Integer, default=1)
    unit_price = Column(Numeric(12, 2), nullable=False)
    notes = Column(String)
    is_cooked = Column(Boolean, default=False)
    order = relationship("Order", back_populates="items")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(String, primary_key=True)
    waiter_id = Column(String, ForeignKey("profiles.id"), index=True)
    order_id = Column(String, ForeignKey("orders.id"))
    source = Column(String)  # "Kitchen" | "Bar"
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
