CREATE TABLE IF NOT EXISTS orders (
  id CHAR(36) PRIMARY KEY,
  branch_id CHAR(36) NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  customer_id CHAR(36) NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  token VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('received','washing','ready','delivered')),
  drop_off_at TIMESTAMP DEFAULT NOW(),
  due_date TIMESTAMP NOT NULL,
  total_pkr DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by CHAR(36) REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (branch_id, token)
);
