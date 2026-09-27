/**
 * NOTE ON DEPENDENCIES (read before running):
 * This controller expects three files that belong to other teammates and
 * do not exist in the repo yet:
 *   - Backend/Middleware/authMiddleware.js      -> exports { protect }
 *   - Backend/Middleware/permissionMiddleware.js -> exports { requirePermission }
 *   - Backend/Middleware/validate.js             -> exports a validation-result handler
 *   - Backend/Utils/constants.js                 -> exports { PERMISSIONS }
 *   - Backend/Services/auditService.js           -> exports { createAuditEvent }
 * Until those land, `noticeRoutes.js` will throw on require(). See
 * Backend/Docs/FRANZOR-DOCUMENTATION.md for the full picture.
 */
const Notice = require('../models/Notice');
const { createAuditEvent } = require('../Services/auditService');

// GET /api/notices
// Public "what's live right now" feed for the notice board / dashboard.
async function listNotices(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const filter = Notice.activeFilter();

    const [data, total] = await Promise.all([
      Notice.find(filter)
        .populate('createdBy', 'name email')
        .sort({ publishedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notice.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    next(e);
  }
}

// GET /api/notices/manage  (PUBLISH_NOTICE only)
// Admin view: every notice regardless of status, optionally filtered by ?status=
async function listAllNotices(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [data, total] = await Promise.all([
      Notice.find(filter)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notice.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    next(e);
  }
}

// GET /api/notices/:id
async function getNotice(req, res, next) {
  try {
    const notice = await Notice.findById(req.params.id).populate('createdBy', 'name email');
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }
    res.json({ success: true, data: notice });
  } catch (e) {
    next(e);
  }
}

// POST /api/notices  (PUBLISH_NOTICE only)
async function createNotice(req, res, next) {
  try {
    const { title, body, status = 'DRAFT', expiresAt } = req.body;

    const notice = await Notice.create({
      title,
      body,
      status,
      createdBy: req.user._id,
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
      expiresAt: expiresAt || null,
    });

    await createAuditEvent({
      req,
      action: 'NOTICE_CREATE',
      resourceType: 'Notice',
      resourceId: notice._id.toString(),
      after: notice.toObject(),
    });

    res.status(201).json({ success: true, data: notice });
  } catch (e) {
    next(e);
  }
}

// PATCH /api/notices/:id  (PUBLISH_NOTICE only)
async function updateNotice(req, res, next) {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    const before = notice.toObject();
    const { title, body, status, expiresAt } = req.body;

    if (title !== undefined) notice.title = title;
    if (body !== undefined) notice.body = body;
    if (expiresAt !== undefined) notice.expiresAt = expiresAt;

    if (status !== undefined && status !== notice.status) {
      notice.status = status;
      if (status === 'PUBLISHED' && !notice.publishedAt) {
        notice.publishedAt = new Date();
      }
    }

    await notice.save();

    await createAuditEvent({
      req,
      action: 'NOTICE_UPDATE',
      resourceType: 'Notice',
      resourceId: notice._id.toString(),
      before,
      after: notice.toObject(),
    });

    res.json({ success: true, data: notice });
  } catch (e) {
    next(e);
  }
}

// PATCH /api/notices/:id/archive  (PUBLISH_NOTICE only)
async function archiveNotice(req, res, next) {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    const before = notice.toObject();
    notice.status = 'ARCHIVED';
    await notice.save();

    await createAuditEvent({
      req,
      action: 'NOTICE_ARCHIVE',
      resourceType: 'Notice',
      resourceId: notice._id.toString(),
      before,
      after: notice.toObject(),
    });

    res.json({ success: true, data: notice });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listNotices,
  listAllNotices,
  getNotice,
  createNotice,
  updateNotice,
  archiveNotice,
};
