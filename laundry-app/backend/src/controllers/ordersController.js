const pool = require('../config/db');
const { generateOrderToken } = require('../utils/token');
const { extractPiecesFromItemName } = require('../utils/pieces');

async function list(req, res, next) {
  try {
    const { status, date, search } = req.query;
    const branchId = req.scope.branchId;

    let query = `
      SELECT
        o.*,
        c.name AS customer_name,
        c.phone AS customer_phone,
        COALESCE(SUM(oi.quantity), 0)::int AS total_quantity,
        COALESCE(SUM(oi.quantity * COALESCE(oi.pieces, 1)), 0)::int AS total_pieces
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.branch_id = $1
    `;
    const params = [branchId];

    if (status) {
      params.push(status);
      query += ` AND o.status = $${params.length}`;
    }

    if (date) {
      const dayStart = date === 'today' ? new Date() : new Date(date);
      if (Number.isNaN(dayStart.getTime())) {
        return res.status(400).json({ error: 'Invalid date filter' });
      }
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      params.push(dayStart.toISOString(), dayEnd.toISOString());
      query += ` AND o.created_at >= $${params.length - 1} AND o.created_at < $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (o.token ILIKE $${params.length} OR c.name ILIKE $${params.length} OR c.phone ILIKE $${params.length})`;
    }

    query += ' GROUP BY o.id, c.name, c.phone ORDER BY o.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ orders: result.rows });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { customer_id, items, due_date, notes, urgent_service, urgent_extra_pkr } = req.body;
    const branchId = req.scope.branchId;
    const userId = req.user.userId;

    if (!customer_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'customer_id and at least one item are required' });
    }
    if (!due_date) {
      return res.status(400).json({ error: 'due_date is required' });
    }

    const urgentService = urgent_service === true || urgent_service === 'true';
    const parsedUrgentExtra = Number(urgent_extra_pkr);
    const urgentExtra = urgentService
      ? parsedUrgentExtra
      : 0;

    if (urgentService && (!Number.isFinite(parsedUrgentExtra) || parsedUrgentExtra <= 0)) {
      return res.status(400).json({
        error: 'urgent_extra_pkr is required and must be greater than 0 when urgent_service is true',
      });
    }

    const customerCheck = await client.query(
      'SELECT id FROM customers WHERE id = $1 AND branch_id = $2',
      [customer_id, branchId]
    );
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found in this branch' });
    }

    const branchResult = await client.query('SELECT name FROM branches WHERE id = $1', [branchId]);
    const branchName = branchResult.rows[0].name;
    const token = await generateOrderToken(branchId, branchName);

    const orderId = crypto.randomUUID();

    await client.query(
      `INSERT INTO orders (
         id, branch_id, customer_id, token, status, due_date, notes, created_by, urgent_service, urgent_extra_pkr
       )
       VALUES ($1, $2, $3, $4, 'received', $5, $6, $7, $8, $9)`,
      [orderId, branchId, customer_id, token, due_date, notes || null, userId, urgentService, urgentExtra]
    );

    let subtotal = 0;

    for (const item of items) {
      const { price_list_id, quantity } = item;
      if (!price_list_id || !quantity || quantity < 1) {
        throw Object.assign(new Error('Each item needs price_list_id and quantity >= 1'), { status: 400 });
      }

      const priceResult = await client.query(
        'SELECT item_name, price_pkr FROM price_list WHERE id = $1 AND is_active = true',
        [price_list_id]
      );
      if (priceResult.rows.length === 0) {
        throw Object.assign(new Error(`Price list item not found: ${price_list_id}`), { status: 400 });
      }

      const { item_name, price_pkr } = priceResult.rows[0];
      const pieces = extractPiecesFromItemName(item_name);
      const unitPrice = parseFloat(price_pkr);
      subtotal += unitPrice * quantity;

      const itemId = crypto.randomUUID();
      await client.query(
        `INSERT INTO order_items (id, order_id, price_list_id, item_name, quantity, pieces, unit_price_pkr)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [itemId, orderId, price_list_id, item_name, quantity, pieces, unitPrice]
      );
    }

    const total = subtotal + urgentExtra;
    await client.query('UPDATE orders SET total_pkr = $1 WHERE id = $2', [total, orderId]);

    await client.query('COMMIT');

    const order = await pool.query(
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
       WHERE o.id = $1
       GROUP BY o.id`,
      [orderId]
    );

    res.status(201).json({ order: order.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

async function getById(req, res, next) {
  try {
    const branchId = req.scope.branchId;

    const result = await pool.query(
      `SELECT o.*,
         c.name AS customer_name, c.phone AS customer_phone,
         json_agg(
           json_build_object(
             'id', oi.id,
             'item_name', oi.item_name,
             'quantity', oi.quantity,
             'pieces', COALESCE(oi.pieces, 1),
             'unit_price_pkr', oi.unit_price_pkr
           ) ORDER BY oi.created_at
         ) AS items
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.id = $1 AND o.branch_id = $2
       GROUP BY o.id, c.name, c.phone`,
      [req.params.id, branchId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const branchId = req.scope.branchId;
    const { status } = req.body;
    const validStatuses = ['received', 'washing', 'ready', 'delivered'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
    }

    const result = await pool.query(
      `UPDATE orders SET status = $1, updated_at = NOW()
       WHERE id = $2 AND branch_id = $3
       RETURNING *`,
      [status, req.params.id, branchId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function whatsapp(req, res, next) {
  try {
    const branchId = req.scope.branchId;

    const result = await pool.query(
      `SELECT o.*, c.name AS customer_name, c.phone AS customer_phone,
         b.name AS branch_name,
         json_agg(
           json_build_object(
             'item_name', oi.item_name,
             'quantity', oi.quantity,
             'pieces', COALESCE(oi.pieces, 1),
             'unit_price_pkr', oi.unit_price_pkr
           ) ORDER BY oi.created_at
         ) AS items
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       JOIN branches b ON b.id = o.branch_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.id = $1 AND o.branch_id = $2
       GROUP BY o.id, c.name, c.phone, b.name`,
      [req.params.id, branchId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const o = result.rows[0];
    const date = new Date(o.created_at).toLocaleDateString('en-PK', {
      day: '2-digit', month: 'short', year: 'numeric',
    });

    let itemLines = '';
    for (const item of o.items) {
      if (item && item.item_name) {
        const lineTotal = (parseFloat(item.unit_price_pkr) * item.quantity).toFixed(0);
        const pieces = Number(item.pieces || 1);
        itemLines += `${item.quantity}x (${pieces} pcs) ${item.item_name} — Rs.${lineTotal}\n`;
      }
    }

    const urgentService = Boolean(o.urgent_service);
    const urgentExtra = parseFloat(o.urgent_extra_pkr || 0);
    const urgentLine = urgentService ? `Urgent service extra: Rs.${urgentExtra.toFixed(0)}\n` : '';

    const message =
      `*${o.branch_name} Laundry*\n` +
      `Token: ${o.token}\n` +
      `Date: ${date}\n` +
      `Customer: ${o.customer_name}\n\n` +
      itemLines +
      urgentLine +
      `\n*Total: Rs.${parseFloat(o.total_pkr).toFixed(0)}*\n` +
      `Status: ${o.status}\n` +
      `Thank you!`;

    const waPhone = '92' + o.customer_phone.slice(1);
    const url = `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;

    res.json({ url, message });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, getById, updateStatus, whatsapp };
