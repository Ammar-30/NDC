const { randomUUID } = require('crypto');

async function logActivity(pool, actor, action, entityType, entityId, details, ip) {
  try {
    await pool.query(
      `INSERT INTO activity_logs (id, actor_id, actor_name, actor_role, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        randomUUID(),
        actor?.userId || null,
        actor?.name || null,
        actor?.role || null,
        action,
        entityType || null,
        entityId || null,
        details ? JSON.stringify(details) : null,
        ip || null,
      ]
    );
  } catch {
    // never crash the caller
  }
}

module.exports = { logActivity };
