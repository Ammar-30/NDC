const pool = require('../config/db');
const { normalizePhone } = require('../utils/phone');

async function list(req, res, next) {
  try {
    const branchId = req.scope.branchId;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    let query = `
      SELECT
        c.*,
        COUNT(o.id)::int AS order_count,
        MAX(o.created_at) AS last_order_at
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id AND o.branch_id = c.branch_id
      WHERE c.branch_id = $1
    `;
    const params = [branchId];

    if (search) {
      params.push(`%${search}%`);
      query += `
        AND (
          c.name ILIKE $${params.length}
          OR c.phone ILIKE $${params.length}
          OR COALESCE(c.address, '') ILIKE $${params.length}
          OR COALESCE(c.notes, '') ILIKE $${params.length}
        )
      `;
    }

    query += `
      GROUP BY c.id
      ORDER BY COALESCE(MAX(o.created_at), c.created_at) DESC, c.name ASC
      LIMIT 300
    `;

    const result = await pool.query(query, params);
    res.json({ customers: result.rows });
  } catch (err) {
    next(err);
  }
}

async function search(req, res, next) {
  try {
    const { phone } = req.query;
    const normalized = normalizePhone(phone);
    const branchId = req.scope.branchId;

    const result = await pool.query(
      'SELECT * FROM customers WHERE branch_id = $1 AND phone = $2',
      [branchId, normalized]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = result.rows[0];
    const orders = await pool.query(
      `SELECT o.*, json_agg(
         json_build_object(
           'id', oi.id,
           'item_name', oi.item_name,
           'quantity', oi.quantity,
           'pieces', COALESCE(oi.pieces, 1),
           'unit_price_pkr', oi.unit_price_pkr
         ) ORDER BY oi.created_at
       ) AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.customer_id = $1 AND o.branch_id = $2
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [customer.id, branchId]
    );

    res.json({ customer, orders: orders.rows });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const branchId = req.scope.branchId;

    const result = await pool.query(
      'SELECT * FROM customers WHERE id = $1 AND branch_id = $2',
      [req.params.id, branchId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = result.rows[0];
    const orders = await pool.query(
      `SELECT o.*, json_agg(
         json_build_object(
           'id', oi.id,
           'item_name', oi.item_name,
           'quantity', oi.quantity,
           'pieces', COALESCE(oi.pieces, 1),
           'unit_price_pkr', oi.unit_price_pkr
         ) ORDER BY oi.created_at
       ) AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.customer_id = $1 AND o.branch_id = $2
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [customer.id, branchId]
    );

    res.json({ customer, orders: orders.rows });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, phone, address, notes } = req.body;
    const branchId = req.scope.branchId;

    if (!name) return res.status(400).json({ error: 'name is required' });

    const normalized = normalizePhone(phone);
    const id = crypto.randomUUID();

    const result = await pool.query(
      `INSERT INTO customers (id, branch_id, name, phone, address, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, branchId, name, normalized, address || null, notes || null]
    );

    res.status(201).json({ customer: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Phone number already registered at this branch' });
    }
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const branchId = req.scope.branchId;
    const { name, address, notes } = req.body;

    const existing = await pool.query(
      'SELECT id FROM customers WHERE id = $1 AND branch_id = $2',
      [req.params.id, branchId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const result = await pool.query(
      `UPDATE customers SET
         name = COALESCE($1, name),
         address = COALESCE($2, address),
         notes = COALESCE($3, notes)
       WHERE id = $4 AND branch_id = $5
       RETURNING *`,
      [name || null, address || null, notes || null, req.params.id, branchId]
    );

    res.json({ customer: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, search, getById, create, update };
