const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const NDC_DOMAIN = 'ndc.com';

function normalizeLoginEmail(input) {
  const raw = String(input || '').toLowerCase().trim();
  if (!raw) return { raw: '', canonical: '' };

  const localPart = raw.includes('@') ? raw.split('@')[0] : raw;
  const canonical = `${localPart}@${NDC_DOMAIN}`;

  return { raw, canonical };
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const { raw, canonical } = normalizeLoginEmail(email);
    const candidateEmails = [...new Set([canonical, raw].filter(Boolean))];

    // Try users table first (staff/owner users with branch association)
    let row = null;
    let userType = null;

    const userResult = await pool.query(
      `SELECT id, name, role, email, password_hash, branch_id
       FROM users
       WHERE email = ANY($1::varchar[])
       ORDER BY (email = $2) DESC
       LIMIT 1`,
      [candidateEmails, canonical]
    );

    if (userResult.rows.length > 0) {
      row = userResult.rows[0];
      userType = 'user';
    } else {
      // Try owners table
      const ownerResult = await pool.query(
        `SELECT id, name, email, password_hash
         FROM owners
         WHERE email = ANY($1::varchar[])
         ORDER BY (email = $2) DESC
         LIMIT 1`,
        [candidateEmails, canonical]
      );
      if (ownerResult.rows.length > 0) {
        row = ownerResult.rows[0];
        userType = 'owner';
      }
    }

    if (!row) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, row.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    let payload;
    if (userType === 'owner') {
      payload = { userId: row.id, name: row.name, role: 'owner', ownerId: row.id };
    } else {
      payload = {
        userId: row.id,
        name: row.name,
        role: row.role,
        branchId: row.branch_id,
        ...(row.role === 'owner' ? { ownerId: row.id } : {}),
      };
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.json({ token, user: { id: row.id, name: row.name, email: row.email, role: payload.role } });
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { login, me };
