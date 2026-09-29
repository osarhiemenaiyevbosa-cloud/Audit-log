const express = require('express');
const { listAuditLogs } = require('../controllers/audit.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.get('/', authenticate, requireAdmin, listAuditLogs);

module.exports = router;