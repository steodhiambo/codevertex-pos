from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
import uuid
from datetime import datetime, timedelta

def seed_db():
    # Ensure tables are created
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Clear existing data to avoid conflicts during testing
    db.query(models.OrderItem).delete()
    db.query(models.Order).delete()
    db.query(models.MenuItem).delete()
    db.query(models.Category).delete()
    db.query(models.Table).delete()
    db.query(models.Profile).delete()
    db.commit()

    print("Seeding diverse users...")
    users = [
        models.Profile(id=str(uuid.uuid4()), full_name="System Admin", pin="0000", role=models.UserRole.Admin),
        models.Profile(id=str(uuid.uuid4()), full_name="Peter Kamau", pin="1234", role=models.UserRole.Waiter),
        models.Profile(id=str(uuid.uuid4()), full_name="Mary Wanjiku", pin="5678", role=models.UserRole.Waiter),
        models.Profile(id=str(uuid.uuid4()), full_name="James Otieno", pin="4321", role=models.UserRole.Waiter),
        models.Profile(id=str(uuid.uuid4()), full_name="Lucy Achieng", pin="1111", role=models.UserRole.Cashier),
        models.Profile(id=str(uuid.uuid4()), full_name="Mike Ndegwa", pin="2222", role=models.UserRole.Kitchen),
        models.Profile(id=str(uuid.uuid4()), full_name="David Mwangi", pin="3333", role=models.UserRole.Bar),
        models.Profile(id=str(uuid.uuid4()), full_name="Grace Mutindi", pin="4444", role=models.UserRole.Receptionist),
        models.Profile(id=str(uuid.uuid4()), full_name="Sarah Njeri", pin="9999", role=models.UserRole.Manager),
    ]
    db.add_all(users)
    # Index for later references
    waiter_one = users[1]

    print("Seeding categories...")
    cats = {
        "Starters": models.Category(id=str(uuid.uuid4()), name="Starters", display_order=1),
        "Burgers": models.Category(id=str(uuid.uuid4()), name="Burgers", display_order=2),
        "Pizza": models.Category(id=str(uuid.uuid4()), name="Pizza", display_order=3),
        "Steaks": models.Category(id=str(uuid.uuid4()), name="Steaks", display_order=4),
        "Drinks": models.Category(id=str(uuid.uuid4()), name="Drinks", display_order=5),
        "Cocktails": models.Category(id=str(uuid.uuid4()), name="Cocktails", display_order=6),
    }
    db.add_all(cats.values())

    print("Seeding menu items...")
    # (name, price, category, production_area)
    menu_data = [
        ("Garlic Bread", 450, "Starters", "kitchen"), ("Bruschetta", 600, "Starters", "kitchen"), ("Chicken Wings", 850, "Starters", "kitchen"),
        ("Classic Burger", 1200, "Burgers", "kitchen"), ("Cheese Burger", 1350, "Burgers", "kitchen"), ("Veggie Burger", 1100, "Burgers", "kitchen"), ("Double Beef", 1800, "Burgers", "kitchen"),
        ("Margherita", 1100, "Pizza", "kitchen"), ("Pepperoni", 1400, "Pizza", "kitchen"), ("Hawaiian", 1350, "Pizza", "kitchen"), ("BBQ Chicken", 1500, "Pizza", "kitchen"),
        ("Ribeye 300g", 2800, "Steaks", "kitchen"), ("T-Bone 500g", 3500, "Steaks", "kitchen"), ("Filet Mignon", 3200, "Steaks", "kitchen"),
        ("Coke 300ml", 150, "Drinks", "bar"), ("Fanta 300ml", 150, "Drinks", "bar"), ("Water 500ml", 100, "Drinks", "bar"), ("Local Beer", 450, "Drinks", "bar"),
        ("Mojito", 850, "Cocktails", "bar"), ("Margarita", 900, "Cocktails", "bar"), ("Old Fashioned", 1100, "Cocktails", "bar"),
    ]

    items = []
    for name, price, cat_name, area in menu_data:
        items.append(models.MenuItem(id=str(uuid.uuid4()), name=name, price=price, category_id=cats[cat_name].id, production_area=area))
    db.add_all(items)

    print("Seeding tables...")
    # Indoor (T1-T6), Outdoor (T7-T9), VIP (V1-V3), Bar (B1-B3) — zone derived from name prefix
    tables = []
    for i in range(1, 7):
        tables.append(models.Table(id=str(uuid.uuid4()), name=f"T{i}", seats=2 if i < 4 else 4, status="available"))
    for i in range(7, 10):
        tables.append(models.Table(id=str(uuid.uuid4()), name=f"T{i}", seats=4, status="available"))
    for i in range(1, 4):
        tables.append(models.Table(id=str(uuid.uuid4()), name=f"V{i}", seats=8, status="available"))
    for i in range(1, 4):
        tables.append(models.Table(id=str(uuid.uuid4()), name=f"B{i}", seats=2, status="available"))
    db.add_all(tables)
    db.commit()

    print("Seeding sample orders for KDS and Floor Plan...")
    # 1. An active order for T1
    t1 = db.query(models.Table).filter(models.Table.name == "T1").first()
    order1 = models.Order(
        id=str(uuid.uuid4()), table_id=t1.id, waiter_id=waiter_one.id,
        status="cooking", total=2050, guest_count=2, created_at=datetime.utcnow() - timedelta(minutes=12)
    )
    db.add(order1)
    t1.status = "occupied"

    # Add items to order1
    burger = next(i for i in items if i.name == "Classic Burger")
    wings = next(i for i in items if i.name == "Chicken Wings")
    db.add(models.OrderItem(id=str(uuid.uuid4()), order_id=order1.id, menu_item_id=burger.id, quantity=1, unit_price=1200, is_cooked=False))
    db.add(models.OrderItem(id=str(uuid.uuid4()), order_id=order1.id, menu_item_id=wings.id, quantity=1, unit_price=850, is_cooked=True, notes="Extra spicy"))

    # 2. A ready order for T3
    t3 = db.query(models.Table).filter(models.Table.name == "T3").first()
    order2 = models.Order(
        id=str(uuid.uuid4()), table_id=t3.id, waiter_id=waiter_one.id,
        status="ready", total=1500, guest_count=1, created_at=datetime.utcnow() - timedelta(minutes=25)
    )
    db.add(order2)
    t3.status = "occupied"
    bbq = next(i for i in items if i.name == "BBQ Chicken")
    db.add(models.OrderItem(id=str(uuid.uuid4()), order_id=order2.id, menu_item_id=bbq.id, quantity=1, unit_price=1500, is_cooked=True))

    # 3. A paid order for history (Bills List)
    t6 = db.query(models.Table).filter(models.Table.name == "T6").first()
    order3 = models.Order(
        id=str(uuid.uuid4()), table_id=t6.id, waiter_id=waiter_one.id,
        status="paid", total=450, guest_count=1, created_at=datetime.utcnow() - timedelta(hours=1)
    )
    db.add(order3)
    beer = next(i for i in items if i.name == "Local Beer")
    db.add(models.OrderItem(id=str(uuid.uuid4()), order_id=order3.id, menu_item_id=beer.id, quantity=1, unit_price=450, is_cooked=True))

    db.commit()
    print("Database seeded with rich testing data!")
    db.close()

if __name__ == "__main__":
    seed_db()
