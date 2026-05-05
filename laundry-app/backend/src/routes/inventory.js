const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { scopeBranch } = require('../middleware/scopeBranch');
const ctrl = require('../controllers/inventoryController');

router.use(authenticate, scopeBranch);

router.get('/low-stock', ctrl.lowStock);
router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);

module.exports = router;
