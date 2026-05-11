from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
import models
import database
import schemas
from database import engine, get_db
import uuid
import json

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
    return db.query(models.MenuItem).all()

@app.get("/api/categories", response_model=list[schemas.Category])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()

@app.get("/api/orders", response_model=list[schemas.Order])
def get_orders(db: Session = Depends(get_db)):
    return db.query(models.Order).options(joinedload(models.Order.items)).all()

@app.get("/api/tables", response_model=list[schemas.Table])
def get_tables(db: Session = Depends(get_db)):
    return db.query(models.Table).all()

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

@app.patch("/api/orders/{order_id}/status", response_model=schemas.Order)
async def update_order_status(order_id: str, status: str, db: Session = Depends(get_db)):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    db_order.status = status
    db.commit()
    db.refresh(db_order)

    # Broadcast update
    order_data = schemas.Order.from_orm(db_order).model_dump_json()
    await manager.broadcast(order_data)
    
    return db_order

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
    order_data = schemas.Order.from_orm(db_order).model_dump_json()
    import asyncio
    asyncio.create_task(manager.broadcast(order_data))

    return db_order

@app.websocket("/ws/kds")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
