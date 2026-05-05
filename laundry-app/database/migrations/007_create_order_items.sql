CREATE TABLE IF NOT EXISTS order_items (
  id CHAR(36) PRIMARY KEY,
  order_id CHAR(36) NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  price_list_id CHAR(36) REFERENCES price_list(id),
  item_name VARCHAR(100) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price_pkr DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
