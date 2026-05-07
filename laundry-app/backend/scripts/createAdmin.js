/**
 * One-time script to create the first super-admin account.
 * Usage: cd backend && node scripts/createAdmin.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const { Pool } = require('pg');
const readline = require('readline');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(resolve => rl.question(q, resolve));

async function main() {
  console.log('\n=== NDC Super-Admin Setup ===\n');

  const name     = await ask('Full name:     ');
  const email    = await ask('Email:         ');
  const password = await ask('Password:      ');

  if (!name || !email || !password) {
    console.error('All fields required.');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);
  const id   = randomUUID();

  await pool.query(
    `INSERT INTO admins (id, name, email, password_hash) VALUES ($1,$2,$3,$4)`,
    [id, name.trim(), email.toLowerCase().trim(), hash]
  );

  console.log(`\nAdmin created: ${name} <${email}>`);
  console.log('You can now log in at the app with these credentials.\n');

  rl.close();
  await pool.end();
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
