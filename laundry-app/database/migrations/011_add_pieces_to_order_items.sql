ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS pieces INT NOT NULL DEFAULT 1;

ALTER TABLE order_items
DROP CONSTRAINT IF EXISTS order_items_pieces_check;

ALTER TABLE order_items
ADD CONSTRAINT order_items_pieces_check CHECK (pieces > 0);

