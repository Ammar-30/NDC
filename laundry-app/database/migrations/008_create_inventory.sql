CREATE TABLE IF NOT EXISTS inventory (
  id CHAR(36) PRIMARY KEY,
  branch_id CHAR(36) NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  item_name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('supplies','equipment')),
  quantity INT NOT NULL DEFAULT 0,
  low_stock_threshold INT NOT NULL DEFAULT 10,
  updated_at TIMESTAMP DEFAULT NOW()
);
