from pydantic import BaseModel, Field
from typing import List, Optional
from decimal import Decimal
from datetime import datetime

# Profile/Auth Schemas
class ProfileBase(BaseModel):
    full_name: str
    role: str
    is_active: bool = True

class Profile(ProfileBase):
    id: str
    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    pin: str

class LoginResponse(BaseModel):
    user: Profile
    message: str
class CategoryBase(BaseModel):
    name: str
    display_order: Optional[int] = 0

class CategoryCreate(CategoryBase):
    id: str

class Category(CategoryBase):
    id: str
    class Config:
        from_attributes = True

class MenuItemBase(BaseModel):
    name: str
    price: Decimal
    category_id: str
    is_available: Optional[bool] = True
    production_area: Optional[str] = "kitchen"

class MenuItemCreate(MenuItemBase):
    id: str

class MenuItem(MenuItemBase):
    id: str
    class Config:
        from_attributes = True

# Table Schemas
class TableBase(BaseModel):
    name: str
    seats: int
    status: Optional[str] = "available"

class TableCreate(TableBase):
    id: str

class Table(TableBase):
    id: str
    class Config:
        from_attributes = True

# Order Schemas
class OrderItemBase(BaseModel):
    menu_item_id: str
    quantity: int
    unit_price: Decimal
    notes: Optional[str] = None

class OrderItemCreate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    id: str
    order_id: str
    is_cooked: bool
    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    table_id: str
    waiter_id: str
    guest_count: int = 1

class OrderCreate(OrderBase):
    id: str
    items: List[OrderItemCreate]

class Order(OrderBase):
    id: str
    status: str
    subtotal: Decimal
    tax: Decimal
    total: Decimal
    created_at: datetime
    items: List[OrderItem]
    class Config:
        from_attributes = True
