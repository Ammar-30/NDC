const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { scopeBranch } = require('../middleware/scopeBranch');
const ctrl = require('../controllers/customersController');

router.use(authenticate, scopeBranch);

router.get('/', ctrl.list);
router.get('/search', ctrl.search);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);

module.exports = router;
