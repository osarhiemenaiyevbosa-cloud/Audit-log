const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { createAuditEvent } = require('../services/auditService');
const { sendEmail } = require('../services/emailService');

async function listUsers(req, res, next) {
  try {
    const filter =
      req.user.role === 'SYSTEM_ADMIN'
        ? {}
        : { companyId: req.user.companyId };

    const users = await User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users
    });
  } catch (e) {
    next(e);
  }
}

async function createUser(req, res, next) {
  try {
    const companyId =
      req.user.role === 'SYSTEM_ADMIN'
        ? req.body.companyId
        : req.user.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'companyId is required'
      });
    }

    const {
      name,
      email,
      password,
      role = 'USER'
    } = req.body;

    if (await User.findOne({ email })) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    if (
      req.user.role !== 'SYSTEM_ADMIN' &&
      ['SYSTEM_ADMIN', 'COMPANY_ADMIN'].includes(role)
    ) {
      return res.status(403).json({
        success: false,
        message: 'You cannot assign this role'
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      companyId,
      name,
      email,
      passwordHash,
      role
    });

    await createAuditEvent({
      req,
      action: 'USER_CREATE',
      resourceType: 'User',
      resourceId: user._id.toString(),
      companyId,
      after: {
        role,
        email
      },
      description: 'User created'
    });

    await sendEmail({
      to: email,
      subject: 'Audit Log account created',
      text: `An account was created for you. Your role is ${role}.`
    });

    res.status(201).json({
      success: true,
      data: user.toSafeJSON()
    });
  } catch (e) {
    next(e);
  }
}

async function updateRole(req, res, next) {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (
      req.user.role !== 'SYSTEM_ADMIN' &&
      user.companyId?.toString() !==
        req.user.companyId?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Company isolation rule blocked this request'
      });
    }

    const before = user.role;

    user.role = req.body.role;

    await user.save();

    await createAuditEvent({
      req,
      action: 'ROLE_CHANGE',
      resourceType: 'User',
      resourceId: user._id.toString(),
      companyId: user.companyId,
      before: {
        role: before
      },
      after: {
        role: user.role
      },
      description: 'User role changed'
    });

    await sendEmail({
      to: user.email,
      subject: 'Your role has changed',
      text: `Your role is now ${user.role}.`
    });

    res.json({
      success: true,
      data: user.toSafeJSON()
    });
  } catch (e) {
    next(e);
  }
}

async function updateStatus(req, res, next) {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (
      req.user.role !== 'SYSTEM_ADMIN' &&
      user.companyId?.toString() !==
        req.user.companyId?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Company isolation rule blocked this request'
      });
    }

    const before = user.status;

    user.status = req.body.status;

    await user.save();

    await createAuditEvent({
      req,
      action: 'USER_STATUS_CHANGE',
      resourceType: 'User',
      resourceId: user._id.toString(),
      companyId: user.companyId,
      before: {
        status: before
      },
      after: {
        status: user.status
      },
      description: 'User status changed'
    });

    res.json({
      success: true,
      data: user.toSafeJSON()
    });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listUsers,
  createUser,
  updateRole,
  updateStatus
};