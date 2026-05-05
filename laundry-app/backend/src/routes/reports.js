const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireOwner } = require('../middleware/scopeBranch');
const ctrl = require('../controllers/reportsController');

router.use(authenticate, requireOwner);

router.get('/daily', ctrl.daily);
router.get('/branches', ctrl.branches);
router.get('/orders', ctrl.orders);

module.exports = router;
