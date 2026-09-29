const AuditLog = require('../models/audit');
const User = require('../models/User');
const { notifyAdmins } = require('./services/emailService');

async function writeAuditLog({ action, entityType, entityId, actor, metadata, request }) {
  const auditLog = await AuditLog.create({
    action,
    entityType,
    entityId,
    actor,
    metadata,
    ipAddress: request?.ip,
    userAgent: request?.get('user-agent'),
  });

  const actorUser = await User.findById(actor).select('name email');
  try {
    await notifyAdmins({ action, entityType, entityId, actor: actorUser, metadata });
  } catch (error) {
    console.error('Audit notification email failed:', error.message);
  }

  return auditLog;
}

module.exports = { writeAuditLog };