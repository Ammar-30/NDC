const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { scopeBranch } = require('../middleware/scopeBranch');
const ctrl = require('../controllers/ordersController');

router.use(authenticate, scopeBranch);

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/:id/whatsapp', ctrl.whatsapp);
router.get('/:id', ctrl.getById);
router.put('/:id/status', ctrl.updateStatus);

module.exports = router;
