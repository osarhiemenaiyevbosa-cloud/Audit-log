const crypto = require('crypto');
const WhistleblowerReport = require('../models/WhistleblowerReport');
const { encrypt, decrypt } = require('../utils/crypto');
const { createAuditEvent } = require('../services/auditService');

async function submit(req, res, next) {
    try {
        const referenceCode = `WB-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
        const report = await WhistleblowerReport.create({
            referenceCode,
            encryptedContent: encrypt(req.body.content)
        });

        res.status(201).json({
            success: true,
            message: 'Report submitted successfully',
            referenceCode: report.referenceCode
        });
    } catch (e) {
        next(e);
    }
}

async function list(req, res, next) {
    try {
        const reports = await WhistleblowerReport.find()
            .select('-encryptedContent')
            .populate('assignedTo', 'name email');

        res.status(200).json({ success: true, data: reports });
    } catch (e) {
        next(e);
    }
}

async function detail(req, res, next) {
    try {
        const report = await WhistleblowerReport.findById(req.params.id).populate('assignedTo', 'name email');
        if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

        await createAuditEvent({
            req,
            action: 'WHISTLEBLOWER_VIEW',
            resourceType: 'WhistleblowerReport',
            resourceId: report._id
        });

        res.json({
            success: true,
            data: { ...report.toObject(), content: decrypt(report.encryptedContent) }
        });
    } catch (e) {
        next(e);
    }
}

async function updateStatus(req, res, next) {
    try {
        const report = await WhistleblowerReport.findById(req.params.id);
        if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

        const before = report.status;
        report.status = req.body.status;
        report.assignedTo = req.body.assignedTo || report.assignedTo;

        await report.save();

        await createAuditEvent({
            req,
            action: 'WHISTLEBLOWER_STATUS_CHANGE',
            resourceType: 'WhistleblowerReport',
            resourceId: report._id,
            details: { from: before, to: report.status }
        });

        res.json({
            success: true,
            data: {
                id: report._id,
                referenceCode: report.referenceCode,
                status: report.status
            }
        });
    } catch (e) {
        next(e);
    }
}

module.exports = { submit, list, detail, updateStatus };