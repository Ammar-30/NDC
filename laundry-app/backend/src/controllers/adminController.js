const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const pool = require('../config/db');
const { logActivity } = require('../utils/activityLogger');

function getIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null;
}

// ── OVERVIEW STATS ──────────────────────────────────────────────────────────

async function getStats(req, res, next) {
  try {
    const [owners, branches, users, orders, revenue] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM owners'),
      pool.query('SELECT COUNT(*) FROM branches'),
      pool.query("SELECT COUNT(*) FROM users"),
      pool.query("SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURRENT_DATE"),
      pool.query("SELECT COALESCE(SUM(total_pkr),0) AS total FROM orders WHERE DATE(created_at) = CURRENT_DATE"),
    ]);
    res.json({
      totalOwners:   Number(owners.rows[0].count),
      totalBranches: Number(branches.rows[0].count),
      totalUsers:    Number(users.rows[0].count),
      ordersToday:   Number(orders.rows[0].count),
      revenueToday:  Number(revenue.rows[0].total),
    });
  } catch (err) { next(err); }
}

// ── OWNERS ───────────────────────────────────────────────────────────────────

async function listOwners(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT o.id, o.name, o.email, o.is_active, o.created_at,
              COUNT(b.id) AS branch_count
       FROM owners o
       LEFT JOIN branches b ON b.owner_id = o.id
       GROUP BY o.id ORDER BY o.created_at DESC`
    );
    res.json({ owners: result.rows });
  } catch (err) { next(err); }
}

async function createOwner(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });

    const exists = await pool.query('SELECT id FROM owners WHERE email = $1', [email.toLowerCase()]);
    if (exists.rows.length) return res.status(409).json({ error: 'Email already in use' });

    const hash = await bcrypt.hash(password, 10);
    const id = randomUUID();
    const result = await pool.query(
      `INSERT INTO owners (id, name, email, password_hash) VALUES ($1,$2,$3,$4) RETURNING id, name, email, is_active, created_at`,
      [id, name, email.toLowerCase(), hash]
    );

    logActivity(pool, req.user, 'CREATE_OWNER', 'owner', id, { name, email }, getIp(req)).catch(() => {});
    res.status(201).json({ owner: result.rows[0] });
  } catch (err) { next(err); }
}

async function updateOwner(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, password, is_active } = req.body;

    const sets = [];
    const vals = [];
    let i = 1;

    if (name       !== undefined) { sets.push(`name=$${i++}`);          vals.push(name); }
    if (email      !== undefined) { sets.push(`email=$${i++}`);         vals.push(email.toLowerCase()); }
    if (is_active  !== undefined) { sets.push(`is_active=$${i++}`);     vals.push(is_active); }
    if (password)                 { sets.push(`password_hash=$${i++}`); vals.push(await bcrypt.hash(password, 10)); }

    if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });

    vals.push(id);
    const result = await pool.query(
      `UPDATE owners SET ${sets.join(',')} WHERE id=$${i} RETURNING id, name, email, is_active, created_at`,
      vals
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Owner not found' });

    logActivity(pool, req.user, 'UPDATE_OWNER', 'owner', id, { fields: Object.keys(req.body) }, getIp(req)).catch(() => {});
    res.json({ owner: result.rows[0] });
  } catch (err) { next(err); }
}

// ── BRANCHES ─────────────────────────────────────────────────────────────────

async function listBranches(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT b.id, b.name, b.city, b.address, b.is_active, b.created_at,
              o.name AS owner_name, o.id AS owner_id,
              COUNT(DISTINCT u.id) AS staff_count
       FROM branches b
       JOIN owners o ON o.id = b.owner_id
       LEFT JOIN users u ON u.branch_id = b.id
       GROUP BY b.id, o.name, o.id ORDER BY b.created_at DESC`
    );
    res.json({ branches: result.rows });
  } catch (err) { next(err); }
}

async function createBranch(req, res, next) {
  try {
    const { name, city, address, owner_id } = req.body;
    if (!name || !city || !owner_id) return res.status(400).json({ error: 'name, city, owner_id required' });

    const ownerCheck = await pool.query('SELECT id FROM owners WHERE id = $1', [owner_id]);
    if (!ownerCheck.rows.length) return res.status(404).json({ error: 'Owner not found' });

    const id = randomUUID();
    const result = await pool.query(
      `INSERT INTO branches (id, name, city, address, owner_id) VALUES ($1,$2,$3,$4,$5)
       RETURNING id, name, city, address, is_active, created_at`,
      [id, name, city, address || null, owner_id]
    );

    logActivity(pool, req.user, 'CREATE_BRANCH', 'branch', id, { name, city, owner_id }, getIp(req)).catch(() => {});
    res.status(201).json({ branch: result.rows[0] });
  } catch (err) { next(err); }
}

async function updateBranch(req, res, next) {
  try {
    const { id } = req.params;
    const { name, city, address, is_active } = req.body;

    const sets = [];
    const vals = [];
    let i = 1;

    if (name      !== undefined) { sets.push(`name=$${i++}`);      vals.push(name); }
    if (city      !== undefined) { sets.push(`city=$${i++}`);      vals.push(city); }
    if (address   !== undefined) { sets.push(`address=$${i++}`);   vals.push(address); }
    if (is_active !== undefined) { sets.push(`is_active=$${i++}`); vals.push(is_active); }

    if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });

    vals.push(id);
    const result = await pool.query(
      `UPDATE branches SET ${sets.join(',')} WHERE id=$${i} RETURNING id, name, city, address, is_active, created_at`,
      vals
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Branch not found' });

    logActivity(pool, req.user, 'UPDATE_BRANCH', 'branch', id, { fields: Object.keys(req.body) }, getIp(req)).catch(() => {});
    res.json({ branch: result.rows[0] });
  } catch (err) { next(err); }
}

// ── USERS ─────────────────────────────────────────────────────────────────────

async function listUsers(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at,
              b.name AS branch_name, b.id AS branch_id,
              o.name AS owner_name
       FROM users u
       JOIN branches b ON b.id = u.branch_id
       JOIN owners o ON o.id = b.owner_id
       ORDER BY u.created_at DESC`
    );
    res.json({ users: result.rows });
  } catch (err) { next(err); }
}

async function createUser(req, res, next) {
  try {
    const { name, email, password, role, branch_id } = req.body;
    if (!name || !email || !password || !role || !branch_id)
      return res.status(400).json({ error: 'name, email, password, role, branch_id required' });
    if (!['staff', 'owner'].includes(role))
      return res.status(400).json({ error: 'role must be staff or owner' });

    const branchCheck = await pool.query('SELECT id FROM branches WHERE id = $1', [branch_id]);
    if (!branchCheck.rows.length) return res.status(404).json({ error: 'Branch not found' });

    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (exists.rows.length) return res.status(409).json({ error: 'Email already in use' });

    const hash = await bcrypt.hash(password, 10);
    const id = randomUUID();
    const result = await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role, branch_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, email, role, is_active, created_at, branch_id`,
      [id, name, email.toLowerCase(), hash, role, branch_id]
    );

    logActivity(pool, req.user, 'CREATE_USER', 'user', id, { name, email, role, branch_id }, getIp(req)).catch(() => {});
    res.status(201).json({ user: result.rows[0] });
  } catch (err) { next(err); }
}

async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, password, role, branch_id, is_active } = req.body;

    const sets = [];
    const vals = [];
    let i = 1;

    if (name      !== undefined) { sets.push(`name=$${i++}`);          vals.push(name); }
    if (email     !== undefined) { sets.push(`email=$${i++}`);         vals.push(email.toLowerCase()); }
    if (role      !== undefined) { sets.push(`role=$${i++}`);          vals.push(role); }
    if (branch_id !== undefined) { sets.push(`branch_id=$${i++}`);     vals.push(branch_id); }
    if (is_active !== undefined) { sets.push(`is_active=$${i++}`);     vals.push(is_active); }
    if (password)                { sets.push(`password_hash=$${i++}`); vals.push(await bcrypt.hash(password, 10)); }

    if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });

    vals.push(id);
    const result = await pool.query(
      `UPDATE users SET ${sets.join(',')} WHERE id=$${i} RETURNING id, name, email, role, is_active, created_at, branch_id`,
      vals
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });

    logActivity(pool, req.user, 'UPDATE_USER', 'user', id, { fields: Object.keys(req.body) }, getIp(req)).catch(() => {});
    res.json({ user: result.rows[0] });
  } catch (err) { next(err); }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE users SET is_active = FALSE WHERE id = $1 RETURNING id`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });

    logActivity(pool, req.user, 'DEACTIVATE_USER', 'user', id, null, getIp(req)).catch(() => {});
    res.json({ ok: true });
  } catch (err) { next(err); }
}

// ── ADMINS (self-management) ──────────────────────────────────────────────────

async function listAdmins(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, name, email, is_active, created_at FROM admins ORDER BY created_at DESC`
    );
    res.json({ admins: result.rows });
  } catch (err) { next(err); }
}

async function createAdmin(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });

    const exists = await pool.query('SELECT id FROM admins WHERE email = $1', [email.toLowerCase()]);
    if (exists.rows.length) return res.status(409).json({ error: 'Email already in use' });

    const hash = await bcrypt.hash(password, 10);
    const id = randomUUID();
    const result = await pool.query(
      `INSERT INTO admins (id, name, email, password_hash) VALUES ($1,$2,$3,$4)
       RETURNING id, name, email, is_active, created_at`,
      [id, name, email.toLowerCase(), hash]
    );

    logActivity(pool, req.user, 'CREATE_ADMIN', 'admin', id, { name, email }, getIp(req)).catch(() => {});
    res.status(201).json({ admin: result.rows[0] });
  } catch (err) { next(err); }
}

async function updateAdmin(req, res, next) {
  try {
    const { id } = req.params;
    const { name, password, is_active } = req.body;

    const sets = [];
    const vals = [];
    let i = 1;

    if (name      !== undefined) { sets.push(`name=$${i++}`);          vals.push(name); }
    if (is_active !== undefined) { sets.push(`is_active=$${i++}`);     vals.push(is_active); }
    if (password)                { sets.push(`password_hash=$${i++}`); vals.push(await bcrypt.hash(password, 10)); }

    if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });

    vals.push(id);
    const result = await pool.query(
      `UPDATE admins SET ${sets.join(',')} WHERE id=$${i} RETURNING id, name, email, is_active, created_at`,
      vals
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Admin not found' });

    logActivity(pool, req.user, 'UPDATE_ADMIN', 'admin', id, { fields: Object.keys(req.body) }, getIp(req)).catch(() => {});
    res.json({ admin: result.rows[0] });
  } catch (err) { next(err); }
}

// ── ACTIVITY LOGS ─────────────────────────────────────────────────────────────

async function getActivityLogs(req, res, next) {
  try {
    const { page = 1, limit = 50, actor_id, action, entity_type, from, to } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const conditions = [];
    const vals = [];
    let i = 1;

    if (actor_id)    { conditions.push(`actor_id = $${i++}`);                             vals.push(actor_id); }
    if (action)      { conditions.push(`action ILIKE $${i++}`);                           vals.push(`%${action}%`); }
    if (entity_type) { conditions.push(`entity_type = $${i++}`);                         vals.push(entity_type); }
    if (from)        { conditions.push(`created_at >= $${i++}`);                          vals.push(from); }
    if (to)          { conditions.push(`created_at <= $${i++}`);                          vals.push(to); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows, count] = await Promise.all([
      pool.query(
        `SELECT * FROM activity_logs ${where} ORDER BY created_at DESC LIMIT $${i} OFFSET $${i + 1}`,
        [...vals, Number(limit), offset]
      ),
      pool.query(`SELECT COUNT(*) FROM activity_logs ${where}`, vals),
    ]);

    res.json({
      logs:  rows.rows,
      total: Number(count.rows[0].count),
      page:  Number(page),
      limit: Number(limit),
    });
  } catch (err) { next(err); }
}

module.exports = {
  getStats,
  listOwners, createOwner, updateOwner,
  listBranches, createBranch, updateBranch,
  listUsers, createUser, updateUser, deleteUser,
  listAdmins, createAdmin, updateAdmin,
  getActivityLogs,
};
