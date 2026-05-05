const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireOwner } = require('../middleware/scopeBranch');
const ctrl = require('../controllers/priceListController');

router.get('/', ctrl.list);
router.get('/all', authenticate, requireOwner, ctrl.listAll);
router.post('/', authenticate, requireOwner, ctrl.create);
router.put('/:id', authenticate, requireOwner, ctrl.update);
router.put('/:id/toggle', authenticate, requireOwner, ctrl.toggle);
router.delete('/:id', authenticate, requireOwner, ctrl.remove);

module.exports = router;
