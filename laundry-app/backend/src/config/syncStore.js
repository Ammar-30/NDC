// In-memory CouchDB-compatible document store, one namespace per PouchDB database.
// Documents are ephemeral — PostgreSQL is the source of truth.
// On server restart the store is empty; PouchDB clients re-push all local docs,
// and ON CONFLICT DO UPDATE in the syncWorker handles duplicates safely.

const stores = new Map();

function getStore(dbName) {
  if (!stores.has(dbName)) {
    stores.set(dbName, {
      docs: new Map(),      // _id → doc
      locals: new Map(),    // _local/id → checkpoint doc
      sequences: new Map(), // seq (int) → _id
      seq: 0,
    });
  }
  return stores.get(dbName);
}

module.exports = { getStore };
