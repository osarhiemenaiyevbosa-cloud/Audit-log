const router = require('express').Router();
const { body, param } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const validate = require('../middleware/validate');
const { PERMISSIONS } = require('../utils/constants');
const {
  listNotices,
  listAllNotices,
  getNotice,
  createNotice,
  updateNotice,
  archiveNotice,
} = require('../controllers/noticeController');

router.use(protect);

// Order matters: /manage must be registered before /:id or Express will
// treat "manage" as an :id value.
router.get('/manage', requirePermission(PERMISSIONS.PUBLISH_NOTICE), listAllNotices);
router.get('/', listNotices);
router.get('/:id', param('id').isMongoId(), validate, getNotice);

router.post(
  '/',
  requirePermission(PERMISSIONS.PUBLISH_NOTICE),
  [
    body('title').trim().notEmpty().withMessage('title is required'),
    body('body').trim().notEmpty().withMessage('body is required'),
    body('status').optional().isIn(['DRAFT', 'PUBLISHED']),
    body('expiresAt').optional().isISO8601(),
  ],
  validate,
  createNotice
);

router.patch(
  '/:id',
  requirePermission(PERMISSIONS.PUBLISH_NOTICE),
  [
    param('id').isMongoId(),
    body('status').optional().isIn(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
    body('expiresAt').optional().isISO8601(),
  ],
  validate,
  updateNotice
);

router.patch(
  '/:id/archive',
  requirePermission(PERMISSIONS.PUBLISH_NOTICE),
  param('id').isMongoId(),
  validate,
  archiveNotice
);

module.exports = router;
