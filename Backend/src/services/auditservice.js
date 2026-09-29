const { v4: uuidv4 } = require('uuid');
const AuditLog = require('../models/AuditLog');

async function createAuditEvent({ req, action, resourceType, resourceId = null, status = 'SUCCESS', before, after, metadata, description, companyId, actorId }) {
  return AuditLog.create({
    eventId: `EVT-${uuidv4()}`,
    companyId: companyId !== undefined ? companyId : (req?.user?.companyId || null),
    actorId: actorId !== undefined ? actorId : (req?.user?._id || null),
    action, resourceType, resourceId, status,
    ipAddress: req?.ip,
    userAgent: req?.headers?.['user-agent'],
    before, after, metadata, description
  });
}

module.exports = { createAuditEvent };