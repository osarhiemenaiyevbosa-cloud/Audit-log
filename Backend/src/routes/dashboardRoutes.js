const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const { PERMISSIONS } = require('../utils/constants');
const { summary } = require('../controllers/dashboardController');

router.get(
  '/summary',
  protect,
  requirePermission(PERMISSIONS.VIEW_DASHBOARD),
  summary
);

module.exports = router;