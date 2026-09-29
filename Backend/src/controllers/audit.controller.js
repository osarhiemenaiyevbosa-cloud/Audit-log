const AuditLog = require('../models/AuditLog');

async function listAuditLogs(req, res, next) {
  try {
    const { action, entityType, entityId, actor, from, to, page = 1, limit = 25 } = req.query;
    const query = {};
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = entityId;
    if (actor) query.actor = actor;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.min(Math.max(Number(limit), 1), 100);
    const [logs, total] = await Promise.all([
      AuditLog.find(query).populate('actor', 'name email role').sort({ createdAt: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize),
      AuditLog.countDocuments(query),
    ]);

    res.json({ data: logs, pagination: { page: pageNumber, limit: pageSize, total, pages: Math.ceil(total / pageSize) } });
  } catch (error) {
    next(error);
  }
}

module.exports = { listAuditLogs };