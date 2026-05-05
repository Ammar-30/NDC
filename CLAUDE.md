# Laundry Franchise App — Project Context

## What this app is
A PWA (Progressive Web App) for a laundry franchise network in Pakistan.
Offline-first: works without internet, syncs to cloud when online.
Built for real-world Pakistan conditions — frequent internet outages,
remote access from any device, no IP restrictions.

## Business model
- Franchise network: one shared brand, multiple independent owners
- Each owner owns between 1 and 10+ branches
- Currently 10 branches across all owners — expected to grow to 50+
- Adding new branches or owners requires zero code changes — database insert only
- This is a one-time custom build for the franchisor (not a SaaS product)

## Roles & access rules
- staff: sees only their assigned branch. Can create orders, bills,
  manage customers and inventory for that branch only
- owner: sees all branches they own. Full reports and analytics
  across their branches only
- No super-admin role for now — owners are fully independent

## Critical security rule (enforce everywhere)
Every database query MUST be scoped:
- Staff queries: WHERE branch_id = :branchId (from JWT)
- Owner queries: WHERE owner_id = :ownerId (from JWT)
No user must ever access another owner's data.
Enforce this at middleware level, not just frontend.
Never trust branch_id or owner_id from request body — always use JWT payload.

## Customer identification
- Primary search key: phone number (how staff find customers at the counter)
- Database primary key: CHAR(36) UUID (stable, safe for foreign keys)
- Phone number is the unique identifier within a branch
- Same phone number can exist across different branches (customers are branch-scoped)
- Phone normalization rule: always store as 03XXXXXXXXX format (11 digits)
  Strip spaces, dashes, brackets before saving.
  If starts with +92 → replace with 0
  If starts with 92 → replace with 0
  Always validate: must be exactly 11 digits starting with 03
- Customer lookup: search by phone number → returns full profile + all
  orders associated with that number at this branch
- If phone not found → return 404 so frontend can offer creating new customer

## Customer scoping
Customers belong to a specific branch. The same person at two
different branches is treated as two separate customer records.
No cross-branch customer lookup.

## Price list
Global — one shared price list for all branches.
Set centrally. Staff cannot override prices.
Prices in PKR (Pakistani Rupees).
Default items to seed: 
  shirt=150, trouser=100, suit=300, kurta=120,
  blanket=400, curtain=250, bedsheet=200, jacket=350

## Order lifecycle
drop-off → token generated → received → washing → ready → delivered
Staff update status at each stage.
Customer notified via WhatsApp (wa.me link) or thermal print receipt.

## Bill delivery
Two methods only:
1. Thermal printer — browser CSS @media print, no special driver needed
2. WhatsApp — pre-formatted wa.me link, opens WhatsApp with bill text
   No WhatsApp API or Twilio. Just a link. Zero ongoing cost.

## Tech stack
- Frontend: React + Vite + vite-plugin-pwa + Tailwind CSS
- Offline local storage: PouchDB (sits on IndexedDB in the browser)
- Offline sync: PouchDB replication protocol to backend sync endpoint
- Backend: Node.js (v20 LTS) + Express
- Database: PostgreSQL 16
- Auth: JWT — payload contains userId, role, branchId or ownerId
- Web server: Nginx (reverse proxy)
- Process manager: PM2
- Hosting: Contabo VPS 20, Singapore region (production only)
- Local dev: everything runs on localhost, no VPS needed during development

## Project folder structure
laundry-app/
  backend/
    src/
      routes/         → Express route files per resource
      controllers/    → Business logic
      middleware/     → auth.js, scopeBranch.js, errorHandler.js
      models/         → DB query functions (no ORM, raw pg queries)
      config/         → db.js, env validation
    server.js         → Entry point
    package.json
    .env              → Never commit this
  frontend/
    src/
      pages/          → One folder per screen
      components/     → Shared UI components
      db/             → PouchDB setup and sync logic
      hooks/          → Custom React hooks
      utils/          → Helpers
    public/
    index.html
    vite.config.js
    package.json
  database/
    migrations/       → Numbered SQL files e.g. 001_create_owners.sql
    seeds/            → Seed data SQL files
  CLAUDE.md           → This file

## Database tables

### owners
- id CHAR(36) PRIMARY KEY
- name VARCHAR(100) NOT NULL
- email VARCHAR(100) UNIQUE NOT NULL
- password_hash VARCHAR(255) NOT NULL
- created_at TIMESTAMP DEFAULT NOW()

### branches
- id CHAR(36) PRIMARY KEY
- owner_id CHAR(36) NOT NULL REFERENCES owners(id) ON DELETE RESTRICT
- name VARCHAR(100) NOT NULL
- city VARCHAR(100) NOT NULL
- address TEXT
- created_at TIMESTAMP DEFAULT NOW()

### users
- id CHAR(36) PRIMARY KEY
- branch_id CHAR(36) NOT NULL REFERENCES branches(id) ON DELETE RESTRICT
- name VARCHAR(100) NOT NULL
- role VARCHAR(10) NOT NULL CHECK (role IN ('staff', 'owner'))
- email VARCHAR(100) UNIQUE NOT NULL
- password_hash VARCHAR(255) NOT NULL
- created_at TIMESTAMP DEFAULT NOW()

### price_list
- id CHAR(36) PRIMARY KEY
- item_name VARCHAR(100) NOT NULL
- price_pkr DECIMAL(10,2) NOT NULL
- is_active BOOLEAN DEFAULT TRUE
- created_at TIMESTAMP DEFAULT NOW()

### customers
- id CHAR(36) PRIMARY KEY
- branch_id CHAR(36) NOT NULL REFERENCES branches(id) ON DELETE RESTRICT
- name VARCHAR(100) NOT NULL
- phone CHAR(11) NOT NULL
- address TEXT
- notes TEXT
- created_at TIMESTAMP DEFAULT NOW()
- UNIQUE constraint on (branch_id, phone)
- INDEX on phone column for fast lookup

### orders
- id CHAR(36) PRIMARY KEY
- branch_id CHAR(36) NOT NULL REFERENCES branches(id) ON DELETE RESTRICT
- customer_id CHAR(36) NOT NULL REFERENCES customers(id) ON DELETE RESTRICT
- token VARCHAR(20) NOT NULL
- status VARCHAR(20) NOT NULL CHECK (status IN ('received','washing','ready','delivered'))
- drop_off_at TIMESTAMP DEFAULT NOW()
- due_date TIMESTAMP NOT NULL
- total_pkr DECIMAL(10,2) NOT NULL DEFAULT 0
- notes TEXT
- created_by CHAR(36) REFERENCES users(id)
- created_at TIMESTAMP DEFAULT NOW()
- updated_at TIMESTAMP DEFAULT NOW()
- UNIQUE constraint on (branch_id, token)

### order_items
- id CHAR(36) PRIMARY KEY
- order_id CHAR(36) NOT NULL REFERENCES orders(id) ON DELETE RESTRICT
- price_list_id CHAR(36) REFERENCES price_list(id)
- item_name VARCHAR(100) NOT NULL
- quantity INT NOT NULL CHECK (quantity > 0)
- unit_price_pkr DECIMAL(10,2) NOT NULL
- created_at TIMESTAMP DEFAULT NOW()
- NOTE: unit_price_pkr stores price AT TIME OF ORDER — must be copied
  from price_list at order creation, not referenced dynamically.
  This ensures old order totals never change if prices are updated.

### inventory
- id CHAR(36) PRIMARY KEY
- branch_id CHAR(36) NOT NULL REFERENCES branches(id) ON DELETE RESTRICT
- item_name VARCHAR(100) NOT NULL
- category VARCHAR(50) NOT NULL CHECK (category IN ('supplies','equipment'))
- quantity INT NOT NULL DEFAULT 0
- low_stock_threshold INT NOT NULL DEFAULT 10
- updated_at TIMESTAMP DEFAULT NOW()

## Key API endpoints to build

### Auth
- POST /api/auth/login → returns JWT
- GET  /api/auth/me    → returns current user info from JWT

### Customers
- GET  /api/customers/search?phone=03XXXXXXXXX → normalize phone,
  search within branch, return customer + full order history
- POST /api/customers → create new customer (normalize phone first)
- GET  /api/customers/:id → get customer by UUID + order history
- PUT  /api/customers/:id → update name, address, notes

### Orders
- GET  /api/orders → list orders for branch (filterable by status, date)
- POST /api/orders → create order + items in single transaction,
  auto-generate token, copy prices from price_list at time of creation
- GET  /api/orders/:id → full order with customer and items
- PUT  /api/orders/:id/status → update status only
- GET  /api/orders/:id/whatsapp → returns formatted wa.me URL with bill

### Price list
- GET  /api/price-list → all active items (no auth needed for staff)
- POST /api/price-list → add item (owner only)
- PUT  /api/price-list/:id → update price or name (owner only)
- PUT  /api/price-list/:id/toggle → activate or deactivate (owner only)

### Inventory
- GET  /api/inventory → branch inventory list
- POST /api/inventory → add item
- PUT  /api/inventory/:id → update quantity or threshold
- GET  /api/inventory/low-stock → items below threshold

### Reports (owner only)
- GET  /api/reports/daily?branchId=&date= → daily sales total and breakdown
- GET  /api/reports/branches → all owned branches summary for today
- GET  /api/reports/orders?branchId=&from=&to= → order count and revenue by range

### Health
- GET  /api/health → { status: 'ok', timestamp, environment }

## Middleware stack (apply in this order)
1. helmet() — security headers
2. cors() — allow localhost:5173 in dev
3. express.json() — parse body
4. rateLimit() — 100 requests per 15 minutes per IP
5. authenticate — validate JWT, attach user to req.user
6. scopeBranch — attach branchId or ownerId filter to req.scope
   (applied per route, not globally)

## Token generation for orders
Format: [BRANCH_CODE]-[DATE]-[SEQUENCE]
Example: LHR-250502-001
Branch code: first 3 letters of branch name, uppercase
Date: YYMMDD
Sequence: 3-digit daily counter per branch, resets at midnight
Generate in Node.js, store in orders.token

## Phone normalization utility
Create src/utils/phone.js with a normalizePhone(input) function:
- Remove all spaces, dashes, brackets, dots
- If starts with +92 → replace +92 with 0
- If starts with 92 (without +) → replace 92 with 0
- If starts with 3 (10 digits total) → prepend 0
- Validate result is exactly 11 digits starting with 03
- Throw validation error if invalid after normalization

## WhatsApp bill format
wa.me/92{phone}?text={encoded message}
Strip leading 0 from phone and replace with 92 for wa.me URL.
Bill message format:
*{Branch Name} Laundry*
Token: {token}
Date: {date}
Customer: {name}

{quantity}x {item_name} — Rs.{total}
...

*Total: Rs.{total_pkr}*
Status: {status}
Thank you!

## Environment variables (.env in backend/)
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=laundry_dev
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=a_long_random_secret_string_min_32_chars
JWT_EXPIRES_IN=7d
NODE_ENV=development

## Development notes
- Backend runs on localhost:3000
- Frontend runs on localhost:5173 (Vite default)
- Frontend proxies /api calls to localhost:3000 via vite.config.js
- PostgreSQL runs locally via Homebrew on Mac
- No Docker required
- No ORM — use raw pg (node-postgres) queries only
- All UUIDs generated with crypto.randomUUID() in Node.js
- No uuid-ossp PostgreSQL extension needed

## What to build — current task
Complete all four remaining steps in order. Each step is
independent enough to be executed as a separate Claude Code
session if needed.

---

### STEP 1 — Close the offline sync gap (Phase 4)
The frontend has PouchDB set up but the backend has no sync
endpoint yet. This is the most critical missing piece.

1. Install pouchdb and express-pouchdb in the backend:
   cd backend && npm install pouchdb express-pouchdb

2. Create backend/src/config/pouch.js:
   Initialize PouchDB with a local file store at ./pouchdata/
   Export a getDB(branchId) function that returns a PouchDB
   instance named branch_{branchId}

3. Mount the sync endpoint in server.js AFTER the authenticate
   middleware:
   app.use('/api/sync', authenticate, scopeBranch,
     expressPouchDB(SyncPouchDB, { mode: 'minimumForPouchDB' }))
   This gives PouchDB on the frontend a CouchDB-compatible
   endpoint to replicate to.

4. Create backend/src/workers/syncWorker.js:
   Watch each branch PouchDB using pouch.changes({ live: true })
   On change: if doc.type === 'order' → upsert into PostgreSQL orders
   and order_items tables using INSERT ... ON CONFLICT DO UPDATE
   If doc.type === 'customer' → upsert into customers table
   If doc.type === 'inventory' → upsert into inventory table
   Log errors but never crash the worker

5. In server.js after app.listen(): query all branch IDs from
   PostgreSQL and call watchBranch(branch.id) for each one

6. Update frontend/src/context/SyncContext.jsx:
   Point the remote PouchDB at /api/sync/branch_{branchId}
   Pass the JWT as Authorization header in PouchDB fetch options
   Sync events: change → 'syncing', paused → 'synced',
   error → 'offline'
   The SyncDot component reads this state

Verify: Create an order while Chrome DevTools is set to Offline.
Set back to Online. The order should appear in PostgreSQL
within a few seconds. Sync dot goes green.

---

### STEP 2 — Wire frontend to real backend API
Replace all mock data in frontend/src/utils/api.js with real
fetch calls to the backend. Do this screen by screen:

1. AuthContext.jsx login():
   POST /api/auth/login → get JWT → decode → setUser
   Remove all hardcoded demo credentials

2. StaffDashboard:
   GET /api/orders?date=today → real orders list and stat counts
   Auto-refresh every 30 seconds with setInterval
   Show LoadingSpinner while loading, EmptyState if no orders

3. NewOrderPage — all 4 steps:
   Step 1: GET /api/customers/search?phone= (with normalized phone)
   Step 1 new customer: POST /api/customers
   Step 2: GET /api/price-list (load once, cache in state)
   Step 3: POST /api/orders with { customer_id, due_date, notes,
     items: [{ price_list_id, quantity }] }
   Step 4: GET /api/orders/:id/whatsapp for WhatsApp button URL
   Receipt shows real token from API response

4. OrdersListPage:
   GET /api/orders?status= for filter tabs
   GET /api/orders?search= for token/customer search

5. OrderDetailPage:
   GET /api/orders/:id for full order with items
   PUT /api/orders/:id/status to advance status
   GET /api/orders/:id/whatsapp for WhatsApp button

6. CustomersPage:
   GET /api/customers/search?phone=
   GET /api/customers/:id for order history

7. InventoryPage:
   GET /api/inventory
   PUT /api/inventory/:id for quantity updates
   GET /api/inventory/low-stock

8. OwnerDashboard and ReportsPage:
   GET /api/reports/branches
   GET /api/reports/daily?branchId=&date=
   GET /api/reports/orders?branchId=&from=&to=
   Feed real data into recharts BarChart components

Every API call must:
- Send Authorization: Bearer {token} header
- Show toast.error() on failure
- If 401 returned: clear localStorage and redirect to /login
- Handle loading and error states properly

Verify: Every screen shows real data from PostgreSQL.
Open Network tab in DevTools — zero calls should return
mock data. All API calls go to localhost:3000.

---

### STEP 3 — End-to-end verification (manual testing)
After Steps 1 and 2 are complete, verify these scenarios:

1. Online order flow:
   Login as staff → search customer by phone →
   create order with 3+ items → confirm receipt and token →
   verify in PostgreSQL → advance through all statuses →
   check customer order history shows the order

2. Offline flow:
   DevTools → Network → Offline
   Create an order — app must still work
   Check IndexedDB → laundry_local → order document there
   Set Network → Online
   Within 5 seconds → order in PostgreSQL
   Sync dot turns green

3. Security isolation:
   Staff from Branch A cannot see Branch B orders
   Owner A cannot see Owner B's branches or reports
   Test by calling API directly with wrong-branch JWT

4. Print and WhatsApp:
   Receipt print preview shows only receipt content
   WhatsApp URL opens wa.me with pre-filled bill message
   Phone format correct: 03xx → 92xx for wa.me

5. Mobile:
   Test all screens at 375px width in DevTools
   Bottom tab bar visible, sidebar hidden
   No horizontal scroll anywhere

---

### STEP 4 — Deployment (do this last, after all tests pass)
Only start this step when Steps 1–3 are fully verified.

1. Buy Contabo VPS 20 at contabo.com — Singapore region,
   Ubuntu 24.04 LTS

2. SSH in as root, then:
   - apt update && apt upgrade -y
   - Create user: adduser washpro, add to sudo group
   - Set up UFW: allow 22, 80, 443 only, enable
   - Disable root SSH login in /etc/ssh/sshd_config

3. Install stack:
   - Node.js 20 LTS via NodeSource script
   - PostgreSQL 16 via apt
   - Nginx via apt
   - PM2 via npm install -g pm2

4. Create production database:
   sudo -u postgres psql
   CREATE DATABASE laundry_prod;
   CREATE USER laundry_user WITH PASSWORD 'strong_pass';
   GRANT ALL PRIVILEGES ON DATABASE laundry_prod TO laundry_user;

5. Buy domain (namecheap.com or cloudflare.com)
   Add A record pointing domain to VPS IP
   Wait for DNS propagation (check dnschecker.org)

6. Configure Nginx at /etc/nginx/sites-available/washpro:
   - /api/* → proxy to localhost:3000
   - /* → serve frontend/dist/index.html
   Install SSL: certbot --nginx -d yourdomain.com

7. Push code to GitHub. On VPS:
   git clone your-repo to /var/www/washpro
   cd backend && npm install --production
   Create .env with production values (strong JWT secret,
   production DB credentials, NODE_ENV=production)
   Run migrations: node database/migrate.js
   cd ../frontend && npm install && npm run build

8. Start backend:
   pm2 start server.js --name washpro-api
   pm2 startup && pm2 save

9. Set up daily PostgreSQL backup cron job:
   Script: pg_dump laundry_prod > /var/backups/db_$(date +%Y%m%d).sql
   Schedule: 0 21 * * * (9pm UTC = 2am PKT)
   Retain: 30 days

10. Set up UptimeRobot (uptimerobot.com — free):
    Monitor: https://yourdomain.com/api/health every 5 minutes
    Alert: client email or WhatsApp webhook

Verify: https://yourdomain.com loads the app.
Login works. Create a real order. Check PostgreSQL on VPS.
Backup runs and creates file.
UptimeRobot shows monitor as UP.