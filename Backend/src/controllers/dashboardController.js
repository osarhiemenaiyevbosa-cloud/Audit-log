const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const Company = require('../models/Company');
const WhistleblowerReport = require('../models/WhistleblowerReport');
const Asset = require('../models/Asset');
async function summary(req, res, next) {
  try {
    const companyFilter = req.user.role === 'SYSTEM_ADMIN' ? {} : { companyId: req.user.companyId };
    const userFilter = req.user.role === 'SYSTEM_ADMIN' ? {} : { companyId: req.user.companyId };
    const [audits, users, companies, assets, whistleblowers, recentActivity] = await Promise.all([
      req.user.role === 'SYSTEM_ADMIN' ? AuditLog.countDocuments({}) : Promise.resolve(null),
      User.countDocuments(userFilter),
      req.user.role === 'SYSTEM_ADMIN' ? Company.countDocuments({}) : Company.countDocuments({ _id: req.user.companyId }),
      Asset.countDocuments(companyFilter),
      req.user.role === 'SYSTEM_ADMIN' ? WhistleblowerReport.countDocuments({ status: 'NEW' }) : 0,
      req.user.role === 'SYSTEM_ADMIN'
        ? AuditLog.find({}).populate('actorId', 'name email').sort({ timestamp: -1 }).limit(10)
        : Promise.resolve([])
    ]);
    const data = { users, companies, assets, newWhistleblowerReports: whistleblowers };
    if (req.user.role === 'SYSTEM_ADMIN') {
      data.auditEvents = audits;
      data.recentActivity = recentActivity;
    }
    res.json({ success: true, data });
  } catch (e) { next(e); }
}
module.exports = { summary };