const router = require('express').Router();
const { param } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { list, markRead, markAllRead } = require('../controllers/notificationController');

router.use(protect);

router.get('/', list);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', param('id').isMongoId(), validate, markRead);

module.exports = router;
