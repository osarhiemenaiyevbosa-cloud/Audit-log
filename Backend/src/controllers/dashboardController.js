const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const Company = require('../models/Company');
const WhistleblowerReport = require('../models/WhistleblowerReport');
async function summary(req, res, next) {
  try {
    const companyFilter = req.user.role === 'SYSTEM_ADMIN' ? {} : { companyId: req.user.companyId };
    const userFilter = req.user.role === 'SYSTEM_ADMIN' ? {} : { companyId: req.user.companyId };
    const [audits, users, companies, whistleblowers, recentActivity] = await Promise.all([
      AuditLog.countDocuments(companyFilter),
      User.countDocuments(userFilter),
      req.user.role === 'SYSTEM_ADMIN' ? Company.countDocuments({}) : Company.countDocuments({ _id: req.user.companyId }),
      req.user.role === 'SYSTEM_ADMIN' ? WhistleblowerReport.countDocuments({ status: 'NEW' }) : 0,
      AuditLog.find(companyFilter).populate('actorId', 'name email').sort({ timestamp: -1 }).limit(10)
    ]);
    res.json({ success: true, data: { auditEvents: audits, users, companies, newWhistleblowerReports: whistleblowers, recentActivity } });
  } catch (e) { next(e); }
}
module.exports = { summary };