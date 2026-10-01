const router = require('express').Router();
const { body, param } = require('express-validator');

const {
  listUsers,
  createUser,
  updateRole,
  updateStatus
} = require('../controllers/userController');

const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const validate = require('../middleware/validate');
const { PERMISSIONS } = require('../utils/constants');

router.use(protect, requirePermission(PERMISSIONS.MANAGE_USERS));

router.get('/', listUsers);

router.post(
  '/',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('role')
      .optional()
      .isIn([
        'SYSTEM_ADMIN',
        'COMPANY_ADMIN',
        'AUDITOR',
        'USER',
        'VIEWER'
      ])
  ],
  validate,
  createUser
);

router.patch(
  '/:id/role',
  [
    param('id').isMongoId(),
    body('role').isIn([
      'SYSTEM_ADMIN',
      'COMPANY_ADMIN',
      'AUDITOR',
      'USER',
      'VIEWER'
    ])
  ],
  validate,
  updateRole
);

router.patch(
  '/:id/status',
  [
    param('id').isMongoId(),
    body('status').isIn(['ACTIVE', 'INACTIVE'])
  ],
  validate,
  updateStatus
);

module.exports = router;