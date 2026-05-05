const pool = require('../config/db');

async function daily(req, res, next) {
  try {
    const ownerId = req.user.ownerId;
    const { branchId, date } = req.query;

    if (!branchId || !date) {
      return res.status(400).json({ error: 'branchId and date are required' });
    }

    const branchCheck = await pool.query(
      'SELECT id FROM branches WHERE id = $1 AND owner_id = $2',
      [branchId, ownerId]
    );
    if (branchCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Branch not found or not owned by you' });
    }

    const dayStart = new Date(date);
    const dayEnd = new Date(dayStart.getTime() + 86400000);

    const summary = await pool.query(
      `SELECT COUNT(*) AS order_count, COALESCE(SUM(total_pkr), 0) AS total_revenue
       FROM orders
       WHERE branch_id = $1 AND created_at >= $2 AND created_at < $3`,
      [branchId, dayStart.toISOString(), dayEnd.toISOString()]
    );

    const breakdown = await pool.query(
      `SELECT oi.item_name,
         SUM(oi.quantity) AS total_qty,
         SUM(oi.quantity * COALESCE(oi.pieces, 1)) AS total_pieces,
         SUM(oi.quantity * oi.unit_price_pkr) AS total_revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.branch_id = $1 AND o.created_at >= $2 AND o.created_at < $3
       GROUP BY oi.item_name
       ORDER BY total_revenue DESC`,
      [branchId, dayStart.toISOString(), dayEnd.toISOString()]
    );

    res.json({ summary: summary.rows[0], breakdown: breakdown.rows });
  } catch (err) {
    next(err);
  }
}

async function branches(req, res, next) {
  try {
    const ownerId = req.user.ownerId;
    const ref = req.query.date ? new Date(req.query.date) : new Date();
    const dayStart = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
    const dayEnd = new Date(dayStart.getTime() + 86400000);

    const result = await pool.query(
      `SELECT b.id, b.name, b.city,
         COUNT(o.id) AS order_count,
         COALESCE(SUM(o.total_pkr), 0) AS total_revenue
       FROM branches b
       LEFT JOIN orders o
         ON o.branch_id = b.id AND o.created_at >= $2 AND o.created_at < $3
       WHERE b.owner_id = $1
       GROUP BY b.id, b.name, b.city
       ORDER BY b.name`,
      [ownerId, dayStart.toISOString(), dayEnd.toISOString()]
    );

    res.json({ branches: result.rows });
  } catch (err) {
    next(err);
  }
}

async function orders(req, res, next) {
  try {
    const ownerId = req.user.ownerId;
    const { branchId, from, to } = req.query;

    if (!branchId || !from || !to) {
      return res.status(400).json({ error: 'branchId, from, and to dates are required' });
    }

    const branchCheck = await pool.query(
      'SELECT id FROM branches WHERE id = $1 AND owner_id = $2',
      [branchId, ownerId]
    );
    if (branchCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Branch not found or not owned by you' });
    }

    const fromIso = new Date(from).toISOString();
    const toIso = new Date(to + 'T23:59:59').toISOString();

    const daily = await pool.query(
      `SELECT COUNT(*) AS order_count, COALESCE(SUM(total_pkr), 0) AS total_revenue,
         DATE(created_at) AS date
       FROM orders
       WHERE branch_id = $1 AND created_at >= $2 AND created_at <= $3
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [branchId, fromIso, toIso]
    );

    const summary = await pool.query(
      `SELECT
         COUNT(*) AS total_orders,
         COALESCE(SUM(total_pkr), 0) AS total_revenue,
         COALESCE(AVG(total_pkr), 0) AS avg_order_value
       FROM orders
       WHERE branch_id = $1 AND created_at >= $2 AND created_at <= $3`,
      [branchId, fromIso, toIso]
    );

    const topItems = await pool.query(
      `SELECT
         oi.item_name,
         SUM(oi.quantity) AS quantity_sold,
         SUM(oi.quantity * COALESCE(oi.pieces, 1)) AS pieces_sold,
         COALESCE(SUM(oi.quantity * oi.unit_price_pkr), 0) AS total_revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.branch_id = $1 AND o.created_at >= $2 AND o.created_at <= $3
       GROUP BY oi.item_name
       ORDER BY total_revenue DESC, quantity_sold DESC`,
      [branchId, fromIso, toIso]
    );

    res.json({
      summary: summary.rows[0],
      daily: daily.rows,
      top_items: topItems.rows,
      data: daily.rows,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { daily, branches, orders };
