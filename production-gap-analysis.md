# Codevertex POS — Production Gap Analysis

## What's Missing for Real Hotel Operations

---

## 🔴 CRITICAL (Must Have Before Going Live)

### 1. Payment Integration
All payment methods are currently **simulated**. Real integration required:

- **M-Pesa Daraja API** — Lipia Na M-Pesa (STK Push), C2B callback URLs, transaction confirmation
- **Card Terminals** — Pesapal, Flutterwave, or direct EFT integration
- **KRA eTIMS** — Real tax invoice generation (legally required in Kenya)
- **Payment reconciliation** — Auto-match payments to orders, handle failed transactions

### 2. Receipt & Kitchen Printing
No printer support exists:

- **Thermal receipt printers** (Epson TM-Series, STAR) for cashier checkout
- **Kitchen/bar printers** as physical fallback for KDS
- **Auto-print** on order placement
- **Print templates** for receipts, invoices, credit notes

### 3. Database & Infrastructure
Currently runs on localhost PostgreSQL only:

- **Production PostgreSQL** — Hosted on VPS, Digital Ocean, AWS RDS, or local server
- **Automated daily backups** with point-in-time recovery
- **SSL/TLS certificate** for HTTPS
- **Production server** setup (NGINX reverse proxy, process manager)
- **Environment separation** — dev/staging/production configs

### 4. Billing & Tax
- **Tax configuration** — VAT 16%, exempt items, service charge handling
- **Discount/promotion engine** — Percentage, fixed amount, happy hour, combo deals
- **Invoice number sequence** — Auto-increment per financial year, KRA-compliant format
- **Credit note / refund** flow for post-payment corrections
- **Surcharge handling** — tourism levy, county fees

### 5. Offline / Failover
- **No offline mode** — POS stops working if internet drops
- **Local-first architecture** needed for continued operation during outages
- **Queue & sync** mechanism for transactions made offline

---

## 🟡 HIGH (Needed Within First Week of Operation)

### 6. Housekeeping Module
Missing entirely:

- Room cleaning schedules & task assignment
- Room status coordination (cleaned → inspected → available)
- Lost & found tracking
- Housekeeping staff assignment per floor/zone
- Maintenance request workflow from room status

### 7. Night Audit
No end-of-day process:

- Auto-close all open bills
- Post room charges to guest folios (room rate, extras)
- Generate daily summary reports
- Reset system for new business day
- Verify cashier shift settlements
- Post automated transactions (service charge, tourism levy)

### 8. Guest Profiles & Folio
Currently guest data is minimal:

- Guest history (past stays, preferences, complaints, special dates)
- Detailed folio with all charges (room, F&B, laundry, minibar, phone)
- Walk-in vs advance reservation tracking
- Guest document upload (ID/Passport scan)
- VIP/Blacklist flags
- Group bookings under single bill

### 9. Booking / Reservation System
Basic skeleton only:

- Booking calendar view (daily/monthly occupancy)
- Deposit / prepayment tracking
- Overbooking prevention logic
- Group booking management
- Channel manager integration (Booking.com, Expedia, Airbnb)
- Online booking widget for website
- Cancellation policy enforcement with fees

### 10. Reporting Suite
Dashboard alone is insufficient for daily operations:

| Report | Purpose |
|--------|---------|
| Daily Sales Summary | Cashier reconciliation, end-of-day handover |
| Shift Settlement | Expected cash vs actual cash with variance |
| Monthly VAT Report | KRA filing preparation |
| Revenue by Department | Rooms vs F&B vs Other breakdown |
| Staff Performance | Orders taken, tables served, sales per staff |
| Void/Cancellation Report | Audit trail for all voids with reasons |
| Tax Summary | Total VAT collected per rate |
| Occupancy Report | Room nights sold, ADR, RevPAR |

---

## 🟠 MEDIUM (Within First Month)

### Inventory & Procurement
- Purchase orders to suppliers
- Supplier management (contacts, lead times, pricing)
- Goods received note (GRN) workflow
- Recipe costing per menu item
- Stock usage tracking — auto-deduct ingredients when item is sold
- Stock transfer between locations (bar ↔ kitchen ↔ store)
- Stock take / counting module
- Expiry date tracking

### Customer Relationship Management (CRM)
- Customer database with search
- Visit history per guest
- Preferences (favorite table, dietary restrictions)
- Complaints / feedback tracking and resolution
- Birthday / anniversary auto-alerts
- Email marketing list management

### Loyalty Program
- Points accumulation (per KES spent)
- Points redemption for discounts or free items
- Tier levels (Silver, Gold, Platinum) with different benefits
- Referral tracking

### Multi-Currency Support
- USD rates for tourists (common in Kenyan hotels)
- Auto-conversion between KES and USD
- Daily exchange rate update
- Settlement in preferred currency

### Hardware Integration
- Barcode scanner for stock intake and sales
- Customer display screen (guest-facing total)
- Cash drawer integration
- Card terminal communication via serial/network

### User Training & Documentation
- Role-specific training manuals (PDF)
- Quick reference cards for waiters/cashiers
- Admin setup guide
- Video tutorials for common workflows

### Email / SMS Notifications
- Booking confirmation email
- Check-in reminder SMS
- Invoice / receipt via email
- Promotional broadcast to customers
- Low stock alert to manager via SMS

---

## 🔵 NICE-TO-HAVE (Within 3 Months)

### Channel Manager
- Real-time availability sync with Booking.com, Expedia, Airbnb
- Automatic rate updates across all channels
- Commission tracking per channel
- Direct booking vs OTA booking comparison analytics

### Online Booking Engine
- Website embeddable booking widget
- Room selection with photos and rates
- Secure online payment at booking
- Instant confirmation with auto-email

### Restaurant Reservation System
- Table booking with time slots
- Guest special requests (birthday, dietary)
- Reservation calendar for hostess stand
- Waitlist management with SMS notify when table ready

### Events & Conferencing
- Banquet hall booking
- Catering menu per event type
- Equipment rental tracking
- Event billing (deposit, balance, extras)
- Floor plan for event seating

### Laundry Module
- Guest laundry workflow (collect → wash → deliver)
- Price list per item type
- Staff laundry tracking
- Outsourcing to third-party laundry

### Minibar Tracking
- Auto-charge to room when item removed
- Restock checklist per room
- Minibar consumption report per stay
- Low stock alerts per floor

### Mobile App (Guest-Facing)
- Self check-in
- Room service ordering
- Minibar view
- Housekeeping request (extra towels, etc.)
- Bill view and checkout

### Advanced Analytics
- Demand forecasting based on historical data
- Revenue management suggestions (dynamic pricing)
- Customer segmentation analysis
- Staff scheduling optimization based on occupancy forecast

---

## 🛠 Technical Production Readiness

| Area | Current State | What's Needed |
|------|---------------|---------------|
| **Tests** | None | pytest for backend, Vitest for frontend |
| **Docker** | None | Containerize backend + frontend for consistent deployment |
| **Error Tracking** | None | Integrate Sentry (free tier) |
| **CI/CD** | None | GitHub Actions → build → test → deploy |
| **Logging** | print() statements only | Centralized structured logging (file + external service) |
| **Rate Limiting** | None | Protect login and reset endpoints from brute force |
| **Secrets Management** | Hardcoded in .env | Move to vault or environment-specific secrets |
| **API Documentation** | None | Auto-generate from FastAPI (OpenAPI/Swagger) |
| **Monitoring** | None | Uptime monitoring, server resource alerts |

---

## 📅 Recommended Deployment Roadmap

```
Week 1-2:   Payment integration + KRA eTIMS + Printer setup + Production DB
Week 3:     Night audit + Reports + Tax configuration
Week 4:     Housekeeping module + Guest profiles + Folio system
Week 5-6:   Booking/Reservations + Deposit tracking
Week 7:     CRM + Customer database + Email/SMS
Week 8:     Training + Go-live dry run + Parallel run with manual system
Month 2:    Inventory/Procurement + Multi-currency
Month 3:    Loyalty + Channel manager + Online booking
Month 4-6:  Mobile app + Events + Laundry + Minibar
```

---

## 💡 Pre-Go-Live Checklist

- [ ] All critical items resolved (🔴 sections)
- [ ] Payment gateway test transactions successful
- [ ] KRA eTIMS test invoice accepted by KRA sandbox
- [ ] Backup and restore procedure tested
- [ ] Disaster recovery drill completed
- [ ] All staff trained and signed off
- [ ] Hardware installed and tested (printers, card terminals)
- [ ] Parallel run with existing manual system for 1 week
- [ ] Data migration (existing guests, bookings, inventory) completed
- [ ] Go-live date confirmed with management
- [ ] Support contact / escalation list distributed
- [ ] Rollback plan documented
