const crypto = require('crypto');
const pool = require('../config/db');
const { extractPiecesFromItemName } = require('../utils/pieces');

function withPieces(item) {
  if (!item) return item;
  return { ...item, pieces: extractPiecesFromItemName(item.item_name) };
}

async function list(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT * FROM price_list WHERE is_active = true ORDER BY item_name'
    );
    res.json({ items: result.rows.map(withPieces) });
  } catch (err) {
    next(err);
  }
}

async function listAll(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT * FROM price_list ORDER BY item_name'
    );
    res.json({ items: result.rows.map(withPieces) });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { item_name, price_pkr } = req.body;
    const normalizedName = String(item_name || '').trim();
    const normalizedPrice = Number(price_pkr);

    if (!normalizedName || price_pkr == null) {
      return res.status(400).json({ error: 'item_name and price_pkr are required' });
    }
    if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
      return res.status(400).json({ error: 'price_pkr must be positive' });
    }

    const id = crypto.randomUUID();
    const result = await pool.query(
      'INSERT INTO price_list (id, item_name, price_pkr) VALUES ($1, $2, $3) RETURNING *',
      [id, normalizedName, normalizedPrice]
    );

    res.status(201).json({ item: withPieces(result.rows[0]) });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { item_name, price_pkr } = req.body;
    const normalizedName = item_name == null ? null : String(item_name).trim();
    const normalizedPrice = price_pkr == null ? null : Number(price_pkr);

    if (normalizedName !== null && !normalizedName) {
      return res.status(400).json({ error: 'item_name cannot be empty' });
    }
    if (normalizedPrice !== null && (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0)) {
      return res.status(400).json({ error: 'price_pkr must be positive' });
    }

    const result = await pool.query(
      `UPDATE price_list SET
         item_name = COALESCE($1, item_name),
         price_pkr = COALESCE($2, price_pkr)
       WHERE id = $3
       RETURNING *`,
      [normalizedName, normalizedPrice, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Price list item not found' });
    }

    res.json({ item: withPieces(result.rows[0]) });
  } catch (err) {
    next(err);
  }
}

async function toggle(req, res, next) {
  try {
    const result = await pool.query(
      'UPDATE price_list SET is_active = NOT is_active WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Price list item not found' });
    }

    res.json({ item: withPieces(result.rows[0]) });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const result = await pool.query(
      'DELETE FROM price_list WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Price list item not found' });
    }

    res.json({ ok: true });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({
        error: 'Cannot delete item already used in orders. Deactivate it instead.',
      });
    }
    next(err);
  }
}

module.exports = { list, listAll, create, update, toggle, remove };
