const router = require('express').Router();

router.use('/auth', require('./authRoutes'));
router.use('/companies', require('./companyRoutes'));
router.use('/assets', require('./assetRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/audit-logs', require('./auditroutes'));
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/notices', require('./noticeRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/whistleblower', require('./whistleblowerroutes'));

module.exports = router;