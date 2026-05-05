const pool = require('../config/db');
const { randomUUID } = require('crypto');
const { extractPiecesFromItemName } = require('../utils/pieces');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ts(val) {
  // Coerce ISO string or Date to a value safe for pg TIMESTAMP params.
  // Returns null when val is missing/invalid so NOT NULL columns blow up loudly.
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

// ─── Order upsert ─────────────────────────────────────────────────────────────
// Expected document shape (created by NewOrderPage):
// { _id, type:'order', id, branch_id, customer_id, token, status,
//   drop_off_at, due_date, total_pkr, urgent_service, urgent_extra_pkr, notes, created_by, created_at,
//   updated_at, items:[{ id, price_list_id, item_name, quantity, pieces, unit_price_pkr }] }

async function upsertOrder(doc, branchId) {
  const orderId = doc.id || doc._id.replace(/^order_/, '');

  await pool.query(
    `INSERT INTO orders
       (id, branch_id, customer_id, token, status,
        drop_off_at, due_date, total_pkr, urgent_service, urgent_extra_pkr, notes,
        created_by, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     ON CONFLICT (id) DO UPDATE SET
       status      = EXCLUDED.status,
       total_pkr   = EXCLUDED.total_pkr,
       urgent_service = EXCLUDED.urgent_service,
       urgent_extra_pkr = EXCLUDED.urgent_extra_pkr,
       notes       = EXCLUDED.notes,
       updated_at  = EXCLUDED.updated_at`,
    [
      orderId,
      branchId,
      doc.customer_id,
      doc.token,
      doc.status || 'received',
      ts(doc.drop_off_at) || new Date(),
      ts(doc.due_date),
      doc.total_pkr || 0,
      doc.urgent_service === true,
      Number(doc.urgent_extra_pkr) || 0,
      doc.notes || null,
      doc.created_by || null,
      ts(doc.created_at) || new Date(),
      ts(doc.updated_at) || new Date(),
    ]
  );

  const items = Array.isArray(doc.items) ? doc.items : [];
  for (const item of items) {
    await pool.query(
      `INSERT INTO order_items
         (id, order_id, price_list_id, item_name, quantity, pieces, unit_price_pkr)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (id) DO UPDATE SET
         quantity       = EXCLUDED.quantity,
         pieces         = EXCLUDED.pieces,
         unit_price_pkr = EXCLUDED.unit_price_pkr`,
      [
        item.id || randomUUID(),
        orderId,
        item.price_list_id || null,
        item.item_name,
        item.quantity,
        item.pieces || extractPiecesFromItemName(item.item_name),
        item.unit_price_pkr,
      ]
    );
  }

  console.log(`[syncWorker] order ${orderId} upserted (branch ${branchId})`);
}

// ─── Customer upsert ──────────────────────────────────────────────────────────
// { _id, type:'customer', id, branch_id, name, phone, address, notes, created_at }

async function upsertCustomer(doc, branchId) {
  const customerId = doc.id || doc._id.replace(/^customer_/, '');

  await pool.query(
    `INSERT INTO customers
       (id, branch_id, name, phone, address, notes, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (id) DO UPDATE SET
       name    = EXCLUDED.name,
       phone   = EXCLUDED.phone,
       address = EXCLUDED.address,
       notes   = EXCLUDED.notes`,
    [
      customerId,
      branchId,
      doc.name,
      doc.phone,
      doc.address || null,
      doc.notes || null,
      ts(doc.created_at) || new Date(),
    ]
  );

  console.log(`[syncWorker] customer ${customerId} upserted (branch ${branchId})`);
}

// ─── Inventory upsert ─────────────────────────────────────────────────────────
// { _id, type:'inventory', id, branch_id, item_name, category, quantity,
//   low_stock_threshold, updated_at }

async function upsertInventory(doc, branchId) {
  const inventoryId = doc.id || doc._id.replace(/^inventory_/, '');

  await pool.query(
    `INSERT INTO inventory
       (id, branch_id, item_name, category, quantity, low_stock_threshold, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (id) DO UPDATE SET
       item_name           = EXCLUDED.item_name,
       quantity            = EXCLUDED.quantity,
       low_stock_threshold = EXCLUDED.low_stock_threshold,
       updated_at          = EXCLUDED.updated_at`,
    [
      inventoryId,
      branchId,
      doc.item_name,
      doc.category || 'supplies',
      doc.quantity || 0,
      doc.low_stock_threshold || 10,
      ts(doc.updated_at) || new Date(),
    ]
  );

  console.log(`[syncWorker] inventory ${inventoryId} upserted (branch ${branchId})`);
}

// ─── Public entry point ───────────────────────────────────────────────────────
// Called from the sync route for every non-deleted document received.
// Errors are caught by the caller — this function must never throw silently.

async function processDoc(doc, branchId) {
  if (!doc || !doc.type) return;

  // Security: reject if branch_id in the doc doesn't match the JWT scope.
  // branch_id may be absent for legacy docs — allow those through.
  if (doc.branch_id && doc.branch_id !== branchId) {
    console.warn(`[syncWorker] branch mismatch: doc.branch_id=${doc.branch_id} scope=${branchId}`);
    return;
  }

  switch (doc.type) {
    case 'order':     return upsertOrder(doc, branchId);
    case 'customer':  return upsertCustomer(doc, branchId);
    case 'inventory': return upsertInventory(doc, branchId);
    default:
      // Unknown doc types are silently ignored.
  }
}

module.exports = { processDoc };
