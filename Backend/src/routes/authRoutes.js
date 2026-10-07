const router = require('express').Router();
const { body } = require('express-validator');
const {
  register,
  login,
  me,
  updateProfile,
  logout
} = require('../controllers/authController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/authMiddleware');

router.post(
  '/register',
  [
    body('companyName').trim().notEmpty(),
    body('registrationNumber').trim().notEmpty(),
    body('companyEmail').isEmail(),
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 })
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  validate,
  login
);

router.get('/me', protect, me);
router.patch(
  '/me',
  protect,
  [
    body('name').trim().notEmpty(),
    body('phone').optional().isString().trim().isLength({ max: 30 })
  ],
  validate,
  updateProfile
);
router.post('/logout', protect, logout);

module.exports = router;