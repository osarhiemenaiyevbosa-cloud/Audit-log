const router = require('express').Router();
const { body, param, query } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const validate = require('../middleware/validate');
const { PERMISSIONS } = require('../utils/constants');
const { listAssets, createAsset, updateAsset } = require('../controllers/assetController');

router.use(protect, requirePermission(PERMISSIONS.MANAGE_ASSETS));

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('companyId').optional().isMongoId(),
    query('status').optional().isIn(['ACTIVE', 'MAINTENANCE', 'RETIRED'])
  ],
  validate,
  listAssets
);

router.post(
  '/',
  [
    body('name').trim().notEmpty().isLength({ max: 150 }),
    body('category').trim().notEmpty().isLength({ max: 80 }),
    body('assetTag').optional().trim().isLength({ max: 80 }),
    body('serialNumber').optional().trim().isLength({ max: 120 }),
    body('location').optional().trim().isLength({ max: 160 }),
    body('description').optional().trim().isLength({ max: 2000 }),
    body('status').optional().isIn(['ACTIVE', 'MAINTENANCE', 'RETIRED']),
    body('companyId').optional().isMongoId()
  ],
  validate,
  createAsset
);

router.patch(
  '/:id',
  [
    param('id').isMongoId(),
    body('name').optional().trim().notEmpty().isLength({ max: 150 }),
    body('category').optional().trim().notEmpty().isLength({ max: 80 }),
    body('assetTag').optional().trim().isLength({ max: 80 }),
    body('serialNumber').optional().trim().isLength({ max: 120 }),
    body('location').optional().trim().isLength({ max: 160 }),
    body('description').optional().trim().isLength({ max: 2000 }),
    body('status').optional().isIn(['ACTIVE', 'MAINTENANCE', 'RETIRED'])
  ],
  validate,
  updateAsset
);

module.exports = router;
