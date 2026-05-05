const pool = require('../config/db');

async function generateOrderToken(branchId, branchName) {
  const code = branchName.replace(/\s+/g, '').substring(0, 3).toUpperCase();

  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const datePart = `${yy}${mm}${dd}`;

  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayEnd = new Date(dayStart.getTime() + 86400000);

  const result = await pool.query(
    `SELECT COUNT(*) AS cnt FROM orders
     WHERE branch_id = $1 AND created_at >= $2 AND created_at < $3`,
    [branchId, dayStart.toISOString(), dayEnd.toISOString()]
  );

  const seq = String(parseInt(result.rows[0].cnt, 10) + 1).padStart(3, '0');
  return `${code}-${datePart}-${seq}`;
}

module.exports = { generateOrderToken };
