const router = require('express').Router();
const { body, param } = require('express-validator');
const { submit, list, detail, updateStatus } = require('../controllers/whistleblowercontroller');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const { PERMISSIONS } = require('../utils/constants');

router.post(
  '/reports',
  protect,
  [
    body('content').trim().isLength({ min: 10, max: 10000 }),
    body('category').optional().isString().trim().isLength({ min: 2, max: 100 }),
    validate,
  ],
  submit
);

router.get(
  '/reports',
  protect,
  requirePermission(PERMISSIONS.VIEW_WHISTLEBLOWER),
  list
);

router.get(
  '/reports/:id',
  protect,
  requirePermission(PERMISSIONS.VIEW_WHISTLEBLOWER),
  detail
);

router.patch(
  '/reports/:id',
  protect,
  requirePermission(PERMISSIONS.VIEW_WHISTLEBLOWER),
  [param('id').isMongoId(), validate],
  updateStatus
);

module.exports = router;