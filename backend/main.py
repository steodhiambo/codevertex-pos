from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
import models
import database
import schemas
from database import engine, get_db
import uuid
import json
from decimal import Decimal

# Create tables in PostgreSQL
models.Base.metadata.create_all(bind=engine)

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

app = FastAPI(title="Codevertex POS API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AUTH Endpoints ---

@app.post("/api/login", response_model=schemas.LoginResponse)
def login(login_data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.Profile).filter(models.Profile.pin == login_data.pin, models.Profile.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid PIN"
        )
    return {
        "user": user,
        "message": "Login successful"
    }

# --- GET Endpoints ---

@app.get("/api/menu", response_model=list[schemas.MenuItem])
def get_menu(db: Session = Depends(get_db)):
    items = db.query(models.MenuItem, models.Category.name.label("category_name")) \
              .join(models.Category, models.MenuItem.category_id == models.Category.id) \
              .all()
    
    result = []
    for item, cat_name in items:
        item_dict = schemas.MenuItem.from_orm(item)
        item_dict.category_name = cat_name
        result.append(item_dict)
    return result

@app.get("/api/categories", response_model=list[schemas.Category])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()

# --- USER Management Endpoints ---

@app.get("/api/users", response_model=list[schemas.Profile])
def get_users(db: Session = Depends(get_db)):
    return db.query(models.Profile).order_by(models.Profile.full_name).all()

@app.post("/api/users", response_model=schemas.Profile, status_code=status.HTTP_201_CREATED)
def create_user(payload: schemas.ProfileCreate, db: Session = Depends(get_db)):
    if db.query(models.Profile).filter(models.Profile.pin == (payload.pin or "0000")).first():
        raise HTTPException(status_code=400, detail="PIN already in use. Choose a unique PIN.")
    try:
        role_enum = models.UserRole(payload.role)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid role: {payload.role}")
    user = models.Profile(
        id=str(uuid.uuid4()),
        full_name=payload.full_name,
        role=role_enum,
        pin=payload.pin or "0000",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@app.patch("/api/users/{user_id}/toggle", response_model=schemas.Profile)
def toggle_user(user_id: str, payload: schemas.ProfileToggle, db: Session = Depends(get_db)):
    user = db.query(models.Profile).filter(models.Profile.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    return user

def _enrich_order(db_order: models.Order, db: Session) -> schemas.Order:
    """Hydrate an Order response with menu item names, production areas, table name and waiter name."""
    order_schema = schemas.Order.from_orm(db_order)
    # Build a lookup for menu items referenced by this order
    item_ids = [oi.menu_item_id for oi in db_order.items]
    if item_ids:
        menu_lookup = {
            mi.id: mi for mi in db.query(models.MenuItem).filter(models.MenuItem.id.in_(item_ids)).all()
        }
        for out_item in order_schema.items:
            mi = menu_lookup.get(out_item.menu_item_id)
            if mi:
                out_item.name = mi.name
                out_item.production_area = mi.production_area or "kitchen"
    table = db.query(models.Table).filter(models.Table.id == db_order.table_id).first()
    if table:
        order_schema.table_name = table.name
    waiter = db.query(models.Profile).filter(models.Profile.id == db_order.waiter_id).first()
    if waiter:
        order_schema.waiter_name = waiter.full_name
    return order_schema

@app.get("/api/orders", response_model=list[schemas.Order])
def get_orders(db: Session = Depends(get_db)):
    orders = db.query(models.Order).options(joinedload(models.Order.items)).all()
    return [_enrich_order(o, db) for o in orders]

@app.get("/api/orders/by-waiter/{waiter_id}", response_model=list[schemas.Order])
def get_orders_by_waiter(waiter_id: str, db: Session = Depends(get_db)):
    orders = db.query(models.Order).options(joinedload(models.Order.items)) \
              .filter(models.Order.waiter_id == waiter_id) \
              .order_by(models.Order.created_at.desc()).all()
    return [_enrich_order(o, db) for o in orders]

@app.get("/api/orders/table/{table_id}", response_model=schemas.Order)
def get_active_order_by_table(table_id: str, db: Session = Depends(get_db)):
    """Fetch the most recent non-settled order for a given table (used when clicking an occupied table)."""
    order = db.query(models.Order).options(joinedload(models.Order.items)) \
              .filter(
                  models.Order.table_id == table_id,
                  models.Order.status.notin_(["paid", "voided"])
              ) \
              .order_by(models.Order.created_at.desc()) \
              .first()
    if not order:
        raise HTTPException(status_code=404, detail="No active order found for this table")
    return _enrich_order(order, db)

@app.get("/api/tables", response_model=list[schemas.Table])
def get_tables(db: Session = Depends(get_db)):
    tables = db.query(models.Table).all()
    result = []
    for table in tables:
        # Fetch the most recent non-paid order for this table
        current_order = db.query(models.Order) \
            .filter(models.Order.table_id == table.id, models.Order.status != "paid") \
            .order_by(models.Order.created_at.desc()) \
            .first()
        
        table_schema = schemas.Table.from_orm(table)
        table_schema.current_order = current_order
        result.append(table_schema)
    return result

# --- POST Endpoints ---

@app.post("/api/categories", response_model=schemas.Category, status_code=status.HTTP_201_CREATED)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    db_category = models.Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@app.post("/api/menu", response_model=schemas.MenuItem, status_code=status.HTTP_201_CREATED)
def create_menu_item(item: schemas.MenuItemCreate, db: Session = Depends(get_db)):
    db_item = models.MenuItem(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.post("/api/tables", response_model=schemas.Table, status_code=status.HTTP_201_CREATED)
def create_table(table: schemas.TableCreate, db: Session = Depends(get_db)):
    db_table = models.Table(**table.model_dump())
    db.add(db_table)
    db.commit()
    db.refresh(db_table)
    return db_table

def _enrich_notification(db_notif: models.Notification, db: Session) -> schemas.Notification:
    notif_schema = schemas.Notification.from_orm(db_notif)
    notif_schema.order_number = (db_notif.order_id or "")[:4].upper()
    order = db.query(models.Order).filter(models.Order.id == db_notif.order_id).first()
    if order:
        table = db.query(models.Table).filter(models.Table.id == order.table_id).first()
        if table:
            notif_schema.table_name = table.name
    return notif_schema

def _create_ready_notification(db_order: models.Order, db: Session) -> schemas.Notification:
    """Create + persist a notification when an order transitions to 'ready'.

    Source is derived from the production area of the order's items: any kitchen
    item → 'Kitchen', otherwise 'Bar'.
    """
    item_ids = [oi.menu_item_id for oi in db_order.items]
    source = "Kitchen"
    if item_ids:
        menu = db.query(models.MenuItem).filter(models.MenuItem.id.in_(item_ids)).all()
        areas = {(mi.production_area or "kitchen").lower() for mi in menu}
        source = "Bar" if areas == {"bar"} else "Kitchen"
    notif = models.Notification(
        id=str(uuid.uuid4()),
        waiter_id=db_order.waiter_id,
        order_id=db_order.id,
        source=source,
        message="Order is READY" if source == "Kitchen" else "Drinks are READY",
        is_read=False,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return _enrich_notification(notif, db)

@app.patch("/api/orders/{order_id}/status", response_model=schemas.Order)
async def update_order_status(order_id: str, status_data: schemas.OrderUpdate, db: Session = Depends(get_db)):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")

    previous_status = db_order.status
    db_order.status = status_data.status

    # If order is paid, set table to available
    if status_data.status == "paid":
        db_table = db.query(models.Table).filter(models.Table.id == db_order.table_id).first()
        if db_table:
            db_table.status = "available"

    # If order is voided, store reason and who voided it
    if status_data.status == "voided":
        db_order.void_reason = status_data.void_reason
        db_order.voided_by = status_data.voided_by
        db_order.voided_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(db_order)

    # Broadcast update to all clients (KDS, Floor Plan, etc.)
    enriched = _enrich_order(db_order, db)
    await manager.broadcast(enriched.model_dump_json())

    # Emit a notification when an order transitions into 'ready'
    if status_data.status == "ready" and previous_status != "ready" and db_order.waiter_id:
        notif_schema = _create_ready_notification(db_order, db)
        await manager.broadcast(json.dumps({
            "type": "notification",
            "data": json.loads(notif_schema.model_dump_json()),
        }))

    return enriched

@app.patch("/api/orders/{order_id}/items", response_model=schemas.Order)
async def add_items_to_order(order_id: str, data: schemas.OrderAddItems, db: Session = Depends(get_db)):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Add new items
    for item in data.items:
        db_item = models.OrderItem(
            id=str(uuid.uuid4()),
            order_id=order_id,
            **item.model_dump()
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(db_order)
    
    # Recalculate totals
    subtotal = sum(item.quantity * item.unit_price for item in db_order.items)
    db_order.subtotal = subtotal
    db_order.tax = subtotal * Decimal("0.16") # 16% VAT
    db_order.total = db_order.subtotal + db_order.tax
    
    db.commit()
    db.refresh(db_order)
    
    # Broadcast to KDS via WebSocket
    enriched = _enrich_order(db_order, db)
    await manager.broadcast(enriched.model_dump_json())
    
    return enriched

@app.patch("/api/orders/items/{item_id}/toggle", response_model=schemas.OrderItem)
async def toggle_item_cooked(item_id: str, data: schemas.OrderItemToggle, db: Session = Depends(get_db)):
    db_item = db.query(models.OrderItem).filter(models.OrderItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")

    db_item.is_cooked = data.is_cooked
    db.commit()
    db.refresh(db_item)

    # Broadcast the parent order so KDS updates
    db_order = db.query(models.Order).filter(models.Order.id == db_item.order_id).first()
    if db_order:
        enriched = _enrich_order(db_order, db)
        await manager.broadcast(enriched.model_dump_json())

    return db_item

@app.post("/api/orders", response_model=schemas.Order, status_code=status.HTTP_201_CREATED)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    # 1. Calculate totals
    subtotal = sum(item.quantity * item.unit_price for item in order.items)
    tax = subtotal * 0.16 # 16% VAT
    total = subtotal + tax

    # 2. Create Order
    db_order = models.Order(
        id=order.id,
        table_id=order.table_id,
        waiter_id=order.waiter_id,
        guest_count=order.guest_count,
        status="pending",
        subtotal=subtotal,
        tax=tax,
        total=total
    )
    db.add(db_order)

    # 3. Create Order Items
    for item in order.items:
        db_item = models.OrderItem(
            id=str(uuid.uuid4()),
            order_id=order.id,
            **item.model_dump()
        )
        db.add(db_item)

    # 4. Update Table Status
    db_table = db.query(models.Table).filter(models.Table.id == order.table_id).first()
    if db_table:
        db_table.status = "occupied"

    db.commit()
    db.refresh(db_order)

    # 5. Broadcast to KDS via WebSocket
    enriched = _enrich_order(db_order, db)
    import asyncio
    asyncio.create_task(manager.broadcast(enriched.model_dump_json()))

    return enriched

# --- NOTIFICATION Endpoints ---

@app.get("/api/notifications", response_model=list[schemas.Notification])
def list_notifications(waiter_id: str, db: Session = Depends(get_db)):
    rows = db.query(models.Notification) \
        .filter(models.Notification.waiter_id == waiter_id) \
        .order_by(models.Notification.created_at.desc()) \
        .limit(50).all()
    return [_enrich_notification(n, db) for n in rows]

@app.post("/api/notifications/{notif_id}/read", response_model=schemas.Notification)
def mark_notification_read(notif_id: str, db: Session = Depends(get_db)):
    notif = db.query(models.Notification).filter(models.Notification.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return _enrich_notification(notif, db)

@app.post("/api/notifications/mark-all-read")
def mark_all_notifications_read(waiter_id: str, db: Session = Depends(get_db)):
    db.query(models.Notification) \
        .filter(models.Notification.waiter_id == waiter_id, models.Notification.is_read == False) \
        .update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"ok": True}

@app.delete("/api/notifications")
def clear_notifications(waiter_id: str, db: Session = Depends(get_db)):
    db.query(models.Notification) \
        .filter(models.Notification.waiter_id == waiter_id) \
        .delete(synchronize_session=False)
    db.commit()
    return {"ok": True}

@app.websocket("/ws/kds")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
