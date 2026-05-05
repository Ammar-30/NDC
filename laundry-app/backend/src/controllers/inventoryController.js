const pool = require('../config/db');

async function list(req, res, next) {
  try {
    const branchId = req.scope.branchId;
    const result = await pool.query(
      'SELECT * FROM inventory WHERE branch_id = $1 ORDER BY item_name',
      [branchId]
    );
    res.json({ items: result.rows });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const branchId = req.scope.branchId;
    const { item_name, category, quantity, low_stock_threshold } = req.body;

    if (!item_name || !category) {
      return res.status(400).json({ error: 'item_name and category are required' });
    }
    if (!['supplies', 'equipment'].includes(category)) {
      return res.status(400).json({ error: 'category must be supplies or equipment' });
    }

    const id = crypto.randomUUID();
    const result = await pool.query(
      `INSERT INTO inventory (id, branch_id, item_name, category, quantity, low_stock_threshold)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, branchId, item_name, category, quantity ?? 0, low_stock_threshold ?? 10]
    );

    res.status(201).json({ item: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const branchId = req.scope.branchId;
    const { quantity, low_stock_threshold } = req.body;

    const result = await pool.query(
      `UPDATE inventory SET
         quantity = COALESCE($1, quantity),
         low_stock_threshold = COALESCE($2, low_stock_threshold),
         updated_at = NOW()
       WHERE id = $3 AND branch_id = $4
       RETURNING *`,
      [quantity ?? null, low_stock_threshold ?? null, req.params.id, branchId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    res.json({ item: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function lowStock(req, res, next) {
  try {
    const branchId = req.scope.branchId;
    const result = await pool.query(
      'SELECT * FROM inventory WHERE branch_id = $1 AND quantity <= low_stock_threshold ORDER BY item_name',
      [branchId]
    );
    res.json({ items: result.rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, lowStock };
