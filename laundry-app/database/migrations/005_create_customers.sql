CREATE TABLE IF NOT EXISTS customers (
  id CHAR(36) PRIMARY KEY,
  branch_id CHAR(36) NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  name VARCHAR(100) NOT NULL,
  phone CHAR(11) NOT NULL,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (branch_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
