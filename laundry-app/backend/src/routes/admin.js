const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/scopeBranch');
const ctrl = require('../controllers/adminController');

router.use(authenticate, requireSuperAdmin);

router.get('/stats',          ctrl.getStats);

router.get('/owners',         ctrl.listOwners);
router.post('/owners',        ctrl.createOwner);
router.put('/owners/:id',     ctrl.updateOwner);

router.get('/branches',       ctrl.listBranches);
router.post('/branches',      ctrl.createBranch);
router.put('/branches/:id',   ctrl.updateBranch);

router.get('/users',          ctrl.listUsers);
router.post('/users',         ctrl.createUser);
router.put('/users/:id',      ctrl.updateUser);
router.delete('/users/:id',   ctrl.deleteUser);

router.get('/admins',         ctrl.listAdmins);
router.post('/admins',        ctrl.createAdmin);
router.put('/admins/:id',     ctrl.updateAdmin);

router.get('/activity-logs',  ctrl.getActivityLogs);

module.exports = router;
