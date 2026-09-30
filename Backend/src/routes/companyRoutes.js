const router = require('express').Router();
const { body, param } = require('express-validator');

const {
  listCompanies,
  createCompany,
  updateStatus
} = require('../controllers/companyController');

const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const validate = require('../middleware/validate');
const { PERMISSIONS } = require('../utils/constants');

router.use(protect);

router.get(
  '/',
  requirePermission(PERMISSIONS.MANAGE_COMPANIES),
  listCompanies
);

router.post(
  '/',
  requirePermission(PERMISSIONS.MANAGE_COMPANIES),
  [
    body('name').trim().notEmpty(),
    body('registrationNumber').trim().notEmpty(),
    body('email').isEmail()
  ],
  validate,
  createCompany
);

router.patch(
  '/:id/status',
  requirePermission(PERMISSIONS.MANAGE_COMPANIES),
  [
    param('id').isMongoId(),
    body('status').isIn([
      'APPROVED',
      'REJECTED',
      'SUSPENDED',
      'PENDING'
    ])
  ],
  validate,
  updateStatus
);

module.exports = router;