const express = require('express');
const { authenticate } = require('../middleware/auth');
const { scopeBranch } = require('../middleware/scopeBranch');
const { getStore } = require('../config/syncStore');
const { processDoc } = require('../workers/syncWorker');

const router = express.Router();

router.use(authenticate, scopeBranch);

// Enforce that staff only access their own branch database.
// db param is the full database name, e.g. "branch_abc123".
function checkDbScope(req, res, next) {
  const { db } = req.params;
  const { scope } = req;
  if (scope.type === 'branch' && db !== `branch_${scope.branchId}`) {
    return res.status(403).json({ error: 'forbidden', reason: 'Access denied to this database' });
  }
  next();
}

// ─── Database info ────────────────────────────────────────────────────────────
router.get('/:db', checkDbScope, (req, res) => {
  const store = getStore(req.params.db);
  res.json({
    db_name: req.params.db,
    update_seq: store.seq,
    doc_count: store.docs.size,
    disk_size: 0,
    instance_start_time: String(Date.now()),
    couchdb: 'Welcome',
    version: '2.3.1',
  });
});

// ─── Changes feed ─────────────────────────────────────────────────────────────
// PouchDB calls this to learn what the server already has before pushing.
router.get('/:db/_changes', checkDbScope, (req, res) => {
  const store = getStore(req.params.db);
  const since = parseInt(req.query.since, 10) || 0;
  const limit = parseInt(req.query.limit, 10) || 25;
  const includeDocs = req.query.include_docs === 'true';

  // long-poll / continuous — just return immediately (PouchDB retries with retry:true)
  const results = [];
  let count = 0;
  for (const [seq, id] of store.sequences) {
    if (seq <= since) continue;
    if (count++ >= limit) break;
    const doc = store.docs.get(id);
    if (!doc) continue;
    const entry = { seq, id: doc._id, changes: [{ rev: doc._rev }] };
    if (doc._deleted) entry.deleted = true;
    if (includeDocs) entry.doc = doc;
    results.push(entry);
  }

  res.json({ results, last_seq: store.seq });
});

// ─── Local checkpoint docs ────────────────────────────────────────────────────
router.get('/:db/_local/:id', checkDbScope, (req, res) => {
  const store = getStore(req.params.db);
  const key = `_local/${req.params.id}`;
  const doc = store.locals.get(key);
  if (!doc) return res.status(404).json({ error: 'not_found', reason: 'missing' });
  res.json(doc);
});

router.put('/:db/_local/:id', checkDbScope, (req, res) => {
  const store = getStore(req.params.db);
  const key = `_local/${req.params.id}`;
  const doc = { ...req.body, _id: key, _rev: '0-1' };
  store.locals.set(key, doc);
  res.json({ ok: true, id: key, rev: '0-1' });
});

router.delete('/:db/_local/:id', checkDbScope, (req, res) => {
  const store = getStore(req.params.db);
  store.locals.delete(`_local/${req.params.id}`);
  res.json({ ok: true });
});

// ─── Revision diff ────────────────────────────────────────────────────────────
// PouchDB sends { docId: [rev, rev, ...] } and expects { docId: { missing: [rev] } }
router.post('/:db/_revs_diff', checkDbScope, (req, res) => {
  const store = getStore(req.params.db);
  const result = {};
  for (const [id, revs] of Object.entries(req.body)) {
    const existing = store.docs.get(id);
    const existingRevs = existing ? [existing._rev] : [];
    const missing = revs.filter(r => !existingRevs.includes(r));
    if (missing.length) result[id] = { missing };
  }
  res.json(result);
});

// ─── Bulk docs (the heart of push replication) ────────────────────────────────
router.post('/:db/_bulk_docs', checkDbScope, async (req, res) => {
  const store = getStore(req.params.db);
  const docs = req.body.docs || [];
  const branchId = req.scope.branchId;
  const results = [];

  for (const doc of docs) {
    if (!doc._id) {
      results.push({ error: 'bad_request', reason: 'missing _id' });
      continue;
    }
    store.seq++;
    store.docs.set(doc._id, doc);
    store.sequences.set(store.seq, doc._id);
    results.push({ ok: true, id: doc._id, rev: doc._rev });

    if (!doc._deleted) {
      processDoc(doc, branchId).catch(err =>
        console.error(`[syncWorker] processDoc ${doc._id}:`, err.message)
      );
    }
  }

  res.json(results);
});

// ─── Bulk get (needed for pull replication) ───────────────────────────────────
router.post('/:db/_bulk_get', checkDbScope, (req, res) => {
  const store = getStore(req.params.db);
  const results = (req.body.docs || []).map(({ id, rev }) => {
    const doc = store.docs.get(id);
    if (!doc) {
      return { id, docs: [{ error: { error: 'not_found', reason: 'missing', id, rev } }] };
    }
    return { id, docs: [{ ok: doc }] };
  });
  res.json({ results });
});

// ─── Single doc (fallback fetch) ──────────────────────────────────────────────
router.get('/:db/:id', checkDbScope, (req, res) => {
  const store = getStore(req.params.db);
  const doc = store.docs.get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'not_found', reason: 'missing' });
  res.json(doc);
});

module.exports = router;
