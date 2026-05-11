from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
import uuid

def seed_db():
    # Ensure tables are created
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Check if we already have an admin
    admin = db.query(models.Profile).filter(models.Profile.role == models.UserRole.Admin).first()
    
    if not admin:
        print("Seeding default users...")
        
        users = [
            models.Profile(
                id=str(uuid.uuid4()),
                full_name="System Admin",
                pin="1234",
                role=models.UserRole.Admin,
                is_active=True
            ),
            models.Profile(
                id=str(uuid.uuid4()),
                full_name="John Waiter",
                pin="1111",
                role=models.UserRole.Waiter,
                is_active=True
            ),
            models.Profile(
                id=str(uuid.uuid4()),
                full_name="Sarah Cashier",
                pin="2222",
                role=models.UserRole.Cashier,
                is_active=True
            )
        ]
        
        db.add_all(users)
        
        # Also seed some initial categories and tables
        categories = [
            models.Category(id=str(uuid.uuid4()), name="Food", display_order=1),
            models.Category(id=str(uuid.uuid4()), name="Drinks", display_order=2),
            models.Category(id=str(uuid.uuid4()), name="Bar", display_order=3)
        ]
        db.add_all(categories)
        
        tables = [
            models.Table(id=str(uuid.uuid4()), name="T1", seats=4, status="available"),
            models.Table(id=str(uuid.uuid4()), name="T2", seats=2, status="available"),
            models.Table(id=str(uuid.uuid4()), name="V1", seats=8, status="available")
        ]
        db.add_all(tables)
        
        db.commit()
        print("Database seeded successfully!")
    else:
        print("Database already contains users.")
    
    db.close()

if __name__ == "__main__":
    seed_db()
