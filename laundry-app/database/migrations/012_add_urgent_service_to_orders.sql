ALTER TABLE orders
  ADD COLUMN urgent_service BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN urgent_extra_pkr DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE orders
  ADD CONSTRAINT orders_urgent_extra_non_negative CHECK (urgent_extra_pkr >= 0),
  ADD CONSTRAINT orders_urgent_extra_required_when_urgent
    CHECK (
      (urgent_service = FALSE AND urgent_extra_pkr = 0)
      OR (urgent_service = TRUE AND urgent_extra_pkr > 0)
    );
