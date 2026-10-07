const Company = require('../models/Company');
const User = require('../models/User');
const { createAuditEvent } = require('../services/auditservice');
const { sendEmail } = require('../services/emailService');

async function listCompanies(req, res, next) {
  try {
    const filter =
      req.user.role === 'SYSTEM_ADMIN'
        ? {}
        : { _id: req.user.companyId };

    const companies = await Company.find(filter)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: companies
    });
  } catch (e) {
    next(e);
  }
}

async function createCompany(req, res, next) {
  try {
    const {
      name,
      registrationNumber,
      email,
      phone,
      address,
      industry
    } = req.body;

    const company = await Company.create({
      name,
      registrationNumber,
      email,
      phone,
      address,
      industry,
      status:
        req.user.role === 'SYSTEM_ADMIN'
          ? 'APPROVED'
          : 'PENDING'
    });

    await createAuditEvent({
      req,
      action: 'COMPANY_CREATE',
      resourceType: 'Company',
      resourceId: company._id.toString(),
      companyId: company._id,
      description: 'Company created'
    });

    res.status(201).json({
      success: true,
      data: company
    });
  } catch (e) {
    next(e);
  }
}

async function updateStatus(req, res, next) {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const before = company.status;

    company.status = req.body.status;

    await company.save();

    await createAuditEvent({
      req,
      action: 'COMPANY_STATUS_CHANGE',
      resourceType: 'Company',
      resourceId: company._id.toString(),
      companyId: company._id,
      before: { status: before },
      after: { status: company.status },
      description: 'Company status changed'
    });

    await sendEmail({
      to: company.email,
      subject: 'Company status updated',
      text: `Your company status is now ${company.status}.`
    });

    res.json({
      success: true,
      data: company
    });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listCompanies,
  createCompany,
  updateStatus
};