const Company = require('../models/Company');
const User = require('../models/User');
const { createAuditEvent } = require('../services/auditService');
const { sendEmail } = require('../services/emailService');
async function listCompanies(req, res, next) {
  try {
    const filter = req.user.role === 'SYSTEM_ADMIN' ? {} : { _id: req.user.companyId };
    const companies = await Company.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: companies });
  } catch (e) { next(e); }
}
async function createCompany(req, res, next) {
  try {
    const { name, registrationNumber, email, phone, address, industry } = req.body;
    const company = await Company.create({ name, registrationNumber, email, phone, address, industry, status: req.user.role === 'SYSTEM_ADMIN' ? 'APPROVED' : 'PENDING' });
    await createAuditEvent({ req, action: 'COMPANY_CREATE', resourceType: 'Company', resourceId: company._id.toString(), companyId: company._id, description: 'Company created' });
    res.status(201).json({ success: true, data: company });
  } catch (e) { next(e); }
}
async function updateStatus(req, res, next) {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    const before = company.status; company.status = req.body.status; await company.save();
    await createAuditEvent({ req, action: `COMPANY_${req.body.status}`, resourceType: 'Company', resourceId: company._id.toString(), companyId: company._id, before: { status: before }, after: { status: company.status }, description: `Company status changed to ${company.status}` });
    const admins = await User.find({ companyId: company._id, role: 'COMPANY_ADMIN' });
    for (const admin of admins) await sendEmail({ to: admin.email, subject: `Company status: ${company.status}`, text: `Your company ${company.name} is now ${company.status}.` });
    res.json({ success: true, data: company });
  } catch (e) { next(e); }
}
module.exports = { listCompanies, createCompany, updateStatus };