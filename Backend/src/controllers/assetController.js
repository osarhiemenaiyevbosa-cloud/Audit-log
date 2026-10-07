const Asset = require('../models/Asset');
const { createAuditEvent } = require('../services/auditService');

function companyScope(req) {
  if (req.user.role === 'SYSTEM_ADMIN') {
    return req.query.companyId ? { companyId: req.query.companyId } : {};
  }

  return { companyId: req.user.companyId };
}

async function listAssets(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 100);
    const filter = companyScope(req);

    if (req.query.search) {
      const escapedSearch = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const search = new RegExp(escapedSearch, 'i');
      filter.$or = [
        { name: search },
        { category: search },
        { assetTag: search },
        { serialNumber: search },
        { location: search }
      ];
    }

    if (req.query.status) filter.status = req.query.status;

    const [data, total] = await Promise.all([
      Asset.find(filter)
        .populate('companyId', 'name')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Asset.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
}

async function createAsset(req, res, next) {
  try {
    const companyId = req.user.role === 'SYSTEM_ADMIN'
      ? req.body.companyId
      : req.user.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'A company is required to register this asset'
      });
    }

    const asset = await Asset.create({
      ...req.body,
      companyId,
      createdBy: req.user._id
    });

    await createAuditEvent({
      req,
      action: 'ASSET_CREATE',
      resourceType: 'Asset',
      resourceId: asset._id.toString(),
      companyId,
      after: asset.toObject(),
      description: `Company asset registered: ${asset.name}`
    });

    res.status(201).json({ success: true, data: asset });
  } catch (error) {
    next(error);
  }
}

async function updateAsset(req, res, next) {
  try {
    const asset = await Asset.findOne({
      _id: req.params.id,
      ...companyScope(req)
    });

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    const before = asset.toObject();
    for (const field of ['name', 'category', 'assetTag', 'serialNumber', 'location', 'description', 'status']) {
      if (req.body[field] !== undefined) asset[field] = req.body[field];
    }
    await asset.save();

    await createAuditEvent({
      req,
      action: 'ASSET_UPDATE',
      resourceType: 'Asset',
      resourceId: asset._id.toString(),
      companyId: asset.companyId,
      before,
      after: asset.toObject(),
      description: `Company asset updated: ${asset.name}`
    });

    res.json({ success: true, data: asset });
  } catch (error) {
    next(error);
  }
}

module.exports = { listAssets, createAsset, updateAsset };
